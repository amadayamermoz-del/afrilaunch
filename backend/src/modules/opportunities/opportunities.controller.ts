import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { ListOpportunitiesDto } from "./dto/list-opportunities.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";
import { OpportunitiesService } from "./opportunities.service";

@Controller("opportunities")
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  listPublic(@Query() filters: ListOpportunitiesDto) {
    return this.opportunitiesService.listPublic(filters);
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listAdmin() {
    return this.opportunitiesService.listAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() input: CreateOpportunityDto) {
    return this.opportunitiesService.create(input);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param("id") id: string, @Body() input: UpdateOpportunityDto) {
    return this.opportunitiesService.update(id, input);
  }

  @Get(":id")
  getPublic(@Param("id") id: string) {
    return this.opportunitiesService.getPublic(id);
  }
}
