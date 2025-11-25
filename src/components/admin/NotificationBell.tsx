"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrderEvents } from "@/hooks/useOrderEvents";
import { toast } from "sonner";

const ADMIN_SSE_ENDPOINT = "/api/notifications/admin-sse";

const isIOSBrowser = () => {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    nav.standalone === true
  );
};

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const saved = localStorage.getItem("admin-notifications-enabled");
      return saved === "true" && Notification.permission === "granted";
    }
    return false;
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Trình duyệt không hỗ trợ thông báo");
      return;
    }

    if (isIOSBrowser() && !isStandaloneMode()) {
      toast.info(
        "Vui lòng thêm website vào màn hình chính (Add to Home Screen) để bật thông báo trên iOS."
      );
      return;
    }

    if (Notification.permission === "granted") {
      setEnabled(true);
      setPermission("granted");
      localStorage.setItem("admin-notifications-enabled", "true");
      toast.success("Thông báo đã được bật");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error(
        "Thông báo đã bị chặn. Vui lòng bật lại trong cài đặt trình duyệt."
      );
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      setEnabled(true);
      localStorage.setItem("admin-notifications-enabled", "true");
      toast.success("Đã bật thông báo đơn hàng");
    } else {
      toast.error("Bạn đã từ chối thông báo");
    }
  }, []);

  // Toggle notifications
  const toggleNotifications = useCallback(() => {
    if (permission !== "granted") {
      requestPermission();
    } else {
      if (isIOSBrowser() && !isStandaloneMode()) {
        toast.info(
          "Thông báo chỉ khả dụng khi bạn mở ứng dụng từ màn hình chính trên iOS."
        );
        return;
      }

      const newEnabled = !enabled;
      setEnabled(newEnabled);
      localStorage.setItem("admin-notifications-enabled", String(newEnabled));
      if (newEnabled) {
        toast.success("Đã bật thông báo");
      } else {
        toast.info("Đã tắt thông báo");
      }
    }
  }, [permission, enabled, requestPermission]);

  // Handle new order events
  const handleOrderEvent = useCallback(
    (event: MessageEvent<string>) => {
      if (!enabled || permission !== "granted") return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === "created") {
          setUnreadCount((prev) => prev + 1);

          // Show browser notification
          if (typeof window !== "undefined" && "Notification" in window) {
            const orderId = data.id || "N/A";
            const notification = new Notification("🛒 Đơn hàng mới!", {
              body: `Có khách hàng vừa đặt đơn hàng #${orderId}. Vui lòng kiểm tra ngay!`,
              icon: typeof window !== "undefined" && window.location.origin 
                ? `${window.location.origin}/logo.png` 
                : "/logo.png",
              badge: typeof window !== "undefined" && window.location.origin
                ? `${window.location.origin}/logo.png`
                : "/logo.png",
              tag: `order-${orderId}`,
              requireInteraction: false,
              silent: false,
            });

            // Auto close after 5 seconds
            setTimeout(() => {
              notification.close();
            }, 5000);

            // Handle click on notification
            notification.onclick = () => {
              window.focus();
              // Navigate to orders page if needed
              if (window.location.pathname.includes("/admin")) {
                const url = new URL(window.location.href);
                url.searchParams.set("section", "orders");
                window.location.href = url.toString();
              }
              notification.close();
            };
          }

          // Show toast notification
          toast.success(`Đơn hàng mới #${data.id || "N/A"}`, {
            description: "Có khách hàng vừa đặt đơn hàng",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Failed to parse order event:", error);
      }
    },
    [enabled, permission]
  );

  // Use order events hook
  useOrderEvents(enabled && permission === "granted", { channel: "admin" });

  // Listen to SSE events manually for notifications
  useEffect(() => {
    if (!enabled || permission !== "granted" || typeof window === "undefined") {
      return;
    }

    const source = new EventSource(ADMIN_SSE_ENDPOINT);

    source.addEventListener("order", handleOrderEvent as EventListener);

    return () => {
      source.removeEventListener("order", handleOrderEvent as EventListener);
      source.close();
    };
  }, [enabled, permission, handleOrderEvent]);

  // Clear unread count when clicking bell
  const handleBellClick = useCallback(() => {
    setUnreadCount(0);
    toggleNotifications();
  }, [toggleNotifications]);

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleBellClick}
        className="relative"
        title={
          enabled
            ? "Thông báo đã bật - Click để tắt"
            : "Thông báo đã tắt - Click để bật"
        }
      >
        {enabled && permission === "granted" ? (
          <Bell className="h-4 w-4 mr-2 text-green-600" />
        ) : (
          <BellOff className="h-4 w-4 mr-2 text-gray-400" />
        )}
        <span className="hidden sm:inline">
          {enabled && permission === "granted" ? "Thông báo" : "Bật thông báo"}
        </span>
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}

