"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOSNotifications } from "@/hooks/useOSNotifications";
import { Bell, X, ShoppingBag, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface OrderNotification {
  orderId: string;
  orderNumber?: string;
  total: number;
  itemCount: number;
  userId: string;
  timestamp: string;
  isGuest?: boolean;
  read?: boolean;
  _id?: string; // Database notification ID
}

const STORAGE_KEY = "employee_order_notifications";

export function NotificationBell() {
  const router = useRouter();
  const { orderNotifications, isConnected } = useSocket();
  const { user } = useAuth();
  const { isSupported: osNotificationSupported, permission, requestPermission, showNotification, isMobile } = useOSNotifications();
  const [allNotifications, setAllNotifications] = useState<OrderNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [osNotificationEnabled, setOSNotificationEnabled] = useState(false);

  // Load notifications from database on mount
  useEffect(() => {
    const loadNotificationsFromDB = async () => {
      try {
        const response = await fetch("/api/notifications?limit=50", {
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("[NotificationBell] API response:", data);
          
          // Handle response - data.data should be array of notifications
          const notifications: any[] = Array.isArray(data.data) ? data.data : [];
          
          if (data.success && notifications.length > 0) {
            // Transform database notifications to match our format
            const currentUserId = user?.id || user?._id;
            const dbNotifications: OrderNotification[] = notifications.map((n: any) => {
              // Check if current user has read this notification
              const isRead = currentUserId 
                ? n.readBy && Array.isArray(n.readBy) && n.readBy.some((id: any) => 
                    id?.toString() === currentUserId?.toString() || id === currentUserId
                  )
                : false;
              
              return {
                orderId: n.data?.orderId || n._id?.toString() || "",
                orderNumber: n.data?.orderNumber,
                total: n.data?.total || 0,
                itemCount: n.data?.itemCount || 0,
                userId: n.data?.userId || "",
                timestamp: n.createdAt || n.timestamp || new Date().toISOString(),
                isGuest: n.data?.isGuest || false,
                read: isRead,
                _id: n._id?.toString() || n.id, // Keep database ID for marking as read
              };
            });

            setAllNotifications(dbNotifications);

            // Also save to localStorage as backup
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(dbNotifications));
            } catch (error) {
              console.error("Error saving to localStorage:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error loading notifications from database:", error);
        
        // Fallback to localStorage if database fails
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as OrderNotification[];
            setAllNotifications(parsed);
          }
        } catch (localError) {
          console.error("Error loading from localStorage:", localError);
        }
      }
    };

    loadNotificationsFromDB();
  }, []);

  // Check OS notification permission on mount
  useEffect(() => {
    if (osNotificationSupported) {
      // Check if user has previously enabled OS notifications
      const enabled = localStorage.getItem("os_notifications_enabled") === "true";
      setOSNotificationEnabled(enabled);

      // If enabled but permission is default, request permission
      if (enabled && permission === "default") {
        requestPermission().then((result) => {
          if (result !== "granted") {
            setOSNotificationEnabled(false);
            localStorage.setItem("os_notifications_enabled", "false");
          }
        });
      } else if (enabled && permission === "granted") {
        setOSNotificationEnabled(true);
      } else if (permission === "denied") {
        setOSNotificationEnabled(false);
        localStorage.setItem("os_notifications_enabled", "false");
      }
    }
  }, [osNotificationSupported, permission, requestPermission]);

  // Merge new notifications from Socket.IO with existing ones
  useEffect(() => {
    if (orderNotifications.length > 0) {
      setAllNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.orderId));
        const newOnes = orderNotifications.filter(
          (n) => !existingIds.has(n.orderId)
        );
        
        if (newOnes.length === 0) return prev;

        // Show OS notification for new orders
        newOnes.forEach((notification) => {
          if (osNotificationEnabled && permission === "granted") {
            const orderNumber = notification.orderNumber || notification.orderId.slice(-8).toUpperCase();
            const total = formatCurrency(notification.total);
            
            // Use setTimeout to ensure notification is created properly
            // This helps all platforms (Windows, iOS, Android) display it correctly
            setTimeout(async () => {
              await showNotification({
                title: "Đơn hàng mới!",
                body: `Đơn hàng ${orderNumber} - ${notification.itemCount} sản phẩm - ${total}`,
                icon: "/icons/icon-192.png",
                badge: "/icons/icon-96.png",
                tag: `order-${notification.orderId}`,
                requireInteraction: false,
                silent: false, // Ensure notification is not silent
                vibrate: isMobile ? [200, 100, 200] : undefined, // Vibration for mobile
                data: {
                  orderId: notification.orderId,
                  url: `/vi/employee/orders/${notification.orderId}`,
                },
              });
            }, 100);
          }
        });

        // Add new notifications to the beginning
        const merged = [...newOnes, ...prev].slice(0, 50); // Keep last 50
        
        // Save to localStorage as backup
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch (error) {
          console.error("Error saving notifications to localStorage:", error);
        }
        
        return merged;
      });
    }
  }, [orderNotifications, osNotificationEnabled, permission, showNotification]);

  // Mark notification as read
  const markAsRead = async (notification: OrderNotification) => {
    // Update local state immediately for better UX
    setAllNotifications((prev) => {
      const updated = prev.map((n) =>
        n.orderId === notification.orderId ? { ...n, read: true } : n
      );
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving notifications:", error);
      }
      
      return updated;
    });

    // Mark as read in database if we have the notification ID
    if (notification._id) {
      try {
        await fetch(`/api/notifications/${notification._id}/read`, {
          method: "PUT",
          credentials: "include",
        });
      } catch (error) {
        console.error("Error marking notification as read in database:", error);
      }
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    // Update local state immediately
    setAllNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving notifications:", error);
      }
      
      return updated;
    });

    // Mark all as read in database
    try {
      await fetch("/api/notifications/read-all", {
        method: "PUT",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error marking all notifications as read in database:", error);
    }
  };

  // Clear all notifications
  const clearAll = () => {
    setAllNotifications([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const handleNotificationClick = (notification: OrderNotification) => {
    markAsRead(notification);
    router.push(`/vi/employee/orders/${notification.orderId}`);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[380px] p-0 max-h-[500px]"
        align="end"
        sideOffset={5}
      >
        <div className="flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-lg">Thông báo đơn hàng</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} mới
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-8"
                >
                  Đánh dấu đã đọc
                </Button>
              )}
              {allNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs h-8 text-red-600 hover:text-red-700"
                >
                  Xóa tất cả
                </Button>
              )}
            </div>
          </div>
          
          {/* OS Notification Toggle */}
          {osNotificationSupported && (
            <div className="px-4 py-2 border-b bg-gray-50 dark:bg-gray-800/50">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={osNotificationEnabled}
                  onChange={async (e) => {
                    const enabled = e.target.checked;
                    if (enabled) {
                      const result = await requestPermission();
                      if (result === "granted") {
                        setOSNotificationEnabled(true);
                        localStorage.setItem("os_notifications_enabled", "true");
                      } else {
                        setOSNotificationEnabled(false);
                        localStorage.setItem("os_notifications_enabled", "false");
                        alert("Vui lòng cho phép thông báo trong cài đặt trình duyệt");
                      }
                    } else {
                      setOSNotificationEnabled(false);
                      localStorage.setItem("os_notifications_enabled", "false");
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Thông báo hệ điều hành
                </span>
                {permission === "denied" && (
                  <span className="text-xs text-red-500 ml-auto">
                    (Đã từ chối - cần bật trong cài đặt trình duyệt)
                  </span>
                )}
              </label>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {allNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chưa có thông báo nào
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Thông báo đơn hàng mới sẽ xuất hiện ở đây
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {allNotifications.map((notification) => (
                  <div
                    key={notification.orderId}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                      !notification.read
                        ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              Đơn hàng mới
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {notification.orderNumber || notification.orderId.slice(-8)}
                              </Badge>
                              {notification.isGuest && (
                                <Badge variant="secondary" className="text-xs">
                                  Khách
                                </Badge>
                              )}
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.itemCount} sản phẩm
                        </p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                          {formatCurrency(notification.total)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {format(
                            new Date(notification.timestamp),
                            "HH:mm - dd/MM/yyyy",
                            { locale: vi }
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div className="border-t p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Đã kết nối</span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <span>Đang kết nối...</span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/vi/employee/orders")}
                className="text-xs h-8"
              >
                Xem tất cả đơn hàng
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

