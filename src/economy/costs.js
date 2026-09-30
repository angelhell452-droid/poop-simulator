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

  const buyMultiplier = GAME.buyMultiplier || 1;
  let targetCount = 1;
  if (buyMultiplier === 10) targetCount = 10;
  else if (buyMultiplier === 100) targetCount = 100;
  else if (buyMultiplier === 'max') targetCount = 20000;

  let totalCost = 0;
  let count = 0;
  let currBio = GAME.biomass;

  for (let s = GAME.evoStage + 1; s < EVOLUTIONS.length; s++) {
    const cost = Math.max(1, Math.floor(EVOLUTIONS[s].cost * costDiscount));
    if (buyMultiplier === 'max') {
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

  const canBuy = count > 0 && GAME.biomass >= totalCost;
  return { count, totalCost, canBuy, maxReached: false };
}

export function getAffordableFactoryInfo(fac) {
  const r = 1.15;
  const currentCount = fac.count || 0;
  const isTycoon = GAME.archetype === 'tycoon';
  const discount = isTycoon ? 0.90 : 1.0;
  const baseCost = fac.cost * discount;
  const buyMultiplier = GAME.buyMultiplier || 1;

  if (buyMultiplier === 'max') {
    const costCurrent = baseCost * Math.pow(r, currentCount);
    if (GAME.biomass < costCurrent) {
      return { count: 0, totalCost: 0, canBuy: false };
    }
    const maxM = Math.floor(Math.log(1 + (GAME.biomass * (r - 1)) / costCurrent) / Math.log(r));
    const count = Math.max(1, maxM);
    const totalCost = Math.round(costCurrent * (Math.pow(r, count) - 1) / (r - 1));
    return { count, totalCost, canBuy: GAME.biomass >= totalCost };
  }

  const count = typeof buyMultiplier === 'number' ? buyMultiplier : 1;
  const costCurrent = baseCost * Math.pow(r, currentCount);
  const totalCost = count === 1
    ? Math.round(costCurrent)
    : Math.round(costCurrent * (Math.pow(r, count) - 1) / (r - 1));

  return { count, totalCost, canBuy: GAME.biomass >= totalCost };
}
