import type { GoalScope, TaskStatus } from "@prisma/client";

export type PlanDailyTask = {
  id: string;
  date: string;
  content: string;
  estimatedMin: number;
  status: TaskStatus;
};

export type PlanWeeklyPlan = {
  id: string;
  year: number;
  month: number;
  weekNumber: number;
  focusGoal: string;
  dailyTasks: PlanDailyTask[];
};

export type PlanMonthlyPlan = {
  id: string;
  year: number;
  month: number;
  theme: string;
  weeklyPlans: PlanWeeklyPlan[];
};

export type PlanYearlyPlan = {
  id: string;
  year: number;
  summary: string;
  monthlyPlans: PlanMonthlyPlan[];
};

export type PlanGoal = {
  id: string;
  title: string;
  description: string;
  scope: GoalScope;
  startDate: string;
  endDate: string;
  yearlyPlans: PlanYearlyPlan[];
};

export type PlanGoalWithTasks = PlanGoal & {
  dailyTasks: PlanDailyTask[];
};

export function flattenDailyTasks(goal: PlanGoal): PlanDailyTask[] {
  return goal.yearlyPlans.flatMap((yearlyPlan) =>
    yearlyPlan.monthlyPlans.flatMap((monthlyPlan) =>
      monthlyPlan.weeklyPlans.flatMap((weeklyPlan) => weeklyPlan.dailyTasks),
    ),
  );
}

export function serializeGoal(
  goal: {
    id: string;
    title: string;
    description: string;
    scope: GoalScope;
    startDate: Date;
    endDate: Date;
    yearlyPlans: Array<{
      id: string;
      year: number;
      summary: string;
      monthlyPlans: Array<{
        id: string;
        month: number;
        theme: string;
        weeklyPlans: Array<{
          id: string;
          weekNumber: number;
          focusGoal: string;
          dailyTasks: Array<{
            id: string;
            date: Date;
            content: string;
            estimatedMin: number;
            status: TaskStatus;
          }>;
        }>;
      }>;
    }>;
  },
): PlanGoal {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    scope: goal.scope,
    startDate: goal.startDate.toISOString().slice(0, 10),
    endDate: goal.endDate.toISOString().slice(0, 10),
    yearlyPlans: goal.yearlyPlans.map((yearlyPlan) => ({
      id: yearlyPlan.id,
      year: yearlyPlan.year,
      summary: yearlyPlan.summary,
      monthlyPlans: yearlyPlan.monthlyPlans.map((monthlyPlan) => ({
        id: monthlyPlan.id,
        year: yearlyPlan.year,
        month: monthlyPlan.month,
        theme: monthlyPlan.theme,
        weeklyPlans: monthlyPlan.weeklyPlans.map((weeklyPlan) => ({
          id: weeklyPlan.id,
          year: yearlyPlan.year,
          month: monthlyPlan.month,
          weekNumber: weeklyPlan.weekNumber,
          focusGoal: weeklyPlan.focusGoal,
          dailyTasks: weeklyPlan.dailyTasks.map((task) => ({
            id: task.id,
            date: task.date.toISOString().slice(0, 10),
            content: task.content,
            estimatedMin: task.estimatedMin,
            status: task.status,
          })),
        })),
      })),
    })),
  };
}
