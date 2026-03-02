import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { envConfig } from "@/config";

// GET current user by forwarding cookie token to backend
// Nếu sessionToken hết hạn JWT → tự động refresh bằng refreshToken → trả user + set cookie mới
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sessionToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const isProd = process.env.NODE_ENV === "production";

    // Helper: gọi /auth/me với một token cụ thể
    const fetchUserWithToken = async (accessToken: string) => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      return data?.success ? data.data : null;
    };

    // Bước 1: Thử lấy user với sessionToken hiện tại
    if (token) {
      const user = await fetchUserWithToken(token);
      if (user) {
        return NextResponse.json({ success: true, user }, { status: 200 });
      }
      // sessionToken có thể hết hạn JWT → fall through để thử refresh
    }

    // Bước 2: Nếu còn refreshToken → thử refresh để lấy token mới
    if (!refreshToken) {
      // Không có cả hai token → chưa đăng nhập
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    const refreshRes = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      // refreshToken hết hạn hoặc không hợp lệ → thực sự cần đăng nhập lại
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    const refreshText = await refreshRes.text();
    const refreshData = refreshText ? JSON.parse(refreshText) : {};
    const newToken =
      refreshData?.data?.token || refreshData?.data?.accessToken;

    if (!newToken) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    // Bước 3: Lấy user với token mới
    const user = await fetchUserWithToken(newToken);
    if (!user) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    // Bước 4: Trả user + set cookie mới (token đã được refresh thành công)
    const response = NextResponse.json(
      { success: true, user },
      { status: 200 }
    );

    response.cookies.set("sessionToken", newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 ngày
    });

    if (refreshData?.data?.refreshToken) {
      response.cookies.set("refreshToken", refreshData.data.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 365 ngày
      });
    }

    return response;
  } catch (error) {
    console.error("[/api/auth/me] Error:", error);
    return NextResponse.json({ success: true, user: null }, { status: 200 });
  }
}
