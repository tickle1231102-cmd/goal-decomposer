"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  email: string | null | undefined;
  fullName: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  compact?: boolean;
};

function UserAvatar({
  avatarUrl,
  displayName,
  className,
}: {
  avatarUrl: string | null;
  displayName: string;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-muted",
        className,
      )}
    >
      <UserRound className="size-4 text-muted-foreground" />
    </span>
  );
}

export function UserMenu({
  email,
  fullName,
  avatarUrl,
  isGuest,
  compact = false,
}: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const displayName = fullName ?? email ?? (isGuest ? "게스트" : "사용자");

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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

        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            title="회원 정보"
          >
            <UserAvatar
              avatarUrl={avatarUrl}
              displayName={displayName}
              className="size-8"
            />
            <span className="sr-only">회원 정보</span>
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={avatarUrl}
              displayName={displayName}
              className="size-10"
            />
            <PopoverHeader className="min-w-0 gap-1">
              <PopoverTitle className="truncate">{displayName}</PopoverTitle>
              {email ? (
                <PopoverDescription className="truncate">
                  {email}
                </PopoverDescription>
              ) : (
                <PopoverDescription>
                  {isGuest ? "게스트 계정" : "로그인 계정"}
                </PopoverDescription>
              )}
            </PopoverHeader>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">계정 유형</span>
              <Badge variant={isGuest ? "outline" : "secondary"}>
                {isGuest ? "게스트" : "Google"}
              </Badge>
            </div>
            {fullName ? (
              <div className="flex items-start justify-between gap-2">
                <span className="shrink-0 text-muted-foreground">이름</span>
                <span className="text-right font-medium">{fullName}</span>
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="size-4" />
            {isSigningOut ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
