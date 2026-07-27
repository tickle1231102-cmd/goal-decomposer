import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { PlanDashboard } from "@/components/PlanDashboard";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/plan-types";

type GoalPageProps = {
  params: Promise<{ id: string }>;
};

async function getGoalWithActionPlan(id: string) {
  return prisma.goal.findUnique({
    where: { id },
    include: {
      yearlyPlans: {
        orderBy: { year: "asc" },
        include: {
          monthlyPlans: {
            orderBy: { month: "asc" },
            include: {
              weeklyPlans: {
                orderBy: { weekNumber: "asc" },
                include: {
                  dailyTasks: {
                    orderBy: { date: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export default async function GoalPage({ params }: GoalPageProps) {
  const { id } = await params;
  const goal = await getGoalWithActionPlan(id);

  if (!goal) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{goal.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            생성된 액션플랜을 기간별로 확인하고 오늘의 과제를 관리하세요.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/">
            <Plus className="size-4" />
            새 목표 추가
          </Link>
        </Button>
      </div>
      <PlanDashboard goal={serializeGoal(goal)} />
    </main>
  );
}
