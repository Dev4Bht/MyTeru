export type GoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";

export interface GoalContributionDto {
  id: string;
  goalId: string;
  amountNu: string;
  note: string | null;
  contributedAt: string;
}

export interface GoalDto {
  id: string;
  name: string;
  targetAmountNu: string;
  savedAmountNu: string;
  targetDate: string | null;
  status: GoalStatus;
  contributions: GoalContributionDto[];
  createdAt: string;
  updatedAt: string;
}
