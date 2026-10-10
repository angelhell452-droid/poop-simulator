import { GAME } from '../core/state.js?v=5.0.80';

/**
 * 5 Тиров Реликвий Прорыва (Breakthrough Relic Tiers)
 * Заблокированы строго по количеству совершенных Прорывов (GAME.breakthroughCount).
 */
export const RELIC_TIERS = [
  {
    tier: 1,
    name: 'Тир 1: Базовые',
    nameEn: 'Tier 1: Basic',
    icon: '🥚',
    reqBreakthrough: 1,
    desc: 'Доступны с 1-го Прорыва',
    descEn: 'Available from 1st Breakthrough'
  },
  {
    tier: 2,
    name: 'Тир 2: Продвинутые',
    nameEn: 'Tier 2: Advanced',
    icon: '⚡',
    reqBreakthrough: 10,
    desc: 'Требуют минимум 10-й Прорыв',
    descEn: 'Requires at least 10th Breakthrough'
  },
  {
    tier: 3,
    name: 'Тир 3: Мастер-Реликвии',
    nameEn: 'Tier 3: Master',
    icon: '⚔️',
    reqBreakthrough: 30,
    desc: 'Требуют минимум 30-й Прорыв',
    descEn: 'Requires at least 30th Breakthrough'
  },
  {
    tier: 4,
    name: 'Тир 4: Сингулярность',
    nameEn: 'Tier 4: Singularity',
    icon: '🌌',
    reqBreakthrough: 50,
    desc: 'Требуют минимум 50-й Прорыв',
    descEn: 'Requires at least 50th Breakthrough'
  },
  {
    tier: 5,
    name: 'Тир 5: Божественные',
    nameEn: 'Tier 5: Divine',
    icon: '👑',
    reqBreakthrough: 80,
    desc: 'Требуют минимум 80-й Прорыв',
    descEn: 'Requires at least 80th Breakthrough'
  }
];

/**
 * 24 Уникальные Реликвии за Вантузы 🪠
 * Разделены по 5 Тирам, прогрессия на 100 Прорывов.
 */
export const RELICS = [
  // ==========================================
  // --- 🥚 ТИР 1: БАЗОВЫЕ (1-й Прорыв) ---
  // ==========================================
  {
    id: 'relic_auto_care',
    key: 'relic_auto_care',
    legacyKey: 'autoCare',
    name: '🤖 Астральный Авто-Уход',
    nameEn: 'Astral Auto-Care',
    icon: '🤖',
    desc: 'Автоматически держит шкалы ухода на 100% навсегда, отменяя рутину.',
    descEn: 'Automatically keeps care bars at 100% forever, eliminating routine.',
    cost: 1,
    max: 1,
    tier: 1,
    reqBreakthrough: 1
  },
  {
    id: 'relic_auto_buy',
    key: 'relic_auto_buy',
    legacyKey: 'autoBuyer',
    name: '⚙️ Авто-Покупка Заводов',
    nameEn: 'Factory Auto-Buyer',
    icon: '⚙️',
    desc: 'Активирует тумблер автоматической ежесекундной закупки фабрик по кнопке MAX.',
    descEn: 'Activates toggle for automatic 1s factory purchases via MAX button.',
    cost: 1,
    max: 1,
    tier: 1,
    reqBreakthrough: 1
  },
  {
    id: 'relic_breakthrough_boost',
    key: 'relic_breakthrough_boost',
    legacyKey: 'cosmicSynergy',
    name: '🪐 Космический Резонатор',
    nameEn: 'Cosmic Resonator',
    icon: '🪐',
    desc: '+0.1 к основанию степени в бесконечной формуле BreakthroughBoost за уровень.',
    descEn: '+0.1 to power base in infinite BreakthroughBoost formula per level.',
    cost: 2,
    max: 15,
    tier: 1,
    reqBreakthrough: 1
  },
  {
    id: 'relic_offline_sparkles',
    key: 'relic_offline_sparkles',
    legacyKey: 'afkCap',
    name: '⏳ Сверх-Офлайн Модуль',
    nameEn: 'Hyper-Offline Module',
    icon: '⏳',
    desc: 'Авто-заводы генерируют Блестяшки ✨ в оффлайне со скоростью 5% от активной игры за уровень.',
    descEn: 'Auto-factories generate Sparkles ✨ offline at 5% rate of active game per level.',
    cost: 2,
    max: 8,
    tier: 1,
    reqBreakthrough: 1
  },
  {
    id: 'relic_flush_req_reduction',
    key: 'relic_flush_req_reduction',
    legacyKey: 'plungerIncubator',
    name: '🪠 Астральный Инкубатор',
    nameEn: 'Astral Incubator',
    icon: '🪠',
    desc: 'На -3% за уровень снижает количество Смывов для активации Прорыва.',
    descEn: 'Reduces Flushes required for Breakthrough activation by -3% per level.',
    cost: 3,
    max: 12,
    tier: 1,
    reqBreakthrough: 1
  },
  {
    id: 'relic_free_rolls',
    key: 'relic_free_rolls',
    legacyKey: 'passiveRolls',
    name: '🧻 Хроно-Переработка',
    nameEn: 'Chrono-Recycling',
    icon: '🧻',
    desc: 'Каждые +100 уровней биомассы в цикле дают +2% шанс мгновенно получить 1 Втулку без Смыва.',
    descEn: 'Every +100 biomass cycle levels grant +2% chance to immediately gain 1 Sleeve without Flush.',
    cost: 2,
    max: 5,
    tier: 1,
    reqBreakthrough: 1
  },

  // ==========================================
  // --- 🔒 ТИР 2: ПРОДВИНУТЫЕ (10-й Прорыв) ---
  // ==========================================
  {
    id: 'relic_quantum_meteor',
    key: 'relic_quantum_meteor',
    legacyKey: 'meteorStorm',
    name: '🌠 Звездный Дождь Метеоритов',
    nameEn: 'Stellar Meteor Rain',
    icon: '🌠',
    desc: '+1% за уровень шанс превратить Метеорит в Квантовый (даёт бесплатный донатный Варп на 2 часа).',
    descEn: '+1% per level chance to turn Meteor into Quantum (grants free 2-hour Time Warp).',
    cost: 6,
    max: 8,
    tier: 2,
    reqBreakthrough: 10
  },
  {
    id: 'relic_forge_luck',
    key: 'relic_forge_luck',
    legacyKey: 'knifeForge',
    name: '🗡️ Небесная Кузница Ножей',
    nameEn: 'Celestial Knife Forge',
    icon: '🗡️',
    desc: '+5% к шансу успеха заточки ножа за уровень и защита от падения в 0.',
    descEn: '+5% to knife sharpening success chance per level and protection from resetting to 0.',
    cost: 6,
    max: 12,
    tier: 2,
    reqBreakthrough: 10
  },
  {
    id: 'relic_crit_explosion',
    key: 'relic_crit_explosion',
    name: '💥 Крит-Детонатор',
    nameEn: 'Crit Detonator',
    icon: '💥',
    desc: 'Каждый 50-й Крит пулемёта подряд вызывает взрыв, дающий доход за 30 секунд.',
    descEn: 'Every 50th consecutive machine-gun Crit triggers an explosion granting 30 seconds of income.',
    cost: 8,
    max: 15,
    tier: 2,
    reqBreakthrough: 10
  },
  {
    id: 'relic_case_luck',
    key: 'relic_case_luck',
    name: '📦 Архивариус Кейсов',
    nameEn: 'Case Archivist',
    icon: '📦',
    desc: '+1.5% за уровень шанс выбить легендарный нож из любого кейса.',
    descEn: '+1.5% per level chance to unbox legendary knife from any case.',
    cost: 7,
    max: 10,
    tier: 2,
    reqBreakthrough: 10
  },

  // ==========================================
  // --- 🔒 ТИР 3: МАСТЕР-РЕЛИКВИИ (30-й Прорыв) ---
  // ==========================================
  {
    id: 'relic_factory_to_boss',
    key: 'relic_factory_to_boss',
    legacyKey: 'factoryOverdrive',
    name: '⚡ Гипер-Ускоритель Заводов',
    nameEn: 'Factory Hyper-Accelerator',
    icon: '⚡',
    desc: 'Переносит 1% от пассивного дохода заводов в постоянный урон пулемёта по Боссам.',
    descEn: 'Transfers 1% of passive factory income per level into constant machine-gun Boss damage.',
    cost: 8,
    max: 15,
    tier: 3,
    reqBreakthrough: 30
  },
  {
    id: 'relic_double_plungers',
    key: 'relic_double_plungers',
    legacyKey: 'evoBlessing',
    name: '🧬 Благословение Демиурга',
    nameEn: 'Demiurge Blessing',
    icon: '🧬',
    desc: '+2% за уровень шанс, что награда Вантузами за босса удвоится лично для тебя.',
    descEn: '+2% per level chance that personal Plunger reward from boss is doubled for you.',
    cost: 8,
    max: 12,
    tier: 3,
    reqBreakthrough: 30
  },
  {
    id: 'relic_ticket_discount',
    key: 'relic_ticket_discount',
    name: '🎫 Билетный Конвейер',
    nameEn: 'Ticket Conveyor',
    icon: '🎫',
    desc: 'Снижает планку генерации Билетов вклада с 500 кликов до 400 кликов на макс уровне.',
    descEn: 'Lowers ticket generation requirement from 500 clicks to 400 clicks at max level.',
    cost: 12,
    max: 5,
    tier: 3,
    reqBreakthrough: 30
  },
  {
    id: 'relic_boss_bleed',
    key: 'relic_boss_bleed',
    name: '🩸 Ядовитое Лезвие',
    nameEn: 'Toxic Blade',
    icon: '🩸',
    desc: 'Ручные атаки вешают на босса кровотечение, наносящее +2% от твоего урона в сек.',
    descEn: 'Manual attacks inflict bleed on boss dealing +2% of your click damage per second per level.',
    cost: 10,
    max: 10,
    tier: 3,
    reqBreakthrough: 30
  },

  // ==========================================
  // --- 🔒 ТИР 4: СИНГУЛЯРНОСТЬ (50-й Прорыв) ---
  // ==========================================
  {
    id: 'relic_cost_exponent_reduction',
    key: 'relic_cost_exponent_reduction',
    legacyKey: 'omniMult',
    name: '🌌 Омни-Множитель Бытия',
    nameEn: 'Omni-Multiplier of Existence',
    icon: '🌌',
    desc: 'Снижает показатель степени экспоненты стоимости всех заводов на -0.01 за уровень.',
    descEn: 'Reduces cost scaling exponent of all factories by -0.01 per level.',
    cost: 12,
    max: 20,
    tier: 4,
    reqBreakthrough: 50
  },
  {
    id: 'relic_gate_of_eternity',
    key: 'relic_gate_of_eternity',
    legacyKey: 'singularityRift',
    name: '♾️ Врата Вечности',
    nameEn: 'Gate of Eternity',
    icon: '♾️',
    desc: 'Навсегда открывает Кейс №45 (нож на 300 CPS) и удваивает урон по финальному боссу.',
    descEn: 'Permanently unlocks Case #45 (300 CPS blade) and doubles damage against final boss.',
    cost: 20,
    max: 1,
    tier: 4,
    reqBreakthrough: 50
  },
  {
    id: 'relic_perk_discount',
    key: 'relic_perk_discount',
    name: '💎 Алмазный Налог',
    nameEn: 'Diamond Tribute',
    icon: '💎',
    desc: 'Снижает стоимость всех 20 перков за Блестяшки на -3% за уровень (мультипликативно).',
    descEn: 'Reduces cost of all 20 Sparkle perks by -3% per level (multiplicative).',
    cost: 15,
    max: 10,
    tier: 4,
    reqBreakthrough: 50
  },
  {
    id: 'relic_prestige_factory_keep',
    key: 'relic_prestige_factory_keep',
    name: '🔁 Петля Мёбиуса',
    nameEn: 'Mobius Loop',
    icon: '🔁',
    desc: 'При Прорыве игра сохраняет 5% за уровень от уровней Авто-заводов текущего мира.',
    descEn: 'On Breakthrough, preserves 5% per level of current world auto-factory levels.',
    cost: 18,
    max: 5,
    tier: 4,
    reqBreakthrough: 50
  },

  // ==========================================
  // --- 🔒 ТИР 5: БОЖЕСТВЕННЫЕ (80-й Прорыв) ---
  // ==========================================
  {
    id: 'relic_double_meteors',
    key: 'relic_double_meteors',
    name: '🌋 Вулканический Спавн',
    nameEn: 'Volcanic Twin Spawner',
    icon: '🌋',
    desc: 'Метеориты на экране теперь прилетают строго по два одновременно всегда.',
    descEn: 'Meteors on screen now always spawn strictly in pairs simultaneously.',
    cost: 30,
    max: 1,
    tier: 5,
    reqBreakthrough: 80
  },
  {
    id: 'relic_turbo_duration',
    key: 'relic_turbo_duration',
    name: '⏱️ Хроно-Абсолют',
    nameEn: 'Chrono-Absolute',
    icon: '⏱️',
    desc: 'Увеличивает длительность встроенного Турбо-режима кликов на +2 секунды за уровень.',
    descEn: 'Increases built-in Turbo click mode duration by +2 seconds per level.',
    cost: 25,
    max: 10,
    tier: 5,
    reqBreakthrough: 80
  },
  {
    id: 'relic_guild_plunger_scaling',
    key: 'relic_guild_plunger_scaling',
    name: '🏦 Вантузный Капитал',
    nameEn: 'Plunger Capital',
    icon: '🏦',
    desc: 'Доход биомассы умножается на х1.05 за уровень за каждый миллион Вантузов в банке гильдии.',
    descEn: 'Biomass income is multiplied by x1.05 per level per 1,000,000 Plungers in guild bank.',
    cost: 35,
    max: 15,
    tier: 5,
    reqBreakthrough: 80
  },
  {
    id: 'relic_meteor_progression_skip',
    key: 'relic_meteor_progression_skip',
    name: '🌌 Галактический Шторм',
    nameEn: 'Galactic Storm',
    icon: '🌌',
    desc: '+1% шанс, что клик по Метеориту мгновенно даст +100 уровней опыта Прорыва.',
    descEn: '+1% chance that Meteor click immediately awards +100 Breakthrough Exp levels.',
    cost: 40,
    max: 5,
    tier: 5,
    reqBreakthrough: 80
  },
  {
    id: 'relic_lazy_boss_attack',
    key: 'relic_lazy_boss_attack',
    name: '🛋️ Ленивый Босс',
    nameEn: 'Lazy Boss',
    icon: '🛋️',
    desc: 'Добавляет кнопку автоматического слива Билетов в босса из главного меню.',
    descEn: 'Adds a quick button to automatically dump tickets into the boss from the main menu.',
    cost: 30,
    max: 1,
    tier: 5,
    reqBreakthrough: 80
  },
  {
    id: 'relic_meta_infinity_multiplier',
    key: 'relic_meta_infinity_multiplier',
    name: '✨ Эссенция Бесконечности',
    nameEn: 'Infinity Essence',
    icon: '✨',
    desc: 'Абсолютный глобальный мультипликатор х2.0 ко всему доходу, кликам и урону за уровень.',
    descEn: 'Absolute global x2.0 multiplier to all income, clicks, and damage per level.',
    cost: 50,
    max: 20,
    tier: 5,
    reqBreakthrough: 80
  }
];

/**
 * Получить текущий уровень реликвии с обратной совместимостью по старым ключам.
 */
export function getRelicLevel(idOrKey) {
  if (!idOrKey) return 0;
  const relic = RELICS.find(r => r.id === idOrKey || r.key === idOrKey || r.legacyKey === idOrKey);
  const targetId = relic ? relic.id : idOrKey;
  const targetKey = relic ? relic.key : idOrKey;
  const legacyKey = relic ? relic.legacyKey : null;

  const store = GAME.transcendUpgrades || {};
  const relicsStore = GAME.relics || {};

  let val = relicsStore[targetId] ?? relicsStore[targetKey] ?? store[targetId] ?? store[targetKey];
  if (val === undefined && legacyKey) {
    val = relicsStore[legacyKey] ?? store[legacyKey];
  }

  if (typeof val === 'boolean') {
    return val ? 1 : 0;
  }
  const num = Number(val) || 0;
  if (relic && relic.max) {
    return Math.max(0, Math.min(relic.max, num));
  }
  return Math.max(0, num);
}

/**
 * Проверить, активна ли реликвия (уровень > 0).
 */
export function hasRelic(idOrKey) {
  return getRelicLevel(idOrKey) > 0;
}
