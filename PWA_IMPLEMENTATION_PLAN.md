# KẾ HOẠCH TRIỂN KHAI PWA CHO EMPLOYEE PORTAL

## BỐI CẢNH
- **Dự án**: Next.js 16.0.7 với App Router
- **Route chính**: `/vi/employee` và các sub-routes
- **Mục tiêu**: PWA installable, offline-first, caching thông minh, UX như app

## CÁC BƯỚC TRIỂN KHAI

### BƯỚC 1: XÁC ĐỊNH CẤU TRÚC & CHỌN GIẢI PHÁP
**Kết luận**: 
- Dự án dùng **App Router** (Next.js 16)
- Đã có PWA components cơ bản nhưng chưa hoàn chỉnh
- Chọn giải pháp: **Native Service Worker API** (không dùng Workbox) để đơn giản và không phụ thuộc

**Lý do**:
- next-pwa có thể gây conflict với Next.js 16 App Router
- Native API đơn giản hơn, không cần thêm dependencies
- Dễ debug và maintain
- Workbox có thể thêm sau nếu cần

### BƯỚC 2: CÀI ĐẶT PACKAGES
```bash
# Package BẮT BUỘC
npm install idb

# Packages TÙY CHỌN (chỉ cài nếu muốn dùng Workbox sau)
npm install workbox-window workbox-precaching workbox-routing workbox-strategies workbox-background-sync workbox-broadcast-update workbox-cacheable-response workbox-expiration
npm install -D @types/workbox-window
```

**Packages cần thiết**:
- `idb`: Wrapper cho IndexedDB (type-safe, Promise-based) - **BẮT BUỘC**
- `workbox-*`: Các module Workbox - **TÙY CHỌN** (không bắt buộc)

### BƯỚC 3: MANIFEST & ICONS
**File**: `public/manifest.webmanifest`
- Hoàn thiện với đầy đủ icons (72/96/128/144/152/192/384/512 + maskable)
- Cấu hình start_url, scope, display mode
- Theme colors

**Icons cần tạo**:
- Tạo script generate icons từ source image
- Hoặc hướng dẫn tạo thủ công

**File**: `src/app/layout.tsx` và `src/app/[locale]/layout.tsx`
- Thêm meta tags cho iOS/Android/Windows
- Apple touch icons, splash screens

### BƯỚC 4: SERVICE WORKER + CACHING
**File**: `public/sw.js` (hoặc `public/sw.ts` nếu build)
**Strategy**:
- **Static assets** (JS/CSS/fonts): CacheFirst + revisioning
- **Images**: StaleWhileRevalidate + size limit
- **API GET**: NetworkFirst với timeout → fallback cache
- **API POST/PUT/PATCH**: Background Sync queue
- **HTML pages**: NetworkFirst với offline fallback

**File**: `src/lib/pwa/service-worker.ts`
- Module để register và quản lý SW
- Update detection và force refresh logic

### BƯỚC 5: INDEXEDDB LAYER
**Cấu trúc**:
```
src/lib/pwa/
  - idb.ts          # IndexedDB wrapper với idb
  - queue.ts        # Request queue cho background sync
  - sync.ts         # Sync logic khi online
  - network.ts      # Network detection
  - cache.ts        # Cache management utilities
```

**Chức năng**:
- Lưu cache dữ liệu employee (inventory, tasks, orders)
- Queue các request POST/PUT/PATCH khi offline
- Sync khi online với conflict resolution (server-wins)

### BƯỚC 6: UI COMPONENTS
**Components mới**:
- `src/components/pwa/InstallButton.tsx` - Nút cài đặt app
- `src/components/pwa/UpdateBanner.tsx` - Banner khi có update SW
- `src/components/pwa/OfflineBadge.tsx` - Badge hiển thị trạng thái offline
- `src/components/pwa/SyncStatus.tsx` - Hiển thị sync status và queue count
- `src/app/[locale]/employee/offline/page.tsx` - Offline fallback page

**Hooks**:
- `src/hooks/useServiceWorker.ts` - Quản lý SW lifecycle
- `src/hooks/useOffline.ts` - Network status
- `src/hooks/useSyncQueue.ts` - Queue status

### BƯỚC 7: PUSH NOTIFICATIONS
**File**: `src/lib/pwa/push.ts`
- VAPID key management
- Subscription management
- Service worker push handler

**File**: `src/hooks/usePushNotification.ts` (đã có, cần cải thiện)
- Request permission
- Subscribe/unsubscribe
- Handle notifications

**Backend contract**:
- Endpoint: `POST /api/notifications/subscribe`
- Body: `{ endpoint, keys: { p256dh, auth } }`

### BƯỚC 8: OFFLINE FALLBACK & ERROR HANDLING
**Pages**:
- `src/app/[locale]/employee/offline/page.tsx` - Offline page
- `src/app/offline/page.tsx` - Global offline fallback

**Error boundaries**:
- Wrap employee routes với error boundary
- Hiển thị friendly error khi offline

### BƯỚC 9: CONFIG & ENV
**File**: `.env.local` (example)
```
NEXT_PUBLIC_PWA_ENABLE=true
NEXT_PUBLIC_PUSH_ENABLE=false
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```

**File**: `next.config.ts`
- Cấu hình headers cho SW
- Output config (đã có)

### BƯỚC 10: TESTING & DOCUMENTATION
**Checklist**:
- [ ] Install trên Chrome Android
- [ ] Install trên Edge Windows
- [ ] Install trên iOS Safari (manual)
- [ ] Offline navigation
- [ ] Cache update
- [ ] Background sync
- [ ] Push notifications (nếu bật)
- [ ] Lighthouse PWA score >= 90

**Scripts**:
- `pnpm build && pnpm start` - Production build
- `pnpm dev` - Development với PWA

## THỨ TỰ THỰC HIỆN
1. ✅ Bước 1: Xác định cấu trúc
2. ⏳ Bước 2: Cài packages
3. ⏳ Bước 3: Manifest & Icons
4. ⏳ Bước 4: Service Worker
5. ⏳ Bước 5: IndexedDB Layer
6. ⏳ Bước 6: UI Components
7. ⏳ Bước 7: Push Notifications
8. ⏳ Bước 8: Offline Fallback
9. ⏳ Bước 9: Config
10. ⏳ Bước 10: Testing

## LƯU Ý
- Không phá vỡ UI/route hiện tại
- Backward-compatible
- Production-ready code
- TypeScript strict
- Error handling đầy đủ
