import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function GET(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    const url = new URL(`${baseUrl}/reports/dashboard`);

    // Forward any query params (e.g., range)
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    return proxyJson(url.toString(), request, {
      method: "GET",
      requireAuth: true,
    });
  } catch (error) {
    console.error("Analytics summary proxy error:", error);
    return new Response(
      JSON.stringify({
        message: "Internal Error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
