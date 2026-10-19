import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  @Matches(/\S/)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  problem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  solution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  targetMarket?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  valueProposition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  program?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;
}
