import { GAME } from '../core/state.js?v=5.4.28';
import { FACTORIES } from '../data/factories.data.js?v=5.4.28';
import { TALENTS } from '../data/talents.data.js';
import { events } from '../core/events.js';
import { bigPow, gainBio, gte, isOrdinaryNumber, mul } from '../utils/big.js?v=5.4.28';
import { hasPerk } from '../data/perks.data.js';
import { getRelicLevel } from '../data/relics.data.js?v=5.4.28';
import { saveLocal } from '../save/saveManager.js?v=5.4.28';
import { requestCloudSync } from '../save/cloudSync.js?v=5.4.28';
import { ECONOMY } from '../economy/economy.config.js?v=5.4.28';

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
  // Награда: 14 * (Номер Смыва + 1) — linear in flush index, stays ordinary for practical counts
  const n = Math.max(0, Number(flushes) || 0);
  return Math.max(14, Math.round(14 * (n + 1)));
}

function boostPctFromMult(mult) {
  if (!isOrdinaryNumber(mult)) return null;
  const pct = (Number(mult) - 1) * 100;
  return Number.isFinite(pct) ? pct : null;
}

export function getPrestigeRewardBreakdown() {
  const req = getPrestigeRequirement();
  const pack = flushRollPack(req.flushes);

  const infFlush = TALENTS.find(t => t.id === 'infinity_flush');
  const flushTalentBonus = 1 + (infFlush ? infFlush.level * 0.06 : 0);
  const vipMult = GAME.vipPass ? 2 : 1;
  const recycleMult = hasPerk('perk_paper_recycling') ? 1.20 : 1;

  const totalGain = req.isMet ? Math.max(1, Math.round(pack * flushTalentBonus * vipMult * recycleMult)) : 0;

  const FLUSH_POWER_BASE = ECONOMY.flushPowerBase || 1.18;
  const currentIncomeMult = bigPow(FLUSH_POWER_BASE, req.flushes);
  const nextIncomeMult = bigPow(FLUSH_POWER_BASE, req.flushes + 1);
  const currentBoostPct = boostPctFromMult(currentIncomeMult);
  const nextBoostPct = boostPctFromMult(nextIncomeMult);

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

  GAME.prestigeRolls = gainBio(GAME.prestigeRolls || 0, breakdown.totalGain);
  GAME.allTimePrestigeRolls = gainBio(GAME.allTimePrestigeRolls || 0, breakdown.totalGain);
  GAME.transcendCycleRolls = gainBio(GAME.transcendCycleRolls || 0, breakdown.totalGain);

  const startTalent = TALENTS.find(t => t.id === 'royal_gold');
  const startBio = startTalent ? startTalent.level * 200 : 0;

  // Обнуление кошелька биомассы и прогресса форм текущего забега
  GAME.biomass = startBio;
  GAME.cycleBiomass = 0;
  GAME.currentRunPeakGPS = 0;
  GAME.archetype = chosenArchetype;

  // Сброс заводов (с сохранением части уровней при наличии реликвии Петля Мёбиуса)
  const keepLvl = getRelicLevel('relic_prestige_factory_keep');
  const keepRatio = keepLvl > 0 ? Math.min(0.25, keepLvl * 0.05) : 0;
  FACTORIES.forEach(fac => {
    fac.count = (keepRatio > 0 && fac.count > 0) ? Math.max(1, Math.floor(fac.count * keepRatio)) : 0;
  });
  GAME.clean = 100;
  GAME.hunger = 100;
  GAME.happy = 100;

  saveLocal();
  requestCloudSync(500);

  events.emit('prestige:completed', { gain: breakdown.totalGain, archetype: chosenArchetype, flushCount: nextFlushes });
  return true;
}
