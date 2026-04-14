const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  video_section: {
    section_title: {
      vi: "Câu chuyện của chúng tôi",
      ja: "私たちのストーリー",
      en: "Our Story"
    },
    video_title: {
      vi: "Vợ chồng Nhật Việt tâm huyết với quả vải Thanh Hà, Hải Dương",
      ja: "ベトナムと日本の懸け橋。タインハー産ライチへの情熱",
      en: "Japanese-Vietnamese couple's dedication to Thanh Ha lychee"
    },
    video_description: {
      vi: "Góp phần quảng bá đặc sản quê hương Vĩnh Lập, Thanh Hà đến với bạn bè trong và ngoài nước.",
      ja: "ベトナム・タインハーの特産品であるライチを世界へ。故郷の発展に貢献する日越夫婦の軌跡。",
      en: "Promoting the local specialty of Vinh Lap, Thanh Ha to friends locally and internationally."
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.video_section = {
      section_title: newTranslations.video_section.section_title[file.lang],
      video_title: newTranslations.video_section.video_title[file.lang],
      video_description: newTranslations.video_section.video_description[file.lang]
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
