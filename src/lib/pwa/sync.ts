/**
 * Sync logic - đơn giản hóa, chỉ cache dữ liệu khi online
 */

import { cache } from './idb';
import { isOnline } from './network';

/**
 * Cache dữ liệu khi online (không cần queue phức tạp)
 */
export async function syncData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: { ttl?: number } = {}
): Promise<T | null> {
  if (!isOnline()) {
    // Offline - trả về cached data nếu có
    const cached = await cache.get<T>(key);
    return cached;
  }

  try {
    // Online - fetch mới và cache
    const data = await fetchFn();
    
    // Lưu vào cache
    await cache.set(key, data, options.ttl);

    return data;
  } catch (error) {
    console.error(`[Sync] Error fetching data for key ${key}:`, error);
    
    // Fallback to cache
    const cached = await cache.get<T>(key);
    return cached;
  }
}
