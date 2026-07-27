import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAppOrigin } from "@/lib/auth-url";

export async function GET(request: NextRequest) {
  const origin = getAppOrigin(request);
  let response = NextResponse.redirect(`${origin}/?error=guest_failed`);

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
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error("[GET /auth/guest]", error.message);

    const errorCode = error.message.toLowerCase().includes("anonymous")
      ? "guest_disabled"
      : "guest_failed";

    return NextResponse.redirect(`${origin}/?error=${errorCode}`);
  }

  // Keep Set-Cookie headers from signInAnonymously on the success redirect.
  return NextResponse.redirect(`${origin}/`, {
    headers: response.headers,
  });
}
