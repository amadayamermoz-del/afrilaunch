import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AccountStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { isPrismaErrorCode } from "../prisma/prisma-errors";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { projects: true, applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateUser(id: string, actingAdminId: string, input: UpdateUserDto) {
    if (
      id === actingAdminId &&
      ((input.role !== undefined && input.role !== UserRole.ADMIN) ||
        (input.status !== undefined && input.status !== AccountStatus.ACTIVE))
    ) {
      throw new BadRequestException(
        "You cannot demote or suspend your own account",
      );
    }
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id },
          select: { role: true, status: true },
        });
        if (!target) {
          throw new NotFoundException("User not found");
        }

        const isRemovingActiveAdmin =
          target.role === UserRole.ADMIN &&
          target.status === AccountStatus.ACTIVE &&
          ((input.role !== undefined && input.role !== UserRole.ADMIN) ||
            input.status === AccountStatus.SUSPENDED);
        if (
          isRemovingActiveAdmin &&
          (await transaction.user.count({
            where: { role: UserRole.ADMIN, status: AccountStatus.ACTIVE },
          })) <= 1
        ) {
          throw new BadRequestException(
            "At least one active administrator must remain",
          );
        }

        return transaction.user.update({
          where: { id },
          data: input,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2025")) {
        throw new NotFoundException("User not found");
      }
      throw error;
    }
  }
}
