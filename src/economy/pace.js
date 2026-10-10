const VIP_MULT = [1, 2];
let confirmedVip = 0;

export const INCOME_PACE = 1.5;

export function setConfirmedVip(level) {
  const next = Math.floor(Number(level) || 0);
  confirmedVip = next > 0 ? 1 : 0;
  return confirmedVip;
}

export function getConfirmedVip() {
  return confirmedVip;
}

export function getVipIncomeMult() {
  return confirmedVip > 0 ? 2 : 1;
}

export function getIncomePace() {
  return INCOME_PACE * getVipIncomeMult();
}
