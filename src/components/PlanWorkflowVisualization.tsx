"use client";

import {
  ArrowRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PlanDailyTask, PlanGoal } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

type WorkflowStep = {
  id: string;
  keywords: string;
  icon: LucideIcon;
  accent: string;
};

type PlanWorkflowVisualizationProps = {
  goal: PlanGoal;
  tasks: PlanDailyTask[];
};

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function joinUniqueKeywords(items: string[], maxItems: number, maxLength: number) {
  const unique = [...new Set(items.map((item) => item.trim()).filter(Boolean))];
  const joined = unique.slice(0, maxItems).join(" · ");
  return joined ? truncateText(joined, maxLength) : "—";
}

function buildWorkflowSteps(
  goal: PlanGoal,
  tasks: PlanDailyTask[],
): WorkflowStep[] {
  const yearlyKeywords = joinUniqueKeywords(
    goal.yearlyPlans.map((plan) => plan.summary),
    2,
    72,
  );

  const monthlyKeywords = joinUniqueKeywords(
    goal.yearlyPlans.flatMap((yearlyPlan) =>
      yearlyPlan.monthlyPlans.map((monthlyPlan) => monthlyPlan.theme),
    ),
    3,
    72,
  );

  const weeklyKeywords = joinUniqueKeywords(
    goal.yearlyPlans.flatMap((yearlyPlan) =>
      yearlyPlan.monthlyPlans.flatMap((monthlyPlan) =>
        monthlyPlan.weeklyPlans.map((weeklyPlan) => weeklyPlan.focusGoal),
      ),
    ),
    3,
    72,
  );

  const dailyKeywords = joinUniqueKeywords(
    tasks.map((task) => task.content),
    4,
    80,
  );

  return [
    {
      id: "goal",
      keywords: truncateText(goal.title, 48),
      icon: Target,
      accent: "bg-primary text-primary-foreground",
    },
    {
      id: "yearly",
      keywords: yearlyKeywords,
      icon: CalendarRange,
      accent: "bg-blue-600 text-white",
    },
    {
      id: "monthly",
      keywords: monthlyKeywords,
      icon: Calendar,
      accent: "bg-violet-600 text-white",
    },
    {
      id: "weekly",
      keywords: weeklyKeywords,
      icon: CalendarDays,
      accent: "bg-amber-600 text-white",
    },
    {
      id: "daily",
      keywords: dailyKeywords,
      icon: CheckSquare,
      accent: "bg-emerald-600 text-white",
    },
  ];
}

function WorkflowConnector({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center text-muted-foreground/70",
        className,
      )}
      aria-hidden="true"
    >
      <ArrowRight className="hidden size-4 md:block" />
      <ArrowRight className="size-4 rotate-90 md:hidden" />
    </div>
  );
}

function WorkflowNode({ step }: { step: WorkflowStep }) {
  const Icon = step.icon;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-2xl shadow-sm sm:size-11",
          step.accent,
        )}
      >
        <Icon className="size-4 sm:size-5" />
      </div>
      <div className="mt-3 w-full rounded-xl border bg-card p-3 text-center shadow-sm">
        <p className="line-clamp-4 text-sm font-medium leading-6 text-foreground">
          {step.keywords}
        </p>
      </div>
    </div>
  );
}

export function PlanWorkflowVisualization({
  goal,
  tasks,
}: PlanWorkflowVisualizationProps) {
  const steps = buildWorkflowSteps(goal, tasks);
  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const completionRate =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="text-base">플랜 워크플로우</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-start md:gap-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col items-center md:flex-1 md:flex-row"
            >
              <WorkflowNode step={step} />
              {index < steps.length - 1 ? (
                <WorkflowConnector className="my-1 md:my-0 md:px-1" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">실행 진행률</p>
            <span className="text-sm text-muted-foreground">
              {completedTasks} / {tasks.length} ({completionRate}%)
            </span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
