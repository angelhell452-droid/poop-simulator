/**
 * Единая ось баланса «Идеальная Гармония».
 * Меняй числа здесь — формы, заводы, смывы и блестяшки читают этот файл.
 * Сила клика/пассива ножей — в src/data/knifeBalance.config.js.
 *
 * Форма — корень прогрессии. Цена формы ≈ formBuySeconds секунд модельного CPS.
 * Заводы и формы растут на tierGrowthK за каждый шаг factoryFormStep форм.
 * Кейсы: 3 ранних онбординг, дальше 1 кейс на 1 прорыв (шаг caseFormStep = 1000 форм).
 * Смывы: flushPowerBase ^ число_смывов → «Эхо смыва».
 */
export const ECONOMY = {
  // --- Смывы ---
  // Эхо смыва: Math.pow(flushPowerBase, flushes). 1.18 = +18% к доходу за каждый смыв.
  flushPowerBase: 1.18,

  // --- Степенная ось (заводы + формы) ---
  // Множитель роста стоимости/дохода за один тир завода.
  tierGrowthK: 3.8,
  // База первой фабрики (тир 1).
  factoryBaseCost: 20,
  factoryBaseCps: 80,
  // Новый завод каждые N форм (диапазон ТЗ: 700–1000).
  factoryFormStep: 850,
  // Сколько секунд модельного CPS стоит одна форма (диапазон ТЗ: 20–30).
  formBuySeconds: 25,
  // Цена одного уровня формы: factoryBaseCps * formBuySeconds (= formBaseCost).
  // Порог формы i — накопленная сумма: base * flushMult * (r^i - 1)/(r - 1),
  // r = K^(1/factoryFormStep). Прирост соседних уровней ≈ base * K^(stage/step) * flushMult.
  get formBaseCost() {
    return this.factoryBaseCps * this.formBuySeconds;
  },

  // --- Кейсы ---
  // После 3 онбординг-кейсов: 1 кейс = 1 прорыв (шаг форм = 1000).
  caseFormStep: 1000,
  // Сколько кейсов доступны до первого прорыва.
  caseEarlyCount: 3,

  // --- Блестяшки ---
  // Эпоха 1 = x1. Каждая следующая эпоха * sparkleEpochBase.
  // 1.35 вместо 1.5 — мягче разгон по эпохам (форма ~3000 = эпоха 6).
  sparkleEpochBase: 1.35,
  sparkleBreakthroughStep: 0.25,
  sparkleStarStep: 0.05,
  // SparklesIncome ∝ CPS^sparkleCpsExponent. Нормализация к sparkleCpsRef (CPS тира 1).
  // 0.55 вместо 0.8 — late-game CPS больше не раздувает блестяшки до уровня биомассы.
  sparkleCpsExponent: 0.55,
  sparkleCpsRef: 80,

  // --- Метеориты ---
  meteorPurseBase: 5400,
  meteorSliceMin: 0.10,
  meteorSliceMax: 0.18,
  meteorEpochWalk: 0.5,
  meteorFlushCap: 0.35
};

/** Лог10 базовой цены завода тира k (1-based). */
export function factoryCostLog10(tierNumber) {
  const k = Math.max(1, Math.floor(Number(tierNumber) || 1));
  return Math.log10(ECONOMY.factoryBaseCost) + (k - 1) * Math.log10(ECONOMY.tierGrowthK);
}

/** Лог10 базового CPS завода тира k (1-based). */
export function factoryCpsLog10(tierNumber) {
  const k = Math.max(1, Math.floor(Number(tierNumber) || 1));
  return Math.log10(ECONOMY.factoryBaseCps) + (k - 1) * Math.log10(ECONOMY.tierGrowthK);
}

/** Целевая форма разблокировки завода (1-based form). */
export function factoryUnlockForm(tierNumber) {
  const k = Math.max(1, Math.floor(Number(tierNumber) || 1));
  if (k <= 1) return 1;
  return 1 + Math.round((k - 1) * ECONOMY.factoryFormStep);
}

/**
 * Целевая форма кейса по индексу (0-based).
 * Первые 3 кейса — онбординг; дальше 1 кейс на 1 прорыв (шаг 1000 форм).
 */
export function caseUnlockForm(caseIndex) {
  const idx = Math.max(0, Math.floor(Number(caseIndex) || 0));
  const early = [1, 40, 150];
  if (idx < early.length) return early[idx];
  return 1 + (idx - 2) * ECONOMY.caseFormStep;
}

/** Минимальный прорыв, чтобы форма кейса была достижима: floor((form-1)/1000). */
export function caseUnlockBreakthrough(reqForm) {
  return Math.max(0, Math.floor((Math.max(1, reqForm) - 1) / 1000));
}

/** Цена кейса в блестяшках по индексу (0-based). */
export function caseSparkleCost(caseIndex) {
  const idx = Math.max(0, Math.floor(Number(caseIndex) || 0));
  const k = Math.max(1, Number(ECONOMY.tierGrowthK) || 3.8);
  return Math.max(20, Math.round(45 * Math.pow(k, idx * 0.42)));
}

/** Доп. цена кейса в вантузах (0 пока breakthrough меньше 8). */
export function casePlungerCost(caseIndex) {
  const idx = Math.max(0, Math.floor(Number(caseIndex) || 0));
  const bt = caseUnlockBreakthrough(caseUnlockForm(idx));
  if (bt < 8) return 0;
  return Math.max(1, Math.round(Math.pow(1.55, bt - 8)));
}
