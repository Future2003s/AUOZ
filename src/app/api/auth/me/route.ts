import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { envConfig } from "@/config";

// ─── Timeout helper (Edge + Node runtime compatible) ─────────────────
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────
// Kiểm tra user hiện tại. Nếu sessionToken hết hạn → tự refresh bằng
// refreshToken → trả user + set cookie mới. Mọi backend fetch đều có
// timeout 5s; toàn bộ handler được bọc trong timeout 10s để không bao
// giờ treo client.
export async function GET() {
  // ── Global 10-second safety net ─────────────────────────────────────
  const timeoutResponse = new Promise<NextResponse>((resolve) =>
    setTimeout(
      () =>
        resolve(
          NextResponse.json({ success: true, user: null }, { status: 200 })
        ),
      10_000
    )
  );

  return Promise.race([handleGet(), timeoutResponse]);
}

async function handleGet(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sessionToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const isProd = process.env.NODE_ENV === "production";

    // ── Step 1: Try existing sessionToken (5s timeout) ────────────────
    const fetchUserWithToken = async (
      accessToken: string
    ): Promise<object | null> => {
      try {
        const res = await fetchWithTimeout(
          `${baseUrl}/auth/me`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          },
          5000
        );
        if (!res.ok) return null;
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        return data?.success ? data.data : null;
      } catch {
        // AbortError (timeout) or network error → treat as invalid token
        return null;
      }
    };

    if (token) {
      const user = await fetchUserWithToken(token);
      if (user) {
        return NextResponse.json({ success: true, user }, { status: 200 });
      }
      // sessionToken hết hạn JWT → thử refresh
    }

    // ── Step 2: No refreshToken → unauthenticated ─────────────────────
    if (!refreshToken) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    // ── Step 3: Refresh token (5s timeout) ───────────────────────────
    let refreshRes: Response;
    try {
      refreshRes = await fetchWithTimeout(
        `${baseUrl}/auth/refresh-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        },
        5000
      );
    } catch {
      // Refresh timed out or network error → treat as unauthenticated
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    if (!refreshRes.ok) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    const refreshText = await refreshRes.text();
    const refreshData = refreshText ? JSON.parse(refreshText) : {};
    const newToken =
      refreshData?.data?.token || refreshData?.data?.accessToken;

    if (!newToken) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    // ── Step 4: Fetch user with new token ─────────────────────────────
    const user = await fetchUserWithToken(newToken);
    if (!user) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    // ── Step 5: Set refreshed cookies + return user ───────────────────
    const response = NextResponse.json(
      { success: true, user },
      { status: 200 }
    );

    response.cookies.set("sessionToken", newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    if (refreshData?.data?.refreshToken) {
      response.cookies.set("refreshToken", refreshData.data.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error) {
    console.error("[/api/auth/me] Unexpected error:", error);
    return NextResponse.json({ success: true, user: null }, { status: 200 });
  }
}
