import fs from 'fs';

function ensureImport(src, importLine) {
  if (src.includes(importLine)) return src;
  const marker = "import { GAME }";
  const i = src.indexOf(marker);
  if (i < 0) return `${importLine}\n${src}`;
  return src.slice(0, i) + importLine + '\n' + src.slice(i);
}

// character inventory
{
  const path = new URL('../src/ui/characterInventoryView.js', import.meta.url);
  let s = fs.readFileSync(path, 'utf8');
  s = ensureImport(s, "import { knifeName, knifeDesc, knifeRarity, shopName, shopDesc, skinName } from '../i18n/localize.js';");
  const reps = [
    [/worn \? worn\.name/g, 'worn ? skinName(worn)'],
    [/\$\{skin\.name\}/g, '${skinName(skin)}'],
    [/skin\.name\}/g, 'skinName(skin)}'],
    [/res\.knife\.name/g, 'knifeName(res.knife)'],
    [/equippedHat\.name/g, 'shopName(equippedHat)'],
    [/equippedObj\.name/g, 'knifeName(equippedObj)'],
    [/equippedObj\.rarityName/g, 'knifeRarity(equippedObj)'],
    [/kn\.name/g, 'knifeName(kn)'],
    [/kn\.rarityName/g, 'knifeRarity(kn)'],
    [/kn\.desc/g, 'knifeDesc(kn)'],
    [/hat\.name/g, 'shopName(hat)'],
    [/hat\.desc/g, 'shopDesc(hat)'],
    [/hatObj \? hatObj\.name/g, 'hatObj ? shopName(hatObj)']
  ];
  for (const [a, b] of reps) s = s.replace(a, b);
  fs.writeFileSync(path, s);
  console.log('inventory ok');
}

// guild bosses
{
  const path = new URL('../src/ui/guildView.js', import.meta.url);
  let s = fs.readFileSync(path, 'utf8');
  if (!s.includes("bossName")) {
    s = s.replace(
      "import { t, onLocaleChange } from '../i18n/t.js';",
      "import { t, onLocaleChange } from '../i18n/t.js';\nimport { bossName, knifeName as localizedKnifeName } from '../i18n/localize.js';"
    );
  }
  // display names for boss rows
  s = s.replace(/\$\{esc\(row\.name\)\}/g, '${esc(bossName(row) || row.name)}');
  s = s.replace(/\$\{esc\(guild\.boss\.name\)\}/g, '${esc(bossName(guild.boss) || guild.boss.name)}');
  s = s.replace(/setText\('bossTitle', `\$\{boss\.name\}/g, "setText('bossTitle', `${bossName(boss) || boss.name}");
  fs.writeFileSync(path, s);
  console.log('guild ok');
}
