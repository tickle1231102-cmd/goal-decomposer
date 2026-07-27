import type { GoalScope } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const GOAL_SCOPE_LABELS: Record<GoalScope, string> = {
  SHORT_TERM: "단기",
  MID_TERM: "중기",
  LONG_TERM: "장기",
};

export type GoalListItem = {
  id: string;
  title: string;
  description: string;
  scope: GoalScope;
  startDate: string;
  endDate: string;
  createdAt: string;
  yearlyPlanCount: number;
};

export async function getGoalsForUser(userId: string): Promise<GoalListItem[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      scope: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      _count: {
        select: {
          yearlyPlans: true,
        },
      },
    },
  });

  return goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    description: goal.description,
    scope: goal.scope,
    startDate: goal.startDate.toISOString().slice(0, 10),
    endDate: goal.endDate.toISOString().slice(0, 10),
    createdAt: goal.createdAt.toISOString(),
    yearlyPlanCount: goal._count.yearlyPlans,
  }));
}
