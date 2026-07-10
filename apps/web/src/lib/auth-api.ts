import { AuthenticatedUser, OtpChallengeResponse } from "@druksave/shared";

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
  signup: (input: { fullName: string; phone: string; email?: string; password: string; confirmPassword: string; deviceId: string }) =>
    post<OtpChallengeResponse>("/api/auth/signup", input),

  verifyOtp: (input: { phone: string; code: string; purpose: string; deviceId: string }) =>
    post<SessionResponse | OtpChallengeResponse>("/api/auth/otp/verify", input),

  resendOtp: (input: { phone: string; purpose: string; deviceId: string }) =>
    post<OtpChallengeResponse>("/api/auth/otp/resend", input),

  login: (input: { phone: string; password: string; deviceId: string }) =>
    post<SessionResponse | OtpChallengeResponse>("/api/auth/login", input),

  logout: () => post<{ success: boolean }>("/api/auth/logout", {}),

  forgotPassword: (input: { phone: string }) =>
    post<OtpChallengeResponse>("/api/auth/password/forgot", input),

  resetPassword: (input: { phone: string; code: string; newPassword: string; confirmPassword: string }) =>
    post<{ success: boolean }>("/api/auth/password/reset", input),
};

export function isSessionResponse(data: SessionResponse | OtpChallengeResponse): data is SessionResponse {
  return "accessToken" in data;
}
