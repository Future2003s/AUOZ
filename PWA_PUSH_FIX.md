# Sửa lỗi: Push Notification "Waiting for service worker"

## 🔍 Vấn đề

Push notification hook đang chờ service worker nhưng có thể:
- Service worker chưa được register
- Service worker đang trong quá trình install
- Timeout khi đợi service worker ready

## ✅ Giải pháp đã áp dụng

### 1. Cải thiện logic đợi Service Worker

- Thêm timeout (10 giây) để tránh đợi vô hạn
- Retry logic nếu SW chưa ready
- Đợi 1 giây trước khi check để đảm bảo SW đã được register

### 2. Error handling tốt hơn

- Không spam error messages
- Log rõ ràng các bước
- Graceful fallback nếu SW chưa ready

## 🚀 Kiểm tra

### 1. Đảm bảo Service Worker đã active

Trong DevTools > Application > Service Workers:
- ✅ Status: **"activated and is running"**
- ✅ Source: `sw.js` (hiển thị đầy đủ)

### 2. Kiểm tra Console logs

Sau khi reload, phải thấy:
```
[SW] Service worker registered: /
[Push Notification] Service worker ready
[Push Notification] No subscription found
```

**KHÔNG thấy:**
- ❌ "[Push Notification] Waiting for service worker..." (lặp lại nhiều lần)
- ❌ "SW timeout"

### 3. Test Push Notification

1. Đảm bảo đã đăng nhập (isAuthenticated = true)
2. Click subscribe push notification
3. Phải thấy:
   - Permission prompt xuất hiện
   - Subscribe thành công
   - Không có lỗi "Waiting for service worker"

## 🔧 Debug nếu vẫn lỗi

### Kiểm tra Service Worker status:

```javascript
// Chạy trong Console
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) {
    console.log('✅ SW Registered');
    console.log('Active:', reg.active?.state);
    console.log('Ready:', navigator.serviceWorker.controller ? 'Yes' : 'No');
  } else {
    console.log('❌ No SW registration');
  }
});

// Kiểm tra ready
navigator.serviceWorker.ready.then(reg => {
  console.log('✅ SW Ready:', reg.scope);
}).catch(e => {
  console.error('❌ SW Not Ready:', e);
});
```

### Nếu Service Worker chưa ready:

1. **Unregister và register lại:**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(r => r.unregister());
     location.reload();
   });
   ```

2. **Kiểm tra sw.js có load được không:**
   - Mở: `http://localhost:3000/sw.js`
   - Phải thấy code JavaScript (không 404)

3. **Clear cache và reload:**
   - DevTools > Application > Clear storage > Clear site data
   - Hard reload: Ctrl+Shift+R

## 📝 Lưu ý

- Push notification **chỉ hoạt động** khi:
  - ✅ Service Worker đã active
  - ✅ User đã đăng nhập
  - ✅ Browser support Push API
  - ✅ HTTPS hoặc localhost

- Nếu vẫn thấy "Waiting for service worker":
  - Service Worker có thể chưa được register
  - Kiểm tra `PWARegister` component có render không
  - Kiểm tra `NEXT_PUBLIC_PWA_ENABLE` không phải "false"

## ✅ Sau khi fix

Push notification sẽ:
- ✅ Không còn log "Waiting for service worker" liên tục
- ✅ Subscribe/unsubscribe hoạt động bình thường
- ✅ Service worker ready trước khi check subscription
