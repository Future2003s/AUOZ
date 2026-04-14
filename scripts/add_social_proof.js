const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  social_proof: {
    title: {
      vi: "Sự Tin Tưởng Từ Cộng Đồng",
      ja: "コミュニティからの信頼",
      en: "Trusted by the Community"
    },
    description: {
      vi: "Niềm vui của khách hàng và sự đồng hành của các thương hiệu uy tín là minh chứng cho chất lượng của chúng tôi.",
      ja: "お客様の喜びと信頼できるブランドとのパートナーシップが、私たちの品質の証です。",
      en: "The joy of our customers and the companionship of reputable brands are testing to our quality."
    },
    testimonials_title: {
      vi: "Khách Hàng Phản Hồi ?",
      ja: "お客様の声",
      en: "Customer Feedback"
    },
    partners_title: {
      vi: "Đối Tác Đồng Hành",
      ja: "パートナー",
      en: "Our Partners"
    },
    testimonials: {
      t1: {
        quote: {
          vi: "Sản phẩm của LALA-LYCHEE thực sự khác biệt. Vị ngọt thanh và hương thơm tự nhiên khiến tôi rất ấn tượng. Bao bì cũng rất sang trọng!",
          ja: "LALA-LYCHEEEの製品は本当に特別です。自然な甘さと香りにとても感銘を受けました。パッケージも非常に豪華です！",
          en: "LALA-LYCHEE's products are truly different. The pure sweetness and natural fragrance impressed me. The packaging is also very luxurious!"
        },
        author: { vi: "Ngọc Anh", ja: "ゴック・アイン", en: "Ngoc Anh" },
        role: { vi: "Chuyên gia ẩm thực", ja: "料理の専門家", en: "Culinary Expert" }
      },
      t2: {
        quote: {
          vi: "Tôi đã dùng mật ong hoa vải của LALA-LYCHEE để tiếp đãi đối tác và họ rất thích. Một sản phẩm chất lượng, thể hiện được sự tinh tế của người tặng.",
          ja: "LALA-LYCHEEEのライチ蜂蜜をパートナーに提供したところ、とても喜ばれました。贈り物としての洗練さを示す高品質な製品です。",
          en: "I used LALA-LYCHEE's lychee honey to entertain partners and they loved it. A quality product that shows the sophistication of the giver."
        },
        author: { vi: "Minh Tuấn", ja: "ミン・トゥアン", en: "Minh Tuan" },
        role: { vi: "Giám đốc Doanh nghiệp", ja: "企業の取締役", en: "Business Director" }
      },
      t3: {
        quote: {
          vi: "Chưa bao giờ tôi nghĩ một sản phẩm từ quả vải lại có thể tinh tế đến vậy. Chắc chắn sẽ ủng hộ LALA-LYCHEE dài dài.",
          ja: "ライチから作られた製品がこれほど洗練されるとは思いませんでした。間違いなく、これからもLALA-LYCHEEEを支持します。",
          en: "I never thought a product made from lychee could be so delicate. I will definitely support LALA-LYCHEE for a long time."
        },
        author: { vi: "Phương Linh", ja: "フォン・リン", en: "Phuong Linh" },
        role: { vi: "Blogger Du lịch", ja: "トラベルブロガー", en: "Travel Blogger" }
      }
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.social_proof = {
      title: newTranslations.social_proof.title[file.lang],
      description: newTranslations.social_proof.description[file.lang],
      testimonials_title: newTranslations.social_proof.testimonials_title[file.lang],
      partners_title: newTranslations.social_proof.partners_title[file.lang],
      testimonials: {}
    };

    Object.keys(newTranslations.social_proof.testimonials).forEach(key => {
      data.social_proof.testimonials[key] = {
        quote: newTranslations.social_proof.testimonials[key].quote[file.lang],
        author: newTranslations.social_proof.testimonials[key].author[file.lang],
        role: newTranslations.social_proof.testimonials[key].role[file.lang]
      };
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
