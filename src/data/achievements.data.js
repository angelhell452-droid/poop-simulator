import { formatNumber } from '../utils/numberFormatter.js?v=5.0.73';

export function generateAchievements() {
  const list = [];

  // 1. CLICKS ACHIEVEMENTS (1 to 50M clicks with exponential rewards)
  const achClickGoals = [
    { target: 1, reward: 5 },
    { target: 50, reward: 15 },
    { target: 250, reward: 40 },
    { target: 1000, reward: 80 },
    { target: 5000, reward: 150 },
    { target: 25000, reward: 300, rolls: 1 },
    { target: 100000, reward: 500, rolls: 1 },
    { target: 500000, reward: 800, rolls: 2 },
    { target: 2000000, reward: 1200, rolls: 2 },
    { target: 10000000, reward: 1800, rolls: 3 },
    { target: 50000000, reward: 2500, rolls: 4 }
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
    { form: 5, reward: 20 },
    { form: 25, reward: 60 },
    { form: 50, reward: 120, rolls: 1 },
    { form: 100, reward: 250, rolls: 1 },
    { form: 250, reward: 600, rolls: 2 },
    { form: 500, reward: 1200, rolls: 2 },
    { form: 1000, reward: 2500, rolls: 3 },
    { form: 2000, reward: 4000, rolls: 4 },
    { form: 3500, reward: 6000, rolls: 4 },
    { form: 5000, reward: 8000, rolls: 5 },
    { form: 7500, reward: 10000, rolls: 6 },
    { form: 10000, reward: 14000, rolls: 6 },
    { form: 12500, reward: 18000, rolls: 8 },
    { form: 15000, reward: 22000, rolls: 8 },
    { form: 17500, reward: 26000, rolls: 10 },
    { form: 20000, reward: 30000, rolls: 12 },
    { form: 30000, reward: 36000, rolls: 14 },
    { form: 40000, reward: 42000, rolls: 16 },
    { form: 50000, reward: 48000, rolls: 18 },
    { form: 60000, reward: 54000, rolls: 20 },
    { form: 70000, reward: 60000, rolls: 22 },
    { form: 80000, reward: 66000, rolls: 24 },
    { form: 90000, reward: 72000, rolls: 26 },
    { form: 100000, reward: 80000, rolls: 30 }
  ];
  achEvoGoals.forEach((e) => {
    list.push({
      id: `ach_e_${e.form}`,
      title: e.form >= 100000 ? 'Эволюция: эпоха без подписи' : `Эволюция: Форма ${formatNumber(e.form)}`,
      desc: e.form >= 100000 ? 'Дойти до горизонта, который игра не подписывает' : `Достичь ${formatNumber(e.form)}-й формы`,
      concealTarget: e.form >= 100000,
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
    { target: 1000, reward: 10 },
    { target: 50000, reward: 30 },
    { target: 1000000, reward: 80 },
    { target: 50000000, reward: 150, rolls: 1 },
    { target: 1000000000, reward: 300, rolls: 1 },
    { target: 50000000000, reward: 500, rolls: 2 },
    { target: 1000000000000, reward: 800, rolls: 2 },
    { target: 50000000000000, reward: 1200, rolls: 3 },
    { target: 1e18, reward: 1800, rolls: 3 },
    { target: 1e24, reward: 2500, rolls: 4 },
    { target: 1e33, reward: 3500, rolls: 4 },
    { target: 1e50, reward: 5000, rolls: 5 },
    { target: 1e75, reward: 7000, rolls: 6 },
    { target: 1e100, reward: 9000, rolls: 6 },
    { target: 1e150, reward: 12000, rolls: 8 },
    { target: 1e200, reward: 16000, rolls: 8 }
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
    { target: 10, reward: 20 },
    { target: 50, reward: 60 },
    { target: 100, reward: 120 },
    { target: 250, reward: 250, rolls: 1 },
    { target: 500, reward: 400, rolls: 1 },
    { target: 1000, reward: 700, rolls: 2 },
    { target: 2500, reward: 1200, rolls: 2 },
    { target: 5000, reward: 1800, rolls: 3 },
    { target: 10000, reward: 2500, rolls: 4 },
    { target: 25000, reward: 4000, rolls: 5 }
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
    { target: 1, reward: 80 },
    { target: 5, reward: 200, rolls: 1 },
    { target: 10, reward: 400, rolls: 1 },
    { target: 25, reward: 800, rolls: 2 },
    { target: 50, reward: 1500, rolls: 3 },
    { target: 100, reward: 2500, rolls: 4 },
    { target: 150, reward: 4000, rolls: 5 },
    { target: 200, reward: 6000, rolls: 6 }
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
    { id: 'ach_feed_5', title: 'Сытный Перекус', desc: 'Покормить какашечку 5 раз', target: 5, type: 'feed', reward: 30, done: false, icon: '🍔' },
    { id: 'ach_feed_25', title: 'Шеф-Повар Унитаза', desc: 'Покормить 25 раз', target: 25, type: 'feed', reward: 80, done: false, icon: '🍕' },
    { id: 'ach_feed_100', title: 'Ресторанный Критик', desc: 'Покормить 100 раз', target: 100, type: 'feed', reward: 200, rewardRolls: 1, done: false, icon: '🥩' },

    { id: 'ach_wash_5', title: 'Мыльная Пена', desc: 'Вымыть какашечку 5 раз', target: 5, type: 'wash', reward: 30, done: false, icon: '🧼' },
    { id: 'ach_wash_25', title: 'Стерильная Чистота', desc: 'Вымыть какашечку 25 раз', target: 25, type: 'wash', reward: 80, done: false, icon: '🫧' },
    { id: 'ach_wash_100', title: 'Хрустальный Стандарт', desc: 'Вымыть какашечку 100 раз', target: 100, type: 'wash', reward: 200, rewardRolls: 1, done: false, icon: '🛁' },

    { id: 'ach_polish_10', title: 'Зеркальный Блеск', desc: 'Отполировать бумагой 10 раз', target: 10, type: 'polish', reward: 50, done: false, icon: '🧻' },
    { id: 'ach_polish_50', title: 'Ювелирный Глянец', desc: 'Отполировать бумагой 50 раз', target: 50, type: 'polish', reward: 150, rewardRolls: 1, done: false, icon: '✨' },
    { id: 'ach_polish_200', title: 'Абсолютное Сияние', desc: 'Отполировать бумагой 200 раз', target: 200, type: 'polish', reward: 400, rewardRolls: 2, done: false, icon: '💎' },

    { id: 'ach_turbo_5', title: 'Яростный Шмяк', desc: 'Активировать Турбо-Режим Ярости 5 раз', target: 5, type: 'turbo', reward: 80, done: false, icon: '🔥' },
    { id: 'ach_turbo_25', title: 'Пламенный Берсерк', desc: 'Активировать Турбо-Режим Ярости 25 раз', target: 25, type: 'turbo', reward: 200, rewardRolls: 1, done: false, icon: '⚡' },
    { id: 'ach_turbo_100', title: 'Вулканический Овердрайв', desc: 'Активировать Турбо-Режим Ярости 100 раз', target: 100, type: 'turbo', reward: 500, rewardRolls: 2, done: false, icon: '🌋' },

    { id: 'ach_meteor_5', title: 'Звездочет', desc: 'Поймать 5 Золотых Метеоритов на экране', target: 5, type: 'meteor', reward: 80, done: false, icon: '🌠' },
    { id: 'ach_meteor_25', title: 'Ловец Комет', desc: 'Поймать 25 Золотых Метеоритов', target: 25, type: 'meteor', reward: 200, rewardRolls: 1, done: false, icon: '☄️' },
    { id: 'ach_meteor_100', title: 'Повелитель Звездного Дождя', desc: 'Поймать 100 Золотых Метеоритов', target: 100, type: 'meteor', reward: 500, rewardRolls: 2, done: false, icon: '🌌' },

    { id: 'ach_prest_1', title: 'Первое Перерождение', desc: 'Совершить 1 Смыв Судьбы', target: 1, type: 'prestige', reward: 100, rewardRolls: 1, done: false, icon: '👑' },
    { id: 'ach_prest_5', title: 'Хозяин Астральных Труб', desc: 'Совершить 5 Смывов Судьбы', target: 5, type: 'prestige', reward: 250, rewardRolls: 2, done: false, icon: '🌀' },
    { id: 'ach_prest_15', title: 'Мастер Канализаций', desc: 'Совершить 15 Смывов Судьбы', target: 15, type: 'prestige', reward: 500, rewardRolls: 3, done: false, icon: '🌊' },
    { id: 'ach_prest_25', title: 'Втулочный Император', desc: 'Совершить 25 Смывов Судьбы', target: 25, type: 'prestige', reward: 800, rewardRolls: 4, done: false, icon: '🚽' },
    { id: 'ach_prest_50', title: 'Владыка Бесконечного Смыва', desc: 'Совершить 50 Смывов Судьбы', target: 50, type: 'prestige', reward: 1500, rewardRolls: 6, done: false, icon: '🔱' },

    { id: 'ach_transcend_1', title: 'Астральный Первопроходец', desc: 'Совершить 1 Астральный Прорыв (Вантузы)', target: 1, type: 'transcend', reward: 400, rewardRolls: 2, rewardPlungers: 1, done: false, icon: '🪠' },
    { id: 'ach_transcend_3', title: 'Космический Архитектор', desc: 'Совершить 3 Астральных Прорыва', target: 3, type: 'transcend', reward: 800, rewardRolls: 3, rewardPlungers: 1, done: false, icon: '🪐' },
    { id: 'ach_transcend_5', title: 'Разрушитель Реальности', desc: 'Совершить 5 Астральных Прорывов', target: 5, type: 'transcend', reward: 1200, rewardRolls: 4, rewardPlungers: 1, done: false, icon: '🔮' },
    { id: 'ach_transcend_10', title: 'Демиург Омниверса', desc: 'Совершить 10 Астральных Прорывов', target: 10, type: 'transcend', reward: 2000, rewardRolls: 6, rewardPlungers: 2, done: false, icon: '🌌' },

    { id: 'ach_hat_first', title: 'Модник', desc: 'Купить первый головной убор в гардеробе', target: 1, type: 'hat', reward: 150, done: false, icon: '🎩' },
    { id: 'ach_billionaire', title: 'Клуб Миллиардеров', desc: 'Приобрести Корону Мультиверса', target: 1, type: 'billionaire', reward: 2000, rewardRolls: 4, done: false, icon: '💎' },
    { id: 'ach_ideal_care', title: 'Идеальный Уход', desc: 'Достичь 90%+ во всех трех потребностях питомца', target: 1, type: 'ideal', reward: 100, rewardRolls: 1, done: false, icon: '👑' },
    { id: 'ach_sharpen_5', title: 'Звездный Клинок', desc: 'Заточить любой нож до ★ Lv.5 в инвентаре', target: 5, type: 'sharpen', reward: 400, rewardRolls: 1, done: false, icon: '⭐' },
    { id: 'ach_sharpen_10', title: 'Мастер Заточки', desc: 'Заточить любой нож до ★ Lv.10 (Максимум)', target: 10, type: 'sharpen', reward: 800, rewardRolls: 2, done: false, icon: '🌟' },
    { id: 'ach_secret', title: 'Секретный Тап', desc: 'Кликнуть по логотипу игры в шапке', target: 1, type: 'secret', reward: 40, done: false, icon: '🤫' }
  );

  return list;
}

export const ACHIEVEMENTS = generateAchievements();
