import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation mirroring backend rules (lengths checked backend-side too)
    const required = ["firstName", "lastName", "email", "password"] as const;
    const missing = required.filter((k) => !body?.[k]);
    if (missing.length) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missing.join(", ")}`,
          error: `Missing required fields: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    
    let res;
    try {
      res = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
    } catch (fetchError: any) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        {
          success: false,
          message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
          error: fetchError.message || "Failed to fetch",
        },
        { status: 503 }
      );
    }

    const contentType = res.headers.get("content-type") || "application/json";
    let text = "";
    let data: any = null;

    try {
      text = await res.text();
      data =
        contentType.includes("application/json") && text
          ? JSON.parse(text)
          : text;
    } catch (parseError) {
      console.error("Parse error:", parseError);
      data = text || { message: "Invalid response from server" };
    }

    if (!res.ok) {
      // Ensure error format is consistent
      const errorResponse: any = {
        success: false,
        status: res.status,
      };

      if (typeof data === "string") {
        errorResponse.message = data;
        errorResponse.error = data;
      } else if (data) {
        errorResponse.message = data.message || data.error || "Đăng ký thất bại";
        errorResponse.error = data.error || data.message || "Registration failed";
        // Preserve other error fields
        if (data.details) errorResponse.details = data.details;
        if (data.errors) errorResponse.errors = data.errors;
      } else {
        errorResponse.message = "Đăng ký thất bại";
        errorResponse.error = "Registration failed";
      }

      return NextResponse.json(errorResponse, { status: res.status });
    }

    // Success response
    const successResponse: any = {
      success: true,
    };

    if (typeof data === "string") {
      successResponse.data = data;
      successResponse.message = "Đăng ký thành công";
    } else if (data) {
      Object.assign(successResponse, data);
      if (!successResponse.message) {
        successResponse.message = "Đăng ký thành công";
      }
    } else {
      successResponse.message = "Đăng ký thành công";
    }

    return NextResponse.json(successResponse, { status: res.status });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
