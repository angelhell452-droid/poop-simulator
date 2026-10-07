import { GAME } from '../core/state.js?v=5.0.63';
import { TALENTS } from '../data/talents.data.js';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js?v=5.0.63';
import { events } from '../core/events.js';
import { getPhaseByIndex, PHASE_COUNT } from '../progression/phases.data.js?v=5.0.63';
import { gte, mul } from '../utils/big.js?v=5.0.63';
import { noteHorizonSpark } from '../economy/horizon.js?v=5.0.63';

export const BRIDGE_FLUSHES_NEEDED = 2;

/** First breakthrough asks for 2 flushes, the second for 3, and every later one for 4. */
export function flushesNeededForBridge(transcends = GAME.totalTranscend || 0) {
  const done = Math.max(0, Number(transcends) || 0);
  if (done <= 0) return 2;
  if (done === 1) return 3;
  return 4;
}

/** Plungers a pair can pay from flushes of its even epoch. Enough for the first level of relics that breakthrough opens. */
export function plungerFlushCap(transcends = GAME.totalTranscend || 0) {
  const next = Math.max(1, (Number(transcends) || 0) + 1);
  if (next === 1) return 12;
  const firsts = TRANSCEND_UPGRADES
    .filter((row) => (row.reqTranscend || 1) === next)
    .reduce((sum, row) => sum + (row.cost || 0), 0);
  return Math.max(8, firsts);
}

export function currentBridgePhase() {
  const t = GAME.totalTranscend || 0;
  const pair = Math.min(PHASE_COUNT / 2, 1 + t);
  return getPhaseByIndex(pair * 2);
}

export function pairIsClosed(phaseId) {
  return Math.ceil(Math.max(1, phaseId || 1) / 2) <= (GAME.totalTranscend || 0);
}

/** One plunger per flush of the even epoch of the pair that is still open, until the pair cap. */
export function flushPaysPlunger(phaseId) {
  const bridge = currentBridgePhase();
  if ((phaseId || 0) !== bridge.id) return false;
  if (pairIsClosed(phaseId)) return false;
  return (GAME.pairPlungersFromFlushes || 0) < plungerFlushCap();
}

export function flushCountsForBridge(phaseId) {
  return (phaseId || 0) >= currentBridgePhase().id;
}

export function getTranscendRequirement() {
  const bridge = currentBridgePhase();
  const reqForm = bridge.flushForm;
  const reqStage = reqForm - 1;
  const reqPrestiges = flushesNeededForBridge();
  const reqBiomass = mul(bridge.ceiling, 0.1);

  const currentStage = GAME.evoStage || 0;
  const currentForm = currentStage + 1;
  const currentPrestiges = GAME.flushesThisCycle || 0;
  const currentBiomass = GAME.cycleBiomass || 0;

  const meetsStage = currentForm >= reqForm;
  const meetsPrestiges = currentPrestiges >= reqPrestiges;
  const meetsBiomass = gte(currentBiomass, reqBiomass);
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

  const astralTalent = TALENTS.find(t => t.id === 'astral_splendor');
  const doubleChance = astralTalent && astralTalent.level > 0
    ? Math.min(0.25, astralTalent.level * 0.015)
    : 0;

  let totalGain = Math.round((basePlungers + epochBonus) * (1 + soulBonus + incubatorBonus));
  totalGain = Math.max(1, Math.min(4, totalGain));

  return {
    ...req,
    flushPart: basePlungers,
    rollsPart: 0,
    stagePart: epochBonus,
    basePlungers,
    soulBonus,
    incubatorBonus,
    doubleChance,
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
  if (!breakdown.isMet) return false;
  let gain = breakdown.totalGain;
  if (breakdown.doubleChance > 0 && Math.random() < breakdown.doubleChance) {
    gain = Math.max(1, Math.min(4, gain * 2));
  }
  if (gain <= 0) return false;

  GAME.transcendPlungers = (GAME.transcendPlungers || 0) + gain;
  GAME.totalTranscend = (GAME.totalTranscend || 0) + 1;
  noteHorizonSpark(GAME.totalTranscend);

  const reached = (GAME.evoStage || 0) + 1;
  if (reached > (GAME.peakForm || 1)) GAME.peakForm = reached;
  GAME.flushesThisCycle = 0;
  GAME.pairPlungersFromFlushes = 0;

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
