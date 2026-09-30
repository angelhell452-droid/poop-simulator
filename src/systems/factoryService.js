import { GAME } from '../core/state.js';
import { FACTORIES } from '../data/factories.data.js';
import { getAffordableFactoryInfo } from '../economy/costs.js';
import { events } from '../core/events.js';

export function buyFactory(facId) {
  const fac = FACTORIES.find(f => f.id === facId);
  if (!fac) return false;

  // Gate check: evolution form requirement
  if (fac.reqStage !== undefined && GAME.evoStage < fac.reqStage) {
    return false;
  }

  const info = getAffordableFactoryInfo(fac);
  if (!info.canBuy || info.count <= 0) return false;

  GAME.biomass -= info.totalCost;
  fac.count = (fac.count || 0) + info.count;

  events.emit('factory:purchased', { factory: fac, count: info.count });
  return true;
}

export function runAutoBuyer() {
  if (!GAME.transcendUpgrades?.autoBuyer) return;

  for (let i = FACTORIES.length - 1; i >= 0; i--) {
    const fac = FACTORIES[i];
    if (fac.reqStage !== undefined && GAME.evoStage < fac.reqStage) continue;

    const cost = Math.round(fac.cost * Math.pow(1.15, fac.count || 0));
    if (GAME.biomass >= cost) {
      GAME.biomass -= cost;
      fac.count = (fac.count || 0) + 1;
      events.emit('factory:autoBought', { factory: fac });
      break;
    }
  }
}
