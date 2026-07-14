import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class BudgetPlanLineDto {
  @ApiProperty({ required: false, description: "Existing budget line to update, if any" })
  @IsOptional()
  @IsUUID()
  budgetId?: string;

  @ApiProperty({ required: false, description: "Existing category to reuse, if any" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: "Rent" })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiProperty({ required: false, example: "🏠" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiProperty({ example: 8000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountNu!: number;

  @ApiProperty({ default: false, description: "Automatically post this amount as a transaction every month" })
  @IsBoolean()
  autoPost!: boolean;
}
