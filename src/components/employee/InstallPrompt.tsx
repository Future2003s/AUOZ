"use client";

import { useState, useEffect } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, X, Smartphone, Share2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, install } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("[InstallPrompt] State:", {
      isInstallable,
      isInstalled,
      isIOS,
      showPrompt,
      dismissed,
    });
  }, [isInstallable, isInstalled, isIOS, showPrompt, dismissed]);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const dismissedKey = "a2hs-dismissed";
    const dismissedTime = localStorage.getItem(dismissedKey);
    const dismissedTimestamp = dismissedTime ? parseInt(dismissedTime, 10) : 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    // Show prompt if:
    // 1. App is installable or iOS
    // 2. Not already installed
    // 3. Not dismissed in last 24 hours
    // 4. Wait 5 seconds after page load (give time for SW to activate)
    if ((isInstallable || isIOS) && !isInstalled && dismissedTimestamp < oneDayAgo) {
      const timer = setTimeout(() => {
        // Double check service worker is ready before showing
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(() => {
            setShowPrompt(true);
          }).catch(() => {
            // Still show if SW check fails (might be iOS)
            setShowPrompt(true);
          });
        } else {
          setShowPrompt(true);
        }
      }, 5000); // Increased delay to ensure SW is ready

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isIOS, isInstalled]);

  const handleInstall = async () => {
    await install();
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("a2hs-dismissed", Date.now().toString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("a2hs-dismissed", Date.now().toString());
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed || !showPrompt) {
    return null;
  }

  return (
    <>
      {/* Banner for Android/Desktop - Similar to a2hs example */}
      {!isIOS && isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <Card className="border-2 border-primary shadow-2xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg flex-shrink-0">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 text-foreground">
                    Cài đặt ứng dụng
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Cài đặt để truy cập nhanh hơn, làm việc offline và nhận thông báo
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Cài đặt ngay
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismiss}
                      className="px-2 flex-shrink-0"
                      aria-label="Đóng"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog for iOS */}
      {isIOS && (
        <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Cài đặt ứng dụng
              </DialogTitle>
              <DialogDescription>
                Thêm ứng dụng vào màn hình chính để truy cập nhanh hơn
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="p-2 bg-primary/20 rounded">
                    <Share2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">Bước 1</p>
                    <p className="text-sm text-muted-foreground">
                      Nhấn nút <strong>Share</strong> (chia sẻ) ở thanh dưới cùng của trình duyệt
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="p-2 bg-primary/20 rounded">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">Bước 2</p>
                    <p className="text-sm text-muted-foreground">
                      Chọn <strong>"Thêm vào Màn hình chính"</strong> hoặc <strong>"Add to Home Screen"</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="p-2 bg-primary/20 rounded">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">Bước 3</p>
                    <p className="text-sm text-muted-foreground">
                      Nhấn <strong>"Thêm"</strong> để hoàn tất cài đặt
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleDismiss} variant="outline" className="flex-1">
                  Để sau
                </Button>
                <Button onClick={handleDismiss} className="flex-1">
                  Đã hiểu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Floating Install Button (always visible if installable) */}
      {!isIOS && isInstallable && !isInstalled && (
        <Button
          onClick={handleInstall}
          className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground"
          size="icon"
          title="Cài đặt ứng dụng"
        >
          <Download className="w-5 h-5" />
          <span className="sr-only">Cài đặt ứng dụng</span>
        </Button>
      )}
    </>
  );
}
