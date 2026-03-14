# LALA-LYCHEEE — Roadmap: Bugs & Feature Development

> **Project:** FeLLC (Next.js 16) + BeLLLC (Express.js + MongoDB + Redis)
> **Last updated:** 2026-03-14

---

## 🔴 P0 — Critical Bugs (Production Breaking)

### 1. ENV Variables — Sai cú pháp trên Production
**File:** `.env`, `.env.local`
**Vấn đề:** Dấu cách quanh `=` → biến bị parse sai → backend URL = `undefined` → mọi API proxy gọi về `localhost:8081`
```
# ❌ SAI
NEXT_PUBLIC_BACKEND_URL = https://api.lalalycheee.vn

# ✅ ĐÚNG
NEXT_PUBLIC_BACKEND_URL=https://api.lalalycheee.vn
```
**Action:**
- Sửa tất cả biến env trong `.env` và `.env.local`
- Tạo `.env.production` đúng cú pháp với full production URLs

---

### 2. middleware.ts — Không exclude `/api/**` đúng cách
**File:** `middleware.ts` (line 88-90)
**Vấn đề:** Matcher regex không chặn đúng path `/api/*` → middleware intercept API calls → locale redirect gây loop/404
```diff
# ❌ HIỆN TẠI
'/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|api/|icons/|images/).*)'

# ✅ SỬA THÀNH
'/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|api|icons|images).*)'
```

---

### 3. ecosystem.config.js — PM2 không load `.env.production`
**File:** `ecosystem.config.js`
**Vấn đề:** PM2 start Next.js mà không load biến production → `NEXT_PUBLIC_BACKEND_URL=undefined`
```diff
+ env_file: '.env.production',
  env: {
    NODE_ENV: 'production',
    PORT: 3000,
  }
```

---

### 4. deploy-production.sh — Không copy static files
**File:** `deploy-production.sh`
**Vấn đề:** Standalone build yêu cầu copy thủ công `.next/static/` và `public/` vào `.next/standalone/` — script chỉ warn, không tự copy → PWA broken, assets 404 on production
```bash
# Thêm vào script sau `npm run build`:
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

---

## 🟡 P1 — High Priority Bugs (Functional Issues)

### 5. Product Sync — Admin → Public còn chậm
**Files:** `useAdminProducts.ts`, `productService.ts`, `products.ts` routes
**Status:** ✅ Đã fix (2026-03-14) — cache 300s → 30s, slug cache invalidation added
**Remaining:** Honey product exclusion regex hard-coded (`/mật ong|mat ong|honey/i`) — brittle, break nếu thêm sản phẩm mật ong hợp lệ

---

### 6. 3 Product Service Files Trùng Lặp
**Files:**
- `src/apiRequests/products.ts` — interface `Product` khác
- `src/services/product-service.ts` — (nếu tồn tại)
- `src/services/product.service.ts` — (nếu tồn tại)
**Vấn đề:** Mỗi file define interface khác nhau → TypeScript không catch inconsistencies
**Action:** Hợp nhất thành 1 source of truth duy nhất

---

### 7. Order Status Update — Backend Validation Mismatch
**Context:** Conversation `59fb6afb` — `PATCH /api/orders/:id/status` trả về "Validation failed"
**Vấn đề:** Frontend gửi `{ status: "DELIVERING" }` nhưng backend expect `{ status: "delivering" }` hoặc enum khác
**Action:** Chuẩn hóa status mapping tương tự như đã làm với products

---

### 8. FeaturedProductsSection — Không refetch sau admin update
**File:** `src/components/featured-product-section.tsx` (line 24)
**Vấn đề:** `useEffect([], [])` — chỉ fetch 1 lần khi mount, không update khi featured products thay đổi
**Action:** Không cần auto-refetch (homepage không cần realtime) nhưng nên bust cache khi admin toggle featured → hiện tại backend đã invalidate `featured:*` cache nên reload page là đủ

---

### 9. proxy.ts — Dead Code
**File:** `src/proxy.ts`
**Vấn đề:** File tồn tại (6KB) với matcher config đúng hơn `middleware.ts` nhưng không được import → gây nhầm lẫn
**Action:** Xóa hoặc merge logic vào `middleware.ts`

---

## 🟠 P2 — Medium Priority (UX / Non-blocking)

### 10. Admin Products — Không có automated tests
**Vấn đề:** Không có integration test nào cho CRUD sản phẩm → regression risk cao
**Action:** Thêm test tối thiểu:
```bash
# Backend: tests/integration/products.test.ts
- POST /products → 201 + invalidate cache
- PUT /products/:id → 200 + slug cache cleared
- DELETE /products/:id → 200 + all caches cleared
```

### 11. Admin Products — Thiếu bulk actions
**Vấn đề:** Không thể bulk delete / bulk status change nhiều sản phẩm
**Action:** Thêm checkbox selection + bulk action toolbar

### 12. ProductsMegaMenu — Fetch 2 trang (100 products) chỉ để show 7
**File:** `ProductsMegaMenu.tsx` (line 85-91)
**Vấn đề:** `MAX_PREVIEW_PAGES = 2`, mỗi trang 50 → fetch 100 sản phẩm để chỉ hiển thị 7
**Action:** Reduce page size xuống 7 cho preview endpoint

### 13. Chat — Socket.io reconnect sau lỗi mạng
**Context:** Conversation `9664e3d8` — RichConfirmModal cho recall/group
**Vấn đề:** Khi mất kết nối > 30s, socket không auto-reconnect gracefully
**Action:** Thêm reconnect handler + toast "Đang kết nối lại..."

---

## 🟢 P3 — Features To Develop

### F1. Trang Products — Nâng cấp filtering & sorting
**Current:** Filter by category chỉ
**Target:**
- Filter by price range (slider)
- Filter by brand
- Sort: newest / price asc-desc / best seller
- URL params reflect filter state (shareable URL)

### F2. Checkout — QR Code payment integration
**Context:** `/qr` route tồn tại nhưng chưa đầy đủ
**Target:**
- VietQR integration (MBBank / VietcomBank)
- Auto-poll payment status sau khi show QR
- Redirect về `/payment-callback` khi confirmed

### F3. Admin Dashboard — Analytics
**Current:** Không có dashboard overview
**Target:**
- Revenue chart (daily/monthly) với Recharts
- Top 5 products by order count
- Low stock alerts
- Recent orders widget

### F4. PWA — Push Notifications
**Context:** Serwist đã được cài (`@serwist/next`)
**Target:**
- Notify customer khi đơn hàng thay đổi status (PENDING → DELIVERING → DELIVERED)
- Notify admin khi có đơn hàng mới

### F5. Product — Reviews & Ratings
**Current:** Frontend hiển thị rating tĩnh (hardcoded 5★)
**Target:**
- Backend: `Review` model (productId, userId, rating, comment)
- Frontend: Review form trên product detail page
- Aggregate rating display

### F6. Admin — Image Management
**Context:** Upload ảnh sản phẩm đã có nhưng chưa có gallery manager
**Target:**
- Reorder images (drag & drop via `@dnd-kit`)
- Set main image
- Delete individual images
- Bulk image upload

### F7. i18n — Hoàn thiện bản dịch
**Current:** Một số string chưa có key i18n (hardcoded tiếng Việt)
**Target:** Audit toàn bộ UI, thêm keys còn thiếu vào `src/i18n/`

### F8. SEO — Improve meta tags
**Current:** `sitemap.ts` và `robots.ts` tồn tại nhưng product pages thiếu structured data
**Target:**
- JSON-LD `Product` schema cho `/products/[slug]`
- OpenGraph images cho từng sản phẩm
- `generateMetadata()` dynamic cho product detail

### F9. Orders — Tracking Timeline
**Context:** `/track` route tồn tại
**Target:**
- Visual timeline: đặt hàng → xác nhận → đóng gói → giao hàng → hoàn thành
- Realtime update qua Socket.io

### F10. Employee Module — Nâng cấp
**Context:** `/employee` route — orders page đã được scale up (conversation `51b58f37`)
**Target:**
- Employee performance metrics (orders processed per day)
- Print bill / export PDF đơn hàng

---

## ✅ Đã Fix (Lịch sử)

| Date | Fix | Conversation |
|---|---|---|
| 2026-03-14 | Admin CRUD flicker — optimistic update pattern | `4dcffe31` |
| 2026-03-14 | MegaMenu cache TTL 5 phút | `4dcffe31` |
| 2026-03-14 | Backend slug cache invalidation on update/delete | `4dcffe31` |
| 2026-03-14 | HTTP cache 300s → 30s (featured, /:id routes) | `4dcffe31` |
| 2026-03-13 | Product sync — admin có thể thấy đủ sản phẩm (`allProducts=true`) | `57ad7a49` |
| 2026-03-13 | Order status update validation fix | `59fb6afb` |
| 2026-03-13 | Orders page UI scale up + pagination + limit per page | `51b58f37` |
| 2026-03-13 | Admin products table redesign — search, filter, bulk actions UI | `030e2b0b` |
| 2026-03-13 | Image upload progress indicator + lightbox click-to-view | `c08ae8af` |
| 2026-03-13 | RichConfirmModal cho recall tin nhắn / group actions | `9664e3d8` |
| 2026-03-13 | Mobile keyboard layout fix (iOS safe area) | `3a687ef1` |

---

## Dev Commands

```bash
# Frontend (d:\FeLLC)
npm run dev          # Turbopack dev server :3000
npm run build        # Webpack production build
npm run lint
npm run test         # Vitest

# Backend (d:\BeLLLC)
npm run dev          # Express dev server :8081
npm run test         # Jest/Mocha (auth tests only)

# NotebookLM
nlm notebook list
nlm notebook query --notebook 35ec1c40-e063-4684-8785-409a5fecd819 "câu hỏi"
nlm source add 35ec1c40-e063-4684-8785-409a5fecd819 --file "d:/FeLLC/PROJECT.md"
```
