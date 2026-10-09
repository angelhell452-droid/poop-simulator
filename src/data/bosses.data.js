import { BOSS_ROSTER_PLAN, flatBossRoster } from './bosses.roster.plan.js';

/**
 * Live guild boss ladder: 13 themes × junior + senior = 26.
 * Art: assets/poop/bosses/<id>.png
 */
export const GUILD_BOSS_COUNT = 25;

/**
 * Цепочка строго из 25 Гильдейских Боссов.
 * Награды: от 2 Вантузов за Босса 1 до 150 Вантузов за Босса 25.
 */
function buildGuildBosses() {
  return flatBossRoster().slice(0, GUILD_BOSS_COUNT).map((boss, idx) => {
    const i = idx + 1; // 1 to 25
    const plungers = Math.round(2 + (i - 1) * ((150 - 2) / (GUILD_BOSS_COUNT - 1)));
    const points = Math.round(25 + (i - 1) * 24);
    return {
      index: i,
      id: boss.id,
      name: boss.name,
      icon: boss.icon,
      theme: boss.theme,
      tier: boss.tier,
      points,
      plungers
    };
  });
}

export const GUILD_BOSSES = buildGuildBosses();
export { BOSS_ROSTER_PLAN };

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
  // Circle only tracks attempts / HP; reward is locked to the boss index.
  return {
    points: boss.points,
    plungers: boss.plungers,
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
