import { GAME } from '../core/state.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.80';
import { getClickPower, getEquippedKnife } from '../economy/production.js?v=5.0.80';
import { takeClickBudget } from './autoclickService.js?v=5.0.80';
import { events } from '../core/events.js';
import { add, gainBio, mul } from '../utils/big.js?v=5.0.80';

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
  const critChanceTalent = TALENTS.find(t => t.id === 'talent_crit_chance');
  const critMultTalent = TALENTS.find(t => t.id === 'talent_crit_mult');
  const critCascadeTalent = TALENTS.find(t => t.id === 'talent_crit_cascade');

  const luckLvl = Math.min(20, GAME.boutiqueLevels?.golden_luck || 0);
  const happyCrit = Math.max(0, (GAME.happy || 0) / 100) * 0.01;
  const clickerCrit = GAME.archetype === 'clicker' ? 0.02 : 0;
  // Стартовый шанс крита 0.8% (0.008) +0.2% за ур. talent_crit_chance (макс 50)
  let critChance = Math.min(0.75, 0.008 + (critChanceTalent ? critChanceTalent.level * 0.002 : 0) + luckLvl * 0.004 + happyCrit + clickerCrit + (GAME.tutorialCritBonus || 0));
  // Стартовый множитель крита х4 +0.5x за ур. talent_crit_mult (макс 20)
  let critMultiplier = 4.0 + (critMultTalent ? critMultTalent.level * 0.5 : 0);

  // talent_crit_cascade: дает +0.1% шанс на Супер-Крит с множителем x100
  const cascadeChance = (critCascadeTalent ? critCascadeTalent.level * 0.001 : 0);

  const eqKnife = getEquippedKnife();
  const knifeSparkleMult = Math.max(1, Number(eqKnife?.sparkleMult) || 1);
  const isGambler = GAME.archetype === 'gambler';
  const gamblerMult = isGambler ? 2.0 : 1.0;
  const sparklesPerProc = Math.max(1, Math.round(knifeSparkleMult * gamblerMult));

  let totalEarned = 0;
  let sparklesEarned = 0;
  let critsCount = 0;
  let superCritsCount = 0;

  const clicksToProcess = pendingClicks;
  pendingClicks = 0;

  if (clicksToProcess > 25) {
    const expectedCrits = clicksToProcess * critChance;
    const variance = Math.sqrt(Math.max(1, clicksToProcess * critChance * (1 - critChance)));
    critsCount = Math.round(expectedCrits + (Math.random() - 0.5) * variance);
    critsCount = Math.max(0, Math.min(clicksToProcess, critsCount));
    const regularClicks = clicksToProcess - critsCount;

    if (cascadeChance > 0 && critsCount > 0) {
      superCritsCount = Math.round(critsCount * cascadeChance);
      if (superCritsCount > critsCount) superCritsCount = critsCount;
    }
    const standardCrits = critsCount - superCritsCount;

    let critBio = mul(mul(standardCrits, basePower), critMultiplier);
    if (superCritsCount > 0) {
      critBio = add(critBio, mul(mul(superCritsCount, basePower), critMultiplier * 100));
    }
    totalEarned = add(mul(regularClicks, basePower), critBio);
    sparklesEarned = critsCount * sparklesPerProc;
  } else {
    for (let i = 0; i < clicksToProcess; i++) {
      const isCrit = Math.random() < critChance;
      if (isCrit) {
        const isSuperCrit = cascadeChance > 0 && Math.random() < cascadeChance;
        const currentMult = isSuperCrit ? critMultiplier * 100 : critMultiplier;
        if (isSuperCrit) superCritsCount++;
        totalEarned = add(totalEarned, mul(basePower, currentMult));
        critsCount++;
      } else {
        totalEarned = add(totalEarned, basePower);
      }
    }
    sparklesEarned = critsCount * sparklesPerProc;
  }

  GAME.biomass = gainBio(GAME.biomass, totalEarned);
  GAME.lifetimeBiomassInCurrentCycle = gainBio(GAME.lifetimeBiomassInCurrentCycle, totalEarned);
  GAME.allTimeBiomass = gainBio(GAME.allTimeBiomass, totalEarned);
  GAME.cycleBiomass = gainBio(GAME.cycleBiomass, totalEarned);
  GAME.totalClicks += clicksToProcess;
  GAME.sparkles += sparklesEarned;

  if (eqKnife) {
    eqKnife.statTrak = (eqKnife.statTrak || 0) + clicksToProcess;
  }

  // Билеты вклада гильдии: 1 билет за каждые 500 кликов, расширяемый кап talent_ticket_cap
  const ticketCap = 5 + (TALENTS.find(t => t.id === 'talent_ticket_cap')?.level || 0);
  GAME.clicksTowardsTicket = (GAME.clicksTowardsTicket || 0) + clicksToProcess;
  while (GAME.clicksTowardsTicket >= 500) {
    GAME.clicksTowardsTicket -= 500;
    if ((GAME.guildTickets || 0) < ticketCap) {
      GAME.guildTickets = (GAME.guildTickets || 0) + 1;
      events.emit('guild:ticketEarned', { tickets: GAME.guildTickets });
    }
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
