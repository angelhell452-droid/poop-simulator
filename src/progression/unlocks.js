import { GAME } from '../core/state.js?v=5.0.65';

export function accountForm() {
  return (GAME.evoStage || 0) + 1;
}

export function notePeakForm() {
  const form = accountForm();
  const peak = Math.max(Number(GAME.peakForm) || 1, form);
  GAME.peakForm = peak;
  return peak;
}

export function peakForm() {
  return Math.max(Number(GAME.peakForm) || 1, accountForm());
}

export function isCasesUnlocked() {
  return (GAME.totalPrestiges || 0) >= 1;
}

export function isBoutiqueUnlocked() {
  return peakForm() >= 100;
}

export function isShopOfferUnlocked(reqForm) {
  if (!isBoutiqueUnlocked()) return false;
  return peakForm() >= (reqForm || 100);
}

export function isRelicSectionUnlocked() {
  return (GAME.totalTranscend || 0) >= 1;
}

export function isTalentVisible(talent) {
  if ((GAME.totalPrestiges || 0) < (talent?.reqFlushes || 0)) return false;
  return (GAME.totalTranscend || 0) >= (talent?.reqTranscend || 0);
}
