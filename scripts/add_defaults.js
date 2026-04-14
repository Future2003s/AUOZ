const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  defaults: {
    // Hero slide defaults
    hero_title: {
      vi: "Tinh Tuý Từ Thiên Nhiên",
      ja: "自然の恵みから生まれた、上質な味わい",
      en: "The Finest from Nature"
    },
    hero_subtitle: {
      vi: "Vải thiều Vĩnh Lập – Thanh Hà, được tuyển chọn cẩn thận, mang hương vị ngọt ngào thuần khiết đến với gia đình bạn.",
      ja: "ヴィンラップ産ライチ - 丁寧に選び抜かれた、純粋な甘さをご家族へ。",
      en: "Vinh Lap lychee – carefully selected to bring pure sweet flavor to your family."
    },
    hero_cta: {
      vi: "Khám Phá Ngay",
      ja: "今すぐ探す",
      en: "Explore Now"
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.defaults) data.defaults = {};
    data.defaults.hero_title = newTranslations.defaults.hero_title[file.lang];
    data.defaults.hero_subtitle = newTranslations.defaults.hero_subtitle[file.lang];
    data.defaults.hero_cta = newTranslations.defaults.hero_cta[file.lang];

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
