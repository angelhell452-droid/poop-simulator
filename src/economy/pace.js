const VIP_MULT = [1, 2, 2.5, 3, 4, 5];
let confirmedVip = 0;

export const INCOME_PACE = 1.5;

export function setConfirmedVip(level) {
  const next = Math.floor(Number(level) || 0);
  confirmedVip = Math.max(0, Math.min(VIP_MULT.length - 1, next));
  return confirmedVip;
}

export function getConfirmedVip() {
  return confirmedVip;
}

export function getVipIncomeMult() {
  return VIP_MULT[confirmedVip] || 1;
}

export function getIncomePace() {
  return INCOME_PACE * getVipIncomeMult();
}
