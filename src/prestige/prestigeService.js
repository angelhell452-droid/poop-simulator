import { GAME } from '../core/state.js?v=5.0.80';
import { FACTORIES } from '../data/factories.data.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js';
import { events } from '../core/events.js';
import { bigPow, gte, mul } from '../utils/big.js?v=5.0.80';
import { hasPerk } from '../data/perks.data.js';

export function getPrestigeRequirement() {
  const flushes = GAME.flushCount ?? GAME.totalPrestiges ?? 0;
  // Требование кошелька биомассы: 50000 * 2.5^(Кол-во Смывов)
  const reqBiomass = mul(50000, bigPow(2.5, flushes));
  const currentBiomass = GAME.biomass || 0;
  const isMet = gte(currentBiomass, reqBiomass);

  return {
    flushes,
    flushLevel: flushes,
    reqBiomass,
    currentBiomass,
    currentForm: 1,
    reqForm: 1,
    meetsStage: true,
    meetsBiomass: isMet,
    isMet
  };
}

export function flushRollPack(flushes = GAME.flushCount ?? GAME.totalPrestiges ?? 0) {
  // Награда: 14 * (Номер Смыва + 1)
  return Math.max(14, Math.round(14 * (flushes + 1)));
}

export function getPrestigeRewardBreakdown() {
  const req = getPrestigeRequirement();
  const pack = flushRollPack(req.flushes);

  const infFlush = TALENTS.find(t => t.id === 'infinity_flush');
  const flushTalentBonus = 1 + (infFlush ? infFlush.level * 0.06 : 0);
  const vipMult = GAME.vipPass ? 2 : 1;
  const recycleMult = hasPerk('perk_paper_recycling') ? 1.20 : 1;

  const totalGain = req.isMet ? Math.max(1, Math.round(pack * flushTalentBonus * vipMult * recycleMult)) : 0;
  const currentBoostPct = req.flushes * 50;
  const nextBoostPct = (req.flushes + 1) * 50;
  const currentIncomeMult = 1 + req.flushes * 0.5;
  const nextIncomeMult = 1 + (req.flushes + 1) * 0.5;

  return {
    ...req,
    baseRolls: pack,
    flushTalentBonus,
    vipMult,
    totalGain,
    currentBoostPct,
    nextBoostPct,
    currentIncomeMult,
    nextIncomeMult,
    plungerGain: 0
  };
}

export function getPrestigeRollsReward() {
  return getPrestigeRewardBreakdown().totalGain;
}

export function executePrestige(chosenArchetype = 'balanced') {
  const breakdown = getPrestigeRewardBreakdown();
  if (!breakdown.isMet || breakdown.totalGain <= 0) return false;

  const nextFlushes = (GAME.flushCount ?? GAME.totalPrestiges ?? 0) + 1;
  GAME.flushCount = nextFlushes;
  GAME.totalPrestiges = nextFlushes;

  GAME.prestigeRolls = (GAME.prestigeRolls || 0) + breakdown.totalGain;
  GAME.allTimePrestigeRolls = (GAME.allTimePrestigeRolls || 0) + breakdown.totalGain;
  GAME.transcendCycleRolls = (GAME.transcendCycleRolls || 0) + breakdown.totalGain;

  const startTalent = TALENTS.find(t => t.id === 'royal_gold');
  const startBio = startTalent ? startTalent.level * 200 : 0;

  // Обнуление кошелька биомассы и одометра опыта текущего цикла
  GAME.biomass = startBio;
  GAME.lifetimeBiomassInCurrentCycle = 0;
  GAME.cycleBiomass = 0;
  GAME.currentRunPeakGPS = 0;
  GAME.archetype = chosenArchetype;

  // Сброс заводов
  FACTORIES.forEach(fac => { fac.count = 0; });
  GAME.clean = 100;
  GAME.hunger = 100;
  GAME.happy = 100;

  events.emit('prestige:completed', { gain: breakdown.totalGain, archetype: chosenArchetype, flushCount: nextFlushes });
  return true;
}
