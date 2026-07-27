"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type UserMenuProps = {
  email: string | null | undefined;
  fullName: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
};

export function UserMenu({
  email,
  fullName,
  avatarUrl,
  isGuest,
}: UserMenuProps) {
  const router = useRouter();
  const displayName = fullName ?? email ?? (isGuest ? "게스트" : "사용자");

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 sm:flex">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {isGuest ? (
            <Badge variant="outline" className="mt-0.5 text-[10px]">
              게스트
            </Badge>
          ) : email ? (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          ) : null}
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon-sm" onClick={handleSignOut}>
        <LogOut className="size-4" />
        <span className="sr-only">로그아웃</span>
      </Button>
    </div>
  );
}
