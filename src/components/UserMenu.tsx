"use client";

import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  email: string | null | undefined;
  fullName: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  compact?: boolean;
};

export function UserMenu({
  email,
  fullName,
  avatarUrl,
  isGuest,
  compact = false,
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
    <div className={cn("flex items-center gap-2", compact && "gap-1.5")}>
      {!compact ? (
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {isGuest ? (
            <Badge variant="outline" className="mt-0.5 text-[10px]">
              게스트
            </Badge>
          ) : email ? (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          ) : null}
        </div>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-full"
        onClick={handleSignOut}
        title="로그아웃"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-4 text-muted-foreground" />
          </span>
        )}
        <span className="sr-only">로그아웃</span>
      </Button>
    </div>
  );
}
