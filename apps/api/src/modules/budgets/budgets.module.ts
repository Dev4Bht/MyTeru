import { Module } from "@nestjs/common";
import { RecurringTransactionsModule } from "../recurring-transactions/recurring-transactions.module";
import { BudgetsService } from "./budgets.service";
import { BudgetsController } from "./budgets.controller";

@Module({
  imports: [RecurringTransactionsModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
