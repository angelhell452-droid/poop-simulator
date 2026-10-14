import { GAME } from '../core/state.js?v=5.4.17';
import { TALENTS } from '../data/talents.data.js';
import { RELICS, RELIC_TIERS, getRelicLevel, hasRelic } from '../data/relics.data.js?v=5.4.17';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js?v=5.4.17';
import { events } from '../core/events.js';
import { getPhaseByIndex, PHASE_COUNT } from '../progression/phases.data.js?v=5.4.17';
import { bigPow, bigPow10, gte, log10Of, mul, isBig, lt, sub, rehydrateBig } from '../utils/big.js?v=5.4.17';
import { noteHorizonSpark } from '../economy/horizon.js?v=5.4.17';
import { saveLocal } from '../save/saveManager.js?v=5.4.17';
import { requestCloudSync } from '../save/cloudSync.js?v=5.4.17';
import { peakForm } from '../progression/unlocks.js?v=5.4.17';
import { getBreakthroughBoostDetails } from '../economy/metaMultipliers.js?v=5.4.17';
import { effectiveFormCost } from '../progression/evolutionService.js?v=5.4.17';

export const BRIDGE_FLUSHES_NEEDED = 5;

/**
 * Dynamic infinite scaling for flush requirement (halved vs legacy curve):
 * 1st breakthrough (done === 0): strictly 5 flushes.
 * Subsequent: ceil((20 + done*4 + done^1.3) / 2)
 * relic_flush_req_reduction reduces requirement by -2% per level.
 */
export function flushesNeededForBridge(transcends = (GAME.breakthroughCount ?? GAME.totalTranscend ?? 0)) {
  const done = Math.max(0, Number(transcends) || 0);
  const raw = done === 0
    ? 10
    : (20 + Math.floor(done * 4) + Math.floor(Math.pow(done, 1.3)));
  const base = Math.max(1, Math.ceil(raw / 2));

  const reductionLvl = getRelicLevel('relic_flush_req_reduction');
  if (reductionLvl > 0) {
    const mult = Math.max(0.20, 1 - reductionLvl * 0.02);
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

export function getBreakthroughExpLevel(biomass = null) {
  // Реальная Форма питомца для Прорыва строго соответствует максимальной достигнутой Форме
  return peakForm();
}

export function getTargetBreakthroughExperience(transcends = (GAME.breakthroughCount ?? GAME.totalTranscend ?? 0)) {
  const b = Math.max(0, Number(transcends) || 0);
  if (b === 0) return 500;
  return 1000 * (1 + b);
}

export function getTranscendRequirement() {
  const currentCount = Math.max(0, Number(GAME.breakthroughCount ?? GAME.totalTranscend ?? 0) || 0);
  const reqLevel = getTargetBreakthroughExperience(currentCount);
  const currentLevel = peakForm();
  const reqPrestiges = flushesNeededForBridge(currentCount);
  const currentPrestiges = Math.max(0, Number(GAME.flushCount ?? GAME.totalPrestiges ?? 0) || 0);
  const meetsForm = currentLevel >= reqLevel;
  const meetsPrestiges = currentPrestiges >= reqPrestiges;
  const isMet = meetsForm && meetsPrestiges;

  return {
    transcends: currentCount,
    breakthroughCount: currentCount,
    reqLevel,
    currentLevel,
    reqForm: reqLevel,
    currentForm: currentLevel,
    reqPrestiges,
    currentPrestiges,
    reqRolls: 0,
    currentRolls: GAME.prestigeRolls || 0,
    currentBiomass: GAME.biomass || 0,
    meetsStage: true,
    meetsPrestiges,
    meetsRolls: true,
    meetsBiomass: meetsForm,
    meetsForm,
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

  const curBoost = getBreakthroughBoostDetails(currentCount);
  const nextBoost = getBreakthroughBoostDetails(currentCount + 1);
  const currentMult = curBoost.mult;
  const nextMult = nextBoost.mult;

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
    curBoost,
    nextBoost,
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

  // На Прорыве заводы НЕ сбрасываются ("без сброса заводов!").
  GAME.lifetimeBiomassInCurrentCycle = 0;
  GAME.breakthroughProgress = 0;

  // Кэп излишка cycleBiomass: иначе syncEvolutionToBiomass одним тиком
  // проталкивает сотни форм за запас, накопленный у гейта прорыва.
  const stage = Math.max(0, Number(GAME.evoStage) || 0);
  const floor = effectiveFormCost(stage);
  if (gte(GAME.cycleBiomass || 0, floor)) {
    GAME.cycleBiomass = floor;
  }

  saveLocal();
  requestCloudSync(500);
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
  if (lt(GAME.transcendPlungers || 0, cost)) return false;

  GAME.transcendPlungers = isBig(GAME.transcendPlungers)
    ? sub(GAME.transcendPlungers, cost)
    : Math.max(0, (GAME.transcendPlungers || 0) - cost);
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

  saveLocal();

  events.emit('transcend:upgradeBought', { upgrade: relic, relic, level: nextLvl });
  return true;
}

export const buyTranscendUpgrade = buyRelic;
