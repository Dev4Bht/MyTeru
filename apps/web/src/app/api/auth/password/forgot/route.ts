import { NextResponse } from "next/server";
import { callApi } from "@/lib/server/api-proxy";

export async function POST(request: Request) {
  const body = await request.json();
  const { status, data } = await callApi("/auth/password/forgot", body);
  return NextResponse.json(data, { status });
}
