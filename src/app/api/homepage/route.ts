import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
  envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

export async function GET(request: NextRequest) {
  const response = await proxyJson(`${baseUrl}/homepage`, request, {
    method: "GET",
  });
  
  // Add cache control headers to prevent caching - always fetch fresh data
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export async function PUT(request: NextRequest) {
  const body = await request.text();
  return proxyJson(`${baseUrl}/homepage`, request, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
    requireAuth: true,
  });
}

