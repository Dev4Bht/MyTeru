import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";
import { BHUTAN_PHONE_REGEX } from "@druksave/shared";

export class ResetPasswordDto {
  @ApiProperty({ example: "+97517123456" })
  @Matches(BHUTAN_PHONE_REGEX)
  phone!: string;

  @ApiProperty({ example: "123456" })
  @Matches(/^\d{6}$/, { message: "Enter the 6-digit code" })
  code!: string;

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
