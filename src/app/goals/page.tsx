import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { GoalsList } from "@/components/GoalsSidebar";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth";
import { getGoalsForUser } from "@/lib/goals-list";

export default async function GoalsPage() {
  const user = await requireCurrentUser();

  if (!user) {
    notFound();
  }

  const goals = await getGoalsForUser(user.id);

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

      <GoalsList goals={goals} />
    </AppShell>
  );
}
