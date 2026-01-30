/**
 * Network detection utilities - đơn giản hóa
 */

export interface ConnectionInfo {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}

/**
 * Kiểm tra xem có online không
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true; // SSR - assume online
  }
  return navigator.onLine;
}

/**
 * Lấy thông tin kết nối mạng (nếu có)
 */
export function getConnectionInfo(): ConnectionInfo | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null; // SSR
  }

  // Check if Network Information API is available
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

  if (!connection) {
    return null;
  }

  return {
    effectiveType: connection.effectiveType,
    saveData: connection.saveData,
    downlink: connection.downlink,
    rtt: connection.rtt,
  };
}

/**
 * Lắng nghe sự kiện online/offline
 */
export function onOnline(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // SSR
  }

  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

export function onOffline(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // SSR
  }

  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}
