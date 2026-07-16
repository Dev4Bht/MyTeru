import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@druksave/database";
import { PrismaService } from "../../database/prisma.service";
import { CreateGoalContributionDto, CreateGoalDto, UpdateGoalDto } from "./dto";

const GOAL_INCLUDE = { contributions: { orderBy: { contributedAt: "desc" as const } } };

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId },
      include: GOAL_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId,
        name: dto.name,
        targetAmountNu: dto.targetAmountNu,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      },
      include: GOAL_INCLUDE,
    });
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.findOwnedOrThrow(userId, id);
    return this.prisma.goal.update({
      where: { id },
      data: {
        name: dto.name,
        targetAmountNu: dto.targetAmountNu,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        status: dto.status,
      },
      include: GOAL_INCLUDE,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwnedOrThrow(userId, id);
    await this.prisma.goal.delete({ where: { id } });
  }

  async addContribution(userId: string, goalId: string, dto: CreateGoalContributionDto) {
    const goal = await this.findOwnedOrThrow(userId, goalId);

    const newSaved = new Prisma.Decimal(goal.savedAmountNu).add(dto.amountNu);
    const isNowComplete = goal.status === "ACTIVE" && newSaved.gte(goal.targetAmountNu);

    await this.prisma.$transaction([
      this.prisma.goalContribution.create({
        data: { goalId, amountNu: dto.amountNu, note: dto.note },
      }),
      this.prisma.goal.update({
        where: { id: goalId },
        data: {
          savedAmountNu: newSaved,
          status: isNowComplete ? "COMPLETED" : undefined,
        },
      }),
    ]);

    return this.prisma.goal.findUniqueOrThrow({ where: { id: goalId }, include: GOAL_INCLUDE });
  }

  private async findOwnedOrThrow(userId: string, id: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal) {
      throw new NotFoundException("Goal not found");
    }
    if (goal.userId !== userId) {
      throw new ForbiddenException("You cannot access another user's goal");
    }
    return goal;
  }
}
