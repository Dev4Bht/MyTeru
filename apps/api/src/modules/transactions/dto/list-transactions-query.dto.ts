import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { TransactionType } from "@druksave/database";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class ListTransactionsQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiProperty({ required: false, enum: ["INCOME", "EXPENSE"] })
  @IsOptional()
  @IsEnum(["INCOME", "EXPENSE"])
  type?: TransactionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, example: "2026-07-01" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false, example: "2026-07-31" })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
