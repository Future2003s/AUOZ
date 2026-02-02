"use client";

import { useState, useEffect, useCallback } from "react";

interface ExtendedNotificationOptions extends NotificationOptions {
  title?: string;
  autoClose?: boolean;
  vibrate?: number[];
}

interface UseOSNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (options: ExtendedNotificationOptions) => Promise<Notification | null>;
  isMobile: boolean;
}

// Detect if running on mobile device
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for iOS
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return true;
  }
  
  // Check for Android
  if (/android/i.test(userAgent)) {
    return true;
  }
  
  // Check for mobile in general
  return /Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent);
}

export function useOSNotifications(): UseOSNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      
      // Check if notifications are supported
      if ("Notification" in window) {
        setIsSupported(true);
        setPermission(Notification.permission);
      } else if (mobile && "serviceWorker" in navigator) {
        // On mobile, Service Worker might be required
        setIsSupported(true);
        // Permission will be checked via Service Worker
      }
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return "denied";
    }

    try {
      // On mobile, ensure Service Worker is ready first
      if (isMobile && "serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          // Service Worker is ready, proceed with permission request
        } catch (swError) {
          console.warn("Service Worker not ready:", swError);
        }
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }, [isSupported, isMobile]);

  const showNotification = useCallback(
    async (options: ExtendedNotificationOptions): Promise<Notification | null> => {
      if (!isSupported) {
        console.warn("Notifications not supported");
        return null;
      }

      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return null;
      }

      try {
        // Use absolute URL for icon to ensure all platforms can access it
        const iconUrl = options.icon 
          ? (options.icon.startsWith("http") ? options.icon : `${window.location.origin}${options.icon}`)
          : `${window.location.origin}/icons/icon-192.png`;
        
        const badgeUrl = options.badge
          ? (options.badge.startsWith("http") ? options.badge : `${window.location.origin}${options.badge}`)
          : `${window.location.origin}/icons/icon-96.png`;

        // On mobile (iOS/Android), use Service Worker to show notification
        if (isMobile && "serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            
            // Use Service Worker registration to show notification
            // This is required for iOS and works better on Android
            await registration.showNotification(options.title || "Thông báo", {
              body: options.body,
              icon: iconUrl,
              badge: badgeUrl,
              tag: options.tag,
              requireInteraction: options.requireInteraction || false,
              silent: false,
              vibrate: options.vibrate || [200, 100, 200], // Vibration pattern for mobile
              data: options.data,
              ...options,
            });

            // Return a mock notification object for consistency
            return {
              close: () => {},
              onclick: null,
            } as Notification;
          } catch (swError) {
            console.error("Error showing notification via Service Worker:", swError);
            // Fallback to regular Notification API
          }
        }

        // Desktop: Use regular Notification API
        const notification = new Notification(options.title || "Thông báo", {
          body: options.body,
          icon: iconUrl,
          badge: badgeUrl,
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
          silent: false, // Ensure sound plays (Windows requirement)
          data: options.data,
          ...options,
        });

        // Handle notification click
        notification.onclick = (event) => {
          event.preventDefault();
          
          // Focus window if it exists
          if (window) {
            window.focus();
          }

          // Navigate to URL if provided in data
          if (options.data?.url) {
            window.location.href = options.data.url;
          }
          
          // Don't close immediately - let OS handle it
          // This ensures it stays in notification center
          setTimeout(() => {
            notification.close();
          }, 100);
        };

        // For Windows/Mobile: Don't auto-close notifications too quickly
        // This ensures they appear in notification center
        if (!options.requireInteraction && options.autoClose !== false) {
          // Increase timeout for OS to register in notification center
          const timeout = isMobile ? 15000 : 10000; // Mobile needs more time
          setTimeout(() => {
            notification.close();
          }, timeout);
        }

        return notification;
      } catch (error) {
        console.error("Error showing notification:", error);
        return null;
      }
    },
    [isSupported, permission, isMobile]
  );

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    isMobile,
  };
}

