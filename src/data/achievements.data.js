import { formatNumber } from '../utils/numberFormatter.js';

export function generateAchievements() {
  const list = [];

  // 1. CLICKS ACHIEVEMENTS (1 to 50M clicks with exponential rewards)
  const achClickGoals = [
    { target: 1, reward: 50 },
    { target: 50, reward: 250 },
    { target: 250, reward: 1000 },
    { target: 1000, reward: 5000 },
    { target: 5000, reward: 25000 },
    { target: 25000, reward: 150000, rolls: 15 },
    { target: 100000, reward: 750000, rolls: 50 },
    { target: 500000, reward: 3500000, rolls: 250 },
    { target: 2000000, reward: 20000000, rolls: 1000, plungers: 1 },
    { target: 10000000, reward: 150000000, rolls: 5000, plungers: 5 },
    { target: 50000000, reward: 1000000000, rolls: 25000, plungers: 25 }
  ];
  achClickGoals.forEach((c, idx) => {
    list.push({
      id: `ach_c_${c.target}`,
      title: `Шмяк-Мастер ${idx + 1}`,
      desc: `Совершить ${formatNumber(c.target)} кликов по персонажу`,
      target: c.target,
      type: 'clicks',
      reward: c.reward,
      rewardRolls: c.rolls || 0,
      rewardPlungers: c.plungers || 0,
      done: false,
      icon: '👆'
    });
  });

  // 2. EVOLUTION FORMS (Form 5 up to Omniverse God Form 20,000)
  const achEvoGoals = [
    { form: 5, reward: 250 },
    { form: 25, reward: 2500 },
    { form: 50, reward: 15000, rolls: 5 },
    { form: 100, reward: 75000, rolls: 25 },
    { form: 250, reward: 350000, rolls: 100 },
    { form: 500, reward: 1500000, rolls: 250 },
    { form: 1000, reward: 10000000, rolls: 1000, plungers: 1 },
    { form: 2000, reward: 35000000, rolls: 2500, plungers: 3 },
    { form: 3500, reward: 150000000, rolls: 5000, plungers: 5 },
    { form: 5000, reward: 400000000, rolls: 10000, plungers: 10 },
    { form: 7500, reward: 1000000000, rolls: 25000, plungers: 15 },
    { form: 10000, reward: 2500000000, rolls: 50000, plungers: 25 },
    { form: 12500, reward: 5000000000, rolls: 100000, plungers: 50 },
    { form: 15000, reward: 10000000000, rolls: 250000, plungers: 100 },
    { form: 17500, reward: 25000000000, rolls: 500000, plungers: 250 },
    { form: 20000, reward: 100000000000, rolls: 1000000, plungers: 500 }
  ];
  achEvoGoals.forEach((e) => {
    list.push({
      id: `ach_e_${e.form}`,
      title: e.form >= 20000 ? 'Эволюция: эпоха без подписи' : `Эволюция: Форма ${formatNumber(e.form)}`,
      desc: e.form >= 20000 ? 'Дойти до горизонта, который игра не подписывает' : `Достичь ${formatNumber(e.form)}-й формы мутации`,
      concealTarget: e.form >= 20000,
      target: e.form - 1,
      type: 'evo',
      reward: e.reward,
      rewardRolls: e.rolls || 0,
      rewardPlungers: e.plungers || 0,
      done: false,
      icon: '🧬'
    });
  });

  // 3. BIOMASS ACCUMULATION (All time biomass)
  const achBioGoals = [
    { target: 1000, reward: 150 },
    { target: 50000, reward: 1000 },
    { target: 1000000, reward: 10000 },
    { target: 50000000, reward: 100000, rolls: 5 },
    { target: 1000000000, reward: 750000, rolls: 25 },
    { target: 50000000000, reward: 5000000, rolls: 100 },
    { target: 1000000000000, reward: 30000000, rolls: 500, plungers: 1 },
    { target: 50000000000000, reward: 200000000, rolls: 2500, plungers: 3 },
    { target: 1e18, reward: 1000000000, rolls: 10000, plungers: 10 },
    { target: 1e24, reward: 10000000000, rolls: 50000, plungers: 25 },
    { target: 1e33, reward: 100000000000, rolls: 250000, plungers: 50 },
    { target: 1e50, reward: 1e12, rolls: 1000000, plungers: 100 },
    { target: 1e75, reward: 10e12, rolls: 5000000, plungers: 250 },
    { target: 1e100, reward: 100e12, rolls: 25000000, plungers: 500 },
    { target: 1e150, reward: 1000e12, rolls: 100000000, plungers: 1000 },
    { target: 1e200, reward: 10000e12, rolls: 500000000, plungers: 5000 }
  ];
  achBioGoals.forEach((b, idx) => {
    list.push({
      id: `ach_b_${idx}`,
      title: `Био-Магнат ${idx + 1}`,
      desc: `Накопить ${formatNumber(b.target)} биомассы за всё время`,
      target: b.target,
      type: 'allBiomass',
      reward: b.reward,
      rewardRolls: b.rolls || 0,
      rewardPlungers: b.plungers || 0,
      done: false,
      icon: '💨'
    });
  });

  // 4. FACTORIES MILESTONES
  const achFacGoals = [
    { target: 10, reward: 200 },
    { target: 50, reward: 2000 },
    { target: 100, reward: 20000 },
    { target: 250, reward: 100000, rolls: 15 },
    { target: 500, reward: 500000, rolls: 50 },
    { target: 1000, reward: 2500000, rolls: 250 },
    { target: 2500, reward: 15000000, rolls: 1000, plungers: 2 },
    { target: 5000, reward: 75000000, rolls: 5000, plungers: 10 },
    { target: 10000, reward: 400000000, rolls: 25000, plungers: 25 },
    { target: 25000, reward: 2000000000, rolls: 100000, plungers: 100 }
  ];
  achFacGoals.forEach((fg, idx) => {
    list.push({
      id: `ach_f_${fg.target}`,
      title: `Промышленный Барон ${idx + 1}`,
      desc: `Построить суммарно ${formatNumber(fg.target)} био-заводов`,
      target: fg.target,
      type: 'factories',
      reward: fg.reward,
      rewardRolls: fg.rolls || 0,
      rewardPlungers: fg.plungers || 0,
      done: false,
      icon: '🏭'
    });
  });

  // 5. WEAPONS ARSENAL
  const achKnifeGoals = [
    { target: 1, reward: 1000 },
    { target: 5, reward: 15000, rolls: 25 },
    { target: 10, reward: 75000, rolls: 100 },
    { target: 25, reward: 350000, rolls: 500, plungers: 2 },
    { target: 50, reward: 2000000, rolls: 2500, plungers: 10 },
    { target: 100, reward: 15000000, rolls: 15000, plungers: 50 },
    { target: 150, reward: 75000000, rolls: 50000, plungers: 150 },
    { target: 200, reward: 500000000, rolls: 250000, plungers: 500 }
  ];
  achKnifeGoals.forEach((kg) => {
    list.push({
      id: `ach_knife_${kg.target}`,
      title: `Оружейник: ${kg.target} Ножей`,
      desc: `Собрать коллекцию из ${kg.target} боевых ножей`,
      target: kg.target,
      type: 'knives',
      reward: kg.reward,
      rewardRolls: kg.rolls || 0,
      rewardPlungers: kg.plungers || 0,
      done: false,
      icon: '🗡️'
    });
  });

  // 6. SPECIAL ACTIVITIES, CARE & METAS
  list.push(
    // Feeding
    { id: 'ach_feed_5', title: 'Сытный Перекус', desc: 'Покормить какашечку 5 раз', target: 5, type: 'feed', reward: 500, done: false, icon: '🍔' },
    { id: 'ach_feed_25', title: 'Шеф-Повар Унитаза', desc: 'Покормить 25 раз', target: 25, type: 'feed', reward: 5000, done: false, icon: '🍕' },
    { id: 'ach_feed_100', title: 'Ресторанный Критик', desc: 'Покормить 100 раз', target: 100, type: 'feed', reward: 50000, rewardRolls: 25, done: false, icon: '🥩' },

    // Washing
    { id: 'ach_wash_5', title: 'Мыльная Пена', desc: 'Вымыть какашечку 5 раз', target: 5, type: 'wash', reward: 500, done: false, icon: '🧼' },
    { id: 'ach_wash_25', title: 'Стерильная Чистота', desc: 'Вымыть какашечку 25 раз', target: 25, type: 'wash', reward: 5000, done: false, icon: '🫧' },
    { id: 'ach_wash_100', title: 'Хрустальный Стандарт', desc: 'Вымыть какашечку 100 раз', target: 100, type: 'wash', reward: 50000, rewardRolls: 25, done: false, icon: '🛁' },

    // Polishing
    { id: 'ach_polish_10', title: 'Зеркальный Блеск', desc: 'Отполировать бумагой 10 раз', target: 10, type: 'polish', reward: 1500, done: false, icon: '🧻' },
    { id: 'ach_polish_50', title: 'Ювелирный Глянец', desc: 'Отполировать бумагой 50 раз', target: 50, type: 'polish', reward: 25000, rewardRolls: 15, done: false, icon: '✨' },
    { id: 'ach_polish_200', title: 'Абсолютное Сияние', desc: 'Отполировать бумагой 200 раз', target: 200, type: 'polish', reward: 250000, rewardRolls: 100, done: false, icon: '💎' },

    // Turbo Heat
    { id: 'ach_turbo_5', title: 'Яростный Шмяк', desc: 'Активировать Турбо-Режим Ярости 5 раз', target: 5, type: 'turbo', reward: 2500, done: false, icon: '🔥' },
    { id: 'ach_turbo_25', title: 'Пламенный Берсерк', desc: 'Активировать Турбо-Режим Ярости 25 раз', target: 25, type: 'turbo', reward: 25000, rewardRolls: 25, done: false, icon: '⚡' },
    { id: 'ach_turbo_100', title: 'Вулканический Овердрайв', desc: 'Активировать Турбо-Режим Ярости 100 раз', target: 100, type: 'turbo', reward: 250000, rewardRolls: 100, rewardPlungers: 1, done: false, icon: '🌋' },

    // Meteors
    { id: 'ach_meteor_5', title: 'Звездочет', desc: 'Поймать 5 Золотых Метеоритов на экране', target: 5, type: 'meteor', reward: 5000, done: false, icon: '🌠' },
    { id: 'ach_meteor_25', title: 'Ловец Комет', desc: 'Поймать 25 Золотых Метеоритов', target: 25, type: 'meteor', reward: 50000, rewardRolls: 50, done: false, icon: '☄️' },
    { id: 'ach_meteor_100', title: 'Повелитель Звездного Дождя', desc: 'Поймать 100 Золотых Метеоритов', target: 100, type: 'meteor', reward: 500000, rewardRolls: 250, rewardPlungers: 2, done: false, icon: '🌌' },

    // Prestige Flushes
    { id: 'ach_prest_1', title: 'Первое Перерождение', desc: 'Совершить 1 Смыв Судьбы', target: 1, type: 'prestige', reward: 5000, rewardRolls: 15, done: false, icon: '👑' },
    { id: 'ach_prest_5', title: 'Хозяин Астральных Труб', desc: 'Совершить 5 Смывов Судьбы', target: 5, type: 'prestige', reward: 50000, rewardRolls: 150, rewardPlungers: 1, done: false, icon: '🌀' },
    { id: 'ach_prest_15', title: 'Мастер Канализаций', desc: 'Совершить 15 Смывов Судьбы', target: 15, type: 'prestige', reward: 500000, rewardRolls: 1500, rewardPlungers: 5, done: false, icon: '🌊' },
    { id: 'ach_prest_25', title: 'Втулочный Император', desc: 'Совершить 25 Смывов Судьбы', target: 25, type: 'prestige', reward: 5000000, rewardRolls: 10000, rewardPlungers: 25, done: false, icon: '🚽' },
    { id: 'ach_prest_50', title: 'Владыка Бесконечного Смыва', desc: 'Совершить 50 Смывов Судьбы', target: 50, type: 'prestige', reward: 50000000, rewardRolls: 50000, rewardPlungers: 100, done: false, icon: '🔱' },

    // Transcendence
    { id: 'ach_transcend_1', title: 'Астральный Первопроходец', desc: 'Совершить 1 Астральный Прорыв (Вантузы)', target: 1, type: 'transcend', reward: 500000, rewardRolls: 2500, rewardPlungers: 5, done: false, icon: '🪠' },
    { id: 'ach_transcend_3', title: 'Космический Архитектор', desc: 'Совершить 3 Астральных Прорыва', target: 3, type: 'transcend', reward: 5000000, rewardRolls: 25000, rewardPlungers: 25, done: false, icon: '🪐' },
    { id: 'ach_transcend_5', title: 'Разрушитель Реальности', desc: 'Совершить 5 Астральных Прорывов', target: 5, type: 'transcend', reward: 50000000, rewardRolls: 100000, rewardPlungers: 100, done: false, icon: '🔮' },
    { id: 'ach_transcend_10', title: 'Демиург Омниверса', desc: 'Совершить 10 Астральных Прорывов', target: 10, type: 'transcend', reward: 500000000, rewardRolls: 1000000, rewardPlungers: 500, done: false, icon: '🌌' },

    // Gear & Fun
    { id: 'ach_hat_first', title: 'Модник', desc: 'Купить первый головной убор в гардеробе', target: 1, type: 'hat', reward: 2500, done: false, icon: '🎩' },
    { id: 'ach_billionaire', title: 'Клуб Миллиардеров', desc: 'Приобрести Корону Мультиверса', target: 1, type: 'billionaire', reward: 5000000, rewardRolls: 5000, rewardPlungers: 5, done: false, icon: '💎' },
    { id: 'ach_ideal_care', title: 'Идеальный Уход', desc: 'Достичь 90%+ во всех трех потребностях питомца', target: 1, type: 'ideal', reward: 25000, rewardRolls: 25, done: false, icon: '👑' },
    { id: 'ach_sharpen_5', title: 'Звездный Клинок', desc: 'Заточить любой нож до ★ Lv.5 в инвентаре', target: 5, type: 'sharpen', reward: 100000, rewardRolls: 100, done: false, icon: '⭐' },
    { id: 'ach_sharpen_10', title: 'Мастер Заточки', desc: 'Заточить любой нож до ★ Lv.10 (Максимум)', target: 10, type: 'sharpen', reward: 1000000, rewardRolls: 1000, rewardPlungers: 5, done: false, icon: '🌟' },
    { id: 'ach_secret', title: 'Секретный Тап', desc: 'Кликнуть по логотипу игры в шапке', target: 1, type: 'secret', reward: 10000, rewardRolls: 10, done: false, icon: '🤫' }
  );

  return list;
}

export const ACHIEVEMENTS = generateAchievements();
