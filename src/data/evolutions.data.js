import { getPhaseForStage, PHASE_FORMS } from '../progression/phases.data.js';
import { formatNumber } from '../utils/numberFormatter.js';

export const EPOCH_NAMES = [
  { epoch: "Первичный Био-Бульон", bg: "#0284c7", body: "#78350f", aura: null, archetype: "classic" },
  { epoch: "Индустриальный Смог", bg: "#334155", body: "#57534e", aura: "steam", archetype: "industrial" },
  { epoch: "Паровой Механизм", bg: "#475569", body: "#713f12", aura: "steam", archetype: "steampunk" },
  { epoch: "Токсичные Реагенты", bg: "#064e3b", body: "#15803d", aura: "toxic", archetype: "toxic" },
  { epoch: "Кристаллическая Жеода", bg: "#701a75", body: "#d97706", aura: "crystal", archetype: "crystal" },
  { epoch: "Неоновый Киберпанк", bg: "#0f172a", body: "#06b6d4", aura: "cyber", archetype: "cyber" },
  { epoch: "Нанотехнологический Рой", bg: "#1e293b", body: "#38bdf8", aura: "cyber", archetype: "cyber" },
  { epoch: "Ядерно-Урановый Распад", bg: "#022c22", body: "#22c55e", aura: "toxic", archetype: "toxic" },
  { epoch: "Вулканическая Магма", bg: "#450a0a", body: "#ef4444", aura: "magma", archetype: "magma" },
  { epoch: "Термоядерная Плазма", bg: "#7c2d12", body: "#f97316", aura: "magma", archetype: "magma" },
  { epoch: "Лунно-Орбитальный Дрейф", bg: "#1e1b4b", body: "#94a3b8", aura: "stars", archetype: "cosmic" },
  { epoch: "Гелиосферные Бури", bg: "#78350f", body: "#facc15", aura: "stars", archetype: "cosmic" },
  { epoch: "Сверхновые Звезды", bg: "#31104b", body: "#ec4899", aura: "stars", archetype: "cosmic" },
  { epoch: "Астральные Созвездия", bg: "#2e1065", body: "#a855f7", aura: "astral", archetype: "astral" },
  { epoch: "Гравитационные Черные Дыры", bg: "#030712", body: "#475569", aura: "multiverse", archetype: "void" },
  { epoch: "11-Мерные Суперструны", bg: "#09090b", body: "#c084fc", aura: "multiverse", archetype: "void" },
  { epoch: "Темная Материя Космоса", bg: "#020617", body: "#6366f1", aura: "multiverse", archetype: "void" },
  { epoch: "Галактический Квазар", bg: "#172554", body: "#38bdf8", aura: "stars", archetype: "cosmic" },
  { epoch: "Хроно-Временной Парадокс", bg: "#1c1917", body: "#eab308", aura: "astral", archetype: "astral" },
  { epoch: "Мультивселенский Разлом", bg: "#050505", body: "#f43f5e", aura: "multiverse", archetype: "void" },
  { epoch: "Сакральный Серафим", bg: "#451a03", body: "#fbbf24", aura: "divine", archetype: "divine" },
  { epoch: "Чистая Пси-Ноосфера", bg: "#1e1b4b", body: "#818cf8", aura: "divine", archetype: "divine" },
  { epoch: "Гиперпространственный Тетраэдр", bg: "#18181b", body: "#34d399", aura: "astral", archetype: "astral" },
  { epoch: "Творец Вселенского Разума", bg: "#020617", body: "#f472b6", aura: "divine", archetype: "divine" },
  { epoch: "Эфирные Дворцы Вечности", bg: "#2e0854", body: "#e879f9", aura: "divine", archetype: "divine" },
  { epoch: "Квантовый Абсолют", bg: "#082f49", body: "#38bdf8", aura: "cyber", archetype: "cyber" },
  { epoch: "Первородный Хаос Омниверса", bg: "#1a0026", body: "#fb7185", aura: "multiverse", archetype: "void" },
  { epoch: "Галактическая Сфера Дайсона", bg: "#422006", body: "#fef08a", aura: "stars", archetype: "cosmic" },
  { epoch: "Сингулярность Бесконечности", bg: "#020617", body: "#a855f7", aura: "void", archetype: "void" },
  { epoch: "Древо Измерений Иггдрасиль", bg: "#064e3b", body: "#86efac", aura: "astral", archetype: "astral" },
  { epoch: "Звездный Архитектор Бытия", bg: "#1e1b4b", body: "#67e8f9", aura: "divine", archetype: "divine" },
  { epoch: "Темпоральный Исток Вселенной", bg: "#292524", body: "#f59e0b", aura: "astral", archetype: "astral" },
  { epoch: "Престол Небесных Архангелов", bg: "#431407", body: "#fde047", aura: "divine", archetype: "divine" },
  { epoch: "Кольцо Мироздания", bg: "#14532d", body: "#4ade80", aura: "stars", archetype: "cosmic" },
  { epoch: "Энергетический Океан Творения", bg: "#172554", body: "#60a5fa", aura: "astral", archetype: "astral" },
  { epoch: "Врата Метавселенной", bg: "#3b0764", body: "#c084fc", aura: "multiverse", archetype: "void" },
  { epoch: "Корона Первородного Бога", bg: "#312e81", body: "#fbbf24", aura: "divine", archetype: "divine" },
  { epoch: "Око Вселенского Архитектора", bg: "#18181b", body: "#38bdf8", aura: "omega", archetype: "omega" },
  { epoch: "Сверхсознание Омниверса", bg: "#030712", body: "#f43f5e", aura: "omega", archetype: "omega" },
  { epoch: "Точка Омега: Абсолютный Бог", bg: "#000000", body: "#ffd700", aura: "omega", archetype: "omega" }
];

export const ENTITIES = [
  "Капля", "Комочек", "Завиток", "Шлам", "Брусок", "Монолит", "Сгусток", "Самородок", "Поршень", "Бойлер",
  "Процессор", "Сервер", "Мутант", "Аномалия", "Фонтан", "Шторм", "Владыка", "Ореол", "Страж", "Титан",
  "Коллапс", "Сингуляр", "Суперструна", "Квазар", "Парадокс", "Создатель", "Архитектор", "Абсолют", "Вулкан", "Дракон", "Архангел", "Демиург"
];

// Cost climbs about x1000 inside one epoch.
// Epoch 1 climbs x6. Epochs 2–4 double. From epoch 5 each epoch adds x1.25, with no drop on the boundary.
export function calcEvolutionCost(i) {
  if (i <= 0) return 0;
  const phase = getPhaseForStage(i);
  const local = (i - (phase.formStart - 1)) / PHASE_FORMS;
  const cost = phase.floor * Math.pow(1000, Math.min(1, Math.max(0, local)));
  const stretch = Math.pow(i + 1, 1.25);
  const stretched = cost * stretch;
  if (!Number.isFinite(stretched)) return phase.ceiling * stretch;
  return Math.max(1, Math.floor(stretched));
}

export function calcEvolutionMult(i) {
  if (i <= 0) return 1;
  const phase = getPhaseForStage(i);
  const local = (i - (phase.formStart - 1)) / PHASE_FORMS;
  const t = Math.min(1, Math.max(0, local));
  if (phase.id <= 1) return Math.pow(6, t);
  if (phase.id <= 4) return 6 * Math.pow(2, (phase.id - 2) + t);
  const atEndOfFourth = 6 * Math.pow(2, 3);
  return atEndOfFourth * Math.pow(1.25, (phase.id - 5) + t);
}

export function generateEvolutions() {
  const list = [];
  for (let i = 0; i < 20000; i++) {
    const epochIdx = Math.min(EPOCH_NAMES.length - 1, Math.floor(i / 500));
    const ep = EPOCH_NAMES[epochIdx];
    const ent = ENTITIES[(i * 3 + Math.floor(i / 7)) % ENTITIES.length];
    const tier = (i % 100) + 1;
    const name = (i === 19999)
      ? 'Омега'
      : (i % 500 === 0 ? 'Владыка' : `${ent} ${tier}`);

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
      desc: `Форма №${formatNumber(i + 1)} — ${name}`
    });
  }
  return list;
}

export const EVOLUTIONS = generateEvolutions();
