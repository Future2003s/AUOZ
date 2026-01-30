# Icons cho PWA

## Yêu Cầu Icons

Bạn cần tạo 3 file icons trong thư mục này:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels  
3. **icon-512-maskable.png** - 512x512 pixels (maskable icon)

## Cách Tạo Icons

### Option 1: Sử dụng Logo Hiện Có
Nếu bạn đã có logo tại `/images/logo.png`:

```bash
# Copy và resize logo thành các sizes cần thiết
# Sử dụng tool như ImageMagick, GIMP, hoặc online tools
```

### Option 2: Online Tools
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/imageGenerator)

### Option 3: Từ Logo Hiện Tại
Nếu logo ở `/images/logo.png`:

1. Mở logo trong image editor
2. Resize thành:
   - 192x192 → `icon-192.png`
   - 512x512 → `icon-512.png`
   - 512x512 (với safe zone cho maskable) → `icon-512-maskable.png`

## Maskable Icon

Maskable icon cần có **safe zone** (vùng an toàn):
- Icon chính nên nằm trong 80% center của image
- 10% padding ở mỗi bên
- Để tránh bị crop khi Android apply mask

## Quick Fix: Tạm Thời Dùng Logo

Nếu chưa có icons, bạn có thể tạm thời copy logo:

```bash
# Windows PowerShell
Copy-Item public/images/logo.png public/icons/icon-192.png
Copy-Item public/images/logo.png public/icons/icon-512.png
Copy-Item public/images/logo.png public/icons/icon-512-maskable.png
```

**Lưu ý:** Cần resize đúng size sau đó!

## Kiểm Tra

Sau khi tạo icons, kiểm tra:
1. File tồn tại: `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`
2. Size đúng: 192x192, 512x512, 512x512
3. Format: PNG
4. Test manifest: `http://localhost:3000/manifest.webmanifest`
