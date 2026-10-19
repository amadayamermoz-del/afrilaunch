import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { OpportunityStatus } from "@prisma/client";

export class CreateOpportunityDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  @Matches(/\S/)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  @Matches(/\S/)
  organization!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(12000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  location?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  eligibilityCriteria?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string | null;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsEnum(OpportunityStatus)
  status?: OpportunityStatus;
}
