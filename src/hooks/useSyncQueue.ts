/**
 * Hook đơn giản - chỉ để cache data, không cần queue phức tạp
 */

import { useEffect, useState } from 'react';
import { cache } from '@/lib/pwa/idb';

export function useSyncQueue() {
  const [cacheCount, setCacheCount] = useState(0);

  const refreshCount = async () => {
    // Đơn giản - chỉ đếm số lượng cache entries (nếu cần)
    // Có thể bỏ qua nếu không cần hiển thị
    setCacheCount(0);
  };

  useEffect(() => {
    refreshCount();
  }, []);

  return {
    pendingCount: 0, // Không có queue
    isSyncing: false,
    lastSync: null,
    sync: async () => {}, // Không cần sync phức tạp
    refreshCount,
    hasPending: false,
  };
}
