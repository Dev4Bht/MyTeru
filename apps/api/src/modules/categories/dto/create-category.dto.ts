import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "@druksave/database";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ example: "Weekend Hikes" })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiProperty({ enum: ["INCOME", "EXPENSE"] })
  @IsEnum(["INCOME", "EXPENSE"])
  type!: TransactionType;

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
