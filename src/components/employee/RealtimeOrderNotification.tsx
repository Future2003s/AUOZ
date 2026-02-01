"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { usePushNotification } from "@/hooks/usePushNotification";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, 
  X, 
  Bell, 
  CheckCircle2,
  AlertCircle,
  ExternalLink 
} from "lucide-react";
import { toast } from "sonner";
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
}

export function RealtimeOrderNotification() {
  const router = useRouter();
  const { 
    isConnected, 
    orderNotifications, 
    clearNotifications,
    joinEmployeeRoom,
    leaveEmployeeRoom 
  } = useSocket();
  const { isSubscribed } = usePushNotification();
  const [isVisible, setIsVisible] = useState(true);
  const [currentNotification, setCurrentNotification] = useState<OrderNotification | null>(null);

  // Join employee room when component mounts
  useEffect(() => {
    if (isConnected) {
      joinEmployeeRoom();
    }
    return () => {
      leaveEmployeeRoom();
    };
  }, [isConnected, joinEmployeeRoom, leaveEmployeeRoom]);

  // Show latest notification
  useEffect(() => {
    if (orderNotifications.length > 0) {
      const latest = orderNotifications[0];
      setCurrentNotification(latest);
      setIsVisible(true);

      // Show browser notification if push is enabled
      if (isSubscribed && typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          const notification = new Notification("Đơn hàng mới!", {
            body: `Đơn hàng ${latest.orderNumber || latest.orderId} - ${formatCurrency(latest.total)}`,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-96.png",
            tag: `order-${latest.orderId}`,
            requireInteraction: false,
            data: {
              orderId: latest.orderId,
              url: `/vi/employee/orders/${latest.orderId}`,
            },
          });

          notification.onclick = () => {
            window.focus();
            router.push(`/vi/employee/orders/${latest.orderId}`);
            notification.close();
          };
        }
      }

      // Show toast notification
      toast.success(`Đơn hàng mới: ${latest.orderNumber || latest.orderId}`, {
        description: `${latest.itemCount} sản phẩm - ${formatCurrency(latest.total)}`,
        action: {
          label: "Xem",
          onClick: () => router.push(`/vi/employee/orders/${latest.orderId}`),
        },
      });
    }
  }, [orderNotifications, isSubscribed, router]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/vi/employee/orders/${orderId}`);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (currentNotification) {
      setCurrentNotification(null);
    }
  };

  if (!isVisible || !currentNotification) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-full max-w-sm animate-in slide-in-from-top-5 duration-300">
      <Card className="border-2 border-blue-500 shadow-lg bg-white dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Đơn hàng mới!
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleDismiss}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {currentNotification.orderNumber || currentNotification.orderId}
                  </Badge>
                  {currentNotification.isGuest && (
                    <Badge variant="secondary" className="text-xs">
                      Khách
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {currentNotification.itemCount} sản phẩm
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(currentNotification.total)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {format(new Date(currentNotification.timestamp), "HH:mm:ss - dd/MM/yyyy", {
                    locale: vi,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleViewOrder(currentNotification.orderId)}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Xem đơn hàng
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection status indicator */}
      <div className="mt-2 flex items-center justify-end gap-2">
        {isConnected ? (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã kết nối</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
            <AlertCircle className="w-3 h-3" />
            <span>Đang kết nối...</span>
          </div>
        )}
        {orderNotifications.length > 1 && (
          <Badge variant="secondary" className="text-xs">
            +{orderNotifications.length - 1} đơn khác
          </Badge>
        )}
      </div>
    </div>
  );
}

