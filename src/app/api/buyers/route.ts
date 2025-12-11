import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = new URL(`${baseUrl}/buyers`);
    
    // Copy search params
    const searchParams = request.nextUrl.searchParams;
    for (const [key, value] of searchParams.entries()) {
      url.searchParams.set(key, value);
    }

    const response = await proxyJson(url.toString(), request, {
      method: "GET",
      requireAuth: true,
    });

    // Clone response to read body and add cache-control headers
    const responseClone = response.clone();
    let responseData: any;
    try {
      const text = await responseClone.text();
      responseData = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Failed to parse buyers response:", e);
      responseData = {};
    }
    
    // Create new response with cache-control headers
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers,
    });
  } catch (e) {
    console.error("Buyers API error:", e);
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
    const url = `${baseUrl}/buyers`;
    const body = await request.json();

    console.log("Creating buyer with data:", body);

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
    console.log("Create Buyer API response:", {
      status: response.status,
      data: responseData
    });

    return response;
  } catch (e) {
    console.error("Create Buyer API error:", e);
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

