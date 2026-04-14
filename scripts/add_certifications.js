const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  certifications: {
    subtitle: {
      vi: "Chứng Nhận & Đối Tác",
      ja: "認証とパートナー",
      en: "Certifications & Partners"
    },
    title: {
      vi: "Được Công Nhận",
      ja: "認証取得済み",
      en: "Recognized Accreditations"
    },
    partners_title: {
      vi: "Đối Tác Đồng Hành",
      ja: "パートナー企業",
      en: "Our Partners"
    },
    items: {
      cert1: {
        name: { vi: "Chứng Nhận Chất Lượng", ja: "品質認証", en: "Quality Certification" },
        description: { vi: "Đạt tiêu chuẩn chất lượng quốc tế", ja: "国際的な品質基準をクリア", en: "Meets international quality standards" }
      },
      cert2: {
        name: { vi: "Xuất Khẩu Nhật Bản", ja: "日本向け輸出", en: "Exported to Japan" },
        description: { vi: "Được tin dùng tại thị trường Nhật Bản", ja: "日本の市場で信頼されています", en: "Trusted in the Japanese market" }
      },
      cert3: {
        name: { vi: "ISO 22000:2018", ja: "ISO 22000:2018", en: "ISO 22000:2018" },
        description: { vi: "Hệ thống quản lý an toàn thực phẩm", ja: "食品安全マネジメントシステム", en: "Food safety management system" }
      }
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.certifications = {
      subtitle: newTranslations.certifications.subtitle[file.lang],
      title: newTranslations.certifications.title[file.lang],
      partners_title: newTranslations.certifications.partners_title[file.lang],
      items: {}
    };

    Object.keys(newTranslations.certifications.items).forEach(key => {
      data.certifications.items[key] = {
        name: newTranslations.certifications.items[key].name[file.lang],
        description: newTranslations.certifications.items[key].description[file.lang]
      };
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
