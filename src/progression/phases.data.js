import { formatNumber } from '../utils/numberFormatter.js?v=5.0.49';
import { bigPow10, div, mul } from '../utils/big.js?v=5.0.49';

export const PHASE_COUNT = 200;
export const PHASE_FORMS = 500;
export const CLASSIC_EPOCHS = 40;

const BANDS = [
  'миллионы',
  'миллиарды',
  'триллионы',
  'квадриллионы',
  'квинтиллионы',
  'секстиллионы',
  'септиллионы',
  'октиллионы',
  'нониллионы',
  'дециллионы'
];

export function phaseCeiling(phaseId) {
  const n = Math.min(PHASE_COUNT, Math.max(1, phaseId));
  const raw = 1e6 * Math.pow(1000, n - 1);
  if (Number.isFinite(raw)) return raw;
  return bigPow10(6 + 3 * (n - 1));
}

export function getPhaseByIndex(phaseId) {
  const id = Math.min(PHASE_COUNT, Math.max(1, phaseId));
  const formStart = (id - 1) * PHASE_FORMS + 1;
  const formEnd = id * PHASE_FORMS;
  const ceiling = phaseCeiling(id);
  return {
    id,
    formStart,
    formEnd,
    ceiling,
    floor: div(ceiling, 1000),
    flushForm: id === 1 ? 80 : formStart + 199,
    biomassGate: id === 1 ? 4000000 : mul(ceiling, 0.08),
    pair: Math.ceil(id / 2),
    transcend: id % 2 === 0,
    band: id <= BANDS.length ? BANDS[id - 1] : formatNumber(ceiling)
  };
}

export function getPhaseForForm(form) {
  const clamped = Math.min(PHASE_COUNT * PHASE_FORMS, Math.max(1, form || 1));
  return getPhaseByIndex(Math.floor((clamped - 1) / PHASE_FORMS) + 1);
}

export function getPhaseForStage(stage) {
  return getPhaseForForm((stage || 0) + 1);
}

/** Completed transcends. Zero keeps the first pair (forms 1–1000) open. */
export function maxUnlockedForm(transcends) {
  const pairs = 1 + Math.max(0, transcends || 0);
  return Math.min(PHASE_COUNT * PHASE_FORMS, pairs * 1000);
}

export function maxUnlockedStage(transcends) {
  return maxUnlockedForm(transcends) - 1;
}

export function phaseLabel(phase) {
  return `Эпоха ${formatNumber(phase.id)} · ${phase.band}`;
}
