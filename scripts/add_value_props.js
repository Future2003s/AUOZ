const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  value: {
    subtitle: {
      vi: "Tại Sao Chọn Chúng Tôi",
      ja: "選ばれる理由",
      en: "Why Choose Us"
    },
    title: {
      vi: "Giá Trị Cốt Lõi",
      ja: "コアバリュー",
      en: "Core Values"
    },
    description: {
      vi: "Những lý do khiến LALA-LYCHEEE trở thành lựa chọn hàng đầu cho những ai yêu thích hương vị tự nhiên và chất lượng cao cấp",
      ja: "自然な風味とプレミアムな品質を愛するすべての人にとって、LALA-LYCHEEEが最高の選択肢となる理由",
      en: "Reasons why LALA-LYCHEEE is the top choice for those who love natural flavors and premium quality"
    },
    items: {
      item1: {
        title: { vi: "100% Vải Tươi Vĩnh Lập", ja: "100%ヴィンラップ産生ライチ", en: "100% Fresh Vinh Lap Lychee" },
        description: { vi: "Nguồn gốc rõ ràng từ vùng đất Vĩnh Lập - Thanh Hà, nơi có hương vị độc bản không nơi nào có.", ja: "ヴィンラップ・タンハ地域で栽培された、そこでしか味わえない唯一無二の風味。", en: "Clear origin from Vinh Lap - Thanh Ha, where there is a unique flavor like nowhere else." }
      },
      item2: {
        title: { vi: "Chất Lượng Quốc Tế", ja: "国際的な品質", en: "International Quality" },
        description: { vi: "Quy trình canh tác chuẩn Nhật Bản, đạt chứng nhận chất lượng và xuất khẩu thành công.", ja: "日本基準の栽培プロセス、品質認証を取得し輸出に成功。", en: "Japanese standard cultivation process, achieved quality certification and successfully exported." }
      },
      item3: {
        title: { vi: "Đóng Gói Sang Trọng", ja: "豪華なパッケージ", en: "Luxury Packaging" },
        description: { vi: "Mỗi sản phẩm được đóng gói tinh xảo, phù hợp làm quà tặng cao cấp.", ja: "プレミアムな贈り物として最適な、精巧にデザインされたパッケージ。", en: "Each product is exquisitely packaged, suitable for premium gifts." }
      },
      item4: {
        title: { vi: "Tâm Huyết Với Quê Hương", ja: "故郷への想い", en: "Devotion to Hometown" },
        description: { vi: "Mang lại công ăn việc làm bền vững cho người nông dân, góp phần phát triển địa phương.", ja: "農家に持続可能な雇用を提供し、地域の発展に貢献。", en: "Providing sustainable jobs for farmers, contributing to local development." }
      },
      item5: {
        title: { vi: "Xuất Khẩu Nhật Bản", ja: "日本向け輸出", en: "Exported to Japan" },
        description: { vi: "Được tin dùng tại thị trường Nhật Bản - minh chứng cho chất lượng và uy tín.", ja: "日本市場で信頼されており、その品質と評判が証明されています。", en: "Trusted in the Japanese market - a testament to quality and reputation." }
      },
      item6: {
        title: { vi: "Dịch Vụ Tận Tâm", ja: "献身的なサービス", en: "Dedicated Service" },
        description: { vi: "Hỗ trợ khách hàng 24/7, giao hàng nhanh chóng, đảm bảo hài lòng 100%.", ja: "24時間365日のカスタマーサポート、迅速な配送、100%の満足を保証。", en: "24/7 customer support, fast delivery, 100% satisfaction guaranteed." }
      }
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Inject value section manually
    data.value = {
      subtitle: newTranslations.value.subtitle[file.lang],
      title: newTranslations.value.title[file.lang],
      description: newTranslations.value.description[file.lang],
      items: {}
    };

    Object.keys(newTranslations.value.items).forEach(key => {
      data.value.items[key] = {
        title: newTranslations.value.items[key].title[file.lang],
        description: newTranslations.value.items[key].description[file.lang]
      };
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
