export const TALENTS = [
  // TIER 1 — один ранний смыв покупает один уровень, тир закрывается к 8–10 эпохе
  { id: 'soft_rolls', name: 'Мягкость 4-х слоев', desc: '+4% ко всему доходу за уровень (макс. 6)', cost: 14, costMult: 1.28, level: 0, max: 6, icon: '🧻', tier: 1, tierName: 'Базовый', reqFlushes: 0 },
  { id: 'royal_gold', name: 'Стартовый Золотой Трон', desc: '+200 💨 стартовой биомассы после смыва за уровень', cost: 16, costMult: 1.28, level: 0, max: 5, icon: '🚽', tier: 1, tierName: 'Базовый', reqFlushes: 0 },
  { id: 'sparkle_alchemy', name: 'Алхимия Блестяшек', desc: '+8% к выпадению блестяшек при клике за уровень', cost: 20, costMult: 1.3, level: 0, max: 5, icon: '✨', tier: 1, tierName: 'Базовый', reqFlushes: 0 },
  { id: 'afk_slumber', name: 'Мастер Офлайн-Медитации', desc: '+15% к офлайн-добыче и +2 часа к лимиту AFK за уровень', cost: 24, costMult: 1.3, level: 0, max: 4, icon: '💤', tier: 1, tierName: 'Базовый', reqFlushes: 0 },

  // TIER 2 — эпохи примерно 8–16
  { id: 'crit_master', name: 'Ультра-Шмяк (Крит)', desc: '+0.4% шанс крита и +10% к урону крита за уровень', cost: 28, costMult: 1.32, level: 0, max: 6, icon: '💥', tier: 2, tierName: 'Продвинутый', reqFlushes: 1 },
  { id: 'turbo_pipe', name: 'Трубопроводный Разгон Заводов', desc: '+6% к мощности всех заводов за уровень', cost: 32, costMult: 1.32, level: 0, max: 6, icon: '⚡', tier: 2, tierName: 'Продвинутый', reqFlushes: 1 },
  { id: 'hyper_click', name: 'Гипер-Кликер', desc: '+2% к силе клика за каждые 500 кликов (макс. 30 стаков)', cost: 36, costMult: 1.34, level: 0, max: 5, icon: '👆', tier: 2, tierName: 'Продвинутый', reqFlushes: 1 },
  { id: 'combo_master', name: 'Владыка Комбо-Ярости', desc: '+0.4с к длительности комбо и +15% к множителю Турбо за уровень', cost: 40, costMult: 1.34, level: 0, max: 5, icon: '🔥', tier: 2, tierName: 'Продвинутый', reqFlushes: 1 },
  { id: 'meteor_hunter', name: 'Ловец Звездных Метеоритов', desc: 'Метеориты на 8% чаще и +20% к награде за уровень', cost: 44, costMult: 1.34, level: 0, max: 5, icon: '🌠', tier: 2, tierName: 'Продвинутый', reqFlushes: 1 },

  // TIER 3 — эпохи примерно 12–24
  { id: 'golden_synergy', name: 'Священный Синергизм Заводов', desc: '+3% к силе клика за каждые 10 заводов за уровень', cost: 48, costMult: 1.36, level: 0, max: 5, icon: '🏭', tier: 3, tierName: 'Мастер', reqFlushes: 3 },
  { id: 'infinity_flush', name: 'Вечный Смыв Судьбы', desc: '+6% к получению Втулок за каждый Смыв за уровень', cost: 56, costMult: 1.36, level: 0, max: 5, icon: '🌀', tier: 3, tierName: 'Мастер', reqFlushes: 3 },
  { id: 'quantum_mastery', name: 'Квантовое Господство', desc: '+0.4% пассивного дохода заводов переходит в клик за уровень', cost: 64, costMult: 1.36, level: 0, max: 5, icon: '🔮', tier: 3, tierName: 'Мастер', reqFlushes: 3 },
  { id: 'star_forge_master', name: 'Ковка Звездной Стали', desc: '+5% к силе экипированного ножа за уровень. Открывает титановый кейс', cost: 72, costMult: 1.38, level: 0, max: 4, icon: '⚔️', tier: 3, tierName: 'Мастер', reqFlushes: 3 },
  { id: 'time_sovereign', name: 'Повелитель Хроноса', desc: '+8% к офлайн-эффективности и +0.15 CPS к потолку автоклика за уровень', cost: 80, costMult: 1.38, level: 0, max: 4, icon: '⏳', tier: 3, tierName: 'Мастер', reqFlushes: 3 },

  // TIER 4 — с 8 Прорыва и до последних эпох
  { id: 'cosmic_resonance', name: 'Космический Резонанс Мультиверса', desc: 'x1.08 ко всему доходу за каждые 2 уровня', cost: 120, costMult: 1.42, level: 0, max: 6, icon: '🌌', tier: 4, tierName: 'Астральный', reqFlushes: 6, reqTranscend: 8 },
  { id: 'quantum_replication', name: 'Квантовая Био-Репликация', desc: '+8% к пассивному доходу фабрик с 11-й и дальше за уровень', cost: 140, costMult: 1.42, level: 0, max: 6, icon: '🧬', tier: 4, tierName: 'Астральный', reqFlushes: 6, reqTranscend: 8 },
  { id: 'omega_destiny', name: 'Печать Точки Омега', desc: 'Снижает стоимость форм с 4000. Вместе с другими скидками не больше 90%', cost: 160, costMult: 1.42, level: 0, max: 5, icon: '👑', tier: 4, tierName: 'Астральный', reqFlushes: 6, reqTranscend: 8 },
  { id: 'unbreakable_evo', name: 'Несокрушимая Эволюция', desc: 'Снижает стоимость только форм 5000+ на 1.5% за уровень', cost: 180, costMult: 1.45, level: 0, max: 5, icon: '🛡️', tier: 4, tierName: 'Астральный', reqFlushes: 6, reqTranscend: 8 },
  { id: 'transcend_soul', name: 'Астральная Трансценденция', desc: '+8% к получению Астральных Вантузов при Прорыве за уровень', cost: 200, costMult: 1.45, level: 0, max: 5, icon: '🪠', tier: 4, tierName: 'Астральный', reqFlushes: 6, reqTranscend: 8 },
  { id: 'astral_splendor', name: 'Астральное Сияние', desc: '+1.5% шанс удвоить Вантузы при Прорыве за уровень (потолок 25%)', cost: 220, costMult: 1.45, level: 0, max: 5, icon: '✨', tier: 4, tierName: 'Астральный', reqFlushes: 6, reqTranscend: 8 }
];
