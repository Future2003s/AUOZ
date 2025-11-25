import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { API_CONFIG } from "@/lib/api-config";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const backendPath = API_CONFIG.COMMENTS.REPLIES.replace(":commentId", params.id);
  const backendUrl = `${API_CONFIG.API_BASE_URL}${backendPath}${
    searchParams.toString() ? `?${searchParams}` : ""
  }`;

  return proxyJson(backendUrl, request, {
    method: "GET",
  });
}

