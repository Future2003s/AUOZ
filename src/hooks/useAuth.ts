import { useState, useCallback, useEffect } from "react";
import {
  authService,
  BackendAuthResponse,
  BackendUserProfile,
} from "@/services/auth.service";
import { ExtendedLoginBodyType } from "@/shemaValidation/auth.schema";
import { HttpError } from "@/lib/http";
import { useAppContextProvider } from "@/context/app-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, meQueryKey } from "@/app/[locale]/me/query";

// Auth state interface
interface AuthState {
  user: BackendUserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth actions interface
interface AuthActions {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<BackendAuthResponse>;
  loginExtended: (data: ExtendedLoginBodyType) => Promise<BackendAuthResponse>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<BackendUserProfile>) => void;
  testConnection: () => Promise<{ success: boolean; message: string }>;
  testApi: () => Promise<{ success: boolean; message: string }>;
}

// Combined auth hook return type
type UseAuthReturn = AuthState & AuthActions;

// Cookie keys - tất cả auth data lưu trong cookie
const COOKIE_KEYS = {
  USER: "auth_user",
  REMEMBER_ME: "auth_remember_me",
} as const;

// Helper để đọc cookie từ client-side
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Helper để set cookie từ client-side (chỉ cho remember_me, user data được set bởi API)
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Helper để xóa cookie
const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const useAuth = (): UseAuthReturn => {
  const { setSessionToken } = useAppContextProvider();
  const queryClient = useQueryClient();
  
  // Sử dụng React Query để cache và tránh duplicate calls
  const { data: meData, isLoading: meLoading, error: meError } = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled: typeof window !== 'undefined', // Chỉ chạy ở client
    staleTime: 10 * 60 * 1000, // Cache 10 phút để giảm API calls
    gcTime: 15 * 60 * 1000, // Giữ cache 15 phút
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // State management
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Sync state với React Query data
  useEffect(() => {
    if (meLoading) {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    if (meError) {
      setAuthState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: meError instanceof Error ? meError.message : "Authentication failed",
      });
      return;
    }

    if (meData?.success && meData?.user) {
      const user = meData.user;
      const rememberMe = getCookie(COOKIE_KEYS.REMEMBER_ME) === "true";

          setAuthState({
            user,
        token: null,
        refreshToken: null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
      setAuthState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [meData, meLoading, meError]);

  // Validate and refresh token
  const validateAndRefreshToken = useCallback(
    async (token: string, refreshToken: string | null) => {
      try {
        const isValid = await authService.validateToken(token);
        if (!isValid.valid && refreshToken) {
          await refreshAuth();
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        await logout();
      }
    },
    []
  );

  // Save auth data - tất cả đã được lưu trong cookie bởi API route
  // Chỉ cần set remember_me cookie nếu cần (user data đã được set bởi API)
  const saveAuthData = useCallback(
    (data: BackendAuthResponse, rememberMe: boolean = false) => {
      // Token và user data đã được set trong cookie bởi /api/auth/login
      // Chỉ set remember_me cookie nếu cần
      if (rememberMe) {
        setCookie(COOKIE_KEYS.REMEMBER_ME, "true", 30);
      } else {
        deleteCookie(COOKIE_KEYS.REMEMBER_ME);
      }
    },
    []
  );

  // Clear auth data - xóa tất cả cookies (token cookies sẽ được xóa bởi API)
  const clearAuthData = useCallback(() => {
    deleteCookie(COOKIE_KEYS.USER);
    deleteCookie(COOKIE_KEYS.REMEMBER_ME);
  }, []);

  // Helper: login via Next API to set httpOnly cookies for middleware
  const loginViaNextApi = useCallback(
    async (body: {
      email: string;
      password: string;
      rememberMe?: boolean;
      deviceInfo?: any;
    }) => {
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
    },
    []
  );

  // Login function
  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await loginViaNextApi({
          email,
          password,
          rememberMe,
        });

        saveAuthData(response, rememberMe);
        // Token đã được set trong cookie httpOnly bởi /api/auth/login, không cần set ở đây

        // Invalidate React Query cache để fetch lại user data
        await queryClient.invalidateQueries({ queryKey: meQueryKey });

        return response;
      } catch (error) {
        let errorMessage = "Đăng nhập thất bại";
        
        if (error instanceof HttpError) {
          const payload = error.payload as any;
          errorMessage = payload?.error || payload?.message || errorMessage;
          
          // Handle specific error cases
          if (error.statusCode === 401) {
            if (payload?.error?.includes("deactivated") || payload?.error?.includes("inactive")) {
              errorMessage = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên";
            } else {
              errorMessage = payload?.error || "Email hoặc mật khẩu không đúng";
            }
          } else if (error.statusCode === 429) {
            errorMessage = "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút";
          } else if (error.statusCode === 403) {
            errorMessage = "Tài khoản của bạn không có quyền truy cập";
          }
        }

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [saveAuthData, loginViaNextApi]
  );

  // Login with extended data (rememberMe/deviceInfo)
  const loginExtended = useCallback(
    async (data: ExtendedLoginBodyType) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await loginViaNextApi(data);

        saveAuthData(response, Boolean(data.rememberMe));
        // Token đã được set trong cookie httpOnly bởi /api/auth/login, không cần set ở đây

        // Invalidate React Query cache để fetch lại user data
        await queryClient.invalidateQueries({ queryKey: meQueryKey });

        return response;
      } catch (error) {
        let errorMessage = "Đăng nhập thất bại";
        
        if (error instanceof HttpError) {
          const payload = error.payload as any;
          errorMessage = payload?.error || payload?.message || errorMessage;
          
          // Handle specific error cases
          if (error.statusCode === 401) {
            if (payload?.error?.includes("deactivated") || payload?.error?.includes("inactive")) {
              errorMessage = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên";
            } else {
              errorMessage = payload?.error || "Email hoặc mật khẩu không đúng";
            }
          } else if (error.statusCode === 429) {
            errorMessage = "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút";
          } else if (error.statusCode === 403) {
            errorMessage = "Tài khoản của bạn không có quyền truy cập";
          }
        }

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [saveAuthData, loginViaNextApi]
  );

  // Register function - sử dụng endpoint /auth/register từ API_DOCUMENTATION.md
  const register = useCallback(
    async (userData: any) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await authService.register(userData);

        saveAuthData(response, false);

        setAuthState({
          user: {
            ...response.data.user,
            addresses: [],
            preferences: {
              language: "en",
              currency: "USD",
              notifications: { email: true, sms: false, push: true },
            },
          },
          token: response.data.token,
          refreshToken: response.data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof HttpError
            ? error.payload?.message || "Registration failed"
            : "An unexpected error occurred";

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [saveAuthData]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call Next API to clear httpOnly cookies and notify backend
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthData();
      // Clear React Query cache
      queryClient.setQueryData(meQueryKey, null);
      queryClient.removeQueries({ queryKey: meQueryKey });
      setAuthState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [clearAuthData, queryClient]);

  // Refresh auth token - token được refresh và set trong cookie bởi API
  const refreshAuth = useCallback(async () => {
    try {
      // Gọi API để refresh token (refreshToken từ cookie httpOnly)
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          // Token đã được set trong cookie httpOnly bởi API, không cần lưu ở client
          // Chỉ cập nhật state để đánh dấu đã refresh
      setAuthState((prev) => ({
        ...prev,
            // Token không lưu ở client state vì đã trong cookie
          }));
        } else {
          throw new Error("Token refresh failed");
        }
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
    }
  }, [logout]);

  // Clear error
  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  // Update user data
  const updateUser = useCallback(
    (userData: Partial<BackendUserProfile>) => {
      setAuthState((prev) => {
        const updatedUser = prev.user ? { ...prev.user, ...userData } : null;

        // Update cookie với user data mới (nếu không quá lớn)
        if (updatedUser) {
          const userDataStr = JSON.stringify(updatedUser);
          if (userDataStr.length < 4000) {
            setCookie(COOKIE_KEYS.USER, userDataStr, 7);
          }
        }
        
        return {
          ...prev,
          user: updatedUser,
        };
      });
    },
    []
  );

  // Test connection to backend
  const testConnection = useCallback(async () => {
    try {
      const result = await authService.testConnection();
      return result;
    } catch (error) {
      return { success: false, message: "Connection test failed" };
    }
  }, []);

  // Test API endpoint
  const testApi = useCallback(async () => {
    try {
      const result = await authService.testApi();
      return result;
    } catch (error) {
      return { success: false, message: "API test failed" };
    }
  }, []);

  return {
    ...authState,
    login,
    loginExtended,
    register,
    logout,
    refreshAuth,
    clearError,
    updateUser,
    testConnection,
    testApi,
  };
};
