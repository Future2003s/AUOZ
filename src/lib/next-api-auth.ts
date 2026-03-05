import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config";

// ─── Timeout helper ───────────────────────────────────────────────────
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

type RefreshResult = {
  authHeader: string | null;
  setCookie?: string | null;
};

export async function getAuthHeaderOrRefresh(
  request: NextRequest
): Promise<RefreshResult> {
  let authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return { authHeader, setCookie: null };
  }
  const accessFromCookie = request.cookies.get("sessionToken")?.value || "";
  if (accessFromCookie) {
    return { authHeader: `Bearer ${accessFromCookie}` } as any;
  }
  const refreshToken = request.cookies.get("refreshToken")?.value;
  if (!refreshToken) return { authHeader: null };
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

    // 5s timeout — prevents hanging when backend is unreachable
    const res = await fetchWithTimeout(
      `${baseUrl}/auth/refresh-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      },
      5000
    );
    if (!res.ok) return { authHeader: null };

    let data: any;
    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } else {
        data = {};
      }
    } catch {
      data = {};
    }

    // Backend trả về { success: true, data: { token, refreshToken } }
    const newAccess =
      data?.data?.token ||
      data?.data?.accessToken ||
      data?.accessToken ||
      data?.token;

    if (!newAccess) return { authHeader: null };

    // Build set-cookie headers để cập nhật sessionToken (và refreshToken nếu có)
    const isProd = process.env.NODE_ENV === "production";
    const securePart = isProd ? "; Secure" : "";
    let setCookieHeader = `sessionToken=${newAccess}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${securePart}`;

    const newRefreshToken = data?.data?.refreshToken;
    if (newRefreshToken) {
      setCookieHeader += `, refreshToken=${newRefreshToken}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 365}; SameSite=Strict${securePart}`;
    }

    return { authHeader: `Bearer ${newAccess}`, setCookie: setCookieHeader };
  } catch {
    return { authHeader: null };
  }
}


export async function proxyJson<ResponseBody = any>(
  backendUrl: string,
  request: NextRequest,
  init: RequestInit & { requireAuth?: boolean } = {}
) {
  try {
    const { authHeader, setCookie } = await getAuthHeaderOrRefresh(request);
    if (init.requireAuth && !authHeader) {
      return new NextResponse(JSON.stringify({ message: "Unauthenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5s timeout on proxied backend request
    let res = await fetchWithTimeout(
      backendUrl,
      {
        ...init,
        headers: {
          ...(init.headers || {}),
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        cache: "no-store",
      },
      5000
    );

    // Track cookie to set from refresh (may be updated below)
    let finalSetCookie = setCookie;

    // If 401, try silent refresh once then retry with new token
    if (res.status === 401 && init.requireAuth) {
      const refreshToken = request.cookies.get("refreshToken")?.value;
      if (refreshToken) {
        const baseUrl =
          envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
        try {
          const refreshRes = await fetchWithTimeout(
            `${baseUrl}/auth/refresh-token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            },
            5000
          );
          if (refreshRes.ok) {
            const text = await refreshRes.text();
            const refreshData = text ? JSON.parse(text) : {};
            const newToken =
              refreshData?.data?.token ||
              refreshData?.data?.accessToken ||
              refreshData?.accessToken;
            if (newToken) {
              // Retry original request with fresh token (5s timeout)
              res = await fetchWithTimeout(
                backendUrl,
                {
                  ...init,
                  headers: {
                    ...(init.headers || {}),
                    Authorization: `Bearer ${newToken}`,
                  },
                  cache: "no-store",
                },
                5000
              );
              // Build set-cookie for new tokens
              const isProd = process.env.NODE_ENV === "production";
              const securePart = isProd ? "; Secure" : "";
              finalSetCookie = `sessionToken=${newToken}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${securePart}`;
              const newRefreshToken = refreshData?.data?.refreshToken;
              if (newRefreshToken) {
                finalSetCookie += `, refreshToken=${newRefreshToken}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 365}; SameSite=Strict${securePart}`;
              }
            }
          }
        } catch {
          // refresh failed, continue with original 401 response
        }
      }
    }

    const contentType = res.headers.get("content-type") || "application/json";
    let body: any;

    try {
      if (contentType.includes("application/json")) {
        body = await res.json();
      } else {
        body = await res.text();
      }
    } catch (parseError) {
      console.error("Error parsing response body:", parseError);
      body = { message: "Error parsing response" };
    }

    const response = new NextResponse(
      typeof body === "string" ? body : JSON.stringify(body),
      {
        status: res.status,
        headers: {
          "Content-Type": contentType,
          ...(res.headers.get("access-control-allow-origin") && {
            "Access-Control-Allow-Origin": res.headers.get(
              "access-control-allow-origin"
            )!,
          }),
          ...(res.headers.get("access-control-allow-methods") && {
            "Access-Control-Allow-Methods": res.headers.get(
              "access-control-allow-methods"
            )!,
          }),
          ...(res.headers.get("access-control-allow-headers") && {
            "Access-Control-Allow-Headers": res.headers.get(
              "access-control-allow-headers"
            )!,
          }),
        },
      }
    );

    // Apply refreshed cookies to response
    if (finalSetCookie) {
      // Split multiple cookies if needed
      const cookies = finalSetCookie.split(/, (?=[a-zA-Z_]+=)/);
      cookies.forEach((cookie, i) => {
        if (i === 0) {
          response.headers.set("set-cookie", cookie);
        } else {
          response.headers.append("set-cookie", cookie);
        }
      });
    }

    // Only clear cookies if both accessToken AND refreshToken are gone (truly logged out)
    // Do NOT clear on every 401 — this caused the premature logout bug
    if (res.status === 401 && init.requireAuth) {
      const hasRefreshToken = request.cookies.get("refreshToken")?.value;
      if (!hasRefreshToken) {
        // No refresh token left → truly expired, safe to clear
        response.headers.append(
          "set-cookie",
          "sessionToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax"
        );
        response.headers.append(
          "set-cookie",
          "refreshToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict"
        );
      }
    }

    return response;
  } catch (error) {
    console.error("proxyJson error:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
