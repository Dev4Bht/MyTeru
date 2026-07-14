import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "tashi.dema@example.bt" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "SecurePass123" })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiProperty({ example: "web-9f3c2a1b" })
  @IsString()
  deviceId!: string;
}
