import "dotenv/config";
import { AccountStatus, PrismaClient, UserRole } from "@prisma/client";
import { isPrismaErrorCode } from "../modules/prisma/prisma-errors";

async function updateAdminEmail() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      "Usage: npm run admin:email:update -- new-address@example.com",
    );
  }

  const prisma = new PrismaClient();
  try {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, status: AccountStatus.ACTIVE },
      select: { id: true },
    });
    const admin = admins[0];
    if (admins.length !== 1 || !admin) {
      throw new Error(
        `Expected exactly one active administrator; found ${admins.length}. No changes were made.`,
      );
    }

    try {
      await prisma.user.update({
        where: { id: admin.id },
        data: { email },
        select: { id: true },
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2002")) {
        throw new Error("That email address is already in use.");
      }
      throw error;
    }
    console.log(`Administrator email updated to ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

void updateAdminEmail().catch((error: unknown) => {
  console.error("Could not update administrator email:", error);
  process.exitCode = 1;
});
