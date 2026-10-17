import { GAME, incFeedCount, incWashCount, incPolishCount } from '../core/state.js?v=5.4.30';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.4.30';
import { events } from '../core/events.js';
import { TALENTS } from '../data/talents.data.js';
import { hasPerk } from '../data/perks.data.js';

function meterHasRoom(value) {
  return Math.round(value) < 100;
}

export function feedPet() {
  if (!meterHasRoom(GAME.hunger)) return false;
  GAME.hunger = Math.min(100, GAME.hunger + 30);
  GAME.happy = Math.min(100, GAME.happy + 10);
  GAME.sparkles += 1;
  incFeedCount();
  if (!GAME.tutorialCareDone) GAME.tutorialCareDone = {};
  GAME.tutorialCareDone.feed = true;
  events.emit('pet:feed');
  return true;
}

export function washPet() {
  if (!meterHasRoom(GAME.clean)) return false;
  GAME.clean = Math.min(100, GAME.clean + 35);
  GAME.happy = Math.min(100, GAME.happy + 8);
  GAME.sparkles += 1;
  incWashCount();
  if (!GAME.tutorialCareDone) GAME.tutorialCareDone = {};
  GAME.tutorialCareDone.wash = true;
  events.emit('pet:wash');
  return true;
}

export function polishPet() {
  if (GAME.clean < 70) return false;
  GAME.clean = 100;
  GAME.sparkles += 4;
  incPolishCount();
  if (!GAME.tutorialCareDone) GAME.tutorialCareDone = {};
  GAME.tutorialCareDone.wash = true;
  events.emit('pet:polish');
  return true;
}

export function ticklePet() {
  if (!meterHasRoom(GAME.happy)) return false;
  GAME.happy = Math.min(100, GAME.happy + 15);
  GAME.comboHeat = Math.min(100, (GAME.comboHeat || 0) + 8);
  GAME.tickleCount = (GAME.tickleCount || 0) + 1;
  if (!GAME.tutorialCareDone) GAME.tutorialCareDone = {};
  GAME.tutorialCareDone.tickle = true;
  events.emit('pet:tickle');
  return true;
}

import { hasRelic } from '../data/relics.data.js?v=5.4.30';

function hasAutoCareUnlock() {
  return hasRelic('relic_auto_care') || !!GAME.transcendUpgrades?.autoCare;
}

export function decayNeeds(dt) {
  // Реликвия больше не замораживает шкалы на 100% — только открывает тумблеры авто.
  const zenMaster = hasPerk('perk_zen_harmony') || hasPerk('upg_zen_master');
  const baseDecay = zenMaster ? (1 / 3) : 1.0;

  // talent_care_duration: продлевает действие баффов Ухода на +5% времени
  const careDurationLvl = TALENTS.find(t => t.id === 'talent_care_duration')?.level || 0;
  const durationFactor = 1 + careDurationLvl * 0.05;
  const decayMult = baseDecay / durationFactor;

  GAME.hunger = Math.max(0, GAME.hunger - (0.25 * decayMult * dt));
  GAME.clean = Math.max(0, GAME.clean - (0.2 * decayMult * dt));
  // Счастье падает само (как сытость/чистота), плюс быстрее если питомец голодный/грязный.
  let happyDecay = 0.18 * decayMult * dt;
  if (GAME.hunger < 25 || GAME.clean < 25) {
    happyDecay += 0.25 * decayMult * dt;
  }
  GAME.happy = Math.max(0, GAME.happy - happyDecay);
}

export function runAutoCare() {
  if (!hasAutoCareUnlock()) return;
  let triggered = false;
  if (GAME.autoFeed && GAME.hunger < 75) {
    GAME.hunger = Math.min(100, GAME.hunger + 30);
    GAME.happy = Math.min(100, GAME.happy + 10);
    GAME.sparkles += 1;
    incFeedCount();
    triggered = true;
  }
  if (GAME.autoWash && GAME.clean < 75) {
    GAME.clean = Math.min(100, GAME.clean + 25);
    GAME.happy = Math.min(100, GAME.happy + 5);
    GAME.biomass += 5;
    incWashCount();
    triggered = true;
  } else if (GAME.autoWash && GAME.clean >= 75 && GAME.clean < 95) {
    GAME.clean = 100;
    GAME.happy = Math.min(100, GAME.happy + 15);
    GAME.sparkles += 1;
    incPolishCount();
    triggered = true;
  }
  if (GAME.autoTickle && GAME.happy < 85) {
    GAME.happy = Math.min(100, GAME.happy + 8);
    GAME.comboHeat = Math.min(100, (GAME.comboHeat || 0) + 4);
    triggered = true;
  }
  if (triggered) {
    events.emit('pet:autocare');
  }
}
