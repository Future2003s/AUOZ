/**
 * Hook để detect online/offline status
 */

import { useEffect, useState } from 'react';
import { isOnline, onOnline, onOffline, getConnectionInfo, ConnectionInfo } from '@/lib/pwa/network';

export function useOffline() {
  const [online, setOnline] = useState(() => isOnline());
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(() => getConnectionInfo());

  useEffect(() => {
    setOnline(isOnline());
    setConnectionInfo(getConnectionInfo());

    const cleanupOnline = onOnline(() => {
      setOnline(true);
      setConnectionInfo(getConnectionInfo());
    });

    const cleanupOffline = onOffline(() => {
      setOnline(false);
      setConnectionInfo(getConnectionInfo());
    });

    return () => {
      cleanupOnline();
      cleanupOffline();
    };
  }, []);

  return {
    online,
    isOnline: online, // Alias for compatibility
    offline: !online,
    connectionInfo,
    isSlowConnection: connectionInfo?.effectiveType === 'slow-2g' || connectionInfo?.effectiveType === '2g',
    isSaveData: connectionInfo?.saveData === true,
  };
}
