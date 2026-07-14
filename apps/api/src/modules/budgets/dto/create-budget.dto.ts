import { ApiProperty } from "@nestjs/swagger";
import { BudgetPeriod } from "@druksave/database";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsUUID } from "class-validator";

export class CreateBudgetDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ enum: ["WEEKLY", "MONTHLY", "YEARLY"] })
  @IsEnum(["WEEKLY", "MONTHLY", "YEARLY"])
  period!: BudgetPeriod;

  @ApiProperty({ example: 8000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  limitNu!: number;

  @ApiProperty({ example: "2026-08-01" })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ required: false, example: "2027-08-01" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
