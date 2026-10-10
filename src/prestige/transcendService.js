import { GAME } from '../core/state.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js';
import { RELICS, RELIC_TIERS, getRelicLevel, hasRelic } from '../data/relics.data.js?v=5.0.80';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js?v=5.0.80';
import { events } from '../core/events.js';
import { getPhaseByIndex, PHASE_COUNT } from '../progression/phases.data.js?v=5.0.80';
import { bigPow, gte, log10Of, mul } from '../utils/big.js?v=5.0.80';
import { noteHorizonSpark } from '../economy/horizon.js?v=5.0.80';

export const BRIDGE_FLUSHES_NEEDED = 20;

/**
 * Dynamic infinite scaling for flush requirement:
 * ReqFlushes = 20 + Math.floor(GAME.breakthroughCount * 0.5)
 * relic_flush_req_reduction reduces requirement by -3% per level.
 */
export function flushesNeededForBridge(transcends = (GAME.breakthroughCount ?? GAME.totalTranscend ?? 0)) {
  const done = Math.max(0, Number(transcends) || 0);
  const base = 20 + Math.floor(done * 0.5);

  const reductionLvl = getRelicLevel('relic_flush_req_reduction');
  if (reductionLvl > 0) {
    const mult = Math.max(0.20, 1 - reductionLvl * 0.03);
    return Math.max(1, Math.round(base * mult));
  }
  return base;
}

/** Plungers a pair can pay from flushes of its even epoch. */
export function plungerFlushCap(transcends = (GAME.breakthroughCount ?? GAME.totalTranscend ?? 0)) {
  const next = Math.max(1, (Number(transcends) || 0) + 1);
  if (next === 1) return 12;
  const firsts = RELICS
    .filter((row) => (row.reqBreakthrough || 1) <= next)
    .reduce((sum, row) => sum + (row.cost || 0), 0);
  return Math.max(8, firsts);
}

export function currentBridgePhase() {
  const t = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;
  const pair = 1 + t;
  return getPhaseByIndex(pair * 2);
}

export function pairIsClosed(phaseId) {
  return Math.ceil(Math.max(1, phaseId || 1) / 2) <= (GAME.breakthroughCount ?? GAME.totalTranscend ?? 0);
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

export function getBreakthroughExpLevel(biomass = (GAME.breakthroughProgress ?? GAME.lifetimeBiomassInCurrentCycle ?? 0)) {
  const logVal = log10Of(biomass);
  if (!Number.isFinite(logVal) || logVal <= 2) return 0;
  // Опыт рассчитывается от биомассы текущего цикла: 10^2 -> 0 ур., 10^17 -> 1000 ур.
  const lvl = Math.floor((logVal - 2) * (1000 / 15));
  return Math.max(0, lvl);
}

export function getTranscendRequirement() {
  const currentCount = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;
  const reqLevel = 1000;
  const currentBio = GAME.breakthroughProgress ?? GAME.lifetimeBiomassInCurrentCycle ?? 0;
  const currentLevel = getBreakthroughExpLevel(currentBio);
  const reqPrestiges = flushesNeededForBridge(currentCount);
  const currentPrestiges = Math.max(0, Number(GAME.flushCount ?? GAME.totalPrestiges ?? 0) || 0);
  const meetsBiomass = currentLevel >= reqLevel;
  const meetsPrestiges = currentPrestiges >= reqPrestiges;
  const isMet = meetsBiomass && meetsPrestiges;

  return {
    transcends: currentCount,
    breakthroughCount: currentCount,
    reqLevel,
    currentLevel,
    reqForm: 1,
    currentForm: 1,
    reqPrestiges,
    currentPrestiges,
    reqRolls: 0,
    currentRolls: GAME.prestigeRolls || 0,
    currentBiomass: currentBio,
    meetsStage: true,
    meetsPrestiges,
    meetsRolls: true,
    meetsBiomass,
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

  const astralTalent = TALENTS.find(t => t.id === 'astral_splendor');
  const doubleChance = astralTalent && astralTalent.level > 0
    ? Math.min(0.25, astralTalent.level * 0.015)
    : 0;

  const vipMult = GAME.vipPass ? 2 : 1;
  let totalGain = Math.round(basePlungers * (1 + soulBonus) * vipMult);
  totalGain = Math.max(1, totalGain);

  const boostLvl = getRelicLevel('relic_breakthrough_boost');
  const baseFactor = 1.5 + (currentCount * 0.1) + (boostLvl * 0.1);
  const currentMult = currentCount > 0 ? bigPow(baseFactor, currentCount) : 1;
  const nextBase = 1.5 + ((currentCount + 1) * 0.1) + (boostLvl * 0.1);
  const nextMult = bigPow(nextBase, 1 + currentCount);

  return {
    ...req,
    flushPart: basePlungers,
    rollsPart: 0,
    stagePart: 0,
    basePlungers,
    soulBonus,
    doubleChance,
    vipMult,
    totalGain,
    currentMult,
    nextMult,
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

  // relic_prestige_factory_keep: Сохраняет 5% за уровень от уровней Авто-заводов текущего мира
  const keepLvl = getRelicLevel('relic_prestige_factory_keep');
  if (keepLvl > 0 && Array.isArray(GAME.factories)) {
    const keepRatio = Math.min(0.25, keepLvl * 0.05);
    GAME.factories.forEach(f => {
      if (f && f.count > 0) {
        f.count = Math.max(1, Math.floor(f.count * keepRatio));
      }
    });
  }

  // СБРАСЫВАЕТСЯ ТОЛЬКО ОДОМЕТР ТЕКУЩЕГО ЦИКЛА (для перехода на новые 1000 уровней)
  // Баланс биомассы, заводы, ножи, таланты, втулки, блестяшки и одежда сохраняются!
  GAME.lifetimeBiomassInCurrentCycle = 0;
  GAME.breakthroughProgress = 0;

  events.emit('transcend:completed', { gain, breakthroughCount: nextCount });
  return true;
}

export function buyRelic(relicId) {
  const relic = RELICS.find(r => r.id === relicId || r.key === relicId || r.legacyKey === relicId);
  if (!relic) return false;

  if (!GAME.relics) GAME.relics = {};
  if (!GAME.transcendUpgrades) GAME.transcendUpgrades = {};

  const bCount = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;
  if (relic.reqBreakthrough && bCount < relic.reqBreakthrough) return false;

  const curLvl = getRelicLevel(relic.id);
  if (relic.max && curLvl >= relic.max) return false;

  const cost = relic.cost;
  if ((GAME.transcendPlungers || 0) < cost) return false;

  GAME.transcendPlungers -= cost;
  const nextLvl = curLvl + 1;

  GAME.relics[relic.id] = nextLvl;
  GAME.relics[relic.key] = nextLvl;
  GAME.transcendUpgrades[relic.id] = nextLvl;
  GAME.transcendUpgrades[relic.key] = nextLvl;

  if (relic.legacyKey) {
    const flagVal = relic.max === 1 ? true : nextLvl;
    GAME.relics[relic.legacyKey] = flagVal;
    GAME.transcendUpgrades[relic.legacyKey] = flagVal;
  }

  events.emit('transcend:upgradeBought', { upgrade: relic, relic, level: nextLvl });
  return true;
}

export const buyTranscendUpgrade = buyRelic;
