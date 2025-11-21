import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
  envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  return proxyJson(`${baseUrl}/products/images`, request, {
    method: "POST",
    body: formData,
    requireAuth: true,
  });
}

