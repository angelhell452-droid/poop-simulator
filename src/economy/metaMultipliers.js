import { GAME } from '../core/state.js?v=5.0.80';
import { getPhaseForForm, getPhaseForStage, PHASE_COUNT, CLASSIC_EPOCHS } from '../progression/phases.data.js?v=5.0.80';

function echoCount(phaseId) {
  const bag = GAME.phaseEcho || {};
  const raw = bag[phaseId] ?? bag[String(phaseId)] ?? 0;
  return Math.max(0, Number(raw) || 0);
}

/** Epoch the echoes are scored from. A fresh run starts at form 1, but flushed epochs stay earned. */
function echoViewpoint() {
  const run = getPhaseForStage(GAME.evoStage).id;
  const peak = getPhaseForForm(GAME.peakForm || 1).id;
  let highest = 0;
  const bag = GAME.phaseEcho || {};
  for (const key of Object.keys(bag)) {
    const id = Number(key);
    if (id > highest && echoCount(id) > 0) highest = id;
  }
  return Math.max(run, peak, highest);
}

/** Bonus from one epoch's echoes. The first echo is +1 (x2). Further echoes approach +2, so the multiplier approaches x3. */
export function getEchoBonus(count) {
  const c = Math.max(0, count || 0);
  if (c <= 0) return 0;
  return 1 + (c - 1) / (c - 1 + 8);
}

function pairOf(phaseId) {
  return Math.ceil(Math.max(1, phaseId || 1) / 2);
}

/** Echo bonus the way it worked before pair gifts: current and previous in full, older at a quarter. */
function legacyEchoBonus(at, previewPhase = 0, previewAdd = 0) {
  let bonus = 0;
  for (let id = 1; id <= PHASE_COUNT; id++) {
    const count = echoCount(id) + (id === previewPhase ? previewAdd : 0);
    const part = getEchoBonus(count);
    if (part <= 0) continue;
    if (id === at || id === at - 1) bonus += part;
    else if (id < at - 1) bonus += part * 0.25;
  }
  return bonus;
}

/** Echoes of the pair that is still open. Closed pairs are replaced by the breakthrough gift. */
function openPairEchoBonus(at, closedPairs, previewPhase = 0, previewAdd = 0) {
  let bonus = 0;
  for (let id = 1; id <= PHASE_COUNT; id++) {
    if (pairOf(id) <= closedPairs) continue;
    const count = echoCount(id) + (id === previewPhase ? previewAdd : 0);
    const part = getEchoBonus(count);
    if (part <= 0) continue;
    if (id === at || id === at - 1) bonus += part;
    else if (id < at - 1) bonus += part * 0.25;
  }
  return bonus;
}

import { bigPow, mul } from '../utils/big.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js';
import { hasPerk } from '../data/perks.data.js';

export function getFlushIncomeMult() {
  const flushes = Math.max(0, GAME.flushCount ?? GAME.totalPrestiges ?? 0);
  return 1 + 0.5 * flushes;
}

export function getBreakthroughIncomeMult() {
  const b = Math.max(0, GAME.breakthroughCount ?? GAME.totalTranscend ?? 0);
  if (b === 0) return 1;
  const hackLvl = TALENTS.find(t => t.id === 'talent_exponent_hack')?.level || 0;
  const exp = b + (hackLvl * 0.05);
  return bigPow(1 + b, exp);
}

/**
 * Глобальный множитель постоянных перков за Блестяшки.
 * Перемножает мультипликативно все перки, влияющие на общий пассивный доход.
 */
export function getPerksIncomeMult() {
  let mult = 1.0;
  if (hasPerk('perk_factory_overclock') || hasPerk('upg_factory_overclock')) mult *= 1.25;
  if (hasPerk('perk_gold_rush') || hasPerk('upg_goldrush')) mult *= 1.25;
  if (hasPerk('perk_omniverse_essence') || hasPerk('upg_omniversal_wealth')) mult *= 1.20;
  return mult;
}

/**
 * Сквозная бесконечная цепочка мультипликаторов:
 * Доход = (База * Таланты * Буст Смывов) * Нож * Буст Прорывов * Реликвии * Шапки/Одежда * Баффы Ухода * Перки
 */
export function calculateInfiniteIncomeChain({
  baseRate = 1,
  talentsMult = 1,
  flushMult = null,
  knifeMult = 1,
  breakthroughMult = null,
  relicsMult = 1,
  gearMult = 1,
  careMult = 1,
  perksMult = null
} = {}) {
  const flush = flushMult !== null ? flushMult : getFlushIncomeMult();
  const bMult = breakthroughMult !== null ? breakthroughMult : getBreakthroughIncomeMult();
  const pMult = perksMult !== null ? perksMult : getPerksIncomeMult();

  // (База * Таланты * Буст Смывов)
  let result = mul(mul(baseRate, talentsMult), flush);
  // * Нож
  result = mul(result, knifeMult);
  // * Буст Прорывов
  result = mul(result, bMult);
  // * Реликвии
  result = mul(result, relicsMult);
  // * Шапки/Одежда
  result = mul(result, gearMult);
  // * Баффы Ухода
  result = mul(result, careMult);
  // * Перки
  result = mul(result, pMult);

  return result;
}

/**
 * Flush income boost: +50% per Flush level. Unspendable level, stays when rolls are spent.
 */
export function getRollsIncomeMult() {
  return getFlushIncomeMult();
}

/**
 * Breakthrough infinite scaling: (1 + b)^b multiplier to all income.
 */
export function getPlungersIncomeMult() {
  return getBreakthroughIncomeMult();
}

export function getOmniRelicMult() {
  const lvl = Math.min(20, GAME.transcendUpgrades?.omniMult || 0);
  return 1 + lvl * 0.08;
}

export function getRiftMult() {
  return GAME.transcendUpgrades?.singularityRift ? 1.5 : 1;
}

export function isIdealPet() {
  return (GAME.hunger || 0) >= 90 && (GAME.clean || 0) >= 90 && (GAME.happy || 0) >= 90;
}

export function getIdealMult() {
  return isIdealPet() ? 1.2 : 1;
}

export function getCleanIncomeMult() {
  return 1 + Math.max(0, (GAME.clean || 0) / 100) * 0.25;
}

export function getHungerClickMult() {
  return 1 + Math.max(0, (GAME.hunger || 0) / 100) * 0.25;
}

export function getHappyCritBonus() {
  return Math.max(0, (GAME.happy || 0) / 100) * 0.01;
}

export function getTutorialIncomeMult() {
  const perm = GAME.tutorialIncomeMult || 1;
  const temp = (Date.now() < (GAME.tutorialTempBoostUntil || 0)) ? 1.5 : 1;
  return perm * temp;
}

export function getTutorialClickMult() {
  return 1 + (GAME.tutorialClickBonus || 0);
}

export function getTutorialCritBonus() {
  return GAME.tutorialCritBonus || 0;
}

export function expectedAccountMult(phaseId) {
  const id = Math.min(40, Math.max(1, phaseId || 1));
  if (id === 1) return 1.0;
  if (id === 2) return 2.2;
  if (id === 3) return 4.5;
  if (id === 4) return 8.0;
  return 11.5 * Math.pow(1.14, id - 5);
}

export function lateComboMult(phaseId, readiness) {
  const phase = Math.min(40, Math.max(1, phaseId || 1));
  if (phase <= 10) return 1;
  const ready = Math.max(0, Math.min(1, Number(readiness) || 0));
  if (ready <= 0) return 1;
  return Math.pow(1.34, (phase - 10) * ready);
}

export function dampenGearMult(raw, phaseId) {
  const knee = expectedAccountMult(phaseId);
  const value = Math.max(1, Number(raw) || 1);
  if (value <= knee) return value;
  const extra = Math.min(Math.pow(value - knee, 0.72), knee * 1.25);
  return knee + extra;
}
