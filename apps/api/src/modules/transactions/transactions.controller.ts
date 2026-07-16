import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { TransactionsService } from "./transactions.service";
import { toTransactionDto } from "./transactions.mapper";
import {
  CreateTransactionDto,
  ListTransactionsQueryDto,
  TransactionSummaryQueryDto,
  UpdateTransactionDto,
} from "./dto";

@ApiTags("transactions")
@ApiBearerAuth()
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: "Record a new income or expense transaction" })
  async create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateTransactionDto) {
    const transaction = await this.transactionsService.create(user.sub, dto);
    return toTransactionDto(transaction);
  }

  @Get()
  @ApiOperation({ summary: "List the current user's transactions, paginated and filterable" })
  async list(@CurrentUser() user: JwtUserPayload, @Query() query: ListTransactionsQueryDto) {
    const { items, total, page, pageSize } = await this.transactionsService.list(user.sub, query);
    return { items: items.map(toTransactionDto), total, page, pageSize };
  }

  @Get("summary")
  @ApiOperation({ summary: "Get month-to-date income/expense/balance totals" })
  summary(@CurrentUser() user: JwtUserPayload, @Query() query: TransactionSummaryQueryDto) {
    return this.transactionsService.summary(user.sub, query.month);
  }

  @Get("breakdown")
  @ApiOperation({ summary: "Get spending/income grouped by category for a month" })
  breakdown(@CurrentUser() user: JwtUserPayload, @Query() query: TransactionSummaryQueryDto) {
    return this.transactionsService.categoryBreakdown(user.sub, query.month);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single transaction owned by the current user" })
  async findOne(@CurrentUser() user: JwtUserPayload, @Param("id") id: string) {
    const transaction = await this.transactionsService.findOwnedOrThrow(user.sub, id);
    return toTransactionDto(transaction);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a transaction owned by the current user" })
  async update(
    @CurrentUser() user: JwtUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    const transaction = await this.transactionsService.update(user.sub, id, dto);
    return toTransactionDto(transaction);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a transaction owned by the current user" })
  remove(@CurrentUser() user: JwtUserPayload, @Param("id") id: string) {
    return this.transactionsService.remove(user.sub, id);
  }
}
