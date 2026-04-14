const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  news_section: {
    subtitle: {
      vi: "Tin Tức & Cập Nhật",
      ja: "ニュースとアップデート",
      en: "News & Updates"
    },
    title: {
      vi: "Câu Chuyện Từ Vĩnh Lập",
      ja: "ヴィンラップからの物語",
      en: "Stories from Vinh Lap"
    },
    description: {
      vi: "Khám phá những câu chuyện, tin tức và cập nhật mới nhất về vải thiều Vĩnh Lập và hành trình của LALA-LYCHEEE",
      ja: "ヴィンラップのライチとLALA-LYCHEEEの歩みに関する最新の物語、ニュース、アップデートをご覧ください。",
      en: "Discover the latest stories, news, and updates about Vinh Lap lychee and the journey of LALA-LYCHEEE."
    },
    view_all: {
      vi: "Xem Tất Cả Tin Tức",
      ja: "すべてのニュースを見る",
      en: "View All News"
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.news_section = {
      subtitle: newTranslations.news_section.subtitle[file.lang],
      title: newTranslations.news_section.title[file.lang],
      description: newTranslations.news_section.description[file.lang],
      view_all: newTranslations.news_section.view_all[file.lang]
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
