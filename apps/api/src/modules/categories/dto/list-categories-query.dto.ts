import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "@druksave/database";
import { IsEnum, IsOptional } from "class-validator";

export class ListCategoriesQueryDto {
  @ApiProperty({ required: false, enum: ["INCOME", "EXPENSE"] })
  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: TransactionType;
}
