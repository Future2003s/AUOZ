import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: email, password",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Resolve backend base URL with safe fallback
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    // Forward to backend
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") || "application/json";
    let data;
    try {
      if (contentType.includes("application/json")) {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } else {
        data = await res.text();
      }
    } catch (error) {
      console.error("JSON parse error:", error);
      data = { success: false, error: "Invalid response from server" };
    }

    // Handle different error cases
    if (!res.ok) {
      let errorMessage = "Đăng nhập thất bại";
      const statusCode = res.status;

      if (data?.error || data?.message) {
        const backendError = data.error || data.message;

        // Map backend errors to user-friendly messages
        if (
          backendError.includes("Invalid credentials") ||
          backendError.includes("invalid")
        ) {
          errorMessage = "Email hoặc mật khẩu không đúng";
        } else if (
          backendError.includes("deactivated") ||
          backendError.includes("inactive")
        ) {
          errorMessage =
            "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên";
        } else if (
          backendError.includes("Too many") ||
          backendError.includes("attempts")
        ) {
          errorMessage =
            "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút";
        } else if (statusCode === 401) {
          errorMessage = "Email hoặc mật khẩu không đúng";
        } else if (statusCode === 429) {
          errorMessage = "Quá nhiều lần thử. Vui lòng đợi một chút";
        } else if (statusCode === 403) {
          errorMessage = "Tài khoản của bạn không có quyền truy cập";
        } else {
          errorMessage = backendError || errorMessage;
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          statusCode,
          details: data,
        }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Set cookies if login successful and tokens provided
    if (res.ok && data?.success && data?.data?.token) {
      const isProd = process.env.NODE_ENV === "production";
      const sessionToken = data.data.token as string;
      const refreshToken = data.data.refreshToken as string | undefined;

      const response = NextResponse.json(
        typeof data === "string" ? JSON.parse(data) : data,
        { status: res.status }
      );

      response.cookies.set("sessionToken", sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
      });

      if (refreshToken) {
        response.cookies.set("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          secure: isProd,
          path: "/",
        });
      }

      return response;
    }

    return new Response(
      typeof data === "string" ? data : JSON.stringify(data),
      {
        status: res.status,
        headers: { "Content-Type": contentType },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
