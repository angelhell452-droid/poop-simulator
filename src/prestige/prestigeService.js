import { GAME } from '../core/state.js';
import { FACTORIES } from '../data/factories.data.js';
import { TALENTS } from '../data/talents.data.js';
import { KNIVES } from '../data/knives.data.js';
import { events } from '../core/events.js';

export function getPrestigeRollsReward() {
  if (GAME.evoStage < 14 && GAME.cycleBiomass < 100000) return 0;

  // Calibrated smooth root-power prestige formula
  const bioRatio = Math.max(0, GAME.cycleBiomass) / 100000;
  const bioPart = Math.floor(18 * Math.pow(bioRatio, 0.45));
  const stagePart = Math.floor(Math.pow(1 + Math.max(0, GAME.evoStage) / 15, 0.6) * 6);
  let baseRolls = Math.max(1, bioPart + stagePart);

  // Scythe / Коса knife synergy gives +25% rolls bonus
  const scythe = KNIVES.find(k => k.type === 'Scythe' && k.owned);
  if (scythe) {
    baseRolls = Math.round(baseRolls * 1.25);
  }

  const infFlush = TALENTS.find(t => t.id === 'infinity_flush');
  if (infFlush && infFlush.level > 0) {
    baseRolls = Math.round(baseRolls * (1 + infFlush.level * 0.15));
  }
  const hyperFlush = TALENTS.find(t => t.id === 'hyperspeed_flush');
  if (hyperFlush && hyperFlush.level > 0) {
    baseRolls = Math.round(baseRolls * (1 + hyperFlush.level * 0.15));
  }
  return Math.max(1, baseRolls);
}

export function executePrestige(chosenArchetype = 'balanced') {
  const gain = getPrestigeRollsReward();
  if (gain <= 0) return false;

  GAME.prestigeRolls += gain;
  GAME.totalPrestiges++;
  GAME.cycleBiomass = 0;
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
