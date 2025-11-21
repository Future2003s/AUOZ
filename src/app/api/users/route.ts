import { NextRequest } from "next/server";
import { envConfig } from "@/config";
import { proxyJson } from "@/lib/next-api-auth";

export async function GET(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    
    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    
    const url = new URL(`${baseUrl}/admin/users`);
    url.searchParams.set("page", page);
    url.searchParams.set("limit", limit);

    console.log("Admin Users API URL:", url.toString());

    const response = await proxyJson(url.toString(), request, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  } catch (e) {
    console.error("Admin Users API error:", e);
    return new Response(
      JSON.stringify({
        data: [],
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
    const url = `${baseUrl}/admin/users`;

    const body = await request.json();

    const response = await proxyJson(url, request, {
      method: "POST",
      requireAuth: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return response;
  } catch (e) {
    console.error("Create user API error:", e);
    return new Response(
      JSON.stringify({
        message: "Internal Error",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
