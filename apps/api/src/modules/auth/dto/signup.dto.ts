import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class SignupDto {
  @ApiProperty({ example: "Tashi Dema" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: "tashi.dema@example.bt" })
  @IsEmail()
  email!: string;

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
