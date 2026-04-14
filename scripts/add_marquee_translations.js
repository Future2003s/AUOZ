const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  marquee: {
    item1: { vi: "🍒 Vĩnh Lập - Đất Vải Thanh Hà", ja: "🍒 ヴィンラップ - タインハー産ライチの郷", en: "🍒 Vinh Lap - Home of Thanh Ha Lychee" },
    item2: { vi: "⭐ Hương Vị Độc Bản", ja: "⭐ 唯一無二の味わい", en: "⭐ Unique Flavor" },
    item3: { vi: "🌏 Xuất Khẩu Nhật Bản", ja: "🌏 日本向け輸出実績", en: "🌏 Exported to Japan" },
    item4: { vi: "✨ 100% Vải Tươi Tuyển Chọn", ja: "✨ 100% 厳選された新鮮なライチ", en: "✨ 100% Hand-picked Fresh Lychee" },
    item5: { vi: "🏆 Chứng Nhận Chất Lượng", ja: "🏆 品質認証取得", en: "🏆 Quality Certified" },
    item6: { vi: "💝 Quà Tặng Sang Trọng", ja: "💝 高級ギフトパッケージ", en: "💝 Luxury Gift" },
    item7: { vi: "🚚 Giao Hàng Toàn Quốc", ja: "🚚 全国配送対応", en: "🚚 Nationwide Delivery" },
    item8: { vi: "👥 10,000+ Khách Hàng Hài Lòng", ja: "👥 10,000人以上のお客様が満足", en: "👥 10,000+ Satisfied Customers" }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.marquee = {
      item1: newTranslations.marquee.item1[file.lang],
      item2: newTranslations.marquee.item2[file.lang],
      item3: newTranslations.marquee.item3[file.lang],
      item4: newTranslations.marquee.item4[file.lang],
      item5: newTranslations.marquee.item5[file.lang],
      item6: newTranslations.marquee.item6[file.lang],
      item7: newTranslations.marquee.item7[file.lang],
      item8: newTranslations.marquee.item8[file.lang]
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
