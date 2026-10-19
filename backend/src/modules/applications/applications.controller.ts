import {
  Body,
  Controller,
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
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";
import { ApplicationsService } from "./applications.service";

@Controller("applications")
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.listMine(user.sub);
  }

  @Post("opportunity/:opportunityId")
  apply(
    @Param("opportunityId") opportunityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.apply(user.sub, opportunityId);
  }

  @Post(":id/withdraw")
  withdraw(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.withdraw(id, user.sub);
  }

  @Get("admin")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listAdmin() {
    return this.applicationsService.listAdmin();
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param("id") id: string,
    @Body() input: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, input);
  }
}
