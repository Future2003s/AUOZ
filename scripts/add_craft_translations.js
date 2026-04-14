const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  our_craft: {
    click_hint: {
      vi: "(Nhấp vào từng bước để xem chi tiết)",
      ja: "（各ステップをクリックして詳細をご覧ください）",
      en: "(Click on each step to see details)"
    },
    steps: {
      step1: {
        title: { vi: "Tuyển Chọn Tinh Tế", ja: "厳格な選別", en: "Exquisite Selection" },
        description: { vi: "Từng trái vải được lựa chọn thủ công từ những khu vườn đạt chuẩn, đảm bảo độ chín mọng và hương vị ngọt ngào nhất.", ja: "基準を満たした農園から手作業で厳選し、最高の熟度と甘さを保証します。", en: "Each lychee is hand-picked from certified orchards, ensuring the perfect ripeness and sweetest flavor." }
      },
      step2: {
        title: { vi: "Chế Biến Tỉ Mỉ", ja: "丁寧な加工", en: "Meticulous Processing" },
        description: { vi: "Quy trình sản xuất khép kín, ứng dụng công nghệ hiện đại để giữ trọn vẹn dưỡng chất và hương vị tự nhiên của trái vải.", ja: "ライチの自然な風味と栄養を保つため、最新技術を用いた衛生的な製造プロセスを採用しています。", en: "A closed production process using modern technology to retain the lychee's natural nutrients and flavor." }
      },
      step3: {
        title: { vi: "Đóng Gói Sang Trọng", ja: "高級感のある包装", en: "Luxury Packaging" },
        description: { vi: "Mỗi sản phẩm là một tác phẩm nghệ thuật, được khoác lên mình bao bì đẳng cấp, tinh xảo trong từng chi tiết.", ja: "すべての製品が芸術作品のように、細部までこだわった高級なパッケージに包まれています。", en: "Each product is a work of art, adorned in premium packaging crafted with intricate detail." }
      }
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.our_craft = {
      click_hint: newTranslations.our_craft.click_hint[file.lang],
      steps: {}
    };

    Object.keys(newTranslations.our_craft.steps).forEach(key => {
      data.our_craft.steps[key] = {
        title: newTranslations.our_craft.steps[key].title[file.lang],
        description: newTranslations.our_craft.steps[key].description[file.lang]
      };
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
