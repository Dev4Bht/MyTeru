import { ApiProperty } from "@nestjs/swagger";
import { BudgetPeriod } from "@druksave/database";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsUUID } from "class-validator";

export class UpdateBudgetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, enum: ["WEEKLY", "MONTHLY", "YEARLY"] })
  @IsOptional()
  @IsEnum(["WEEKLY", "MONTHLY", "YEARLY"])
  period?: BudgetPeriod;

  @ApiProperty({ required: false, example: 8000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  limitNu?: number;

  @ApiProperty({ required: false, example: "2026-08-01" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, example: "2027-08-01" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
