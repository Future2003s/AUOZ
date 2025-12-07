# Hướng Dẫn Migration Hệ Thống Đa Ngôn Ngữ V2

## Tổng Quan

Hệ thống đa ngôn ngữ đã được thiết kế lại để hỗ trợ cấu trúc mới với **locale trong key name**, tương tự như Shopee.

### Cấu Trúc Mới

**Trước (V1):**
```json
{
  "nav": {
    "home": "Trang Chủ"
  }
}
```
Sử dụng: `t("nav.home")`

**Sau (V2):**
```json
{
  "Label_selling_point_1_vn": "Miễn phí trả hàng",
  "Label_selling_point_1_en": "Free Return",
  "Msg_selling_point_1_vn_short": "Trả hàng miễn phí trong 15 ngày"
}
```
Sử dụng: `t("Label_selling_point_1")` hoặc `t("Label_selling_point_1_vn")`

## Kiến Trúc Mới

### BackEnd

#### 1. Model: `TranslationV2`
- **Location**: `BackEnd/src/models/TranslationV2.ts`
- **Structure**:
  ```typescript
  {
    key: "Label_selling_point_1_vn",      // Full key with locale
    baseKey: "Label_selling_point_1",      // Base key without locale
    locale: "vn",                          // Extracted locale
    variant: undefined,                    // Optional: "short", "long"
    category: "selling_point",
    value: "Miễn phí trả hàng",           // Single string value
    isActive: true
  }
  ```

#### 2. Service: `translationServiceV2`
- **Location**: `BackEnd/src/services/translationServiceV2.ts`
- **Features**:
  - Parse locale từ key name
  - Fallback mechanism
  - Caching
  - Bulk operations

#### 3. Utils: `translationKeyParser`
- **Location**: `BackEnd/src/utils/translationKeyParser.ts`
- **Functions**:
  - `parseTranslationKey()` - Parse key để extract baseKey, locale, variant
  - `buildTranslationKey()` - Build key từ baseKey, locale, variant
  - `resolveTranslationKey()` - Resolve với fallback

#### 4. Routes: `/api/v1/translations-v2`
- `GET /translations-v2/key/:key` - Get single translation
- `POST /translations-v2/bulk` - Get multiple translations
- `GET /translations-v2/all?locale=vn` - Get all for locale
- `GET /translations-v2/base/:baseKey` - Get all locales for baseKey
- `GET /translations-v2/admin` - Paginated list (Admin)
- `POST /translations-v2/admin` - Create/Update (Admin)
- `POST /translations-v2/admin/bulk-import` - Bulk import (Admin)

### FrontEnd

#### 1. Config: `configV2.ts`
- **Location**: `src/i18n/configV2.ts`
- **Features**:
  - SupportedLocales enum
  - Key parsing functions
  - Locale mapping

#### 2. Hook: `useTranslationsV2`
- **Location**: `src/i18n/useTranslationsV2.ts`
- **Usage**:
  ```tsx
  import useTranslationsV2 from "@/i18n/useTranslationsV2";
  
  const t = useTranslationsV2();
  
  // Auto-detect locale from context
  t("Label_selling_point_1")
  
  // Specify locale
  t("Label_selling_point_1", "vn")
  
  // With variant
  t("Label_selling_point_1", "vn", "short")
  ```

#### 3. API Route: `/api/translations-v2/all`
- **Location**: `src/app/api/translations-v2/all/route.ts`
- Proxy để fetch translations từ BackEnd

## Migration Steps

### Step 1: Import Data vào BackEnd

Tạo script để import JSON data:

```typescript
// scripts/import-translations-v2.ts
import { translationServiceV2 } from "../src/services/translationServiceV2";
import { TranslationCategories } from "../src/models/TranslationV2";

const translations = {
    "Label_selling_point_1_vn": "Trả hàng Miễn phí 15 ngày",
    "Label_selling_point_1_en": "15 Days Return",
    // ... more translations
};

async function importTranslations() {
    const userId = new mongoose.Types.ObjectId(); // Admin user ID
    
    for (const [key, value] of Object.entries(translations)) {
        await translationServiceV2.upsertTranslation(
            key,
            value,
            TranslationCategories.SELLING_POINT,
            userId
        );
    }
}
```

### Step 2: Cập Nhật FrontEnd Components

**Before:**
```tsx
import useTranslations from "@/i18n/useTranslations";
const t = useTranslations();
<h1>{t("nav.home")}</h1>
```

**After:**
```tsx
import useTranslationsV2 from "@/i18n/useTranslationsV2";
const t = useTranslationsV2();
<h1>{t("Label_nav_home")}</h1>
```

### Step 3: Update API Calls

**Before:**
```typescript
fetch("/api/translations/all?lang=vi")
```

**After:**
```typescript
fetch("/api/translations-v2/all?locale=vn")
```

## Key Naming Convention

### Format
```
{BaseKey}_{Variant?}_{Locale}
```

### Examples
- `Label_selling_point_1_vn` - Label, Vietnamese
- `Msg_selling_point_1_vn_short` - Message, Vietnamese, short variant
- `Label_selling_point_1_en` - Label, English
- `Msg_selling_point_1_en_short` - Message, English, short variant

### Categories
- `Label_*` - Labels, buttons, titles
- `Msg_*` - Messages, descriptions
- `Error_*` - Error messages
- `Success_*` - Success messages
- `Validation_*` - Validation messages

## Supported Locales

- `vn` - Vietnamese (Vietnam)
- `en` - English
- `ja` - Japanese
- `ar` - Arabic
- `br` - Brazil (Portuguese)
- `cl` - Chile (Spanish)
- `co` - Colombia (Spanish)
- `id` - Indonesia
- `mx` - Mexico (Spanish)
- `my` - Malaysia
- `ph` - Philippines
- `pl` - Poland
- `sg` - Singapore
- `th` - Thailand

## Fallback Strategy

Khi không tìm thấy translation, hệ thống sẽ:
1. Tìm exact match: `Label_selling_point_1_vn`
2. Fallback locale: `Label_selling_point_1_en`
3. Fallback to base key: `Label_selling_point_1`

## Best Practices

### 1. Key Naming
- Sử dụng PascalCase cho base key: `Label_SellingPoint_1`
- Luôn include locale suffix: `_vn`, `_en`
- Sử dụng variant cho short/long: `_short`, `_long`

### 2. Organization
- Group related keys: `Label_selling_point_1`, `Label_selling_point_2`
- Use categories: `selling_point`, `ui`, `error`

### 3. Variants
- `_short` - Short version (for tooltips, badges)
- `_long` - Long version (for descriptions, help text)

## Migration Checklist

- [ ] Import translations vào BackEnd
- [ ] Update FrontEnd components to use `useTranslationsV2`
- [ ] Update API calls
- [ ] Test với tất cả locales
- [ ] Update documentation
- [ ] Deprecate old translation system (optional)

## Backward Compatibility

Hệ thống V1 vẫn hoạt động song song với V2. Có thể:
- Giữ cả 2 systems
- Migrate dần dần
- Hoặc chuyển hoàn toàn sang V2

## Examples

### Example 1: Selling Points
```tsx
import useTranslationsV2 from "@/i18n/useTranslationsV2";

const t = useTranslationsV2();

<div>
  <h3>{t("Label_selling_point_1")}</h3>
  <p>{t("Msg_selling_point_1", undefined, "short")}</p>
</div>
```

### Example 2: Multiple Locales
```tsx
const t = useTranslationsV2();

// Vietnamese
t("Label_selling_point_1", "vn") // "Trả hàng Miễn phí 15 ngày"

// English
t("Label_selling_point_1", "en") // "15 Days Return"

// Thai
t("Label_selling_point_1", "th") // "100% Authentic"
```

## Troubleshooting

### Key không tìm thấy
- Kiểm tra key có đúng format không
- Kiểm tra locale có trong database không
- Kiểm tra isActive = true

### Fallback không hoạt động
- Kiểm tra fallback locales trong config
- Kiểm tra cache

### Performance
- Sử dụng bulk API cho nhiều keys
- Enable caching
- Use CDN cho static translations

