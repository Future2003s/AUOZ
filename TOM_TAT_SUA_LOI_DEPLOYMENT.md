# Tóm Tắt Sửa Lỗi Deployment

## 🎯 Vấn Đề
Ứng dụng hoạt động tốt trong môi trường dev nhưng gặp lỗi khi deploy lên server production.

## ✅ Các Lỗi Đã Sửa

### 1. **Hardcoded Analytics Endpoint** 
**Vấn đề:** Code có hardcode endpoint `http://127.0.0.1:7242` chỉ hoạt động trên localhost.

**Đã sửa:**
- ✅ `src/app/api/delivery/[id]/upload-proof/route.ts` - Analytics chỉ chạy trong dev hoặc khi có `NEXT_PUBLIC_ANALYTICS_ENDPOINT`
- ✅ `src/app/[locale]/employee/orders/[id]/page.tsx` - Tương tự

**Cách hoạt động:**
- Trong development: Vẫn log như bình thường
- Trong production: Chỉ log nếu có biến môi trường `NEXT_PUBLIC_ANALYTICS_ENDPOINT`
- Nếu không có endpoint, sẽ bỏ qua (không gây lỗi)

### 2. **Hardcoded Localhost trong Image Config**
**Vấn đề:** `next.config.ts` cho phép images từ `http://localhost:8081` trong cả production.

**Đã sửa:**
- ✅ Chỉ cho phép localhost images trong development mode
- Production chỉ chấp nhận HTTPS images

### 3. **Thiếu Hướng Dẫn Deployment**
**Đã tạo:**
- ✅ `DEPLOYMENT_FIX.md` - Hướng dẫn chi tiết về deployment
- ✅ `deploy-production.sh` - Script tự động hóa quá trình build và deploy

## 📋 Cần Làm Trên Server

### 1. Thiết Lập Environment Variables

Tạo file `.env.production` hoặc set các biến môi trường trên server:

```bash
# Bắt buộc
NEXT_PUBLIC_API_ENDPOINT=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_API_END_POINT=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
NEXT_PUBLIC_URL=https://your-frontend-domain.com

# Tùy chọn (nếu cần)
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics.com/ingest/...
NEXT_PUBLIC_PWA_ENABLE=true
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-key
```

### 2. Build và Deploy

```bash
# Cách 1: Sử dụng script tự động
chmod +x deploy-production.sh
./deploy-production.sh

# Cách 2: Thủ công
npm ci
npm run build
pm2 start ecosystem.config.js
```

### 3. Kiểm Tra

1. Mở browser DevTools > Console - Kiểm tra lỗi
2. DevTools > Network - Kiểm tra API requests có đúng endpoint không
3. DevTools > Application > Service Workers - Kiểm tra service worker

## 🔍 Các Vấn Đề Thường Gặp

### Lỗi: API requests fail với localhost
**Nguyên nhân:** Thiếu environment variables
**Giải pháp:** Đảm bảo đã set `NEXT_PUBLIC_API_ENDPOINT` trên server

### Lỗi: Service worker không hoạt động
**Nguyên nhân:** 
- Chưa có HTTPS (PWA yêu cầu HTTPS)
- Service worker path không đúng
**Giải pháp:** 
- Setup SSL/HTTPS
- Kiểm tra file `public/sw.js` có tồn tại sau khi build

### Lỗi: Images không load
**Nguyên nhân:** Backend URL không đúng hoặc CORS
**Giải pháp:** 
- Kiểm tra `NEXT_PUBLIC_BACKEND_URL`
- Cấu hình CORS trên backend

## 📞 Debug

Nếu vẫn gặp vấn đề:

1. **Kiểm tra logs:**
   ```bash
   pm2 logs nextjs-app
   ```

2. **Kiểm tra environment variables:**
   ```bash
   pm2 env 0
   ```

3. **Test API connectivity từ server:**
   ```bash
   curl https://your-backend-domain.com/api/v1/health
   ```

4. **Kiểm tra browser console** để xem lỗi cụ thể

## 📚 Tài Liệu Tham Khảo

- `DEPLOYMENT_FIX.md` - Hướng dẫn chi tiết
- `deploy-production.sh` - Script deployment
- `ecosystem.config.js` - PM2 configuration

## ✨ Kết Quả

Sau khi áp dụng các fix:
- ✅ Không còn hardcoded localhost URLs
- ✅ Analytics endpoint chỉ chạy khi cần thiết
- ✅ Production config an toàn hơn
- ✅ Có hướng dẫn deployment đầy đủ
