"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UseInstallPromptReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  prompt: (() => Promise<void>) | null;
  install: () => Promise<void>;
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("App installed successfully");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if already installed on page load
    if (standalone) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      if (isIOS) {
        alert(
          "Để cài đặt ứng dụng:\n\n" +
          "1. Nhấn nút Share (chia sẻ) ở thanh dưới cùng\n" +
          "2. Chọn 'Thêm vào Màn hình chính'\n" +
          "3. Nhấn 'Thêm' để hoàn tất"
        );
      }
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        setIsInstalled(true);
      } else {
        console.log("User dismissed the install prompt");
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("Error showing install prompt:", error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    prompt: deferredPrompt ? () => deferredPrompt.prompt() : null,
    install,
  };
}
