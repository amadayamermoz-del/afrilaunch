import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ProjectPhase } from "@prisma/client";

export class CreateMilestoneDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  @Matches(/\S/)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsEnum(ProjectPhase)
  phase!: ProjectPhase;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
