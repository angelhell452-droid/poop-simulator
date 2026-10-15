/**
 * Единая ось баланса «Идеальная Гармония».
 * Меняй числа здесь — формы, заводы, смывы и блестяшки читают этот файл.
 * Сила клика/пассива ножей — в src/data/knifeBalance.config.js.
 *
 * Форма — корень прогрессии. Цена формы ≈ formBuySeconds секунд модельного CPS.
 * Модельный CPS включает пол пассива джекпота кейса текущего BT (formScaleWithCaseKnife).
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
  // Доход × пассив ножа — порог × джекпот кейса текущего BT (слабый нож тормозит, джекпот ≈ нормальный темп).
  formScaleWithCaseKnife: true,

  // --- Кейсы ---
  // Строго 1 кейс = 1 прорыв. Кейс index 0 при BT 0; каждый следующий — +1 прорыв / +1000 форм.
  caseFormStep: 1000,
  // Замер: типичный стек ✨ к форме 1000 / перед 1-м прорывом (~5–10 мин активного ранa).
  caseSparkleStackAtBt1: 40000,
  // Доля стека на кейс (остаток на перки/заточку/шапки).
  caseSparkleSinkRatio: 0.72,
  // Кейс #1 (BT 0): онбординг — доля стека BT1, не полный слив.
  caseSparkleCase0Ratio: 0.08,

  // --- Блестяшки (приток только от ножа; эпоха/BT/CPS формы больше не кормят ✨) ---
  // ✨ за крит у джекпота кейса тира 1. Дальше × caseSparkleStackGrowthPerBt()^tier.
  sparkleCritBase: 5,
  // Без ножа — слабый онбординг на кейс #1.
  sparkleNoKnifeMult: 0.5,
  // Мягкий буст от звёзд заточки (+5% за уровень выше 1).
  sparkleStarStep: 0.05,
  // Золотой метеор = столько «крит-пачек» того же ножа (для всех; VIP лишь автосбор).
  meteorCritPackMin: 8,
  meteorCritPackMax: 15,
  // Звездопад слабее золотого.
  meteorShowerCritPackMin: 3,
  meteorShowerCritPackMax: 6,
  // Legacy keys (цены кейсов / старые формулы) — не множат кликовый приток ✨.
  sparkleEpochBase: 1.35,
  sparkleBreakthroughStep: 0.25,
  sparkleCpsExponent: 0.55,
  sparkleCpsRef: 80,

  // --- Метеориты (спавн/лут-баффы; размер ✨ пачки — от ножа, см. выше) ---
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
 * Во сколько раз стек/цена кейса и ✨-доход джекпота растут за один тир кейса.
 * Приток ✨ привязан к ножу — рост = шаг силы ножа (K^0.35), без эпохи/CPS формы.
 */
export function caseSparkleStackGrowthPerBt() {
  const k = Math.max(1.01, Number(ECONOMY.tierGrowthK) || 3.8);
  return Math.pow(k, 0.35);
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
