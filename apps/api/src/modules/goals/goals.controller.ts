import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { GoalsService } from "./goals.service";
import { toGoalDto } from "./goals.mapper";
import { CreateGoalContributionDto, CreateGoalDto, UpdateGoalDto } from "./dto";

@ApiTags("goals")
@ApiBearerAuth()
@Controller("goals")
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's savings goals" })
  async list(@CurrentUser() user: JwtUserPayload) {
    const goals = await this.goalsService.list(user.sub);
    return goals.map(toGoalDto);
  }

  @Post()
  @ApiOperation({ summary: "Create a savings goal" })
  async create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateGoalDto) {
    const goal = await this.goalsService.create(user.sub, dto);
    return toGoalDto(goal);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a goal, or pause/resume/cancel it" })
  async update(@CurrentUser() user: JwtUserPayload, @Param("id") id: string, @Body() dto: UpdateGoalDto) {
    const goal = await this.goalsService.update(user.sub, id, dto);
    return toGoalDto(goal);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a goal" })
  remove(@CurrentUser() user: JwtUserPayload, @Param("id") id: string) {
    return this.goalsService.remove(user.sub, id);
  }

  @Post(":id/contributions")
  @ApiOperation({ summary: "Add a contribution towards a goal" })
  async addContribution(
    @CurrentUser() user: JwtUserPayload,
    @Param("id") id: string,
    @Body() dto: CreateGoalContributionDto,
  ) {
    const goal = await this.goalsService.addContribution(user.sub, id, dto);
    return toGoalDto(goal);
  }
}
