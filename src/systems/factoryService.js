import { GAME } from '../core/state.js?v=5.0.50';
import { FACTORIES } from '../data/factories.data.js?v=5.0.50';
import { getAffordableFactoryInfo } from '../economy/costs.js?v=5.0.50';
import { events } from '../core/events.js';
import { spendBio } from '../utils/big.js?v=5.0.50';

export function buyFactory(facId) {
  const fac = FACTORIES.find(f => f.id === facId);
  if (!fac) return false;

  // Gate check: evolution form requirement
  if (fac.reqStage !== undefined && GAME.evoStage < fac.reqStage) {
    return false;
  }

  const info = getAffordableFactoryInfo(fac);
  if (!info.canBuy || info.count <= 0) return false;

  GAME.biomass = spendBio(GAME.biomass, info.totalCost);
  fac.count = (fac.count || 0) + info.count;

  events.emit('factory:purchased', { factory: fac, count: info.count });
  return true;
}
