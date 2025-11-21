import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
  envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.text();
  return proxyJson(`${baseUrl}/news/admin/${params.id}`, request, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
    requireAuth: true,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyJson(`${baseUrl}/news/admin/${params.id}`, request, {
    method: "DELETE",
    requireAuth: true,
  });
}

