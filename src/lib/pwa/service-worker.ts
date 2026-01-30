/**
 * Service Worker utilities - Serwist version
 * Serwist tự động register SW, các functions này chỉ để check status
 */

/**
 * Kiểm tra xem Service Worker có được support không
 */
export function isServiceWorkerSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'serviceWorker' in navigator;
}

/**
 * Lấy registration hiện tại (Serwist tự động register)
 */
export async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    return (await navigator.serviceWorker.getRegistration()) || null;
  } catch (error) {
    console.error('[SW] Get registration error:', error);
    return null;
  }
}

/**
 * Kiểm tra update
 */
export async function checkForUpdate(): Promise<boolean> {
  try {
    const registration = await getRegistration();
    if (!registration) {
      return false;
    }
    await registration.update();
    return true;
  } catch (error) {
    console.error('[SW] Check update error:', error);
    return false;
  }
}

/**
 * Skip waiting và reload (khi có update)
 */
export async function skipWaitingAndReload(): Promise<void> {
  try {
    const registration = await getRegistration();
    if (!registration || !registration.waiting) {
      return;
    }

    // Gửi message để SW skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Đợi một chút rồi reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  } catch (error) {
    console.error('[SW] Skip waiting error:', error);
  }
}

/**
 * Lắng nghe update event
 */
export function onUpdateAvailable(callback: () => void): () => void {
  let registration: ServiceWorkerRegistration | null = null;

  const checkRegistration = async () => {
    registration = await getRegistration();
    if (!registration) {
      return;
    }

    const handleUpdate = () => {
      if (registration?.waiting) {
        callback();
      }
    };

    // Listen for waiting event
    registration.addEventListener('updatefound', () => {
      const newWorker = registration?.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && registration?.waiting) {
            handleUpdate();
          }
        });
      }
    });

    // Check immediately
    if (registration.waiting) {
      handleUpdate();
    }
  };

  checkRegistration();

  return () => {
    // Cleanup nếu cần
  };
}
