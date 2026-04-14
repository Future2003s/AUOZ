const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = [
  { name: 'vi.json', lang: 'vi' },
  { name: 'ja.json', lang: 'ja' },
  { name: 'en.json', lang: 'en' }
];

const newTranslations = {
  maps: {
    subtitle: {
      vi: "Vị Trí",
      ja: "場所",
      en: "Location"
    },
    title: {
      vi: "Ghé thăm Công Ty Chúng Tôi",
      ja: "弊社へのアクセス",
      en: "Visit Our Company"
    },
    description: {
      vi: "LALA-LYCHEEE nằm ngay tại trung tâm vùng đất vải thiều trứ danh. Hãy đến để cảm nhận hương vị tươi ngon tận vườn.",
      ja: "LALA-LYCHEEEは有名なライチ産地の中心に位置しています。農園直送の新鮮な味わいをぜひご体感ください。",
      en: "LALA-LYCHEEE is located right in the heart of the famous lychee region. Come to experience the fresh flavor straight from the garden."
    },
    old_address: {
      vi: "Vĩnh Lập – Thanh Hà – Hải Dương (địa chỉ hành chính cũ)",
      ja: "ハイズオン省タインハー県ヴィンラップ（旧行政区画）",
      en: "Vinh Lap – Thanh Ha – Hai Duong (old administrative address)"
    },
    new_address_main: {
      vi: "Thôn Tú - Xã Hà Đông - Thành Phố Hải Phòng",
      ja: "ハイフォン市ハドン地区トゥ村",
      en: "Tu Village - Ha Dong Commune - Hai Phong City"
    },
    new_address_note: {
      vi: "(địa chỉ hành chính mới)",
      ja: "（新行政区画）",
      en: "(new administrative address)"
    },
    directions: {
      vi: "Chỉ đường Google Maps",
      ja: "Googleマップで経路を見る",
      en: "Google Maps Directions"
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file.name);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.maps = {
      subtitle: newTranslations.maps.subtitle[file.lang],
      title: newTranslations.maps.title[file.lang],
      description: newTranslations.maps.description[file.lang],
      old_address: newTranslations.maps.old_address[file.lang],
      new_address_main: newTranslations.maps.new_address_main[file.lang],
      new_address_note: newTranslations.maps.new_address_note[file.lang],
      directions: newTranslations.maps.directions[file.lang]
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file.lang}`);
  }
});
