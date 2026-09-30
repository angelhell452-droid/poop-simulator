import { GAME } from '../core/state.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { TALENTS } from '../data/talents.data.js';

export function getAffordableEvoInfo() {
  const omegaTalent = TALENTS.find(t => t.id === 'omega_destiny');
  let costDiscount = omegaTalent ? Math.pow(0.98, omegaTalent.level) : 1.0;
  const unbreakEvo = TALENTS.find(t => t.id === 'unbreakable_evo');
  if (unbreakEvo && unbreakEvo.level > 0) {
    costDiscount *= Math.pow(0.985, unbreakEvo.level);
  }

  if (GAME.evoStage >= EVOLUTIONS.length - 1) {
    return { count: 0, totalCost: 0, canBuy: false, maxReached: true };
  }

  const rawMult = GAME.buyMultiplier;
  const isMax = (rawMult === 'max' || rawMult === 'MAX');
  const targetCount = isMax ? 20000 : (parseInt(rawMult) || 1);

  let totalCost = 0;
  let count = 0;
  let currBio = GAME.biomass;

  for (let s = GAME.evoStage + 1; s < EVOLUTIONS.length; s++) {
    const cost = Math.max(1, Math.floor(EVOLUTIONS[s].cost * costDiscount));
    if (isMax) {
      if (currBio >= cost) {
        currBio -= cost;
        totalCost += cost;
        count++;
      } else {
        break;
      }
    } else {
      if (count < targetCount) {
        totalCost += cost;
        count++;
      } else {
        break;
      }
    }
  }

  if (count === 0) {
    const nextCost = Math.max(1, Math.floor(EVOLUTIONS[GAME.evoStage + 1].cost * costDiscount));
    return { count: 1, totalCost: nextCost, canBuy: false, maxReached: false };
  }

  const canBuy = count > 0 && GAME.biomass >= totalCost;
  return { count, totalCost, canBuy: canBuy && count > 0, maxReached: false };
}

export function getAffordableFactoryInfo(fac) {
  const r = 1.15;
  const currentCount = fac.count || 0;
  const isTycoon = GAME.archetype === 'tycoon';
  const discount = isTycoon ? 0.90 : 1.0;
  const baseCost = fac.cost * discount;
  const rawMult = GAME.buyMultiplier;
  const isMax = (rawMult === 'max' || rawMult === 'MAX');
  const costCurrent = baseCost * Math.pow(r, currentCount);

  if (isMax) {
    if (GAME.biomass < costCurrent) {
      return { count: 1, totalCost: Math.round(costCurrent), canBuy: false };
    }
    let maxM = Math.floor(Math.log(1 + (GAME.biomass * (r - 1)) / costCurrent) / Math.log(r));
    maxM = Math.max(1, Math.min(100000, maxM));
    let totalCost = Math.round(costCurrent * (Math.pow(r, maxM) - 1) / (r - 1));
    while (totalCost > GAME.biomass && maxM > 1) {
      maxM--;
      totalCost = Math.round(costCurrent * (Math.pow(r, maxM) - 1) / (r - 1));
    }
    return { count: maxM, totalCost, canBuy: GAME.biomass >= totalCost && maxM > 0 };
  }

  const count = parseInt(rawMult) || 1;
  const totalCost = count === 1
    ? Math.round(costCurrent)
    : Math.round(costCurrent * (Math.pow(r, count) - 1) / (r - 1));

  return { count, totalCost, canBuy: GAME.biomass >= totalCost };
}
