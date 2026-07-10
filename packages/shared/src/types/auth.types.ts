export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string; // ISO 8601
}

export interface AuthenticatedUser {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  role: "USER" | "SUPPORT" | "ADMIN";
  isPhoneVerified: boolean;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export interface OtpChallengeResponse {
  phone: string;
  purpose: "SIGNUP" | "LOGIN" | "PASSWORD_RESET" | "CHANGE_PHONE";
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}
