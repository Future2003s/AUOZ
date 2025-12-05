import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { API_CONFIG } from "@/lib/api-config";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const backendUrl = `${API_CONFIG.API_BASE_URL}${API_CONFIG.COMMENTS.DELETE.replace(
    ":id",
    id
  )}`;

  return proxyJson(backendUrl, request, {
    method: "DELETE",
    requireAuth: true,
  });
}

