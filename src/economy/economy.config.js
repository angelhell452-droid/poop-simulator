/**
 * Единая ось баланса «Идеальная Гармония».
 * Меняй числа здесь — формы, заводы, смывы и блестяшки читают этот файл.
 * Сила клика/пассива ножей — в src/data/knifeBalance.config.js.
 *
 * Форма — корень прогрессии. Цена формы ≈ formBuySeconds секунд модельного CPS.
 * Заводы и формы растут на tierGrowthK за каждый шаг factoryFormStep форм.
 * Кейсы: строго 1 кейс на 1 прорыв; цена = доля ожидаемого стека блестяшек к этому BT.
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
  // Секунды модельного CPS на одну форму. 90 (было 25): авто-MAX заводов не пролетает 2k форм за полминуты.
  formBuySeconds: 90,
  // Цена одного уровня формы: factoryBaseCps * formBuySeconds (= formBaseCost).
  // Порог формы i — накопленная сумма: base * flushMult * (r^i - 1)/(r - 1),
  // r = K^(1/factoryFormStep). Прирост соседних уровней ≈ base * K^(stage/step) * flushMult.
  get formBaseCost() {
    return this.factoryBaseCps * this.formBuySeconds;
  },
  // После N копий завода доход от доп. копий растёт с убывающей отдачей (автозакуп не = линейный ×40).
  factoryCopySoftcapKnee: 8,
  factoryCopySoftcapPower: 0.42,
  // Порог формы масштабируется бустом прорыва — тот же рычаг, что качает доход после BT.
  formScaleWithBreakthrough: true,
  // Доход × evo.mult (к форме ~2000 уже ~×48) — порог тоже, иначе окно после прорыва тает за секунды.
  formScaleWithEvoMult: true,

  // --- Кейсы ---
  // Строго 1 кейс = 1 прорыв. Кейс index 0 при BT 0; каждый следующий — +1 прорыв / +1000 форм.
  caseFormStep: 1000,
  // Замер: типичный стек ✨ к форме 1000 / перед 1-м прорывом (~5–10 мин активного ранa).
  caseSparkleStackAtBt1: 40000,
  // Доля стека на кейс (остаток на перки/заточку/шапки).
  caseSparkleSinkRatio: 0.72,
  // Кейс #1 (BT 0): онбординг — доля стека BT1, не полный слив.
  caseSparkleCase0Ratio: 0.08,

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

/**
 * Эффективное число копий завода для CPS: до knee — линейно, дальше power-softcap.
 * count=40, knee=8, power=0.42 → ≈ 8 + 32^0.42 ≈ 12 (вместо 40).
 */
export function effectiveFactoryCopyCount(count) {
  const n = Math.max(0, Number(count) || 0);
  const knee = Math.max(1, Number(ECONOMY.factoryCopySoftcapKnee) || 8);
  const power = Number(ECONOMY.factoryCopySoftcapPower);
  const p = Number.isFinite(power) && power > 0 ? Math.min(1, power) : 0.42;
  if (n <= knee) return n;
  return knee + Math.pow(n - knee, p);
}

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
 * Во сколько раз ожидаемый стек ✨ растёт за один прорыв.
 * Собирается из тех же рычагов, что и приток: epoch × (CPS^exp) × нож тира.
 */
export function caseSparkleStackGrowthPerBt() {
  const k = Math.max(1.01, Number(ECONOMY.tierGrowthK) || 3.8);
  const formStep = Math.max(1, Number(ECONOMY.caseFormStep) || 1000);
  const factoryStep = Math.max(1, Number(ECONOMY.factoryFormStep) || 850);
  const epochBase = Math.max(1, Number(ECONOMY.sparkleEpochBase) || 1.35);
  const cpsExp = Number(ECONOMY.sparkleCpsExponent);
  const exp = Number.isFinite(cpsExp) ? cpsExp : 0.55;

  // +1000 форм ≈ 2 эпохи по 500.
  const epochPerBt = Math.pow(epochBase, formStep / 500);
  // CPS вдоль гармонии ~ K^(forms/factoryStep); блестяшки ~ CPS^exp.
  const cpsPerBt = Math.pow(k, (formStep / factoryStep) * exp);
  // Джекпот ножа кейса растёт как K^0.25 за тир (см. knifeBalance sync).
  const knifePerBt = Math.pow(k, 0.25);
  // Мягкий blend: не перемножаем всё на 100%, иначе late costs улетают слишком жёстко.
  return epochPerBt * Math.pow(cpsPerBt, 0.9) * Math.pow(knifePerBt, 0.5);
}

/**
 * Ожидаемый стек блестяшек к моменту, когда открывается кейс index
 * (после набора форм окна предыдущего прорыва).
 * index 0 — онбординг; index 1 — якорь caseSparkleStackAtBt1 (~40k).
 */
export function expectedSparkleStackForCase(caseIndex) {
  const idx = Math.max(0, Math.floor(Number(caseIndex) || 0));
  const stack1 = Math.max(1000, Number(ECONOMY.caseSparkleStackAtBt1) || 40000);
  if (idx <= 0) {
    const r0 = Number(ECONOMY.caseSparkleCase0Ratio);
    const ratio = Number.isFinite(r0) ? r0 : 0.08;
    return Math.max(500, Math.round(stack1 * ratio));
  }
  const growth = caseSparkleStackGrowthPerBt();
  return Math.max(stack1, Math.round(stack1 * Math.pow(growth, idx - 1)));
}

/**
 * Цена кейса в блестяшках = sinkRatio × ожидаемый стек к этому BT.
 * Кейс #2 (index 1) ≈ 0.72 × 40k ≈ 28.8k — основной слив, остаток на перки.
 */
export function caseSparkleCost(caseIndex) {
  const idx = Math.max(0, Math.floor(Number(caseIndex) || 0));
  const sinkRaw = Number(ECONOMY.caseSparkleSinkRatio);
  const sink = Number.isFinite(sinkRaw) ? Math.min(0.95, Math.max(0.2, sinkRaw)) : 0.72;
  // Кейс #1 дешевле доли sink — онбординг.
  const ratio = idx <= 0
    ? 1
    : sink;
  const stack = expectedSparkleStackForCase(idx);
  return Math.max(idx <= 0 ? 500 : 1000, Math.round(stack * ratio));
}

/** Доп. цена кейса в вантузах (с 8-го прорыва). */
export function casePlungerCost(caseIndex) {
  const idx = Math.max(0, Math.floor(Number(caseIndex) || 0));
  const bt = caseUnlockBreakthrough(caseUnlockForm(idx));
  if (bt < 8) return 0;
  return Math.max(1, Math.round(Math.pow(1.55, bt - 8)));
}
