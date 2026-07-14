import { ApiProperty } from "@nestjs/swagger";
import { RecurrenceFrequency, TransactionType } from "@druksave/database";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class UpdateRecurringTransactionDto {
  @ApiProperty({ required: false, enum: ["INCOME", "EXPENSE"] })
  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: TransactionType;

  @ApiProperty({ required: false, example: 25000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountNu?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, example: "Government Salary" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false, enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] })
  @IsOptional()
  @IsEnum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
  frequency?: RecurrenceFrequency;

  @ApiProperty({ required: false, example: "2026-08-01" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, example: "2027-08-01" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
