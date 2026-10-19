import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UpdateProjectStatusDto } from "./dto/update-project-status.dto";
import { CreateMilestoneDto } from "./dto/create-milestone.dto";
import { UpdateMilestoneDto } from "./dto/update-milestone.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get("public")
  listPublished() {
    return this.projectsService.listPublished();
  }

  @Get("public/:id")
  getPublic(@Param("id") id: string) {
    return this.projectsService.getPublic(id);
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listAdmin() {
    return this.projectsService.listAdmin();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.listMine(user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateProjectDto,
  ) {
    return this.projectsService.create(user.sub, input);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  get(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.get(id, user.sub, user.role);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.sub, user.role, input);
  }

  @Post(":id/submit")
  @UseGuards(JwtAuthGuard)
  submit(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.submit(id, user.sub);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateProjectStatusDto,
  ) {
    return this.projectsService.updateStatus(id, user.sub, input);
  }

  @Post(":projectId/milestones")
  @UseGuards(JwtAuthGuard)
  createMilestone(
    @Param("projectId") projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateMilestoneDto,
  ) {
    return this.projectsService.createMilestone(
      projectId,
      user.sub,
      user.role,
      input,
    );
  }

  @Patch(":projectId/milestones/:milestoneId")
  @UseGuards(JwtAuthGuard)
  updateMilestone(
    @Param("projectId") projectId: string,
    @Param("milestoneId") milestoneId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateMilestoneDto,
  ) {
    return this.projectsService.updateMilestone(
      projectId,
      milestoneId,
      user.sub,
      user.role,
      input,
    );
  }

  @Post(":projectId/tasks")
  @UseGuards(JwtAuthGuard)
  createTask(
    @Param("projectId") projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateTaskDto,
  ) {
    return this.projectsService.createTask(
      projectId,
      user.sub,
      user.role,
      input,
    );
  }

  @Patch(":projectId/tasks/:taskId")
  @UseGuards(JwtAuthGuard)
  updateTask(
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateTaskDto,
  ) {
    return this.projectsService.updateTask(
      projectId,
      taskId,
      user.sub,
      user.role,
      input,
    );
  }

  @Post(":id/advance-phase")
  @UseGuards(JwtAuthGuard)
  advancePhase(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.advancePhase(id, user.sub, user.role);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  delete(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.delete(id, user.sub, user.role);
  }
}
