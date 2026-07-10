import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";
import { BHUTAN_PHONE_REGEX } from "@druksave/shared";

export class ForgotPasswordDto {
  @ApiProperty({ example: "+97517123456" })
  @Matches(BHUTAN_PHONE_REGEX)
  phone!: string;
}
