import { Suspense } from "react";

import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          <section className="text-center">
            <p className="mb-2 text-sm font-medium tracking-wide text-primary uppercase">
              Goal → Year → Month → Week → Day
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
              로그인하고 목표 실행을 시작하세요
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Google 계정으로 로그인하거나 게스트 모드로 바로 체험할 수
              있습니다.
            </p>
          </section>

          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
