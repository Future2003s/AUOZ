# LALA-LYCHEEE — FeLLC Frontend

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack dev) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** + Radix UI |
| State | **Zustand** + **TanStack React Query v5** |
| Forms | **React Hook Form** + **Zod** |
| Animation | **Framer Motion** |
| Realtime | **Socket.io client** |
| PWA | **Serwist** (service worker) |
| i18n | Custom (`src/i18n/`) — `[locale]` route prefix |
| Charts | **Recharts** |
| Toast | **Sonner** |

---

## Project Structure

```
d:\FeLLC\
├── src\
│   ├── app\
│   │   ├── [locale]\               # All i18n pages (vi/en)
│   │   │   ├── (admin)\            # Admin dashboard (route group)
│   │   │   │   ├── admin-products\ # Product management
│   │   │   │   ├── admin-orders\   # Order management
│   │   │   │   └── ...
│   │   │   ├── (auth)\             # Login/register (route group)
│   │   │   ├── products\           # Public product listing
│   │   │   ├── cart\               # Shopping cart
│   │   │   ├── checkout\           # Checkout flow
│   │   │   ├── employee\           # Employee dashboard
│   │   │   ├── me\                 # User profile
│   │   │   ├── payment\            # Payment + callback
│   │   │   └── news, contact, ...  # Public pages
│   │   ├── api\                    # Next.js API Routes (proxy to backend)
│   │   │   ├── products\           # /api/products/*
│   │   │   ├── orders\             # /api/orders/*
│   │   │   ├── auth\               # /api/auth/*
│   │   │   └── ...
│   │   └── globals.css
│   ├── components\                 # Shared UI components
│   │   ├── ProductsMegaMenu.tsx
│   │   ├── featured-product-section.tsx
│   │   └── ...
│   ├── apiRequests\                # API fetch functions (typed)
│   ├── hooks\                      # Custom React hooks
│   ├── store\                      # Zustand stores
│   ├── features\                   # Feature slices
│   ├── i18n\                       # Translations + useTranslations hook
│   ├── lib\                        # Utilities, helpers
│   └── types\                      # Global TypeScript types
├── .env.local                      # Local env vars
├── next.config.ts
└── package.json
```

---

## Key Commands

```bash
# Development
npm run dev         # Next.js dev server with Turbopack (port 3000)

# Production
npm run build       # Webpack build (not Turbopack)
npm run start       # Start production server

# Code quality
npm run lint        # ESLint
npm run test        # Vitest
```

---

## Environment Variables

File: `.env.local`

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket server URL |
| JWT secret + other API keys | Auth & external services |

---

## Backend

Separate project at **`d:\BeLLLC`** — Express.js + MongoDB + Redis.

API proxy pattern: Frontend calls `/api/*` (Next.js API routes) → these proxy to `NEXT_PUBLIC_BACKEND_URL`.

---

## Architecture Notes

- **Auth**: JWT cookies, refreshed via `/api/auth/refresh`
- **Admin panel**: Under `[locale]/(admin)/` route group, protected by middleware
- **Product data flow**: Admin CRUD → Backend MongoDB + Redis cache invalidation → Public pages fetch via `/api/products/public` (10s cache) → Homepage featured (30s) → MegaMenu (5min TTL module cache)
- **Realtime**: Socket.io for chat & order notifications
- **i18n**: Route prefix `/vi/...` and `/en/...`, `useTranslations()` hook

---

## Architecture Redesign — Admin CRUD & Data Sync (2026-03-14)

### Root Causes Fixed

| # | Issue | File |
|---|---|---|
| 1 | `handleUpdate`: `applyProductUpdate` + `syncProductFromBackend` → 2 renders → flicker | `useAdminProducts.ts` |
| 2 | `handleCreate`: `syncProductFromBackend` + `refreshProducts` → 2 fetches | `useAdminProducts.ts` |
| 3 | `handleDelete`: double-fetch (fetchProductsRef + refreshProducts) | `useAdminProducts.ts` |
| 4 | `handleToggleFeatured`: optimistic update → `syncProductFromBackend` → flicker | `useAdminProducts.ts` |
| 5 | `_globalProductsCache` Map never expires → MegaMenu never shows new products | `ProductsMegaMenu.tsx` |
| 6 | `fetch` uses `next: { revalidate: 180 }` in client component (silently ignored) | `ProductsMegaMenu.tsx` |
| 7 | `updateProduct` doesn't invalidate slug cache `product:slug:*` | `productService.ts` |
| 8 | `deleteProduct` doesn't invalidate slug cache | `productService.ts` |
| 9 | `staticDataCache(300)` on `/featured` → 5 min stale | `routes/products.ts` |
| 10 | `staticDataCache(300)` on `/:id` → 5 min stale | `routes/products.ts` |

### Fixes Applied

#### A — `useAdminProducts.ts` — Flicker-free CRUD

New pattern for all 4 mutation handlers:
```
mutation → optimistic state update (instant)
         → if success → single background refetch via fetchProductsRef.current()
         → if fail    → revert optimistic update + show error
```

| Handler | Before | After |
|---|---|---|
| `handleCreate` | `syncProductFromBackend` + `refreshProducts` | Single `fetchProductsRef.current()` |
| `handleUpdate` | `applyProductUpdate` → `syncProductFromBackend` | Optimistic update + single background refetch |
| `handleDelete` | `fetchProductsRef` else `refreshProducts` | Always `fetchProductsRef.current()` |
| `handleToggleFeatured` | `applyProductUpdate` → `syncProductFromBackend` | Optimistic + single background refetch; revert on error |

#### B — `productService.ts` — Slug Cache Invalidation

Both `updateProduct` and `deleteProduct` now:
- `del("product:slug:{slug}")` — exact slug key
- `invalidatePattern("product:slug:*")` — safety-net
- `deleteProduct` also clears `featured:*` and pagination cache

#### C — `routes/products.ts` — HTTP Cache Times

| Route | Before | After |
|---|---|---|
| `GET /featured` | 300s | 30s |
| `GET /:id` | 300s | 30s |

#### D — `ProductsMegaMenu.tsx` — TTL Cache

- Cache entries: `{ data: PreviewData; ts: number }` with `MEGAMENU_CACHE_TTL = 5 minutes`
- Expired entries are deleted and re-fetched on next hover
- Fixed `next: { revalidate: 180 }` → `cache: "no-store"` (client component limitation)

### Already Fixed Previously

- Default `status: "draft"` → `"active"` in ProductModal ✅
- Double client-side filtering removed ✅
- Backend `getProductsByCategory/Brand` ignoring status/isVisible ✅
- Public route cache 60s → 10s ✅
- Duplicate POST `/api/products/create` route removed ✅

### Verification Steps

1. **No flicker on update**: Edit product name in admin → instant update, no white flash
2. **No double-fetch on delete**: DevTools → Network → delete product → only 1 call to `/api/products/admin?...`
3. **Create → public sync**: Create product (active) → refresh `/vi/products` → appears within 30s
4. **Slug cache cleared**: Update product name → refresh `/vi/products/[slug]` → new name immediately
5. **MegaMenu TTL**: Hover menu → create product → wait 5 min → hover again → new product visible
