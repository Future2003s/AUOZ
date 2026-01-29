"use client";

import { useState } from "react";
import { usePushNotification } from "@/hooks/usePushNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isSubscribing,
    subscribe,
    unsubscribe,
    error,
  } = usePushNotification();

  const [localError, setLocalError] = useState<string | null>(null);

  const handleToggle = async (enabled: boolean) => {
    setLocalError(null);
    
    try {
      if (enabled) {
        console.log("[Push Settings] Enabling push notifications...");
        const success = await subscribe();
        if (success) {
          toast.success("Đã bật thông báo push thành công!");
        } else {
          const errorMsg = error || "Không thể bật thông báo push";
          setLocalError(errorMsg);
          toast.error(errorMsg);
        }
      } else {
        console.log("[Push Settings] Disabling push notifications...");
        const success = await unsubscribe();
        if (success) {
          toast.success("Đã tắt thông báo push");
        } else {
          const errorMsg = error || "Không thể tắt thông báo push";
          setLocalError(errorMsg);
          toast.error(errorMsg);
        }
      }
    } catch (err) {
      console.error("[Push Settings] Error in handleToggle:", err);
      const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      setLocalError(errorMsg);
      toast.error(errorMsg);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            Thông báo Push
          </CardTitle>
          <CardDescription>
            Trình duyệt của bạn không hỗ trợ thông báo push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const displayError = error || localError;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Thông báo Push
        </CardTitle>
        <CardDescription>
          Nhận thông báo đơn hàng mới ngay trên thiết bị của bạn, ngay cả khi ứng dụng đang đóng
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{displayError}</span>
          </div>
        )}

        {isSubscribed && !displayError && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã bật thông báo push</span>
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex-1 space-y-1">
            <Label htmlFor="push-notifications" className="text-base font-semibold cursor-pointer">
              Thông báo đơn hàng mới
            </Label>
            <p className="text-sm text-muted-foreground">
              Nhận thông báo ngay khi có đơn hàng mới được đặt
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSubscribing ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={handleToggle}
                disabled={isSubscribing}
                aria-label="Bật/tắt thông báo push"
              />
            )}
          </div>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs space-y-1">
            <p><strong>Debug Info:</strong></p>
            <p>Supported: {isSupported ? "Yes" : "No"}</p>
            <p>Subscribed: {isSubscribed ? "Yes" : "No"}</p>
            <p>Subscribing: {isSubscribing ? "Yes" : "No"}</p>
            <p>Service Worker: {typeof navigator !== "undefined" && "serviceWorker" in navigator ? "Available" : "Not Available"}</p>
            <p>Push Manager: {typeof window !== "undefined" && "PushManager" in window ? "Available" : "Not Available"}</p>
            {error && <p className="text-red-600">Error: {error}</p>}
          </div>
        )}

        <div className="pt-2 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium">Lợi ích:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Nhận thông báo ngay lập tức khi có đơn hàng mới</li>
            <li>Hoạt động ngay cả khi ứng dụng đang đóng</li>
            <li>Không cần mở trình duyệt để nhận thông báo</li>
            <li>Tiết kiệm pin và dữ liệu</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
