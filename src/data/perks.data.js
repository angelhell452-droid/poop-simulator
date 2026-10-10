import { GAME } from '../core/state.js?v=5.0.80';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { SHOP_ITEMS } from './shop.data.js?v=5.0.80';
import { getRelicLevel } from './relics.data.js?v=5.0.80';

/**
 * 20 Уникальных Постоянных Перков (Permanent Perks) за Блестяшки ✨
 * Жестко распределены по уровням Прорыва (GAME.breakthroughCount).
 */
export const PERMANENT_PERKS = [
  // --- 🔓 Доступны со старта / 0 Прорыв ---
  {
    id: 'perk_speed_glove',
    legacyId: 'upg_swift_click',
    name: 'Speed Glove',
    nameRu: 'Перчатка Скорости',
    icon: '🧤',
    reqBreakthrough: 0,
    cost: 1000,
    desc: 'Пассивный буст +10 CPS к лимиту автокликера аккаунта.',
    descEn: '+10 CPS passive boost to account autoclicker cap.'
  },
  {
    id: 'perk_zen_harmony',
    legacyId: 'upg_zen_master',
    name: 'Zen Needs Harmony',
    nameRu: 'Дзен-Гармония Потребностей',
    icon: '🧘',
    reqBreakthrough: 0,
    cost: 2500,
    desc: 'Расход шкал ухода питомца замедляется ровно в 3 раза.',
    descEn: 'Pet care need decay is slowed down by 3x.'
  },
  {
    id: 'perk_factory_overclock',
    legacyId: 'upg_factory_overclock',
    name: 'Factory Turbine Overclock',
    nameRu: 'Оверклокинг Фабричных Турбин',
    icon: '🏭',
    reqBreakthrough: 0,
    cost: 5000,
    desc: 'Глобальный множитель x1.25 к силе всех Авто-заводских тиров на big.js.',
    descEn: 'Global x1.25 multiplier to all auto-factory tiers on big.js.'
  },

  // --- 🔒 Требуют минимум 1-й Прорыв ---
  {
    id: 'perk_sparkle_magnet',
    legacyId: 'upg_magnet',
    name: 'Sparkle Magnet',
    nameRu: 'Магнит Блестяшек',
    icon: '🧲',
    reqBreakthrough: 1,
    cost: 15000,
    desc: 'Каждый успешный клик по Метеору на 15 секунд дает встроенному автокликеру аккаунта +5% к шансу Критического удара (Резонанс).',
    descEn: 'Each successful Meteor click gives +5% Crit Chance to account autoclicker for 15s (Resonance).'
  },
  {
    id: 'perk_stasis_chronometer',
    legacyId: null,
    name: 'Stasis Chronometer',
    nameRu: 'Хронометр Стазиса',
    icon: '⏱️',
    reqBreakthrough: 1,
    cost: 25000,
    desc: 'Навсегда расширяет максимальный лимит времени AFK-фарма с 4 до 12 часов.',
    descEn: 'Permanently increases maximum AFK farm time limit from 4 to 12 hours.'
  },

  // --- 🔒 Требуют минимум 2-й Прорыв ---
  {
    id: 'perk_hypersleep_capsule',
    legacyId: 'upg_afk_booster',
    name: 'Hypersleep Capsule',
    nameRu: 'Капсула Гиперсна',
    icon: '💤',
    reqBreakthrough: 2,
    cost: 50000,
    desc: 'Навсегда увеличивает базовую эффективность оффлайн-дохода (AFK) с 25% до 75%.',
    descEn: 'Permanently increases base offline income efficiency (AFK) from 25% to 75%.'
  },
  {
    id: 'perk_gold_rush',
    legacyId: 'upg_goldrush',
    name: 'Gold Rush',
    nameRu: 'Золотая Лихорадка',
    icon: '💰',
    reqBreakthrough: 2,
    cost: 75000,
    desc: 'Глобальный множитель x1.25 ко всему пассивному доходу на big.js.',
    descEn: 'Global x1.25 multiplier to all passive income on big.js.'
  },
  {
    id: 'perk_sparkle_cornucopia',
    legacyId: 'upg_infinite_sparkles',
    name: 'Sparkle Cornucopia',
    nameRu: 'Рог Изобилия Блестяшек',
    icon: '✨',
    reqBreakthrough: 2,
    cost: 100000,
    desc: 'Навсегда дает +15% шанс на "дабл-дроп" Блестяшек при выпадении Крита.',
    descEn: 'Permanently grants +15% chance for double Sparkles drop on Critical hit.'
  },

  // --- 🔒 Требуют минимум 5-й Прорыв ---
  {
    id: 'perk_rage_catalyst',
    legacyId: 'upg_comborush',
    name: 'Rage Catalyst',
    nameRu: 'Катализатор Ярости',
    icon: '🔥',
    reqBreakthrough: 5,
    cost: 200000,
    desc: 'Повышает встроенный множитель существующего Турбо-режима с х4 до х10, увеличивая пиковый разгон до 18 секунд.',
    descEn: 'Increases Turbo mode multiplier from x4 to x10, extending peak duration to 18 seconds.'
  },
  {
    id: 'perk_meteor_catcher',
    legacyId: 'upg_meteor_magnet',
    name: 'Star Meteor Catcher',
    nameRu: 'Ловец Звездных Метеоритов',
    icon: '🌠',
    reqBreakthrough: 5,
    cost: 350000,
    desc: 'Увеличивает частоту спавна метеоритов на 15% и дает +25% к награде с них.',
    descEn: 'Increases meteor spawn frequency by 15% and grants +25% to rewards from them.'
  },
  {
    id: 'perk_meteor_echo',
    legacyId: null,
    name: 'Meteor Echo',
    nameRu: 'Метеоритное Эхо',
    icon: '☄️',
    reqBreakthrough: 5,
    cost: 500000,
    desc: 'Каждый клик по Метеориту руками с шансом 15% мгновенно вызывает "эхо" — моментальный спавн второго Метеорита следом.',
    descEn: 'Each manual Meteor click has a 15% chance to immediately spawn a second Meteor.'
  },

  // --- 🔒 Требует строго 10-й Прорыв ---
  {
    id: 'perk_paper_recycling',
    legacyId: null,
    name: 'Paper Recycling',
    nameRu: 'Вторичная Переработка',
    icon: '🧻',
    reqBreakthrough: 10,
    cost: 1000000,
    desc: 'Дает постоянный глобальный буст +20% к количеству получаемых Втулок при Смыве.',
    descEn: 'Permanently grants a global +20% boost to Sleeves obtained on Flush.'
  },

  // --- 🔒 Требует строго 20-й Прорыв ---
  {
    id: 'perk_kinetic_core',
    legacyId: 'upg_quantum_click',
    name: 'Kinetic Core',
    nameRu: 'Кинетическое Ядро',
    icon: '🔮',
    reqBreakthrough: 20,
    cost: 2500000,
    desc: 'Навсегда переносит 5% от общего пассивного дохода всех заводов в силу каждого клика.',
    descEn: 'Permanently transfers 5% of total passive factory income into click power.'
  },

  // --- 🔒 Требует строго 30-й Прорыв ---
  {
    id: 'perk_critical_singularity',
    legacyId: null,
    name: 'Critical Singularity',
    nameRu: 'Критическая Сингулярность',
    icon: '🎯',
    reqBreakthrough: 30,
    cost: 5000000,
    desc: 'Навсегда умножает весь итоговый Критический Урон на х1.50 мультипликативно.',
    descEn: 'Permanently multiplies all final Critical Damage by x1.50 multiplicatively.'
  },

  // --- 🔒 Требует строго 40-й Прорыв ---
  {
    id: 'perk_blacksmith_blessing',
    legacyId: null,
    name: "Blacksmith's Blessing",
    nameRu: 'Благословение Кузнеца',
    icon: '🛡️',
    reqBreakthrough: 40,
    cost: 10000000,
    desc: 'Защита заточки ножей: при неудаче уровень ножа падает максимум на -1, а не сбрасывается в 0.',
    descEn: 'Knife sharpen safeguard: on failure knife level drops by at most -1 instead of resetting to 0.'
  },

  // --- 🔒 Требует строго 50-й Прорыв ---
  {
    id: 'perk_singularity_core',
    legacyId: 'upg_singularity_core',
    name: 'Singularity Core',
    nameRu: 'Ядро Сингулярности',
    icon: '💠',
    reqBreakthrough: 50,
    cost: 20000000,
    desc: 'Глобальный множитель x1.50 для эндгейм-заводских тиров (старше #11).',
    descEn: 'Global x1.50 multiplier for endgame factory tiers (above #11).'
  },

  // --- 🔒 Требует строго 60-й Прорыв ---
  {
    id: 'perk_ticket_factory',
    legacyId: null,
    name: 'Ticket Factory',
    nameRu: 'Фабрика Билетов',
    icon: '🎟️',
    reqBreakthrough: 60,
    cost: 40000000,
    desc: 'Пассивно генерирует 1 бесплатный Билет вклада для боссов гильдии каждые 12 часов оффлайна.',
    descEn: 'Passively generates 1 free guild contribution ticket for bosses every 12 hours of offline.'
  },

  // --- 🔒 Требует строго 80-й Прорыв ---
  {
    id: 'perk_cosmic_hibernate',
    legacyId: null,
    name: 'Cosmic Hibernate',
    nameRu: 'Космический Анабиоз',
    icon: '🌌',
    reqBreakthrough: 80,
    cost: 80000000,
    desc: 'Увеличивает максимальный лимит времени AFK-фарма еще на +12 часов (до 24 часов без VIP).',
    descEn: 'Extends maximum AFK farm time limit by another +12 hours (up to 24h without VIP).'
  },

  // --- 🔒 Требует строго 90-й Прорыв ---
  {
    id: 'perk_alchemical_mutation',
    legacyId: null,
    name: 'Alchemical Mutation',
    nameRu: 'Алхимическая Мутация',
    icon: '⚗️',
    reqBreakthrough: 90,
    cost: 150000000,
    desc: 'Снижает геометрический коэффициент усложнения стоимости всех заводов с 1.4 до 1.37.',
    descEn: 'Reduces geometric cost scaling coefficient of all factories from 1.4 to 1.37.'
  },

  // --- 🔒 Требует строго 100-й Прорыв ---
  {
    id: 'perk_omniverse_essence',
    legacyId: 'upg_omniversal_wealth',
    name: 'Omniverse Essence',
    nameRu: 'Эссенция Омниверса',
    icon: '👑',
    reqBreakthrough: 100,
    cost: 300000000,
    desc: 'Абсолютный глобальный множитель x1.20 вообще ко всей биомассе, кликам и доходам в игре.',
    descEn: 'Absolute global x1.20 multiplier to all biomass, clicks, and passive income in the game.'
  }
];

/**
 * Проверка владения перком (поддерживает прямые ID, legacyId и GAME.ownedPerks)
 */
export function hasPerk(perkId) {
  if (!perkId) return false;
  const perk = PERMANENT_PERKS.find(p => p.id === perkId || p.legacyId === perkId);
  if (!perk) {
    if (GAME.ownedPerks && GAME.ownedPerks[perkId]) return true;
    return false;
  }
  if (perk.owned) return true;
  if (GAME.ownedPerks) {
    if (GAME.ownedPerks[perk.id]) return true;
    if (perk.legacyId && GAME.ownedPerks[perk.legacyId]) return true;
  }
  if (perk.legacyId) {
    const legacyItem = SHOP_ITEMS.find(s => s.id === perk.legacyId);
    if (legacyItem && legacyItem.owned) return true;
  }
  return false;
}

/**
 * Стоимость перка с учетом скидки реликвии "Алмазный Налог" (-3% за уровень мультипликативно)
 */
export function getPerkCost(perk) {
  const base = Number(perk?.cost) || 0;
  const discountLvl = getRelicLevel('relic_perk_discount');
  if (discountLvl <= 0) return base;
  return Math.max(1, Math.round(base * Math.pow(0.97, discountLvl)));
}

/**
 * Покупка постоянного перка за Блестяшки
 */
export function buyPermanentPerk(perkId) {
  const perk = PERMANENT_PERKS.find(p => p.id === perkId || p.legacyId === perkId);
  if (!perk) return { success: false, msg: 'Перк не найден' };

  const currentB = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;
  if (currentB < perk.reqBreakthrough) {
    return { success: false, msg: `🔒 Требуется ${perk.reqBreakthrough} Прорыв!` };
  }

  if (hasPerk(perk.id)) {
    return { success: false, msg: 'Перк уже приобретён!' };
  }

  const cost = getPerkCost(perk);
  const curSparkles = Number(GAME.sparkles) || 0;
  if (curSparkles < cost) {
    return { success: false, msg: `Недостаточно Блестяшек (${formatNumber(cost)} ✨)!` };
  }

  GAME.sparkles = Math.max(0, curSparkles - cost);
  perk.owned = true;
  if (!GAME.ownedPerks) GAME.ownedPerks = {};
  GAME.ownedPerks[perk.id] = true;
  if (perk.legacyId) {
    GAME.ownedPerks[perk.legacyId] = true;
    const leg = SHOP_ITEMS.find(s => s.id === perk.legacyId);
    if (leg) leg.owned = true;
  }

  return { success: true, perk };
}
