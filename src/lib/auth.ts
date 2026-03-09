import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config";

// ─── Constants ───────────────────────────────────────────────────────
const BACKEND_URL = () => envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
const IS_PROD = () => process.env.NODE_ENV === "production";
const TIMEOUT_MS = 8000;

// ─── Cookie config (single source of truth) ─────────────────────────
const COOKIE_CONFIG = {
    sessionToken: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
    },
    refreshToken: {
        httpOnly: true,
        sameSite: "strict" as const,
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
    },
};

// ─── Timeout-aware fetch ─────────────────────────────────────────────
function fetchBackend(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    return fetch(url, { ...options, signal: controller.signal }).finally(() =>
        clearTimeout(timer)
    );
}

// ─── Refresh token helper ────────────────────────────────────────────
export async function tryRefreshToken(
    refreshToken: string
): Promise<{ token: string; refreshToken?: string } | null> {
    try {
        const res = await fetchBackend(`${BACKEND_URL()}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) return null;

        const data = await res.json().catch(() => ({}));
        const newToken = data?.data?.token || data?.data?.accessToken;
        if (!newToken) return null;

        return {
            token: newToken,
            refreshToken: data?.data?.refreshToken,
        };
    } catch {
        return null;
    }
}

// ─── Set auth cookies on a response ──────────────────────────────────
export function setAuthCookies(
    response: NextResponse,
    sessionToken: string,
    refreshToken?: string
) {
    const isProd = IS_PROD();

    response.cookies.set("sessionToken", sessionToken, {
        ...COOKIE_CONFIG.sessionToken,
        secure: isProd,
    });

    if (refreshToken) {
        response.cookies.set("refreshToken", refreshToken, {
            ...COOKIE_CONFIG.refreshToken,
            secure: isProd,
        });
    }
}

// ─── Clear auth cookies ─────────────────────────────────────────────
export function clearAuthCookies(response: NextResponse) {
    response.cookies.set("sessionToken", "", { maxAge: 0, path: "/" });
    response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });
}

// ─── Get auth token from request cookies ─────────────────────────────
export function getTokenFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get("sessionToken")?.value;
}

export function getRefreshTokenFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get("refreshToken")?.value;
}

// ─── Proxy a request to backend with auth ────────────────────────────
export async function proxyToBackend(
    backendPath: string,
    request: NextRequest,
    init: RequestInit & { requireAuth?: boolean } = {}
) {
    try {
        const token = getTokenFromRequest(request);

        if (init.requireAuth && !token) {
            return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
        }

        const url = `${BACKEND_URL()}${backendPath}`;
        const res = await fetchBackend(url, {
            ...init,
            headers: {
                ...(init.headers || {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        // If 401 and we have a refresh token, try refresh + retry once
        if (res.status === 401 && init.requireAuth) {
            const refreshTokenValue = getRefreshTokenFromRequest(request);
            if (refreshTokenValue) {
                const refreshResult = await tryRefreshToken(refreshTokenValue);
                if (refreshResult) {
                    // Retry with new token
                    const retryRes = await fetchBackend(url, {
                        ...init,
                        headers: {
                            ...(init.headers || {}),
                            Authorization: `Bearer ${refreshResult.token}`,
                        },
                        cache: "no-store",
                    });

                    const body = await retryRes.json().catch(() => ({}));
                    const response = NextResponse.json(body, { status: retryRes.status });
                    setAuthCookies(response, refreshResult.token, refreshResult.refreshToken);
                    return response;
                }
            }
        }

        const body = await res.json().catch(() => ({}));
        return NextResponse.json(body, { status: res.status });
    } catch (error) {
        console.error("proxyToBackend error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
