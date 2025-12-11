import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function GET(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = new URL(`${baseUrl}/delivery`);
    
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
    console.error("Delivery API error:", e);
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
    const url = `${baseUrl}/delivery`;
    const body = await request.json();

    // Debug: ensure proofImage is forwarded
    console.log("[FE proxy] /api/delivery POST payload keys:", Object.keys(body || {}));
    if (body?.proofImage) {
      console.log("[FE proxy] proofImage present:", body.proofImage);
    } else {
      console.warn("[FE proxy] proofImage missing in body");
    }

    const response = await proxyJson(url, request, {
      method: "POST",
      requireAuth: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return response;
  } catch (e) {
    console.error("Delivery API error:", e);
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

