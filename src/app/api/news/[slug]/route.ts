import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
  envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

type ParamsContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: ParamsContext) {
  const { slug } = await params;
  const qs = request.nextUrl.searchParams.toString();
  const url = `${baseUrl}/news/${slug}${qs ? `?${qs}` : ""}`;
  return proxyJson(url, request, {
    method: "GET",
  });
}

