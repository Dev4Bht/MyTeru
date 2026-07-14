import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "@druksave/database";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from "class-validator";

export class UpdateTransactionDto {
  @ApiProperty({ required: false, enum: ["INCOME", "EXPENSE"] })
  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: TransactionType;

  @ApiProperty({ required: false, example: 450 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountNu?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, example: "Bhutan Telecom" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  merchantName?: string;

  @ApiProperty({ required: false, example: "Monthly internet bill" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false, example: "2026-07-10" })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
