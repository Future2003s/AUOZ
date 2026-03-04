import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { meQueryKey } from "@/app/[locale]/me/query";

/**
 * Hook để theo dõi và cập nhật thông tin user realtime
 * Tự động kiểm tra khi admin thay đổi thông tin user
 * Tự động logout nếu account bị khóa
 */
export const useRealtimeUser = (enabled: boolean = true) => {
  const { user, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const previousStatusRef = useRef<boolean | null>(null);

  const checkUserStatus = useCallback(async () => {
    if (!isAuthenticated || !(user?._id || (user as any)?.id)) {
      return;
    }

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const errorData = await response.json().catch(() => ({}));

          if (errorData?.error?.includes("deactivated") ||
            errorData?.error?.includes("inactive") ||
            errorData?.message?.includes("deactivated")) {
            logout();
            return;
          }
        }
        return;
      }

      const data = await response.json();
      const updatedUser = data?.data || data?.user || data;

      if (updatedUser && user) {
        const hasChanges =
          updatedUser.isActive !== user.isActive ||
          updatedUser.role !== user.role ||
          updatedUser.firstName !== user.firstName ||
          updatedUser.lastName !== user.lastName ||
          updatedUser.email !== user.email;

        if (hasChanges) {
          if (updatedUser.isActive === false) {
            if (previousStatusRef.current !== false) {
              toast.error("Tài khoản của bạn đã bị khóa bởi quản trị viên", {
                duration: 5000,
              });
            }
            previousStatusRef.current = false;
            logout();
            return;
          }

          if (previousStatusRef.current === false && updatedUser.isActive === true) {
            toast.success("Tài khoản của bạn đã được kích hoạt lại");
          }
          previousStatusRef.current = updatedUser.isActive;

          // Invalidate React Query to refetch user data
          queryClient.invalidateQueries({ queryKey: meQueryKey });

          if (updatedUser.role !== user.role) {
            toast.info(`Quyền của bạn đã được cập nhật: ${updatedUser.role.toUpperCase()}`);
          }
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    }
  }, [isAuthenticated, user, logout, queryClient]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    checkUserStatus();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastCheckRef.current > 3000) {
        lastCheckRef.current = now;
        checkUserStatus();
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isAuthenticated, checkUserStatus]);

  const refreshUser = useCallback(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  return {
    refreshUser,
  };
};
