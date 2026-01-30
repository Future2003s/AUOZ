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
    
    // Check service worker status - required for A2HS
    const checkSWStatus = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Wait for service worker to be ready (important for A2HS)
          const registration = await navigator.serviceWorker.ready;
          if (registration) {
            console.log("[Install Prompt] ✅ Service worker ready:", registration.scope);
            if (registration.active) {
              console.log("[Install Prompt] ✅ Service worker is active - A2HS ready");
            } else if (registration.installing) {
              console.log("[Install Prompt] ⏳ Service worker is installing...");
              // Wait for installation to complete
              registration.installing.addEventListener('statechange', () => {
                if (registration.installing?.state === 'activated') {
                  console.log("[Install Prompt] ✅ Service worker activated - A2HS ready");
                }
              });
            } else if (registration.waiting) {
              console.log("[Install Prompt] ⏳ Service worker is waiting...");
            }
          } else {
            console.warn("[Install Prompt] ⚠️ No service worker registration found - A2HS may not work");
          }
        } catch (error) {
          console.error("[Install Prompt] Error checking service worker:", error);
        }
      } else {
        console.warn("[Install Prompt] ⚠️ Service workers not supported - A2HS may not work");
      }
    };
    
    // Check SW status after a short delay to ensure registration is complete
    const swCheckTimeout = setTimeout(checkSWStatus, 2000);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      console.log("[Install Prompt] beforeinstallprompt event received");
      setDeferredPrompt(event);
      setIsInstallable(true);
    };
    
    // Debug: Log service worker status
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log("[Install Prompt] Service worker is ready:", registration.scope);
          if (navigator.serviceWorker.controller) {
            console.log("[Install Prompt] Service worker controller is active");
          } else {
            console.log("[Install Prompt] Service worker controller not active yet");
          }
        } catch (error) {
          console.error("[Install Prompt] Service worker check failed:", error);
        }
      }
    };
    
    checkServiceWorker();

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
      clearTimeout(swCheckTimeout);
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
        return;
      }
      
      // Check if service worker is ready
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (!registration.active) {
            console.warn("[Install Prompt] Service worker not active yet, waiting...");
            // Wait a bit and try again
            setTimeout(() => {
              if (deferredPrompt) {
                install();
              }
            }, 1000);
            return;
          }
        } catch (error) {
          console.error("[Install Prompt] Service worker not ready:", error);
        }
      }
      
      console.warn("[Install Prompt] Install prompt not available yet");
      return;
    }

    try {
      console.log("[Install Prompt] Showing install prompt...");
      
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`[Install Prompt] User choice: ${outcome}`);

      if (outcome === "accepted") {
        console.log("[Install Prompt] ✅ User accepted the install prompt");
        setIsInstalled(true);
        setIsInstallable(false);
      } else {
        console.log("[Install Prompt] ❌ User dismissed the install prompt");
      }

      // Clear the deferred prompt (can only be used once)
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("[Install Prompt] Error showing install prompt:", error);
      // Clear prompt on error
      setDeferredPrompt(null);
      setIsInstallable(false);
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
