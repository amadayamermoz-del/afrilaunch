import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  MilestoneStatus,
  ProjectActivityType,
  ProjectPhase,
  ProjectStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { isPrismaErrorCode } from "../prisma/prisma-errors";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UpdateProjectStatusDto } from "./dto/update-project-status.dto";
import { CreateMilestoneDto } from "./dto/create-milestone.dto";
import { UpdateMilestoneDto } from "./dto/update-milestone.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

const PROJECT_PHASES = [
  ProjectPhase.IDEA,
  ProjectPhase.CONCEPT,
  ProjectPhase.VALIDATE,
  ProjectPhase.PROTOTYPE,
  ProjectPhase.MVP,
  ProjectPhase.PRE_LAUNCH,
  ProjectPhase.LAUNCH,
  ProjectPhase.POST_LAUNCH,
] as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(ownerId: string) {
    return this.prisma.project.findMany({
      where: { ownerId },
      include: {
        category: true,
        milestones: { orderBy: [{ phase: "asc" }, { dueDate: "asc" }] },
        tasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] },
        activities: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  listPublished() {
    return this.prisma.project.findMany({
      where: { status: ProjectStatus.PUBLISHED },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPublic(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, status: ProjectStatus.PUBLISHED },
      include: { category: true },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    return project;
  }

  listAdmin() {
    return this.prisma.project.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        category: true,
      },
      orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    });
  }

  async get(id: string, userId: string, role: UserRole) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        category: true,
        owner: { select: { id: true, name: true } },
        milestones: {
          include: {
            tasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] },
          },
          orderBy: [{ phase: "asc" }, { dueDate: "asc" }],
        },
        tasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] },
        activities: {
          take: 30,
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { id: true, name: true } } },
        },
      },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (project.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("You cannot access this project");
    }
    return project;
  }

  async create(ownerId: string, input: CreateProjectDto) {
    await this.assertActiveCategory(input.categoryId);
    return this.prisma.$transaction(async (transaction) => {
      const project = await transaction.project.create({
        data: {
          ...input,
          title: input.title.trim(),
          ownerId,
        },
        include: { category: true },
      });
      await transaction.projectActivity.create({
        data: {
          projectId: project.id,
          actorId: ownerId,
          type: ProjectActivityType.PROJECT_CREATED,
          message: "Projet créé",
        },
      });
      return project;
    });
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    input: UpdateProjectDto,
  ) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (project.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("You cannot edit this project");
    }
    if (
      role !== UserRole.ADMIN &&
      project.status !== ProjectStatus.DRAFT &&
      project.status !== ProjectStatus.REJECTED
    ) {
      throw new ForbiddenException(
        "Only draft or rejected projects can be edited",
      );
    }
    await this.assertActiveCategory(input.categoryId);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.project.update({
          where: { id },
          data: {
            ...input,
            ...(input.title !== undefined ? { title: input.title.trim() } : {}),
            ...(role === UserRole.ADMIN &&
            project.status === ProjectStatus.REJECTED
              ? { status: ProjectStatus.DRAFT }
              : {}),
          },
          include: { category: true },
        });
        await transaction.projectActivity.create({
          data: {
            projectId: updated.id,
            actorId: userId,
            type: ProjectActivityType.PROJECT_UPDATED,
            message: "Informations du projet mises à jour",
          },
        });
        return updated;
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2025")) {
        throw new NotFoundException("Project not found");
      }
      throw error;
    }
  }

  async submit(id: string, ownerId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (project.ownerId !== ownerId) {
      throw new ForbiddenException("You cannot submit this project");
    }
    if (
      project.status !== ProjectStatus.DRAFT &&
      project.status !== ProjectStatus.REJECTED
    ) {
      throw new ForbiddenException(
        "Only draft or rejected projects can be submitted",
      );
    }
    return this.prisma.$transaction(async (transaction) => {
      const submitted = await transaction.project.update({
        where: { id },
        data: { status: ProjectStatus.SUBMITTED, submittedAt: new Date() },
        include: { category: true },
      });
      await transaction.notification.create({
        data: {
          userId: ownerId,
          type: "PROJECT",
          title: "Projet soumis",
          message: `Votre projet « ${project.title} » a été transmis à notre équipe.`,
        },
      });
      await transaction.projectActivity.create({
        data: {
          projectId: submitted.id,
          actorId: ownerId,
          type: ProjectActivityType.PROJECT_SUBMITTED,
          message: "Projet soumis pour examen",
        },
      });
      return submitted;
    });
  }

  async updateStatus(
    id: string,
    actorId: string,
    input: UpdateProjectStatusDto,
  ) {
    if (
      input.status === ProjectStatus.DRAFT ||
      input.status === ProjectStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        "Administrators can set review, approval, rejection, or publication status",
      );
    }
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.project.update({
          where: { id },
          data: { status: input.status },
          include: { category: true },
        });
        await transaction.notification.create({
          data: {
            userId: updated.ownerId,
            type: "PROJECT",
            title: "Statut du projet mis à jour",
            message: `Le statut de votre projet « ${updated.title} » est maintenant ${input.status}.`,
          },
        });
        await transaction.projectActivity.create({
          data: {
            projectId: updated.id,
            actorId,
            type: ProjectActivityType.PROJECT_STATUS_CHANGED,
            message: `Statut du projet mis à jour : ${input.status}`,
          },
        });
        return updated;
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2025")) {
        throw new NotFoundException("Project not found");
      }
      throw error;
    }
  }

  async createMilestone(
    projectId: string,
    userId: string,
    role: UserRole,
    input: CreateMilestoneDto,
  ) {
    await this.assertProjectAccess(projectId, userId, role);
    return this.prisma.$transaction(async (transaction) => {
      const milestone = await transaction.milestone.create({
        data: {
          projectId,
          title: input.title.trim(),
          description: input.description?.trim(),
          phase: input.phase,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        include: { tasks: true },
      });
      await transaction.projectActivity.create({
        data: {
          projectId,
          actorId: userId,
          type: ProjectActivityType.MILESTONE_CREATED,
          message: `Jalon ajouté : ${milestone.title}`,
        },
      });
      return milestone;
    });
  }

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    userId: string,
    role: UserRole,
    input: UpdateMilestoneDto,
  ) {
    await this.assertProjectAccess(projectId, userId, role);
    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId },
      select: { id: true },
    });
    if (!milestone) throw new NotFoundException("Milestone not found");
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.milestone.update({
        where: { id: milestoneId },
        data: {
          ...input,
          ...(input.dueDate !== undefined
            ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
            : {}),
          ...(input.status !== undefined
            ? {
                completedAt:
                  input.status === MilestoneStatus.COMPLETED
                    ? new Date()
                    : null,
              }
            : {}),
        },
        include: { tasks: true },
      });
      await transaction.projectActivity.create({
        data: {
          projectId,
          actorId: userId,
          type: ProjectActivityType.MILESTONE_UPDATED,
          message: `Jalon mis à jour : ${updated.title}`,
        },
      });
      return updated;
    });
  }

  async createTask(
    projectId: string,
    userId: string,
    role: UserRole,
    input: CreateTaskDto,
  ) {
    await this.assertProjectAccess(projectId, userId, role);
    if (input.milestoneId) {
      const milestone = await this.prisma.milestone.findFirst({
        where: { id: input.milestoneId, projectId },
        select: { id: true },
      });
      if (!milestone) throw new NotFoundException("Milestone not found");
    }
    return this.prisma.$transaction(async (transaction) => {
      const task = await transaction.task.create({
        data: {
          projectId,
          milestoneId: input.milestoneId ?? null,
          title: input.title.trim(),
          description: input.description?.trim(),
          priority: input.priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        include: { milestone: true },
      });
      await transaction.projectActivity.create({
        data: {
          projectId,
          actorId: userId,
          type: ProjectActivityType.TASK_CREATED,
          message: `Tâche ajoutée : ${task.title}`,
        },
      });
      return task;
    });
  }

  async updateTask(
    projectId: string,
    taskId: string,
    userId: string,
    role: UserRole,
    input: UpdateTaskDto,
  ) {
    await this.assertProjectAccess(projectId, userId, role);
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { id: true },
    });
    if (!task) throw new NotFoundException("Task not found");
    if (input.milestoneId) {
      const milestone = await this.prisma.milestone.findFirst({
        where: { id: input.milestoneId, projectId },
        select: { id: true },
      });
      if (!milestone) throw new NotFoundException("Milestone not found");
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.task.update({
        where: { id: taskId },
        data: {
          ...input,
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description?.trim() || null }
            : {}),
          ...(input.milestoneId !== undefined
            ? { milestoneId: input.milestoneId || null }
            : {}),
          ...(input.dueDate !== undefined
            ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
            : {}),
          ...(input.status !== undefined
            ? {
                completedAt:
                  input.status === TaskStatus.DONE ? new Date() : null,
              }
            : {}),
        },
        include: { milestone: true },
      });
      await transaction.projectActivity.create({
        data: {
          projectId,
          actorId: userId,
          type: ProjectActivityType.TASK_UPDATED,
          message: `Tâche mise à jour : ${updated.title}`,
        },
      });
      return updated;
    });
  }

  async advancePhase(projectId: string, userId: string, role: UserRole) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { milestones: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (project.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("You cannot advance this project");
    }

    const phaseIndex = PROJECT_PHASES.indexOf(project.currentPhase);
    const nextPhase = PROJECT_PHASES[phaseIndex + 1];
    if (!nextPhase)
      throw new BadRequestException("Project is already in its final phase");

    if (project.currentPhase === ProjectPhase.IDEA) {
      if (!project.problem?.trim()) {
        throw new BadRequestException(
          "Add the project problem before advancing from the Idea phase",
        );
      }
    } else if (project.currentPhase === ProjectPhase.CONCEPT) {
      if (!project.solution?.trim() || !project.targetMarket?.trim()) {
        throw new BadRequestException(
          "Add a solution and target market before advancing from the Concept phase",
        );
      }
    } else {
      const phaseMilestones = project.milestones.filter(
        (milestone) => milestone.phase === project.currentPhase,
      );
      if (
        phaseMilestones.length === 0 ||
        phaseMilestones.some(
          (milestone) => milestone.status !== MilestoneStatus.COMPLETED,
        )
      ) {
        throw new BadRequestException(
          "Complete all milestones for the current phase before advancing",
        );
      }
    }

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.project.update({
        where: { id: projectId },
        data: { currentPhase: nextPhase },
        include: { category: true },
      });
      await transaction.projectActivity.create({
        data: {
          projectId,
          actorId: userId,
          type: ProjectActivityType.PHASE_ADVANCED,
          message: `Phase avancée : ${project.currentPhase} → ${nextPhase}`,
        },
      });
      return updated;
    });
  }

  async delete(id: string, userId: string, role: UserRole) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (project.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("You cannot delete this project");
    }
    if (role !== UserRole.ADMIN && project.status !== ProjectStatus.DRAFT) {
      throw new ForbiddenException("Only draft projects can be deleted");
    }
    await this.prisma.project.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertActiveCategory(categoryId?: string | null) {
    if (!categoryId) {
      return;
    }
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException("Active category not found");
    }
  }

  private async assertProjectAccess(
    projectId: string,
    userId: string,
    role: UserRole,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (project.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("You cannot access this project");
    }
  }
}
