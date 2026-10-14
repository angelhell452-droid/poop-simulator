import { ECONOMY } from './economy.config.js?v=5.4.5';

/** Epoch 1 stays at x1. Later epochs use sparkleEpochBase from economy.config.js. */
export function getSparkleEpochMult(epoch) {
  const n = Math.max(1, Math.floor(Number(epoch) || 1));
  const base = Math.max(1, Number(ECONOMY.sparkleEpochBase) || 1);
  return Math.pow(base, n - 1);
}
