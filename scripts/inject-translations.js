const fs = require('fs');

const viPath = 'src/i18n/locales/vi.json';
const jaPath = 'src/i18n/locales/ja.json';

let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

const homepageVi = {
  featured: {
    eyebrow: 'Bộ Sưu Tập Độc Quyền',
    title: 'Sản Phẩm Nổi Bật',
    desc_prefix: 'Những sáng tạo độc đáo từ',
    desc_suffix: 'kết tinh hương vị ngọt ngào của đất trời và tâm huyết của người nông dân.',
    error: 'Không thể tải sản phẩm nổi bật',
    retry: 'Thử lại',
    empty: 'Chưa có sản phẩm nổi bật',
    badge_preorder: 'Đặt Trước',
    badge_new: 'Mới',
    badge_bestseller: 'Bán chạy',
    view_all: 'Xem Tất Cả Sản Phẩm'
  },
  value_prop: {
    eyebrow: 'Tại Sao Chọn Chúng Tôi',
    title: 'Giá Trị Cốt Lõi',
    desc: 'Những lý do khiến LALA-LYCHEEE trở thành lựa chọn hàng đầu cho những ai yêu thích hương vị tự nhiên và chất lượng cao cấp',
    item0: { title: '100% Vải Tươi Vĩnh Lập', desc: 'Nguồn gốc rõ ràng từ vùng đất Vĩnh Lập - Thanh Hà, nơi có hương vị độc bản không nơi nào có.' },
    item1: { title: 'Chất Lượng Quốc Tế', desc: 'Quy trình canh tác chuẩn Nhật Bản, đạt chứng nhận chất lượng và xuất khẩu thành công.' },
    item2: { title: 'Đóng Gói Sang Trọng', desc: 'Mỗi sản phẩm được đóng gói tinh xảo, phù hợp làm quà tặng cao cấp.' },
    item3: { title: 'Tâm Huyết Với Quê Hương', desc: 'Mang lại công ăn việc làm bền vững cho người nông dân, góp phần phát triển địa phương.' },
    item4: { title: 'Xuất Khẩu Nhật Bản', desc: 'Được tin dùng tại thị trường Nhật Bản - minh chứng cho chất lượng và uy tín.' },
    item5: { title: 'Dịch Vụ Tận Tâm', desc: 'Hỗ trợ khách hàng 24/7, giao hàng nhanh chóng, đảm bảo hài lòng 100%.' }
  },
  news: {
    eyebrow: 'Tin Tức & Cập Nhật',
    title: 'Câu Chuyện Từ Vĩnh Lập',
    desc: 'Khám phá những câu chuyện, tin tức và cập nhật mới nhất về vải thiều Vĩnh Lập và hành trình của LALA-LYCHEEE',
    view_all: 'Xem Tất Cả Tin Tức'
  }
};

const homepageJa = {
  featured: {
    eyebrow: '限定コレクション',
    title: 'おすすめ商品',
    desc_prefix: 'からの独創的な作品',
    desc_suffix: '天地の甘い風味と農家の熱意の結晶です。',
    error: 'おすすめ商品を読み込めませんでした',
    retry: '再試行',
    empty: 'おすすめ商品はまだありません',
    badge_preorder: '予約注文',
    badge_new: '新着',
    badge_bestseller: 'ベストセラー',
    view_all: 'すべての商品を見る'
  },
  value_prop: {
    eyebrow: '選ばれる理由',
    title: 'コアバリュー',
    desc: '自然の風味と高品質を愛する方がLALA-LYCHEEEを第一に選ぶ理由。',
    item0: { title: '100% ヴィンラップの新鮮なライチ', desc: '他にはない独特の風味を持つ、歴史あるヴィンラップ地方の明確な原産地。' },
    item1: { title: '国際的な品質規格', desc: '日本の基準に準拠した栽培プロセスで、品質認証を取得し、輸出に成功しています。' },
    item2: { title: '高級なパッケージ', desc: '各製品は洗練されたパッケージに梱包され、高級なギフトに最適です。' },
    item3: { title: '故郷への熱意', desc: '農家に持続可能な雇用をもたらし、地域の発展に貢献します。' },
    item4: { title: '日本への輸出', desc: '日本市場での高い信頼は、品質と名声の証です。' },
    item5: { title: '心のこもったサービス', desc: '100％の満足を保証するため、迅速な配送と24時間365日のサポート。' }
  },
  news: {
    eyebrow: 'ニュース＆アップデート',
    title: 'ヴィンラップの物語',
    desc: 'ヴィンラップのライチやLALA-LYCHEEEの旅に関する最新の物語、ニュースやアップデートをご覧ください。',
    view_all: 'すべてのニュースを見る'
  }
};

vi.homepage = homepageVi;
ja.homepage = homepageJa;

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(jaPath, JSON.stringify(ja, null, 2));
console.log("Done");
