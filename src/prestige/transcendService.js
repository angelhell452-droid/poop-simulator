import { GAME } from '../core/state.js';
import { FACTORIES } from '../data/factories.data.js';
import { TALENTS } from '../data/talents.data.js';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js';
import { events } from '../core/events.js';

export const TRANSCEND_REQ_ROLLS = 2500;
export const TRANSCEND_REQ_STAGE = 50;

export function getTranscendPlungersReward() {
  const lifetimeRolls = Math.max(GAME.allTimePrestigeRolls || 0, GAME.prestigeRolls || 0);
  if (GAME.evoStage < TRANSCEND_REQ_STAGE && lifetimeRolls < TRANSCEND_REQ_ROLLS) return 0;

  // Master Economy Dual Prestige Tier 2
  const rollsRatio = Math.max(1, lifetimeRolls / TRANSCEND_REQ_ROLLS);
  const rollsPart = Math.floor(2.0 * Math.pow(rollsRatio, 0.22));
  const stagePart = Math.floor(Math.max(0, GAME.evoStage - TRANSCEND_REQ_STAGE) / 25);
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
