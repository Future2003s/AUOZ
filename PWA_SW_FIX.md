# Sửa lỗi: Service Worker "trying to install"

## 🔍 Vấn đề

Service Worker đang stuck ở trạng thái "trying to install" và Source field trống trong DevTools.

## ✅ Giải pháp

### Bước 1: Unregister tất cả Service Workers cũ

Trong DevTools > Application > Service Workers:

1. **Unregister** tất cả các service workers hiện có:
   - Click nút **"Unregister"** cho mỗi SW entry (#775, #776)
   - Đảm bảo không còn SW nào active

2. **Hoặc dùng Console:**
   ```javascript
   // Unregister tất cả SW
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
     console.log('✅ Đã unregister tất cả SW');
   });
   ```

### Bước 2: Clear Cache Storage

1. DevTools > Application > **Cache Storage**
2. Xóa tất cả caches (click phải > Delete)
3. Hoặc: **Clear storage** > **Clear site data**

### Bước 3: Reload và kiểm tra

1. **Reload page** (Ctrl+R)
2. Mở **Console** (F12 > Console)
3. Kiểm tra có log:
   ```
   [SW] Installing service worker... v1.0.0
   [SW] Service worker installed
   [SW] Activating service worker...
   [SW] Service worker activated
   [SW] Service worker registered: /
   ```

### Bước 4: Kiểm tra Service Worker file

1. Mở: `http://localhost:3000/sw.js`
2. Phải thấy code JavaScript (không phải 404)
3. Kiểm tra Content-Type header:
   - DevTools > Network > sw.js
   - Response Headers > `Content-Type: application/javascript`

### Bước 5: Nếu vẫn không hoạt động

**Kiểm tra Console errors:**
- Có lỗi syntax trong sw.js không?
- Có lỗi CORS không?
- Có lỗi "Failed to register a ServiceWorker" không?

**Thử hard reload:**
- Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)
- Hoặc: DevTools > Network > Disable cache > Reload

## 🔧 Debug trong Console

```javascript
// Kiểm tra SW registration
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) {
    console.log('✅ SW Registered:', reg.scope);
    console.log('Active:', reg.active?.state);
    console.log('Installing:', reg.installing?.state);
    console.log('Waiting:', reg.waiting?.state);
  } else {
    console.log('❌ No SW registered');
  }
});

// Kiểm tra SW file có load được không
fetch('/sw.js')
  .then(r => {
    console.log('SW File Status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    return r.text();
  })
  .then(text => console.log('SW Content Length:', text.length))
  .catch(e => console.error('❌ SW File Error:', e));
```

## 📝 Lưu ý

- **Source field trống** thường do:
  - SW file không được serve đúng
  - SW file có lỗi syntax
  - CORS issues

- **"trying to install"** stuck thường do:
  - Install event handler có lỗi
  - Cache operation fail
  - SW code có syntax error

## ✅ Sau khi fix

Service Worker sẽ:
- Status: **"activated and is running"**
- Source: `sw.js` (hiển thị đầy đủ)
- Clients: Hiển thị active clients

Sau đó icon cài đặt sẽ xuất hiện!
