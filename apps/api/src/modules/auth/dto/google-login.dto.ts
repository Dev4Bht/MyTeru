import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class GoogleLoginDto {
  @ApiProperty({ description: "The ID token (JWT credential) returned by Google Identity Services" })
  @IsString()
  @MinLength(1)
  idToken!: string;

  @ApiProperty({ example: "web-9f3c2a1b" })
  @IsString()
  deviceId!: string;
}
