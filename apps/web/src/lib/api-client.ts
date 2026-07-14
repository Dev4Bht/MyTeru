import { hydrateSession, useAuthStore } from "@/lib/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  params?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, params?: ApiFetchOptions["params"]): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function rawFetch(path: string, options: ApiFetchOptions, accessToken: string | null) {
  return fetch(buildUrl(path, options.params), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

/**
 * Calls the NestJS API directly from the browser (no Next.js proxy — unlike
 * auth, these endpoints have no refresh token to keep out of client JS). On
 * a 401 (expired access token), silently refreshes once via the httpOnly
 * cookie and retries before giving up and clearing the session, which the
 * dashboard layout's auth guard picks up and redirects to /login for.
 */
export async function apiFetch<TResponse>(path: string, options: ApiFetchOptions = {}): Promise<TResponse> {
  let accessToken = useAuthStore.getState().accessToken;
  let response = await rawFetch(path, options, accessToken);

  if (response.status === 401) {
    await hydrateSession();
    accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      response = await rawFetch(path, options, accessToken);
    }
  }

  if (response.status === 401) {
    useAuthStore.getState().clearSession();
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : (data?.message ?? "Something went wrong");
    throw new ApiError(message, response.status);
  }

  return data as TResponse;
}
