import { GAME, incFeedCount, incWashCount, incPolishCount } from '../core/state.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { events } from '../core/events.js';

function meterHasRoom(value) {
  return Math.round(value) < 100;
}

export function feedPet() {
  if (!meterHasRoom(GAME.hunger)) return false;
  GAME.hunger = Math.min(100, GAME.hunger + 30);
  GAME.happy = Math.min(100, GAME.happy + 10);
  GAME.sparkles += 1;
  incFeedCount();
  events.emit('pet:feed');
  return true;
}

export function washPet() {
  if (!meterHasRoom(GAME.clean)) return false;
  GAME.clean = Math.min(100, GAME.clean + 35);
  GAME.happy = Math.min(100, GAME.happy + 8);
  GAME.sparkles += 1;
  incWashCount();
  events.emit('pet:wash');
  return true;
}

export function polishPet() {
  if (GAME.clean < 70) return false;
  GAME.clean = 100;
  GAME.sparkles += 4;
  incPolishCount();
  events.emit('pet:polish');
  return true;
}

export function ticklePet() {
  if (!meterHasRoom(GAME.happy)) return false;
  GAME.happy = Math.min(100, GAME.happy + 15);
  GAME.comboHeat = Math.min(100, (GAME.comboHeat || 0) + 8);
  events.emit('pet:tickle');
  return true;
}

export function decayNeeds(dt) {
  const zenMaster = SHOP_ITEMS.find(i => i.id === 'upg_zen_master')?.owned;
  const decayMult = zenMaster ? 0.33 : 1.0;
  
  GAME.hunger = Math.max(0, GAME.hunger - (0.25 * decayMult * dt));
  GAME.clean = Math.max(0, GAME.clean - (0.2 * decayMult * dt));
  if (GAME.hunger < 25 || GAME.clean < 25) {
    GAME.happy = Math.max(0, GAME.happy - (0.4 * decayMult * dt));
  }
}

export function runAutoCare() {
  if (!GAME.transcendUpgrades?.autoCare) return;
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
  if (GAME.autoTickle && GAME.happy < 100) {
    GAME.happy = Math.min(100, GAME.happy + 8);
    GAME.comboHeat = Math.min(100, (GAME.comboHeat || 0) + 4);
    triggered = true;
  }
  if (triggered) {
    events.emit('pet:autocare');
  }
}
