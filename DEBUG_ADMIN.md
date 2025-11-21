# 🔍 Debug Admin Button

## Cách kiểm tra nút Admin có hiển thị không

### 1. Mở Browser Console (F12)
Sau khi đăng nhập, bạn sẽ thấy các log:
- `🔍 Checking admin status with sessionToken: ...`
- `🔍 /api/auth/me response: ...`
- `🔍 User data: ...`
- `🔍 Is Admin? true/false Role: admin/customer`

### 2. Kiểm tra trong Console
```javascript
// Kiểm tra sessionToken
localStorage.getItem('auth_token')

// Kiểm tra user data
fetch('/api/auth/me').then(r => r.json()).then(console.log)
```

### 3. Kiểm tra trong React DevTools
- Mở React DevTools
- Tìm component `Header`
- Kiểm tra state `isAdmin` có phải `true` không

### 4. Kiểm tra Backend Response
```bash
# Test trực tiếp backend
curl -X GET http://localhost:8081/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Các vấn đề thường gặp

#### Vấn đề 1: Token không được set
- Kiểm tra: `sessionToken` có giá trị không?
- Giải pháp: Đăng nhập lại

#### Vấn đề 2: Role không phải "admin"
- Kiểm tra: Response từ `/api/auth/me` có `role: "admin"` không?
- Giải pháp: Kiểm tra database, user có role = "admin" không?

#### Vấn đề 3: API route không trả về đúng
- Kiểm tra: Console log của `/api/auth/me` response
- Giải pháp: Kiểm tra backend có chạy không

### 6. Force hiển thị nút Admin (để test)
Tạm thời thay đổi trong Header.tsx:
```typescript
const [isAdmin, setIsAdmin] = useState(true); // Force true để test
```

### 7. Kiểm tra User trong Database
```javascript
// Trong MongoDB hoặc database của bạn
db.users.findOne({ email: "admin@example.com" })
// Kiểm tra field "role" có phải "admin" không
```

