import { GAME } from '../core/state.js?v=5.0.80';
import { EVOLUTIONS } from '../data/evolutions.data.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js';
import { maxUnlockedStage } from '../progression/phases.data.js?v=5.0.80';
import { add, bigPow, div, gte, isBig, log10Of, mul, sub } from '../utils/big.js?v=5.0.80';
import { hasPerk } from '../data/perks.data.js';
import { getRelicLevel } from '../data/relics.data.js?v=5.0.80';

/**
 * Asymptotic discount model with soft-cap guarantee.
 * Ensures total discount never exceeds maxCap (default 90%) and base cost never drops below 10%.
 */
export function getAsymptoticDiscountFactor(rawDiscounts = [], maxCap = 0.90) {
  let retention = 1.0;
  for (const d of rawDiscounts) {
    if (d > 0) {
      retention *= Math.max(0, 1 - Math.min(0.999, d));
    }
  }
  const minRetention = Math.round((1.0 - maxCap) * 1000) / 1000;
  return Math.max(minRetention, minRetention + maxCap * retention);
}

export function getAffordableEvoInfo() {
  const omegaTalent = TALENTS.find(t => t.id === 'omega_destiny');
  const unbreakEvo = TALENTS.find(t => t.id === 'unbreakable_evo');

  const omegaDisc = omegaTalent ? (1 - Math.pow(0.98, omegaTalent.level)) : 0;
  const unbreakRaw = (unbreakEvo && unbreakEvo.level > 0) ? (1 - Math.pow(0.985, unbreakEvo.level)) : 0;

  const unlockedCap = maxUnlockedStage(GAME.breakthroughCount ?? GAME.totalTranscend ?? 0);
  if (GAME.evoStage >= unlockedCap) {
    return { count: 0, totalCost: 0, canBuy: false, maxReached: false, phaseLocked: true };
  }

  const rawMult = GAME.buyMultiplier;
  const isMax = (rawMult === 'max' || rawMult === 'MAX');
  const targetCount = isMax ? (unlockedCap - GAME.evoStage) : (parseInt(rawMult) || 1);

  let totalCost = 0;
  let count = 0;
  let currBio = GAME.biomass;

  for (let s = GAME.evoStage + 1; s <= unlockedCap; s++) {
    const discs = [];
    if (s >= 3999 && omegaDisc > 0) discs.push(omegaDisc);
    if (s >= 5000 && unbreakRaw > 0) discs.push(unbreakRaw);
    const costDiscount = getAsymptoticDiscountFactor(discs, 0.90);
    const rawCost = mul(EVOLUTIONS[s].cost, costDiscount);
    const cost = isBig(rawCost) ? rawCost : Math.max(1, Math.floor(rawCost));
    if (isMax) {
      if (gte(currBio, cost)) {
        currBio = sub(currBio, cost);
        totalCost = add(totalCost, cost);
        count++;
      } else {
        break;
      }
    } else {
      if (count < targetCount) {
        totalCost = add(totalCost, cost);
        count++;
      } else {
        break;
      }
    }
  }

  if (count === 0) {
    const nextStage = GAME.evoStage + 1;
    const nextDiscs = [];
    if (nextStage >= 3999 && omegaDisc > 0) nextDiscs.push(omegaDisc);
    if (nextStage >= 5000 && unbreakRaw > 0) nextDiscs.push(unbreakRaw);
    const rawNext = mul(EVOLUTIONS[nextStage].cost, getAsymptoticDiscountFactor(nextDiscs, 0.90));
    const nextCost = isBig(rawNext) ? rawNext : Math.max(1, Math.floor(rawNext));
    return { count: 1, totalCost: nextCost, canBuy: false, maxReached: false, phaseLocked: false };
  }

  const canBuy = count > 0 && gte(GAME.biomass, totalCost);
  return { count, totalCost, canBuy: canBuy && count > 0, maxReached: false, phaseLocked: false };
}

export function getFactoryBaseCost(fac) {
  const isTycoon = GAME.archetype === 'tycoon';
  const discountFactor = getAsymptoticDiscountFactor([isTycoon ? 0.10 : 0], 0.90);
  return mul(fac.cost, discountFactor);
}

export function getAffordableFactoryInfo(fac) {
  const exponentReduction = getRelicLevel('relic_cost_exponent_reduction') * 0.01;
  const baseR = hasPerk('perk_alchemical_mutation') ? 1.37 : 1.4;
  const r = Math.max(1.05, baseR - exponentReduction);
  const currentCount = fac.count || 0;
  const baseCost = getFactoryBaseCost(fac);
  const rawMult = GAME.buyMultiplier;
  const isMax = (rawMult === 'max' || rawMult === 'MAX');
  const costCurrent = mul(baseCost, bigPow(r, currentCount));

  const series = (n) => {
    if (n <= 1) return costCurrent;
    const rn = bigPow(r, n);
    const num = sub(rn, 1);
    return mul(costCurrent, div(num, r - 1));
  };

  if (isMax) {
    if (!gte(GAME.biomass, costCurrent)) {
      return { count: 1, totalCost: costCurrent, singleCost: costCurrent, canBuy: false };
    }
    const inside = add(1, div(mul(GAME.biomass, r - 1), costCurrent));
    let maxM = Math.floor(log10Of(inside) / Math.log10(r));
    maxM = Math.max(1, Math.min(100000, Number.isFinite(maxM) ? maxM : 1));
    let totalCost = series(maxM);
    while (!gte(GAME.biomass, totalCost) && maxM > 1) {
      maxM--;
      totalCost = series(maxM);
    }
    return { count: maxM, totalCost, singleCost: costCurrent, canBuy: gte(GAME.biomass, totalCost) && maxM > 0 };
  }

  const count = parseInt(rawMult) || 1;
  const totalCost = series(count);
  return { count, totalCost, singleCost: costCurrent, canBuy: gte(GAME.biomass, totalCost) };
}
