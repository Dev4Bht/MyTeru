import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "@druksave/database";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateTransactionDto {
  @ApiProperty({ enum: ["INCOME", "EXPENSE"] })
  @IsEnum(["INCOME", "EXPENSE"])
  type!: TransactionType;

  @ApiProperty({ example: 450 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountNu!: number;

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

  @ApiProperty({ example: "2026-07-10" })
  @IsDateString()
  occurredAt!: string;
}
