import { KNIVES } from './knives.data.js';
import { WEAPON_CASES } from './cases.data.js';

const BARE_CAP = 40;
const CASE_CPS_BAND = {
  case_classic: [8, 18],
  case_chroma: [22, 34],
  case_gamma: [38, 52],
  case_prisma: [56, 72],
  case_dreams: [76, 94],
  case_rainbow: [98, 118],
  case_titanium: [122, 144],
  case_singularity: [148, 172],
  case_celestial: [176, 202],
  case_dragon: [206, 234],
  case_demigod: [238, 268],
  case_infinity: [272, 304]
};
const RARITY_CPS = {
  common: 6, rare: 12, very_rare: 18, restricted: 18, epic: 26,
  classified: 34, covert: 44, rainbow: 56, celestial: 70, titanium: 84, godly: 100, special: 100
};

const knifeById = new Map(KNIVES.map((knife) => [knife.id, knife]));
const knifeHomeCase = new Map();
[...WEAPON_CASES].sort((a, b) => (a.reqEpoch || 1) - (b.reqEpoch || 1)).forEach((caseObj) => {
  const teased = new Set(Object.keys(caseObj.fixedChances || {}));
  (caseObj.pool || []).forEach((id) => {
    if (teased.has(id) || knifeHomeCase.has(id)) return;
    knifeHomeCase.set(id, caseObj.id);
  });
});
const caseMateIds = new Map();
for (const [id, caseId] of knifeHomeCase) {
  if (!caseMateIds.has(caseId)) caseMateIds.set(caseId, []);
  caseMateIds.get(caseId).push(id);
}

function caseCpsBase(knife) {
  const caseId = knifeHomeCase.get(knife.id);
  const band = CASE_CPS_BAND[caseId];
  if (!band) return RARITY_CPS[knife.rarity] || 6;
  const mates = caseMateIds.get(caseId) || [knife.id];
  const clicks = mates.map((id) => knifeById.get(id)?.clickMult || 1);
  const min = Math.min(...clicks);
  const max = Math.max(...clicks);
  const t = max === min ? 1 : ((knife.clickMult || 1) - min) / (max - min);
  return Math.round(band[0] + t * (band[1] - band[0]));
}

export function bossClickCap(knifeId, stars) {
  const knife = knifeById.get(knifeId);
  if (!knife) return BARE_CAP;
  const starBonus = Math.min(15, Math.max(0, (Number(stars) || 1) - 1));
  return BARE_CAP + caseCpsBase(knife) + starBonus;
}

export function bossClickPower(stage, knifeId, stars) {
  const knife = knifeById.get(knifeId);
  const click = Math.max(1, Number(knife?.clickMult) || 1);
  const starBonus = Math.min(15, Math.max(0, (Number(stars) || 1) - 1));
  const formPart = Math.sqrt(Math.max(1, Number(stage) || 1));
  const knifePart = Math.log10(click + 1) * (1 + starBonus * 0.15);
  return Math.max(1, formPart * (1 + knifePart));
}

export function bossMaxHp(index, circle, members) {
  const n = Math.max(1, Math.floor(Number(index) || 1));
  const round = Math.max(1, Math.floor(Number(circle) || 1));
  const people = Math.max(1, Math.floor(Number(members) || 1));
  return Math.round(6000 * n * n * round * people);
}
