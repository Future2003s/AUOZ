# Hướng Dẫn Khắc Phục Lỗi Deployment

## 🔴 Vấn Đề Chính

Ứng dụng hoạt động tốt trong môi trường dev nhưng gặp lỗi khi deploy lên server production.

## 📋 Các Vấn Đề Đã Phát Hiện

### 1. **Hardcoded Localhost URLs**
- Nhiều file sử dụng `http://localhost:8081/api/v1` làm fallback
- Các URL này sẽ không hoạt động trên server production
- **Vị trí**: Nhiều file trong `src/app/api/` và các component

### 2. **Hardcoded Analytics Endpoint**
- Endpoint `http://127.0.0.1:7242/ingest/...` được hardcode
- Chỉ hoạt động trên localhost
- **Vị trí**: 
  - `src/app/[locale]/employee/orders/[id]/page.tsx`
  - `src/app/api/delivery/[id]/upload-proof/route.ts`

### 3. **Thiếu Environment Variables**
- Ứng dụng phụ thuộc nhiều vào biến môi trường
- Cần đảm bảo tất cả biến được set trong production

### 4. **Service Worker với Standalone Output**
- Next.js `output: "standalone"` có thể gây vấn đề với service worker
- Cần kiểm tra path của service worker trong production

## ✅ Giải Pháp

### Bước 1: Thiết Lập Environment Variables trên Server

Tạo file `.env.production` hoặc set các biến môi trường trên server:

```bash
# API Configuration
NEXT_PUBLIC_API_ENDPOINT=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_API_END_POINT=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
NEXT_PUBLIC_API_VERSION=v1

# Frontend URL
NEXT_PUBLIC_URL=https://your-frontend-domain.com

# PWA Configuration
NEXT_PUBLIC_PWA_ENABLE=true
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key

# BeLLLC API (nếu sử dụng)
NEXT_PUBLIC_BELLLC_API_ENDPOINT=https://your-belllc-api.com/api/v1
NEXT_PUBLIC_BELLLC_BACKEND_URL=https://your-belllc-api.com
BELLLC_API_KEY=your-api-key

# Analytics (nếu có)
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com/ingest/...

# Other settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Bước 2: Build và Deploy

**Lưu ý quan trọng về Standalone Output:**

Next.js với `output: "standalone"` tạo ra một thư mục `.next/standalone` chứa tất cả dependencies cần thiết. Khi deploy, bạn cần:

1. **Copy các thư mục cần thiết:**
   ```bash
   # Sau khi build, copy các thư mục này vào server
   cp -r .next/standalone ./
   cp -r .next/static .next/standalone/.next/
   cp -r public .next/standalone/
   ```

2. **Hoặc sử dụng script tự động:**
   ```bash
   # 1. Install dependencies
   npm ci
   
   # 2. Build với production environment
   npm run build
   
   # 3. Copy files cho standalone (nếu cần)
   # Next.js tự động copy một số files, nhưng public folder cần được đảm bảo
   
   # 4. Start với PM2
   pm2 start ecosystem.config.js
   
   # Hoặc start trực tiếp từ .next/standalone
   cd .next/standalone
   node server.js
   ```

3. **Với PM2, đảm bảo working directory đúng:**
   ```javascript
   // ecosystem.config.js
   {
     cwd: "/path/to/your/app",
     script: ".next/standalone/server.js", // hoặc node_modules/next/dist/bin/next
   }
   ```

### Bước 3: Kiểm Tra Service Worker

1. Mở DevTools > Application > Service Workers
2. Kiểm tra xem service worker có được register không
3. Kiểm tra console có lỗi gì không

### Bước 4: Kiểm Tra Network Requests

1. Mở DevTools > Network
2. Kiểm tra các API requests có đúng endpoint không
3. Kiểm tra CORS errors nếu có

## 🔧 Các File Đã Được Sửa

1. ✅ Removed hardcoded `127.0.0.1:7242` analytics endpoint - chỉ chạy trong dev hoặc khi có `NEXT_PUBLIC_ANALYTICS_ENDPOINT`
2. ✅ Updated fallback URLs để sử dụng environment variables thay vì hardcoded localhost
3. ✅ Improved error handling cho missing environment variables
4. ✅ Updated `next.config.ts` để chỉ cho phép localhost images trong development

## 📝 Checklist Trước Khi Deploy

- [ ] Tất cả environment variables đã được set trên server
- [ ] Backend API đã được deploy và accessible
- [ ] CORS đã được cấu hình đúng trên backend
- [ ] SSL/HTTPS đã được setup (bắt buộc cho PWA)
- [ ] Service worker đã được test
- [ ] Build thành công không có errors
- [ ] PM2 hoặc process manager đã được cấu hình
- [ ] Logs được monitor để phát hiện lỗi

## 🐛 Debugging Tips

### Kiểm tra Environment Variables trong Production

Thêm vào một route test để kiểm tra:

```typescript
// app/api/debug/env/route.ts
export async function GET() {
  return Response.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    // Không expose sensitive keys
  });
}
```

### Kiểm tra Service Worker

```javascript
// Trong browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

### Kiểm tra API Connectivity

```bash
# Test từ server
curl https://your-backend-domain.com/api/v1/health
```

## 📞 Support

Nếu vẫn gặp vấn đề sau khi áp dụng các fix:
1. Kiểm tra server logs: `pm2 logs`
2. Kiểm tra browser console errors
3. Kiểm tra network tab trong DevTools
4. Verify environment variables: `pm2 env 0`
