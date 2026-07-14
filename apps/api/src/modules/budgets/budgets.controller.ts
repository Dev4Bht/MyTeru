import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { BudgetsService } from "./budgets.service";
import { SaveBudgetPlanDto } from "./dto";

@ApiTags("budgets")
@ApiBearerAuth()
@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get("plan")
  @ApiOperation({ summary: "Get a month's plan: income and allocations, planned vs actual" })
  getPlan(@CurrentUser() user: JwtUserPayload, @Query("month") month?: string) {
    return this.budgetsService.getPlan(user.sub, month);
  }

  @Post("plan")
  @ApiOperation({ summary: "Create or update the whole monthly plan in one shot" })
  savePlan(@CurrentUser() user: JwtUserPayload, @Body() dto: SaveBudgetPlanDto) {
    return this.budgetsService.savePlan(user.sub, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a single line from the monthly plan" })
  removeLine(@CurrentUser() user: JwtUserPayload, @Param("id") id: string) {
    return this.budgetsService.removeLine(user.sub, id);
  }
}
