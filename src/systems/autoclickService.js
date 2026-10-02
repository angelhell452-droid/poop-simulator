import { GAME } from '../core/state.js';
import { TALENTS } from '../data/talents.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';

export function isAutoclickUnlocked() {
  return (GAME.totalPrestiges || 0) >= 1;
}

/** Base cap 8 CPS after the first Flush. Swift perk +2, Chronos +0.15 per level. */
export function getAutoclickCap() {
  if (!isAutoclickUnlocked()) return 0;
  const sovereign = TALENTS.find(t => t.id === 'time_sovereign');
  const perk = SHOP_ITEMS.find(i => i.id === 'upg_swift_click')?.owned;
  const bonus = (sovereign ? sovereign.level * 0.15 : 0) + (perk ? 2 : 0);
  return 8 + bonus;
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
  GAME.autoclickerSpeed = Math.max(1, Math.min(cap, requested));
}
