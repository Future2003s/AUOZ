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
    // 4. Wait 3 seconds after page load
    if ((isInstallable || isIOS) && !isInstalled && dismissedTimestamp < oneDayAgo) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

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
      {/* Banner for Android/Desktop */}
      {!isIOS && isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
          <Card className="border-2 border-primary shadow-2xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1 text-foreground">
                    Cài đặt ứng dụng
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Cài đặt để truy cập nhanh hơn và làm việc offline
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Cài đặt ngay
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismiss}
                      className="px-2"
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
      {!isIOS && isInstallable && !showPrompt && !isInstalled && (
        <Button
          onClick={handleInstall}
          className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          <Download className="w-5 h-5" />
          <span className="sr-only">Cài đặt ứng dụng</span>
        </Button>
      )}
    </>
  );
}
