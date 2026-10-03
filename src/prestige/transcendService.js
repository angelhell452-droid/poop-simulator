import { GAME } from '../core/state.js';
import { FACTORIES } from '../data/factories.data.js';
import { TALENTS } from '../data/talents.data.js';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js';
import { events } from '../core/events.js';
import { getPhaseByIndex, PHASE_COUNT } from '../progression/phases.data.js';

export const BRIDGE_FLUSHES_NEEDED = 2;

export function currentBridgePhase() {
  const t = GAME.totalTranscend || 0;
  const pair = Math.min(PHASE_COUNT / 2, 1 + t);
  return getPhaseByIndex(pair * 2);
}

export function flushCountsForBridge(phaseId) {
  return (phaseId || 0) >= currentBridgePhase().id;
}

export function getTranscendRequirement() {
  const bridge = currentBridgePhase();
  const reqForm = bridge.flushForm;
  const reqStage = reqForm - 1;
  const reqPrestiges = BRIDGE_FLUSHES_NEEDED;
  const reqBiomass = bridge.ceiling * 0.1;

  const currentStage = GAME.evoStage || 0;
  const currentForm = currentStage + 1;
  const currentPrestiges = GAME.flushesThisCycle || 0;
  const currentBiomass = GAME.cycleBiomass || 0;

  const meetsStage = currentForm >= reqForm;
  const meetsPrestiges = currentPrestiges >= reqPrestiges;
  const meetsBiomass = currentBiomass >= reqBiomass;
  const isMet = meetsPrestiges && meetsStage && meetsBiomass;

  return {
    transcends: GAME.totalTranscend || 0,
    pair: bridge.pair,
    phase: bridge,
    reqForm,
    reqStage,
    reqPrestiges,
    reqRolls: 0,
    reqBiomass,
    currentForm,
    currentStage,
    currentPrestiges,
    currentRolls: GAME.prestigeRolls || 0,
    currentBiomass,
    meetsStage,
    meetsPrestiges,
    meetsRolls: meetsBiomass,
    meetsBiomass,
    isMet
  };
}

export function getTranscendRewardBreakdown() {
  const req = getTranscendRequirement();
  const overshot = req.currentForm >= req.phase.formEnd;
  const basePlungers = 1;
  const epochBonus = overshot ? 1 : 0;

  const soulTalent = TALENTS.find(t => t.id === 'transcend_soul');
  const soulBonus = soulTalent && soulTalent.level > 0 ? soulTalent.level * 0.08 : 0;
  const incubator = GAME.transcendUpgrades?.plungerIncubator || 0;
  const incubatorBonus = incubator * 0.08;

  let totalGain = Math.round((basePlungers + epochBonus) * (1 + soulBonus + incubatorBonus));
  const astralTalent = TALENTS.find(t => t.id === 'astral_splendor');
  if (astralTalent && astralTalent.level > 0) {
    const doubleChance = Math.min(0.25, astralTalent.level * 0.015);
    if (Math.random() < doubleChance) totalGain *= 2;
  }
  totalGain = Math.max(1, Math.min(4, totalGain));

  return {
    ...req,
    flushPart: basePlungers,
    rollsPart: 0,
    stagePart: epochBonus,
    basePlungers,
    soulBonus,
    incubatorBonus,
    totalGain,
    nextPlungerRollsNeeded: 0,
    nextPlungerFormsNeeded: Math.max(0, req.phase.formEnd - req.currentForm)
  };
}

export function getTranscendPlungersReward() {
  return getTranscendRewardBreakdown().totalGain;
}


export function executeTranscend() {
  const breakdown = getTranscendRewardBreakdown();
  const gain = breakdown.totalGain;
  if (!breakdown.isMet || gain <= 0) return false;

  GAME.transcendPlungers = (GAME.transcendPlungers || 0) + gain;
  GAME.totalTranscend = (GAME.totalTranscend || 0) + 1;

  GAME.flushesThisCycle = 0;
  GAME.cycleBiomass = 0;
  GAME.biomass = 0;
  GAME.currentRunPeakGPS = 0;
  const reached = (GAME.evoStage || 0) + 1;
  if (reached > (GAME.peakForm || 1)) GAME.peakForm = reached;
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
