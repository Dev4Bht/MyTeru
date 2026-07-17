const API_ORIGIN = process.env.API_BASE_URL ?? "http://localhost:4000";
const API_PREFIX = process.env.API_GLOBAL_PREFIX ?? "api";

// Generous enough for a cold-started free-tier instance to wake up and
// respond, but bounded so a genuinely unreachable API fails predictably
// instead of hanging until some opaque platform-level timeout.
const REQUEST_TIMEOUT_MS = 45_000;

export const REFRESH_COOKIE_NAME = "druksave_refresh_token";
export const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Server-side-only helper: forwards a request body to the NestJS API. Used
 * by the Next.js route handlers under /api/auth/* so the browser never
 * talks to the NestJS API (or refresh tokens) directly — refresh tokens are
 * kept in an httpOnly cookie instead of browser-accessible storage.
 */
export async function callApi<TResponse>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ status: number; data: TResponse }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_ORIGIN}/${API_PREFIX}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as TResponse;
    return { status: response.status, data };
  } catch {
    // fetch() itself threw — the API was unreachable or didn't respond in
    // time, most often because a free-tier instance was asleep and is still
    // waking up. Surface a real message instead of letting this propagate
    // as an unhandled exception (which Next.js would turn into its own
    // generic error page, showing up client-side as "Something went wrong").
    return {
      status: 503,
      data: { message: "The server is starting up — please try again in a few seconds." } as TResponse,
    };
  } finally {
    clearTimeout(timeout);
  }
}
