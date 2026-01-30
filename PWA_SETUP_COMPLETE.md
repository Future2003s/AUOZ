# ✅ PWA Setup Hoàn Tất - Theo Mẫu A2HS

## 📋 Tổng Quan

Đã setup PWA cho Next.js 16 theo mẫu a2hs với:
- ✅ File tĩnh `manifest.webmanifest`
- ✅ Service Worker tối thiểu
- ✅ Banner A2HS toàn diện (Android/Windows + iOS)
- ✅ Chỉ hiện ở `/vi/employee`

---

## ✅ Các File Đã Tạo/Cập Nhật

### 1. **Manifest** 
📁 `public/manifest.webmanifest`
- ✅ Config đầy đủ với icons
- ✅ Theme color: `#0b1220`
- ✅ Start URL: `/vi/employee`

### 2. **Service Worker**
📁 `public/sw.js`
- ✅ Code tối thiểu (3 events: install, activate, fetch)
- ✅ `skipWaiting()` và `clients.claim()` để activate ngay

### 3. **Components**

#### 📁 `src/app/_components/PWARegister.tsx`
- ✅ Register Service Worker
- ✅ Tránh register nhiều lần
- ✅ Mount ở root layout

#### 📁 `src/app/_components/A2HSBanner.tsx`
- ✅ Banner install toàn diện
- ✅ Hỗ trợ Android/Windows (beforeinstallprompt)
- ✅ Hỗ trợ iOS (hướng dẫn manual)
- ✅ Chỉ hiện ở `/vi/employee` và sub-routes
- ✅ Dismiss với localStorage (3, 7, 14 ngày)
- ✅ Auto-hide khi đã install

### 4. **Layout Updates**

#### 📁 `src/app/layout.tsx`
- ✅ Updated: `manifest: "/manifest.webmanifest"`
- ✅ Updated: `themeColor: "#0b1220"`
- ✅ Mount: `<PWARegister />`

#### 📁 `src/app/[locale]/employee/EmployeeLayoutClient.tsx`
- ✅ Mount: `<A2HSBanner />`
- ✅ Thay thế `InstallPrompt` cũ

### 5. **Icons**
📁 `public/icons/`
- ✅ Thư mục đã tạo
- ✅ README.md với hướng dẫn

---

## 🎯 Cần Làm Tiếp

### ⚠️ **QUAN TRỌNG: Tạo Icons**

Bạn cần tạo 3 file icons trong `public/icons/`:

1. **icon-192.png** (192x192)
2. **icon-512.png** (512x512)
3. **icon-512-maskable.png** (512x512, có safe zone)

**Cách nhanh:**
```bash
# Copy logo hiện tại (tạm thời)
Copy-Item public/images/logo.png public/icons/icon-192.png
Copy-Item public/images/logo.png public/icons/icon-512.png
Copy-Item public/images/logo.png public/icons/icon-512-maskable.png

# Sau đó resize đúng size bằng image editor
```

**Hoặc dùng online tool:**
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

---

## 🧪 Test

### 1. **Start Dev Server**
```bash
npm run dev
```

### 2. **Check Manifest**
```
http://localhost:3000/manifest.webmanifest
```

### 3. **Check Service Worker**
- DevTools → Application → Service Workers
- Xem SW đã register và active chưa

### 4. **Test A2HS Banner**
1. Truy cập: `http://localhost:3000/vi/employee`
2. Đợi vài giây → Banner sẽ hiện ở bottom
3. Test:
   - **Android/Windows:** Click "Cài đặt" → Browser prompt
   - **iOS:** Click "Hướng dẫn" → Xem instructions

### 5. **Check Install Prompt**
- DevTools → Application → Manifest
- Verify manifest valid
- Check icons load được

---

## 📱 Cách Hoạt Động

### **Android/Windows (Chrome/Edge)**
1. User vào `/vi/employee`
2. Service Worker register và active
3. Browser fire `beforeinstallprompt` event
4. `A2HSBanner` catch event và show banner
5. User click "Cài đặt"
6. Browser show install prompt
7. User accept → App installed

### **iOS (Safari)**
1. User vào `/vi/employee`
2. Banner hiện với hướng dẫn
3. User click "Hướng dẫn"
4. Alert hiện instructions:
   - Bấm Share (⬆︎)
   - Add to Home Screen
   - Add
5. User làm theo → App installed

---

## 🔍 Debug

### **Banner không hiện:**
1. Check route: Phải ở `/vi/employee` hoặc sub-routes
2. Check standalone: `window.matchMedia('(display-mode: standalone)')`
3. Check dismissed: `localStorage.getItem('a2hs_dismiss_until')`
4. Check console: Xem có errors không

### **Install prompt không hiện (Android/Windows):**
1. Check Service Worker: DevTools → Application → Service Workers
2. Check manifest: DevTools → Application → Manifest
3. Check icons: Icons phải tồn tại và load được
4. Check HTTPS: Phải dùng HTTPS hoặc localhost
5. Check console: Xem có `beforeinstallprompt` event không

### **Service Worker không register:**
1. Check file: `public/sw.js` tồn tại
2. Check headers: `next.config.ts` có config headers cho `/sw.js`
3. Check console: Xem có errors không
4. Check scope: SW scope phải là `/`

---

## 📊 So Sánh Với Setup Cũ

| Aspect | Setup Cũ | Setup Mới (Theo Mẫu) |
|--------|----------|---------------------|
| **Manifest** | `manifest.ts` (dynamic) | `manifest.webmanifest` (static) |
| **Service Worker** | Advanced với caching | Tối thiểu (3 events) |
| **Install Prompt** | `InstallPrompt` component | `A2HSBanner` component |
| **Scope** | Toàn site | Chỉ `/vi/employee` |
| **Icons** | Dùng logo.png | Icons riêng trong `/icons/` |

---

## ✅ Checklist

- [x] File `manifest.webmanifest` đã tạo
- [x] Service Worker tối thiểu đã setup
- [x] Component `PWARegister` đã tạo và mount
- [x] Component `A2HSBanner` đã tạo và mount
- [x] Layout đã update (manifest, themeColor)
- [x] Employee layout đã mount banner
- [x] Thư mục icons đã tạo
- [ ] **Icons cần tạo** (icon-192.png, icon-512.png, icon-512-maskable.png)

---

## 🚀 Next Steps

1. **Tạo icons** trong `public/icons/`
2. **Test** trên localhost
3. **Test** trên mobile (Android/iOS)
4. **Deploy** và test trên production
5. **Monitor** install rates

---

## 📚 Tài Liệu

- [MDN: Add to Home Screen](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Add_to_home_screen)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [A2HS Example](https://github.com/mdn/pwa-examples/tree/main/a2hs)

---

**Setup hoàn tất!** Chỉ cần tạo icons là có thể test A2HS. 🎉
