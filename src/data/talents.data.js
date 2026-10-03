export const TALENTS = [
  // TIER 1
  { id: 'soft_rolls', name: 'Мягкость 4-х слоев', desc: '+4% ко всему доходу за уровень (макс. 20)', cost: 4, costMult: 1.08, level: 0, max: 20, icon: '🧻', tier: 1, tierName: 'Базовый' },
  { id: 'royal_gold', name: 'Стартовый Золотой Трон', desc: '+200 💨 стартовой биомассы после смыва за уровень', cost: 6, costMult: 1.08, level: 0, max: 25, icon: '🚽', tier: 1, tierName: 'Базовый' },
  { id: 'sparkle_alchemy', name: 'Алхимия Блестяшек', desc: '+8% к выпадению блестяшек при клике за уровень', cost: 8, costMult: 1.10, level: 0, max: 15, icon: '✨', tier: 1, tierName: 'Базовый' },
  { id: 'afk_slumber', name: 'Мастер Офлайн-Медитации', desc: '+15% к офлайн-добыче и +2 часа к лимиту AFK за уровень', cost: 12, costMult: 1.10, level: 0, max: 12, icon: '💤', tier: 1, tierName: 'Базовый' },

  // TIER 2
  { id: 'crit_master', name: 'Ультра-Шмяк (Крит)', desc: '+0.4% шанс крита и +10% к урону крита за уровень', cost: 20, costMult: 1.16, level: 0, max: 40, icon: '💥', tier: 2, tierName: 'Продвинутый' },
  { id: 'turbo_pipe', name: 'Трубопроводный Разгон Заводов', desc: '+6% к мощности всех заводов за уровень', cost: 28, costMult: 1.16, level: 0, max: 20, icon: '⚡', tier: 2, tierName: 'Продвинутый' },
  { id: 'hyper_click', name: 'Гипер-Кликер', desc: '+2% к силе клика за каждые 500 кликов (макс. 30 стаков)', cost: 36, costMult: 1.17, level: 0, max: 15, icon: '👆', tier: 2, tierName: 'Продвинутый' },
  { id: 'combo_master', name: 'Владыка Комбо-Ярости', desc: '+0.4с к длительности комбо и +15% к множителю Турбо за уровень', cost: 48, costMult: 1.18, level: 0, max: 12, icon: '🔥', tier: 2, tierName: 'Продвинутый' },
  { id: 'meteor_hunter', name: 'Ловец Звездных Метеоритов', desc: 'Метеориты на 8% чаще и +20% к награде за уровень', cost: 60, costMult: 1.18, level: 0, max: 10, icon: '🌠', tier: 2, tierName: 'Продвинутый' },

  // TIER 3
  { id: 'golden_synergy', name: 'Священный Синергизм Заводов', desc: '+3% к силе клика за каждые 10 заводов за уровень', cost: 80, costMult: 1.30, level: 0, max: 15, icon: '🏭', tier: 3, tierName: 'Мастер' },
  { id: 'infinity_flush', name: 'Вечный Смыв Судьбы', desc: '+6% к получению Втулок за каждый Смыв за уровень', cost: 110, costMult: 1.30, level: 0, max: 20, icon: '🌀', tier: 3, tierName: 'Мастер' },
  { id: 'quantum_mastery', name: 'Квантовое Господство', desc: '+0.4% пассивного дохода заводов переходит в клик за уровень', cost: 150, costMult: 1.32, level: 0, max: 15, icon: '🔮', tier: 3, tierName: 'Мастер' },
  { id: 'star_forge_master', name: 'Ковка Звездной Стали', desc: '+5% к силе экипированного ножа за уровень. Открывает титановый кейс', cost: 200, costMult: 1.30, level: 0, max: 20, icon: '⚔️', tier: 3, tierName: 'Мастер' },
  { id: 'time_sovereign', name: 'Повелитель Хроноса', desc: '+8% к офлайн-эффективности и +0.15 CPS к потолку автоклика за уровень', cost: 260, costMult: 1.32, level: 0, max: 10, icon: '⏳', tier: 3, tierName: 'Мастер' },

  // TIER 4
  { id: 'cosmic_resonance', name: 'Космический Резонанс Мультиверса', desc: 'x1.08 ко всему доходу за каждые 2 уровня', cost: 400, costMult: 1.45, level: 0, max: 10, icon: '🌌', tier: 4, tierName: 'Астральный' },
  { id: 'quantum_replication', name: 'Квантовая Био-Репликация', desc: '+8% к пассивному доходу фабрик с 11-й и дальше за уровень', cost: 520, costMult: 1.42, level: 0, max: 15, icon: '🧬', tier: 4, tierName: 'Астральный' },
  { id: 'omega_destiny', name: 'Печать Точки Омега', desc: 'Снижает стоимость всех форм (асимптота −90% вместе с другими скидками)', cost: 700, costMult: 1.42, level: 0, max: 20, icon: '👑', tier: 4, tierName: 'Астральный' },
  { id: 'unbreakable_evo', name: 'Несокрушимая Эволюция', desc: 'Снижает стоимость только форм 5000+ на 1.5% за уровень', cost: 900, costMult: 1.44, level: 0, max: 15, icon: '🛡️', tier: 4, tierName: 'Астральный' },
  { id: 'transcend_soul', name: 'Астральная Трансценденция', desc: '+8% к получению Астральных Вантузов при Прорыве за уровень', cost: 1100, costMult: 1.48, level: 0, max: 15, icon: '🪠', tier: 4, tierName: 'Астральный' },
  { id: 'astral_splendor', name: 'Астральное Сияние', desc: '+1.5% шанс удвоить Вантузы при Прорыве за уровень (потолок 25%)', cost: 1400, costMult: 1.50, level: 0, max: 15, icon: '✨', tier: 4, tierName: 'Астральный' }
];
