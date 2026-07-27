import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SCOPE_LABELS = {
  SHORT_TERM: "단기",
  MID_TERM: "중기",
  LONG_TERM: "장기",
} as const;

async function getAllGoals(userId: string) {
  return prisma.goal.findMany({
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
}

export default async function GoalsPage() {
  const user = await requireCurrentUser();

  if (!user) {
    notFound();
  }

  const goals = await getAllGoals(user.id);

  return (
    <AppShell user={user}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">목표 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            생성한 모든 목표와 액션플랜을 확인하세요.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/">
            <Plus className="size-4" />
            새 목표 추가
          </Link>
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              아직 생성된 목표가 없습니다.
            </p>
            <Button asChild className="mt-4">
              <Link href="/">첫 목표 만들기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <Link key={goal.id} href={`/goals/${goal.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      {goal.description ? (
                        <CardDescription className="line-clamp-2">
                          {goal.description}
                        </CardDescription>
                      ) : null}
                      <CardDescription>
                        {goal.startDate.toISOString().slice(0, 10)} ~{" "}
                        {goal.endDate.toISOString().slice(0, 10)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {SCOPE_LABELS[goal.scope]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0 text-xs text-muted-foreground">
                  <span>
                    {goal.createdAt.toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    생성 · 연간 계획 {goal._count.yearlyPlans}개
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    플랜 보기
                    <ArrowRight className="size-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
