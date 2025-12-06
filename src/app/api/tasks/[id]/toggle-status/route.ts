import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    const response = await proxyJson(
      `${baseUrl}/tasks/${id}/toggle-status`,
      request,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        requireAuth: true,
      }
    );

    return response;
  } catch (e) {
    console.error("Toggle task status error:", e);
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

