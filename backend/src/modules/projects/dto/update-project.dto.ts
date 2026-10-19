import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  @Matches(/\S/)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  problem?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  solution?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  targetMarket?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  valueProposition?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  program?: string | null;

  @IsOptional()
  @IsString()
  categoryId?: string | null;
}
