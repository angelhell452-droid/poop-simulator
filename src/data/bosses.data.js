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

const LEVEL_POINTS = [0, 50, 120, 220, 360, 540, 780, 1100, 1500, 2000];

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

export function guildLevelFromPoints(points) {
  const score = Math.max(0, Math.floor(Number(points) || 0));
  let level = 1;
  for (let i = 0; i < LEVEL_POINTS.length; i++) {
    if (score >= LEVEL_POINTS[i]) level = i + 1;
  }
  return Math.min(10, level);
}

export function guildBonusMult(level) {
  const step = Math.max(0, Math.min(10, Math.floor(Number(level) || 0)));
  if (step <= 0) return 1;
  return 1 + step * 0.02;
}
