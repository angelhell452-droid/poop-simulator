import { GAME } from '../core/state.js?v=5.0.35';
import { EVOLUTIONS } from '../data/evolutions.data.js?v=5.0.35';
import { TALENTS } from '../data/talents.data.js';
import { maxUnlockedStage } from '../progression/phases.data.js?v=5.0.35';
import { add, div, gte, isBig, log10Of, mul, sub } from '../utils/big.js?v=5.0.35';

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

  const unlockedCap = Math.min(EVOLUTIONS.length - 1, maxUnlockedStage(GAME.totalTranscend || 0));
  if (GAME.evoStage >= EVOLUTIONS.length - 1) {
    return { count: 0, totalCost: 0, canBuy: false, maxReached: true, phaseLocked: false };
  }
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
    return { count: 1, totalCost: nextCost, canBuy: false, maxReached: false };
  }

  const canBuy = count > 0 && gte(GAME.biomass, totalCost);
  return { count, totalCost, canBuy: canBuy && count > 0, maxReached: false };
}

export function getAffordableFactoryInfo(fac) {
  const r = 1.15;
  const currentCount = fac.count || 0;
  const isTycoon = GAME.archetype === 'tycoon';
  const discountFactor = getAsymptoticDiscountFactor([isTycoon ? 0.10 : 0], 0.90);
  const baseCost = mul(fac.cost, discountFactor);
  const rawMult = GAME.buyMultiplier;
  const isMax = (rawMult === 'max' || rawMult === 'MAX');
  const costCurrent = mul(baseCost, Math.pow(r, currentCount));
  const plain = !isBig(costCurrent) && !isBig(GAME.biomass) && Number.isFinite(costCurrent);

  if (plain) {
    if (isMax) {
      if (GAME.biomass < costCurrent) {
        return { count: 1, totalCost: Math.round(costCurrent), singleCost: Math.round(costCurrent), canBuy: false };
      }
      let maxM = Math.floor(Math.log(1 + (GAME.biomass * (r - 1)) / costCurrent) / Math.log(r));
      maxM = Math.max(1, Math.min(100000, maxM));
      let totalCost = Math.round(costCurrent * (Math.pow(r, maxM) - 1) / (r - 1));
      while (totalCost > GAME.biomass && maxM > 1) {
        maxM--;
        totalCost = Math.round(costCurrent * (Math.pow(r, maxM) - 1) / (r - 1));
      }
      return { count: maxM, totalCost, singleCost: Math.round(costCurrent), canBuy: GAME.biomass >= totalCost && maxM > 0 };
    }
    const count = parseInt(rawMult) || 1;
    const totalCost = count === 1
      ? Math.round(costCurrent)
      : Math.round(costCurrent * (Math.pow(r, count) - 1) / (r - 1));
    return { count, totalCost, singleCost: Math.round(costCurrent), canBuy: GAME.biomass >= totalCost };
  }

  const series = (n) => {
    if (n <= 1) return costCurrent;
    return mul(costCurrent, (Math.pow(r, n) - 1) / (r - 1));
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
