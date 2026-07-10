import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";
import { BHUTAN_PHONE_REGEX } from "@druksave/shared";

export class ChangePhoneDto {
  @ApiProperty({ example: "+97517987654" })
  @Matches(BHUTAN_PHONE_REGEX)
  newPhone!: string;
}

export class ChangePhoneConfirmDto {
  @ApiProperty({ example: "+97517987654" })
  @Matches(BHUTAN_PHONE_REGEX)
  newPhone!: string;

  @ApiProperty({ example: "123456" })
  @Matches(/^\d{6}$/, { message: "Enter the 6-digit code" })
  code!: string;
}
