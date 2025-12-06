import { NextRequest } from "next/server";
import { envConfig } from "@/config";
import { proxyJson } from "@/lib/next-api-auth";

// Story settings API
// Supports GET for public consumption and PUT for admin updates (auth required).

export async function GET(request: NextRequest) {
  const base = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
  const url = `${base}/story`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const contentType = res.headers.get("content-type") || "application/json";
    let data: any;
    
    try {
      if (contentType.includes("application/json")) {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } else {
        data = await res.text();
      }
    } catch {
      data = null;
    }
    
    return new Response(
      typeof data === "string" ? data : JSON.stringify(data),
      {
        status: res.status,
        headers: { "Content-Type": contentType },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Failed to fetch story settings" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  const base = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
  const url = `${base}/story`;

  let body: any = null;
  try {
    body = await request.json();
  } catch {}

  return proxyJson(url, request, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    requireAuth: true,
  });
}

export async function POST(request: NextRequest) {
  const base = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
  const url = `${base}/story/publish`;

  return proxyJson(url, request, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    requireAuth: true,
  });
}

