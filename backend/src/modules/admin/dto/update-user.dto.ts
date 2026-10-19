import { IsEnum, IsOptional } from "class-validator";
import { AccountStatus, UserRole } from "@prisma/client";

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
