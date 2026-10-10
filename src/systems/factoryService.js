import { GAME } from '../core/state.js?v=5.0.80';
import { FACTORIES } from '../data/factories.data.js?v=5.0.80';
import { getAffordableFactoryInfo } from '../economy/costs.js?v=5.0.80';
import { events } from '../core/events.js';
import { spendBio, gainBio, mul } from '../utils/big.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js';

export function buyFactory(facId) {
  const fac = FACTORIES.find(f => f.id === facId);
  if (!fac) return false;

  // Gate check: evolution form requirement
  if (fac.reqStage !== undefined && GAME.evoStage < fac.reqStage) {
    return false;
  }
  const currentBT = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;
  if (fac.reqBreakthrough !== undefined && currentBT < fac.reqBreakthrough) {
    return false;
  }

  const info = getAffordableFactoryInfo(fac);
  if (!info.canBuy || info.count <= 0) return false;

  GAME.biomass = spendBio(GAME.biomass, info.totalCost);
  fac.count = (fac.count || 0) + info.count;

  // talent_cashback: возвращает 0.5% от стоимости завода при покупке
  const cashbackLvl = TALENTS.find(t => t.id === 'talent_cashback')?.level || 0;
  if (cashbackLvl > 0) {
    const refundPct = Math.min(0.9, cashbackLvl * 0.005);
    const refund = mul(info.totalCost, refundPct);
    GAME.biomass = gainBio(GAME.biomass, refund);
  }

  events.emit('factory:purchased', { factory: fac, count: info.count });
  return true;
}
