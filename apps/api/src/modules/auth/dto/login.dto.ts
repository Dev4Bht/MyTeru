import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";
import { BHUTAN_PHONE_REGEX } from "@druksave/shared";

export class LoginDto {
  @ApiProperty({ example: "+97517123456" })
  @Matches(BHUTAN_PHONE_REGEX)
  phone!: string;

  @ApiProperty({ example: "SecurePass123" })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiProperty({ example: "web-9f3c2a1b" })
  @IsString()
  deviceId!: string;
}
