import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ApplicationStatus, OpportunityStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { isPrismaErrorCode } from "../prisma/prisma-errors";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        opportunity: { include: { category: true } },
      },
      orderBy: { appliedAt: "desc" },
    });
  }

  listAdmin() {
    return this.prisma.application.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        opportunity: { select: { id: true, title: true, organization: true } },
      },
      orderBy: { appliedAt: "desc" },
    });
  }

  async apply(userId: string, opportunityId: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true, status: true, deadline: true },
    });
    if (
      !opportunity ||
      opportunity.status !== OpportunityStatus.PUBLISHED ||
      (opportunity.deadline !== null && opportunity.deadline <= new Date())
    ) {
      throw new NotFoundException("Open opportunity not found");
    }

    const existing = await this.prisma.application.findUnique({
      where: { userId_opportunityId: { userId, opportunityId } },
    });
    if (existing && existing.status !== ApplicationStatus.WITHDRAWN) {
      throw new ConflictException(
        "You have already applied to this opportunity",
      );
    }
    if (existing) {
      return this.prisma.application.update({
        where: { id: existing.id },
        data: { status: ApplicationStatus.PENDING, appliedAt: new Date() },
        include: { opportunity: true },
      });
    }

    try {
      return await this.prisma.application.create({
        data: { userId, opportunityId },
        include: { opportunity: true },
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2002")) {
        throw new ConflictException(
          "You have already applied to this opportunity",
        );
      }
      throw error;
    }
  }

  async withdraw(id: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });
    if (!application || application.userId !== userId) {
      throw new NotFoundException("Application not found");
    }
    if (
      application.status === ApplicationStatus.ACCEPTED ||
      application.status === ApplicationStatus.REJECTED
    ) {
      throw new BadRequestException(
        "A reviewed application cannot be withdrawn",
      );
    }
    return this.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.WITHDRAWN },
      include: { opportunity: true },
    });
  }

  async updateStatus(id: string, input: UpdateApplicationStatusDto) {
    if (
      input.status !== ApplicationStatus.UNDER_REVIEW &&
      input.status !== ApplicationStatus.ACCEPTED &&
      input.status !== ApplicationStatus.REJECTED
    ) {
      throw new BadRequestException(
        "Administrators can set under-review, accepted, or rejected status",
      );
    }
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.application.update({
          where: { id },
          data: { status: input.status },
          include: {
            user: { select: { id: true, name: true, email: true } },
            opportunity: {
              select: { id: true, title: true, organization: true },
            },
          },
        });
        await transaction.notification.create({
          data: {
            userId: updated.userId,
            type: "APPLICATION",
            title: "Candidature mise à jour",
            message: `Le statut de votre candidature à « ${updated.opportunity.title} » est maintenant ${input.status}.`,
          },
        });
        return updated;
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2025")) {
        throw new NotFoundException("Application not found");
      }
      throw error;
    }
  }
}
