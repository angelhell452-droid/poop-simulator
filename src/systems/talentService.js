import { GAME } from '../core/state.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js';
import { events } from '../core/events.js';
import { isTalentVisible } from '../progression/unlocks.js';
import { bigPow, cmp, div, gte, isBig, log10Of, mul, rehydrateBig, sub } from '../utils/big.js?v=5.0.80';

/**
 * Calculates sum of geometric progression for talent costs:
 * S = c0 * (r^count - 1) / (r - 1), where c0 = baseCost * r^startLevel
 */
export function calcTalentSumCost(baseCost, r, startLevel, count) {
  if (count <= 0) return 0;
  const c0 = mul(baseCost, bigPow(r, startLevel));
  if (count === 1) {
    return isBig(c0) ? c0 : Math.floor(c0);
  }
  const rPow = bigPow(r, count);
  const num = mul(c0, sub(rPow, 1));
  const s = div(num, r - 1);
  return isBig(s) ? s : Math.floor(s);
}

export function getAffordableTalentInfo(tl) {
  const isInfinite = !Number.isFinite(tl.max);
  const remainingLevels = isInfinite ? Infinity : Math.max(0, tl.max - tl.level);
  const r = tl.costMult || 1.3;
  const nextCost = mul(tl.cost, bigPow(r, tl.level));
  const normalizedNextCost = isBig(nextCost) ? nextCost : Math.floor(nextCost);

  if (!isInfinite && remainingLevels <= 0) {
    return { count: 0, totalCost: 0, canBuy: false, maxed: true, nextCost: normalizedNextCost };
  }

  const rawMult = GAME.buyMultiplier;
  const isMax = (rawMult === 'max' || rawMult === 'MAX');
  const rolls = rehydrateBig(GAME.prestigeRolls || 0);

  // If user cannot afford even 1 level
  if (cmp(rolls, normalizedNextCost) < 0) {
    const desiredCount = isMax ? 1 : Math.min(remainingLevels, parseInt(rawMult) || 1);
    const targetCount = Math.max(1, desiredCount);
    const costForTarget = calcTalentSumCost(tl.cost, r, tl.level, targetCount);
    return {
      count: targetCount,
      totalCost: costForTarget,
      canBuy: false,
      maxed: false,
      nextCost: normalizedNextCost
    };
  }

  if (isMax) {
    // Logarithmic calculation for Buy MAX:
    // r^k - 1 <= rolls * (r - 1) / c0
    const logR = log10Of(rolls);
    const logC0 = log10Of(normalizedNextCost);
    const logRatio = logR - logC0;

    let k = 1;
    if (logRatio > 6) {
      // Very large rolls ratio
      const logX = logRatio + Math.log10(r - 1);
      k = Math.floor(logX / Math.log10(r));
    } else {
      const numRatio = (typeof rolls === 'number' && typeof normalizedNextCost === 'number')
        ? (rolls / normalizedNextCost)
        : Math.pow(10, logRatio);
      const valInside = 1 + numRatio * (r - 1);
      k = Math.floor(Math.log(Math.max(1, valInside)) / Math.log(r));
    }

    if (!Number.isFinite(k) || k < 1) k = 1;
    if (!isInfinite && k > remainingLevels) k = remainingLevels;

    // Safety check around boundary
    let totalCost = calcTalentSumCost(tl.cost, r, tl.level, k);
    while (k > 1 && cmp(totalCost, rolls) > 0) {
      k--;
      totalCost = calcTalentSumCost(tl.cost, r, tl.level, k);
    }
    while ((isInfinite || k < remainingLevels)) {
      const nextTestCost = calcTalentSumCost(tl.cost, r, tl.level, k + 1);
      if (cmp(rolls, nextTestCost) >= 0) {
        k++;
        totalCost = nextTestCost;
      } else {
        break;
      }
    }

    const canBuy = k > 0 && gte(rolls, totalCost);
    return {
      count: k,
      totalCost,
      canBuy,
      maxed: false,
      nextCost: normalizedNextCost
    };
  }

  // Fixed count (1, 5, 10, etc.)
  const targetCount = Math.min(remainingLevels, Math.max(1, parseInt(rawMult) || 1));
  const totalCost = calcTalentSumCost(tl.cost, r, tl.level, targetCount);
  const canBuy = gte(rolls, totalCost);

  return {
    count: targetCount,
    totalCost,
    canBuy,
    maxed: false,
    nextCost: normalizedNextCost
  };
}

export function buyTalent(talentId) {
  const tl = TALENTS.find(t => t.id === talentId);
  if (!tl || !isTalentVisible(tl)) return false;

  const tlInfo = getAffordableTalentInfo(tl);
  if (!tlInfo.canBuy || tlInfo.count <= 0) return false;

  GAME.prestigeRolls = sub(GAME.prestigeRolls, tlInfo.totalCost);
  tl.level = (tl.level || 0) + tlInfo.count;

  events.emit('talent:purchased', { talent: tl, levelsAdded: tlInfo.count });
  return true;
}
