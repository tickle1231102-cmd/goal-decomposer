"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GOAL_SCOPE_LABELS, type GoalListItem } from "@/lib/goals-list";
import { cn } from "@/lib/utils";

type GoalsListProps = {
  goals: GoalListItem[];
  onNavigate?: () => void;
  compact?: boolean;
};

export function GoalsList({ goals, onNavigate, compact = false }: GoalsListProps) {
  const pathname = usePathname();

  if (goals.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          아직 생성된 목표가 없습니다.
        </p>
        <Button asChild className="mt-4" size="sm" onClick={onNavigate}>
          <Link href="/">첫 목표 만들기</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className={cn("space-y-2", compact && "space-y-1.5")}>
      {goals.map((goal) => {
        const isActive = pathname === `/goals/${goal.id}`;

        return (
          <li key={goal.id}>
            <Link
              href={`/goals/${goal.id}`}
              onClick={onNavigate}
              className={cn(
                "block rounded-lg border p-3 transition-colors hover:bg-muted/40",
                isActive && "border-primary/40 bg-primary/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{goal.title}</p>
                  {!compact && goal.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {goal.description}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {goal.startDate} ~ {goal.endDate}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {GOAL_SCOPE_LABELS[goal.scope]}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(goal.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  생성
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  플랜 보기
                  <ArrowRight className="size-3" />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type GoalsSidebarProps = {
  open: boolean;
  goals: GoalListItem[];
  onClose: () => void;
};

export function GoalsSidebar({ open, goals, onClose }: GoalsSidebarProps) {
  return (
    <>
      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        id="goals-sidebar"
        aria-hidden={!open}
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-[min(100vw-3rem,20rem)] flex-col border-r bg-background shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:h-16">
          <div>
            <h2 className="text-sm font-semibold">목표 관리</h2>
            <p className="text-xs text-muted-foreground">
              {goals.length}개의 목표
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="닫기"
          >
            <X className="size-5" />
            <span className="sr-only">닫기</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <GoalsList goals={goals} onNavigate={onClose} compact />
        </div>

        <div className="shrink-0 border-t p-4">
          <Button asChild className="w-full" size="sm" onClick={onClose}>
            <Link href="/">
              <Plus className="size-4" />
              새 목표 추가
            </Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
