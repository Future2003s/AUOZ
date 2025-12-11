import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function GET(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = new URL(`${baseUrl}/invoice`);
    
    // Copy search params
    const searchParams = request.nextUrl.searchParams;
    for (const [key, value] of searchParams.entries()) {
      url.searchParams.set(key, value);
    }

    const response = await proxyJson(url.toString(), request, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  } catch (e) {
    console.error("Invoice API error:", e);
    return new Response(
      JSON.stringify({
        message: "Internal Error",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = `${baseUrl}/invoice`;
    const body = await request.json();

    const response = await proxyJson(url, request, {
      method: "POST",
      requireAuth: true,
      body: JSON.stringify(body),
    });

    return response;
  } catch (e) {
    console.error("Create Invoice API error:", e);
    return new Response(
      JSON.stringify({
        message: "Internal Error",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

