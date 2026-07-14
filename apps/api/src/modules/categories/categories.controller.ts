import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { CategoriesService } from "./categories.service";
import { toCategoryDto } from "./categories.mapper";
import { CreateCategoryDto, ListCategoriesQueryDto, UpdateCategoryDto } from "./dto";

@ApiTags("categories")
@ApiBearerAuth()
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "List system categories plus the current user's own" })
  async list(@CurrentUser() user: JwtUserPayload, @Query() query: ListCategoriesQueryDto) {
    const categories = await this.categoriesService.list(user.sub, query.type);
    return categories.map(toCategoryDto);
  }

  @Post()
  @ApiOperation({ summary: "Create a custom category" })
  async create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(user.sub, dto);
    return toCategoryDto(category);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a custom category the user owns" })
  async update(
    @CurrentUser() user: JwtUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(user.sub, id, dto);
    return toCategoryDto(category);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a custom category the user owns" })
  remove(@CurrentUser() user: JwtUserPayload, @Param("id") id: string) {
    return this.categoriesService.remove(user.sub, id);
  }
}
