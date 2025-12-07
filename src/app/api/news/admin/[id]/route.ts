import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
  envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: ParamsContext) {
  const { id } = await params;
  const qs = request.nextUrl.searchParams.toString();
  return proxyJson(`${baseUrl}/news/admin/${id}${qs ? `?${qs}` : ""}`, request, {
    method: "GET",
    requireAuth: true,
  });
}

export async function PUT(request: NextRequest, { params }: ParamsContext) {
  const { id } = await params;
  const body = await request.text();
  return proxyJson(`${baseUrl}/news/admin/${id}`, request, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
    requireAuth: true,
  });
}

export async function DELETE(request: NextRequest, { params }: ParamsContext) {
  const { id } = await params;
  return proxyJson(`${baseUrl}/news/admin/${id}`, request, {
    method: "DELETE",
    requireAuth: true,
  });
}

