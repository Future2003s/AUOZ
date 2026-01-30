import { installSerwist } from "@serwist/sw";

declare const self: any & {
  __SW_MANIFEST: Array<{ url: string; revision: string | null }> | undefined;
};

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Static assets - CacheFirst với stale-while-revalidate
    {
      urlPattern: ({ request }) => {
        const url = new URL(request.url);
        return (
          url.pathname.startsWith("/_next/static/") ||
          url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i)
        );
      },
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 năm
        },
      },
    },
    // Images - StaleWhileRevalidate
    {
      urlPattern: ({ request }) => {
        const url = new URL(request.url);
        return (
          url.pathname.startsWith("/images/") ||
          url.pathname.startsWith("/icons/") ||
          url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i)
        );
      },
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 ngày
        },
      },
    },
    // API requests - NetworkFirst (luôn yêu cầu mạng, không cache)
    {
      urlPattern: ({ request }) => {
        const url = new URL(request.url);
        return url.pathname.startsWith("/api/") || url.pathname.startsWith("/vi/api/");
      },
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60, // Chỉ cache 1 phút cho fallback
        },
      },
    },
    // Admin routes - StaleWhileRevalidate for better offline support
    {
      urlPattern: ({ request }) => {
        const pathname = new URL(request.url).pathname;
        return pathname.startsWith("/vi/admin") || pathname.startsWith("/en/admin");
      },
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "admin-pages",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    // HTML pages - NetworkFirst (không cache HTML)
    {
      urlPattern: ({ request }) => {
        return request.headers.get("accept")?.includes("text/html") ?? false;
      },
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60,
        },
      },
    },
  ],
});

// Push notification handler
self.addEventListener("push", (event: any) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || "LALA-LYCHEEE Employee";
    const options = {
      body: data.body || "Bạn có thông báo mới",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data: data.data || {},
      tag: data.tag || "default",
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error("[SW] Push notification error:", error);
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();

  // Check if notification is for admin or employee
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || "/vi/admin/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList: any[]) => {
        // Tìm window đã mở
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Mở window mới
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log("[SW] Serwist service worker loaded");
