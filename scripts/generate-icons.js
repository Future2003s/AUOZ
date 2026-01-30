/**
 * Script để generate PWA icons từ logo hiện có
 * Chạy: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const sourceLogo = path.join(__dirname, '../public/images/logo.png');
const iconsDir = path.join(__dirname, '../public/icons');

// Tạo thư mục icons nếu chưa có
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Kiểm tra logo có tồn tại không
if (!fs.existsSync(sourceLogo)) {
  console.error('❌ Logo không tìm thấy tại:', sourceLogo);
  console.log('💡 Vui lòng đảm bảo có file logo.png tại public/images/');
  process.exit(1);
}

console.log('✅ Tìm thấy logo:', sourceLogo);
console.log('📁 Thư mục icons:', iconsDir);

// Sizes cần tạo
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Kiểm tra xem có sharp không (image processing library)
let sharp;
try {
  sharp = require('sharp');
  console.log('✅ Sử dụng sharp để resize images');
} catch (e) {
  console.log('⚠️  Sharp không được cài đặt');
  console.log('💡 Đang copy logo làm placeholder...');
  console.log('📝 Để resize đúng size, cài: npm install sharp');
  
  // Copy logo làm placeholder
  sizes.forEach(size => {
    const dest = path.join(iconsDir, `icon-${size}.png`);
    fs.copyFileSync(sourceLogo, dest);
    console.log(`   ✓ Tạo ${dest} (chưa resize)`);
  });
  
  // Tạo maskable icon
  const maskableDest = path.join(iconsDir, 'icon-512-maskable.png');
  fs.copyFileSync(sourceLogo, maskableDest);
  console.log(`   ✓ Tạo ${maskableDest} (chưa resize)`);
  
  console.log('\n⚠️  LƯU Ý: Icons chưa được resize đúng size!');
  console.log('💡 Để resize đúng:');
  console.log('   1. Cài: npm install sharp');
  console.log('   2. Chạy lại: node scripts/generate-icons.js');
  console.log('   Hoặc resize thủ công bằng image editor');
  process.exit(0);
}

// Sử dụng sharp để resize
async function generateIcons() {
  try {
    console.log('\n🔄 Đang tạo icons...\n');
    
    // Tạo các icons với sizes khác nhau
    for (const size of sizes) {
      const dest = path.join(iconsDir, `icon-${size}.png`);
      await sharp(sourceLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(dest);
      console.log(`   ✓ Tạo icon-${size}.png (${size}x${size})`);
    }
    
    // Tạo maskable icon (460x460 trong canvas 512x512 với padding)
    const maskableDest = path.join(iconsDir, 'icon-512-maskable.png');
    await sharp(sourceLogo)
      .resize(460, 460, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: 26,
        bottom: 26,
        left: 26,
        right: 26,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(maskableDest);
    console.log(`   ✓ Tạo icon-512-maskable.png (512x512 với safe zone)`);
    
    console.log('\n✅ Hoàn thành! Tất cả icons đã được tạo.');
    console.log('💡 Bây giờ bạn có thể test PWA install prompt.');
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo icons:', error);
    process.exit(1);
  }
}

generateIcons();
