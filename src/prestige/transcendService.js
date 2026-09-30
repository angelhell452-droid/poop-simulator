import { GAME } from '../core/state.js';
import { FACTORIES } from '../data/factories.data.js';
import { TALENTS } from '../data/talents.data.js';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js';
import { events } from '../core/events.js';

export function getTranscendRequirement() {
  const t = GAME.totalTranscend || 0;
  // Dynamic scaling:
  // Transcend #0: Form 50, 5 Prestiges, 2,500 Rolls
  // Transcend #1: Form 75, 8 Prestiges, 5,500 Rolls
  // Transcend #2: Form 100, 11 Prestiges, 12,000 Rolls
  // Transcend #3: Form 125, 14 Prestiges, 26,000 Rolls
  const reqForm = Math.min(2000, 50 + t * 25);
  const reqStage = reqForm - 1;
  const reqPrestiges = 5 + t * 3;
  const reqRolls = Math.floor(2500 * Math.pow(2.2, Math.min(10, t)));

  const currentStage = GAME.evoStage || 0;
  const currentForm = currentStage + 1;
  const currentPrestiges = GAME.totalPrestiges || 0;
  // Accumulated rolls strictly within the current Transcend cycle (resets on transcend)
  const currentRolls = Math.max(GAME.transcendCycleRolls || 0, GAME.prestigeRolls || 0);

  const meetsStage = currentStage >= reqStage;
  const meetsPrestiges = currentPrestiges >= reqPrestiges;
  const meetsRolls = currentRolls >= reqRolls;

  const isMet = meetsPrestiges && meetsStage && meetsRolls;

  return {
    transcends: t,
    reqForm,
    reqStage,
    reqPrestiges,
    reqRolls,
    currentForm,
    currentStage,
    currentPrestiges,
    currentRolls,
    meetsStage,
    meetsPrestiges,
    meetsRolls,
    isMet
  };
}

export function getTranscendRewardBreakdown() {
  const req = getTranscendRequirement();

  // 1. Direct Flush Contribution: Every flush completed guarantees +1 Plunger!
  const currentPrestiges = Math.max(0, req.currentPrestiges || 0);
  const flushPart = Math.floor(currentPrestiges * 1.0);

  // 2. Rolls Contribution: Linear scaling (+1 Plunger per 500 rolls)
  // At 2,500 rolls = 5 plungers. At 3,000 rolls = 6 plungers!
  const rolls = Math.max(0, req.currentRolls || 0);
  const rollsPart = Math.max(1, Math.floor(rolls / 500));
  const nextTargetRolls = (rollsPart + 1) * 500;
  const nextPlungerRollsNeeded = Math.max(0, nextTargetRolls - rolls);

  // 3. Form Evolution Contribution: Every 10 forms of poop evolution yields +1 Plunger
  const currentForm = Math.max(1, req.currentForm || 1);
  const stagePart = Math.max(0, Math.floor(currentForm / 10));
  const nextFormThreshold = (stagePart + 1) * 10;
  const nextPlungerFormsNeeded = Math.max(0, nextFormThreshold - currentForm);

  // 4. Base Plungers: sum of all three progression pillars
  const basePlungers = Math.max(1, flushPart + rollsPart + stagePart);

  // 5. Talents and Multipliers
  let mult = 1.0;
  const soulTalent = TALENTS.find(t => t.id === 'transcend_soul');
  const soulBonus = soulTalent && soulTalent.level > 0 ? soulTalent.level * 0.20 : 0;
  mult += soulBonus;

  const incubator = GAME.transcendUpgrades?.plungerIncubator || 0;
  const incubatorBonus = incubator * 0.10;
  mult += incubatorBonus;

  let totalGain = Math.max(1, Math.round(basePlungers * mult));

  const astralTalent = TALENTS.find(t => t.id === 'astral_splendor');
  if (astralTalent && astralTalent.level > 0) {
    const doubleChance = Math.min(0.50, astralTalent.level * 0.02);
    if (Math.random() < doubleChance) totalGain *= 2;
  }

  return {
    ...req,
    flushPart,
    rollsPart,
    stagePart,
    basePlungers,
    soulBonus,
    incubatorBonus,
    totalGain,
    nextPlungerRollsNeeded,
    nextPlungerFormsNeeded
  };
}

export function getTranscendPlungersReward() {
  return getTranscendRewardBreakdown().totalGain;
}


export function executeTranscend() {
  const gain = getTranscendPlungersReward();
  if (gain <= 0) return false;

  GAME.transcendPlungers = (GAME.transcendPlungers || 0) + gain;
  GAME.totalTranscend = (GAME.totalTranscend || 0) + 1;

  // Preserve 35% of rolls so player is never stalled after transcend
  GAME.prestigeRolls = Math.floor((GAME.prestigeRolls || 0) * 0.35);
  // Reset rolls accumulated in this transcend cycle for the new era
  GAME.transcendCycleRolls = GAME.prestigeRolls || 0;
  GAME.cycleBiomass = 0;
  GAME.biomass = 0;
  GAME.currentRunPeakGPS = 0;
  GAME.evoStage = 0;
  FACTORIES.forEach(fac => { fac.count = 0; });
  GAME.clean = 100;
  GAME.hunger = 100;
  GAME.happy = 100;

  events.emit('transcend:completed', { gain });
  return true;
}

export function buyTranscendUpgrade(upgId) {
  const upg = TRANSCEND_UPGRADES.find(u => u.id === upgId);
  if (!upg) return false;

  if (!GAME.transcendUpgrades) GAME.transcendUpgrades = {};

  let lvl = typeof GAME.transcendUpgrades[upg.key] === 'boolean'
    ? (GAME.transcendUpgrades[upg.key] ? 1 : 0)
    : (GAME.transcendUpgrades[upg.key] || 0);

  if (upg.reqTranscend && (GAME.totalTranscend || 0) < upg.reqTranscend) return false;
  if (upg.max && lvl >= upg.max) return false;

  const cost = upg.cost + (lvl * (upg.costStep || 0));
  if ((GAME.transcendPlungers || 0) < cost) return false;

  GAME.transcendPlungers -= cost;
  if (typeof GAME.transcendUpgrades[upg.key] === 'boolean') {
    GAME.transcendUpgrades[upg.key] = true;
  } else {
    GAME.transcendUpgrades[upg.key] = (GAME.transcendUpgrades[upg.key] || 0) + 1;
  }

  events.emit('transcend:upgradeBought', { upgrade: upg });
  return true;
}
