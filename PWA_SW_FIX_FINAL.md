# Sửa lỗi Service Worker - Final Fix

## 🔍 Vấn đề

Service Worker bị redirect từ `/sw.js` → `/vi/sw.js` do i18n routing, khiến SW không thể install.

## ✅ Giải pháp đã áp dụng

### 1. Tạo middleware.ts để exclude sw.js khỏi i18n redirect

File `middleware.ts` đã được tạo ở root để:
- Exclude `/sw.js` khỏi i18n redirect
- Exclude `/manifest.webmanifest` khỏi i18n redirect
- Cho phép các file static khác bypass i18n

### 2. Cập nhật route handler

File `src/app/sw.js/route.ts` đã được cập nhật với:
- `dynamic = 'force-dynamic'` để tránh cache
- Error handling tốt hơn
- Headers đúng cho Service Worker

## 🚀 Các bước test

### 1. Restart dev server

```bash
# Dừng server hiện tại (Ctrl+C)
# Khởi động lại
npm run dev
```

### 2. Unregister tất cả SW cũ

Trong DevTools > Application > Service Workers:
- Click **"Unregister"** cho tất cả SW
- Hoặc chạy trong Console:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(r => r.unregister());
  console.log('✅ Cleared');
});
```

### 3. Clear cache

- DevTools > Application > **Clear storage** > **Clear site data**

### 4. Test sw.js endpoint

Mở trong browser:
```
http://localhost:3000/sw.js
```

**Phải thấy:**
- ✅ Status: 200 (không phải 307 redirect)
- ✅ Content-Type: `application/javascript`
- ✅ Code JavaScript hiển thị (không phải redirect)

### 5. Reload và kiểm tra

1. **Hard reload**: Ctrl+Shift+R
2. **Console** phải có logs:
   ```
   [SW] Installing service worker... v1.0.0
   [SW] Service worker installed
   [SW] Activating service worker...
   [SW] Service worker activated
   [SW] Service worker registered: /
   ```

3. **DevTools > Application > Service Workers**:
   - ✅ Status: **"activated and is running"**
   - ✅ Source: `sw.js` (hiển thị đầy đủ, không trống)
   - ✅ Scope: `/`

## 🔧 Debug nếu vẫn lỗi

### Kiểm tra middleware hoạt động:

```javascript
// Test trong Console
fetch('/sw.js', { redirect: 'manual' })
  .then(r => {
    console.log('Status:', r.status);
    console.log('Type:', r.type); // Phải là 'basic', không phải 'opaqueredirect'
    console.log('Headers:', {
      'content-type': r.headers.get('content-type'),
      'service-worker-allowed': r.headers.get('service-worker-allowed')
    });
  });
```

### Kiểm tra route handler:

1. Mở Network tab
2. Reload page
3. Tìm request `sw.js`
4. Kiểm tra:
   - Status: 200
   - Type: document hoặc script
   - Response: Code JavaScript
   - **KHÔNG có redirect (307)**

## 📝 Lưu ý

- **Middleware phải ở root** (`middleware.ts` không phải trong `src/`)
- **Route handler** (`src/app/sw.js/route.ts`) sẽ override file từ `public/`
- **Restart server** sau khi tạo middleware

## ✅ Sau khi fix

Service Worker sẽ:
- ✅ Install thành công
- ✅ Active và running
- ✅ Source hiển thị đầy đủ
- ✅ Icon cài đặt xuất hiện trong address bar
