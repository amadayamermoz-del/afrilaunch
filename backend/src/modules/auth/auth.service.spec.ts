import { AccountStatus, User, UserRole } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  it("registers with a password hash and returns only safe user fields", async () => {
    const state: { storedUser: User | null } = { storedUser: null };
    const prisma = {
      user: {
        findUnique: jest.fn(() => state.storedUser),
        create: jest.fn(({ data }: { data: Partial<User> }) => {
          state.storedUser = {
            id: "user-1",
            name: data.name!,
            email: data.email!,
            passwordHash: data.passwordHash!,
            role: UserRole.USER,
            status: AccountStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return state.storedUser;
        }),
      },
    } as unknown as PrismaService;
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("signed-token"),
    } as unknown as JwtService;
    const service = new AuthService(prisma, jwtService);

    const result = await service.register({
      name: "  Amina Diallo ",
      email: " AMINA@example.com ",
      password: "safe-password-123",
    });

    expect(result).toMatchObject({
      accessToken: "signed-token",
      tokenType: "Bearer",
      user: { id: "user-1", name: "Amina Diallo", email: "amina@example.com" },
    });
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(state.storedUser?.passwordHash).not.toBe("safe-password-123");
    expect(state.storedUser?.role).toBe(UserRole.USER);
  });

  it("rejects login for an unknown account", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new AuthService(prisma, {
      signAsync: jest.fn(),
    } as unknown as JwtService);

    await expect(
      service.login({ email: "missing@example.com", password: "pass" }),
    ).rejects.toThrow("Invalid email or password");
  });
});
