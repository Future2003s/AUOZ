import { useCallback } from "react";
import {
  BackendAuthResponse,
  BackendUserProfile,
} from "@/services/auth.service";
import { ExtendedLoginBodyType } from "@/shemaValidation/auth.schema";
import { HttpError } from "@/lib/http";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, meQueryKey } from "@/app/[locale]/me/query";

// ─── Auth state interface ────────────────────────────────────────────
interface AuthState {
  user: BackendUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<BackendAuthResponse>;
  loginExtended: (data: ExtendedLoginBodyType) => Promise<BackendAuthResponse>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

type UseAuthReturn = AuthState & AuthActions;

// ─── Helper: login via Next API to set httpOnly cookies ──────────────
async function loginViaNextApi(body: {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: any;
}): Promise<BackendAuthResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    const message = data?.error || data?.message || "Login failed";
    throw new HttpError({
      statusCode: res.status,
      payload: { message },
      url: "/api/auth/login",
    });
  }
  return data as BackendAuthResponse;
}

// ─── Error message mapping ───────────────────────────────────────────
function mapLoginError(error: unknown): string {
  if (!(error instanceof HttpError)) return "Đăng nhập thất bại";
  const payload = error.payload as any;
  const msg = payload?.error || payload?.message;
  if (error.statusCode === 401) {
    if (msg?.includes("deactivated") || msg?.includes("inactive")) {
      return "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên";
    }
    return msg || "Email hoặc mật khẩu không đúng";
  }
  if (error.statusCode === 429)
    return "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút";
  if (error.statusCode === 403)
    return "Tài khoản của bạn không có quyền truy cập";
  return msg || "Đăng nhập thất bại";
}

// ─── Main hook ───────────────────────────────────────────────────────
export const useAuth = (): UseAuthReturn => {
  const queryClient = useQueryClient();

  // Single source of truth: React Query for /api/auth/me
  const {
    data: meData,
    isLoading: meLoading,
    error: meError,
  } = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled: typeof window !== "undefined",
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,  // 10 minutes
    retry: 0,                 // No retry — auth failure = not logged in, fast feedback
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });

  // ─── Derived state (no useState!) ──────────────────────────────────
  const user: BackendUserProfile | null =
    meData?.success && meData?.user ? meData.user : null;
  const isAuthenticated = !!user;
  const isLoading = meLoading;
  const error = meError
    ? meError instanceof Error
      ? meError.message
      : "Authentication failed"
    : null;

  // ─── Login ─────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      const response = await loginViaNextApi({ email, password, rememberMe });
      // Invalidate React Query cache to refetch user data with new cookies
      await queryClient.invalidateQueries({ queryKey: meQueryKey });
      return response;
    },
    [queryClient]
  );

  const loginExtended = useCallback(
    async (data: ExtendedLoginBodyType) => {
      const response = await loginViaNextApi(data);
      await queryClient.invalidateQueries({ queryKey: meQueryKey });
      return response;
    },
    [queryClient]
  );

  // ─── Logout ────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear React Query cache immediately
      queryClient.setQueryData(meQueryKey, { success: true, user: null });
      queryClient.removeQueries({ queryKey: meQueryKey });
    }
  }, [queryClient]);

  // ─── Refresh ───────────────────────────────────────────────────────
  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        // Refetch user data with fresh token
        await queryClient.invalidateQueries({ queryKey: meQueryKey });
      } else {
        await logout();
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
    }
  }, [queryClient, logout]);

  // ─── Clear error ───────────────────────────────────────────────────
  const clearError = useCallback(() => {
    queryClient.resetQueries({ queryKey: meQueryKey });
  }, [queryClient]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginExtended,
    logout,
    refreshAuth,
    clearError,
  };
};
