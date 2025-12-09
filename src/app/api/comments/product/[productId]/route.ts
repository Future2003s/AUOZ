export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { API_CONFIG } from "@/lib/api-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const { searchParams } = new URL(request.url);

  const backendUrl = `${API_CONFIG.API_BASE_URL}${API_CONFIG.COMMENTS.PRODUCT.replace(
    ":productId",
    productId
  )}${searchParams.toString() ? `?${searchParams}` : ""}`;

  return proxyJson(backendUrl, request, {
    method: "GET",
    requireAuth: false,
  });
}
