const API_ORIGIN = process.env.API_BASE_URL ?? "http://localhost:4000";
const API_PREFIX = process.env.API_GLOBAL_PREFIX ?? "api";

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
  const response = await fetch(`${API_ORIGIN}/${API_PREFIX}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as TResponse;
  return { status: response.status, data };
}
