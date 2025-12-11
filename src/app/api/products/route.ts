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

export async function POST(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = `${baseUrl}/products`;
    const body = await request.json();

    console.log("Creating product with data:", body);

    const response = await proxyJson(url, request, {
      method: "POST",
      requireAuth: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Log response for debugging
    const responseClone = response.clone();
    const responseData = await responseClone.json().catch(() => ({}));
    console.log("Create Product API response:", {
      status: response.status,
      data: responseData
    });

    return response;
  } catch (e) {
    console.error("Create Product API error:", e);
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

