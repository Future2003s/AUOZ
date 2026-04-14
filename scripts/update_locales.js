const fs = require('fs');
const files = [
  { path: './src/i18n/locales/vi.json', lang: 'vi' },
  { path: './src/i18n/locales/en.json', lang: 'en' },
  { path: './src/i18n/locales/ja.json', lang: 'ja' }
];

const newTranslations = {
  header: {
    select_language: { vi: 'Chọn ngôn ngữ', en: 'Select language', ja: '言語を選択' },
    hello: { vi: 'Xin chào', en: 'Hello', ja: 'こんにちは' },
    employee_page: { vi: 'Trang nhân viên', en: 'Employee Page', ja: '従業員ページ' },
    admin_page: { vi: 'Quản trị', en: 'Admin', ja: '管理' },
    logout: { vi: 'Đăng xuất', en: 'Logout', ja: 'ログアウト' },
    logout_failed: { vi: 'Đăng xuất thất bại', en: 'Logout failed', ja: 'ログアウト失敗' },
    logout_success: { vi: 'Đã đăng xuất', en: 'Logged out', ja: 'ログアウトしました' },
    login: { vi: 'Đăng nhập', en: 'Login', ja: 'ログイン' },
    cart: { vi: 'Giỏ hàng', en: 'Cart', ja: 'カート' },
    pc_mode: { vi: 'Chế độ PC', en: 'Desktop Mode', ja: 'PCモード' },
    open_menu: { vi: 'Mở menu', en: 'Open menu', ja: 'メニューを開く' }
  },
  footer: {
    address_value: { vi: 'thôn Tú Y, xã Hà Đông, Thành Phố Hải Phòng.', en: 'Tu Y village, Ha Dong commune, Hai Phong city.', ja: 'ハイフォン市、ハドンコミューン、トゥイー村。' },
    news_events: { vi: 'Tin tức & Sự kiện', en: 'News & Events', ja: 'ニュースとイベント' },
    complaints: { vi: 'Giải quyết khiếu nại', en: 'Complaints', ja: '苦情解決' },
    tax_code_label: { vi: 'Mã Số Thuế:', en: 'Tax code:', ja: '納税者番号:' },
    short_name_label: { vi: 'Tên viết tắt:', en: 'Short name:', ja: '略称:' },
    intl_name_label: { vi: 'Tên quốc tế:', en: 'Intl name:', ja: '国際名:' },
    status_label: { vi: 'Trạng thái:', en: 'Status:', ja: 'ステータス:' },
    address_label: { vi: 'Địa chỉ:', en: 'Address:', ja: '住所:' },
    managed_by: { vi: 'Quản Lý Bởi Thanh Hà - Thuế cơ sở 14 Thành Phố Hải Phòng', en: 'Managed By Thanh Ha - Tax branch 14 Hai Phong City', ja: 'ハイフォン市税務署14支局による管理' },
    source_label: { vi: 'Nguồn:', en: 'Source:', ja: 'ソース:' },
    updated_at_label: { vi: 'Cập nhật lúc:', en: 'Updated at:', ja: '更新日:' },
    copyright_notice: { vi: 'Lalalycheee CO.,LTD. Bảo lưu mọi quyền.', en: 'Lalalycheee CO.,LTD. All rights reserved.', ja: 'Lalalycheee CO.,LTD. 無断複写・転載を禁じます。' },
    location_title: { vi: 'Vải Thiều Vĩnh Lập - Thanh Hà', en: 'Vinh Lap Lychee - Thanh Ha', ja: 'ビンラップライチ - タンハ' }
  },
  site: {
    about_desc_1: { 
      vi: 'Sinh ra và lớn lên tại vùng quê Vĩnh Lập – Thanh Hà – Hải Dương, nơi được mệnh danh là "đất vải", tôi hiểu sâu sắc cuộc sống còn nhiều khó khăn của người nông dân nơi đây. Vùng đất này đẹp nhưng nghèo, bốn bề là sông nước, giao thương hạn chế. Có một thời, tôi từng tự ti về quê hương mình đến mức không dám nói với bạn bè rằng mình đến từ Vĩnh Lập.', 
      en: 'Born and raised in the rural area of Vinh Lap - Thanh Ha - Hai Duong, known as the "lychee land", I deeply understand the difficult life of the farmers here. This land is beautiful but poor, surrounded by rivers, with limited trade. There was a time when I was so insecure about my hometown that I didn\'t dare to tell my friends I was from Vinh Lap.', 
      ja: 'ライチの地として知られるビンラップ・タンハ・ハイズオンの田舎で生まれ育った私は、ここの農民の厳しい生活を深く理解しています。この土地は美しいですが貧しく、川に囲まれ、交易も限られています。一時期、私は故郷について非常に不安を感じ、ビンラップ出身であることを友人に言う勇気さえありませんでした。' 
    },
    about_desc_2: { 
      vi: 'Chúng tôi đã đem những trái vải quê mình sang giới thiệu với bạn bè Nhật Bản, và từ đó tôi nhận ra rằng: Vùng đất mà trước đây tôi từng tự ti, thực chất lại là một nơi vô cùng đáng tự hào. Tôi hiểu rằng mình phải làm điều gì đó để thế hệ trẻ lớn lên tại đây có thể tự tin nói rằng: "Tôi sinh ra ở Vĩnh Lập."', 
      en: 'We brought our hometown lychees to introduce to Japanese friends, and realized that: The land I was previously insecure about is actually a place to be extremely proud of. I understood that I must do something so the younger generation growing up here can confidently say: "I was born in Vinh Lap."', 
      ja: '私たちは日本の友人に紹介するために故郷のライチを持っていきました。そして気づいたのです。私がかつて不安を感じていたこの土地は、実は非常に誇りに思うべき場所なのだと。ここで育つ若い世代が自信を持って「私はビンラップで生まれました」と言えるように、何かをしなければならないと理解しました。' 
    },
    about_desc_3: { 
      vi: 'Từ khát vọng đó, tôi bắt đầu hành trình đưa trái vải – tinh hoa của trời đất Thanh Hà – vươn ra thế giới. LALA-LYCHEEE ra đời với sứ mệnh mang vải thiều Vĩnh Lập đến với bạn bè quốc tế, tạo thêm công ăn việc làm cho bà con, để sau mỗi mùa vải, họ không còn cảnh thiếu việc, phải đi làm ăn xa.', 
      en: 'From that aspiration, I began the journey of bringing lychees – the essence of Thanh Ha – to the world. LALA-LYCHEEE was born with the mission of bringing Vinh Lap lychees to international friends, creating jobs for locals, so that after each lychee season, they don\'t have to travel far for work.', 
      ja: 'その熱望から、タンハの精髄であるライチを世界に届ける旅を始めました。LALA-LYCHEEEは、ビンラップのライチを世界の友人に届け、地元の人々に仕事を作り、収穫期が終わっても彼らが遠くに出稼ぎに行かなくて済むようにするという使命のもとに誕生しました。' 
    },
    founder_quote: { 
      vi: 'Bước ngoặt đến khi tôi có cơ duyên sang Nhật Bản... Chính vợ tôi là người đã chỉ ra cho tôi thấy những vẻ đẹp rất đỗi bình dị nhưng tuyệt vời của làng quê Vĩnh Lập.', 
      en: 'The turning point came when I had the opportunity to go to Japan... It was my wife who showed me the simple but wonderful beauty of Vinh Lap village.', 
      ja: '転機は私に日本へ行く機会があったときに訪れました... ビンラップの村のシンプルで素晴らしい美しさを私に示してくれたのは妻でした。' 
    },
    about_footer_quote: { 
      vi: 'Mỗi sản phẩm là một tác phẩm nghệ thuật, kết tinh từ nguồn nguyên liệu tuyển chọn và tình yêu quê hương xứ sở.', 
      en: 'Every product is a piece of art, crystalized from selected ingredients and love for the homeland.', 
      ja: '各製品は、選ばれた原料と故郷への愛から結晶化した芸術作品です。' 
    },
    read_more_story: { 
      vi: 'Đọc thêm câu chuyện',
      en: 'Read more story',
      ja: 'ストーリーをもっと読む'
    },
    mission_title: { vi: 'Sứ Mệnh', en: 'Mission', ja: '使命' },
    mission_desc: { vi: 'Mang vải thiều Vĩnh Lập – tinh hoa của đất trời Thanh Hà – vươn ra thế giới, tạo thêm công ăn việc làm bền vững cho bà con nông dân, để thế hệ trẻ Vĩnh Lập có thể tự hào nói: "Tôi sinh ra ở Vĩnh Lập."', en: 'Bringing Vinh Lap lychees – the essence of Thanh Ha – to the world, creating sustainable jobs for farmers, so the younger generation can proudly say: "I was born in Vinh Lap."', ja: 'タンハの精髄であるビンラップのライチを世界へ届け、農民に持続可能な仕事を作り、若い世代が「私はビンラップで生まれました」と誇りを持てるようにすること。' },
    vision_title: { vi: 'Tầm Nhìn', en: 'Vision', ja: 'ビジョン' },
    vision_desc: { vi: 'Trở thành thương hiệu nông sản Việt Nam hàng đầu, được công nhận trên thị trường quốc tế, góp phần nâng tầm giá trị nông sản Việt và mang lại cuộc sống tốt đẹp hơn cho người nông dân quê hương.', en: 'To become a leading Vietnamese agricultural brand recognized internationally, contributing to elevating the value of Vietnamese agricultural products and bringing a better life to hometown farmers.', ja: '国際的に認められるベトナムの主要な農業ブランドになり、ベトナムの農産物の価値を高め、故郷の農民により良い生活をもたらすことに貢献する。' },
    we_were_born_in: { vi: '"Tôi sinh ra ở Vĩnh Lập."', en: '"I was born in Vinh Lap."', ja: '「私はビンラップで生まれました」'}
  },
  hero: {
    badges: {
      japan_export: { vi: 'Xuất khẩu Nhật Bản', en: 'Exported to Japan', ja: '日本へ輸出' },
      quality_cert: { vi: 'Chứng nhận chất lượng', en: 'Quality Certified', ja: '品質認証済み' },
      vinh_lap_lychee: { vi: 'Vải thiều Vĩnh Lập - Hương vị độc bản', en: 'Vinh Lap Lychee - Unique taste', ja: 'ビンラップライチ - 独特の味' }
    },
    stats: {
      happy_customers: { vi: 'Khách hàng hài lòng', en: 'Happy customers', ja: '満足したお客様' },
      avg_rating: { vi: 'Đánh giá trung bình', en: 'Average rating', ja: '平均評価' }
    }
  }
};

files.forEach(file => {
  if (fs.existsSync(file.path)) {
    const data = JSON.parse(fs.readFileSync(file.path, 'utf8'));
    
    // Merge new translations
    if (!data.header) data.header = {};
    if (!data.hero) data.hero = { badges: {}, stats: {} };
    if (!data.hero.badges) data.hero.badges = {};
    if (!data.hero.stats) data.hero.stats = {};
    if (!data.site) data.site = {};
    if (!data.footer) data.footer = {};

    Object.keys(newTranslations).forEach(category => {
      Object.keys(newTranslations[category]).forEach(key => {
        if (!data[category]) data[category] = {};
        data[category][key] = newTranslations[category][key][file.lang];
      });
    });

    fs.writeFileSync(file.path, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  } else {
    console.log(`File not found: ${file.path}`);
  }
});
