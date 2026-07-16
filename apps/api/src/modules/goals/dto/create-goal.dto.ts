import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export class CreateGoalDto {
  @ApiProperty({ example: "Emergency Fund" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 50000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  targetAmountNu!: number;

  @ApiProperty({ required: false, example: "2027-01-01" })
  @IsOptional()
  @IsDateString()
  targetDate?: string;
}
