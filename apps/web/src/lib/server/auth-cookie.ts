import { NextResponse } from "next/server";
import { AuthResponse } from "@druksave/shared";
import { REFRESH_COOKIE_MAX_AGE_SECONDS, REFRESH_COOKIE_NAME } from "./api-proxy";

/**
 * Strips the refresh token out of an AuthResponse before it reaches the
 * browser, and sets it as an httpOnly cookie instead.
 */
export function respondWithSession(data: AuthResponse, status = 200): NextResponse {
  const { tokens, user } = data;
  const response = NextResponse.json(
    {
      user,
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    },
    { status },
  );

  response.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(REFRESH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
