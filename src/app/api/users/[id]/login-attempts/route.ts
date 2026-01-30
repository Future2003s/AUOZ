import { NextRequest } from "next/server";
import { envConfig } from "@/config";
import { proxyJson } from "@/lib/next-api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams?.id;

    if (!id) {
      return new Response(
        JSON.stringify({ message: "User ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = `${baseUrl}/admin/users/${id}/login-attempts`;

    const response = await proxyJson(url, request, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  } catch (e) {
    console.error("Get login attempts API error:", e);
    return new Response(
      JSON.stringify({
        message: "Internal Error",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

