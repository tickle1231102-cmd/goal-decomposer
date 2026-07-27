import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { buildAuthCallbackUrl, getAppOrigin } from "@/lib/auth-url";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = searchParams.get("next") ?? "/home";
  const origin = getAppOrigin(request);
  const redirectTo = buildAuthCallbackUrl(origin, next);

  let cookieCarrier = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            cookieCarrier.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    console.error("[GET /auth/login]", error?.message);
    return NextResponse.redirect(`${origin}/?error=auth_start_failed`);
  }

  const oauthRedirect = NextResponse.redirect(data.url);
  cookieCarrier.cookies.getAll().forEach((cookie) => {
    oauthRedirect.cookies.set(cookie.name, cookie.value);
  });

  return oauthRedirect;
}
