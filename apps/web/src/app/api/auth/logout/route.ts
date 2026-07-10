import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callApi, REFRESH_COOKIE_NAME } from "@/lib/server/api-proxy";
import { clearSessionCookie } from "@/lib/server/auth-cookie";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    await callApi("/auth/logout", { refreshToken });
  }

  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}
