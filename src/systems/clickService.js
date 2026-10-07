import { GAME } from '../core/state.js?v=5.0.74';
import { TALENTS } from '../data/talents.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.74';
import { getClickPower, getEquippedKnife } from '../economy/production.js?v=5.0.74';
import { takeClickBudget } from './autoclickService.js?v=5.0.74';
import { events } from '../core/events.js';
import { add, gainBio, mul } from '../utils/big.js?v=5.0.74';

export let pendingClicks = 0;

export function addPendingClicks(n = 1) {
  pendingClicks += n;
}

export function processBatchedClicks(clickClientX = null, clickClientY = null) {
  if (pendingClicks <= 0) return null;
  const allowed = takeClickBudget(pendingClicks);
  pendingClicks = 0;
  if (allowed <= 0) return null;
  pendingClicks = allowed;

  const basePower = getClickPower();
  const critTalent = TALENTS.find(t => t.id === 'crit_master');
  const luckLvl = Math.min(20, GAME.boutiqueLevels?.golden_luck || 0);
  const happyCrit = Math.max(0, (GAME.happy || 0) / 100) * 0.20;
  const clickerCrit = GAME.archetype === 'clicker' ? 0.10 : 0;
  let critChance = Math.min(0.85, (critTalent ? 0.05 + critTalent.level * 0.004 : 0.05) + luckLvl * 0.004 + happyCrit + clickerCrit);
  let critMultiplier = 20 * (1 + (critTalent ? critTalent.level * 0.10 : 0));

  const sparkleTalent = TALENTS.find(t => t.id === 'sparkle_alchemy');
  const magnetActive = SHOP_ITEMS.find(i => i.id === 'upg_magnet')?.owned;
  const hornActive = SHOP_ITEMS.find(i => i.id === 'upg_infinite_sparkles')?.owned;
  const isGambler = GAME.archetype === 'gambler';
  const gamblerMult = isGambler ? 2.0 : 1.0;
  let sparkleChance = Math.min(0.95, (magnetActive ? 0.30 : 0.15) * (hornActive ? 2.0 : 1.0) * (1 + (sparkleTalent ? sparkleTalent.level * 0.08 : 0)) * gamblerMult);

  let totalEarned = 0;
  let sparklesEarned = 0;
  let critsCount = 0;

  const clicksToProcess = pendingClicks;
  pendingClicks = 0;

  if (clicksToProcess > 25) {
    const expectedCrits = clicksToProcess * critChance;
    const variance = Math.sqrt(Math.max(1, clicksToProcess * critChance * (1 - critChance)));
    critsCount = Math.round(expectedCrits + (Math.random() - 0.5) * variance);
    critsCount = Math.max(0, Math.min(clicksToProcess, critsCount));
    const regularClicks = clicksToProcess - critsCount;
    totalEarned = add(mul(regularClicks, basePower), mul(mul(critsCount, basePower), critMultiplier));

    const expectedSparkles = clicksToProcess * sparkleChance;
    sparklesEarned = Math.round(expectedSparkles + (Math.random() - 0.5) * Math.sqrt(Math.max(1, expectedSparkles)));
    sparklesEarned = Math.max(0, sparklesEarned);
  } else {
    for (let i = 0; i < clicksToProcess; i++) {
      const isCrit = Math.random() < critChance;
      if (isCrit) {
        totalEarned = add(totalEarned, mul(basePower, critMultiplier));
        critsCount++;
      } else {
        totalEarned = add(totalEarned, basePower);
      }
      if (Math.random() < sparkleChance) {
        sparklesEarned++;
      }
    }
  }

  GAME.biomass = gainBio(GAME.biomass, totalEarned);
  GAME.allTimeBiomass = gainBio(GAME.allTimeBiomass, totalEarned);
  GAME.cycleBiomass = gainBio(GAME.cycleBiomass, totalEarned);
  GAME.totalClicks += clicksToProcess;
  GAME.sparkles += sparklesEarned;

  const eqKnife = getEquippedKnife();
  if (eqKnife) {
    eqKnife.statTrak = (eqKnife.statTrak || 0) + clicksToProcess;
  }

  GAME.lastClickTimestamp = Date.now();

  // Combo Heat & Turbo Rush
  const comboTalent = TALENTS.find(t => t.id === 'combo_master');
  const bonusDuration = (comboTalent ? comboTalent.level * 0.4 : 0) + (SHOP_ITEMS.find(i => i.id === 'upg_comborush')?.owned ? 6 : 0);
  const maxTurboDuration = Math.round(12 + bonusDuration);

  if (GAME.turboRushTime <= 0) {
    const heatGain = Math.min(25, clicksToProcess > 25 ? 12 : clicksToProcess * 0.7);
    GAME.comboHeat = Math.min(100, (GAME.comboHeat || 0) + heatGain);
    if (GAME.comboHeat >= 100) {
      GAME.turboRushTime = maxTurboDuration;
      GAME.turboCount = (GAME.turboCount || 0) + 1;
      events.emit('turbo:activated');
    }
  } else {
    GAME.turboRushTime = Math.min(maxTurboDuration, GAME.turboRushTime + 2);
    GAME.comboHeat = 100;
  }

  const isManual = (clickClientX !== null && clickClientX !== undefined);
  const result = {
    clicks: clicksToProcess,
    totalEarned,
    sparklesEarned,
    critsCount,
    clientX: clickClientX,
    clientY: clickClientY,
    isManual
  };

  events.emit('click:processed', result);
  return result;
}
