"use client";

import { useEffect } from "react";

/**
 * Serwist tự động register service worker
 * Component này chỉ để đảm bảo SW được load trong client-side
 */
export default function PWARegister() {
  useEffect(() => {
    // Chỉ register nếu PWA được bật
    const pwaEnabled = process.env.NEXT_PUBLIC_PWA_ENABLE !== "false";
    
    if (!pwaEnabled) {
      return;
    }

    // Serwist tự động register SW, nhưng có thể check status
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log("[PWA] Service worker ready:", registration.scope);
        })
        .catch((error) => {
          console.error("[PWA] Service worker error:", error);
        });
    }
  }, []);

  return null;
}
