const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  collection: {
    title: {
      vi: "Bộ Sưu Tập Đặc Biệt",
      ja: "特別コレクション",
      en: "Special Collection"
    },
    subtitle: {
      vi: "Khám phá những dòng sản phẩm độc đáo được sáng tạo dành riêng cho bạn.",
      ja: "あなただけのために作られた、ユニークな製品ラインナップをご覧ください。",
      en: "Discover unique product lines created especially for you."
    },
    items: {
      item1: {
        title: { vi: "Thu Hoạch Vải", ja: "ライチの収穫", en: "Lychee Harvest" },
        category: { vi: "Năng lượng tích cực cùng mọi người thu hoạch.", ja: "みんなで収穫する前向きなエネルギー。", en: "Positive energy harvesting together." }
      },
      item2: {
        title: { vi: "Tinh Tế Trong Từng Công Đoạn", ja: "各工程の繊細さ", en: "Delicacy in Every Step" },
        category: { vi: "Lựa chọn những trái vải tốt nhất.", ja: "最高品質のライチを厳選します。", en: "Selecting the best lychees." }
      },
      item3: {
        title: { vi: "Kết Hợp Với Ánh Nắng Mặt Trời", ja: "太陽の恵みとともに", en: "Combined with Sunlight" },
        category: { vi: "Phơi khô tự nhiên để giữ trọn hương vị.", ja: "自然乾燥で風味を丸ごと閉じ込めます。", en: "Naturally sun-dried to retain full flavor." }
      },
      item4: {
        title: { vi: "Thành Quả Ngọt Ngào", ja: "甘い成果", en: "Sweet Results" },
        category: { vi: "Những trái vải khô mọng, sẵn sàng để chế biến.", ja: "加工準備が整った、ふっくらとしたドライライチ。", en: "Plump dried lychees, ready for processing." }
      },
      item5: {
        title: { vi: "Đóng Gói", ja: "パッケージング", en: "Packaging" },
        category: { vi: "Sản phẩm được đóng gói tỉ mỉ và sang trọng.", ja: "細部までこだわった高級感のある包装。", en: "Products packaged meticulously and luxuriously." }
      }
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.collection = {
      title: newTranslations.collection.title[file.lang],
      subtitle: newTranslations.collection.subtitle[file.lang],
      items: {}
    };

    Object.keys(newTranslations.collection.items).forEach(key => {
      data.collection.items[key] = {
        title: newTranslations.collection.items[key].title[file.lang],
        category: newTranslations.collection.items[key].category[file.lang]
      };
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
