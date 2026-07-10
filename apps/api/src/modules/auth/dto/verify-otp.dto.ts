import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString, Matches } from "class-validator";
import { OtpPurpose } from "@druksave/database";
import { BHUTAN_PHONE_REGEX } from "@druksave/shared";

export class VerifyOtpDto {
  @ApiProperty({ example: "+97517123456" })
  @Matches(BHUTAN_PHONE_REGEX)
  phone!: string;

  @ApiProperty({ example: "123456" })
  @Matches(/^\d{6}$/, { message: "Enter the 6-digit code" })
  code!: string;

  @ApiProperty({ enum: OtpPurpose })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;

  @ApiProperty({ example: "web-9f3c2a1b" })
  @IsString()
  deviceId!: string;
}
