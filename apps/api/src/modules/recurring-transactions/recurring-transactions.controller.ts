import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { RecurringTransactionsService } from "./recurring-transactions.service";
import { toRecurringTransactionDto } from "./recurring-transactions.mapper";
import { CreateRecurringTransactionDto, UpdateRecurringTransactionDto } from "./dto";

@ApiTags("recurring-transactions")
@ApiBearerAuth()
@Controller("recurring-transactions")
export class RecurringTransactionsController {
  constructor(private readonly recurringTransactionsService: RecurringTransactionsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's recurring transaction templates" })
  async list(@CurrentUser() user: JwtUserPayload) {
    const items = await this.recurringTransactionsService.list(user.sub);
    return items.map(toRecurringTransactionDto);
  }

  @Post()
  @ApiOperation({ summary: "Create a recurring transaction template" })
  async create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateRecurringTransactionDto) {
    const recurring = await this.recurringTransactionsService.create(user.sub, dto);
    return toRecurringTransactionDto(recurring);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a recurring transaction template, or toggle it active/paused" })
  async update(
    @CurrentUser() user: JwtUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateRecurringTransactionDto,
  ) {
    const recurring = await this.recurringTransactionsService.update(user.sub, id, dto);
    return toRecurringTransactionDto(recurring);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a recurring transaction template" })
  remove(@CurrentUser() user: JwtUserPayload, @Param("id") id: string) {
    return this.recurringTransactionsService.remove(user.sub, id);
  }
}
