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
  const currentRolls = Math.max(GAME.allTimePrestigeRolls || 0, GAME.prestigeRolls || 0);

  const meetsStage = currentStage >= reqStage;
  const meetsPrestiges = currentPrestiges >= reqPrestiges;
  const meetsRolls = currentRolls >= reqRolls;

  const isMet = meetsPrestiges && (meetsStage || meetsRolls);

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

export function getTranscendPlungersReward() {
  const req = getTranscendRequirement();
  if (!req.isMet) return 0;

  // Master Economy Dual Prestige Tier 2
  const rollsRatio = Math.max(1, req.currentRolls / req.reqRolls);
  const rollsPart = Math.floor(2.0 * Math.pow(rollsRatio, 0.22));
  const stagePart = Math.floor(Math.max(0, req.currentForm - req.reqForm) / 25);
  let base = Math.max(1, rollsPart + stagePart);

  const soulTalent = TALENTS.find(t => t.id === 'transcend_soul');
  if (soulTalent && soulTalent.level > 0) {
    base = Math.round(base * (1 + soulTalent.level * 0.20));
  }
  const incubator = GAME.transcendUpgrades?.plungerIncubator || 0;
  if (incubator > 0) {
    base = Math.round(base * (1 + incubator * 0.10));
  }
  const astralTalent = TALENTS.find(t => t.id === 'astral_splendor');
  if (astralTalent && astralTalent.level > 0) {
    const doubleChance = Math.min(0.50, astralTalent.level * 0.02);
    if (Math.random() < doubleChance) base *= 2;
  }
  return base;
}

export function executeTranscend() {
  const gain = getTranscendPlungersReward();
  if (gain <= 0) return false;

  GAME.transcendPlungers = (GAME.transcendPlungers || 0) + gain;
  GAME.totalTranscend = (GAME.totalTranscend || 0) + 1;

  // Preserve 35% of rolls so player is never stalled after transcend
  GAME.prestigeRolls = Math.floor((GAME.prestigeRolls || 0) * 0.35);
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
