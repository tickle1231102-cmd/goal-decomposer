import type { User } from "@supabase/supabase-js";

import { AppHeader } from "@/components/AppHeader";

type AppShellProps = {
  user: User;
  children: React.ReactNode;
  mainClassName?: string;
};

export function AppShell({ user, children, mainClassName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className={mainClassName ?? "mx-auto max-w-5xl px-4 pb-12 pt-20 sm:px-6 sm:pt-24"}>
        {children}
      </main>
    </div>
  );
}
