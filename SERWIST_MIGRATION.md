# Migration sang Serwist - Hoàn tất

## ✅ Đã thực hiện

### 1. Cài đặt packages
- ✅ Thêm `@serwist/next`, `@serwist/precaching`, `@serwist/sw` vào `package.json`
- ✅ `idb` đã có sẵn

### 2. Cập nhật next.config.ts
- ✅ Wrap với `withSerwistInit`
- ✅ Config: `swSrc: "src/app/sw.ts"`, `swDest: "public/sw.js"`
- ✅ `disable: false` - Bật PWA trong development để test
- ✅ `cacheOnNavigation: true` - Cache khi navigate
- ✅ `reloadOnOnline: true` - Reload khi online

### 3. Cập nhật package.json scripts
- ✅ `"build": "next build --webpack"` - Dùng webpack cho build (Serwist yêu cầu)
- ✅ `"dev": "next dev --turbopack"` - Dev vẫn dùng turbopack

### 4. Tạo Service Worker với Serwist
- ✅ Tạo `src/app/sw.ts` với Serwist config
- ✅ Runtime caching:
  - Static assets (JS/CSS/fonts): CacheFirst
  - Images: StaleWhileRevalidate
  - API requests: NetworkFirst (luôn yêu cầu mạng, không cache lâu)
  - HTML pages: NetworkFirst (không cache HTML)

### 5. Cleanup files cũ
- ✅ Xóa `public/sw.js` (Serwist sẽ generate)
- ✅ Xóa `src/app/sw.js/route.ts` (không cần route handler)
- ✅ Cập nhật `src/app/_components/PWARegister.tsx` (Serwist tự động register)
- ✅ Cập nhật `src/lib/pwa/service-worker.ts` (chỉ check status, không register)

### 6. Giữ lại IndexedDB & Sync
- ✅ Giữ `src/lib/pwa/idb.ts` và `src/lib/pwa/sync.ts`
- ✅ Có thể dùng cho offline data storage nếu cần

## 🚀 Các bước tiếp theo

### 1. Cài đặt packages
```bash
npm install @serwist/next @serwist/precaching @serwist/sw
# hoặc
pnpm add @serwist/next @serwist/precaching @serwist/sw
```

### 2. Build project
```bash
npm run build
```

**Lưu ý**: Build sẽ dùng Webpack (không phải Turbopack) vì Serwist yêu cầu.

### 3. Kiểm tra Service Worker
Sau khi build, kiểm tra:
- `public/sw.js` đã được generate
- DevTools > Application > Service Workers
- SW phải active và running

### 4. Test PWA
- Mở `http://localhost:3000/vi/employee`
- Icon cài đặt sẽ xuất hiện trong address bar
- Test offline: DevTools > Network > Offline
- Static assets vẫn load từ cache

## 📝 Files đã thay đổi

1. ✅ `package.json` - Thêm Serwist packages, đổi build script
2. ✅ `next.config.ts` - Wrap với withSerwist
3. ✅ `src/app/sw.ts` - Tạo mới (Serwist service worker)
4. ✅ `src/app/_components/PWARegister.tsx` - Cập nhật (Serwist tự động register)
5. ✅ `src/lib/pwa/service-worker.ts` - Cập nhật (chỉ check status)
6. ✅ `public/sw.js` - Đã xóa (Serwist sẽ generate)
7. ✅ `src/app/sw.js/route.ts` - Đã xóa (không cần)

## 🔍 Kiểm tra sau khi build

### 1. Kiểm tra sw.js được generate
```bash
# Sau khi build, kiểm tra file tồn tại
ls public/sw.js
```

### 2. Kiểm tra trong browser
- Mở: `http://localhost:3000/sw.js`
- Phải thấy code JavaScript (không 404)
- Phải có `__SW_MANIFEST` trong code

### 3. Kiểm tra Service Worker
```javascript
// Console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW Registered:', reg?.scope);
  console.log('Active:', reg?.active?.state);
});
```

## ⚠️ Lưu ý quan trọng

1. **Build phải dùng Webpack**: 
   - `npm run build` sẽ dùng `--webpack`
   - Dev vẫn dùng `--turbopack` (nhanh hơn)

2. **Serwist tự động register**:
   - Không cần register thủ công
   - SW được inject vào HTML tự động

3. **Precaching**:
   - Serwist tự động precache các files từ `__SW_MANIFEST`
   - Manifest được generate trong build process

4. **Development mode**:
   - PWA được bật trong dev (`disable: false`)
   - Có thể tắt bằng cách set `disable: process.env.NODE_ENV === "development"`

## 🐛 Troubleshooting

### Build error về Serwist
- Đảm bảo đã cài packages: `npm install`
- Kiểm tra `next.config.ts` import đúng

### SW không được generate
- Kiểm tra `swSrc: "src/app/sw.ts"` path đúng
- Kiểm tra file `src/app/sw.ts` tồn tại và syntax đúng

### SW không register
- Clear cache và reload
- Kiểm tra Console có lỗi không
- Kiểm tra `public/sw.js` đã được generate sau build

## ✅ Checklist

- [x] Thêm Serwist packages vào package.json
- [x] Cập nhật next.config.ts với withSerwist
- [x] Đổi build script sang --webpack
- [x] Tạo src/app/sw.ts
- [x] Cập nhật PWARegister component
- [x] Cleanup files cũ
- [ ] **Cần chạy**: `npm install`
- [ ] **Cần chạy**: `npm run build` (để generate sw.js)
- [ ] Test Service Worker active
- [ ] Test install prompt
- [ ] Test offline với static assets
