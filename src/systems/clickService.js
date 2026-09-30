import { GAME } from '../core/state.js';
import { TALENTS } from '../data/talents.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { getClickPower, getEquippedKnife } from '../economy/production.js';
import { events } from '../core/events.js';

export let pendingClicks = 0;

export function addPendingClicks(n = 1) {
  pendingClicks += n;
}

export function processBatchedClicks(clickClientX = null, clickClientY = null) {
  if (pendingClicks <= 0) return null;

  const basePower = getClickPower();
  const critTalent = TALENTS.find(t => t.id === 'crit_master');
  const luckLvl = GAME.boutiqueLevels?.golden_luck || 0;
  let critChance = Math.min(0.85, (critTalent ? 0.05 + critTalent.level * 0.002 : 0.05) + luckLvl * 0.01);
  let critMultiplier = (20 + (critTalent ? critTalent.level * 0.4 : 0));

  const sparkleTalent = TALENTS.find(t => t.id === 'sparkle_alchemy');
  const magnetActive = SHOP_ITEMS.find(i => i.id === 'upg_magnet')?.owned;
  const hornActive = SHOP_ITEMS.find(i => i.id === 'upg_infinite_sparkles')?.owned;
  const isGambler = GAME.archetype === 'gambler';
  const gamblerMult = isGambler ? 2.0 : 1.0;
  let sparkleChance = Math.min(0.95, (magnetActive ? 0.30 : 0.15) * (hornActive ? 3.0 : 1.0) * (1 + (sparkleTalent ? sparkleTalent.level * 0.15 : 0)) * gamblerMult);

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
    totalEarned = regularClicks * basePower + critsCount * basePower * critMultiplier;

    const expectedSparkles = clicksToProcess * sparkleChance;
    sparklesEarned = Math.round(expectedSparkles + (Math.random() - 0.5) * Math.sqrt(Math.max(1, expectedSparkles)));
    sparklesEarned = Math.max(0, sparklesEarned);
  } else {
    for (let i = 0; i < clicksToProcess; i++) {
      const isCrit = Math.random() < critChance;
      if (isCrit) {
        totalEarned += basePower * critMultiplier;
        critsCount++;
      } else {
        totalEarned += basePower;
      }
      if (Math.random() < sparkleChance) {
        sparklesEarned++;
      }
    }
  }

  GAME.biomass += totalEarned;
  GAME.allTimeBiomass += totalEarned;
  GAME.cycleBiomass += totalEarned;
  GAME.totalClicks += clicksToProcess;
  GAME.sparkles += sparklesEarned;

  const eqKnife = getEquippedKnife();
  if (eqKnife) {
    eqKnife.statTrak = (eqKnife.statTrak || 0) + clicksToProcess;
  }

  // Combo Heat & Turbo Rush
  if (GAME.turboRushTime <= 0) {
    const heatGain = Math.min(25, clicksToProcess > 25 ? 12 : clicksToProcess * 0.7);
    GAME.comboHeat = Math.min(100, (GAME.comboHeat || 0) + heatGain);
    if (GAME.comboHeat >= 100) {
      const comboTalent = TALENTS.find(t => t.id === 'combo_master');
      const bonusDuration = (comboTalent ? comboTalent.level * 0.5 : 0) + (SHOP_ITEMS.find(i => i.id === 'upg_comborush')?.owned ? 6 : 0);
      GAME.turboRushTime = Math.round(12 + bonusDuration);
      GAME.turboCount = (GAME.turboCount || 0) + 1;
      events.emit('turbo:activated');
    }
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
