/**
 * IndexedDB wrapper sử dụng idb library
 * Đơn giản hóa - chỉ dùng cho cache dữ liệu cơ bản (không cần queue phức tạp)
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema - simplified
interface PWADatabase extends DBSchema {
  cache: {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
      expiresAt?: number;
    };
    indexes: {
      timestamp: number;
    };
  };
}

const DB_NAME = 'lllc-employee-pwa';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<PWADatabase> | null = null;

/**
 * Mở hoặc lấy database instance
 */
export async function getDB(): Promise<IDBPDatabase<PWADatabase>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<PWADatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Cache store - lưu cache dữ liệu
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

/**
 * Cache operations - đơn giản
 */
export const cache = {
  /**
   * Lưu data vào cache
   */
  async set(key: string, data: any, ttl?: number): Promise<void> {
    const db = await getDB();
    const expiresAt = ttl ? Date.now() + ttl : undefined;
    
    await db.put('cache', {
      key,
      data,
      timestamp: Date.now(),
      expiresAt,
    });
  },

  /**
   * Lấy data từ cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const db = await getDB();
    const cached = await db.get('cache', key);
    
    if (!cached) {
      return null;
    }

    // Kiểm tra expiration
    if (cached.expiresAt && cached.expiresAt < Date.now()) {
      await cache.delete(key);
      return null;
    }

    return cached.data as T;
  },

  /**
   * Xóa cache
   */
  async delete(key: string): Promise<void> {
    const db = await getDB();
    await db.delete('cache', key);
  },

  /**
   * Xóa tất cả cache
   */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('cache');
  },
};

/**
 * Đóng database connection (cleanup)
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
