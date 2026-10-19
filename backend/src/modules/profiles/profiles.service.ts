import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { isPrismaErrorCode } from "../prisma/prisma-errors";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profile: true,
      },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async update(userId: string, input: UpdateProfileDto) {
    const { name, email, ...profile } = input;
    try {
      return await this.prisma.$transaction(async (transaction) => {
        if (name !== undefined || email !== undefined) {
          await transaction.user.update({
            where: { id: userId },
            data: {
              ...(name !== undefined ? { name: name.trim() } : {}),
              ...(email !== undefined
                ? { email: email.trim().toLowerCase() }
                : {}),
            },
          });
        }

        const profileData = {
          ...profile,
          ...(profile.links !== undefined
            ? { links: profile.links as Prisma.InputJsonValue }
            : {}),
        };

        return transaction.profile.upsert({
          where: { userId },
          create: { userId, ...profileData },
          update: profileData,
        });
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2002")) {
        throw new ConflictException("This email address is already in use");
      }
      if (isPrismaErrorCode(error, "P2025")) {
        throw new NotFoundException("User not found");
      }
      throw error;
    }
  }
}
