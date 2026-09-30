import { formatNumber } from '../utils/numberFormatter.js';

export function generateAchievements() {
  const list = [];
  const achClickGoals = [1, 50, 250, 1000, 5000, 25000, 100000, 500000, 2000000, 10000000, 50000000];
  achClickGoals.forEach((c, idx) => {
    list.push({ id: `ach_c_${c}`, title: `Шмяк-Мастер ${idx + 1}`, desc: `Совершить ${formatNumber(c)} кликов`, target: c, type: 'clicks', reward: 15 * (idx + 1), done: false, icon: '👆' });
  });

  const achEvoGoals = [5, 25, 50, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 12500, 15000, 17500, 20000];
  achEvoGoals.forEach((e, idx) => {
    list.push({ id: `ach_e_${e}`, title: `Эволюция: Форма ${formatNumber(e)}`, desc: `Достичь ${formatNumber(e)}-й формы мутации`, target: e - 1, type: 'evo', reward: 30 * (idx + 1), done: false, icon: '🧬' });
  });

  const achBioGoals = [1000, 50000, 1000000, 50000000, 1000000000, 50000000000, 1000000000000, 50000000000000, 1e18, 1e24, 1e33, 1e50, 1e75, 1e100, 1e150, 1e200];
  achBioGoals.forEach((b, idx) => {
    list.push({ id: `ach_b_${idx}`, title: `Био-Магнат ${idx + 1}`, desc: `Накопить ${formatNumber(b)} биомассы за всё время`, target: b, type: 'allBiomass', reward: 25 * (idx + 1), done: false, icon: '💨' });
  });

  const achFacGoals = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000];
  achFacGoals.forEach((fg, idx) => {
    list.push({ id: `ach_f_${fg}`, title: `Промышленный Барон ${idx + 1}`, desc: `Построить суммарно ${formatNumber(fg)} заводов`, target: fg, type: 'factories', reward: 30 * (idx + 1), done: false, icon: '🏭' });
  });

  const achKnifeGoals = [1, 5, 10, 25, 50, 100, 150, 200];
  achKnifeGoals.forEach((kg, idx) => {
    list.push({ id: `ach_knife_${kg}`, title: `Оружейник: ${kg} Ножей`, desc: `Собрать коллекцию из ${kg} ножей`, target: kg, type: 'knives', reward: 50 * (idx + 1), done: false, icon: '🗡️' });
  });

  list.push(
    { id: 'ach_feed_5', title: 'Сытный Перекус', desc: 'Покормить какашечку 5 раз', target: 5, type: 'feed', reward: 15, done: false, icon: '🍔' },
    { id: 'ach_feed_25', title: 'Шеф-Повар Унитаза', desc: 'Покормить 25 раз', target: 25, type: 'feed', reward: 40, done: false, icon: '🍕' },
    { id: 'ach_wash_5', title: 'Мыльная Пена', desc: 'Вымыть какашечку 5 раз', target: 5, type: 'wash', reward: 15, done: false, icon: '🧼' },
    { id: 'ach_wash_25', title: 'Стерильная Чистота', desc: 'Вымыть какашечку 25 раз', target: 25, type: 'wash', reward: 40, done: false, icon: '🫧' },
    { id: 'ach_polish_10', title: 'Зеркальный Блеск', desc: 'Отполировать бумагой 10 раз', target: 10, type: 'polish', reward: 25, done: false, icon: '🧻' },
    { id: 'ach_flush_3', title: 'Водоворот', desc: 'Активировать Быстрый Смыв 3 раза', target: 3, type: 'flush', reward: 20, done: false, icon: '🌀' },
    { id: 'ach_prest_1', title: 'Первое Перерождение', desc: 'Совершить 1 Смыв Судьбы', target: 1, type: 'prestige', reward: 50, done: false, icon: '👑' },
    { id: 'ach_prest_5', title: 'Хозяин Астральных Труб', desc: 'Совершить 5 Смывов Судьбы', target: 5, type: 'prestige', reward: 150, done: false, icon: '🌌' },
    { id: 'ach_transcend_1', title: 'Астральный Первопроходец', desc: 'Совершить 1 Астральный Прорыв (Вантузы)', target: 1, type: 'transcend', reward: 250, done: false, icon: '🪠' },
    { id: 'ach_meteor_5', title: 'Звездочет', desc: 'Поймать 5 Золотых Метеоритов на экране', target: 5, type: 'meteor', reward: 75, done: false, icon: '🌠' },
    { id: 'ach_turbo_5', title: 'Яростный Шмяк', desc: 'Активировать Турбо-Режим Ярости 5 раз', target: 5, type: 'turbo', reward: 60, done: false, icon: '🔥' },
    { id: 'ach_hat_first', title: 'Модник', desc: 'Купить первый головной убор в бутике', target: 1, type: 'hat', reward: 30, done: false, icon: '🎩' },
    { id: 'ach_billionaire', title: 'Клуб Миллиардеров', desc: 'Приобрести Корону Мультиверса', target: 1, type: 'billionaire', reward: 500, done: false, icon: '💎' },
    { id: 'ach_secret', title: 'Секретный Тап', desc: 'Кликнуть по логотипу игры в шапке', target: 1, type: 'secret', reward: 25, done: false, icon: '🤫' }
  );

  return list;
}

export const ACHIEVEMENTS = generateAchievements();
