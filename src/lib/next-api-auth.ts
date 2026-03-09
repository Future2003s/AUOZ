// ─── Backward-compatible wrapper ─────────────────────────────────────
// This file re-exports from the new auth.ts for API routes that still
// import { proxyJson } from "@/lib/next-api-auth".
// New code should import from "@/lib/auth" directly.

import { NextRequest, NextResponse } from "next/server";
import {
  proxyToBackend,
  getTokenFromRequest,
  getRefreshTokenFromRequest,
  tryRefreshToken,
} from "@/lib/auth";
import { envConfig } from "@/config";

// ─── getAuthHeaderOrRefresh — used by file upload routes ─────────────
type RefreshResult = {
  authHeader: string | null;
  setCookie?: string | null;
};

export async function getAuthHeaderOrRefresh(
  request: NextRequest
): Promise<RefreshResult> {
  // Check Authorization header first
  let authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return { authHeader, setCookie: null };
  }

  // Check sessionToken cookie
  const accessFromCookie = getTokenFromRequest(request);
  if (accessFromCookie) {
    return { authHeader: `Bearer ${accessFromCookie}`, setCookie: null };
  }

  // Try refresh
  const refreshToken = getRefreshTokenFromRequest(request);
  if (!refreshToken) return { authHeader: null };

  const result = await tryRefreshToken(refreshToken);
  if (!result) return { authHeader: null };

  // Build set-cookie header
  const isProd = process.env.NODE_ENV === "production";
  const securePart = isProd ? "; Secure" : "";
  let setCookieHeader = `sessionToken=${result.token}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${securePart}`;

  if (result.refreshToken) {
    setCookieHeader += `, refreshToken=${result.refreshToken}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 365}; SameSite=Strict${securePart}`;
  }

  return { authHeader: `Bearer ${result.token}`, setCookie: setCookieHeader };
}

// ─── proxyJson — backward-compatible proxy function ──────────────────
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

    // Timeout helper
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(backendUrl, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    let body: any;
    const contentType = res.headers.get("content-type") || "application/json";

    try {
      if (contentType.includes("application/json")) {
        body = await res.json();
      } else {
        body = await res.text();
      }
    } catch {
      body = { message: "Error parsing response" };
    }

    const response = new NextResponse(
      typeof body === "string" ? body : JSON.stringify(body),
      { status: res.status, headers: { "Content-Type": contentType } }
    );

    // Apply refreshed cookies
    if (setCookie) {
      const cookies = setCookie.split(/, (?=[a-zA-Z_]+=)/);
      cookies.forEach((cookie, i) => {
        if (i === 0) {
          response.headers.set("set-cookie", cookie);
        } else {
          response.headers.append("set-cookie", cookie);
        }
      });
    }

    return response;
  } catch (error) {
    console.error("proxyJson error:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
