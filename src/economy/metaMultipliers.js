import { GAME } from '../core/state.js';

/** Soft prestige income from lifetime rolls and flush count. Approaches a cap. */
export function getRollsIncomeMult(extraRolls = 0, extraPrestiges = 0) {
  const bank = Math.max(GAME.allTimePrestigeRolls || 0, GAME.prestigeRolls || 0) + extraRolls;
  const prestiges = (GAME.totalPrestiges || 0) + extraPrestiges;
  const rollPart = 1 + Math.pow(Math.max(0, bank), 0.45) * 0.12;
  const flushPart = 1 + 4 * (prestiges / (prestiges + 12));
  return rollPart * flushPart;
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
