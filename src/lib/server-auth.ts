import { cookies } from "next/headers";
import { envConfig } from "@/config";

// ─── Server-side auth — used by protected layouts (admin, employee, me) ─
// Reads httpOnly cookies directly, fetches user from backend.
// If token expired, tries refresh and returns new tokens for caller to set.

export interface ServerAuthResult {
    user: any | null;
    newSessionToken?: string;
    newRefreshToken?: string;
}

// ─── Timeout-aware fetch ─────────────────────────────────────────────
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() =>
        clearTimeout(timer)
    );
}

// ─── Fetch user from backend ─────────────────────────────────────────
async function fetchUserFromBackend(accessToken: string): Promise<any | null> {
    const baseUrl = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
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

// ─── Refresh token from backend ──────────────────────────────────────
async function refreshTokenFromBackend(
    refreshToken: string
): Promise<{ token: string; refreshToken?: string } | null> {
    const baseUrl = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
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
        const data = await res.json().catch(() => ({}));
        const newToken = data?.data?.token || data?.data?.accessToken;
        if (!newToken) return null;
        return { token: newToken, refreshToken: data?.data?.refreshToken };
    } catch {
        return null;
    }
}

// ─── Main: get user from server-side ─────────────────────────────────
export async function getServerUser(): Promise<ServerAuthResult> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("sessionToken")?.value;
        const refreshTokenValue = cookieStore.get("refreshToken")?.value;

        // Step 1: Try existing sessionToken
        if (sessionToken) {
            const user = await fetchUserFromBackend(sessionToken);
            if (user) {
                return { user };
            }
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

        // Step 5: Return user + new tokens
        return {
            user,
            newSessionToken: refreshResult.token,
            newRefreshToken: refreshResult.refreshToken,
        };
    } catch (error) {
        console.error("[getServerUser] Error:", error);
        return { user: null };
    }
}
