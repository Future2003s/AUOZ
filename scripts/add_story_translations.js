const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const translations = {
  story: {
    loading: { vi: "Đang tải câu chuyện...", ja: "ストーリーを読み込んでいます...", en: "Loading story..." },
    hero_title: { vi: "Hành Trình Trở Về", ja: "帰郷の旅", en: "The Journey Home" },
    hero_subtitle: { vi: "Đánh Thức", ja: "目覚め", en: "Awakening" },
    hero_description: { vi: "Từ nỗi tự ti của một người con xa xứ, đến khát vọng mang niềm tự hào Vĩnh Lập vươn ra thế giới.", ja: "故郷を離れた一人の若者の劣等感から、ヴィンラップの誇りを世界へ届けたいという情熱へ。", en: "From the self-doubt of someone far from home, to a passion for sharing the pride of Vinh Lap with the world." },
    explore: { vi: "Khám phá", ja: "探索", en: "Explore" },

    chapter1_label: { vi: "Chương I", ja: "第1章", en: "Chapter I" },
    chapter1_location: { vi: "Vĩnh Lập, Thanh Hà", ja: "ヴィンラップ、タインハー", en: "Vinh Lap, Thanh Ha" },
    chapter1_location_text: { vi: '"Bốn bề là sông nước, người dân quanh năm vất vả..."', ja: '「四方を川に囲まれ、人々は一年中懸命に働いていた...」', en: '"Surrounded by rivers on all sides, the people worked hard all year round..."' },
    chapter1_title: { vi: "Vùng Đất Đẹp Nhưng Nghèo", ja: "美しくも貧しい土地", en: "Beautiful but Poor Land" },
    chapter1_content1: { vi: "Tôi sinh ra và lớn lên tại Vĩnh Lập – Thanh Hà – Hải Dương, cái nôi của cây vải thiều. Nhưng ngày ấy, tôi chỉ thấy sự nhọc nhằn. Vùng đất này đẹp, nhưng giao thương hạn chế, đời sống người dân thiếu thốn đủ bề.", ja: "私はハイズオン省タインハーのヴィンラップで生まれ育ちました。ライチの産地として知られる場所です。しかし当時の私の目には、苦労しか映っていませんでした。土地は美しくても、交通や商売は限られており、人々の暮らしは不便でした。", en: "I was born and raised in Vinh Lap – Thanh Ha – Hai Duong, the cradle of lychee trees. But back then, all I saw was hardship. This land is beautiful, but trade was limited, and people's lives lacked in many ways." },
    chapter1_quote: { vi: '"Có một thời, tôi từng tự ti về quê hương mình đến mức không dám nói với bạn bè rằng mình đến từ Vĩnh Lập."', ja: '「かつて私は故郷に対して引け目を感じ、ヴィンラップ出身だと友人に言えなかった時期があった。」', en: '"There was a time I was so ashamed of my hometown that I didn\'t dare tell my friends I was from Vinh Lap."' },

    chapter2_label: { vi: "Chương II", ja: "第2章", en: "Chapter II" },
    chapter2_title: { vi: "Góc Nhìn Từ Xứ Người", ja: "異国からの視点", en: "A View from Afar" },
    chapter2_content1: { vi: "Mười năm du học và làm việc tại Nhật Bản là khoảng thời gian thay đổi cuộc đời tôi. Tại đó, tôi gặp người bạn đời - một cô giáo dạy tiếng Nhật.", ja: "日本での10年間の留学・就労生活は、私の人生を変えました。そこで私は生涯の伴侶となる日本語教師の女性と出会いました。", en: "Ten years of studying and working in Japan were transformative. There, I met my life partner — a Japanese language teacher." },
    chapter2_content2: { vi: "Khi cùng nhau trở về Việt Nam, chính ánh mắt của cô ấy đã giúp tôi nhìn lại quê hương mình. Cô chỉ cho tôi thấy vẻ đẹp của tình làng nghĩa xóm, sự bình yên của sông nước, và đặc biệt là vị ngon tuyệt hảo của trái vải mà bấy lâu tôi xem nhẹ.", ja: "共にベトナムへ帰国したとき、彼女の目を通して私は故郷を見つめ直しました。村の絆の美しさ、川のせせらぎの穏やかさ、そして何より、ずっと軽視していたライチの格別な美味しさを教えてくれたのです。", en: "When we returned to Vietnam together, her eyes helped me rediscover my homeland — the beauty of community bonds, the peace of the river, and above all, the exquisite taste of lychee that I had long overlooked." },
    chapter2_awakening_title: { vi: "Sự Thức Tỉnh", ja: "覚醒", en: "The Awakening" },
    chapter2_item1: { vi: "Vẻ đẹp chân chất của con người Vĩnh Lập", ja: "ヴィンラップの人々が持つ素朴な美しさ", en: "The simple beauty of Vinh Lap people" },
    chapter2_item2: { vi: "Hương vị vải thiều độc bản không nơi nào có", ja: "どこにもないライチの独自の風味", en: "The unique lychee flavor found nowhere else" },
    chapter2_item3: { vi: "Niềm tự hào tiềm ẩn trong sự bình dị", ja: "素朴な日常に潜む誇り", en: "Pride hidden in simplicity" },
    chapter2_love: { vi: "Tình yêu & Nỗi nhớ", ja: "愛と郷愁", en: "Love & Longing" },

    quote_text: { vi: '"Chúng tôi mang trái vải quê mình mời bạn bè Nhật Bản. Từ ánh mắt ngạc nhiên của họ, tôi nhận ra: Vùng đất tôi từng tự ti, lại là nơi đáng tự hào nhất."', ja: '「故郷のライチを日本の友人たちに贈ったとき、彼らの驚きの表情を見て気づいた。かつて引け目を感じていたその土地こそ、誰よりも誇れる場所だったのだと。」', en: '"We brought our hometown lychees to share with Japanese friends. Seeing the amazement in their eyes, I realized: the place I had once been ashamed of was the place I could be most proud of."' },
    quote_author: { vi: "Founder LALA-LYCHEEE", ja: "LALA-LYCHEEEファウンダー", en: "Founder of LALA-LYCHEEE" },

    video_title: { vi: "Câu Chuyện Trên Màn Ảnh", ja: "映像で語るストーリー", en: "The Story on Screen" },
    video_description: { vi: "Khám phá hành trình đưa vải thiều Vĩnh Lập vươn ra thế giới qua góc nhìn của những người trong cuộc", ja: "ヴィンラップのライチを世界へ届ける旅を、当事者たちの視点からご覧ください", en: "Explore the journey of bringing Vinh Lap lychee to the world, through the eyes of those who lived it" },

    chapter3_label: { vi: "Chương III", ja: "第3章", en: "Chapter III" },
    chapter3_small_label: { vi: "Cây Vải Tổ Thanh Hà", ja: "タインハーの古木ライチ", en: "The Ancient Lychee Tree of Thanh Ha" },
    chapter3_title: { vi: "Mang Vải Thiều Vươn Ra Thế Giới", ja: "ライチを世界へ", en: "Bringing Lychee to the World" },
    chapter3_content1: { vi: 'Sứ mệnh của LALA-LYCHEEE không chỉ là bán trái cây. Đó là hành trình khẳng định thương hiệu nông sản Việt. Để thế hệ trẻ Vĩnh Lập có thể dõng dạc nói: "Tôi sinh ra ở Vĩnh Lập."', ja: 'LALA-LYCHEEEの使命は、果物を売ることだけではありません。それはベトナム農産物ブランドを確立する旅です。ヴィンラップの若い世代が誇りを持って「私はヴィンラップで生まれました」と言えるように。', en: 'LALA-LYCHEEE\'s mission is not just to sell fruit. It\'s a journey to establish the Vietnamese agricultural brand — so the young generation of Vinh Lap can proudly say: "I was born in Vinh Lap."' },
    chapter3_card1_title: { vi: "Chất Lượng", ja: "品質", en: "Quality" },
    chapter3_card1_content: { vi: "Quy trình canh tác chuẩn Nhật Bản, giữ trọn hương vị tự nhiên.", ja: "日本基準の栽培管理で、自然の旨味をそのままに。", en: "Japanese standard farming practices to preserve the natural flavor." },
    chapter3_card2_title: { vi: "Cộng Đồng", ja: "コミュニティ", en: "Community" },
    chapter3_card2_content: { vi: "Tạo sinh kế bền vững, để người nông dân không phải ly hương.", ja: "持続可能な生計を作り、農家が故郷を離れずに済むように。", en: "Creating sustainable livelihoods so farmers don't have to leave their homeland." },
    chapter3_button: { vi: "Trải Nghiệm Ngay", ja: "今すぐ体験する", en: "Experience Now" },

    modal_close_hint: { vi: "Nhấn ESC hoặc click vào vùng tối để đóng", ja: "ESCキーまたは暗い部分をクリックして閉じる", en: "Press ESC or click the dark area to close" },
    click_to_enlarge: { vi: "(Nhấn để xem lớn)", ja: "（クリックして拡大）", en: "(Click to enlarge)" }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.story = {};
    Object.entries(translations.story).forEach(([key, val]) => {
      data.story[key] = val[file.lang];
    });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
