import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";

export async function GET(request: NextRequest) {
  return proxyJson(
    `${process.env.NEXT_PUBLIC_API_END_POINT}/cms/theme`,
    request,
    { method: "GET", requireAuth: true }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyJson(
    `${process.env.NEXT_PUBLIC_API_END_POINT}/cms/theme`,
    request,
    {
      method: "POST",
      requireAuth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }
  );
}

