import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { API_CONFIG } from "@/lib/api-config";

interface RouteParams {
  params: {
    productId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const backendPath = API_CONFIG.COMMENTS.PRODUCT.replace(
    ":productId",
    params.productId
  );
  const backendUrl = `${API_CONFIG.API_BASE_URL}${backendPath}${
    searchParams.toString() ? `?${searchParams}` : ""
  }`;

  return proxyJson(backendUrl, request, {
    method: "GET",
  });
}

