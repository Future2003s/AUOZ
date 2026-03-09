import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { envConfig } from "@/config";
import { tryRefreshToken, setAuthCookies } from "@/lib/auth";

// ─── Timeout-aware fetch ─────────────────────────────────────────────
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// ─── GET /api/auth/me — single source of truth for client auth ──────
// If sessionToken is valid → return user
// If sessionToken expired but refreshToken exists → refresh → return user + set new cookies
// Otherwise → return { user: null }
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sessionToken")?.value;
    const refreshTokenValue = cookieStore.get("refreshToken")?.value;
    const baseUrl = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    // Step 1: Try existing sessionToken
    if (token) {
      const user = await fetchUserFromBackend(baseUrl, token);
      if (user) {
        return NextResponse.json({ success: true, user }, { status: 200 });
      }
    }

    // Step 2: No refreshToken → not authenticated
    if (!refreshTokenValue) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    // Step 3: Try refresh token
    const refreshResult = await tryRefreshToken(refreshTokenValue);
    if (!refreshResult) {
      // Refresh failed → clear stale cookies
      const response = NextResponse.json({ success: true, user: null }, { status: 200 });
      response.cookies.set("sessionToken", "", { maxAge: 0, path: "/" });
      response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });
      return response;
    }

    // Step 4: Fetch user with new token
    const user = await fetchUserFromBackend(baseUrl, refreshResult.token);
    if (!user) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    // Step 5: Set new cookies + return user
    const response = NextResponse.json({ success: true, user }, { status: 200 });
    setAuthCookies(response, refreshResult.token, refreshResult.refreshToken);
    return response;
  } catch (error) {
    console.error("[/api/auth/me] Error:", error);
    return NextResponse.json({ success: true, user: null }, { status: 200 });
  }
}

// ─── Fetch user from backend ─────────────────────────────────────────
async function fetchUserFromBackend(baseUrl: string, accessToken: string): Promise<any | null> {
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
    const data = await res.json().catch(() => ({}));
    return data?.success ? data.data : null;
  } catch {
    return null;
  }
}
