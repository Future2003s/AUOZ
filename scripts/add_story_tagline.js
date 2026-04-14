const fs = require('fs');
const langs = {
  vi: 'Hương Vị Đất Vải',
  ja: 'ライチの大地の風味',
  en: 'Flavor of the Lychee Land'
};
['vi', 'ja', 'en'].forEach(l => {
  const p = `./src/i18n/locales/${l}.json`;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  d.story.hero_tagline = langs[l];
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
  console.log('Updated', l);
});
