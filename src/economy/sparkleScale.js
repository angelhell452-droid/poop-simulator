import { ECONOMY, caseSparkleStackGrowthPerBt } from './economy.config.js?v=5.4.31';
import { bigPow, log10Of, pow10, rehydrateBig } from '../utils/big.js?v=5.4.31';

/** Epoch 1 stays at x1. Kept for legacy UI / old meteor purse helpers. */
export function getSparkleEpochMult(epoch) {
  const n = Math.max(1, Math.floor(Number(epoch) || 1));
  const base = Math.max(1, Number(ECONOMY.sparkleEpochBase) || 1);
  return bigPow(base, n - 1);
}

/**
 * Model CPS along the harmony axis (legacy helper; not used for ✨ income anymore).
 */
export function modelCpsForSparkles(evoStage = 0) {
  const stage = Math.max(0, Number(evoStage) || 0);
  const step = Math.max(1, Number(ECONOMY.factoryFormStep) || 850);
  const k = Math.max(1.01, Number(ECONOMY.tierGrowthK) || 3.8);
  const base = Math.max(1, Number(ECONOMY.factoryBaseCps) || 80);
  const raw = base * Math.pow(k, stage / step);
  if (!Number.isFinite(raw) || raw <= 0) return base;
  return raw;
}

/** Legacy CPS→✨ curve (unused by crit/meteor income). */
export function sparkleMultFromCps(cps) {
  const ref = Math.max(1, Number(ECONOMY.sparkleCpsRef) || 80);
  const exp = Number(ECONOMY.sparkleCpsExponent);
  const exponent = Number.isFinite(exp) ? exp : 0.55;
  const cpsVal = rehydrateBig(cps || 0);
  const cpsLog = Math.max(0, log10Of(cpsVal) - Math.log10(ref));
  if (!Number.isFinite(cpsLog) || cpsLog <= 0) return 1;
  return pow10(cpsLog * exponent);
}

/** Legacy: form-progress ✨ mult (unused by crit/meteor income). */
export function sparkleMultFromProgress(evoStage = 0) {
  return sparkleMultFromCps(modelCpsForSparkles(evoStage));
}

/**
 * ✨ за один крит у джекпота кейса тира (1-based).
 * Растёт тем же шагом, что и цена кейса — свой кейс всегда фармится ровнее следующего.
 */
export function caseTierJackpotSparkle(tierNumber) {
  const tier = Math.max(1, Math.floor(Number(tierNumber) || 1));
  const base = Math.max(1, Number(ECONOMY.sparkleCritBase) || 5);
  const growth = Math.max(1.01, caseSparkleStackGrowthPerBt());
  const raw = base * Math.pow(growth, tier - 1);
  if (!Number.isFinite(raw) || raw <= 0) return base;
  return Math.max(1, Math.round(raw));
}

/**
 * ✨ за один крит от экипированного ножа (без эпохи / BT / CPS формы).
 * @param {object|null} knife
 * @param {number} starLevel 1-based star
 * @param {{ gambler?: boolean }} [opts]
 */
export function getSparklesPerCrit(knife, starLevel = 1, opts = {}) {
  const star = Math.max(1, Math.floor(Number(starLevel) || 1));
  const starStep = Number(ECONOMY.sparkleStarStep);
  const starMult = 1 + Math.max(0, star - 1) * (Number.isFinite(starStep) ? starStep : 0.05);
  const gamblerMult = opts.gambler ? 2 : 1;
  let knifeMult;
  if (knife) {
    knifeMult = Math.max(1, Number(knife.sparkleMult) || 1);
  } else {
    const bare = Number(ECONOMY.sparkleNoKnifeMult);
    knifeMult = Number.isFinite(bare) ? Math.max(0.25, bare) : 0.5;
  }
  const raw = knifeMult * starMult * gamblerMult;
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  return Math.max(1, Math.round(raw));
}

function rollCritPack(minKey, maxKey, minFallback, maxFallback) {
  const loRaw = Number(ECONOMY[minKey]);
  const hiRaw = Number(ECONOMY[maxKey]);
  const lo = Number.isFinite(loRaw) ? loRaw : minFallback;
  const hi = Number.isFinite(hiRaw) ? hiRaw : maxFallback;
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  return a + Math.random() * (b - a);
}

/**
 * ✨ с золотого метеора / звездопада: N крит-пачек того же ножа.
 * Метеориты для всех; VIP только автосбор.
 */
export function getMeteorSparkleGain(knife, starLevel = 1, opts = {}) {
  const perCrit = getSparklesPerCrit(knife, starLevel, { gambler: false });
  const shower = !!opts.shower;
  const packs = shower
    ? rollCritPack('meteorShowerCritPackMin', 'meteorShowerCritPackMax', 3, 6)
    : rollCritPack('meteorCritPackMin', 'meteorCritPackMax', 8, 15);
  const loot = Math.max(0.25, Number(opts.lootMult) || 1);
  const talent = Math.max(0.25, Number(opts.talentMult) || 1);
  const raw = perCrit * packs * loot * talent;
  const floor = shower ? 12 : 40;
  if (!Number.isFinite(raw) || raw <= 0) return floor;
  return Math.max(floor, Math.round(raw));
}
