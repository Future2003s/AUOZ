const fs = require('fs');
const langs = {
  vi: 'Hành trình từ trái vải tươi ngon đến sản phẩm tinh hoa trên tay bạn.',
  ja: '新鮮なライチから、あなたのお手元に届く最高品質の製品へ。',
  en: 'The journey from fresh lychee to a premium product in your hands.'
};
['vi', 'ja', 'en'].forEach(lang => {
  const p = `./src/i18n/locales/${lang}.json`;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  d.site.craft_subheading = langs[lang];
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
  console.log('Updated', lang);
});
