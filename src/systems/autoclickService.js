import { GAME } from '../core/state.js?v=5.0.39';
import { TALENTS } from '../data/talents.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.39';
import { getEquippedKnife, getKnifeStar } from '../economy/production.js?v=5.0.39';

export const BARE_CLICK_CAP = 40;

const KNIFE_CPS_BONUS = {
  common: 6,
  rare: 12,
  very_rare: 18,
  restricted: 18,
  epic: 26,
  classified: 34,
  covert: 44,
  rainbow: 56,
  celestial: 70,
  titanium: 84,
  godly: 100,
  special: 100
};

export function isAutoclickUnlocked() {
  return true;
}

/** Clicks per second this knife adds to the player's cap. */
export function getKnifeCpsBonus(knife) {
  if (!knife) return 0;
  const rarity = KNIFE_CPS_BONUS[knife.rarity] || 6;
  const stars = Math.min(15, Math.max(0, getKnifeStar(knife.id) - 1));
  return rarity + stars;
}

const CLICK_SPEED_PRESETS = [10, 20, 30];

/** If the player is on MAX, the chosen speed follows the live cap. */
export function syncAutoclickSpeedToCap() {
  if (!isAutoclickUnlocked()) return;
  const cap = getClickCapCps();
  const speed = Math.round(GAME.autoclickerSpeed || 1);
  if (!CLICK_SPEED_PRESETS.includes(speed) || speed > cap) {
    GAME.autoclickerSpeed = cap;
  }
}

/** Shared CPS ceiling for hands, the built-in autoclicker, and outside click tools. */
export function getClickCapCps() {
  let cap = BARE_CLICK_CAP;
  const knife = getEquippedKnife();
  if (knife) cap += getKnifeCpsBonus(knife);
  if (SHOP_ITEMS.find(i => i.id === 'upg_swift_click')?.owned) cap += 2;
  const sovereign = TALENTS.find(t => t.id === 'time_sovereign');
  cap += (sovereign ? sovereign.level : 0) * 0.15;
  return Math.max(BARE_CLICK_CAP, Math.round(cap));
}

export function getAutoclickCap() {
  if (!isAutoclickUnlocked()) return 0;
  return getClickCapCps();
}

export function getAutoclickCps() {
  if (!GAME.autoclickerActive || !isAutoclickUnlocked()) return 0;
  const cap = getAutoclickCap();
  const requested = GAME.autoclickerSpeed || 1;
  return Math.max(0, Math.min(cap, requested));
}

export function clampAutoclickerState() {
  if (!isAutoclickUnlocked()) {
    GAME.autoclickerActive = false;
    GAME.autoclickerSpeed = 1;
    return;
  }
  const cap = getAutoclickCap();
  const requested = GAME.autoclickerSpeed || 1;
  const speed = requested < 10 ? cap : requested;
  GAME.autoclickerSpeed = Math.max(1, Math.min(cap, speed));
}

const recentClickTimes = [];

/** Drops clicks above the live cap in any rolling second, including external autoclickers. */
export function takeClickBudget(requested) {
  const want = Math.max(0, Math.floor(requested) || 0);
  if (want <= 0) return 0;
  const cap = getClickCapCps();
  const now = performance.now();
  const horizon = now - 1000;
  while (recentClickTimes.length && recentClickTimes[0] <= horizon) {
    recentClickTimes.shift();
  }
  const room = Math.max(0, cap - recentClickTimes.length);
  const allowed = Math.min(want, room);
  for (let i = 0; i < allowed; i++) recentClickTimes.push(now);
  return allowed;
}
