# 🔧 Fix Image Configuration Issue

## Vấn đề
Lỗi: `hostname "www.emhanoi.com" is not configured under images`

## Giải pháp

### Bước 1: Đảm bảo cấu hình đúng
File `next.config.ts` đã có cấu hình:
```typescript
{
  protocol: "https",
  hostname: "www.emhanoi.com",
  port: "",
  pathname: "/**",
}
```

### Bước 2: Restart Next.js Server
**QUAN TRỌNG**: Next.js chỉ đọc `next.config.ts` khi khởi động, không tự động reload!

1. **Dừng server hiện tại:**
   - Nhấn `Ctrl+C` trong terminal đang chạy `npm run dev`

2. **Xóa cache (tùy chọn nhưng khuyến nghị):**
   ```bash
   rm -rf .next
   # Hoặc trên Windows:
   rmdir /s /q .next
   ```

3. **Khởi động lại server:**
   ```bash
   npm run dev
   ```

### Bước 3: Kiểm tra
Sau khi restart, lỗi sẽ biến mất.

## Lưu ý
- Mọi thay đổi trong `next.config.ts` đều cần restart server
- Nếu vẫn còn lỗi, thử xóa folder `.next` và restart lại
- Đảm bảo không có typo trong hostname

## Các hostname đã được cấu hình:
- ✅ placehold.co
- ✅ www.tomibun.vn
- ✅ www.emhanoi.com
- ✅ localhost:8081 (uploads)
- ✅ **.cloudinary.com
- ✅ **.amazonaws.com

