# PWA Testing Checklist

## ✅ Pre-deployment Checks

### 1. Manifest & Icons
- [ ] `manifest.webmanifest` có đầy đủ thông tin
- [ ] Tất cả icons đã được tạo (72, 96, 128, 144, 152, 192, 384, 512, maskable)
- [ ] Icons hiển thị đúng trong DevTools > Application > Manifest
- [ ] Start URL trỏ đúng `/vi/employee`
- [ ] Theme color và background color đúng

### 2. Service Worker
- [ ] Service worker đã được register
- [ ] Service worker active trong DevTools > Application > Service Workers
- [ ] Cache đang hoạt động (xem trong Cache Storage)
- [ ] Service worker update được detect

### 3. Build & Production
- [ ] `pnpm build` chạy thành công
- [ ] `pnpm start` chạy production server
- [ ] Không có lỗi console
- [ ] Không có lỗi TypeScript

## ✅ Installation Tests

### Chrome Android
1. [ ] Mở `https://your-domain.com/vi/employee` trên Chrome Android
2. [ ] Banner "Add to Home Screen" xuất hiện
3. [ ] Nhấn "Add to Home Screen" → App được cài đặt
4. [ ] Mở app từ home screen → Chạy standalone mode
5. [ ] App icon hiển thị đúng

### Edge Windows
1. [ ] Mở `https://your-domain.com/vi/employee` trên Edge
2. [ ] Icon install xuất hiện trong address bar
3. [ ] Nhấn install → App được cài đặt
4. [ ] Mở app từ Start menu → Chạy standalone mode

### iOS Safari
1. [ ] Mở `https://your-domain.com/vi/employee` trên Safari iOS
2. [ ] Nhấn Share button (⬆︎)
3. [ ] Chọn "Add to Home Screen"
4. [ ] App được thêm vào home screen
5. [ ] Mở app từ home screen → Chạy standalone mode

## ✅ Offline Functionality

### Navigation
- [ ] Tắt mạng (Airplane mode hoặc DevTools > Network > Offline)
- [ ] Navigate giữa các pages → Vẫn hoạt động
- [ ] Refresh page → Hiển thị offline page hoặc cached content
- [ ] Bật mạng lại → Tự động sync

### Data Caching
- [ ] Load `/vi/employee` khi online → Data được cache
- [ ] Tắt mạng → Vẫn xem được cached data
- [ ] Bật mạng → Data được update

### Background Sync
- [ ] Tạo request POST/PUT khi offline → Request được queue
- [ ] Bật mạng → Request tự động sync
- [ ] Kiểm tra sync status badge → Hiển thị đúng

## ✅ Update Mechanism

### Service Worker Update
1. [ ] Deploy version mới của SW
2. [ ] Reload page → Update banner xuất hiện
3. [ ] Nhấn "Cập nhật" → Page reload với SW mới
4. [ ] Không có loop reload

### Cache Update
- [ ] Deploy assets mới
- [ ] Reload page → Assets mới được load
- [ ] Old cache được cleanup

## ✅ Push Notifications (nếu bật)

### Permission
- [ ] Request notification permission → User cho phép
- [ ] Permission được lưu
- [ ] Unsubscribe → Permission vẫn giữ (có thể subscribe lại)

### Subscription
- [ ] Subscribe → Subscription được lưu vào backend
- [ ] Unsubscribe → Subscription được xóa
- [ ] Reload page → Subscription vẫn active

### Notifications
- [ ] Send test notification từ backend
- [ ] Notification xuất hiện khi app đang mở
- [ ] Notification xuất hiện khi app đóng
- [ ] Click notification → Mở đúng URL

## ✅ Performance

### Lighthouse
Chạy Lighthouse trong Chrome DevTools:
- [ ] PWA score >= 90
- [ ] Best Practices >= 90
- [ ] Performance >= 90
- [ ] SEO >= 90

### Metrics
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Cache hit rate > 80%

## ✅ Error Handling

### Network Errors
- [ ] Offline → Hiển thị offline badge
- [ ] API error → Hiển thị error message
- [ ] Retry button hoạt động

### Service Worker Errors
- [ ] SW registration fail → Không crash app
- [ ] SW update fail → Fallback graceful
- [ ] Cache error → Log và continue

## ✅ Security

### HTTPS
- [ ] App chỉ chạy trên HTTPS (production)
- [ ] Service worker chỉ register trên HTTPS

### Data
- [ ] Không cache sensitive data (tokens, passwords)
- [ ] API credentials không lộ trong cache
- [ ] CORS headers đúng

## ✅ Browser Compatibility

### Desktop
- [ ] Chrome ✅
- [ ] Edge ✅
- [ ] Firefox (limited PWA support)
- [ ] Safari (limited PWA support)

### Mobile
- [ ] Chrome Android ✅
- [ ] Safari iOS ✅
- [ ] Samsung Internet ✅

## 📝 Notes
- iOS Safari có giới hạn: không có beforeinstallprompt, cần manual add
- Firefox không support install prompt, nhưng vẫn chạy PWA
- Safari macOS có support nhưng hạn chế

## 🐛 Known Issues
(Ghi lại các issues đã biết)

## ✅ Final Checklist
- [ ] Tất cả tests trên pass
- [ ] Documentation đầy đủ
- [ ] Code review done
- [ ] Production deployment successful
- [ ] Monitoring setup
