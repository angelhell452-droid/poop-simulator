import { GAME } from '../core/state.js';
import { TALENTS } from '../data/talents.data.js';
import { events } from '../core/events.js';

export function getAffordableTalentInfo(tl) {
  const remainingLevels = tl.max - tl.level;
  if (remainingLevels <= 0) return { count: 0, totalCost: 0, canBuy: false, maxed: true };

  const rawMult = GAME.buyMultiplier;
  const isMax = (rawMult === 'max' || rawMult === 'MAX');
  const targetCount = isMax ? remainingLevels : Math.min(remainingLevels, parseInt(rawMult) || 1);

  let totalCost = 0;
  let count = 0;
  let currRolls = GAME.prestigeRolls;

  for (let i = 0; i < targetCount; i++) {
    const lvl = tl.level + i;
    const cost = Math.floor(tl.cost * Math.pow(1.075, lvl)) + lvl;
    if (isMax) {
      if (currRolls >= cost) {
        currRolls -= cost;
        totalCost += cost;
        count++;
      } else {
        break;
      }
    } else {
      totalCost += cost;
      count++;
    }
  }

  if (count === 0) {
    totalCost = Math.floor(tl.cost * Math.pow(1.075, tl.level)) + tl.level;
    return { count: 1, totalCost, canBuy: false, maxed: false };
  }

  const canBuy = count > 0 && GAME.prestigeRolls >= totalCost;
  return { count, totalCost, canBuy: canBuy && count > 0, maxed: false };
}

export function buyTalent(talentId) {
  const tl = TALENTS.find(t => t.id === talentId);
  if (!tl) return false;

  const tlInfo = getAffordableTalentInfo(tl);
  if (!tlInfo.canBuy || tlInfo.count <= 0) return false;

  GAME.prestigeRolls -= tlInfo.totalCost;
  tl.level += tlInfo.count;

  events.emit('talent:purchased', { talent: tl, levelsAdded: tlInfo.count });
  return true;
}
