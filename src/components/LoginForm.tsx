"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildAuthCallbackUrl, getClientAppOrigin } from "@/lib/auth-url";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const authError = searchParams.get("error");
    if (authError === "auth_callback_failed") {
      return "Google 로그인에 실패했습니다. 다시 시도해주세요.";
    }
    if (authError === "auth_start_failed") {
      return "Google 로그인을 시작하지 못했습니다. Supabase Redirect URL 설정을 확인해주세요.";
    }
    return null;
  });

  async function handleGoogleLogin() {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const supabase = createClient();
      const origin = getClientAppOrigin();
      const redirectTo = buildAuthCallbackUrl(origin, "/home");

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (oauthError || !data.url) {
        throw oauthError ?? new Error("Google 로그인 URL을 받지 못했습니다.");
      }

      window.location.assign(data.url);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Google 로그인에 실패했습니다.",
      );
      setIsGoogleLoading(false);
    }
  }

  async function handleGuestLogin() {
    setError(null);
    setIsGuestLoading(true);

    try {
      const supabase = createClient();

      const { error: guestError } = await supabase.auth.signInAnonymously();

      if (guestError) {
        throw guestError;
      }

      router.push("/home");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "게스트 모드 시작에 실패했습니다.",
      );
    } finally {
      setIsGuestLoading(false);
    }
  }

  const isLoading = isGoogleLoading || isGuestLoading;

  return (
    <Card className="mx-auto w-full max-w-md border-border/60 shadow-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Target className="size-6" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">Goal Decomposer</CardTitle>
          <CardDescription className="text-base leading-6">
            목표를 연·월·주·일 단위로 분해하는 AI 액션 플래너
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-center gap-3 text-base"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Google 계정으로 계속하기
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full text-base"
          onClick={handleGuestLogin}
          disabled={isLoading}
        >
          {isGuestLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              게스트 모드 시작 중...
            </>
          ) : (
            "게스트로 둘러보기"
          )}
        </Button>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          게스트 모드는 가입 없이 기능을 체험할 수 있습니다. 데이터는 이
          브라우저 세션에만 저장됩니다.
        </p>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
