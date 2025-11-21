import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
  envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: ParamsContext) {
  const { id } = await params;
  return proxyJson(`${baseUrl}/activities/${id}`, request, {
    method: "GET",
  });
}

export async function PUT(request: NextRequest, { params }: ParamsContext) {
  const { id } = await params;
  const body = await request.text();
  return proxyJson(`${baseUrl}/activities/${id}`, request, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
    requireAuth: true,
  });
}

export async function DELETE(request: NextRequest, { params }: ParamsContext) {
  const { id } = await params;
  return proxyJson(`${baseUrl}/activities/${id}`, request, {
    method: "DELETE",
    requireAuth: true,
  });
}

export async function PATCH(request: NextRequest, { params }: ParamsContext) {
  const { id } = await params;
  const body = await request.text();
  return proxyJson(`${baseUrl}/activities/${id}/toggle`, request, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
    requireAuth: true,
  });
}
