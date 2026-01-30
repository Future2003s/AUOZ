# PWA Installation Guide

## ⚠️ Lưu ý quan trọng

Code đã được viết để **KHÔNG BẮT BUỘC** phải cài `workbox-window`. Service Worker sẽ hoạt động với **native API**.

## 📦 Packages tùy chọn

Các packages sau là **TÙY CHỌN** (không bắt buộc để PWA hoạt động):

```bash
# Chỉ cần cài nếu muốn dùng Workbox (optional)
npm install workbox-window workbox-precaching workbox-routing workbox-strategies workbox-background-sync workbox-broadcast-update workbox-cacheable-response workbox-expiration

# TypeScript types (nếu dùng Workbox)
npm install -D @types/workbox-window
```

## ✅ Package bắt buộc

Chỉ cần cài **một package** này:

```bash
npm install idb
```

Package `idb` được dùng cho IndexedDB operations trong:
- `src/lib/pwa/idb.ts`
- `src/lib/pwa/sync.ts`

## 🚀 Quick Start (Minimal Setup)

1. **Cài idb**:
   ```bash
   npm install idb
   ```

2. **Tạo icons** (xem `scripts/generate-icons.md`)

3. **Chạy dev**:
   ```bash
   npm run dev
   ```

4. **Test**: Mở `http://localhost:3000/vi/employee`

## 📝 Tại sao không cần Workbox?

- Service Worker (`public/sw.js`) đã được viết bằng **native JavaScript**
- Không cần Workbox để caching, routing, strategies
- Code đơn giản hơn, dễ maintain hơn
- Vẫn đầy đủ tính năng: caching, offline, background sync

## 🔄 Nếu muốn dùng Workbox sau

Nếu sau này muốn migrate sang Workbox:

1. Cài packages:
   ```bash
   npm install workbox-window workbox-precaching workbox-routing workbox-strategies
   ```

2. Update `src/lib/pwa/service-worker.ts` để sử dụng Workbox

3. Update `public/sw.js` để sử dụng Workbox runtime caching

## ✅ Checklist

- [x] Code không bắt buộc workbox-window
- [x] Service Worker hoạt động với native API
- [ ] Cài `idb` package
- [ ] Tạo icons
- [ ] Test PWA
