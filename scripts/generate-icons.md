# Hướng dẫn tạo Icons cho PWA

## Yêu cầu
- Source image: 512x512px (PNG, có nền trong suốt hoặc nền đơn sắc)
- Tên file: `icon-source.png` (đặt trong `public/icons/`)

## Cách 1: Sử dụng online tool
1. Truy cập: https://www.pwabuilder.com/imageGenerator
2. Upload icon 512x512px
3. Download và extract vào `public/icons/`

## Cách 2: Sử dụng ImageMagick (CLI)
```bash
# Cài ImageMagick
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Tạo các kích thước
cd public/icons
magick icon-source.png -resize 72x72 icon-72.png
magick icon-source.png -resize 96x96 icon-96.png
magick icon-source.png -resize 128x128 icon-128.png
magick icon-source.png -resize 144x144 icon-144.png
magick icon-source.png -resize 152x152 icon-152.png
magick icon-source.png -resize 192x192 icon-192.png
magick icon-source.png -resize 384x384 icon-384.png
magick icon-source.png -resize 512x512 icon-512.png

# Tạo maskable icon (với padding 10%)
magick icon-source.png -resize 460x460 -gravity center -extent 512x512 -background transparent icon-512-maskable.png
```

## Cách 3: Sử dụng Node.js script
Tạo file `scripts/generate-icons.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const source = path.join(__dirname, '../public/icons/icon-source.png');
const outputDir = path.join(__dirname, '../public/icons');

sizes.forEach(size => {
  sharp(source)
    .resize(size, size)
    .toFile(path.join(outputDir, `icon-${size}.png`))
    .then(() => console.log(`Generated icon-${size}.png`));
});

// Maskable icon
sharp(source)
  .resize(460, 460)
  .extend({
    top: 26,
    bottom: 26,
    left: 26,
    right: 26,
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .toFile(path.join(outputDir, 'icon-512-maskable.png'))
  .then(() => console.log('Generated icon-512-maskable.png'));
```

Chạy: `node scripts/generate-icons.js`

## Lưu ý
- Maskable icon cần có padding 10% (icon 460x460 trong canvas 512x512)
- Tất cả icons phải là PNG
- Đảm bảo icon rõ ràng ở kích thước nhỏ (72x72)
