"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface UsePushNotificationReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isSubscribing: boolean;
  subscription: PushSubscription | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  error: string | null;
}

export function usePushNotification(): UsePushNotificationReturn {
  const { isAuthenticated } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  // Check current subscription status
  useEffect(() => {
    if (!isSupported || !isAuthenticated) {
      setIsSubscribed(false);
      setSubscription(null);
      return;
    }

    const checkSubscription = async () => {
      try {
        // Đợi service worker ready với timeout
        const waitForSW = async (timeout = 10000) => {
          return Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('SW timeout')), timeout)
            )
          ]);
        };

        // Kiểm tra xem có registration không
        let registration: ServiceWorkerRegistration | null = null;
        
        try {
          // Thử lấy registration hiện có
          registration = (await navigator.serviceWorker.getRegistration()) || null;
          
          // Nếu chưa có, đợi ready
          if (!registration) {
            console.log("[Push Notification] Waiting for service worker to register...");
            registration = await waitForSW() as ServiceWorkerRegistration;
          } else {
            // Đợi ready để đảm bảo SW active
            await waitForSW(5000);
          }
          
          console.log("[Push Notification] Service worker ready");
        } catch (swError) {
          console.warn("[Push Notification] Service worker not ready yet:", swError);
          // Retry sau 2 giây
          setTimeout(() => {
            checkSubscription();
          }, 2000);
          return;
        }

        // Lấy registration một lần nữa để đảm bảo
        registration = (await navigator.serviceWorker.getRegistration()) || null;
        if (!registration) {
          console.warn("[Push Notification] No service worker registration found");
          return;
        }

        const sub = await registration.pushManager.getSubscription();
        
        if (sub) {
          console.log("[Push Notification] Found existing subscription");
          setSubscription(sub);
          setIsSubscribed(true);
          
          // Verify subscription with backend (non-blocking)
          verifySubscription(sub).catch(err => {
            console.error("[Push Notification] Verification failed:", err);
          });
        } else {
          console.log("[Push Notification] No subscription found");
          setIsSubscribed(false);
          setSubscription(null);
        }
      } catch (err) {
        console.error("[Push Notification] Error checking subscription:", err);
        // Không set error để tránh spam, chỉ log
        setIsSubscribed(false);
        setSubscription(null);
      }
    };

    // Đợi một chút để đảm bảo SW đã được register
    const timeoutId = setTimeout(() => {
      checkSubscription();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isSupported, isAuthenticated]);

  // Verify subscription with backend
  const verifySubscription = async (sub: PushSubscription) => {
    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
          auth: arrayBufferToBase64(sub.getKey("auth")!),
        },
      };

      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error("Failed to verify subscription");
      }
    } catch (err) {
      console.error("Error verifying subscription:", err);
    }
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Trình duyệt của bạn không hỗ trợ push notifications");
      return false;
    }

    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để sử dụng thông báo push");
      return false;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      console.log("[Push Notification] Starting subscription process...");

      // Request notification permission
      console.log("[Push Notification] Requesting notification permission...");
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        const errorMsg = permission === "denied" 
          ? "Quyền thông báo đã bị từ chối. Vui lòng bật trong cài đặt trình duyệt."
          : "Quyền thông báo bị từ chối";
        setError(errorMsg);
        setIsSubscribing(false);
        return false;
      }

      console.log("[Push Notification] Permission granted, getting service worker...");

      // Đợi service worker ready với timeout
      let registration: ServiceWorkerRegistration;
      try {
        registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<ServiceWorkerRegistration>((_, reject) => 
            setTimeout(() => reject(new Error('SW timeout')), 10000)
          )
        ]);
        console.log("[Push Notification] Service worker ready");
      } catch (swError) {
        throw new Error("Service worker chưa sẵn sàng. Vui lòng đợi và thử lại sau.");
      }

      // Get VAPID public key from server
      console.log("[Push Notification] Fetching VAPID key...");
      let publicKey: string;
      try {
        const vapidKeyResponse = await fetch("/api/notifications/push/vapid-key");
        if (!vapidKeyResponse.ok) {
          if (vapidKeyResponse.status === 404) {
            throw new Error("VAPID key endpoint không tồn tại. Vui lòng cấu hình backend.");
          }
          throw new Error(`Không thể lấy VAPID key từ server (${vapidKeyResponse.status})`);
        }
        const data = await vapidKeyResponse.json();
        publicKey = data.publicKey;
        
        if (!publicKey) {
          throw new Error("VAPID key không hợp lệ");
        }
      } catch (fetchError) {
        console.error("[Push Notification] VAPID key fetch error:", fetchError);
        throw fetchError instanceof Error 
          ? fetchError 
          : new Error("Lỗi khi lấy VAPID key từ server");
      }

      console.log("[Push Notification] VAPID key received, subscribing...");

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      console.log("[Push Notification] Subscribed successfully, saving to backend...");

      setSubscription(sub);
      setIsSubscribed(true);

      // Send subscription to backend
      const subscriptionData: PushSubscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
          auth: arrayBufferToBase64(sub.getKey("auth")!),
        },
      };

      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Không thể lưu subscription vào server");
      }

      console.log("[Push Notification] Subscription saved to backend successfully");
      setIsSubscribing(false);
      return true;
    } catch (err) {
      console.error("[Push Notification] Error subscribing:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Lỗi khi đăng ký thông báo. Vui lòng thử lại sau.";
      setError(errorMessage);
      setIsSubscribing(false);
      
      // Reset state on error
      setSubscription(null);
      setIsSubscribed(false);
      return false;
    }
  }, [isSupported, isAuthenticated]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsSubscribing(true);
    setError(null);

    try {
      console.log("[Push Notification] Starting unsubscribe process...");

      // Get current subscription if not available
      let currentSubscription = subscription;
      if (!currentSubscription) {
        console.log("[Push Notification] No subscription in state, checking service worker...");
        try {
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<ServiceWorkerRegistration>((_, reject) => 
              setTimeout(() => reject(new Error('SW timeout')), 5000)
            )
          ]);
          currentSubscription = await registration.pushManager.getSubscription();
        } catch (swError) {
          console.warn("[Push Notification] Service worker not ready for unsubscribe:", swError);
          // Vẫn tiếp tục với unsubscribe nếu có subscription trong state
        }
      }

      if (!currentSubscription) {
        console.log("[Push Notification] No subscription found to unsubscribe");
        setSubscription(null);
        setIsSubscribed(false);
        setIsSubscribing(false);
        return true; // Already unsubscribed
      }

      console.log("[Push Notification] Unsubscribing from push manager...");
      // Unsubscribe from push manager
      await currentSubscription.unsubscribe();

      console.log("[Push Notification] Removing subscription from backend...");
      // Remove subscription from backend
      const response = await fetch("/api/notifications/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: currentSubscription.endpoint }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Không thể xóa subscription từ server");
      }

      console.log("[Push Notification] Unsubscribed successfully");
      setSubscription(null);
      setIsSubscribed(false);
      setIsSubscribing(false);
      return true;
    } catch (err) {
      console.error("[Push Notification] Error unsubscribing:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Lỗi khi hủy đăng ký. Vui lòng thử lại sau.";
      setError(errorMessage);
      setIsSubscribing(false);
      return false;
    }
  }, [subscription]);

  return {
    isSupported,
    isSubscribed,
    isSubscribing,
    subscription,
    subscribe,
    unsubscribe,
    error,
  };
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
