import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config";
import { setAuthCookies } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: email, password" },
        { status: 400 }
      );
    }

    const baseUrl = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    const data = await res.json().catch(() => ({ success: false, error: "Invalid response" }));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || data?.message || "Đăng nhập thất bại", details: data },
        { status: res.status }
      );
    }

    if (data?.success && data?.data?.token) {
      const response = NextResponse.json(data, { status: 200 });
      setAuthCookies(response, data.data.token, data.data.refreshToken);
      return response;
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
