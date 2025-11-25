import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";
import { emitOrderEvent } from "@/lib/sse-broadcaster";

export async function GET(request: NextRequest) {
  try {

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = new URL(`${baseUrl}/orders`);
    const page = request.nextUrl.searchParams.get("page");
    const size = request.nextUrl.searchParams.get("size");
    const status = request.nextUrl.searchParams.get("status");
    if (page) url.searchParams.set("page", page);
    if (size) url.searchParams.set("size", size);
    if (status) url.searchParams.set("status", status);

    const response = await proxyJson(url.toString(), request, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  } catch (e) {
    console.error("Orders API error:", e);
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

export async function PUT(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const body = await request.json();
    const orderId = body.orderId;
    const status = body.status;
    if (!orderId || !status) {
      return new Response(
        JSON.stringify({ message: "Missing orderId or status" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return proxyJson(
      `${baseUrl}/orders/${orderId}`,
      request,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        requireAuth: true,
      }
    );
  } catch (e) {
    console.error("Order update error:", e);
    return new Response(JSON.stringify({ message: "Internal Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const body = await request.json();
    const response = await proxyJson(`${baseUrl}/orders`, request, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      requireAuth: true,
    });
    try {
      if (response.status >= 200 && response.status < 300) {
        let data;
        try {
          const text = await response.clone().text();
          data = text ? JSON.parse(text) : null;
        } catch (error) {
          console.error("JSON parse error:", error);
          data = null;
        }
        emitOrderEvent({
          type: "created",
          id: data?.data?.id ?? data?.data?._id ?? null,
          at: Date.now(),
        });
      }
    } catch {}
    return response;
  } catch (e) {
    return new Response(JSON.stringify({ message: "Internal Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
