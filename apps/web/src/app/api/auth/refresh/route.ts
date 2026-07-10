import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AuthResponse } from "@druksave/shared";
import { callApi, REFRESH_COOKIE_NAME } from "@/lib/server/api-proxy";
import { respondWithSession } from "@/lib/server/auth-cookie";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No active session" }, { status: 401 });
  }

  const { status, data } = await callApi<AuthResponse>("/auth/refresh", { refreshToken });

  if (status >= 200 && status < 300 && "tokens" in data) {
    return respondWithSession(data, status);
  }

  return NextResponse.json(data, { status });
}
