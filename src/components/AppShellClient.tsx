"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Target } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { GoalsSidebar } from "@/components/GoalsSidebar";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import type { GoalListItem } from "@/lib/goals-list";
import { getUserDisplayInfo } from "@/lib/user-display";
import { cn } from "@/lib/utils";

type AppShellClientProps = {
  user: User;
  goals: GoalListItem[];
  children: React.ReactNode;
  mainClassName?: string;
};

export function AppShellClient({
  user,
  goals,
  children,
  mainClassName,
}: AppShellClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profile = getUserDisplayInfo(user);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((current) => !current);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSidebar();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen, closeSidebar]);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-[60] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            title={sidebarOpen ? "목표 목록 닫기" : "목표 목록 열기"}
            aria-expanded={sidebarOpen}
            aria-controls="goals-sidebar"
            onClick={toggleSidebar}
          >
            <Menu className={cn("size-5 transition-transform", sidebarOpen && "scale-90")} />
            <span className="sr-only">목표 목록</span>
          </Button>

          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:flex-none sm:justify-start"
            onClick={closeSidebar}
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

      <GoalsSidebar open={sidebarOpen} goals={goals} onClose={closeSidebar} />

      <main
        className={
          mainClassName ?? "mx-auto max-w-5xl px-4 pb-12 pt-20 sm:px-6 sm:pt-24"
        }
      >
        {children}
      </main>
    </div>
  );
}
