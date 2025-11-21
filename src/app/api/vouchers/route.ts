import { NextRequest } from "next/server";
import { envConfig } from "@/config";
import { cookies } from "next/headers";

const backendBase = `${envConfig.NEXT_PUBLIC_BACKEND_URL}/api/${envConfig.NEXT_PUBLIC_API_VERSION}`;

async function buildAuthHeaders(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sessionToken")?.value;
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const backendUrl = `${backendBase}/vouchers${qs ? `?${qs}` : ""}`;

  try {
    const headers = await buildAuthHeaders(request);
    const res = await fetch(backendUrl, {
      headers,
      cache: "no-store",
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Vouchers GET proxy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Không thể tải danh sách voucher",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = await buildAuthHeaders(request);
    const backendUrl = `${backendBase}/vouchers`;

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
    console.error("Vouchers POST proxy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Không thể tạo voucher",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

