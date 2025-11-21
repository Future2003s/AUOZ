import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
  envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const body = await request.text();
  return proxyJson(`${baseUrl}/complaints/requests/${params.id}`, request, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
    requireAuth: true,
  });
}

