import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";
import { emitOrderEvent } from "@/lib/sse-broadcaster";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const url = `${envConfig.NEXT_PUBLIC_BACKEND_URL}/api/${envConfig.NEXT_PUBLIC_API_VERSION}/orders/${id}/status`;

    // Log request details for debugging

    const response = await proxyJson(url, request, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      requireAuth: true,
    });

    // Log the response for debugging

    if (response.status >= 200 && response.status < 300) {
      try {
        emitOrderEvent({
          type: "updated",
          id,
          status: body?.status,
          at: Date.now(),
        });
      } catch (err) {
        console.error("Failed to emit order update event:", err);
      }
    }

    return response;
  } catch (e) {
    console.error("Order status update error:", e);
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
