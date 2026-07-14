import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "@druksave/database";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateCategoryDto {
  @ApiProperty({ required: false, example: "Weekend Hikes" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @ApiProperty({ required: false, enum: ["INCOME", "EXPENSE"] })
  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: TransactionType;

  @ApiProperty({ required: false, example: "🥾" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiProperty({ required: false, example: "#3B82F6" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
