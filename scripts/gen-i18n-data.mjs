/**
 * Builds src/i18n/locales/data.en.js from game data (RU stays in src/data/*.js).
 * English text comes from scripts/i18n-en-translations.mjs plus a few rules
 * (knife names: "★ Type | English Skin"; generated factories: pattern names).
 *
 * Usage: node scripts/gen-i18n-data.mjs
 * Exits non-zero when any generated value still contains Cyrillic.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import * as T from './i18n-en-translations.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'src/i18n/locales/data.en.js');

const CYR = /[А-Яа-яЁё]/;
const missing = [];

function load(rel) {
  return import(pathToFileURL(path.join(root, rel)).href);
}

function need(kind, id, value) {
  if (value == null || value === '' || CYR.test(value)) {
    missing.push(`${kind}:${id}`);
    return null;
  }
  return value;
}

/** RU skin part -> EN. Explicit table first, then English-only, then trailing (English). */
function knifeSkinEn(skin) {
  if (T.KNIFE_SKIN_EN[skin]) return T.KNIFE_SKIN_EN[skin];
  if (!CYR.test(skin)) return skin;
  const m = skin.match(/\(([^)]+)\)\s*$/);
  if (m && !CYR.test(m[1])) return m[1].trim();
  return null;
}

function knifeNameEn(ruName) {
  const i = ruName.indexOf(' | ');
  if (i < 0) return CYR.test(ruName) ? null : ruName;
  const type = ruName.slice(0, i).trim();
  const skin = knifeSkinEn(ruName.slice(i + 3).trim());
  return skin ? `${type} | ${skin}` : null;
}

function factoryNameEn(f) {
  if (T.FACTORY_NAME_EN[f.id]) return T.FACTORY_NAME_EN[f.id];
  const words = Object.keys(T.FACTORY_WORD_EN).join('|');
  // "Цех Подход 49" -> "Workshop Approach 49"
  let m = f.name.match(new RegExp(`^Цех (${words}) (\\d+)$`));
  if (m) return `Workshop ${T.FACTORY_WORD_EN[m[1]]} ${m[2]}`;
  // "Подход эпохи 41" -> "Approach of Epoch 41"
  m = f.name.match(new RegExp(`^(${words}) эпохи (\\d+)$`));
  if (m) return `${T.FACTORY_WORD_EN[m[1]]} of Epoch ${m[2]}`;
  return null;
}

async function main() {
  const dict = {};
  const put = (key, value) => {
    if (value == null || value === '') return;
    dict[key] = String(value);
  };

  // --- Knives ---
  const { KNIVES } = await load('src/data/knives.data.js');
  for (const k of KNIVES) {
    put(`knife.${k.id}.name`, need('knife.name', k.id, knifeNameEn(k.name)));
    put(`knife.${k.id}.rarity`, need('knife.rarity', k.id, T.RARITY_EN[k.rarityName]));
    if (k.desc) put(`knife.${k.id}.desc`, need('knife.desc', k.id, T.KNIFE_DESC_EN[k.id]));
  }

  // --- Shop / boutique ---
  const { SHOP_ITEMS, BOUTIQUE_REPEATABLES } = await load('src/data/shop.data.js');
  for (const s of [...SHOP_ITEMS, ...BOUTIQUE_REPEATABLES]) {
    const tr = T.SHOP_EN[s.id] || [];
    put(`shop.${s.id}.name`, need('shop.name', s.id, tr[0]));
    put(`shop.${s.id}.desc`, need('shop.desc', s.id, tr[1]));
  }

  // --- Factories ---
  const { FACTORIES } = await load('src/data/factories.data.js');
  for (const f of FACTORIES) {
    put(`factory.${f.id}.name`, need('factory.name', f.id, factoryNameEn(f)));
    put(`factory.${f.id}.tier`, need('factory.tier', f.id, T.FACTORY_TIER_EN[f.tierTitle]));
  }

  // --- Talents ---
  const { TALENTS } = await load('src/data/talents.data.js');
  for (const x of TALENTS) {
    const tr = T.TALENT_EN[x.id] || [];
    put(`talent.${x.id}.name`, need('talent.name', x.id, tr[0]));
    put(`talent.${x.id}.desc`, need('talent.desc', x.id, tr[1]));
    put(`talent.${x.id}.tier`, need('talent.tier', x.id, T.TALENT_TIER_EN[x.tierName]));
  }

  // --- Cases (desc is built from the fixed-drop knife so names stay in sync) ---
  const { WEAPON_CASES } = await load('src/data/cases.data.js');
  const knifeById = new Map(KNIVES.map((k) => [k.id, k]));
  for (const c of WEAPON_CASES) {
    put(`case.${c.id}.name`, need('case.name', c.id, T.CASE_NAME_EN[c.id]));
    let desc = T.CASE_DESC_FIXED_EN[c.id];
    if (!desc) {
      const split = c.desc.split(' С шансом 1% — ');
      const lead = T.CASE_LEAD_EN[split[0]];
      const fixedId = Object.keys(c.fixedChances || {})[0];
      const knife = fixedId && knifeById.get(fixedId);
      const knifeEn = knife && knifeNameEn(knife.name);
      if (lead && knifeEn) desc = `${lead} With a 1% chance: ${knifeEn}.`;
    }
    put(`case.${c.id}.desc`, need('case.desc', c.id, desc));
  }

  // --- Body skins ---
  const { BODY_SKINS } = await load('src/data/skins.data.js');
  for (const s of BODY_SKINS) {
    const tr = T.SKIN_EN[s.id] || [];
    put(`skin.${s.id}.name`, need('skin.name', s.id, tr[0]));
    put(`skin.${s.id}.desc`, need('skin.desc', s.id, tr[1]));
  }

  // --- Transcend ---
  const { TRANSCEND_UPGRADES } = await load('src/data/transcend.data.js');
  for (const x of TRANSCEND_UPGRADES) {
    const tr = T.TRANSCEND_EN[x.id] || [];
    put(`transcend.${x.id}.name`, need('transcend.name', x.id, tr[0]));
    put(`transcend.${x.id}.desc`, need('transcend.desc', x.id, tr[1]));
    put(`transcend.${x.id}.tier`, need('transcend.tier', x.id, T.TRANSCEND_TIER_EN[x.tierName]));
  }

  // --- Guild bosses ---
  const { GUILD_BOSSES } = await load('src/data/bosses.data.js');
  for (const b of GUILD_BOSSES) {
    put(`boss.${b.id}.name`, need('boss.name', b.id, T.BOSS_EN[b.id]));
    if (b.theme) put(`boss.${b.id}.theme`, need('boss.theme', b.id, T.BOSS_THEME_EN[b.theme]));
    if (b.desc) missing.push(`boss.desc:${b.id}`);
  }

  // --- Epochs (0-based index into EPOCH_NAMES) ---
  const { EPOCH_NAMES } = await load('src/data/evolutions.data.js');
  EPOCH_NAMES.forEach((_, i) => put(`epoch.${i}.name`, need('epoch', i, T.EPOCH_EN[i])));
  if (T.EPOCH_EN.length !== EPOCH_NAMES.length) missing.push('epoch:length');

  // --- News ---
  const { NEWS } = await load('src/data/news.data.js');
  NEWS.forEach((n, i) => {
    const tr = T.NEWS_EN[n.id] || [];
    put(`news.${i}.title`, need('news.title', n.id, tr[0]));
    put(`news.${i}.body`, need('news.body', n.id, tr[1]));
    if (n.tag) put(`news.${i}.tag`, need('news.tag', n.id, T.NEWS_TAG_EN[n.tag]));
    if (n.date) {
      const en = n.date.replace(/Октября/, T.NEWS_MONTH_EN['Октября']);
      put(`news.${i}.date`, need('news.date', n.id, en));
    }
  });

  const keys = Object.keys(dict).sort();
  const body = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(dict[k])}`).join(',\n');
  const file =
    '/** Auto-generated EN data strings. RU lives in src/data/*. Regenerated by scripts/gen-i18n-data.mjs */\n' +
    `export default {\n${body}\n};\n`;
  fs.writeFileSync(outFile, file, 'utf8');

  const cyrLeft = keys.filter((k) => CYR.test(dict[k])).length;
  console.log(`Wrote ${keys.length} keys (${KNIVES.length} knives) -> ${path.relative(root, outFile)}; cyrillicLeft=${cyrLeft}`);
  if (missing.length) {
    console.error(`Missing/untranslated (${missing.length}):\n${missing.slice(0, 50).join('\n')}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
