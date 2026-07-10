import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({ example: "NewSecurePass123" })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Za-z]/, { message: "Password must contain at least one letter" })
  @Matches(/[0-9]/, { message: "Password must contain at least one number" })
  newPassword!: string;

  @ApiProperty({ example: "NewSecurePass123" })
  @IsString()
  confirmPassword!: string;
}
