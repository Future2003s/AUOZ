# Hướng dẫn Test PWA Install Prompt

## ✅ Icons đã được tạo

Tất cả icons đã được tạo trong `public/icons/`:
- icon-72.png, icon-96.png, icon-128.png, icon-144.png, icon-152.png
- icon-192.png, icon-384.png, icon-512.png
- icon-512-maskable.png

## 🚀 Các bước test

### 1. Reload trang
```
http://localhost:3000/vi/employee
```
- Nhấn **Ctrl+R** (hoặc **F5**) để reload
- Đợi vài giây để Service Worker active

### 2. Kiểm tra Service Worker
1. Mở **DevTools** (F12)
2. Vào tab **Application** > **Service Workers**
3. Kiểm tra:
   - ✅ Status: **activated and is running**
   - ✅ Scope: `/`
   - ✅ Source: `sw.js`

Nếu chưa active:
- Click **Update** hoặc **Unregister** rồi reload lại

### 3. Kiểm tra Manifest
1. Trong DevTools: **Application** > **Manifest**
2. Kiểm tra:
   - ✅ Name: "LALA-LYCHEEE Employee Portal"
   - ✅ Icons: Tất cả icons đã load (không có 404)
   - ✅ Start URL: `/vi/employee`

### 4. Tìm biểu tượng cài đặt

**Chrome/Edge:**
- Icon cài đặt xuất hiện ở **bên phải address bar** (icon máy tính với mũi tên xuống)
- Hoặc banner "Install app" ở dưới cùng màn hình

**Vị trí:**
```
[URL bar]                    [🔍] [📥 Install] [⭐]
```

### 5. Nếu vẫn không thấy

**Thử các cách sau:**

1. **Clear cache và reload:**
   - DevTools > Application > Clear storage > Clear site data
   - Reload page

2. **Incognito mode:**
   - Mở tab ẩn danh
   - Truy cập `http://localhost:3000/vi/employee`

3. **Kiểm tra Console:**
   - DevTools > Console
   - Xem có lỗi nào không (đặc biệt là 404 cho icons)

4. **Đợi 30 giây:**
   - Chrome cần thời gian để detect PWA
   - Đợi vài giây sau khi reload

5. **Kiểm tra Network tab:**
   - DevTools > Network
   - Reload page
   - Kiểm tra `manifest.webmanifest` và các icons load thành công (status 200)

### 6. Test Install

Khi thấy icon cài đặt:
1. Click icon cài đặt (hoặc banner)
2. Popup "Install app" xuất hiện
3. Click **Install**
4. App sẽ được cài đặt và mở ở standalone mode

## 🔍 Debug nếu vẫn không hoạt động

### Kiểm tra trong Console:
```javascript
// Kiểm tra Service Worker
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW Registration:', reg);
  console.log('SW Active:', reg?.active);
});

// Kiểm tra Manifest
fetch('/manifest.webmanifest')
  .then(r => r.json())
  .then(m => console.log('Manifest:', m));

// Kiểm tra Icons
fetch('/icons/icon-192.png')
  .then(r => console.log('Icon 192:', r.ok ? 'OK' : 'FAIL'));
```

### Common Issues:

1. **Icons 404:**
   - Kiểm tra file tồn tại: `public/icons/icon-192.png`
   - Kiểm tra path trong manifest đúng: `/icons/icon-192.png`

2. **Service Worker không active:**
   - Kiểm tra `public/sw.js` tồn tại
   - Kiểm tra Console có lỗi không
   - Thử unregister và register lại

3. **Manifest invalid:**
   - Mở `http://localhost:3000/manifest.webmanifest`
   - Kiểm tra JSON hợp lệ
   - Kiểm tra không có lỗi syntax

## ✅ Checklist

- [x] Icons đã được tạo
- [ ] Service Worker active
- [ ] Manifest valid
- [ ] Không có lỗi Console
- [ ] Icon cài đặt xuất hiện
- [ ] Test install thành công

## 📱 Sau khi install

App sẽ:
- Có icon trên desktop/home screen
- Mở ở standalone mode (không có browser UI)
- Có thể mở từ Start menu (Windows) hoặc home screen (mobile)
