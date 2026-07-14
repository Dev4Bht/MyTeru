import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ValidateNested } from "class-validator";
import { BudgetPlanLineDto } from "./budget-plan-line.dto";

export class SaveBudgetPlanDto {
  @ApiProperty({ type: [BudgetPlanLineDto], description: "Income sources, e.g. salary" })
  @ValidateNested({ each: true })
  @Type(() => BudgetPlanLineDto)
  @ArrayMaxSize(20)
  income!: BudgetPlanLineDto[];

  @ApiProperty({ type: [BudgetPlanLineDto], description: "Spending allocations, e.g. rent, transport, savings" })
  @ValidateNested({ each: true })
  @Type(() => BudgetPlanLineDto)
  @ArrayMaxSize(40)
  allocations!: BudgetPlanLineDto[];
}
