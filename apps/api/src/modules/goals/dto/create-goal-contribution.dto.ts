import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class CreateGoalContributionDto {
  @ApiProperty({ example: 2000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountNu!: number;

  @ApiProperty({ required: false, example: "Bonus from work" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
