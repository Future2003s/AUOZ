import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { API_CONFIG } from "@/lib/api-config";

export async function POST(request: NextRequest) {
  let serializedBody: string | undefined;
  try {
    const body = await request.json();
    serializedBody = JSON.stringify(body ?? {});
  } catch {
    serializedBody = undefined;
  }

  const backendUrl = `${API_CONFIG.API_BASE_URL}${API_CONFIG.COMMENTS.CREATE}`;

  return proxyJson(backendUrl, request, {
    method: "POST",
    requireAuth: true,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: serializedBody ?? "{}",
  });
}

