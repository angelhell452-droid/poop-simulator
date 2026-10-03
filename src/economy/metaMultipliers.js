import { GAME } from '../core/state.js';
import { getPhaseForStage, PHASE_COUNT } from '../progression/phases.data.js';

function echoCount(phaseId) {
  const bag = GAME.phaseEcho || {};
  const raw = bag[phaseId] ?? bag[String(phaseId)] ?? 0;
  return Math.max(0, Number(raw) || 0);
}

/** Bonus from one epoch's echoes. The first echo is +1 (x2). Further echoes approach +2, so the multiplier approaches x3. */
export function getEchoBonus(count) {
  const c = Math.max(0, count || 0);
  if (c <= 0) return 0;
  return 1 + (c - 1) / (c - 1 + 8);
}

/**
 * Flush income. The current epoch and the one before it count in full.
 * Older echoes count at a quarter. Rolls in the wallet do not multiply income.
 * previewPhase / previewAdd show the boost of one more echo on that epoch.
 * atPhaseId previews the multiplier as if the run stood in that epoch.
 */
export function getRollsIncomeMult(previewPhase = 0, previewAdd = 0, atPhaseId = 0) {
  const at = atPhaseId || getPhaseForStage(GAME.evoStage).id;
  let bonus = 0;
  for (let id = 1; id <= PHASE_COUNT; id++) {
    const count = echoCount(id) + (id === previewPhase ? previewAdd : 0);
    const part = getEchoBonus(count);
    if (part <= 0) continue;
    if (id === at || id === at - 1) bonus += part;
    else if (id < at - 1) bonus += part * 0.25;
  }
  return 1 + bonus;
}

/**
 * Gear a run is expected to have by this epoch: echo, plungers, knife and hat.
 * Factories are tuned to it. Live gear above the knee is dampened.
 */
export function expectedAccountMult(phaseId) {
  const id = Math.min(PHASE_COUNT, Math.max(1, phaseId || 1));
  if (id <= 4) return 4 + (id - 1) * 2.5;
  return 11.5 * Math.pow(1.14, id - 4);
}

/**
 * From epoch 11 a built account pulls ahead of the factory curve.
 * readiness 0 leaves income unchanged. readiness 1 is the tuned full set:
 * knife, hat, plungers, and talents with the shop or relics.
 * Tuned so that run reaches form 20000 in about 77 hours. Epochs 1–10 stay put.
 */
export function lateComboMult(phaseId, readiness) {
  const phase = Math.max(1, phaseId || 1);
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

/** Plunger meta. 15 plungers ~ x3.4, 100 ~ x7.4, asymptote x9. */
export function getPlungersIncomeMult() {
  const plungers = Math.max(0, GAME.transcendPlungers || 0);
  return 1 + 8 * (plungers / (plungers + 25));
}

export function getOmniRelicMult() {
  const lvl = Math.min(20, GAME.transcendUpgrades?.omniMult || 0);
  return 1 + lvl * 0.04;
}

export function getRiftMult() {
  return GAME.transcendUpgrades?.singularityRift ? 1.35 : 1;
}

export function isIdealPet() {
  return (GAME.hunger || 0) >= 90 && (GAME.clean || 0) >= 90 && (GAME.happy || 0) >= 90;
}

export function getIdealMult() {
  return isIdealPet() ? 1.2 : 1;
}
