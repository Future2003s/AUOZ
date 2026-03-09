import { cookies } from "next/headers";
import { envConfig } from "@/config";

// ─── JWT helpers (reused from middleware logic) ─────────────────────
function decodeJwtPayload(token: string): { exp?: number; id?: string } | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonStr = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
}

function isTokenExpired(token: string, bufferSeconds = 60): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return true;
    return Date.now() >= (payload.exp - bufferSeconds) * 1000;
}

// ─── Timeout-aware fetch ────────────────────────────────────────────
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

// ─── Fetch user from backend directly ───────────────────────────────
async function fetchUserFromBackend(
    accessToken: string
): Promise<any | null> {
    const baseUrl =
        envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
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
        return null;
    }
}

// ─── Refresh token directly with backend ────────────────────────────
async function refreshTokenFromBackend(
    refreshToken: string
): Promise<{ token: string; refreshToken?: string } | null> {
    const baseUrl =
        envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    try {
        const res = await fetchWithTimeout(
            `${baseUrl}/auth/refresh-token`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            },
            5000
        );
        if (!res.ok) return null;
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        const newToken = data?.data?.token || data?.data?.accessToken;
        if (!newToken) return null;
        return { token: newToken, refreshToken: data?.data?.refreshToken };
    } catch {
        return null;
    }
}

// ─── Main export: get user from server-side ─────────────────────────
// Reads httpOnly cookies directly (no self-fetch to Next.js API routes).
// Used by all protected server-side layouts (admin, employee, me).
export interface ServerAuthResult {
    user: any | null;
    newSessionToken?: string;
    newRefreshToken?: string;
}

export async function getServerUser(): Promise<ServerAuthResult> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("sessionToken")?.value;
        const refreshTokenValue = cookieStore.get("refreshToken")?.value;
        const isProd = process.env.NODE_ENV === "production";

        // Step 1: Try existing sessionToken
        if (sessionToken && !isTokenExpired(sessionToken)) {
            const user = await fetchUserFromBackend(sessionToken);
            if (user) {
                return { user };
            }
            // Token not expired but backend rejected it — try refresh
        }

        // Step 2: No refreshToken → unauthenticated
        if (!refreshTokenValue) {
            return { user: null };
        }

        // Step 3: Try refresh
        const refreshResult = await refreshTokenFromBackend(refreshTokenValue);
        if (!refreshResult) {
            return { user: null };
        }

        // Step 4: Fetch user with new token
        const user = await fetchUserFromBackend(refreshResult.token);
        if (!user) {
            return { user: null };
        }

        // Step 5: Return user + new tokens (caller sets cookies)
        return {
            user,
            newSessionToken: refreshResult.token,
            newRefreshToken: refreshResult.refreshToken,
        };
    } catch (error) {
        console.error("[getServerUser] Unexpected error:", error);
        return { user: null };
    }
}

// ─── Helper: apply refreshed cookies to a Next.js response ──────────
// Call this in layout when getServerUser returns new tokens.
export function applyRefreshedCookies(
    responseCookies: any, // NextResponse.cookies or similar
    result: ServerAuthResult
) {
    const isProd = process.env.NODE_ENV === "production";

    if (result.newSessionToken) {
        responseCookies.set("sessionToken", result.newSessionToken, {
            httpOnly: true,
            sameSite: "lax" as const,
            secure: isProd,
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });
    }
    if (result.newRefreshToken) {
        responseCookies.set("refreshToken", result.newRefreshToken, {
            httpOnly: true,
            sameSite: "strict" as const,
            secure: isProd,
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
        });
    }
}
