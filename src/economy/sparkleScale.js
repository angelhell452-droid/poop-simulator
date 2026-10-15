import { ECONOMY } from './economy.config.js?v=5.4.20';
import { bigPow, log10Of, pow10, rehydrateBig } from '../utils/big.js?v=5.4.20';

/** Epoch 1 stays at x1. Later epochs use sparkleEpochBase from economy.config.js. */
export function getSparkleEpochMult(epoch) {
  const n = Math.max(1, Math.floor(Number(epoch) || 1));
  const base = Math.max(1, Number(ECONOMY.sparkleEpochBase) || 1);
  return bigPow(base, n - 1);
}

/**
 * Model CPS along the harmony axis (1× factory tier at current form).
 * Used for sparkles — NOT full getPassiveIncome() (turbo/stacks/flush would explode ✨).
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

/**
 * SparklesIncome ∝ CPS^sparkleCpsExponent, normalized to sparkleCpsRef.
 * Never uses Math.pow(10, huge) — goes through Big pow10.
 */
export function sparkleMultFromCps(cps) {
  const ref = Math.max(1, Number(ECONOMY.sparkleCpsRef) || 80);
  const exp = Number(ECONOMY.sparkleCpsExponent);
  const exponent = Number.isFinite(exp) ? exp : 0.55;
  const cpsVal = rehydrateBig(cps || 0);
  const cpsLog = Math.max(0, log10Of(cpsVal) - Math.log10(ref));
  if (!Number.isFinite(cpsLog) || cpsLog <= 0) return 1;
  const mult = pow10(cpsLog * exponent);
  return mult;
}

/** Sparkle CPS mult from form progress (harmony model), not wallet income. */
export function sparkleMultFromProgress(evoStage = 0) {
  return sparkleMultFromCps(modelCpsForSparkles(evoStage));
}
