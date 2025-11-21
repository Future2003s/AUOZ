# 🔗 Hướng Dẫn Kết Nối API BackEnd với FrontEnd

## ✅ Đã Hoàn Thành

### 1. Cấu Hình Environment Variables

File `.env.local` đã được tạo với cấu hình sau:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8081
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_API_ENDPOINT=http://localhost:8081/api/v1
```

### 2. Cấu Hình CORS trong BackEnd

BackEnd đã được cấu hình để cho phép requests từ:
- `http://localhost:3000` (Next.js default port)
- `http://localhost:3001` (Next.js alternative port)

CORS được cấu hình trong `src/middleware/optimizedStack.ts` với:
- Credentials: `true` (cho phép gửi cookies)
- Max Age: 24 hours (cache preflight requests)
- Allowed Headers: Authorization, Content-Type, Accept, etc.

## 🚀 Cách Sử Dụng

### 1. Khởi Động BackEnd

```bash
cd D:\WorkSpace\KEYPAIR\code_backup\BackEndLLLC
npm run dev
```

BackEnd sẽ chạy trên: `http://localhost:8081`

### 2. Khởi Động FrontEnd

```bash
cd D:\WorkSpace\KEYPAIR\code_backup1\FrontEndLLLC
npm run dev
```

FrontEnd sẽ chạy trên: `http://localhost:3000` (hoặc port khác nếu 3000 đã được sử dụng)

### 3. Kiểm Tra Kết Nối

#### Health Check

```bash
# Kiểm tra BackEnd
curl http://localhost:8081/health

# Kiểm tra từ FrontEnd (trong browser console)
fetch('http://localhost:8081/api/v1/test')
  .then(res => res.json())
  .then(data => console.log(data))
```

## 📁 Cấu Trúc API

### Base URL
```
http://localhost:8081/api/v1
```

### Các Endpoints Chính

#### Authentication
- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `GET /auth/me` - Lấy thông tin user hiện tại
- `POST /auth/logout` - Đăng xuất

#### Products
- `GET /products` - Lấy danh sách sản phẩm
- `GET /products/:id` - Lấy chi tiết sản phẩm
- `GET /products/search` - Tìm kiếm sản phẩm

#### Cart
- `GET /cart` - Lấy giỏ hàng
- `POST /cart/items` - Thêm sản phẩm vào giỏ
- `DELETE /cart/items/:productId` - Xóa sản phẩm khỏi giỏ

#### Orders
- `POST /orders` - Tạo đơn hàng
- `GET /orders` - Lấy danh sách đơn hàng
- `GET /orders/:id` - Lấy chi tiết đơn hàng

Xem thêm trong `API_DOCUMENTATION.md` của BackEnd.

## 💻 Sử Dụng API trong FrontEnd

### Ví dụ: Gọi API Products

```typescript
import { apiService } from '@/services/api.service';
import { API_CONFIG } from '@/lib/api-config';

// Lấy danh sách sản phẩm
const products = await apiService.get(API_CONFIG.PRODUCTS.ALL);

// Lấy chi tiết sản phẩm
const product = await apiService.get(API_CONFIG.PRODUCTS.BY_ID, { id: 'product-id' });
```

### Ví dụ: Đăng nhập

```typescript
import { apiService } from '@/services/api.service';
import { API_CONFIG } from '@/lib/api-config';

const response = await apiService.post(API_CONFIG.AUTH.LOGIN, {
  email: 'user@example.com',
  password: 'password123'
});

// Lưu token
localStorage.setItem('token', response.data.token);
```

### Ví dụ: Gọi API với Authentication

```typescript
import { apiService } from '@/services/api.service';
import { API_CONFIG } from '@/lib/api-config';

const token = localStorage.getItem('token');

const userProfile = await apiService.get(
  API_CONFIG.USERS.PROFILE,
  undefined,
  undefined,
  { token }
);
```

## 🔧 Troubleshooting

### Lỗi CORS

Nếu gặp lỗi CORS, kiểm tra:
1. BackEnd đang chạy trên port 8081
2. FrontEnd URL được thêm vào CORS origins trong BackEnd
3. CORS middleware được enable trong `optimizedStack.ts`

### Lỗi Connection Refused

1. Kiểm tra BackEnd đang chạy: `curl http://localhost:8081/health`
2. Kiểm tra port không bị conflict
3. Kiểm tra firewall settings

### Lỗi 404 Not Found

1. Kiểm tra endpoint path đúng: `/api/v1/...`
2. Kiểm tra route đã được đăng ký trong BackEnd
3. Xem logs của BackEnd để debug

## 📝 Ghi Chú

- Tất cả API requests đều được log trong console với prefix `🌐 API Request:`
- Timeout mặc định: 8-10 giây
- Retry mechanism: Tự động retry cho 5xx errors
- Error handling: Sử dụng `HttpError` class để xử lý lỗi

## 🔐 Security

- JWT tokens được lưu trong localStorage (có thể chuyển sang httpOnly cookies)
- CORS chỉ cho phép origins được cấu hình
- Rate limiting được áp dụng để chống abuse
- Helmet security headers được enable

## 📚 Tài Liệu Tham Khảo

- BackEnd API Documentation: `BackEndLLLC/API_DOCUMENTATION.md`
- FrontEnd API Config: `FrontEndLLLC/src/lib/api-config.ts`
- HTTP Client: `FrontEndLLLC/src/lib/http.ts`
- API Service: `FrontEndLLLC/src/services/api.service.ts`

