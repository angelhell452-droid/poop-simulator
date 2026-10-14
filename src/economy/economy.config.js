/**
 * Единая ось баланса «Идеальная Гармония».
 * Меняй числа здесь — формы, заводы, смывы и блестяшки читают этот файл.
 * Сила клика/пассива ножей — в src/data/knifeBalance.config.js.
 *
 * Форма — корень прогрессии. Цена формы ≈ formBuySeconds секунд модельного CPS.
 * Заводы и формы растут на tierGrowthK за каждый шаг factoryFormStep форм.
 * Кейсы: строго 1 кейс на 1 прорыв (кейс #N → прорыв N-1, форма 1 + (N-1)*1000).
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
  // Строго 1 кейс = 1 прорыв. Кейс index 0 при BT 0; каждый следующий — +1 прорыв / +1000 форм.
  caseFormStep: 1000,
  // База цены в блестяшках (~доля meteorPurseBase), чтобы метеор не покупал кейс сразу.
  caseSparkleCostBase: 3200,
  caseSparkleCostGrowth: 0.62,

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
 * Строго: кейс #1 → форма 1 / BT 0; кейс #2 → форма 1001 / BT 1; …
 */
export function caseUnlockForm(caseIndex) {
  const idx = Math.max(0, Math.floor(Number(caseIndex) || 0));
  return 1 + idx * ECONOMY.caseFormStep;
}

/** Прорыв для формы кейса: floor((form-1)/1000) — совпадает с индексом кейса. */
export function caseUnlockBreakthrough(reqForm) {
  return Math.max(0, Math.floor((Math.max(1, reqForm) - 1) / 1000));
}

/**
 * Цена кейса в блестяшках.
 * База ~caseSparkleCostBase (выше типичного метеора early), рост K^ (idx * growth).
 */
export function caseSparkleCost(caseIndex) {
  const idx = Math.max(0, Math.floor(Number(caseIndex) || 0));
  const k = Math.max(1, Number(ECONOMY.tierGrowthK) || 3.8);
  const base = Math.max(500, Number(ECONOMY.caseSparkleCostBase) || 3200);
  const growth = Number(ECONOMY.caseSparkleCostGrowth);
  const exp = Number.isFinite(growth) ? growth : 0.62;
  return Math.max(base, Math.round(base * Math.pow(k, idx * exp)));
}

/** Доп. цена кейса в вантузах (с 8-го прорыва). */
export function casePlungerCost(caseIndex) {
  const idx = Math.max(0, Math.floor(Number(caseIndex) || 0));
  const bt = caseUnlockBreakthrough(caseUnlockForm(idx));
  if (bt < 8) return 0;
  return Math.max(1, Math.round(Math.pow(1.55, bt - 8)));
}
