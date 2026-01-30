# PWA Implementation - LALA-LYCHEEE Employee Portal

## 📋 Tổng quan

Dự án đã được nâng cấp thành PWA (Progressive Web App) hoàn chỉnh cho trang nhân viên tại `/vi/employee`. PWA này hỗ trợ:

- ✅ **Installable**: Cài đặt như app native trên mobile/desktop
- ✅ **Offline-first**: Hoạt động offline với caching thông minh
- ✅ **Background Sync**: Tự động sync requests khi online
- ✅ **Push Notifications**: Thông báo push (tùy chọn)
- ✅ **Update Mechanism**: Tự động phát hiện và cập nhật

## 🚀 Cài đặt

### 1. Cài đặt Dependencies

**⚠️ Lưu ý**: Code đã được viết để **KHÔNG BẮT BUỘC** phải cài Workbox. Service Worker hoạt động với native API.

**Package BẮT BUỘC** (chỉ cần cài package này):
```bash
npm install idb
```

**Packages TÙY CHỌN** (chỉ cài nếu muốn dùng Workbox sau này):
```bash
# Workbox packages (optional)
npm install workbox-window workbox-precaching workbox-routing workbox-strategies workbox-background-sync workbox-broadcast-update workbox-cacheable-response workbox-expiration

# TypeScript types (nếu dùng Workbox)
npm install -D @types/workbox-window
```

**Xem thêm**: `PWA_INSTALLATION.md` để biết chi tiết.

### 2. Tạo Icons

Xem hướng dẫn chi tiết trong `scripts/generate-icons.md`.

**Tóm tắt**:
1. Chuẩn bị icon source 512x512px
2. Tạo các kích thước: 72, 96, 128, 144, 152, 192, 384, 512
3. Tạo maskable icon (460x460 trong canvas 512x512)
4. Đặt tất cả vào `public/icons/`

### 3. Cấu hình Environment Variables

Tạo file `.env.local` (hoặc copy từ `.env.example`):

```env
# PWA Configuration
NEXT_PUBLIC_PWA_ENABLE=true
NEXT_PUBLIC_PUSH_ENABLE=false

# VAPID Keys (nếu bật push notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

**Lưu ý**: 
- `NEXT_PUBLIC_PWA_ENABLE`: Bật/tắt PWA (mặc định: true)
- `NEXT_PUBLIC_PUSH_ENABLE`: Bật/tắt push notifications (mặc định: false)

### 4. Generate VAPID Keys (nếu cần Push Notifications)

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Copy public key vào `NEXT_PUBLIC_VAPID_PUBLIC_KEY` và private key vào `VAPID_PRIVATE_KEY`.

## 🏗️ Cấu trúc Files

```
D:\FeLLC\
├── public/
│   ├── manifest.webmanifest      # PWA manifest
│   ├── sw.js                      # Service Worker
│   ├── browserconfig.xml          # Windows tile config
│   └── icons/                     # PWA icons
│
├── src/
│   ├── lib/pwa/
│   │   ├── idb.ts                 # IndexedDB wrapper
│   │   ├── network.ts             # Network detection
│   │   ├── service-worker.ts      # SW registration
│   │   ├── sync.ts                # Sync logic
│   │   └── push.ts                # Push notifications
│   │
│   ├── hooks/
│   │   ├── useServiceWorker.ts    # SW lifecycle hook
│   │   ├── useOffline.ts          # Offline detection hook
│   │   └── useSyncQueue.ts        # Sync queue hook
│   │
│   ├── components/pwa/
│   │   ├── InstallButton.tsx      # Install app button
│   │   ├── UpdateBanner.tsx       # Update notification banner
│   │   ├── OfflineBadge.tsx       # Offline status badge
│   │   └── SyncStatus.tsx         # Sync status component
│   │
│   └── app/
│       ├── [locale]/employee/
│       │   ├── offline/page.tsx   # Offline fallback page
│       │   └── EmployeeLayoutClient.tsx  # Layout với PWA components
│       └── offline/page.tsx       # Global offline page
```

## 📱 Cách sử dụng

### Development

```bash
pnpm dev
# hoặc
npm run dev
```

Truy cập: `http://localhost:3000/vi/employee`

### Production Build

```bash
pnpm build
pnpm start
# hoặc
npm run build
npm start
```

### Test PWA

1. **Chrome DevTools**:
   - Mở DevTools > Application > Service Workers
   - Kiểm tra SW đã register và active
   - Xem Cache Storage

2. **Lighthouse**:
   - DevTools > Lighthouse
   - Chọn "Progressive Web App"
   - Chạy audit
   - Mục tiêu: PWA score >= 90

3. **Install Test**:
   - Chrome Android: Banner "Add to Home Screen"
   - Edge Windows: Icon install trong address bar
   - iOS Safari: Share > Add to Home Screen

## 🔧 Caching Strategy

### Static Assets (JS/CSS/Fonts)
- **Strategy**: CacheFirst
- **TTL**: Vô hạn (invalidate bằng versioning)

### Images
- **Strategy**: StaleWhileRevalidate
- **Limit**: 50MB total

### API Requests (GET)
- **Strategy**: NetworkFirst với timeout 3s
- **Fallback**: Cache nếu network fail

### API Requests (POST/PUT/PATCH)
- **Strategy**: Background Sync
- **Queue**: IndexedDB
- **Auto sync**: Khi online

### HTML Pages
- **Strategy**: NetworkFirst
- **Fallback**: Offline page

## 📦 IndexedDB Schema

### Stores

1. **cache**: Cache dữ liệu
   - Key: string (cache key)
   - Value: { key, data, timestamp, expiresAt }

2. **queue**: Request queue cho background sync
   - Key: auto-increment ID
   - Value: { id, url, method, headers, body, timestamp, retries, status }

3. **sync**: Dữ liệu đã sync
   - Key: string (sync key)
   - Value: { key, data, lastSync, version }

## 🔔 Push Notifications

### Setup Backend

Backend cần implement các endpoints:

1. **POST /api/notifications/subscribe**
   ```json
   {
     "endpoint": "https://...",
     "keys": {
       "p256dh": "...",
       "auth": "..."
     }
   }
   ```

2. **POST /api/notifications/unsubscribe**
   ```json
   {
     "endpoint": "https://..."
   }
   ```

3. **GET /api/notifications/push/vapid-key** (optional)
   ```json
   {
     "publicKey": "..."
   }
   ```

### Send Notification

Backend sử dụng `web-push` library:

```javascript
const webpush = require('web-push');
webpush.setVAPIDDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

webpush.sendNotification(subscription, JSON.stringify({
  title: 'Thông báo',
  body: 'Nội dung thông báo',
  url: '/vi/employee',
  tag: 'notification-id'
}));
```

## 🧪 Testing

Xem checklist chi tiết trong `PWA_TESTING_CHECKLIST.md`.

### Quick Test

1. **Offline Test**:
   - DevTools > Network > Offline
   - Navigate pages → Vẫn hoạt động
   - Tạo request POST → Được queue
   - Bật network → Tự động sync

2. **Update Test**:
   - Deploy SW mới
   - Reload page → Update banner xuất hiện
   - Click update → Reload với SW mới

3. **Install Test**:
   - Mở trên Chrome Android
   - Banner install xuất hiện
   - Install → App trên home screen

## 🐛 Troubleshooting

### Service Worker không register
- Kiểm tra HTTPS (production) hoặc localhost
- Kiểm tra console errors
- Xem DevTools > Application > Service Workers

### Icons không hiển thị
- Kiểm tra file tồn tại trong `public/icons/`
- Kiểm tra manifest.webmanifest paths
- Clear cache và reload

### Offline không hoạt động
- Kiểm tra SW đã active
- Kiểm tra Cache Storage có data
- Kiểm tra network detection

### Push notifications không hoạt động
- Kiểm tra VAPID keys đúng
- Kiểm tra permission đã granted
- Kiểm tra subscription đã lưu backend

## 📚 Tài liệu tham khảo

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web Push Protocol](https://web.dev/push-notifications-web-push-protocol/)
- [PWA Checklist](https://web.dev/pwa-checklist/)

## 📝 Notes

- iOS Safari có giới hạn: không có `beforeinstallprompt`, cần manual add
- Firefox không support install prompt, nhưng vẫn chạy PWA
- Service Worker chỉ hoạt động trên HTTPS (hoặc localhost)

## ✅ Checklist Deployment

- [ ] Icons đã tạo đầy đủ
- [ ] Environment variables đã config
- [ ] Service Worker đã test
- [ ] Offline functionality đã test
- [ ] Push notifications đã test (nếu bật)
- [ ] Lighthouse score >= 90
- [ ] Production build thành công
- [ ] HTTPS đã setup (production)

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintainer**: LALA-LYCHEEE Development Team
