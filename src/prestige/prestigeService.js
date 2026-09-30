import { GAME } from '../core/state.js';
import { FACTORIES } from '../data/factories.data.js';
import { TALENTS } from '../data/talents.data.js';
import { KNIVES } from '../data/knives.data.js';
import { events } from '../core/events.js';

export function getPrestigeRollsReward() {
  if (GAME.evoStage < 14 && (GAME.cycleBiomass || 0) < 100000) return 0;

  // Master Economy Dual Prestige Tier 1 (Calibrated smooth power 0.14)
  const bioRatio = Math.max(1, (GAME.cycleBiomass || 0) / 100000);
  const bioPart = Math.floor(15.0 * Math.pow(bioRatio, 0.14));
  const stagePart = Math.floor(Math.pow(1 + Math.max(0, GAME.evoStage || 0) / 15, 0.50) * 4);
  let baseRolls = Math.max(1, bioPart + stagePart);

  // Scythe / Коса knife synergy gives +25% rolls bonus
  const scythe = KNIVES.find(k => k.type === 'Scythe' && k.owned);
  if (scythe) {
    baseRolls = Math.round(baseRolls * 1.25);
  }

  // Talent bonuses (+8% per level each)
  const infFlush = TALENTS.find(t => t.id === 'infinity_flush');
  const hyperFlush = TALENTS.find(t => t.id === 'hyperspeed_flush');
  const flushTalentBonus = 1 + (infFlush ? infFlush.level * 0.08 : 0) + (hyperFlush ? hyperFlush.level * 0.08 : 0);
  baseRolls = Math.round(baseRolls * flushTalentBonus);

  return Math.max(1, baseRolls);
}

export function executePrestige(chosenArchetype = 'balanced') {
  const gain = getPrestigeRollsReward();
  if (gain <= 0) return false;

  GAME.prestigeRolls += gain;
  GAME.allTimePrestigeRolls = (GAME.allTimePrestigeRolls || 0) + gain;
  GAME.totalPrestiges++;
  GAME.cycleBiomass = 0;
  GAME.currentRunPeakGPS = 0;
  GAME.archetype = chosenArchetype;

  const startTalent = TALENTS.find(t => t.id === 'royal_gold');
  const startBio = startTalent ? startTalent.level * 50000 : 0;

  GAME.biomass = startBio;
  GAME.evoStage = 0;
  FACTORIES.forEach(fac => { fac.count = 0; });
  GAME.clean = 100;
  GAME.hunger = 100;
  GAME.happy = 100;

  events.emit('prestige:completed', { gain, archetype: chosenArchetype });
  return true;
}
