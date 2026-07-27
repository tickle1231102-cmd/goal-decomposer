import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";

import { GoalForm } from "@/components/GoalForm";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const SCOPE_LABELS = {
  SHORT_TERM: "단기",
  MID_TERM: "중기",
  LONG_TERM: "장기",
} as const;

async function getRecentGoals() {
  return prisma.goal.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      scope: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
  });
}

export default async function Home() {
  const recentGoals = await getRecentGoals();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Target className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Goal Decomposer
            </span>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            AI Action Planner
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <section className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-primary uppercase">
            Goal → Year → Month → Week → Day
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            목표만 입력하세요, AI가 오늘 할 일까지 실행 로드맵을 그려드립니다
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground text-pretty">
            장기 목표를 연·월·주·일 단위로 자동 분해하고, 오늘의 To-Do부터
            바로 실행할 수 있습니다.
          </p>
        </section>

        <section className="mx-auto flex justify-center">
          <GoalForm />
        </section>

        <section className="mx-auto mt-16 max-w-2xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                최근 생성한 목표
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                이전에 만든 액션플랜을 이어서 확인하세요.
              </p>
            </div>
          </div>

          {recentGoals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                아직 생성된 목표가 없습니다. 위 폼에서 첫 목표를 만들어보세요.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentGoals.map((goal) => (
                <Link key={goal.id} href={`/goals/${goal.id}`} className="block">
                  <Card className="transition-colors hover:bg-muted/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="truncate text-base">
                            {goal.title}
                          </CardTitle>
                          <CardDescription>
                            {goal.startDate.toISOString().slice(0, 10)} ~{" "}
                            {goal.endDate.toISOString().slice(0, 10)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
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
                        생성
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
        </section>
      </main>
    </div>
  );
}
