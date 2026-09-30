import { GAME } from '../core/state.js';
import { FACTORIES } from '../data/factories.data.js';
import { TALENTS } from '../data/talents.data.js';
import { KNIVES } from '../data/knives.data.js';
import { events } from '../core/events.js';

export function getPrestigeRequirement() {
  const p = GAME.totalPrestiges || 0;
  // Dynamic scaling: Form 15 for 1st flush, then +5 forms per prestige (Form 15, 20, 25, 30...)
  const reqForm = Math.min(500, 15 + p * 5);
  const reqStage = reqForm - 1;
  const reqBiomass = Math.floor(100000 * Math.pow(1.85, Math.min(30, p)));

  const currentStage = GAME.evoStage || 0;
  const currentForm = currentStage + 1;
  const currentBiomass = GAME.cycleBiomass || 0;

  const meetsStage = currentStage >= reqStage;
  const meetsBiomass = currentBiomass >= reqBiomass;
  // BOTH Form and Biomass MUST be achieved for true milestone progression!
  const isMet = meetsStage && meetsBiomass;

  return {
    flushes: p,
    reqForm,
    reqStage,
    reqBiomass,
    currentForm,
    currentStage,
    currentBiomass,
    meetsStage,
    meetsBiomass,
    isMet
  };
}

export function getPrestigeRewardBreakdown() {
  const req = getPrestigeRequirement();
  const currentBiomass = GAME.cycleBiomass || 0;
  const currentForm = (GAME.evoStage || 0) + 1;
  const extraForms = Math.max(0, currentForm - req.reqForm);

  // 1. Biomass Part (accumulated during current run)
  const bioRatio = Math.max(1, currentBiomass / Math.max(1, req.reqBiomass));
  const bioPart = Math.floor(15.0 * Math.pow(bioRatio, 0.18));

  // 2. Extra Form Evolution Bonus (+2 rolls per extra form beyond minimum)
  const stagePart = Math.floor(extraForms * 2 + Math.pow(Math.max(1, currentForm), 0.5) * 3);

  // 3. Equipment Knife Bonus (Scythe gives +25%)
  const scythe = KNIVES.find(k => k.type === 'Scythe' && k.owned);
  const scytheActive = !!scythe;
  const scytheMult = scytheActive ? 1.25 : 1.0;

  // 4. Talents bonuses
  const infFlush = TALENTS.find(t => t.id === 'infinity_flush');
  const hyperFlush = TALENTS.find(t => t.id === 'hyperspeed_flush');
  const flushTalentBonus = 1 + (infFlush ? infFlush.level * 0.08 : 0) + (hyperFlush ? hyperFlush.level * 0.08 : 0);

  const baseRolls = bioPart + stagePart;
  const totalGain = req.isMet ? Math.max(1, Math.round(baseRolls * scytheMult * flushTalentBonus)) : 0;

  // Calculate biomass needed for +1 next roll
  const nextBioPart = bioPart + 1;
  const nextTargetRatio = Math.pow(nextBioPart / 15.0, 1 / 0.18);
  const nextBiomassThreshold = Math.ceil(req.reqBiomass * nextTargetRatio);
  const nextRollBiomassNeeded = Math.max(0, nextBiomassThreshold - currentBiomass);

  return {
    ...req,
    extraForms,
    bioPart,
    stagePart,
    baseRolls,
    scytheActive,
    scytheMult,
    flushTalentBonus,
    totalGain,
    nextRollBiomassNeeded
  };
}

export function getPrestigeRollsReward() {
  return getPrestigeRewardBreakdown().totalGain;
}


export function executePrestige(chosenArchetype = 'balanced') {
  const gain = getPrestigeRollsReward();
  if (gain <= 0) return false;

  GAME.prestigeRolls += gain;
  GAME.allTimePrestigeRolls = (GAME.allTimePrestigeRolls || 0) + gain;
  GAME.transcendCycleRolls = (GAME.transcendCycleRolls || 0) + gain;
  GAME.totalPrestiges++;
  GAME.cycleBiomass = 0;
  GAME.currentRunPeakGPS = 0;
  GAME.archetype = chosenArchetype;

  const startTalent = TALENTS.find(t => t.id === 'royal_gold');
  const startBio = startTalent ? startTalent.level * 50000 : 0;

  GAME.biomass = startBio;
  GAME.evoStage = 0;
  FACTORIES.forEach(fac => { fac.count = 0; });
  GAME.clean = 100;
  GAME.hunger = 100;
  GAME.happy = 100;

  events.emit('prestige:completed', { gain, archetype: chosenArchetype });
  return true;
}
