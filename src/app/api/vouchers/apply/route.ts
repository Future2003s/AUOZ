import { NextRequest } from "next/server";
import { envConfig } from "@/config";

const backendBase = `${envConfig.NEXT_PUBLIC_BACKEND_URL}/api/${envConfig.NEXT_PUBLIC_API_VERSION}`;

function buildAuthHeaders(request: NextRequest) {
  const token = request.cookies.get("sessionToken")?.value;
  const authHeader = request.headers.get("authorization");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (authHeader) {
    headers.Authorization = authHeader;
  }

  return headers;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = await buildAuthHeaders(request);
    const backendUrl = `${backendBase}/vouchers/apply`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voucher apply proxy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Không thể áp dụng voucher",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

