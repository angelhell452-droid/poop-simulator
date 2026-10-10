import { BOSS_ROSTER_PLAN, flatBossRoster } from './bosses.roster.plan.js';

/**
 * Live guild boss ladder: 13 themes × junior + senior = 26.
 * Art: assets/poop/bosses/<id>.png
 */
export const GUILD_BOSS_COUNT = 25;

export const BOSS_ANCHORS = [
  { index: 1, logHp: 8, plungers: 2 },
  { index: 5, logHp: 15, plungers: 5 },
  { index: 6, logHp: 22, plungers: 10 },
  { index: 10, logHp: 50, plungers: 20 },
  { index: 11, logHp: 90, plungers: 35 },
  { index: 15, logHp: 200, plungers: 50 },
  { index: 16, logHp: 350, plungers: 75 },
  { index: 20, logHp: 600, plungers: 100 },
  { index: 21, logHp: 750, plungers: 120 },
  { index: 25, logHp: 1000, plungers: 150 }
];

export function getBossLogHp(idx) {
  const i = Math.max(1, Math.min(GUILD_BOSS_COUNT, Number(idx) || 1));
  for (let s = 0; s < BOSS_ANCHORS.length - 1; s++) {
    const a = BOSS_ANCHORS[s];
    const b = BOSS_ANCHORS[s + 1];
    if (i >= a.index && i <= b.index) {
      if (a.index === b.index) return a.logHp;
      const t = (i - a.index) / (b.index - a.index);
      return a.logHp + (b.logHp - a.logHp) * t;
    }
  }
  return 1000;
}

export function getBossPlungers(idx) {
  const i = Math.max(1, Math.min(GUILD_BOSS_COUNT, Number(idx) || 1));
  for (let s = 0; s < BOSS_ANCHORS.length - 1; s++) {
    const a = BOSS_ANCHORS[s];
    const b = BOSS_ANCHORS[s + 1];
    if (i >= a.index && i <= b.index) {
      if (a.index === b.index) return a.plungers;
      const t = (i - a.index) / (b.index - a.index);
      return Math.round(a.plungers + (b.plungers - a.plungers) * t);
    }
  }
  return 150;
}

export function makeBossHpBig(logVal) {
  if (logVal < 15) {
    return Math.round(Math.pow(10, logVal));
  }
  const e = Math.floor(logVal);
  const m = Number(Math.pow(10, logVal - e).toFixed(4));
  return { __big: true, m, e };
}

/**
 * Цепочка строго из 25 Гильдейских Боссов.
 * Награды: от 2 Вантузов за Босса 1 до 150 Вантузов за Босса 25.
 * HP: от 10^8 за Босса 1 до 10^1000 за Босса 25.
 */
function buildGuildBosses() {
  return flatBossRoster().slice(0, GUILD_BOSS_COUNT).map((boss, idx) => {
    const i = idx + 1; // 1 to 25
    const plungers = getBossPlungers(i);
    const points = Math.round(25 + (i - 1) * 24);
    const logHp = getBossLogHp(i);
    const baseHp = makeBossHpBig(logHp);
    return {
      index: i,
      id: boss.id,
      name: boss.name,
      icon: boss.icon,
      theme: boss.theme,
      tier: boss.tier,
      points,
      plungers,
      logHp,
      baseHp,
      hp: baseHp
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
