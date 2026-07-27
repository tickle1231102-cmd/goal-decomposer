import type { User } from "@supabase/supabase-js";

import { AppShellClient } from "@/components/AppShellClient";
import { getGoalsForUser } from "@/lib/goals-list";

type AppShellProps = {
  user: User;
  children: React.ReactNode;
  mainClassName?: string;
};

export async function AppShell({ user, children, mainClassName }: AppShellProps) {
  const goals = await getGoalsForUser(user.id);

  return (
    <AppShellClient user={user} goals={goals} mainClassName={mainClassName}>
      {children}
    </AppShellClient>
  );
}
