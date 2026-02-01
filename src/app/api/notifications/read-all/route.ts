import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function PUT(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = `${baseUrl}/notifications/read-all`;

    const response = await proxyJson(url, request, {
      method: "PUT",
      requireAuth: true,
    });

    return response;
  } catch (e) {
    console.error("Mark all notifications as read API error:", e);
    return new Response(
      JSON.stringify({
        success: false,
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

