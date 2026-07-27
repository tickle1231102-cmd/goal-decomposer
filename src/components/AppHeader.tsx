import Link from "next/link";
import { Menu, Target } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { getUserDisplayInfo } from "@/lib/user-display";

type AppHeaderProps = {
  user: User;
};

export function AppHeader({ user }: AppHeaderProps) {
  const profile = getUserDisplayInfo(user);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="shrink-0"
          title="목표 관리"
        >
          <Link href="/goals">
            <Menu className="size-5" />
            <span className="sr-only">목표 관리</span>
          </Link>
        </Button>

        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:flex-none sm:justify-start"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Target className="size-4" />
          </div>
          <span className="truncate text-sm font-semibold tracking-tight">
            Goal Decomposer
          </span>
        </Link>

        <div className="ml-auto shrink-0">
          <UserMenu
            email={profile.email}
            fullName={profile.fullName}
            avatarUrl={profile.avatarUrl}
            isGuest={profile.isGuest}
            compact
          />
        </div>
      </div>
    </header>
  );
}
