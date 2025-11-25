import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { API_CONFIG } from "@/lib/api-config";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const backendUrl = `${API_CONFIG.API_BASE_URL}${API_CONFIG.COMMENTS.DELETE.replace(
    ":id",
    params.id
  )}`;

  return proxyJson(backendUrl, request, {
    method: "DELETE",
    requireAuth: true,
  });
}

