import { GoalContributionDto, GoalDto } from "@druksave/shared";
import { Goal, GoalContribution } from "@druksave/database";

type GoalWithContributions = Goal & { contributions: GoalContribution[] };

export function toGoalContributionDto(contribution: GoalContribution): GoalContributionDto {
  return {
    id: contribution.id,
    goalId: contribution.goalId,
    amountNu: contribution.amountNu.toString(),
    note: contribution.note ?? null,
    contributedAt: contribution.contributedAt.toISOString(),
  };
}

export function toGoalDto(goal: GoalWithContributions): GoalDto {
  return {
    id: goal.id,
    name: goal.name,
    targetAmountNu: goal.targetAmountNu.toString(),
    savedAmountNu: goal.savedAmountNu.toString(),
    targetDate: goal.targetDate?.toISOString() ?? null,
    status: goal.status,
    contributions: goal.contributions.map(toGoalContributionDto),
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}
