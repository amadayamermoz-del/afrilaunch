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
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.listMine(user.sub);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markRead(id, user.sub);
  }

  @Delete(":id")
  delete(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.delete(id, user.sub);
  }

  @Post("users/:userId")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createForUser(
    @Param("userId") userId: string,
    @Body() input: CreateNotificationDto,
  ) {
    return this.notificationsService.createForUser(userId, input);
  }
}
