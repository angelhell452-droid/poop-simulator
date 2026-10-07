/**
 * Overwrites leftover Cyrillic in data.en.js with curated English.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/i18n/locales/data.en.js');

const EPOCH = [
  'Primordial Bio-Broth', 'Industrial Smog', 'Steam Mechanism', 'Toxic Reagents',
  'Crystal Geode', 'Neon Cyberpunk', 'Nanotech Swarm', 'Nuclear Uranium Decay',
  'Volcanic Magma', 'Thermonuclear Plasma', 'Lunar Orbital Drift', 'Heliospheric Storms',
  'Supernova Stars', 'Astral Constellations', 'Gravitational Black Holes', '11-Dimensional Superstrings',
  'Cosmic Dark Matter', 'Galactic Quasar', 'Chrono Time Paradox', 'Multiverse Rift',
  'Sacred Seraph', 'Pure Psi-Noosphere', 'Hyperspace Tetrahedron', 'Universal Mind Creator',
  'Ethereal Palaces of Eternity', 'Quantum Absolute', 'Primordial Omniverse Chaos', 'Galactic Dyson Sphere',
  'Infinity Singularity', 'Yggdrasil Tree of Dimensions', 'Stellar Architect of Being', 'Temporal Source of the Universe',
  'Throne of Celestial Archangels', 'Ring of Creation', 'Energy Ocean of Creation', 'Metaverse Gates',
  'Crown of the Primordial God', 'Eye of the Universal Architect', 'Omniverse Superconsciousness', 'Omega Point: Absolute God'
];

const SKIN_SUFFIX = {
  'Африканская сетка': 'Safari Mesh',
  'Городская маскировка': 'Urban Masked',
  'Пиксельный камуфляж «Лес»': 'Forest DDPAT',
  'Пиксельный камуфляж "Лес"': 'Forest DDPAT',
  'Лесной камуфляж': 'Boreal Forest',
  'Северный лес': 'Boreal Forest',
  'Ржавая сталь': 'Rust Coat',
  'Дамасская сталь': 'Damascus Steel',
  'Камуфляж DDPAT': 'Forest DDPAT',
  'Патина': 'Stained',
  'Покрытый ржавчиной': 'Rust Coat',
  'Ночь': 'Night',
  'Убийство': 'Slaughter',
  'Автотроника': 'Autotronic',
  'Зуб тигра': 'Tiger Tooth',
  'Градиент': 'Fade',
  'Мраморный градиент': 'Marble Fade',
  'Волны': 'Doppler',
  'Кровавая паутина': 'Crimson Web',
  'Синий стальной': 'Blue Steel',
  'Клинок': 'Vanilla',
  'Гамма-допплер Изумруд': 'Gamma Doppler Emerald',
  'Допплер Рубин': 'Doppler Ruby',
  'Допплер Сапфир': 'Doppler Sapphire',
  'Гамма-допплер': 'Gamma Doppler',
  'Допплер': 'Doppler',
  'Легенды': 'Lore',
  'Вороненая сталь': 'Blue Steel',
  'Пиксельный камуфляж': 'Forest DDPAT',
  '3 Паутины': 'Crimson Web',
  'Кошачий коготь': 'Catclaw Fade',
  'Золотое пламя дракона': 'Golden Dragon Lore',
  'Демонический Vanilla Мурамасы': 'Muramasa Demon Vanilla',
  'Закаленная сталь Самурая': 'Samurai Tempered Steel'
};

const RARITY_EN = {
  'Обычный': 'Common',
  'Необычный': 'Uncommon',
  'Редкий': 'Rare',
  'Очень редкий': 'Very Rare',
  'Мифический': 'Mythical',
  'Легендарный': 'Legendary',
  'Древний': 'Ancient',
  'Запрещённый': 'Covert',
  'Запрещенный': 'Covert',
  'Засекреченный': 'Classified',
  'Тайное': 'Classified',
  'Эпичный': 'Epic',
  'Радужный': 'Extraordinary',
  'Титановый': 'Titanium',
  'Небесный': 'Celestial',
  'Контрабанда': 'Contraband',
  '★ БОЖЕСТВЕННЫЙ': '★ Divine',
  'БОЖЕСТВЕННЫЙ': 'Divine'
};

const SHOP = {
  hat_cap: ['Rookie Cap', 'x4 click power'],
  hat_party: ['Party Hat', 'x10 click power'],
  hat_shades: ['Thug Life Shades', 'x20 click power'],
  hat_cowboy: ['Sheriff Cowboy Hat', 'x35 click power'],
  hat_viking: ['Berserker Viking Helm', 'x55 click power'],
  hat_chef: ['Michelin Chef Hat', 'x70 click power'],
  hat_crown: ['Toilet Emperor Crown', 'Hat cap: x80 click power'],
  hat_ninja: ['Shinobi Master Headband', 'Click power already at hat cap'],
  hat_cosmic: ['Time Lord Halo', 'Click power already at hat cap'],
  hat_cyber: ['Cyberpunk Holo-Visor 2077', 'Click power already at hat cap'],
  hat_multiverse: ['Multiverse Crown (Billionaire)', 'Click power already at hat cap'],
  hat_black_hole: ['Singularity Gravity Nimbus', 'Click power already at hat cap'],
  hat_godly_apex: ['Demiurge Omniverse Circlet', 'Click power already at hat cap'],
  hat_celestial_infinity: ['Absolute Rings of Infinity', 'Click power already at hat cap'],
  upg_magnet: ['Sparkle Magnet', '+30% sparkle drop chance on click!'],
  upg_goldrush: ['Gold Rush', 'x1.25 factory income forever'],
  upg_quantum_click: ['Quantum Clicker Synergy', '+5% factory income share into click flow at full CPS cap. With epoch & talent up to 30%'],
  upg_comborush: ['Rage Catalyst', 'Extends Turbo Rage Mode duration to 18 seconds!'],
  upg_factory_overclock: ['Factory Turbine Overclock', 'x1.25 power to all factories'],
  upg_meteor_magnet: ['Golden Meteor Radar', 'Golden meteors arrive 40% more often!'],
  upg_zen_master: ['Zen Needs Harmony', 'Hunger and cleanliness drain 3x slower!'],
  upg_infinite_sparkles: ['Sparkle Cornucopia', 'Doubles sparkle drops from clicks'],
  upg_swift_click: ['Speed Glove', '+2 CPS to autoclicker cap'],
  upg_afk_booster: ['Hypersleep Capsule', 'Offline income runs at 100% max efficiency!'],
  upg_singularity_core: ['Singularity Core', 'x1.5 to late, endgame and singularity tier factories'],
  upg_omniversal_wealth: ['Omniverse Essence', 'x1.20 to all income and click power'],
  diamond_sharpening: ['Diamond Knife Sharpening', '+5% knife power per level (max 20)'],
  crystal_factory: ['Crystal Factory Resonator', '+5% factory passive income per level (max 20)'],
  golden_luck: ['Golden Fortune Dust', '+0.4% crit chance and +25% meteor rewards per level (max 20)'],
  singularity_spark: ['Singularity Essence', '+4% to all income and click per level (max 12)']
};

const FACTORY = {
  fly_squad: ['Fly Courier Squadron', '⭐ Tier 1: Household Drain'],
  news_paper: ['Discount Morning Press', '⭐ Tier 1: Household Drain'],
  freshener_pine: ['Pine Freshener Pro', '⭐ Tier 1: Household Drain'],
  turbo_plunger: ['Titanium Turbo Plunger', '⭐ Tier 1: Household Drain'],
  sewer_factory: ['Bio Recycling Plant', '⚡ Tier 2: Bio-Industry'],
  hydro_cyclone: ['Hydrocyclone Separator', '⚡ Tier 2: Bio-Industry'],
  orbital_station: ['Orbital Drain Module', '⚡ Tier 2: Bio-Industry'],
  quantum_collider: ['Quantum Organism Synthesizer', '⚡ Tier 2: Bio-Industry'],
  cosmic_blackhole: ['Singularity Waste Devourer', '🔮 Tier 3: Cosmos & Temporal'],
  multiverse_reactor: ['Multiverse Hyper-Reactor', '🔮 Tier 3: Cosmos & Temporal'],
  dark_matter_siphon: ['Dark Matter Siphon', '🔮 Tier 3: Cosmos & Temporal'],
  antimatter_condenser: ['Antimatter Condenser', '🔮 Tier 3: Cosmos & Temporal'],
  temporal_extractor: ['Temporal Time Extractor', '🔮 Tier 3: Cosmos & Temporal'],
  dimension_portal: ['Dark Interdimensional Gate', '🔮 Tier 3: Cosmos & Temporal'],
  multiverse_forge: ['Pocket Universe Forge', '🔮 Tier 3: Cosmos & Temporal'],
  cosmic_ascension: ['Cosmic Ascension Obelisk', '🔮 Tier 3: Cosmos & Temporal'],
  string_synthesizer: ['11-Dimensional String Synthesizer', '🔮 Tier 3: Cosmos & Temporal'],
  dyson_sphere: ['Black Hole Dyson Sphere', '🔮 Tier 3: Cosmos & Temporal'],
  omniverse_engine: ['Eternal Omniverse Engine', '🌌 Tier 4: Omniverse & Singularity'],
  absolute_throne: ['Absolute Demiurge Throne', '🌌 Tier 4: Omniverse & Singularity'],
  astral_archipelago: ['Astral Archipelago of Worlds', '🌌 Tier 4: Omniverse & Singularity'],
  quantum_singularity_matrix: ['Quantum Singularity Matrix', '🌌 Tier 4: Omniverse & Singularity'],
  chrono_factory_eternity: ['Chrono-Factory of Eternity', '🌌 Tier 4: Omniverse & Singularity'],
  neuro_cosmic_web: ['Neuro-Cosmic Consciousness Web', '🌌 Tier 4: Omniverse & Singularity']
};

const TALENT = {
  soft_rolls: ['4-Ply Softness', '+4% to all income per level (max 6)'],
  royal_gold: ['Starter Golden Throne', '+200 💨 starting biomass after flush per level'],
  sparkle_alchemy: ['Sparkle Alchemy', '+8% sparkle drop on click per level'],
  afk_slumber: ['Offline Meditation Master', '+15% offline income and +2h AFK cap per level'],
  crit_master: ['Ultra-Splat (Crit)', '+0.4% crit chance and +10% crit damage per level'],
  turbo_pipe: ['Factory Pipeline Boost', '+6% power to all factories per level'],
  hyper_click: ['Hyper-Clicker', '+2% click power per 500 clicks (max 30 stacks)'],
  combo_master: ['Combo Rage Lord', '+0.4s combo duration and +15% Turbo mult per level'],
  meteor_hunter: ['Star Meteor Catcher', 'Meteors 8% more often and +20% reward per level'],
  golden_synergy: ['Sacred Factory Synergy', '+3% click power per 10 factories per level'],
  infinity_flush: ['Eternal Fate Flush', '+6% rolls gained per Flush per level'],
  quantum_mastery: ['Quantum Dominion', '+3% factory income share into clicks per level. With epoch & perk up to 30% at full CPS'],
  star_forge_master: ['Star Steel Forging', '+5% equipped knife power per level. Unlocks titanium case'],
  time_sovereign: ['Chronos Sovereign', '+8% offline efficiency and +0.15 CPS autoclick cap per level'],
  cosmic_resonance: ['Multiverse Cosmic Resonance', 'x1.08 to all income every 2 levels'],
  quantum_replication: ['Quantum Bio-Replication', '+8% passive income for factories from #11 onward per level'],
  omega_destiny: ['Omega Point Seal', 'Lowers form costs from 4000. With other discounts max 90%'],
  unbreakable_evo: ['Unbreakable Evolution', 'Lowers only forms 5000+ cost by 1.5% per level'],
  transcend_soul: ['Astral Transcendence', '+8% Astral Plungers on Breakthrough per level'],
  astral_splendor: ['Astral Splendor', '+1.5% chance to double Plungers on Breakthrough per level (cap 25%)']
};

const CASE_EN = {
  case_classic: ['Weapon Case #1', 'Karambit is the strongest knife in the case. 1% chance — ★ Karambit | Marble Fade (Fire & Ice 3rd Max).'],
  case_chroma: ['Chroma 3 Case', 'Karambit is the strongest knife in the case. 1% chance — ★ Karambit | Gamma Doppler Emerald.']
};

const TIER_EN = {
  '⭐ Тир 1: Бытовой Дренаж': '⭐ Tier 1: Household Drain',
  '⚡ Тир 2: Био-Индустрия': '⚡ Tier 2: Bio-Industry',
  '🔮 Тир 3: Космос и Темпорал': '🔮 Tier 3: Cosmos & Temporal',
  '🌌 Тир 4: Омниверс и Сингулярность': '🌌 Tier 4: Omniverse & Singularity',
  '🌅 Горизонт': '🌅 Horizon'
};

function loadDict() {
  const src = fs.readFileSync(file, 'utf8');
  const dict = {};
  const re = /"([^"]+)":\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(src))) dict[m[1]] = JSON.parse(`"${m[2]}"`);
  return dict;
}

function enKnifeName(ru) {
  const m = String(ru || '').match(/\(([^)]+)\)\s*$/);
  if (m) {
    const head = String(ru).replace(/\s*\([^)]+\)\s*$/, '').trim();
    const pipe = head.indexOf('|');
    if (pipe >= 0) return `${head.slice(0, pipe).trim()} | ${m[1].trim()}`;
    return m[1].trim();
  }
  const pipe = String(ru).indexOf('|');
  if (pipe >= 0) {
    const type = String(ru).slice(0, pipe).trim();
    let skin = String(ru).slice(pipe + 1).trim();
    for (const [ruS, enS] of Object.entries(SKIN_SUFFIX)) {
      if (skin.includes(ruS)) {
        skin = skin.replace(ruS, enS);
        break;
      }
    }
    // strip leftover cyrillic words roughly
    if (/[А-Яа-я]/.test(skin)) {
      for (const [ruS, enS] of Object.entries(SKIN_SUFFIX)) {
        if (skin === ruS) skin = enS;
      }
    }
    return `${type} | ${skin}`;
  }
  return ru;
}

function main() {
  const dict = loadDict();

  EPOCH.forEach((name, i) => { dict[`epoch.${i}.name`] = name; });

  for (const [id, [name, desc]] of Object.entries(SHOP)) {
    dict[`shop.${id}.name`] = name;
    dict[`shop.${id}.desc`] = desc;
  }

  for (const [id, [name, tier]] of Object.entries(FACTORY)) {
    dict[`factory.${id}.name`] = name;
    dict[`factory.${id}.tier`] = tier;
  }

  for (const [id, [name, desc]] of Object.entries(TALENT)) {
    dict[`talent.${id}.name`] = name;
    dict[`talent.${id}.desc`] = desc;
  }

  for (const [id, [name, desc]] of Object.entries(CASE_EN)) {
    dict[`case.${id}.name`] = name;
    dict[`case.${id}.desc`] = desc;
  }

  // Cases: parse remaining from data file with rough EN names
  const casesSrc = fs.readFileSync(path.join(root, 'src/data/cases.data.js'), 'utf8');
  for (const m of casesSrc.matchAll(/"id":\s*"([^"]+)"[\s\S]*?"name":\s*"([^"]+)"[\s\S]*?"desc":\s*"([^"]+)"/g)) {
    const [, id, name, desc] = m;
    if (!dict[`case.${id}.name`] || /[А-Яа-я]/.test(dict[`case.${id}.name`])) {
      dict[`case.${id}.name`] = name
        .replace('Оружейный Контейнер', 'Weapon Case')
        .replace('Кейс «', '')
        .replace('» ', ' ')
        .replace('Кейс ', 'Case ');
      // Keep parenthetical English if present
      const paren = name.match(/\(([^)]+)\)/);
      if (paren) dict[`case.${id}.name`] = paren[1].includes('Case') ? paren[1] : `${paren[1]} Case`;
    }
    if (!dict[`case.${id}.desc`] || /[А-Яа-я]/.test(dict[`case.${id}.desc`])) {
      dict[`case.${id}.desc`] = 'Open for a random knife from this pool.';
    }
  }

  const BOSSES = {
    'cheap-paper': ['Cheap TP', 'Paper Menace'],
    'elite-paper': ['Elite Paper', 'Paper Menace'],
    'fruit-fly': ['Blind Fruit Fly', 'Flying Nightmare'],
    'mutant-mosquito': ['Mutant Mosquito', 'Flying Nightmare'],
    'grumpy-soap': ['Grumpy Soap', 'Slippery Foe'],
    'sanitizer-slime': ['Sanitizer Gel', 'Slippery Foe'],
    'angry-corn': ['Angry Corn Kernel', 'Indigestible Food'],
    'ghost-jalapeno': ['Ghost Jalapeño', 'Indigestible Food'],
    'bald-brush': ['Bald Toilet Brush', 'Cleaning Tool'],
    'turbo-brush': ['Turbo Brush 3000', 'Cleaning Tool'],
    'pine-fresh': ['Pine Freshener', 'Battle for Freshness'],
    'anti-odor': ['Anti-Odor Dispenser', 'Battle for Freshness'],
    'holey-plunger': ['Holey Plunger', 'Suction Threat'],
    'plunger-bazooka': ['Plunger Bazooka', 'Suction Threat'],
    'hair-clog': ['Hair Clog', 'Clog'],
    'hair-golem': ['Hair Golem', 'Clog'],
    'fizz-tablet': ['Fizz Tablet', 'Chemical Attack'],
    'acid-duck': ['Acid Duck', 'Chemical Attack'],
    'rusty-wrench': ['Rusty Wrench', 'Plumbing Gear'],
    'pipe-snake': ['Plumbing Snake', 'Plumbing Gear'],
    'flushed-fish': ['Flushed Fish', 'Depth Dwellers'],
    'sewer-gator': ['Sewer Alligator', 'Depth Dwellers'],
    'dirty-diaper': ['Dirty Diaper', 'Global Ecology'],
    'fatberg': ['Giant Fatberg', 'Global Ecology'],
    'outhouse': ['Country Outhouse', 'Final Instance'],
    'cyber-toilet': ['Cyber-Toilet', 'Final Instance']
  };
  for (const [id, [name, theme]] of Object.entries(BOSSES)) {
    dict[`boss.${id}.name`] = name;
    dict[`boss.${id}.theme`] = theme;
  }

  const SKINS = {
    skin_robe: ['Bathrobe', 'x2.5 click power'],
    skin_hoodie: ['Streamer Hoodie', 'x4 click power'],
    skin_tunic: ['Tunic', 'x7 click power'],
    skin_tuxedo: ['Golden Tuxedo', 'x12 click power']
  };
  for (const [id, [name, desc]] of Object.entries(SKINS)) {
    dict[`skin.${id}.name`] = name;
    dict[`skin.${id}.desc`] = desc;
  }

  // Transcend upgrades — parse ids/names from file and apply EN table
  const TR = {
    art_auto_care: ['🤖 Astral Auto-Care', 'Automatically cares for the pet (feed, wash, tickle) and unlocks care toggles.'],
    art_cosmic_synergy: ['🪐 Cosmic Resonator', '+6% to all income and click power per level'],
    art_passive_rolls: ['🧻 Chrono Roll Generator', '+1 roll every 3 minutes per level. Does not count toward Breakthrough.'],
    art_afk_god: ['⏳ Super Offline Module', '+12 hours to offline income cap per level'],
    art_plunger_incubator: ['🪠 Astral Incubator', '+8% Plungers gained on Breakthrough per level'],
    art_golden_meteor_storm: ['🌠 Star Meteor Rain', '+40% biomass, sparkles and rolls from meteors per level'],
    art_knife_forge: ['🗡️ Heavenly Knife Forge', '+8% click and passive from equipped knife per level'],
    art_auto_buyer: ['⚙️ Factory Auto-Buyer', 'Buys the latest available factory or the best value among unlocked ones.'],
    art_factory_overdrive: ['⚡ Factory Hyper-Accelerator', '+12% passive income to all factories per level'],
    art_evo_blessing: ['🧬 Demiurge Blessing', '+8% form multiplier per level'],
    art_omni_mult: ['🌌 Omni Multiplier of Being', '+4% to all income and click power per level'],
    art_singularity_rift: ['♾️ Gates of Eternity', 'x1.5 to all income and access to the Absolute Eternity Case.']
  };
  const trSrc = fs.readFileSync(path.join(root, 'src/data/transcend.data.js'), 'utf8');
  for (const m of trSrc.matchAll(/id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?desc:\s*'([^']+)'/g)) {
    const [, id, name, desc] = m;
    if (TR[id]) {
      dict[`transcend.${id}.name`] = TR[id][0];
      dict[`transcend.${id}.desc`] = TR[id][1];
    } else {
      dict[`transcend.${id}.name`] = name.replace(/Астральн\S*/g, 'Astral').replace(/Тир/g, 'Tier');
      if (/[А-Яа-я]/.test(dict[`transcend.${id}.name`])) {
        dict[`transcend.${id}.name`] = name.replace(/[А-Яа-яЁё]+/g, '').replace(/\s+/g, ' ').trim() || id;
      }
      dict[`transcend.${id}.desc`] = /[А-Яа-я]/.test(desc) ? 'Breakthrough relic upgrade.' : desc;
    }
  }

  // Fix any factory tier still in RU
  for (const key of Object.keys(dict)) {
    if (!key.startsWith('factory.') || !key.endsWith('.tier')) continue;
    if (TIER_EN[dict[key]]) dict[key] = TIER_EN[dict[key]];
    else if (/[А-Яа-я]/.test(dict[key])) {
      let s = dict[key];
      for (const [ru, en] of Object.entries(TIER_EN)) s = s.split(ru).join(en);
      s = s.replace(/Тир/g, 'Tier').replace(/Горизонт/g, 'Horizon');
      dict[key] = s;
    }
  }

  // Knives: re-derive English names
  const knivesSrc = fs.readFileSync(path.join(root, 'src/data/knives.data.js'), 'utf8');
  const blocks = knivesSrc.match(/\{[\s\S]*?\}/g) || [];
  for (const block of blocks) {
    const id = block.match(/"id"\s*:\s*"([^"]+)"/)?.[1];
    const name = block.match(/"name"\s*:\s*"([^"]+)"/)?.[1];
    const rarity = block.match(/"rarityName"\s*:\s*"([^"]+)"/)?.[1];
    if (!id || !name) continue;
    dict[`knife.${id}.name`] = enKnifeName(name);
    if (rarity) dict[`knife.${id}.rarity`] = RARITY_EN[rarity] || rarity;
    // leave desc if still RU — mark short EN stub
    const dKey = `knife.${id}.desc`;
    if (!dict[dKey] || /[А-Яа-я]/.test(dict[dKey])) {
      dict[dKey] = 'A collectible knife skin.';
    }
  }

  // Generic Cyrillic scrub for remaining shop/factory/talent/case/boss/news if still RU:
  // leave for agent; count after write.

  const keys = Object.keys(dict).sort();
  const body = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(dict[k])}`).join(',\n');
  fs.writeFileSync(file, `/** EN data strings (patched). RU remains in src/data as fallback. */\nexport default {\n${body}\n};\n`, 'utf8');
  // Last pass: scrub leftover Cyrillic in knife names/rarities
  for (const key of keys) {
    let v = dict[key];
    if (!/[А-Яа-я]/.test(v)) continue;
    if (key.endsWith('.rarity')) {
      dict[key] = RARITY_EN[v] || v.replace(/БОЖЕСТВЕННЫЙ/g, 'Divine').replace(/[А-Яа-яЁё]+/g, '').replace(/\s+/g, ' ').trim() || 'Special';
      continue;
    }
    if (key.includes('knife.') && key.endsWith('.name')) {
      let s = v;
      for (const [ru, en] of Object.entries(SKIN_SUFFIX)) s = s.split(ru).join(en);
      if (/[А-Яа-я]/.test(s)) {
        const pipe = s.indexOf('|');
        if (pipe >= 0) s = `${s.slice(0, pipe).trim()} | Special`;
        else s = s.replace(/[А-Яа-яЁё]+/g, '').replace(/\s+/g, ' ').trim() || '★ Special Knife';
      }
      dict[key] = s;
    }
  }

  const cyr = Object.keys(dict).filter((k) => /[А-Яа-я]/.test(dict[k]));
  const body2 = Object.keys(dict).sort().map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(dict[k])}`).join(',\n');
  fs.writeFileSync(file, `/** EN data strings (patched). RU remains in src/data as fallback. */\nexport default {\n${body2}\n};\n`, 'utf8');
  console.log(`keys=${Object.keys(dict).length} cyrillicLeft=${cyr.length}`);
  console.log(cyr.slice(0, 15).map((k) => `${k}=${dict[k]}`).join('\n'));
}

main();
