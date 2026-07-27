/**
 * Canonical app URL for OAuth redirects.
 * Set NEXT_PUBLIC_APP_URL in production (Vercel) to this app's domain.
 */
export function getConfiguredAppUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
}

export function getAppOrigin(request: Request): string {
  const configured = getConfiguredAppUrl();
  if (configured) {
    return configured;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

/** Client-side: prefer live origin when env points to a different host. */
export function getClientAppOrigin(): string {
  if (typeof window === "undefined") {
    return getConfiguredAppUrl() ?? "";
  }

  const configured = getConfiguredAppUrl();
  if (configured) {
    try {
      if (new URL(configured).host === window.location.host) {
        return configured;
      }
    } catch {
      // ignore invalid configured URL
    }
  }

  return window.location.origin;
}

export function buildAuthCallbackUrl(origin: string, nextPath = "/home"): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
