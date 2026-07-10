import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { BHUTAN_PHONE_REGEX } from "@druksave/shared";

export class SignupDto {
  @ApiProperty({ example: "Tashi Dema" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: "+97517123456" })
  @Matches(BHUTAN_PHONE_REGEX, { message: "Enter a valid Bhutanese mobile number, e.g. +97517123456" })
  phone!: string;

  @ApiPropertyOptional({ example: "tashi.dema@example.bt" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "SecurePass123" })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Za-z]/, { message: "Password must contain at least one letter" })
  @Matches(/[0-9]/, { message: "Password must contain at least one number" })
  password!: string;

  @ApiProperty({ example: "SecurePass123" })
  @IsString()
  confirmPassword!: string;

  @ApiProperty({ example: "web-9f3c2a1b" })
  @IsString()
  deviceId!: string;
}
