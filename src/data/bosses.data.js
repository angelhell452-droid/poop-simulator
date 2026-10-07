export const GUILD_BOSSES = [
  { index: 1, id: 'broth', name: 'Капля Бульона', icon: '💧', points: 10, plungers: 1 },
  { index: 2, id: 'soot', name: 'Сажевый Жук', icon: '🪲', points: 15, plungers: 1 },
  { index: 3, id: 'mold', name: 'Кислотный Плесневик', icon: '🫧', points: 25, plungers: 1 },
  { index: 4, id: 'crystal', name: 'Кристальный Осколыш', icon: '💎', points: 40, plungers: 2 },
  { index: 5, id: 'neon', name: 'Неоновый Рой', icon: '🔮', points: 60, plungers: 2 },
  { index: 6, id: 'magma', name: 'Магмовый Ком', icon: '🔥', points: 80, plungers: 3 },
  { index: 7, id: 'void', name: 'Дыра-Страж', icon: '🕳️', points: 110, plungers: 3 },
  { index: 8, id: 'crown', name: 'Венец Вечности', icon: '👑', points: 150, plungers: 4 }
];

/** Points required to reach each level (index = level - 1). */
const LEVEL_POINTS = [
  0, 50, 120, 220, 360, 540, 780, 1100, 1500, 2000,
  2600, 3300, 4100, 5000, 6100,
  7400, 8900, 10600, 12500, 14700,
  17200, 20000, 23200, 26800, 31000
];

/**
 * Income mult by guild level. Soft steps with jumps at 5 / 10 / 15 / 20 / 25.
 * Lv.5 → x1.1, Lv.10 → x1.25, Lv.15 → x1.45, Lv.20 → x1.8, Lv.25 → x2.25.
 */
const GUILD_BONUS_BY_LEVEL = [
  1,
  1.02, 1.04, 1.06, 1.08, 1.10,
  1.12, 1.14, 1.16, 1.18, 1.25,
  1.28, 1.31, 1.34, 1.37, 1.45,
  1.50, 1.55, 1.60, 1.65, 1.80,
  1.85, 1.90, 1.95, 2.10, 2.25
];

export const GUILD_MAX_LEVEL = 25;

export function bossByIndex(index) {
  return GUILD_BOSSES.find((boss) => boss.index === Number(index)) || null;
}

export function bossReward(index, circle) {
  const boss = bossByIndex(index);
  const round = Math.max(1, Math.floor(Number(circle) || 1));
  if (!boss) return { points: 0, plungers: 0, circle: round };
  return {
    points: boss.points * round,
    plungers: Math.min(8, boss.plungers + (round - 1)),
    circle: round
  };
}

export function guildPointsForLevel(level) {
  const step = Math.max(1, Math.min(GUILD_MAX_LEVEL, Math.floor(Number(level) || 1)));
  return LEVEL_POINTS[step - 1] || 0;
}

export function guildLevelFromPoints(points) {
  const score = Math.max(0, Math.floor(Number(points) || 0));
  let level = 1;
  for (let i = 0; i < LEVEL_POINTS.length; i++) {
    if (score >= LEVEL_POINTS[i]) level = i + 1;
  }
  return Math.min(GUILD_MAX_LEVEL, level);
}

export function guildBonusMult(level) {
  const step = Math.max(0, Math.min(GUILD_MAX_LEVEL, Math.floor(Number(level) || 0)));
  if (step <= 0) return 1;
  return GUILD_BONUS_BY_LEVEL[step] || 1;
}

/** Short label like x1.1 / x1.25 for UI. */
export function guildBonusLabel(level) {
  const mult = guildBonusMult(level);
  const rounded = Math.round(mult * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `x${text}`;
}

/** Progress of current level: points toward the next tier. */
export function guildLevelProgress(points) {
  const score = Math.max(0, Math.floor(Number(points) || 0));
  const level = guildLevelFromPoints(score);
  const floor = guildPointsForLevel(level);
  const maxed = level >= GUILD_MAX_LEVEL;
  const next = maxed ? floor : guildPointsForLevel(level + 1);
  const span = Math.max(1, next - floor);
  const into = Math.max(0, Math.min(span, score - floor));
  const pct = maxed ? 100 : Math.max(0, Math.min(100, Math.round((into / span) * 100)));
  return { level, points: score, floor, next, into, need: span, pct, maxed };
}
