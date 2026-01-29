# Hướng dẫn cấu hình Push Notifications

## Tổng quan

Hệ thống push notifications đã được tích hợp để gửi thông báo đơn hàng mới đến nhân viên ngay trên thiết bị của họ, ngay cả khi ứng dụng đang đóng.

## Các thành phần đã triển khai

### 1. Service Worker (`public/sw.js`)
- Xử lý push notifications
- Hiển thị notifications khi nhận được
- Xử lý click vào notifications để mở ứng dụng

### 2. Frontend Components
- `src/hooks/usePushNotification.ts` - Hook quản lý push subscriptions
- `src/components/employee/PushNotificationSettings.tsx` - Component cài đặt
- Tích hợp vào Employee Settings page
- Notification badge trong Employee Dashboard

### 3. API Routes
- `/api/notifications/push/vapid-key` - Lấy VAPID public key
- `/api/notifications/push/subscribe` - Đăng ký push subscription
- `/api/notifications/push/unsubscribe` - Hủy đăng ký

## Cấu hình VAPID Keys

### Bước 1: Tạo VAPID Keys

Cài đặt web-push:
```bash
npm install -g web-push
```

Tạo VAPID keys:
```bash
web-push generate-vapid-keys
```

Kết quả sẽ có dạng:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa40HIe8F5jBkUvHCFL6r7fn9xfGsBX6vJKonEtgonilC7J9On3LP3TaFDsKI
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Bước 2: Cấu hình Environment Variables

Thêm vào `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:your-email@example.com
```

### Bước 3: Cấu hình Backend

Backend cần implement các endpoints sau:

#### 1. POST `/api/v1/notifications/push/subscribe`
Lưu push subscription của user:
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

#### 2. POST `/api/v1/notifications/push/unsubscribe`
Xóa push subscription:
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

#### 3. Gửi Push Notification khi có đơn hàng mới

Backend cần sử dụng thư viện `web-push` để gửi notifications:

```javascript
const webpush = require('web-push');

// Cấu hình VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Khi có đơn hàng mới
async function sendOrderNotification(employeeSubscription, order) {
  const payload = JSON.stringify({
    title: "Đơn hàng mới",
    body: `Đơn hàng #${order.orderNumber} - ${order.total.toLocaleString('vi-VN')}đ`,
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    tag: `order-${order._id}`,
    data: {
      url: `/vi/employee/orders/${order._id}`,
      orderId: order._id,
    },
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "Xem đơn hàng"
      },
      {
        action: "dismiss",
        title: "Đóng"
      }
    ]
  });

  try {
    await webpush.sendNotification(employeeSubscription, payload);
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Xóa subscription nếu không hợp lệ
    if (error.statusCode === 410) {
      // Subscription expired or no longer valid
      await removeSubscription(employeeSubscription.endpoint);
    }
  }
}
```

## Cách sử dụng

### Cho Nhân viên:

1. Truy cập `/vi/employee/settings`
2. Tìm phần "Thông báo Push"
3. Bật switch "Thông báo đơn hàng mới"
4. Cho phép trình duyệt hiển thị thông báo khi được hỏi

### Cho Backend Developer:

1. Lưu push subscriptions khi user đăng ký
2. Khi có đơn hàng mới, lấy danh sách subscriptions của nhân viên
3. Gửi push notification đến tất cả subscriptions
4. Xử lý lỗi và cleanup subscriptions không hợp lệ

## Testing

### Test trên localhost:

1. Sử dụng HTTPS hoặc localhost (bắt buộc cho service worker)
2. Mở DevTools > Application > Service Workers
3. Kiểm tra service worker đã đăng ký
4. Test push notification bằng cách gửi từ backend

### Test Push Notification:

Có thể test bằng cách gửi notification từ console:
```javascript
// Trong service worker console
self.registration.showNotification('Test Notification', {
  body: 'This is a test notification',
  icon: '/images/logo.png',
  badge: '/images/logo.png',
  tag: 'test',
  data: { url: '/vi/employee/orders' }
});
```

## Lưu ý quan trọng

1. **HTTPS Required**: Push notifications chỉ hoạt động trên HTTPS hoặc localhost
2. **User Permission**: Cần quyền từ user để hiển thị notifications
3. **Service Worker**: Phải có service worker đã đăng ký
4. **VAPID Keys**: Phải cấu hình đúng VAPID keys ở cả frontend và backend
5. **Subscription Management**: Cần quản lý và cleanup subscriptions không hợp lệ

## Troubleshooting

### Notification không hiển thị:
- Kiểm tra service worker đã đăng ký chưa
- Kiểm tra quyền notifications đã được cấp chưa
- Kiểm tra VAPID keys đã cấu hình đúng chưa
- Kiểm tra console logs để xem lỗi

### Subscription không lưu được:
- Kiểm tra API endpoint có hoạt động không
- Kiểm tra authentication token
- Kiểm tra backend có lưu subscription đúng format không

### Notification không click được:
- Kiểm tra service worker có xử lý `notificationclick` event không
- Kiểm tra URL trong notification data có đúng không
