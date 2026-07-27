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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PlanDailyTask, PlanGoal } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

type WorkflowStep = {
  id: string;
  label: string;
  sublabel: string;
  count: number;
  countLabel: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
};

type PlanWorkflowVisualizationProps = {
  goal: PlanGoal;
  tasks: PlanDailyTask[];
};

function buildWorkflowSteps(
  goal: PlanGoal,
  tasks: PlanDailyTask[],
): WorkflowStep[] {
  const monthlyCount = goal.yearlyPlans.reduce(
    (total, yearlyPlan) => total + yearlyPlan.monthlyPlans.length,
    0,
  );
  const weeklyCount = goal.yearlyPlans.reduce(
    (total, yearlyPlan) =>
      total +
      yearlyPlan.monthlyPlans.reduce(
        (monthTotal, monthlyPlan) => monthTotal + monthlyPlan.weeklyPlans.length,
        0,
      ),
    0,
  );
  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const completionRate =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const yearRange =
    goal.yearlyPlans.length > 0
      ? goal.yearlyPlans.map((plan) => plan.year).join(" · ")
      : "—";

  const monthSample = goal.yearlyPlans
    .flatMap((yearlyPlan) =>
      yearlyPlan.monthlyPlans.map(
        (monthlyPlan) => `${monthlyPlan.year}.${monthlyPlan.month}`,
      ),
    )
    .slice(0, 3)
    .join(", ");

  const weekSample = goal.yearlyPlans
    .flatMap((yearlyPlan) =>
      yearlyPlan.monthlyPlans.flatMap((monthlyPlan) =>
        monthlyPlan.weeklyPlans.map(
          (weeklyPlan) =>
            `${weeklyPlan.month}월 ${weeklyPlan.weekNumber}주`,
        ),
      ),
    )
    .slice(0, 3)
    .join(", ");

  return [
    {
      id: "goal",
      label: "목표",
      sublabel: "Goal",
      count: 1,
      countLabel: "최종 목표",
      detail: goal.title,
      icon: Target,
      accent: "bg-primary text-primary-foreground",
    },
    {
      id: "yearly",
      label: "연간",
      sublabel: "Year",
      count: goal.yearlyPlans.length,
      countLabel: "연간 계획",
      detail: yearRange,
      icon: CalendarRange,
      accent: "bg-blue-600 text-white",
    },
    {
      id: "monthly",
      label: "월간",
      sublabel: "Month",
      count: monthlyCount,
      countLabel: "월간 테마",
      detail: monthSample ? `${monthSample}${monthlyCount > 3 ? " …" : ""}` : "—",
      icon: Calendar,
      accent: "bg-violet-600 text-white",
    },
    {
      id: "weekly",
      label: "주간",
      sublabel: "Week",
      count: weeklyCount,
      countLabel: "주간 포커스",
      detail: weekSample ? `${weekSample}${weeklyCount > 3 ? " …" : ""}` : "—",
      icon: CalendarDays,
      accent: "bg-amber-600 text-white",
    },
    {
      id: "daily",
      label: "일간",
      sublabel: "Day",
      count: tasks.length,
      countLabel: "실행 과제",
      detail: `${completedTasks}/${tasks.length} 완료 · ${completionRate}%`,
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
          "flex size-11 items-center justify-center rounded-2xl shadow-sm",
          step.accent,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="mt-3 w-full rounded-xl border bg-card p-3 text-center shadow-sm">
        <div className="flex items-center justify-center gap-1.5">
          <p className="text-sm font-semibold">{step.label}</p>
          <Badge variant="secondary" className="text-[10px] uppercase">
            {step.sublabel}
          </Badge>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">
          {step.count}
        </p>
        <p className="text-xs text-muted-foreground">{step.countLabel}</p>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {step.detail}
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">플랜 워크플로우</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              목표에서 일간 실행 과제까지 자동 분해된 전체 실행 흐름입니다.
            </p>
          </div>
          <Badge variant="outline" className="w-fit shrink-0">
            Goal → Year → Month → Week → Day
          </Badge>
        </div>
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
            <p className="text-sm font-medium">일간 실행 진행률</p>
            <span className="text-sm text-muted-foreground">
              {completedTasks} / {tasks.length} 완료
            </span>
          </div>
          <Progress value={completionRate} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            상위 계획(연·월·주)은 방향을 잡고, 일간 To-Do에서 실제 실행을
            체크합니다.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">기간</p>
            <p className="mt-1 font-medium">
              {goal.startDate} ~ {goal.endDate}
            </p>
          </div>
          <div className="rounded-lg border px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">분해 단계</p>
            <p className="mt-1 font-medium">5단계 (목표 → 일간)</p>
          </div>
          <div className="rounded-lg border px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">총 실행 단위</p>
            <p className="mt-1 font-medium">{tasks.length}개 일간 과제</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
