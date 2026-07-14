import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { TransactionType } from "@druksave/database";
import { PrismaService } from "../../database/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, type?: TransactionType) {
    return this.prisma.category.findMany({
      where: {
        type,
        OR: [{ userId: null }, { userId }],
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
  }

  create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon,
        color: dto.color,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.findOwnedOrThrow(userId, id);
    return this.prisma.category.update({ where: { id: category.id }, data: dto });
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.findOwnedOrThrow(userId, id);
    await this.prisma.category.delete({ where: { id: category.id } });
  }

  private async findOwnedOrThrow(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    if (category.isSystem) {
      throw new ForbiddenException("System categories can't be modified");
    }
    if (category.userId !== userId) {
      throw new ForbiddenException("You cannot modify another user's category");
    }
    return category;
  }
}
