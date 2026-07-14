export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string; // ISO 8601
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: "USER" | "SUPPORT" | "ADMIN";
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
