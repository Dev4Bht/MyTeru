import { AuthenticatedUser } from "@druksave/shared";

export interface SessionResponse {
  user: AuthenticatedUser;
  accessToken: string;
  accessTokenExpiresAt: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function post<TResponse>(path: string, body: Record<string, unknown>): Promise<TResponse> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : (data?.message ?? "Something went wrong");
    throw new ApiError(message, response.status);
  }

  return data as TResponse;
}

export const authApi = {
  signup: (input: { fullName: string; email: string; password: string; confirmPassword: string; deviceId: string }) =>
    post<SessionResponse>("/api/auth/signup", input),

  login: (input: { email: string; password: string; deviceId: string }) =>
    post<SessionResponse>("/api/auth/login", input),

  logout: () => post<{ success: boolean }>("/api/auth/logout", {}),
};
