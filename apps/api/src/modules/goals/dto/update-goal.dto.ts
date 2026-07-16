import { ApiProperty } from "@nestjs/swagger";
import { GoalStatus } from "@druksave/database";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateGoalDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiProperty({ required: false, example: 50000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  targetAmountNu?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiProperty({ required: false, enum: ["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"])
  status?: GoalStatus;
}
