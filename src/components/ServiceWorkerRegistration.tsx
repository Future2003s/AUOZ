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
        
        // First, check if service worker file is accessible
        try {
          const swUrl = "/sw.js";
          const response = await fetch(swUrl, { method: "HEAD" });
          if (!response.ok) {
            console.error("[Service Worker] Service worker file not found at", swUrl);
            return;
          }
          console.log("[Service Worker] Service worker file is accessible");
        } catch (fetchError) {
          console.error("[Service Worker] Cannot access service worker file:", fetchError);
          return;
        }

        // Check for existing registrations
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        console.log("[Service Worker] Existing registrations:", existingRegistrations.length);
        
        // In development, only unregister if we want a fresh start
        // But let's keep existing ones and just update them
        if (process.env.NODE_ENV === "development" && existingRegistrations.length > 0) {
          console.log("[Service Worker] Development mode: Found existing registrations");
          // Don't unregister, just use existing or update
        }

        // Register service worker
        console.log("[Service Worker] Registering service worker at /sw.js");
        const registration = await navigator.serviceWorker.register("/sw.js", { 
          scope: "/",
          updateViaCache: "none" // Always check for updates
        });

        console.log("[Service Worker] Registration successful:", {
          scope: registration.scope,
          active: registration.active?.state,
          installing: registration.installing?.state,
          waiting: registration.waiting?.state
        });

        // Wait for service worker to be ready
        const readyRegistration = await navigator.serviceWorker.ready;
        console.log("[Service Worker] Service worker is ready:", {
          scope: readyRegistration.scope,
          active: readyRegistration.active?.state
        });
        
        setIsReady(true);

        // Check for updates periodically
        registrationInterval = setInterval(() => {
          registration.update().catch(err => {
            console.error("[Service Worker] Update check failed:", err);
          });
        }, 60 * 60 * 1000); // Check every hour

        // Handle updates
        registration.addEventListener("updatefound", () => {
          console.log("[Service Worker] Update found");
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              console.log("[Service Worker] New worker state:", newWorker.state);
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

        // Log current controller
        if (navigator.serviceWorker.controller) {
          console.log("[Service Worker] Controller is active:", navigator.serviceWorker.controller.scriptURL);
        } else {
          console.log("[Service Worker] No controller yet (will activate on next page load)");
        }

        // Monitor service worker state changes
        if (registration.installing) {
          console.log("[Service Worker] Installing worker state:", registration.installing.state);
          registration.installing.addEventListener("statechange", (e) => {
            const worker = e.target as ServiceWorker;
            console.log("[Service Worker] Worker state changed to:", worker.state);
            if (worker.state === "activated") {
              console.log("[Service Worker] ✅ Service worker activated successfully!");
            }
          });
        }
        
        if (registration.waiting) {
          console.log("[Service Worker] Waiting worker state:", registration.waiting.state);
        }
        
        if (registration.active) {
          console.log("[Service Worker] Active worker state:", registration.active.state);
        }
      } catch (error) {
        console.error("[Service Worker] Registration failed:", error);
        if (error instanceof Error) {
          console.error("[Service Worker] Error details:", {
            message: error.message,
            stack: error.stack
          });
        }
        setIsReady(false);
      }
    };

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

    // Register after a short delay to ensure page is loaded
    const timeoutId = setTimeout(() => {
      registerServiceWorker();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (registrationInterval) {
        clearInterval(registrationInterval);
      }
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}
