/**
 * Конфигурация баланса и множителей ножей.
 *
 * Позволяет разработчику гибко регулировать силу ножей:
 * - globalMultiplier: Общий множитель для всех ножей (по умолчанию 1.0).
 *   Установите 1.2 (+20%), 1.5 (+50%) или 0.8 (-20%), чтобы мгновенно изменить силу всех ножей в игре.
 * - clickMultiplier: Дополнительный множитель силы клика от ножей (по умолчанию 1.0).
 * - passiveMultiplier: Дополнительный множитель пассивного дохода CPS от ножей (по умолчанию 1.0).
 * - softCapEnabled: Мягкое ограничение сверхвысоких множителей (false - отключено для полной силы).
 */
export const KNIFE_BALANCE_CONFIG = {
  // Главный глобальный регулятор силы ножей:
  globalMultiplier: 1.0,

  // Раздельная калибровка направлений:
  clickMultiplier: 1.0,
  passiveMultiplier: 1.0,

  // Мягкий кап отключен для полноценного бесконечного айдлера:
  softCapEnabled: false,
  clickKnee: 1000000,
  clickPower: 0.65,
  passiveKnee: 2.0,
  passivePower: 0.28
};

import { mul } from '../utils/big.js?v=5.4.18';
import { ECONOMY } from '../economy/economy.config.js?v=5.4.18';

/** Pool slot weights: common → jackpot (1%). */
const CASE_SLOT_WEIGHTS = [0.28, 0.42, 0.58, 0.78, 1.0];

/**
 * Target jackpot passiveMult for case tier (1-based).
 * Tier N jackpot is strictly above tier N-1 (no shared early floor that flattened T1=T2).
 * Growth ~K^0.35 per tier — softer than factory CPS, clear step between cases.
 */
export function caseTierJackpotPassive(tierNumber) {
  const tier = Math.max(1, Math.floor(Number(tierNumber) || 1));
  const k = Math.max(1.01, Number(ECONOMY.tierGrowthK) || 3.8);
  const tier1Jackpot = 5;
  const perTier = Math.pow(k, 0.35);
  return Math.max(tier, Math.round(tier1Jackpot * Math.pow(perTier, tier - 1)));
}

/**
 * Rewrite knife click/passive/sparkle stats from their case pool slot
 * so case rewards match the harmony economy axis.
 */
export function syncKnivesToCaseTiers(cases, knives) {
  if (!Array.isArray(cases) || !Array.isArray(knives)) return;
  const byId = new Map(knives.map(k => [k.id, k]));

  for (let index = 0; index < cases.length; index++) {
    const c = cases[index];
    const tier = Math.max(1, Number(c.tierNumber) || (index + 1));
    const jackpotPassive = caseTierJackpotPassive(tier);
    const pool = c.pool || [];

    for (let slot = 0; slot < pool.length; slot++) {
      const knife = byId.get(pool[slot]);
      if (!knife) continue;
      const weight = CASE_SLOT_WEIGHTS[Math.min(slot, CASE_SLOT_WEIGHTS.length - 1)];
      const passiveMult = Math.max(1, Math.round(jackpotPassive * weight));
      const clickMult = Math.max(2, Math.round(2.2 * passiveMult));
      const sparkleMult = Math.round((1 + 0.35 * Math.log10(passiveMult + 1)) * 100) / 100;
      knife.passiveMult = passiveMult;
      knife.clickMult = clickMult;
      knife.sparkleMult = sparkleMult;
      knife.cpsBonus = Math.max(0, Math.round(passiveMult));
    }
  }
}

/**
 * Возвращает фактический базовый множитель клика ножа с учётом глобального баланса.
 */
export function getKnifeEffectiveClickMult(knife) {
  if (!knife) return 1;
  const raw = knife.clickMult || 1;
  const cfg = (KNIFE_BALANCE_CONFIG.globalMultiplier || 1) * (KNIFE_BALANCE_CONFIG.clickMultiplier || 1);
  return mul(raw, cfg);
}

/**
 * Возвращает фактический базовый пассивный множитель ножа с учётом глобального баланса.
 */
export function getKnifeEffectivePassiveMult(knife) {
  if (!knife) return 1;
  const raw = knife.passiveMult || 1;
  const cfg = (KNIFE_BALANCE_CONFIG.globalMultiplier || 1) * (KNIFE_BALANCE_CONFIG.passiveMultiplier || 1);
  return mul(raw, cfg);
}
