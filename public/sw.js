// Service Worker for LALA-LYCHEEE Employee Portal
const CACHE_NAME = 'lala-employee-v1';
const RUNTIME_CACHE = 'lala-runtime-v1';
const STATIC_CACHE = 'lala-static-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/vi/employee',
  '/images/logo.png',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE && 
                   cacheName !== RUNTIME_CACHE &&
                   cacheName.startsWith('lala-');
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle HTML pages with network-first strategy
  event.respondWith(networkFirst(request));
});

// Network-first strategy: try network, fallback to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Clone the response for caching
    const responseClone = networkResponse.clone();
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a navigation request and we have a cached index, return that
    if (request.mode === 'navigate') {
      const indexCache = await caches.match('/');
      if (indexCache) {
        return indexCache;
      }
    }
    
    // Return offline page or error response
    return new Response('Offline - Không có kết nối mạng', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// Cache-first strategy: try cache, fallback to network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Cache and network failed:', request.url);
    return new Response('Resource not available', {
      status: 404,
      statusText: 'Not Found',
    });
  }
}

// Background sync for offline actions (if needed in future)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  // Implement background sync logic here if needed
});

// Push notifications handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  let notificationData = {
    title: 'Thông báo mới',
    body: 'Bạn có thông báo mới',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    tag: 'default',
    data: {},
    requireInteraction: false,
    actions: [],
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [],
      };
    } catch (e) {
      const text = event.data.text();
      if (text) {
        notificationData.body = text;
      }
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.requireInteraction,
    actions: notificationData.actions,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/vi/employee/orders';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
});
