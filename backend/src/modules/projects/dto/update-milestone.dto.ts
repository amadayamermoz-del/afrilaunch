import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { MilestoneStatus } from "@prisma/client";

export class UpdateMilestoneDto {
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
