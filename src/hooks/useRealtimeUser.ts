import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useAppContextProvider } from "@/context/app-context";
import { toast } from "sonner";

/**
 * Hook để theo dõi và cập nhật thông tin user realtime
 * Tự động kiểm tra khi admin thay đổi thông tin user
 * Tự động logout nếu account bị khóa
 */
export const useRealtimeUser = (enabled: boolean = true) => {
  const { user, token, isAuthenticated, updateUser, logout } = useAuth();
  const { sessionToken } = useAppContextProvider();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const previousStatusRef = useRef<boolean | null>(null);

  const checkUserStatus = useCallback(async () => {
    if (!isAuthenticated || !token || !(user?._id || user?.id)) {
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
        // Nếu 401 hoặc 403, có thể account bị khóa hoặc token hết hạn
        if (response.status === 401 || response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          
          // Kiểm tra nếu account bị khóa
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

      if (updatedUser) {
        // So sánh để phát hiện thay đổi
        const hasChanges = 
          updatedUser.isActive !== user.isActive ||
          updatedUser.role !== user.role ||
          updatedUser.firstName !== user.firstName ||
          updatedUser.lastName !== user.lastName ||
          updatedUser.email !== user.email;

        if (hasChanges) {
          // Nếu account bị khóa, logout ngay
          if (updatedUser.isActive === false) {
            // Chỉ hiển thị toast một lần
            if (previousStatusRef.current !== false) {
              toast.error("Tài khoản của bạn đã bị khóa bởi quản trị viên", {
                duration: 5000,
              });
            }
            previousStatusRef.current = false;
            logout();
            return;
          }

          // Nếu account được mở khóa lại
          if (previousStatusRef.current === false && updatedUser.isActive === true) {
            toast.success("Tài khoản của bạn đã được kích hoạt lại");
          }
          previousStatusRef.current = updatedUser.isActive;

          // Cập nhật thông tin user
          updateUser({
            ...updatedUser,
            id: updatedUser._id || updatedUser.id,
          });

          // Thông báo nếu có thay đổi role
          if (updatedUser.role !== user.role) {
            toast.info(`Quyền của bạn đã được cập nhật: ${updatedUser.role.toUpperCase()}`);
          }
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    }
  }, [isAuthenticated, token, user, updateUser, logout]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Kiểm tra ngay lập tức
    checkUserStatus();

    // Kiểm tra định kỳ mỗi 5 giây
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      // Chỉ check nếu đã qua ít nhất 3 giây từ lần check trước
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
  }, [enabled, isAuthenticated, token, checkUserStatus]);

  // Expose manual refresh function
  const refreshUser = useCallback(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  return {
    refreshUser,
  };
};

