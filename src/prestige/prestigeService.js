import { GAME } from '../core/state.js?v=5.0.39';
import { FACTORIES } from '../data/factories.data.js?v=5.0.39';
import { TALENTS } from '../data/talents.data.js';
import { events } from '../core/events.js';
import { getPhaseByIndex, getPhaseForForm, maxUnlockedForm } from '../progression/phases.data.js?v=5.0.39';
import { flushCountsForBridge, flushPaysPlunger, pairIsClosed } from './transcendService.js?v=5.0.39';
import { gte } from '../utils/big.js?v=5.0.39';

function gateStatus(phase) {
  const currentStage = GAME.evoStage || 0;
  const currentForm = currentStage + 1;
  const currentBiomass = GAME.cycleBiomass || 0;
  const reqBiomass = phase.biomassGate ?? phase.ceiling * 0.1;
  return {
    meetsStage: currentForm >= phase.flushForm,
    meetsBiomass: gte(currentBiomass, reqBiomass),
    reqForm: phase.flushForm,
    reqBiomass
  };
}

export function getPrestigeRequirement() {
  const form = (GAME.evoStage || 0) + 1;
  const capForm = maxUnlockedForm(GAME.totalTranscend || 0);
  const limit = getPhaseForForm(Math.min(form, capForm)).id;
  let bestMet = null;
  let nextUnmet = null;

  for (let id = 1; id <= limit; id++) {
    const phase = getPhaseByIndex(id);
    const gate = gateStatus(phase);
    if (gate.meetsStage && gate.meetsBiomass) bestMet = phase;
    else if (!nextUnmet) nextUnmet = phase;
  }

  const shown = bestMet || nextUnmet || getPhaseByIndex(1);
  const gate = gateStatus(shown);
  const isMet = !!bestMet;

  return {
    flushes: GAME.totalPrestiges || 0,
    reqForm: isMet ? bestMet.flushForm : gate.reqForm,
    reqStage: (isMet ? bestMet.flushForm : gate.reqForm) - 1,
    reqBiomass: isMet ? (bestMet.biomassGate ?? bestMet.ceiling * 0.1) : gate.reqBiomass,
    currentForm: form,
    currentStage: GAME.evoStage || 0,
    currentBiomass: GAME.cycleBiomass || 0,
    meetsStage: isMet || gate.meetsStage,
    meetsBiomass: isMet || gate.meetsBiomass,
    isMet,
    echoPhase: bestMet ? bestMet.id : 0,
    countsForBridge: !!(bestMet && flushCountsForBridge(bestMet.id)),
    phase: shown
  };
}

export function flushRollPack(phaseId) {
  const id = Math.max(1, phaseId || 1);
  return Math.max(1, Math.round(12 + id * 2 + Math.pow(id, 1.85) * 0.42));
}

export function getPrestigeRewardBreakdown() {
  const req = getPrestigeRequirement();
  const phaseId = req.echoPhase || req.phase.id;
  const pack = flushRollPack(phaseId);

  const infFlush = TALENTS.find(t => t.id === 'infinity_flush');
  const flushTalentBonus = 1 + (infFlush ? infFlush.level * 0.06 : 0);

  const totalGain = req.isMet ? Math.max(1, Math.round(pack * flushTalentBonus)) : 0;
  const sealed = req.isMet && pairIsClosed(phaseId);
  const plungerGain = req.isMet && flushPaysPlunger(phaseId) ? 1 : 0;

  return {
    ...req,
    extraForms: 0,
    bioPart: pack,
    stagePart: 0,
    baseRolls: pack,
    flushTalentBonus,
    totalGain,
    nextRollBiomassNeeded: 0,
    pairSealed: sealed,
    plungerGain,
    echoGain: req.isMet && !sealed ? 1 : 0
  };
}

export function getPrestigeRollsReward() {
  return getPrestigeRewardBreakdown().totalGain;
}

export function executePrestige(chosenArchetype = 'balanced') {
  const breakdown = getPrestigeRewardBreakdown();
  if (!breakdown.isMet || breakdown.totalGain <= 0) return false;

  const phaseId = breakdown.echoPhase;
  if (!breakdown.pairSealed) {
    if (!GAME.phaseEcho || typeof GAME.phaseEcho !== 'object') GAME.phaseEcho = {};
    GAME.phaseEcho[phaseId] = (Number(GAME.phaseEcho[phaseId]) || 0) + 1;
  }
  if (breakdown.plungerGain > 0) {
    GAME.transcendPlungers = (GAME.transcendPlungers || 0) + breakdown.plungerGain;
    GAME.pairPlungersFromFlushes = (GAME.pairPlungersFromFlushes || 0) + breakdown.plungerGain;
  }

  GAME.prestigeRolls += breakdown.totalGain;
  GAME.allTimePrestigeRolls = (GAME.allTimePrestigeRolls || 0) + breakdown.totalGain;
  GAME.transcendCycleRolls = (GAME.transcendCycleRolls || 0) + breakdown.totalGain;
  GAME.totalPrestiges++;
  if (flushCountsForBridge(phaseId)) {
    GAME.flushesThisCycle = (GAME.flushesThisCycle || 0) + 1;
  }
  GAME.cycleBiomass = 0;
  GAME.currentRunPeakGPS = 0;
  GAME.archetype = chosenArchetype;

  const startTalent = TALENTS.find(t => t.id === 'royal_gold');
  const startBio = startTalent ? startTalent.level * 200 : 0;

  GAME.biomass = startBio;
  const reached = (GAME.evoStage || 0) + 1;
  if (reached > (GAME.peakForm || 1)) GAME.peakForm = reached;
  GAME.evoStage = 0;
  FACTORIES.forEach(fac => { fac.count = 0; });
  GAME.clean = 100;
  GAME.hunger = 100;
  GAME.happy = 100;

  events.emit('prestige:completed', { gain: breakdown.totalGain, archetype: chosenArchetype, echoPhase: phaseId });
  return true;
}
