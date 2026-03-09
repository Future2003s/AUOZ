import { useCallback } from "react";
import { HttpError } from "@/lib/http";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, meQueryKey } from "@/app/[locale]/me/query";

// ─── Types ───────────────────────────────────────────────────────────
export interface AuthUser {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  isActive?: boolean;
  [key: string]: any; // Allow extra fields from backend
}

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

// ─── Login via Next API route (sets httpOnly cookies) ────────────────
async function loginViaApi(body: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<any> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new HttpError({
      statusCode: res.status,
      payload: { message: data?.error || data?.message || "Đăng nhập thất bại" },
      url: "/api/auth/login",
    });
  }
  return data;
}

// ─── Main hook ───────────────────────────────────────────────────────
export const useAuth = (): UseAuthReturn => {
  const queryClient = useQueryClient();

  // Single source of truth: React Query → /api/auth/me
  const { data: meData, isLoading, error: meError } = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled: typeof window !== "undefined",
    staleTime: 3 * 60 * 1000,   // 3 min
    gcTime: 10 * 60 * 1000,     // 10 min
    retry: 0,                    // No retry — fast feedback
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });

  // Derived state
  const user: AuthUser | null = meData?.success && meData?.user ? meData.user : null;
  const isAuthenticated = !!user;
  const error = meError
    ? meError instanceof Error ? meError.message : "Authentication failed"
    : null;

  // Login
  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const response = await loginViaApi({ email, password, rememberMe });
      await queryClient.invalidateQueries({ queryKey: meQueryKey });
      return response;
    },
    [queryClient]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      queryClient.setQueryData(meQueryKey, { success: true, user: null });
      queryClient.removeQueries({ queryKey: meQueryKey });
    }
  }, [queryClient]);

  // Refresh auth (manually trigger re-fetch from /api/auth/me)
  const refreshAuth = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: meQueryKey });
  }, [queryClient]);

  // Clear error
  const clearError = useCallback(() => {
    queryClient.resetQueries({ queryKey: meQueryKey });
  }, [queryClient]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshAuth,
    clearError,
  };
};
