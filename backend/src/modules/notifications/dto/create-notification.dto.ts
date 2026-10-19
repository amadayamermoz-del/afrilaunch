import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class CreateNotificationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(5000)
  message!: string;

  @IsIn(["PROJECT", "APPLICATION", "OPPORTUNITY", "ACCOUNT"])
  type!: string;
}
