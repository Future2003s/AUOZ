const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  featured_products: {
    subtitle: {
      vi: "Bộ Sưu Tập Độc Quyền",
      ja: "限定コレクション",
      en: "Exclusive Collection"
    },
    description: {
      vi: "Những sáng tạo độc đáo từ <strong>LALA-LYCHEE</strong>, kết tinh hương vị ngọt ngào của đất trời và tâm huyết của người nông dân.",
      ja: "<strong>LALA-LYCHEEE</strong>ならではのユニークな創造物。自然の甘味と農家の情熱の結晶です。",
      en: "Unique creations from <strong>LALA-LYCHEE</strong>, crystallizing the sweet flavor of nature and the dedication of farmers."
    },
    error: {
      vi: "Không thể tải sản phẩm nổi bật",
      ja: "注目の製品をロードできませんでした",
      en: "Failed to load featured products"
    },
    retry: {
      vi: "Thử lại",
      ja: "再試行",
      en: "Retry"
    },
    empty: {
      vi: "Chưa có sản phẩm nổi bật",
      ja: "注目の製品はまだありません",
      en: "No featured products yet"
    },
    view_all: {
      vi: "Xem Tất Cả Sản Phẩm",
      ja: "すべての製品を見る",
      en: "View All Products"
    },
    default_name: {
      vi: "Sản phẩm",
      ja: "製品",
      en: "Product"
    },
    default_category: {
      vi: "Sản phẩm",
      ja: "製品",
      en: "Product"
    },
    badges: {
      preorder: { vi: "Đặt Trước", ja: "予約注文", en: "Pre-order" },
      new: { vi: "Mới", ja: "新商品", en: "New" },
      bestseller: { vi: "Bán chạy", ja: "ベストセラー", en: "Best Seller" }
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.featured_products = {
      subtitle: newTranslations.featured_products.subtitle[file.lang],
      description: newTranslations.featured_products.description[file.lang],
      error: newTranslations.featured_products.error[file.lang],
      retry: newTranslations.featured_products.retry[file.lang],
      empty: newTranslations.featured_products.empty[file.lang],
      view_all: newTranslations.featured_products.view_all[file.lang],
      default_name: newTranslations.featured_products.default_name[file.lang],
      default_category: newTranslations.featured_products.default_category[file.lang],
      badges: {
        preorder: newTranslations.featured_products.badges.preorder[file.lang],
        new: newTranslations.featured_products.badges.new[file.lang],
        bestseller: newTranslations.featured_products.badges.bestseller[file.lang]
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
