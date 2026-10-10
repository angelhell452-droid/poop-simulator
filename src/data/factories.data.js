import { WEAPON_CASES } from './cases.data.js?v=5.0.80';

export const FACTORIES_PER_EPOCH = 1;
export const CLASSIC_EPOCHS = 45;

export const TIER_TITLES = [
  '⭐ Тир 1: Бытовой Дренаж',
  '⚡ Тир 2: Био-Индустрия',
  '🔮 Тир 3: Космос и Темпорал',
  '🌌 Тир 4: Омниверс и Сингулярность',
  '🪐 Тир 5: Абсолютная Вечность'
];

/**
 * Логарифмическая шкала базовой цены завода по тирам.
 * Тир 1 = 20 биомассы.
 * Тир 45 = 1e1050 биомассы (500+ Прорыв / финальные рубежи).
 * При tier > 45 формула масштабируется дальше в бесконечность.
 */
export function getFactoryLogCost(tierNumber) {
  const k = Math.max(1, Number(tierNumber) || 1);
  if (k === 1) return Math.log10(20);
  if (k === 2) return Math.log10(15000);
  if (k === 3) return Math.log10(1500000);
  const t = (k - 3) / (45 - 3);
  const c3 = Math.log10(1500000);
  const c45 = 1050;
  return c3 + (c45 - c3) * Math.pow(t, 1.65);
}

/**
 * Логарифмическая шкала базового дохода завода по тирам.
 * Тир 1 = 80 биомассы/сек.
 * Тир 45 = 1e900 биомассы/сек (идеальный паритет с ножом 1e1000).
 * При tier > 45 формула масштабируется дальше в бесконечность.
 */
export function getFactoryLogCps(tierNumber) {
  const k = Math.max(1, Number(tierNumber) || 1);
  if (k === 1) return Math.log10(80);
  if (k === 2) return Math.log10(1800);
  if (k === 3) return Math.log10(6000);
  const t = (k - 3) / (45 - 3);
  const s3 = Math.log10(6000);
  const s45 = 900;
  return s3 + (s45 - s3) * Math.pow(t, 1.65);
}

export function makeBigFromLog(logVal) {
  if (logVal < 300) {
    const val = Math.pow(10, logVal);
    if (Number.isFinite(val) && val < 1e300) {
      return logVal < 12 ? Math.round(val) : val;
    }
  }
  const e = Math.floor(logVal);
  const m = Math.pow(10, logVal - e);
  return { __big: true, m: Number(m.toFixed(4)), e };
}

export function getFactoryBaseCost(tierNumber) {
  return makeBigFromLog(getFactoryLogCost(tierNumber));
}

export function getFactoryBaseIncome(tierNumber) {
  return makeBigFromLog(getFactoryLogCps(tierNumber));
}

export const FACTORY_TEMPLATES = [
  // ⭐ ТИР 1: БЫТОВОЙ ДРЕНАЖ (Кейсы 1 - 9, Прорывы 0 - 2)
  { id: 'fly_squad', name: 'Эскадрилья Мух-Курьеров', icon: '🪰' },
  { id: 'news_paper', name: 'Утренняя Пресса Со Скидкой', icon: '📰' },
  { id: 'freshener_pine', name: 'Хвойный Ароматизатор Pro', icon: '🌲' },
  { id: 'turbo_plunger', name: 'Титановый Вантуз-Турбо', icon: '🪠' },
  { id: 'sewer_factory', name: 'Био-Перерабатывающий Завод', icon: '🏭' },
  { id: 'hydro_cyclone', name: 'Гидроциклонный Сепаратор', icon: '🌀' },
  { id: 'orbital_station', name: 'Орбитальный Дренажный Модуль', icon: '🛰️' },
  { id: 'quantum_collider', name: 'Квантовый Синтезатор Организма', icon: '⚛️' },
  { id: 'cosmic_blackhole', name: 'Сингулярный Пожиратель Отходов', icon: '🌌' },

  // ⚡ ТИР 2: БИО-ИНДУСТРИЯ (Кейсы 10 - 18, Прорывы 3 - 5)
  { id: 'multiverse_reactor', name: 'Мультиверс Гипер-Реактор', icon: '🪐' },
  { id: 'dark_matter_siphon', name: 'Сифон Тёмной Материи', icon: '🕳️' },
  { id: 'antimatter_condenser', name: 'Антиматерийный Конденсатор', icon: '⚡' },
  { id: 'temporal_extractor', name: 'Темпоральный Экстрактор Времени', icon: '⏳' },
  { id: 'dimension_portal', name: 'Межпространственные Врата Тьмы', icon: '🚪' },
  { id: 'multiverse_forge', name: 'Кузница Карманных Вселенных', icon: '🔨' },
  { id: 'cosmic_ascension', name: 'Обелиск Космического Вознесения', icon: '🌟' },
  { id: 'string_synthesizer', name: 'Синтезатор 11-Мерных Струн', icon: '🎻' },
  { id: 'dyson_sphere', name: 'Сфера Дайсона Черной Дыры', icon: '☀️' },

  // 🔮 ТИР 3: КОСМОС И ТЕМПОРАЛ (Кейсы 19 - 27, Прорывы 10 - 20)
  { id: 'omniverse_engine', name: 'Вечный Двигатель Омниверса', icon: '⚙️' },
  { id: 'absolute_throne', name: 'Абсолютный Трон Демиурга', icon: '👑' },
  { id: 'astral_archipelago', name: 'Астральный Архипелаг Миров', icon: '🏝️' },
  { id: 'quantum_singularity_matrix', name: 'Матрица Квантовой Сингулярности', icon: '🔮' },
  { id: 'chrono_factory_eternity', name: 'Хроно-Фабрика Вечности', icon: '🕰️' },
  { id: 'neuro_cosmic_web', name: 'Нейро-Космическая Сеть Сознания', icon: '🕸️' },
  { id: 'titanic_galaxy_drain', name: 'Титанический Дренаж Сверхскоплений', icon: '🌌' },
  { id: 'superstring_reality_weaver', name: 'Ткач Суперструнной Реальности', icon: '🧶' },
  { id: 'astral_infinity_well', name: 'Колодец Астральной Бесконечности', icon: '🕳️' },

  // 🌌 ТИР 4: ОМНИВЕРС И СИНГУЛЯРНОСТЬ (Кейсы 28 - 35, Прорывы 30 - 50)
  { id: 'omniverse_hyper_drive', name: 'Гипер-Привод Мета-Вселенной', icon: '🚀' },
  { id: 'multiverse_mother_server', name: 'Материнский Сервер Мироздания', icon: '🖥️' },
  { id: 'cosmic_demiurge_nexus', name: 'Нексус Космического Демиурга', icon: '💠' },
  { id: 'primordial_light_throne', name: 'Трон Первородного Излучения', icon: '✨' },
  { id: 'space_collapse_paradox', name: 'Парадокс Пространственного Коллапса', icon: '🌀' },
  { id: 'absolute_zero_singularity', name: 'Сингулярность Абсолютного Нуля', icon: '❄️' },
  { id: 'sovereign_god_throne', name: 'Престол Владыки Вечности', icon: '👑' },
  { id: 'omega_eternity_generator', name: 'Генератор Омега-Вечности', icon: '♾️' },

  // 🪐 ТИР 5: АБСОЛЮТНАЯ ВЕЧНОСТЬ (Кейсы 36 - 45, Прорывы 75 - 300+)
  { id: 'infinite_dimension_source', name: 'Исток Бесконечных Измерений', icon: '🌌' },
  { id: 'architect_eye_omniscience', name: 'Око Всезнания Архитектора', icon: '👁️' },
  { id: 'supermassive_omniverse_pulsar', name: 'Пульсар Мета-Галактик', icon: '💫' },
  { id: 'infinite_absolute_godhead', name: 'Абсолютная Божественная Сущность', icon: '🔱' },
  { id: 'cosmic_multiverse_loom', name: 'Ткацкий Станок Мультивселенных', icon: '🪐' },
  { id: 'eternal_singularity_core', name: 'Ядро Вечной Сингулярности', icon: '💠' },
  { id: 'googol_quantum_engine', name: 'Квантовый Двигатель Гугола', icon: '🌌' },
  { id: 'transcendent_reality_forge', name: 'Горн Трансцендентной Реальности', icon: '🔨' },
  { id: 'chrono_matrix_prime', name: 'Хроно-Матрица Первоначала', icon: '⏳' },
  { id: 'alpha_omega_apex', name: 'Вершина Альфа и Омега Бытия', icon: '👑' }
];

export const FACTORIES = FACTORY_TEMPLATES.map((tmpl, idx) => {
  const k = idx + 1;
  const c = WEAPON_CASES[idx];
  const tierGroup = k <= 9 ? 1 : k <= 18 ? 2 : k <= 27 ? 3 : k <= 35 ? 4 : 5;
  const tier = tierGroup === 1 ? 'early' : tierGroup === 2 ? 'mid' : tierGroup === 3 ? 'late' : tierGroup === 4 ? 'endgame' : 'singularity';

  return {
    id: tmpl.id,
    name: tmpl.name,
    icon: tmpl.icon,
    tierNumber: k,
    tierGroup,
    tier,
    tierTitle: TIER_TITLES[tierGroup - 1],
    cost: getFactoryBaseCost(k),
    baseCps: getFactoryBaseIncome(k),
    reqStage: c ? Math.max(0, (c.reqForm || 1) - 1) : 0,
    reqBreakthrough: c ? (c.reqBreakthrough || 0) : 0,
    count: 0
  };
});
