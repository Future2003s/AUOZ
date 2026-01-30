/**
 * Hook để quản lý Service Worker lifecycle
 */

import { useEffect, useState, useCallback } from 'react';
import {
  checkForUpdate,
  skipWaitingAndReload,
  onUpdateAvailable,
  getRegistration,
  isServiceWorkerSupported,
} from '@/lib/pwa/service-worker';

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdating: false,
    hasUpdate: false,
    registration: null,
  });

  useEffect(() => {
    const supported = isServiceWorkerSupported();
    setState((prev) => ({ ...prev, isSupported: supported }));

    if (!supported) {
      return;
    }

    // Serwist tự động register SW, chỉ cần check status
    const checkRegistration = async () => {
      try {
        const registration = await getRegistration();
        if (registration) {
          setState((prev) => ({
            ...prev,
            isRegistered: true,
            registration,
          }));

          // Check for update
          checkForUpdate();
        } else {
          // Đợi một chút rồi check lại (Serwist có thể chưa register xong)
          setTimeout(checkRegistration, 1000);
        }
      } catch (error) {
        console.error('[useServiceWorker] Check registration error:', error);
      }
    };

    checkRegistration();

    // Listen for updates
    const cleanup = onUpdateAvailable(() => {
      setState((prev) => ({ ...prev, hasUpdate: true }));
    });

    return cleanup;
  }, []);

  const update = useCallback(async () => {
    setState((prev) => ({ ...prev, isUpdating: true }));
    try {
      await skipWaitingAndReload();
    } catch (error) {
      console.error('[useServiceWorker] Update error:', error);
      setState((prev) => ({ ...prev, isUpdating: false }));
    }
  }, []);

  const checkUpdate = useCallback(async () => {
    const hasUpdate = await checkForUpdate();
    setState((prev) => ({ ...prev, hasUpdate }));
    return hasUpdate;
  }, []);

  return {
    ...state,
    update,
    checkUpdate,
  };
}
