import { GAME } from '../core/state.js?v=5.0.23';
import { getPhaseForStage } from '../progression/phases.data.js?v=5.0.23';

export const HORIZON_FORM = 100000;
export const SEAL_FORMS = [30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];

export function sealCount() {
  const peak = GAME.peakForm || 1;
  return SEAL_FORMS.reduce((n, form) => n + (peak >= form ? 1 : 0), 0);
}

export function sealPower() {
  return 1.5 + (GAME.horizonUpgrades?.seal ? 0.25 : 0);
}

export function horizonOpen() {
  return (GAME.peakForm || 1) >= HORIZON_FORM;
}

// Each later block of 10k forms is slower even after its seal.
export function horizonDrag(epoch) {
  if ((epoch || 1) <= 40) return 1;
  const formStart = (epoch - 1) * 500 + 1;
  const band = Math.max(0, Math.min(7, Math.floor((formStart - 20001) / 10000)));
  return Math.pow(1.875, band);
}

export function horizonIncomeMult() {
  if (getPhaseForStage(GAME.evoStage || 0).id <= 40) return 1;
  const seals = Math.pow(sealPower(), sealCount());
  const paceLvl = Math.min(5, GAME.horizonUpgrades?.pace || 0);
  return seals * (1 + paceLvl * 0.15);
}

export function horizonSparkCount() {
  return Math.max(0, GAME.horizonSparks || 0);
}

export function noteHorizonSpark(transcendsAfter) {
  if ((transcendsAfter || 0) >= 20) {
    GAME.horizonSparks = horizonSparkCount() + 1;
  }
}

const PACE_COSTS = [6, 10, 14, 18, 24];

export function horizonShopRows() {
  const pace = Math.min(5, GAME.horizonUpgrades?.pace || 0);
  const seal = !!GAME.horizonUpgrades?.seal;
  return [
    {
      id: 'pace',
      name: 'Ровный шаг',
      text: `+15% к доходу эпох горизонта за уровень. Сейчас +${pace * 15}%.`,
      cost: pace >= 5 ? 0 : PACE_COSTS[pace],
      owned: pace >= 5,
      label: pace >= 5 ? 'Потолок' : `Купить за ${PACE_COSTS[pace]} искр`
    },
    {
      id: 'seal',
      name: 'Густая печать',
      text: 'Печати горизонта дают x1.75 вместо x1.5.',
      cost: seal ? 0 : 20,
      owned: seal,
      label: seal ? 'Куплено' : 'Купить за 20 искр'
    },
    {
      id: 'next',
      name: 'Следующий ряд',
      text: 'Место для следующего контента горизонта.',
      cost: 0,
      owned: false,
      locked: true,
      label: 'Закрыто'
    }
  ];
}

export function buyHorizonUpgrade(id) {
  if (!horizonOpen()) return false;
  if (!GAME.horizonUpgrades) GAME.horizonUpgrades = { pace: 0, seal: 0 };
  const row = horizonShopRows().find((item) => item.id === id);
  if (!row || row.locked || row.owned || row.cost <= 0) return false;
  if (horizonSparkCount() < row.cost) return false;
  GAME.horizonSparks = horizonSparkCount() - row.cost;
  if (id === 'pace') GAME.horizonUpgrades.pace = Math.min(5, (GAME.horizonUpgrades.pace || 0) + 1);
  if (id === 'seal') GAME.horizonUpgrades.seal = 1;
  return true;
}
