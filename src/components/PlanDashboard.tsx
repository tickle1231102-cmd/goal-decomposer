"use client";

import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PlanWorkflowVisualization } from "@/components/PlanWorkflowVisualization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  flattenDailyTasks,
  type PlanDailyTask,
  type PlanGoal,
  type PlanWeeklyPlan,
} from "@/lib/plan-types";
import { cn } from "@/lib/utils";

const SCOPE_LABELS: Record<PlanGoal["scope"], string> = {
  SHORT_TERM: "단기 (1-3개월)",
  MID_TERM: "중기 (3-6개월)",
  LONG_TERM: "장기 (1년 이상)",
};

type PlanDashboardProps = {
  goal: PlanGoal;
};

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: string): string {
  return format(parseISO(date), "M월 d일 (EEE)", { locale: ko });
}

function formatShortDate(date: string): string {
  return format(parseISO(date), "M/d (EEE)", { locale: ko });
}

function TimelineCard({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="relative pl-6">
      <span className="absolute top-2 left-0 size-2.5 rounded-full bg-primary" />
      <span className="absolute top-4 left-[4px] h-[calc(100%+0.75rem)] w-px bg-border last:hidden" />
      <Card className="mb-4 border-l-4 border-l-primary/60">
        <CardHeader className="pb-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {subtitle}
          </p>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function CompactTaskCard({
  task,
  onToggle,
  isUpdating,
}: {
  task: PlanDailyTask;
  onToggle: (taskId: string) => void;
  isUpdating: boolean;
}) {
  const isCompleted = task.status === "COMPLETED";

  return (
    <div className="flex items-start gap-2 rounded-md border bg-background p-2">
      <Checkbox
        checked={isCompleted}
        disabled={isUpdating}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={cn(
            "text-xs leading-5",
            isCompleted && "text-muted-foreground line-through",
          )}
        >
          {task.content}
        </p>
        <Badge variant="secondary" className="text-[10px]">
          {task.estimatedMin}분
        </Badge>
      </div>
    </div>
  );
}

function WeeklyDailyStrip({
  tasks,
  onToggle,
  updatingTaskId,
}: {
  tasks: PlanDailyTask[];
  onToggle: (taskId: string) => void;
  updatingTaskId: string | null;
}) {
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, PlanDailyTask[]>();
    for (const task of tasks) {
      const list = grouped.get(task.date) ?? [];
      list.push(task);
      grouped.set(task.date, list);
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        이 주차에 배정된 일간 과제가 없습니다.
      </p>
    );
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max gap-3">
        {tasksByDate.map(([date, dateTasks]) => (
          <div
            key={date}
            className="w-[160px] shrink-0 rounded-lg border bg-muted/30 p-2"
          >
            <p className="mb-2 border-b pb-2 text-xs font-semibold">
              {formatShortDate(date)}
            </p>
            <div className="space-y-2">
              {dateTasks.map((task) => (
                <CompactTaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  isUpdating={updatingTaskId === task.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyFocusCard({
  weeklyPlan,
  tasks,
  isSelected,
  onSelect,
  onToggle,
  updatingTaskId,
}: {
  weeklyPlan: PlanWeeklyPlan;
  tasks: PlanDailyTask[];
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (taskId: string) => void;
  updatingTaskId: string | null;
}) {
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="relative pl-6">
      <span className="absolute top-2 left-0 size-2.5 rounded-full bg-primary" />
      <span className="absolute top-4 left-[4px] h-[calc(100%+0.75rem)] w-px bg-border last:hidden" />
      <Card
        className={cn(
          "mb-4 cursor-pointer border-l-4 transition-colors",
          isSelected
            ? "border-l-primary bg-primary/5 ring-1 ring-primary/20"
            : "border-l-primary/60 hover:bg-muted/20",
        )}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                주간 포커스
              </p>
              <CardTitle className="text-base">
                {weeklyPlan.year}년 {weeklyPlan.month}월 {weeklyPlan.weekNumber}
                주차
              </CardTitle>
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                isSelected && "rotate-180",
              )}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {weeklyPlan.focusGoal}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{tasks.length}개 과제</Badge>
            <span>
              {completedCount}/{tasks.length} 완료
            </span>
          </div>
          {isSelected ? (
            <div className="pt-1" onClick={(event) => event.stopPropagation()}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                일일 To-Do (가로 보기)
              </p>
              <WeeklyDailyStrip
                tasks={tasks}
                onToggle={onToggle}
                updatingTaskId={updatingTaskId}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  isUpdating,
}: {
  task: PlanDailyTask;
  onToggle: (taskId: string) => void;
  isUpdating: boolean;
}) {
  const isCompleted = task.status === "COMPLETED";

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
      <Checkbox
        checked={isCompleted}
        disabled={isUpdating}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p
          className={
            isCompleted
              ? "text-sm text-muted-foreground line-through"
              : "text-sm"
          }
        >
          {task.content}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{task.estimatedMin}분</Badge>
          <span className="text-xs text-muted-foreground">
            {formatDisplayDate(task.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PlanDashboard({ goal }: PlanDashboardProps) {
  const [tasks, setTasks] = useState<PlanDailyTask[]>(() =>
    flattenDailyTasks(goal),
  );
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayDateString();

  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );

  const weeklyPlans = useMemo(
    () =>
      goal.yearlyPlans.flatMap((yearlyPlan) =>
        yearlyPlan.monthlyPlans.flatMap((monthlyPlan) => monthlyPlan.weeklyPlans),
      ),
    [goal.yearlyPlans],
  );

  function getWeeklyTasks(weeklyPlan: PlanWeeklyPlan): PlanDailyTask[] {
    return weeklyPlan.dailyTasks.map(
      (task) => tasksById.get(task.id) ?? task,
    );
  }

  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((task) => task.status === "COMPLETED").length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, PlanDailyTask[]>();

    for (const task of tasks) {
      const existing = grouped.get(task.date) ?? [];
      existing.push(task);
      grouped.set(task.date, existing);
    }

    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  const todayAndNearbyDates = useMemo(() => {
    const todayTasks = tasks.filter((task) => task.date === today);
    if (todayTasks.length > 0) {
      return [[today, todayTasks] as const];
    }

    const upcoming = tasksByDate.filter(([date]) => date >= today).slice(0, 3);
    return upcoming.length > 0 ? upcoming : tasksByDate.slice(0, 3);
  }, [tasks, tasksByDate, today]);

  async function handleToggle(taskId: string) {
    setError(null);
    setUpdatingTaskId(taskId);

    const previousTasks = tasks;
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) return;

    const nextStatus: PlanDailyTask["status"] =
      currentTask.status === "COMPLETED" ? "TODO" : "COMPLETED";

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus } : task,
      ),
    );

    try {
      const response = await fetch("/api/task/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });

      const result = (await response.json()) as {
        data?: { id: string; status: PlanDailyTask["status"] };
        error?: { message?: string };
      };

      if (!response.ok || !result.data) {
        throw new Error(result.error?.message ?? "태스크 상태 변경에 실패했습니다.");
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === result.data!.id
            ? { ...task, status: result.data!.status }
            : task,
        ),
      );
    } catch (toggleError) {
      setTasks(previousTasks);
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "태스크 상태 변경에 실패했습니다.",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">전체 태스크 달성률</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {tasks.filter((task) => task.status === "COMPLETED").length} /{" "}
              {tasks.length} 완료
            </span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} />
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-5">
          <TabsTrigger value="summary">전체 요약</TabsTrigger>
          <TabsTrigger value="yearly">연간</TabsTrigger>
          <TabsTrigger value="monthly">월간</TabsTrigger>
          <TabsTrigger value="weekly">주간</TabsTrigger>
          <TabsTrigger value="today">오늘의 To-Do</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <PlanWorkflowVisualization goal={goal} tasks={tasks} />

          <Card>
            <CardHeader>
              <CardTitle>{goal.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{goal.description || "설명 없음"}</p>
              <p>규모: {SCOPE_LABELS[goal.scope]}</p>
              <p>
                기간: {goal.startDate} ~ {goal.endDate}
              </p>
              <p>연간 계획 {goal.yearlyPlans.length}개</p>
              <p>일간 과제 {tasks.length}개</p>
            </CardContent>
          </Card>

          {goal.yearlyPlans.map((yearlyPlan) => (
            <Card key={yearlyPlan.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{yearlyPlan.year}년 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {yearlyPlan.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="yearly" className="mt-4">
          <div className="space-y-1">
            {goal.yearlyPlans.map((yearlyPlan) => (
              <TimelineCard
                key={yearlyPlan.id}
                title={`${yearlyPlan.year}년`}
                subtitle="연간 테마"
                description={yearlyPlan.summary}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <div className="space-y-1">
            {goal.yearlyPlans.flatMap((yearlyPlan) =>
              yearlyPlan.monthlyPlans.map((monthlyPlan) => (
                <TimelineCard
                  key={monthlyPlan.id}
                  title={`${monthlyPlan.year}년 ${monthlyPlan.month}월`}
                  subtitle="월간 테마"
                  description={monthlyPlan.theme}
                />
              )),
            )}
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            주차 카드를 클릭하면 해당 주의 일일 To-Do를 가로로 확인할 수
            있습니다.
          </p>
          <div className="space-y-1">
            {weeklyPlans.map((weeklyPlan) => (
              <WeeklyFocusCard
                key={weeklyPlan.id}
                weeklyPlan={weeklyPlan}
                tasks={getWeeklyTasks(weeklyPlan)}
                isSelected={selectedWeekId === weeklyPlan.id}
                onSelect={() =>
                  setSelectedWeekId((current) =>
                    current === weeklyPlan.id ? null : weeklyPlan.id,
                  )
                }
                onToggle={handleToggle}
                updatingTaskId={updatingTaskId}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="today" className="mt-4 space-y-6">
          {todayAndNearbyDates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                등록된 일간 과제가 없습니다.
              </CardContent>
            </Card>
          ) : (
            todayAndNearbyDates.map(([date, dateTasks]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    {date === today ? "오늘" : formatDisplayDate(date)}
                  </h3>
                  {date === today ? (
                    <Badge variant="outline">{formatDisplayDate(date)}</Badge>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {dateTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={handleToggle}
                      isUpdating={updatingTaskId === task.id}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center pt-2">
        <Button asChild variant="outline">
          <Link href="/">+ 새 목표 추가</Link>
        </Button>
      </div>
    </div>
  );
}
