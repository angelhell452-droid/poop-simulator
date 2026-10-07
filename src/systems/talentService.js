import { GAME } from '../core/state.js?v=5.0.73';
import { TALENTS } from '../data/talents.data.js';
import { events } from '../core/events.js';
import { isTalentVisible } from '../progression/unlocks.js';

export function getAffordableTalentInfo(tl) {
  const remainingLevels = tl.max - tl.level;
  if (remainingLevels <= 0) return { count: 0, totalCost: 0, canBuy: false, maxed: true };

  const rawMult = GAME.buyMultiplier;
  const isMax = (rawMult === 'max' || rawMult === 'MAX');
  const targetCount = isMax ? remainingLevels : Math.min(remainingLevels, parseInt(rawMult) || 1);

  let totalCost = 0;
  let count = 0;
  let currRolls = GAME.prestigeRolls;

  const growth = tl.costMult || 1.12;

  for (let i = 0; i < targetCount; i++) {
    const lvl = tl.level + i;
    const cost = Math.floor(tl.cost * Math.pow(growth, lvl)) + lvl;
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

  const nextCost = Math.floor(tl.cost * Math.pow(growth, tl.level)) + tl.level;

  if (count === 0) {
    return { count: 1, totalCost: nextCost, canBuy: false, maxed: false, nextCost };
  }

  const canBuy = count > 0 && GAME.prestigeRolls >= totalCost;
  return { count, totalCost, canBuy: canBuy && count > 0, maxed: false, nextCost };
}

export function buyTalent(talentId) {
  const tl = TALENTS.find(t => t.id === talentId);
  if (!tl || !isTalentVisible(tl)) return false;

  const tlInfo = getAffordableTalentInfo(tl);
  if (!tlInfo.canBuy || tlInfo.count <= 0) return false;

  GAME.prestigeRolls -= tlInfo.totalCost;
  tl.level += tlInfo.count;

  events.emit('talent:purchased', { talent: tl, levelsAdded: tlInfo.count });
  return true;
}
