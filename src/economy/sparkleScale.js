/**
 * Geometric sparkle growth by epoch.
 * Epoch 1 stays at x1, so the opening of the game does not move.
 * 1.74 is the base that keeps a form-9500 session (4M today) able to buy
 * Wildfire (2.7B) around form 7200 without flattening early epochs.
 */
export const SPARKLE_EPOCH_BASE = 1.74;

export function getSparkleEpochMult(epoch) {
  const n = Math.max(1, Math.floor(Number(epoch) || 1));
  return Math.pow(SPARKLE_EPOCH_BASE, n - 1);
}
