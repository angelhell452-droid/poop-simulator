import { getPhaseByIndex, PHASE_COUNT, CLASSIC_EPOCHS } from '../progression/phases.data.js?v=5.0.80';
import { calcEvolutionMult } from './evolutions.data.js?v=5.0.80';
import { expectedAccountMult } from '../economy/metaMultipliers.js?v=5.0.80';
import { div, isBig, mul, bigPow } from '../utils/big.js?v=5.0.80';
import { horizonDrag } from '../economy/horizon.js?v=5.0.80';

export const FACTORIES_PER_EPOCH = 3;

export const FACTORIES = [
  // ⭐ ТИР 1: БЫТОВОЙ ДРЕНАЖ (ФОРМЫ 0 - 20)
  { id: 'fly_squad', name: 'Эскадрилья Мух-Курьеров', cost: 15, baseCps: 0.5, count: 0, icon: '🪰', tier: 'early', tierNumber: 1, tierTitle: '⭐ Тир 1: Бытовой Дренаж', reqStage: 0 },
  { id: 'news_paper', name: 'Утренняя Пресса Со Скидкой', cost: 250, baseCps: 6.0, count: 0, icon: '📰', tier: 'early', tierNumber: 1, tierTitle: '⭐ Тир 1: Бытовой Дренаж', reqStage: 3 },
  { id: 'freshener_pine', name: 'Хвойный Ароматизатор Pro', cost: 3500, baseCps: 70.0, count: 0, icon: '🌲', tier: 'early', tierNumber: 1, tierTitle: '⭐ Тир 1: Бытовой Дренаж', reqStage: 8 },
  { id: 'turbo_plunger', name: 'Титановый Вантуз-Турбо', cost: 50000, baseCps: 900.0, count: 0, icon: '🪠', tier: 'early', tierNumber: 1, tierTitle: '⭐ Тир 1: Бытовой Дренаж', reqStage: 15 },

  // ⚡ ТИР 2: БИО-ИНДУСТРИЯ (ФОРМЫ 25 - 120) [Промышленный прорыв: вход от 750K, мощный CPS рост]
  { id: 'sewer_factory', name: 'Био-Перерабатывающий Завод', cost: 750000, baseCps: 12000.0, count: 0, icon: '🏭', tier: 'mid', tierNumber: 2, tierTitle: '⚡ Тир 2: Био-Индустрия', reqStage: 25 },
  { id: 'hydro_cyclone', name: 'Гидроциклонный Сепаратор', cost: 15000000, baseCps: 220000.0, count: 0, icon: '🌀', tier: 'mid', tierNumber: 2, tierTitle: '⚡ Тир 2: Био-Индустрия', reqStage: 40 },
  { id: 'orbital_station', name: 'Орбитальный Дренажный Модуль', cost: 350000000, baseCps: 4500000.0, count: 0, icon: '🛰️', tier: 'mid', tierNumber: 2, tierTitle: '⚡ Тир 2: Био-Индустрия', reqStage: 65 },
  { id: 'quantum_collider', name: 'Квантовый Синтезатор Организма', cost: 8000000000, baseCps: 95000000.0, count: 0, icon: '⚛️', tier: 'mid', tierNumber: 2, tierTitle: '⚡ Тир 2: Био-Индустрия', reqStage: 95 },

  // 🔮 ТИР 3: КОСМОС И ТЕМПОРАЛ (ФОРМЫ 140 - 2000) [Заметный прыжок цен и дохода: старт с 500B]
  { id: 'cosmic_blackhole', name: 'Сингулярный Пожиратель Отходов', cost: 5e11, baseCps: 6e8, count: 0, icon: '🌌', tier: 'late', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', reqStage: 140 },
  { id: 'multiverse_reactor', name: 'Мультиверс Гипер-Реактор', cost: 1.5e13, baseCps: 1.5e10, count: 0, icon: '🪐', tier: 'late', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', reqStage: 200 },
  { id: 'dark_matter_siphon', name: 'Сифон Тёмной Материи', cost: 5e14, baseCps: 4e11, count: 0, icon: '🕳️', tier: 'late', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', reqStage: 280 },
  { id: 'antimatter_condenser', name: 'Антиматерийный Конденсатор', cost: 2e16, baseCps: 1.2e13, count: 0, icon: '⚡', tier: 'late', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', reqStage: 380 },
  { id: 'temporal_extractor', name: 'Темпоральный Экстрактор Времени', cost: 8e17, baseCps: 4e14, count: 0, icon: '⏳', tier: 'endgame', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', rule: 'time_warp', reqStage: 500 },
  { id: 'dimension_portal', name: 'Межпространственные Врата Тьмы', cost: 3.5e19, baseCps: 1.5e16, count: 0, icon: '🚪', tier: 'endgame', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', rule: 'dimension_buff', reqStage: 650 },
  { id: 'multiverse_forge', name: 'Кузница Карманных Вселенных', cost: 1.5e21, baseCps: 5.5e17, count: 0, icon: '🔨', tier: 'endgame', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', rule: 'forge_catalyst', reqStage: 850 },
  { id: 'cosmic_ascension', name: 'Обелиск Космического Вознесения', cost: 8e22, baseCps: 2.5e19, count: 0, icon: '🌟', tier: 'endgame', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', reqStage: 1100 },
  { id: 'string_synthesizer', name: 'Синтезатор 11-Мерных Струн', cost: 4e24, baseCps: 1.1e21, count: 0, icon: '🎻', tier: 'endgame', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', reqStage: 1400 },
  { id: 'dyson_sphere', name: 'Сфера Дайсона Черной Дыры', cost: 2e26, baseCps: 5e22, count: 0, icon: '☀️', tier: 'endgame', tierNumber: 3, tierTitle: '🔮 Тир 3: Космос и Темпорал', reqStage: 1800 },

  // 🌌 ТИР 4: ОМНИВЕРС И СИНГУЛЯРНОСТЬ (ФОРМЫ 2300 - 20,000) [Колоссальный прыжок цен и дохода: старт с 1e29]
  { id: 'omniverse_engine', name: 'Вечный Двигатель Омниверса', cost: 1e29, baseCps: 2e25, count: 0, icon: '⚙️', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 2300 },
  { id: 'absolute_throne', name: 'Абсолютный Трон Демиурга', cost: 5e31, baseCps: 8e27, count: 0, icon: '👑', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 2900 },
  { id: 'astral_archipelago', name: 'Астральный Архипелаг Миров', cost: 3e34, baseCps: 4e30, count: 0, icon: '🏝️', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 3600 },
  { id: 'quantum_singularity_matrix', name: 'Матрица Квантовой Сингулярности', cost: 2e37, baseCps: 2e33, count: 0, icon: '🔮', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 4400 },
  { id: 'chrono_factory_eternity', name: 'Хроно-Фабрика Вечности', cost: 1.5e40, baseCps: 1.2e36, count: 0, icon: '🕰️', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 5300 },
  { id: 'neuro_cosmic_web', name: 'Нейро-Космическая Сеть Сознания', cost: 1e43, baseCps: 7e38, count: 0, icon: '🕸️', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 6300 },
  { id: 'titanic_galaxy_drain', name: 'Титанический Дренаж Сверхскоплений', cost: 8e45, baseCps: 4e41, count: 0, icon: '🌌', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 7400 },
  { id: 'superstring_reality_weaver', name: 'Ткач Суперструнной Реальности', cost: 6e48, baseCps: 2.5e44, count: 0, icon: '🧶', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 8600 },
  { id: 'astral_infinity_well', name: 'Колодец Астральной Бесконечности', cost: 5e51, baseCps: 1.5e47, count: 0, icon: '🕳️', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 9900 },
  { id: 'omniverse_hyper_drive', name: 'Гипер-Привод Мета-Вселенной', cost: 4e54, baseCps: 1e50, count: 0, icon: '🚀', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 11300 },
  { id: 'multiverse_mother_server', name: 'Материнский Сервер Мироздания', cost: 3e57, baseCps: 6e52, count: 0, icon: '🖥️', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 12800 },
  { id: 'cosmic_demiurge_nexus', name: 'Нексус Космического Демиурга', cost: 2.5e60, baseCps: 4e55, count: 0, icon: '💠', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 14400 },
  { id: 'primordial_light_throne', name: 'Трон Первородного Излучения', cost: 2e63, baseCps: 2.5e58, count: 0, icon: '✨', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 16100 },
  { id: 'space_collapse_paradox', name: 'Парадокс Пространственного Коллапса', cost: 1.5e66, baseCps: 1.5e61, count: 0, icon: '🌀', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 17500 },
  { id: 'absolute_zero_singularity', name: 'Сингулярность Абсолютного Нуля', cost: 1e70, baseCps: 8e64, count: 0, icon: '❄️', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 18500 },
  { id: 'sovereign_god_throne', name: 'Престол Владыки Вечности', cost: 1e75, baseCps: 6e69, count: 0, icon: '👑', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19200 },
  { id: 'omega_eternity_generator', name: 'Генератор Омега-Вечности', cost: 1e80, baseCps: 5e74, count: 0, icon: '♾️', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19500 },
  { id: 'infinite_dimension_source', name: 'Исток Бесконечных Измерений', cost: 1e85, baseCps: 4e79, count: 0, icon: '🌌', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19700 },
  { id: 'architect_eye_omniscience', name: 'Око Всезнания Архитектора', cost: 1e90, baseCps: 3e84, count: 0, icon: '👁️', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19800 },
  { id: 'supermassive_omniverse_pulsar', name: 'Пульсар Мета-Галактик', cost: 1e95, baseCps: 2e89, count: 0, icon: '💫', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19900 },
  { id: 'infinite_absolute_godhead', name: 'Абсолютная Божественная Сущность', cost: 1e105, baseCps: 1.5e99, count: 0, icon: '🔱', tier: 'endgame', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19950 },
  { id: 'cosmic_multiverse_loom', name: 'Ткацкий Станок Мультивселенных', cost: 1e120, baseCps: 1e114, count: 0, icon: '🪐', tier: 'singularity', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19960 },
  { id: 'eternal_singularity_core', name: 'Ядро Вечной Сингулярности', cost: 1e140, baseCps: 1e134, count: 0, icon: '💠', tier: 'singularity', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19970 },
  { id: 'googol_quantum_engine', name: 'Квантовый Двигатель Гугола', cost: 1e165, baseCps: 1e159, count: 0, icon: '🌌', tier: 'singularity', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19980 },
  { id: 'transcendent_reality_forge', name: 'Горн Трансцендентной Реальности', cost: 1e195, baseCps: 1e189, count: 0, icon: '🔨', tier: 'singularity', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19985 },
  { id: 'chrono_matrix_prime', name: 'Хроно-Матрица Первоначала', cost: 1e225, baseCps: 1e219, count: 0, icon: '⏳', tier: 'singularity', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19990 },
  { id: 'infinite_pantheon_well', name: 'Источник Бесконечного Пантеона', cost: 1e255, baseCps: 1e249, count: 0, icon: '⛲', tier: 'singularity', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19993 },
  { id: 'hyper_dimension_architect', name: 'Архитектор Гиперизмерений', cost: 1e280, baseCps: 1e274, count: 0, icon: '📐', tier: 'singularity', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19995 },
  { id: 'omni_singularity_matrix', name: 'Матрица Омни-Сингулярности', cost: 1e295, baseCps: 1e289, count: 0, icon: '🔮', tier: 'singularity', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19997 },
  { id: 'alpha_omega_apex', name: 'Вершина Альфа и Омега Бытия', cost: 1e305, baseCps: 1e299, count: 0, icon: '👑', tier: 'singularity', tierNumber: 4, tierTitle: '🌌 Тир 4: Омниверс и Сингулярность', reqStage: 19999 }
];

const CLASSIC_COUNT = CLASSIC_EPOCHS * FACTORIES_PER_EPOCH;
const PLANT_ICONS = ['🏭', '🌀', '⚙️', '🪐', '⚡', '🌟', '🕳️', '🔨', '☀️', '👑', '🎻', '⏳', '🚪', '💠', '🚀', '❄️', '👁️', '💫', '🔱', '🌌'];
const SLOT_NAMES = ['Подход', 'Разгон', 'Венец'];

while (FACTORIES.length < CLASSIC_COUNT) {
  const i = FACTORIES.length;
  FACTORIES.push({
    id: `plant_${i}`,
    name: `Цех ${SLOT_NAMES[i % 3]} ${i + 1}`,
    cost: 1,
    baseCps: 1,
    count: 0,
    icon: PLANT_ICONS[i % PLANT_ICONS.length],
    tier: 'endgame',
    tierNumber: 4,
    tierTitle: '🌌 Тир 4: Омниверс',
    reqStage: 0
  });
}
if (FACTORIES.length > CLASSIC_COUNT) FACTORIES.length = CLASSIC_COUNT;

const TIER_TITLES = [
  '⭐ Тир 1: Бытовой Дренаж',
  '⚡ Тир 2: Био-Индустрия',
  '🔮 Тир 3: Космос и Темпорал',
  '🌌 Тир 4: Омниверс'
];

const SLOT_PLAN = [
  { formOffset: 0, payback: 90, decade: 0 },
  { formOffset: 40, payback: 180, decade: 0.6 },
  { formOffset: 200, payback: 240, decade: 1.2 }
];

for (let i = 0; i < FACTORIES.length; i++) {
  const epoch = Math.floor(i / FACTORIES_PER_EPOCH) + 1;
  const slot = i % FACTORIES_PER_EPOCH;
  const phase = getPhaseByIndex(epoch);
  const pace = Math.pow(1.12, epoch - 1);
  const fac = FACTORIES[i];
  const tierNumber = Math.min(4, Math.floor((epoch - 1) / 10) + 1);
  fac.tierNumber = tierNumber;
  fac.tier = tierNumber === 1 ? 'early' : tierNumber === 2 ? 'mid' : tierNumber === 3 ? 'late' : 'endgame';
  fac.tierTitle = TIER_TITLES[tierNumber - 1];
  fac.epoch = epoch;

  if (epoch === 1 && slot === 0) {
    fac.reqStage = 0;
    fac.cost = 20;
    fac.baseCps = 80;
    continue;
  }
  if (epoch === 1 && slot === 1) {
    fac.reqStage = 40;
    fac.cost = 15000;
    fac.baseCps = 1800;
    continue;
  }
  if (epoch === 1 && slot === 2) {
    fac.reqStage = 399;
    fac.cost = 1500000;
    fac.baseCps = 6000;
    continue;
  }

  const spec = SLOT_PLAN[slot];
  const decade = slot * 0.48;
  fac.reqStage = phase.formStart - 1 + spec.formOffset;

  // Smooth arrival progression: ~3.0x between adjacent factories
  // 3 slots per epoch -> arrival per epoch grows by 3.0^3 ≈ 27x
  const arrival = mul(2000, bigPow(27.0, epoch - 2));
  const income = mul(arrival, Math.pow(10, decade));
  const formMult = Math.max(1, calcEvolutionMult(fac.reqStage));
  const expected = expectedAccountMult(epoch);
  const cpsFactor = 9 * Math.pow(pace, 0.45);
  const lateDrag = Math.pow(1.18, Math.max(0, epoch - 10));

  // Tier nerfing: T2 cut 100x-250x, T3 cut 300x-700x, T4+ cut 1000x
  let tierNerf = 1;
  if (tierNumber === 2) {
    tierNerf = 100 * Math.pow(2.5, (epoch - 11) / 9);
  } else if (tierNumber === 3) {
    tierNerf = 300 * Math.pow(2.33, (epoch - 21) / 9);
  } else if (tierNumber >= 4) {
    tierNerf = 1000;
  }

  // Cost escalation starting from mid Tier 2 (epoch 15+)
  let costHike = 1;
  if (epoch >= 15) {
    costHike = bigPow(4.0, epoch - 14);
  }

  const rawCost = mul(mul(mul(income, spec.payback), pace), costHike);
  fac.cost = isBig(rawCost) ? rawCost : Math.max(1, Math.round(rawCost));

  const rawCps = div(mul(income, cpsFactor), mul(formMult * expected * lateDrag, tierNerf));
  fac.baseCps = isBig(rawCps) ? rawCps : (Number.isFinite(rawCps) ? rawCps : 1);
}

const HORIZON_SLOTS = [
  { formOffset: 0, payback: 90, decade: 0, name: 'Подход' },
  { formOffset: 40, payback: 180, decade: 0.5, name: 'Разгон' },
  { formOffset: 200, payback: 240, decade: 1.0, name: 'Венец' },
  { formOffset: 400, payback: 360, decade: 1.4, name: 'Закат' }
];

for (let epoch = CLASSIC_EPOCHS + 1; epoch <= PHASE_COUNT; epoch++) {
  const phase = getPhaseByIndex(epoch);
  const pace = Math.pow(1.12, CLASSIC_EPOCHS - 1);
  const drag = horizonDrag(epoch);
  HORIZON_SLOTS.forEach((spec, slot) => {
    const rawArrival = mul(2000, bigPow(27.0, epoch - 2));
    const arrival = isBig(rawArrival)
      ? rawArrival
      : { __big: true, m: 2, e: 3 + Math.floor((epoch - 2) * Math.log10(27)) };
    const income = mul(arrival, Math.pow(10, slot * 0.48));
    const reqStage = phase.formStart - 1 + spec.formOffset;
    const formMult = Math.max(1, calcEvolutionMult(reqStage));
    const expected = expectedAccountMult(epoch);
    const cpsFactor = 9 * Math.pow(pace, 0.45);
    const lateDrag = Math.pow(1.18, CLASSIC_EPOCHS - 10);
    const tierNerf = 1000;
    const divisor = mul(formMult * expected * lateDrag * drag, tierNerf);
    const costHike = bigPow(4.0, epoch - 14);
    const cost = mul(mul(mul(income, spec.payback), pace), costHike);
    const baseCps = div(mul(income, cpsFactor), divisor);
    FACTORIES.push({
      id: `horizon_${epoch}_${slot}`,
      name: `${spec.name} эпохи ${epoch}`,
      cost: isBig(cost) ? cost : Math.max(1, Math.round(cost)),
      baseCps,
      count: 0,
      icon: PLANT_ICONS[(epoch + slot) % PLANT_ICONS.length],
      tier: 'horizon',
      tierNumber: 5,
      tierTitle: '🌅 Горизонт',
      reqStage,
      epoch
    });
  });
}
