import { getPhaseForStage } from '../progression/phases.data.js?v=5.4.4';
import { PHASE_FORMS, PHASE_COUNT } from '../progression/phases.constants.js?v=5.4.4';
import { formatNumber } from '../utils/numberFormatter.js?v=5.4.4';
import { isBig, mul, div, sub, bigPow } from '../utils/big.js?v=5.4.4';
import { GAME } from '../core/state.js?v=5.4.4';
import { ECONOMY } from '../economy/economy.config.js?v=5.4.4';

export const EPOCH_NAMES = [
  { epoch: "╨ƒ╨╡╤Ç╨▓╨╕╤ç╨╜╤ï╨╣ ╨æ╨╕╨╛-╨æ╤â╨╗╤î╨╛╨╜", bg: "#0284c7", body: "#78350f", aura: null, archetype: "classic" },
  { epoch: "╨ÿ╨╜╨┤╤â╤ü╤é╤Ç╨╕╨░╨╗╤î╨╜╤ï╨╣ ╨í╨╝╨╛╨│", bg: "#334155", body: "#57534e", aura: "steam", archetype: "industrial" },
  { epoch: "╨ƒ╨░╤Ç╨╛╨▓╨╛╨╣ ╨£╨╡╤à╨░╨╜╨╕╨╖╨╝", bg: "#475569", body: "#713f12", aura: "steam", archetype: "steampunk" },
  { epoch: "╨ó╨╛╨║╤ü╨╕╤ç╨╜╤ï╨╡ ╨á╨╡╨░╨│╨╡╨╜╤é╤ï", bg: "#064e3b", body: "#15803d", aura: "toxic", archetype: "toxic" },
  { epoch: "╨Ü╤Ç╨╕╤ü╤é╨░╨╗╨╗╨╕╤ç╨╡╤ü╨║╨░╤Å ╨û╨╡╨╛╨┤╨░", bg: "#701a75", body: "#d97706", aura: "crystal", archetype: "crystal" },
  { epoch: "╨¥╨╡╨╛╨╜╨╛╨▓╤ï╨╣ ╨Ü╨╕╨▒╨╡╤Ç╨┐╨░╨╜╨║", bg: "#0f172a", body: "#06b6d4", aura: "cyber", archetype: "cyber" },
  { epoch: "╨¥╨░╨╜╨╛╤é╨╡╤à╨╜╨╛╨╗╨╛╨│╨╕╤ç╨╡╤ü╨║╨╕╨╣ ╨á╨╛╨╣", bg: "#1e293b", body: "#38bdf8", aura: "cyber", archetype: "cyber" },
  { epoch: "╨»╨┤╨╡╤Ç╨╜╨╛-╨ú╤Ç╨░╨╜╨╛╨▓╤ï╨╣ ╨á╨░╤ü╨┐╨░╨┤", bg: "#022c22", body: "#22c55e", aura: "toxic", archetype: "toxic" },
  { epoch: "╨Æ╤â╨╗╨║╨░╨╜╨╕╤ç╨╡╤ü╨║╨░╤Å ╨£╨░╨│╨╝╨░", bg: "#450a0a", body: "#ef4444", aura: "magma", archetype: "magma" },
  { epoch: "╨ó╨╡╤Ç╨╝╨╛╤Å╨┤╨╡╤Ç╨╜╨░╤Å ╨ƒ╨╗╨░╨╖╨╝╨░", bg: "#7c2d12", body: "#f97316", aura: "magma", archetype: "magma" },
  { epoch: "╨¢╤â╨╜╨╜╨╛-╨₧╤Ç╨▒╨╕╤é╨░╨╗╤î╨╜╤ï╨╣ ╨ö╤Ç╨╡╨╣╤ä", bg: "#1e1b4b", body: "#94a3b8", aura: "stars", archetype: "cosmic" },
  { epoch: "╨ô╨╡╨╗╨╕╨╛╤ü╤ä╨╡╤Ç╨╜╤ï╨╡ ╨æ╤â╤Ç╨╕", bg: "#78350f", body: "#facc15", aura: "stars", archetype: "cosmic" },
  { epoch: "╨í╨▓╨╡╤Ç╤à╨╜╨╛╨▓╤ï╨╡ ╨ù╨▓╨╡╨╖╨┤╤ï", bg: "#31104b", body: "#ec4899", aura: "stars", archetype: "cosmic" },
  { epoch: "╨É╤ü╤é╤Ç╨░╨╗╤î╨╜╤ï╨╡ ╨í╨╛╨╖╨▓╨╡╨╖╨┤╨╕╤Å", bg: "#2e1065", body: "#a855f7", aura: "astral", archetype: "astral" },
  { epoch: "╨ô╤Ç╨░╨▓╨╕╤é╨░╤å╨╕╨╛╨╜╨╜╤ï╨╡ ╨º╨╡╤Ç╨╜╤ï╨╡ ╨ö╤ï╤Ç╤ï", bg: "#030712", body: "#475569", aura: "multiverse", archetype: "void" },
  { epoch: "11-╨£╨╡╤Ç╨╜╤ï╨╡ ╨í╤â╨┐╨╡╤Ç╤ü╤é╤Ç╤â╨╜╤ï", bg: "#09090b", body: "#c084fc", aura: "multiverse", archetype: "void" },
  { epoch: "╨ó╨╡╨╝╨╜╨░╤Å ╨£╨░╤é╨╡╤Ç╨╕╤Å ╨Ü╨╛╤ü╨╝╨╛╤ü╨░", bg: "#020617", body: "#6366f1", aura: "multiverse", archetype: "void" },
  { epoch: "╨ô╨░╨╗╨░╨║╤é╨╕╤ç╨╡╤ü╨║╨╕╨╣ ╨Ü╨▓╨░╨╖╨░╤Ç", bg: "#172554", body: "#38bdf8", aura: "stars", archetype: "cosmic" },
  { epoch: "╨Ñ╤Ç╨╛╨╜╨╛-╨Æ╤Ç╨╡╨╝╨╡╨╜╨╜╨╛╨╣ ╨ƒ╨░╤Ç╨░╨┤╨╛╨║╤ü", bg: "#1c1917", body: "#eab308", aura: "astral", archetype: "astral" },
  { epoch: "╨£╤â╨╗╤î╤é╨╕╨▓╤ü╨╡╨╗╨╡╨╜╤ü╨║╨╕╨╣ ╨á╨░╨╖╨╗╨╛╨╝", bg: "#050505", body: "#f43f5e", aura: "multiverse", archetype: "void" },
  { epoch: "╨í╨░╨║╤Ç╨░╨╗╤î╨╜╤ï╨╣ ╨í╨╡╤Ç╨░╤ä╨╕╨╝", bg: "#451a03", body: "#fbbf24", aura: "divine", archetype: "divine" },
  { epoch: "╨º╨╕╤ü╤é╨░╤Å ╨ƒ╤ü╨╕-╨¥╨╛╨╛╤ü╤ä╨╡╤Ç╨░", bg: "#1e1b4b", body: "#818cf8", aura: "divine", archetype: "divine" },
  { epoch: "╨ô╨╕╨┐╨╡╤Ç╨┐╤Ç╨╛╤ü╤é╤Ç╨░╨╜╤ü╤é╨▓╨╡╨╜╨╜╤ï╨╣ ╨ó╨╡╤é╤Ç╨░╤ì╨┤╤Ç", bg: "#18181b", body: "#34d399", aura: "astral", archetype: "astral" },
  { epoch: "╨ó╨▓╨╛╤Ç╨╡╤å ╨Æ╤ü╨╡╨╗╨╡╨╜╤ü╨║╨╛╨│╨╛ ╨á╨░╨╖╤â╨╝╨░", bg: "#020617", body: "#f472b6", aura: "divine", archetype: "divine" },
  { epoch: "╨¡╤ä╨╕╤Ç╨╜╤ï╨╡ ╨ö╨▓╨╛╤Ç╤å╤ï ╨Æ╨╡╤ç╨╜╨╛╤ü╤é╨╕", bg: "#2e0854", body: "#e879f9", aura: "divine", archetype: "divine" },
  { epoch: "╨Ü╨▓╨░╨╜╤é╨╛╨▓╤ï╨╣ ╨É╨▒╤ü╨╛╨╗╤Ä╤é", bg: "#082f49", body: "#38bdf8", aura: "cyber", archetype: "cyber" },
  { epoch: "╨ƒ╨╡╤Ç╨▓╨╛╤Ç╨╛╨┤╨╜╤ï╨╣ ╨Ñ╨░╨╛╤ü ╨₧╨╝╨╜╨╕╨▓╨╡╤Ç╤ü╨░", bg: "#1a0026", body: "#fb7185", aura: "multiverse", archetype: "void" },
  { epoch: "╨ô╨░╨╗╨░╨║╤é╨╕╤ç╨╡╤ü╨║╨░╤Å ╨í╤ä╨╡╤Ç╨░ ╨ö╨░╨╣╤ü╨╛╨╜╨░", bg: "#422006", body: "#fef08a", aura: "stars", archetype: "cosmic" },
  { epoch: "╨í╨╕╨╜╨│╤â╨╗╤Å╤Ç╨╜╨╛╤ü╤é╤î ╨æ╨╡╤ü╨║╨╛╨╜╨╡╤ç╨╜╨╛╤ü╤é╨╕", bg: "#020617", body: "#a855f7", aura: "void", archetype: "void" },
  { epoch: "╨ö╤Ç╨╡╨▓╨╛ ╨ÿ╨╖╨╝╨╡╤Ç╨╡╨╜╨╕╨╣ ╨ÿ╨│╨│╨┤╤Ç╨░╤ü╨╕╨╗╤î", bg: "#064e3b", body: "#86efac", aura: "astral", archetype: "astral" },
  { epoch: "╨ù╨▓╨╡╨╖╨┤╨╜╤ï╨╣ ╨É╤Ç╤à╨╕╤é╨╡╨║╤é╨╛╤Ç ╨æ╤ï╤é╨╕╤Å", bg: "#1e1b4b", body: "#67e8f9", aura: "divine", archetype: "divine" },
  { epoch: "╨ó╨╡╨╝╨┐╨╛╤Ç╨░╨╗╤î╨╜╤ï╨╣ ╨ÿ╤ü╤é╨╛╨║ ╨Æ╤ü╨╡╨╗╨╡╨╜╨╜╨╛╨╣", bg: "#292524", body: "#f59e0b", aura: "astral", archetype: "astral" },
  { epoch: "╨ƒ╤Ç╨╡╤ü╤é╨╛╨╗ ╨¥╨╡╨▒╨╡╤ü╨╜╤ï╤à ╨É╤Ç╤à╨░╨╜╨│╨╡╨╗╨╛╨▓", bg: "#431407", body: "#fde047", aura: "divine", archetype: "divine" },
  { epoch: "╨Ü╨╛╨╗╤î╤å╨╛ ╨£╨╕╤Ç╨╛╨╖╨┤╨░╨╜╨╕╤Å", bg: "#14532d", body: "#4ade80", aura: "stars", archetype: "cosmic" },
  { epoch: "╨¡╨╜╨╡╤Ç╨│╨╡╤é╨╕╤ç╨╡╤ü╨║╨╕╨╣ ╨₧╨║╨╡╨░╨╜ ╨ó╨▓╨╛╤Ç╨╡╨╜╨╕╤Å", bg: "#172554", body: "#60a5fa", aura: "astral", archetype: "astral" },
  { epoch: "╨Æ╤Ç╨░╤é╨░ ╨£╨╡╤é╨░╨▓╤ü╨╡╨╗╨╡╨╜╨╜╨╛╨╣", bg: "#3b0764", body: "#c084fc", aura: "multiverse", archetype: "void" },
  { epoch: "╨Ü╨╛╤Ç╨╛╨╜╨░ ╨ƒ╨╡╤Ç╨▓╨╛╤Ç╨╛╨┤╨╜╨╛╨│╨╛ ╨æ╨╛╨│╨░", bg: "#312e81", body: "#fbbf24", aura: "divine", archetype: "divine" },
  { epoch: "╨₧╨║╨╛ ╨Æ╤ü╨╡╨╗╨╡╨╜╤ü╨║╨╛╨│╨╛ ╨É╤Ç╤à╨╕╤é╨╡╨║╤é╨╛╤Ç╨░", bg: "#18181b", body: "#38bdf8", aura: "omega", archetype: "omega" },
  { epoch: "╨í╨▓╨╡╤Ç╤à╤ü╨╛╨╖╨╜╨░╨╜╨╕╨╡ ╨₧╨╝╨╜╨╕╨▓╨╡╤Ç╤ü╨░", bg: "#030712", body: "#f43f5e", aura: "omega", archetype: "omega" },
  { epoch: "╨ó╨╛╤ç╨║╨░ ╨₧╨╝╨╡╨│╨░: ╨É╨▒╤ü╨╛╨╗╤Ä╤é╨╜╤ï╨╣ ╨æ╨╛╨│", bg: "#000000", body: "#ffd700", aura: "omega", archetype: "omega" }
];

export const ENTITIES = [
  "╨Ü╨░╨┐╨╗╤Å", "╨Ü╨╛╨╝╨╛╤ç╨╡╨║", "╨ù╨░╨▓╨╕╤é╨╛╨║", "╨¿╨╗╨░╨╝", "╨æ╤Ç╤â╤ü╨╛╨║", "╨£╨╛╨╜╨╛╨╗╨╕╤é", "╨í╨│╤â╤ü╤é╨╛╨║", "╨í╨░╨╝╨╛╤Ç╨╛╨┤╨╛╨║", "╨ƒ╨╛╤Ç╤ê╨╡╨╜╤î", "╨æ╨╛╨╣╨╗╨╡╤Ç",
  "╨ƒ╤Ç╨╛╤å╨╡╤ü╤ü╨╛╤Ç", "╨í╨╡╤Ç╨▓╨╡╤Ç", "╨£╤â╤é╨░╨╜╤é", "╨É╨╜╨╛╨╝╨░╨╗╨╕╤Å", "╨ñ╨╛╨╜╤é╨░╨╜", "╨¿╤é╨╛╤Ç╨╝", "╨Æ╨╗╨░╨┤╤ï╨║╨░", "╨₧╤Ç╨╡╨╛╨╗", "╨í╤é╤Ç╨░╨╢", "╨ó╨╕╤é╨░╨╜",
  "╨Ü╨╛╨╗╨╗╨░╨┐╤ü", "╨í╨╕╨╜╨│╤â╨╗╤Å╤Ç", "╨í╤â╨┐╨╡╤Ç╤ü╤é╤Ç╤â╨╜╨░", "╨Ü╨▓╨░╨╖╨░╤Ç", "╨ƒ╨░╤Ç╨░╨┤╨╛╨║╤ü", "╨í╨╛╨╖╨┤╨░╤é╨╡╨╗╤î", "╨É╤Ç╤à╨╕╤é╨╡╨║╤é╨╛╤Ç", "╨É╨▒╤ü╨╛╨╗╤Ä╤é", "╨Æ╤â╨╗╨║╨░╨╜", "╨ö╤Ç╨░╨║╨╛╨╜", "╨É╤Ç╤à╨░╨╜╨│╨╡╨╗", "╨ö╨╡╨╝╨╕╤â╤Ç╨│"
];

/**
 * ╨ƒ╨╛╤Ç╨╛╨│ cycleBiomass ╨┤╨╗╤Å ╤ä╨╛╤Ç╨╝╤ï (stage index i) ΓÇö ╨╜╨░╨║╨╛╨┐╨╗╨╡╨╜╨╜╨░╤Å ╤ü╤â╨╝╨╝╨░ ╤å╨╡╨╜ ╤â╤Ç╨╛╨▓╨╜╨╡╨╣.
 *
 * ╨ª╨╡╨╜╨░ ╨╛╨┤╨╜╨╛╨│╨╛ ╤â╤Ç╨╛╨▓╨╜╤Å stage (╨┐╤Ç╨╕╤Ç╨╛╤ü╤é ╨║ ╨┐╤Ç╨╡╨┤╤ï╨┤╤â╤ë╨╡╨╝╤â ╨┐╨╛╤Ç╨╛╨│╤â):
 *   formBaseCost * K^((stage-1) / factoryFormStep) * flushPowerBase^flushes
 * Γëê ╨╝╨╛╨┤╨╡╨╗╤î╨╜╤ï╨╣ CPS ╤é╨╕╤Ç╨░ ├ù formBuySeconds.
 *
 * ╨É╨▒╤ü╨╛╨╗╤Ä╤é╨╜╤ï╨╣ ╨┐╨╛╤Ç╨╛╨│: sum_{j=0}^{i-1} base * r^j * flushMult = base * flushMult * (r^i - 1) / (r - 1),
 * ╨│╨┤╨╡ r = K^(1 / factoryFormStep). K ╨╕ step ╨╝╨░╤ü╤ê╤é╨░╨▒╨╕╤Ç╤â╤Ä╤é ╤ü╨╗╨╛╨╢╨╜╨╛╤ü╤é╤î ╨▓╨┐╨╡╤Ç╤æ╨┤, ╨░ ╤ü╨╛╤ü╨╡╨┤╨╜╨╕╨╡
 * ╤â╤Ç╨╛╨▓╨╜╨╕ ╨╛╤é╨╗╨╕╤ç╨░╤Ä╤é╤ü╤Å ╨╜╨░ ╨┐╨╛╨╗╨╜╤ï╨╣ ┬½╨┐╨░╨║╨╡╤é┬╗ ~formBuySeconds, ╨░ ╨╜╨╡ ╨╜╨░ ╨╝╨╕╨║╤Ç╨╛╨┤╨╡╨╗╤î╤é╤â K^(1/step).
 */
export function calcEvolutionCost(i) {
  if (i <= 0) return 0;
  const stage = Math.max(0, Number(i) || 0);
  const step = Math.max(1, ECONOMY.factoryFormStep);
  const K = Math.max(1.000001, ECONOMY.tierGrowthK);
  const flushes = Math.max(0, Number(GAME?.flushCount ?? GAME?.totalPrestiges ?? 0) || 0);
  const flushMult = Math.pow(Math.max(1.01, ECONOMY.flushPowerBase || 1.18), flushes);
  const base = ECONOMY.formBaseCost;
  const r = Math.pow(K, 1 / step);

  // sum = (r^stage - 1) / (r - 1)
  let sum;
  const rn = Math.pow(r, stage);
  if (Number.isFinite(rn) && rn < 1e300) {
    sum = (rn - 1) / (r - 1);
  } else {
    // K^(stage/step) = r^stage; big-╨┐╤â╤é╤î ╨┤╨╗╤Å ╨┐╨╛╨╖╨┤╨╜╨╡╨╣ ╨╕╨│╤Ç╤ï
    sum = div(sub(bigPow(K, stage / step), 1), r - 1);
  }

  const total = mul(mul(base, flushMult), sum);
  if (!isBig(total) && Number.isFinite(total)) return Math.max(1, Math.floor(total));
  return total;
}

export function calcEvolutionMult(i) {
  if (i <= 0) return 1;
  const phase = getPhaseForStage(i);
  const local = (i - (phase.formStart - 1)) / PHASE_FORMS;
  const t = Math.min(1, Math.max(0, local));
  if (phase.id <= 1) return Math.pow(6, t);
  if (phase.id <= 4) return 6 * Math.pow(2, (phase.id - 2) + t);
  const atEndOfFourth = 6 * Math.pow(2, 3);
  return mul(atEndOfFourth, bigPow(1.25, (phase.id - 5) + t));
}

function lookForIndex(i) {
  const epochIdx = Math.floor(i / PHASE_FORMS);
  if (epochIdx < EPOCH_NAMES.length) return EPOCH_NAMES[epochIdx];
  const base = EPOCH_NAMES[epochIdx % EPOCH_NAMES.length];
  const ent = ENTITIES[epochIdx % ENTITIES.length];
  return { ...base, epoch: `╨ô╨╛╤Ç╨╕╨╖╨╛╨╜╤é: ${ent}` };
}

export function createEvolutionObject(i) {
  const ep = lookForIndex(i);
  const ent = ENTITIES[(i * 3 + Math.floor(i / 7)) % ENTITIES.length];
  const tier = (i % 100) + 1;
  const name = (i % 500 === 0) ? '╨Æ╨╗╨░╨┤╤ï╨║╨░' : `${ent} ${tier}`;

  const cost = calcEvolutionCost(i);
  const mult = calcEvolutionMult(i);

  return {
    id: i,
    name: name,
    epoch: ep.epoch,
    archetype: ep.archetype || "classic",
    cost: cost,
    mult: mult,
    bgColor: ep.bg,
    bodyColor: ep.body,
    aura: ep.aura,
    desc: `╨ñ╨╛╤Ç╨╝╨░ Γäû${formatNumber(i + 1)} ΓÇö ${name}`
  };
}

export function generateEvolutions() {
  const list = [];
  const last = PHASE_COUNT * PHASE_FORMS;
  for (let i = 0; i < last; i++) {
    const ep = lookForIndex(i);
    const ent = ENTITIES[(i * 3 + Math.floor(i / 7)) % ENTITIES.length];
    const tier = (i % 100) + 1;
    const name = (i === last - 1)
      ? '╨₧╨╝╨╡╨│╨░'
      : (i % 500 === 0 ? '╨Æ╨╗╨░╨┤╤ï╨║╨░' : `${ent} ${tier}`);

    const cost = calcEvolutionCost(i);
    const mult = calcEvolutionMult(i);

    list.push({
      id: i,
      name: name,
      epoch: ep.epoch,
      archetype: ep.archetype || "classic",
      cost: cost,
      mult: mult,
      bgColor: ep.bg,
      bodyColor: ep.body,
      aura: ep.aura,
      desc: `╨ñ╨╛╤Ç╨╝╨░ Γäû${formatNumber(i + 1)} ΓÇö ${name}`
    });
  }
  return list;
}

const rawEvolutions = generateEvolutions();

export const EVOLUTIONS = new Proxy(rawEvolutions, {
  get(target, prop) {
    if (typeof prop === 'string') {
      const idx = Number(prop);
      if (Number.isInteger(idx) && idx >= 0) {
        const row = idx < target.length ? target[idx] : createEvolutionObject(idx);
        // ╨û╨╕╨▓╨░╤Å ╤å╨╡╨╜╨░ ╤ä╨╛╤Ç╨╝╤ï: ╨╖╨░╨▓╨╕╤ü╨╕╤é ╨╛╤é ╤ç╨╕╤ü╨╗╨░ ╤ü╨╝╤ï╨▓╨╛╨▓ (╨╛╤ü╤î ╨│╨░╤Ç╨╝╨╛╨╜╨╕╨╕).
        return { ...row, cost: calcEvolutionCost(idx) };
      }
    }
    return target[prop];
  }
});
