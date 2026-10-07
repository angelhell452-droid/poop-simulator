/**
 * План гильдейских боссов (13 тем × младший + старший = 26).
 * Картинки: assets/poop/bosses/<id>.png — PNG с альфой (вырезка chroma green).
 * Статус арта: 26/26 в assets/poop/bosses/.
 * Подключено через GUILD_BOSSES в bosses.data.js (flatBossRoster).
 */

export const BOSS_ROSTER_PLAN = [
  {
    theme: 'Бумажная угроза',
    themeIndex: 1,
    junior: {
      id: 'cheap-paper',
      name: 'Дешевая туалетка',
      icon: '🧻',
      prompt: 'Cheap 1-ply toilet paper roll monster, funny, cartoon style'
    },
    senior: {
      id: 'elite-paper',
      name: 'Элитная бумага',
      icon: '🌸',
      prompt: 'Premium 4-ply pink toilet paper monster, soft and fluffy, glowing aura, cartoon style'
    }
  },
  {
    theme: 'Летающий кошмар',
    themeIndex: 2,
    junior: {
      id: 'fruit-fly',
      name: 'Слепая мушка',
      icon: '🪰',
      prompt: 'Small sewer fruit fly insect, big eyes, cartoon monster'
    },
    senior: {
      id: 'mutant-mosquito',
      name: 'Комар-мутант',
      icon: '🦟',
      prompt: 'Giant toxic mutant sewer mosquito, glowing green acid, evil insect boss'
    }
  },
  {
    theme: 'Скользкий враг',
    themeIndex: 3,
    junior: {
      id: 'grumpy-soap',
      name: 'Злой Обмылок',
      icon: '🧼',
      prompt: 'Slippery dirty soap bar monster, bubbles, grumpy face'
    },
    senior: {
      id: 'sanitizer-slime',
      name: 'Гель-антисептик',
      icon: '🧴',
      prompt: 'Sentient hand sanitizer slime monster, thick bubbles, glowing cyan liquid'
    }
  },
  {
    theme: 'Неперевариваемая еда',
    themeIndex: 4,
    junior: {
      id: 'angry-corn',
      name: 'Злая кукурузинка',
      icon: '🌽',
      prompt: 'Angry sweet corn kernel monster, funny face, cartoon style'
    },
    senior: {
      id: 'ghost-jalapeno',
      name: 'Призрачный Халапеньо',
      icon: '🌶️',
      prompt: 'Flaming red jalapeno pepper ghost monster, fire aura, angry'
    }
  },
  {
    theme: 'Инструмент чистоты',
    themeIndex: 5,
    junior: {
      id: 'bald-brush',
      name: 'Лысый ершик',
      icon: '🪥',
      prompt: 'Old bald toilet brush monster, rusty, sad but angry'
    },
    senior: {
      id: 'turbo-brush',
      name: 'Турбо-ерш 3000',
      icon: '⚙️',
      prompt: 'Futuristic cyborg toilet brush, neon lights, spinning drill, sci-fi'
    }
  },
  {
    theme: 'Битва за свежесть',
    themeIndex: 6,
    junior: {
      id: 'pine-fresh',
      name: 'Хвойная Елочка',
      icon: '🌲',
      prompt: 'Pine tree car air freshener monster, cheap, hanging on a string, funny face'
    },
    senior: {
      id: 'anti-odor',
      name: 'Дозатор «Анти-запах»',
      icon: '💨',
      prompt: 'Automatic wall air freshener dispenser robot, shooting toxic gas clouds'
    }
  },
  {
    theme: 'Угроза засасывания',
    themeIndex: 7,
    junior: {
      id: 'holey-plunger',
      name: 'Дырявый вантуз',
      icon: '🪠',
      prompt: 'Old wooden plunger monster, rubber suction cup, funny angry eyes'
    },
    senior: {
      id: 'plunger-bazooka',
      name: 'Вантуз-базука',
      icon: '🚀',
      prompt: 'High-tech pneumatic plunger cannon robot, sci-fi weapon design'
    }
  },
  {
    theme: 'Засор',
    themeIndex: 8,
    junior: {
      id: 'hair-clog',
      name: 'Комок волос',
      icon: '💇',
      prompt: 'Gross wet hair clog monster from drain, dark and creepy, small'
    },
    senior: {
      id: 'hair-golem',
      name: 'Волосяной Голем',
      icon: '👹',
      prompt: 'Giant golem boss made of tangled wet hair and sewer trash, intimidating'
    }
  },
  {
    theme: 'Химическая атака',
    themeIndex: 9,
    junior: {
      id: 'fizz-tablet',
      name: 'Шипучая таблетка',
      icon: '💊',
      prompt: 'Fizzing blue toilet tablet monster, dissolving in water, bubbles'
    },
    senior: {
      id: 'acid-duck',
      name: 'Кислотный Утенок',
      icon: '🦆',
      prompt: 'Toxic green acid duck-shaped plastic bottle monster, melting liquid, evil'
    }
  },
  {
    theme: 'Сантехнический инвентарь',
    themeIndex: 10,
    junior: {
      id: 'rusty-wrench',
      name: 'Ржавый ключ',
      icon: '🔧',
      prompt: 'Rusty monkey wrench monster, heavy, metallic, funny face'
    },
    senior: {
      id: 'pipe-snake',
      name: 'Сантехнический трос',
      icon: '🐍',
      prompt: 'Metal plumbing snake worm monster, long iron coil, metallic teeth'
    }
  },
  {
    theme: 'Обитатели глубин',
    themeIndex: 11,
    junior: {
      id: 'flushed-fish',
      name: 'Смытая рыбка',
      icon: '🐟',
      prompt: 'Flushed zombie goldfish monster, sewer water, grumpy'
    },
    senior: {
      id: 'sewer-gator',
      name: 'Канализационный Аллигатор',
      icon: '🐊',
      prompt: 'Giant mutant sewer alligator boss, glowing eyes, slimy'
    }
  },
  {
    theme: 'Глобальная экология',
    themeIndex: 12,
    junior: {
      id: 'dirty-diaper',
      name: 'Грязный подгузник',
      icon: '👶',
      prompt: 'Dirty used baby diaper monster, heavy, bad smell green aura'
    },
    senior: {
      id: 'fatberg',
      name: 'Гигантский Фатберг',
      icon: '🗿',
      prompt: 'Massive fatberg monster boss made of white grease, fat, and wet wipes, gross but cartoonish'
    }
  },
  {
    theme: 'Финальная инстанция',
    themeIndex: 13,
    junior: {
      id: 'outhouse',
      name: 'Деревенский толчок',
      icon: '🏚️',
      prompt: 'Creepy wooden outhouse monster, scary door, eyes in the dark'
    },
    senior: {
      id: 'cyber-toilet',
      name: 'Кибер-Унитаз',
      icon: '🚽',
      prompt: 'Futuristic Japanese cyber-toilet robot boss, neon lights, bidet lasers, high-tech boss fight'
    }
  }
];

/** Flat fight order: junior then senior within each theme. */
export function flatBossRoster() {
  const out = [];
  let index = 1;
  for (const theme of BOSS_ROSTER_PLAN) {
    out.push({ index: index++, tier: 'junior', theme: theme.theme, ...theme.junior });
    out.push({ index: index++, tier: 'senior', theme: theme.theme, ...theme.senior });
  }
  return out;
}
