import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
  envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const url = `${baseUrl}/complaints/requests${qs ? `?${qs}` : ""}`;
  return proxyJson(url, request, {
    method: "GET",
    requireAuth: true,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyJson(`${baseUrl}/complaints/requests`, request, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

