"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.log("[Service Worker] Service workers not supported");
      return;
    }

    let registrationInterval: NodeJS.Timeout | null = null;

    const registerServiceWorker = async () => {
      try {
        console.log("[Service Worker] Starting registration...");
        
        // Unregister existing service workers first (for development)
        if (process.env.NODE_ENV === "development") {
          const existingRegistrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of existingRegistrations) {
            if (reg.scope === window.location.origin + "/") {
              console.log("[Service Worker] Unregistering existing service worker...");
              await reg.unregister();
            }
          }
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js", { 
          scope: "/",
          updateViaCache: "none" // Always check for updates
        });

        console.log("[Service Worker] Registration successful:", registration.scope);

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("[Service Worker] Service worker is ready");
        setIsReady(true);

        // Check for updates periodically
        registrationInterval = setInterval(() => {
          registration.update().catch(err => {
            console.error("[Service Worker] Update check failed:", err);
          });
        }, 60 * 60 * 1000); // Check every hour

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available
                console.log("[Service Worker] New version available");
                // Optionally show a notification to the user
                if (confirm("Phiên bản mới đã sẵn sàng. Bạn có muốn tải lại trang không?")) {
                  window.location.reload();
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("[Service Worker] Registration failed:", error);
        setIsReady(false);
      }
    };

    registerServiceWorker();

    // Handle service worker messages
    const handleMessage = (event: MessageEvent) => {
      console.log("[Service Worker] Message received:", event.data);
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    // Handle controller change (new service worker activated)
    const handleControllerChange = () => {
      console.log("[Service Worker] New controller activated");
      setIsReady(true);
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      if (registrationInterval) {
        clearInterval(registrationInterval);
      }
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}
