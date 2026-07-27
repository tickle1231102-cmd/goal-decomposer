/**
 * Resolve this app's public origin for OAuth callbacks.
 * Follows Supabase guidance for Vercel deployments.
 */
function normalizeOrigin(value: string): string {
  let url = value.trim().replace(/\/$/, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, "");
}

function readConfiguredSiteUrl(): string | undefined {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL;

  if (!siteUrl) {
    return undefined;
  }

  return normalizeOrigin(siteUrl);
}

function hostsMatch(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

export function getAppOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    const liveOrigin = normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
    const configured = readConfiguredSiteUrl();

    if (!configured) {
      return liveOrigin;
    }

    try {
      const configuredHost = new URL(configured).host;

      if (
        configuredHost.startsWith("localhost") ||
        configuredHost.startsWith("127.0.0.1")
      ) {
        return liveOrigin;
      }
    } catch {
      return liveOrigin;
    }

    return hostsMatch(configured, liveOrigin) ? configured : liveOrigin;
  }

  const configured = readConfiguredSiteUrl();
  if (configured) {
    return configured;
  }

  return normalizeOrigin(new URL(request.url).origin);
}

/** Client-side origin for OAuth — always prefer the current browser host. */
export function getClientAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return readConfiguredSiteUrl() ?? "";
}

export function buildAuthCallbackUrl(origin: string, nextPath = "/"): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

export const REQUIRED_SUPABASE_REDIRECT_URLS = [
  "https://goal-decomposer-self.vercel.app/auth/callback",
  "https://goal-decomposer-self.vercel.app/**",
  "http://localhost:3000/auth/callback",
  "http://localhost:3000/**",
  "https://*-goal-decomposer*.vercel.app/**",
] as const;
