import { GAME } from '../core/state.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js?v=5.0.80';
import { events } from '../core/events.js';
import { getPhaseByIndex, PHASE_COUNT } from '../progression/phases.data.js?v=5.0.80';
import { bigPow, gte, log10Of, mul } from '../utils/big.js?v=5.0.80';
import { noteHorizonSpark } from '../economy/horizon.js?v=5.0.80';

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


export function getBreakthroughExpLevel(biomass = GAME.lifetimeBiomassInCurrentCycle || 0) {
  const logVal = log10Of(biomass);
  if (!Number.isFinite(logVal) || logVal <= 2) return 0;
  // Опыт рассчитывается от биомассы текущего цикла: 10^2 -> 0 ур., 10^17 -> 1000 ур.
  const lvl = Math.floor((logVal - 2) * (1000 / 15));
  return Math.max(0, lvl);
}

export function getTranscendRequirement() {
  const currentCount = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;
  const reqLevel = 1000;
  const currentLevel = getBreakthroughExpLevel(GAME.lifetimeBiomassInCurrentCycle || 0);
  const isMet = currentLevel >= reqLevel;

  return {
    transcends: currentCount,
    breakthroughCount: currentCount,
    reqLevel,
    currentLevel,
    reqForm: 1,
    currentForm: 1,
    reqPrestiges: 0,
    currentPrestiges: GAME.flushCount || 0,
    reqRolls: 0,
    currentRolls: GAME.prestigeRolls || 0,
    currentBiomass: GAME.lifetimeBiomassInCurrentCycle || 0,
    meetsStage: true,
    meetsPrestiges: true,
    meetsRolls: true,
    meetsBiomass: isMet,
    isMet
  };
}

export function getTranscendRewardBreakdown() {
  const req = getTranscendRequirement();
  const currentCount = req.breakthroughCount;
  // Вантузы за прорыв: базовая награда растет с каждым прорывом
  const basePlungers = 5 + currentCount * 2;

  const soulTalent = TALENTS.find(t => t.id === 'transcend_soul');
  const soulBonus = soulTalent && soulTalent.level > 0 ? soulTalent.level * 0.08 : 0;
  const incubator = GAME.transcendUpgrades?.plungerIncubator || 0;
  const incubatorBonus = incubator * 0.08;

  const astralTalent = TALENTS.find(t => t.id === 'astral_splendor');
  const doubleChance = astralTalent && astralTalent.level > 0
    ? Math.min(0.25, astralTalent.level * 0.015)
    : 0;

  const vipMult = GAME.vipPass ? 2 : 1;
  let totalGain = Math.round(basePlungers * (1 + soulBonus + incubatorBonus) * vipMult);
  totalGain = Math.max(1, totalGain);

  return {
    ...req,
    flushPart: basePlungers,
    rollsPart: 0,
    stagePart: 0,
    basePlungers,
    soulBonus,
    incubatorBonus,
    doubleChance,
    vipMult,
    totalGain,
    nextPlungerRollsNeeded: 0,
    nextPlungerFormsNeeded: 0
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
    gain = Math.max(1, gain * 2);
  }
  if (gain <= 0) return false;

  const nextCount = (GAME.breakthroughCount ?? GAME.totalTranscend ?? 0) + 1;
  GAME.breakthroughCount = nextCount;
  GAME.totalTranscend = nextCount;
  GAME.transcendPlungers = (GAME.transcendPlungers || 0) + gain;
  noteHorizonSpark(nextCount);

  // СБРАСЫВАЕТСЯ ТОЛЬКО ОДОМЕТР ТЕКУЩЕГО ЦИКЛА (для перехода на новые 1000 уровней)
  // Баланс биомассы, заводы, ножи, таланты, втулки, блестяшки и одежда сохраняются!
  GAME.lifetimeBiomassInCurrentCycle = 0;

  events.emit('transcend:completed', { gain, breakthroughCount: nextCount });
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
