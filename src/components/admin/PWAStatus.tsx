"use client";

import { useState, useEffect } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function PWAStatus() {
  // Hooks must be called at top level
  const { isInstalled, isInstallable } = useInstallPrompt();
  const { hasUpdate, isUpdating, update } = useServiceWorker();
  const [swStatus, setSwStatus] = useState<"active" | "installing" | "waiting" | "none">("none");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkSWStatus = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setSwStatus("none");
      setError("Trình duyệt không hỗ trợ Service Worker");
      return;
    }
    
    setIsChecking(true);
    try {
      // Wait for service worker to be ready (Serwist auto-registers)
      let registration = await navigator.serviceWorker.getRegistration();
      
      // If no registration, wait a bit and try again (Serwist might still be registering)
      if (!registration) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        registration = await navigator.serviceWorker.getRegistration();
      }

      if (registration) {
        if (registration.active) {
          setSwStatus("active");
          setError(null);
        } else if (registration.installing) {
          setSwStatus("installing");
          // Listen for state change
          registration.installing.addEventListener('statechange', () => {
            if (registration?.installing?.state === 'activated') {
              setSwStatus("active");
            }
          });
        } else if (registration.waiting) {
          setSwStatus("waiting");
        } else {
          // Registration exists but no active/installing/waiting worker
          setSwStatus("none");
        }
      } else {
        setSwStatus("none");
        setError("Service Worker chưa được đăng ký. Vui lòng làm mới trang.");
      }
    } catch (err) {
      console.error("Error checking SW status:", err);
      setError("Không thể kiểm tra Service Worker");
      setSwStatus("none");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkSWStatus();
    const interval = setInterval(checkSWStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {
    try {
      await update();
    } catch (err) {
      console.error("Error updating:", err);
      setError("Không thể cập nhật ứng dụng");
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Trạng thái PWA
        </CardTitle>
        <CardDescription>Thông tin về Progressive Web App</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Worker Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {swStatus === "active" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : swStatus === "installing" || swStatus === "waiting" || isChecking ? (
                <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-medium">Service Worker</span>
            </div>
            <Badge
              variant={
                swStatus === "active"
                  ? "default"
                  : swStatus === "installing" || swStatus === "waiting"
                  ? "secondary"
                  : "destructive"
              }
            >
              {swStatus === "active"
                ? "Hoạt động"
                : swStatus === "installing"
                ? "Đang cài đặt"
                : swStatus === "waiting"
                ? "Đang chờ"
                : "Chưa kích hoạt"}
            </Badge>
          </div>
          {swStatus === "none" && (
            <Button
              onClick={checkSWStatus}
              disabled={isChecking}
              size="sm"
              variant="outline"
              className="w-full text-xs"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Kiểm tra lại
                </>
              )}
            </Button>
          )}
        </div>

        {/* Installation Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm font-medium">Cài đặt ứng dụng</span>
            </div>
            <Badge variant={isInstalled ? "default" : isInstallable ? "secondary" : "secondary"}>
              {isInstalled ? "Đã cài đặt" : isInstallable ? "Có thể cài đặt" : "Chưa cài đặt"}
            </Badge>
          </div>
          {!isInstalled && isInstallable && (
            <p className="text-xs text-muted-foreground">
              Nhấn nút cài đặt ở góc dưới bên phải màn hình
            </p>
          )}
          {!isInstalled && !isInstallable && swStatus !== "active" && (
            <p className="text-xs text-muted-foreground">
              Cần Service Worker hoạt động để có thể cài đặt
            </p>
          )}
        </div>

        {/* Update Available */}
        {hasUpdate && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Có bản cập nhật</span>
              </div>
            </div>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              className="w-full"
              variant="outline"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Cập nhật ngay
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="pt-2 border-t">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            PWA cho phép bạn nhận thông báo và truy cập nhanh hơn.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
