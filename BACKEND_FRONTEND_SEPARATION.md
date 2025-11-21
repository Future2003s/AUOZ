# Tách Biệt Backend và Frontend

## Kiến trúc

Dự án được tách thành 2 phần hoàn toàn độc lập:

### Backend (`BackEndLLLC`)
- **Vị trí**: `D:\WorkSpace\KEYPAIR\code_backup\BackEndLLLC`
- **Công nghệ**: Node.js + Express + TypeScript
- **Port mặc định**: `8081`
- **API Base URL**: `http://localhost:8081/api/v1`

### Frontend (`FrontEndLLLC`)
- **Vị trí**: `D:\WorkSpace\KEYPAIR\code_backup1\FrontEndLLLC`
- **Công nghệ**: Next.js + React + TypeScript
- **Port mặc định**: `3000` hoặc `3001`
- **Giao tiếp**: Chỉ gọi API qua HTTP/HTTPS

## Nguyên tắc Tách Biệt

### ✅ Được phép
- Frontend gọi API backend qua HTTP requests (`fetch`, `axios`, etc.)
- Frontend sử dụng environment variables để cấu hình backend URL
- Frontend có Next.js API routes để proxy requests (nếu cần)

### ❌ Không được phép
- Frontend import trực tiếp code từ BackEndLLLC
- Frontend sử dụng backend models/types trực tiếp
- Frontend có database connections
- Frontend có business logic của backend

## Cấu hình

### Frontend Environment Variables

Tạo file `.env.local` trong thư mục `FrontEndLLLC`:

```env
# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8081

# API Version
NEXT_PUBLIC_API_VERSION=v1

# Full API Endpoint (tự động tính từ BACKEND_URL + API_VERSION)
NEXT_PUBLIC_API_END_POINT=http://localhost:8081/api/v1

# Frontend URL
NEXT_PUBLIC_URL=http://localhost:3000

# Logo URL
NEXT_PUBLIC_URL_LOGO=https://placehold.co/200x80
```

### Backend Environment Variables

Tạo file `.env` trong thư mục `BackEndLLLC`:

```env
# Server
PORT=8081
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/shopdev

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

## Cách Frontend Gọi API

### 1. Sử dụng API Config

```typescript
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";
import { envConfig } from "@/config";

// Build URL
const url = buildApiUrl(API_CONFIG.AUTH.LOGIN);

// Make request
const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

### 2. Sử dụng Next.js API Routes (Proxy)

Frontend có thể tạo API routes trong `src/app/api/` để proxy requests:

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config";
import { proxyJson } from "@/lib/next-api-auth";

export async function POST(request: NextRequest) {
  const baseUrl = envConfig.NEXT_PUBLIC_API_END_POINT;
  const url = `${baseUrl}/auth/login`;
  
  return proxyJson(url, request, {
    method: "POST",
    requireAuth: false,
  });
}
```

Sau đó frontend gọi:
```typescript
const response = await fetch("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
```

### 3. Sử dụng API Service

```typescript
import { apiService } from "@/services/api.service";

// GET request
const products = await apiService.get("/products");

// POST request
const order = await apiService.post("/orders", orderData);

// PUT request
const updated = await apiService.put(`/products/${id}`, updateData);

// DELETE request
await apiService.delete(`/products/${id}`);
```

## Cấu trúc Thư mục

### Frontend (`FrontEndLLLC`)
```
FrontEndLLLC/
├── src/
│   ├── app/
│   │   ├── api/              # Next.js API routes (proxy)
│   │   └── [locale]/         # Pages
│   ├── components/           # React components
│   ├── lib/
│   │   ├── api-config.ts    # API configuration
│   │   └── next-api-auth.ts # Auth helpers
│   ├── services/
│   │   └── api.service.ts   # API service
│   └── config.ts            # Environment config
├── .env.local               # Environment variables
└── package.json
```

### Backend (`BackEndLLLC`)
```
BackEndLLLC/
├── src/
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   └── config/              # Configuration
├── .env                     # Environment variables
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Đăng ký
- `POST /api/v1/auth/login` - Đăng nhập
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/v1/auth/change-password` - Đổi mật khẩu

### Products
- `GET /api/v1/products` - Lấy danh sách sản phẩm
- `GET /api/v1/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/v1/products` - Tạo sản phẩm (Admin)
- `PUT /api/v1/products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/v1/products/:id` - Xóa sản phẩm (Admin)

### Orders
- `GET /api/v1/orders` - Lấy đơn hàng của user
- `GET /api/v1/orders/admin/all` - Lấy tất cả đơn hàng (Admin)
- `POST /api/v1/orders` - Tạo đơn hàng
- `PUT /api/v1/orders/:id/status` - Cập nhật trạng thái (Admin)

### Users (Admin)
- `GET /api/v1/admin/users` - Lấy danh sách users (Admin)
- `POST /api/v1/admin/users` - Tạo user (Admin)
- `PUT /api/v1/admin/users/:id` - Cập nhật user (Admin)
- `PUT /api/v1/admin/users/:id/role` - Cập nhật role (Admin)
- `PUT /api/v1/admin/users/:id/status` - Cập nhật status (Admin)
- `DELETE /api/v1/admin/users/:id` - Xóa user (Admin)

## CORS Configuration

Backend phải cấu hình CORS để cho phép frontend gọi API:

```typescript
// BackEndLLLC/src/config/config.ts
export const config: Config = {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    credentials: true,
  },
};
```

## Authentication Flow

1. User đăng nhập qua frontend
2. Frontend gọi `POST /api/v1/auth/login`
3. Backend trả về `accessToken` và `refreshToken`
4. Frontend lưu token vào cookies hoặc localStorage
5. Frontend gửi token trong header `Authorization: Bearer <token>` cho các request tiếp theo
6. Backend verify token và xử lý request

## Development Workflow

### 1. Start Backend
```bash
cd BackEndLLLC
npm install
npm run dev
# Backend chạy tại http://localhost:8081
```

### 2. Start Frontend
```bash
cd FrontEndLLLC
npm install
npm run dev
# Frontend chạy tại http://localhost:3000
```

### 3. Test API Connection
```bash
# Test từ frontend
curl http://localhost:3000/api/products/public/68a7d99558a2cd9382ce6bc6

# Test trực tiếp backend
curl http://localhost:8081/api/v1/products
```

## Production Deployment

### Backend
- Deploy lên server (VPS, Cloud, etc.)
- Set environment variables
- Expose port 8081 (hoặc port khác)
- Cấu hình domain: `api.yourdomain.com`

### Frontend
- Build: `npm run build`
- Deploy lên Vercel, Netlify, hoặc server
- Set environment variables:
  ```
  NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
  NEXT_PUBLIC_API_VERSION=v1
  ```

## Troubleshooting

### Frontend không kết nối được backend
1. Kiểm tra backend đang chạy: `curl http://localhost:8081/health`
2. Kiểm tra CORS configuration
3. Kiểm tra `.env.local` có đúng URL không
4. Kiểm tra network tab trong browser console

### CORS Error
- Đảm bảo backend có cấu hình CORS đúng
- Kiểm tra `CORS_ORIGIN` trong backend `.env`
- Đảm bảo frontend URL nằm trong danh sách allowed origins

### Authentication Error
- Kiểm tra token có được gửi trong header không
- Kiểm tra token có hết hạn không
- Kiểm tra backend có verify token đúng không

## Best Practices

1. **Luôn sử dụng environment variables** cho URLs
2. **Không hardcode** backend URLs trong code
3. **Sử dụng TypeScript** để type-safe API calls
4. **Xử lý errors** đúng cách trong frontend
5. **Validate data** ở cả frontend và backend
6. **Sử dụng HTTPS** trong production
7. **Implement rate limiting** ở backend
8. **Log requests** để debug

## Tài liệu Tham khảo

- [API Documentation](./API_DOCUMENTATION.md)
- [Backend Integration Guide](./BACKEND_API_INTEGRATION.md)
- [Frontend Integration Guide](./FRONTEND_API_INTEGRATION_README.md)

