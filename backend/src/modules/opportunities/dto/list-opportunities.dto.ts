import { IsOptional, IsString, MaxLength } from "class-validator";

export class ListOpportunitiesDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
