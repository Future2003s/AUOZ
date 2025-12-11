import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function GET(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = `${baseUrl}/delivery/new`;

    console.log("Fetching draft order from:", url);

    const response = await proxyJson(url, request, {
      method: "GET",
      requireAuth: true,
    });

    // Log response for debugging
    const responseClone = response.clone();
    const responseData = await responseClone.json().catch(() => ({}));
    console.log("Delivery New API response:", {
      status: response.status,
      data: responseData
    });

    return response;
  } catch (e) {
    console.error("Delivery New API error:", e);
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

