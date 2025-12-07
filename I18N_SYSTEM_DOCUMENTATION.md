# Hệ Thống Đa Ngôn Ngữ (i18n) - Documentation

## Tổng Quan

Dự án hỗ trợ đa ngôn ngữ với 3 ngôn ngữ chính:
- **Tiếng Việt (vi)** - Ngôn ngữ mặc định
- **English (en)**
- **日本語 (ja)**

## Kiến Trúc

### FrontEnd

#### 1. Cấu Trúc Thư Mục
```
src/i18n/
├── config.ts              # Cấu hình locales và helper functions
├── I18nProvider.tsx       # React Context Provider cho i18n
├── useTranslations.ts      # Hook để sử dụng translations
├── request.ts             # Server-side functions để load translations
└── locales/
    ├── vi.json            # Translations tiếng Việt
    ├── en.json            # Translations tiếng Anh
    └── ja.json            # Translations tiếng Nhật
```

#### 2. Cách Sử Dụng

**Trong Client Components:**
```tsx
import useTranslations from "@/i18n/useTranslations";

export default function MyComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t("nav.home")}</h1>
      <p>{t("common.loading")}</p>
    </div>
  );
}
```

**Trong Server Components:**
```tsx
import { getTranslations } from "@/i18n/request";

export default async function MyServerComponent({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const t = await getTranslations(locale);
  
  return <h1>{t.nav?.home || "Home"}</h1>;
}
```

#### 3. Cấu Trúc JSON Translations

File translations được tổ chức theo categories:
```json
{
  "nav": { ... },           // Navigation items
  "auth": { ... },          // Authentication
  "common": { ... },        // Common UI elements
  "admin": { ... },         // Admin panel
  "cms": { ... },           // CMS management
  "products": { ... },      // Products
  "orders": { ... },        // Orders
  "footer": { ... },        // Footer
  "story": { ... }         // Story page
}
```

### BackEnd

#### 1. Translation Model
- **Location**: `BackEnd/src/models/Translation.ts`
- **Database**: MongoDB collection `translations`
- **Structure**:
  ```typescript
  {
    key: string;              // Unique key (e.g., "nav.home")
    category: string;         // Category (ui, product, error, etc.)
    translations: {
      vi: string;
      en: string;
      ja: string;
    };
    description?: string;
    isActive: boolean;
  }
  ```

#### 2. Translation Service
- **Location**: `BackEnd/src/services/translationService.ts`
- **Features**:
  - Caching với Redis
  - Batch loading
  - Category-based queries
  - Search functionality

#### 3. API Endpoints

**Public Endpoints:**
- `GET /api/v1/translations/key/:key?lang=vi` - Get single translation
- `POST /api/v1/translations/bulk` - Get multiple translations
- `GET /api/v1/translations/category/:category?lang=vi` - Get by category
- `GET /api/v1/translations/all?lang=vi` - Get all translations

**Admin Endpoints:**
- `GET /api/v1/admin/translations` - Paginated list
- `POST /api/v1/admin/translations` - Create translation
- `PUT /api/v1/admin/translations/:key` - Update translation
- `DELETE /api/v1/admin/translations/:key` - Delete translation
- `GET /api/v1/admin/translations/search` - Search translations
- `GET /api/v1/admin/translations/stats` - Statistics
- `POST /api/v1/admin/translations/bulk-import` - Bulk import
- `GET /api/v1/admin/translations/export` - Export translations

## Tích Hợp FrontEnd - BackEnd

### 1. Sync Translations từ BackEnd

**API Route**: `/api/translations/sync`
- `GET /api/translations/sync?lang=vi` - Get translations for language
- `POST /api/translations/sync` - Sync all translations (Admin only)

### 2. Cấu Hình

Để sử dụng translations từ BackEnd, set environment variable:
```env
NEXT_PUBLIC_USE_BACKEND_TRANSLATIONS=true
```

### 3. Merge Strategy

Translations được merge theo thứ tự ưu tiên:
1. **BackEnd translations** (nếu enabled) - Highest priority
2. **Static JSON files** - Fallback

## Quản Lý Translations

### Trang Admin Translations

**Location**: `/vi/admin/translations`

**Features**:
- ✅ Xem danh sách translations (paginated)
- ✅ Tạo mới translation
- ✅ Chỉnh sửa translation
- ✅ Xóa translation
- ✅ Tìm kiếm translations
- ✅ Lọc theo category
- ✅ Import/Export translations
- ✅ Thống kê translations

### Workflow Quản Lý

1. **Tạo Translation mới**:
   - Vào `/vi/admin/translations`
   - Click "Thêm mới"
   - Điền key, category, và translations cho 3 ngôn ngữ
   - Lưu

2. **Chỉnh sửa Translation**:
   - Tìm translation cần sửa
   - Click "Chỉnh sửa"
   - Cập nhật nội dung
   - Lưu

3. **Sync với FrontEnd**:
   - Translations từ BackEnd tự động được merge vào FrontEnd
   - Hoặc có thể export và import vào JSON files

## Best Practices

### 1. Naming Convention

**Keys nên có cấu trúc rõ ràng:**
```
{category}.{section}.{item}

Ví dụ:
- nav.home
- auth.login_title
- admin.dashboard.title
- cms.footer.company.name
```

### 2. Categories

Sử dụng các categories chuẩn:
- `ui` - UI elements (buttons, labels, etc.)
- `nav` - Navigation
- `auth` - Authentication
- `admin` - Admin panel
- `cms` - CMS management
- `product` - Products
- `order` - Orders
- `error` - Error messages
- `success` - Success messages
- `validation` - Validation messages

### 3. Fallback Strategy

Luôn có fallback:
```tsx
const text = t("some.key") || "Default text";
```

### 4. Dynamic Content

Cho nội dung động, sử dụng placeholders:
```json
{
  "welcome": "Xin chào {name}!"
}
```

```tsx
const message = t("welcome").replace("{name}", userName);
```

## Migration Guide

### Chuyển từ Hardcoded Text sang Translations

**Before:**
```tsx
<h1>Quản Lý Trang Story</h1>
<Button>Lưu nháp</Button>
```

**After:**
```tsx
import useTranslations from "@/i18n/useTranslations";

const t = useTranslations();

<h1>{t("admin.story.title")}</h1>
<Button>{t("common.save_draft")}</Button>
```

## Troubleshooting

### 1. Translation không hiển thị

- Kiểm tra key có đúng không
- Kiểm tra file JSON có key đó không
- Kiểm tra console có lỗi không

### 2. BackEnd translations không load

- Kiểm tra `NEXT_PUBLIC_USE_BACKEND_TRANSLATIONS` env var
- Kiểm tra API endpoint có hoạt động không
- Kiểm tra authentication

### 3. Locale không đổi

- Kiểm tra URL có locale prefix không (`/vi/...`, `/en/...`)
- Kiểm tra localStorage có lưu preference không
- Clear cache và reload

## Roadmap

### Đã Hoàn Thành ✅
- [x] Basic i18n setup với 3 ngôn ngữ
- [x] I18nProvider và useTranslations hook
- [x] Language switcher component
- [x] BackEnd translation service
- [x] Admin translations management page
- [x] API sync translations

### Đang Phát Triển 🚧
- [ ] Mở rộng translations cho tất cả admin pages
- [ ] Auto-detect browser language
- [ ] Translation memory/cache optimization
- [ ] Bulk translation import/export

### Kế Hoạch 📋
- [ ] Translation versioning
- [ ] Translation review workflow
- [ ] Machine translation integration
- [ ] Translation analytics
- [ ] Multi-language SEO optimization

