import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
  envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Đảm bảo chỉ lấy published articles cho public API
  // Trừ khi có query param status được chỉ định rõ ràng (cho admin)
  if (!searchParams.has("status")) {
    searchParams.set("status", "published");
  }
  
  const qs = searchParams.toString();
  const url = `${baseUrl}/news${qs ? `?${qs}` : ""}`;
  return proxyJson(url, request, {
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyJson(`${baseUrl}/news`, request, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    requireAuth: true,
  });
}

