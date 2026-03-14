import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function GET(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = new URL(`${baseUrl}/products`);
    
    // Copy search params
    const searchParams = request.nextUrl.searchParams;
    for (const [key, value] of searchParams.entries()) {
      url.searchParams.set(key, value);
    }

    const response = await proxyJson(url.toString(), request, {
      method: "GET",
      requireAuth: false, // Public endpoint
    });

    return response;
  } catch (e) {
    console.error("Products API error:", e);
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


// NOTE: POST (create product) được xử lý bởi /api/products/create/route.ts
// để tránh duplicate và đảm bảo auth cookie hoạt động đúng cách.
