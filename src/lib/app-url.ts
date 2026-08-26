import { headers } from "next/headers";

function normalize(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function isLocal(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url);
}

/**
 * Absolute base URL for links we send outside the app (Slack, email).
 *
 * Prefers NEXT_PUBLIC_APP_URL, but falls back to the host of the incoming
 * request so links still work on deployments where that env var was never
 * set — otherwise every link points at http://localhost:3000.
 */
export async function getAppUrl(): Promise<string> {
  const configured = normalize(process.env.NEXT_PUBLIC_APP_URL);
  const configuredIsUsable =
    configured && (process.env.NODE_ENV !== "production" || !isLocal(configured));

  if (configuredIsUsable) return configured;

  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");

    if (host) {
      const protocol =
        requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim() ||
        (/^(localhost|127\.0\.0\.1)(:|$)/i.test(host) ? "http" : "https");
      return normalize(`${protocol}://${host}`)!;
    }
  } catch {
    // Called outside of a request (e.g. a background job) — fall through.
  }

  const vercelUrl = normalize(
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  );
  if (vercelUrl) return vercelUrl;

  return configured || "http://localhost:3000";
}
