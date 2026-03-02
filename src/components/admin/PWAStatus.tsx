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
    <div className="bg-white dark:bg-[#1f1f1f] rounded-[24px] border border-[#f1f3f4] dark:border-gray-800 p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] h-full">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-[18px] font-[500] flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Download className="w-5 h-5 text-[#0b57d0] dark:text-[#a8c7fa]" />
          Bộ đệm ứng dụng
        </h2>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">Quản lý tải trước và PWA.</p>
      </div>
      <div className="space-y-6">
        {/* Service Worker Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {swStatus === "active" ? (
                <CheckCircle2 className="w-[18px] h-[18px] text-[#146c2e] dark:text-[#c4eed0]" />
              ) : swStatus === "installing" || swStatus === "waiting" || isChecking ? (
                <Loader2 className="w-[18px] h-[18px] text-orange-500 animate-spin" />
              ) : (
                <AlertCircle className="w-[18px] h-[18px] text-gray-400" />
              )}
              <span className="text-[14px] font-[500] text-gray-700 dark:text-gray-300">Nền tảng Service Worker</span>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-[600] uppercase tracking-wider ${swStatus === "active"
                ? "bg-[#c4eed0]/50 text-[#146c2e] dark:bg-[#0f5223]/50 dark:text-[#c4eed0]"
                : swStatus === "installing" || swStatus === "waiting"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}>
              {swStatus === "active"
                ? "Bật"
                : swStatus === "installing"
                  ? "Đang cài đặt"
                  : swStatus === "waiting"
                    ? "Đang tải"
                    : "Chờ kích hoạt"}
            </div>
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
        <div className="pt-4 border-t border-[#f1f3f4] dark:border-gray-800">
          <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
            PWA (Progressive Web App) giúp trải nghiệm app nhanh mượt hơn ngay trên desktop và mobile web.
          </p>
        </div>
      </div>
    </div>
  );
}
