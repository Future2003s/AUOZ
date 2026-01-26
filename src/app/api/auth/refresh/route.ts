import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value || "";
    const baseUrl =
      process.env.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
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
      data = null;
    }
    // If backend returned new tokens, set them as HttpOnly cookies
    if (res.ok && data?.success && data?.data?.token) {
      const isProd = process.env.NODE_ENV === "production";
      
      // Sử dụng NextResponse để set cookie đúng cách
      const nextResponse = NextResponse.json(data, {
        status: 200,
        headers: {
          "Content-Type": contentType,
        },
      });

      // Set token cookies với thời gian dài hơn để giống Google
      nextResponse.cookies.set("sessionToken", data.data.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days - tăng từ không có maxAge lên 30 ngày
      });

      if (data.data.refreshToken) {
        nextResponse.cookies.set("refreshToken", data.data.refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          secure: isProd,
          path: "/",
          maxAge: 60 * 60 * 24 * 365, // 365 days (1 năm) - tăng từ không có maxAge lên 1 năm
        });
      }

      // Nếu có user data trong response, cập nhật cookie
      if (data.data.user) {
        const userData = JSON.stringify(data.data.user);
        if (userData.length < 4000) {
          nextResponse.cookies.set("auth_user", userData, {
            httpOnly: false,
            sameSite: "lax",
            secure: isProd,
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days - tăng từ 7 ngày lên 30 ngày
          });
        }
      }

      return nextResponse;
    }

    return NextResponse.json(
      typeof data === "string" ? JSON.parse(data) : data,
      {
        status: res.status,
        headers: { "Content-Type": contentType },
      }
    );
  } catch (e) {
    return NextResponse.json({ message: "Internal Error" }, {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
