import { ApiProperty } from "@nestjs/swagger";
import { RecurrenceFrequency, TransactionType } from "@druksave/database";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateRecurringTransactionDto {
  @ApiProperty({ enum: ["INCOME", "EXPENSE"] })
  @IsEnum(["INCOME", "EXPENSE"])
  type!: TransactionType;

  @ApiProperty({ example: 25000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountNu!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, example: "Government Salary" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] })
  @IsEnum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
  frequency!: RecurrenceFrequency;

  @ApiProperty({ example: "2026-08-01" })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ required: false, example: "2027-08-01" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
