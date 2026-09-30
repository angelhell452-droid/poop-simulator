export const TALENTS = [
  // TIER 1: БАЗОВЫЕ / УТИЛИТАРНЫЕ ТАЛАНТЫ (Старт игры: 5 - 20 🧻)
  { id: 'soft_rolls', name: 'Мягкость 4-х слоев', desc: '+25% ко всему доходу за каждый уровень', cost: 5, costMult: 1.08, level: 0, max: 2500, icon: '🧻', tier: 1, tierName: 'Базовый' },
  { id: 'royal_gold', name: 'Стартовый Золотой Трон', desc: '+50,000 💨 стартовой биомассы после смыва за уровень', cost: 10, costMult: 1.08, level: 0, max: 1000, icon: '🚽', tier: 1, tierName: 'Базовый' },
  { id: 'sparkle_alchemy', name: 'Алхимия Блестяшек', desc: '+15% к выпадению блестяшек при каждом клике', cost: 15, costMult: 1.10, level: 0, max: 1000, icon: '✨', tier: 1, tierName: 'Базовый' },
  { id: 'afk_slumber', name: 'Мастер Офлайн-Медитации', desc: '+25% к офлайн-добыче и +3 часа к лимиту AFK', cost: 25, costMult: 1.10, level: 0, max: 1000, icon: '💤', tier: 1, tierName: 'Базовый' },

  // TIER 2: МИДГЕЙМ-РАЗГОН И КЛИКЕР-СИНЕРГИИ (1-й день: 150 - 500 🧻)
  { id: 'crit_master', name: 'Ультра-Шмяк (Крит)', desc: '+0.2% шанс крита и +40% к урону крита за уровень', cost: 150, costMult: 1.16, level: 0, max: 1500, icon: '💥', tier: 2, tierName: 'Продвинутый' },
  { id: 'turbo_pipe', name: 'Трубопроводный Разгон Заводов', desc: '+35% к мощности всех заводов за уровень', cost: 200, costMult: 1.16, level: 0, max: 2000, icon: '⚡', tier: 2, tierName: 'Продвинутый' },
  { id: 'hyper_click', name: 'Гипер-Кликер (1ms Овердрайв)', desc: '+5% к силе клика за каждые 500 сделанных кликов', cost: 250, costMult: 1.17, level: 0, max: 1500, icon: '👆', tier: 2, tierName: 'Продвинутый' },
  { id: 'combo_master', name: 'Владыка Комбо-Ярости', desc: '+20% к длительности комбо и +50% к множителю Турбо', cost: 350, costMult: 1.18, level: 0, max: 1000, icon: '🔥', tier: 2, tierName: 'Продвинутый' },
  { id: 'meteor_hunter', name: 'Ловец Звездных Метеоритов', desc: 'Золотые метеориты падают на 20% чаще и дают x2 награду', cost: 500, costMult: 1.18, level: 0, max: 1000, icon: '🌠', tier: 2, tierName: 'Продвинутый' },

  // TIER 3: МЕТА-ПРОГРЕССИЯ И СИЛЬНЫЕ СИНЕРГИИ (Неделя игры: 10,000 - 50,000 🧻)
  { id: 'golden_synergy', name: 'Священный Синергизм Заводов', desc: '+150% к силе клика от каждых 10 купленных заводов', cost: 10000, costMult: 1.30, level: 0, max: 1000, icon: '🏭', tier: 3, tierName: 'Мастер' },
  { id: 'infinity_flush', name: 'Вечный Смыв Судьбы', desc: '+8% к получению Золотых Втулок за каждый Смыв', cost: 15000, costMult: 1.30, level: 0, max: 1000, icon: '🌀', tier: 3, tierName: 'Мастер' },
  { id: 'hyperspeed_flush', name: 'Сверхсветовой Смыв', desc: '+8% к получению Втулок Судьбы за Смыв', cost: 20000, costMult: 1.32, level: 0, max: 1000, icon: '🚀', tier: 3, tierName: 'Мастер' },
  { id: 'quantum_mastery', name: 'Квантовое Господство', desc: '+1% от пассивного дохода заводов переходит в клик', cost: 30000, costMult: 1.32, level: 0, max: 1000, icon: '🔮', tier: 3, tierName: 'Мастер' },
  { id: 'star_forge_master', name: 'Ковка Звездной Стали', desc: '+15% к силе всех заточенных ножей за уровень', cost: 40000, costMult: 1.30, level: 0, max: 1000, icon: '⚔️', tier: 3, tierName: 'Мастер' },
  { id: 'time_sovereign', name: 'Повелитель Хроноса', desc: '+35% к офлайн-эффективности и скорости авто-кликов', cost: 50000, costMult: 1.32, level: 0, max: 500, icon: '⏳', tier: 3, tierName: 'Мастер' },

  // TIER 4: ЭНДГЕЙМ-ТИТАНЫ И АСТРАЛЬНЫЕ РЕЛИКВИИ (Месяц игры: 1,000,000 - 10,000,000 🧻)
  { id: 'cosmic_resonance', name: 'Космический Резонанс Мультиверса', desc: 'x1.5 к множителю всех форм мутации за каждые 2 уровня', cost: 1000000, costMult: 1.45, level: 0, max: 1000, icon: '🌌', tier: 4, tierName: 'Астральный' },
  { id: 'omni_mastery', name: 'Омни-Мастерство Бытия', desc: '+30% ко ВСЕМУ доходу и силе клика за уровень', cost: 2000000, costMult: 1.45, level: 0, max: 2000, icon: '🌟', tier: 4, tierName: 'Астральный' },
  { id: 'quantum_replication', name: 'Квантовая Био-Репликация', desc: '+50% к пассивному доходу фабрик старших тиров', cost: 3500000, costMult: 1.42, level: 0, max: 1500, icon: '🧬', tier: 4, tierName: 'Астральный' },
  { id: 'omega_destiny', name: 'Печать Точки Омега', desc: 'Снижает стоимость эволюции всех форм на 2% за уровень', cost: 5000000, costMult: 1.42, level: 0, max: 1000, icon: '👑', tier: 4, tierName: 'Астральный' },
  { id: 'unbreakable_evo', name: 'Несокрушимая Эволюция', desc: 'Снижает стоимость форм 5000+ на 1.5% за уровень', cost: 7500000, costMult: 1.44, level: 0, max: 500, icon: '🛡️', tier: 4, tierName: 'Астральный' },
  { id: 'transcend_soul', name: 'Астральная Трансценденция', desc: '+20% к получению Астральных Вантузов при Прорыве', cost: 10000000, costMult: 1.48, level: 0, max: 1000, icon: '🪠', tier: 4, tierName: 'Астральный' },
  { id: 'astral_splendor', name: 'Астральное Сияние', desc: '+2% шанс на удвоение Вантузов при Прорыве за уровень', cost: 15000000, costMult: 1.50, level: 0, max: 250, icon: '✨', tier: 4, tierName: 'Астральный' }
];
