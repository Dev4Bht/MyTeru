import { NextResponse } from "next/server";
import { AuthResponse } from "@druksave/shared";
import { callApi } from "@/lib/server/api-proxy";
import { respondWithSession } from "@/lib/server/auth-cookie";

export async function POST(request: Request) {
  const body = await request.json();
  const { status, data } = await callApi<AuthResponse>("/auth/otp/verify", body);

  if (status >= 200 && status < 300 && "tokens" in data) {
    return respondWithSession(data, status);
  }

  return NextResponse.json(data, { status });
}
