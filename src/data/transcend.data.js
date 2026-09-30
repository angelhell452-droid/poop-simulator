export const TRANSCEND_UPGRADES = [
  // ТИР 1: БАЗОВЫЕ АСТРАЛЬНЫЕ МОДУЛИ (Открыты с 1-го Прорыва)
  { 
    id: 'art_cosmic_synergy', 
    key: 'cosmicSynergy', 
    name: '🪐 Космический Резонатор', 
    desc: '+50% к пассивному доходу всех заводов и силе клика за каждый уровень', 
    cost: 50, 
    costStep: 25, 
    max: 100, 
    tier: 1, 
    tierName: 'Тир 1: Базовый', 
    reqTranscend: 1 
  },
  { 
    id: 'art_passive_rolls', 
    key: 'passiveRolls', 
    name: '🧻 Хроно-Генератор Втулок', 
    desc: '+1 Втулка Судьбы каждые 5 секунд пассивно без Смыва за уровень', 
    cost: 100, 
    costStep: 50, 
    max: 100, 
    tier: 1, 
    tierName: 'Тир 1: Базовый', 
    reqTranscend: 1 
  },
  { 
    id: 'art_afk_god', 
    key: 'afkCap', 
    name: '⏳ Сверх-Офлайн Модуль', 
    desc: '+12 часов к максимальному лимиту времени офлайн-дохода', 
    cost: 150, 
    costStep: 75, 
    max: 50, 
    tier: 1, 
    tierName: 'Тир 1: Базовый', 
    reqTranscend: 1 
  },
  { 
    id: 'art_plunger_incubator', 
    key: 'plungerIncubator', 
    name: '🪠 Астральный Инкубатор', 
    desc: '+10% к получаемым Вантузам при каждом Прорыве за уровень', 
    cost: 250, 
    costStep: 100, 
    max: 100, 
    tier: 1, 
    tierName: 'Тир 1: Базовый', 
    reqTranscend: 1 
  },

  // ТИР 2: ПРОДВИНУТАЯ АВТОМАТИЗАЦИЯ (Открыты со 2-го Прорыва, мидгейм)
  { 
    id: 'art_auto_buyer', 
    key: 'autoBuyer', 
    name: '⚙️ Авто-Покупка Заводов', 
    desc: 'Автоматически скупает лучшие фабрики + активирует тумблер управления на экране персонажа!', 
    cost: 2500, 
    max: 1, 
    tier: 2, 
    tierName: 'Тир 2: Продвинутый', 
    reqTranscend: 2 
  },
  { 
    id: 'art_auto_evolution', 
    key: 'autoEvolution', 
    name: '🌀 Авто-Эволюция Мутаций', 
    desc: 'Автоматически совершает мутацию форм + активирует тумблер управления на экране персонажа!', 
    cost: 4500, 
    max: 1, 
    tier: 2, 
    tierName: 'Тир 2: Продвинутый', 
    reqTranscend: 2 
  },
  { 
    id: 'art_auto_care', 
    key: 'autoCare', 
    name: '🤖 Астральный Авто-Уход', 
    desc: 'Автоматически заботится о питомце (еда, мытье, щекотка) + открывает встроенный авто-уход!', 
    cost: 25, 
    max: 1, 
    tier: 1, 
    tierName: 'Тир 1: Базовый', 
    reqTranscend: 1 
  },
  { 
    id: 'art_knife_forge', 
    key: 'knifeForge', 
    name: '🗡️ Небесная Кузница Ножей', 
    desc: '+30% к урону клика и пассивному доходу всех ножей за уровень', 
    cost: 7500, 
    costStep: 2500, 
    max: 100, 
    tier: 2, 
    tierName: 'Тир 2: Продвинутый', 
    reqTranscend: 3 
  },
  { 
    id: 'art_golden_meteor_storm', 
    key: 'meteorStorm', 
    name: '🌠 Звездный Дождь Метеоритов', 
    desc: '+100% к биомассе и блестяшкам метеоров за каждый уровень', 
    cost: 10000, 
    costStep: 3000, 
    max: 50, 
    tier: 2, 
    tierName: 'Тир 2: Продвинутый', 
    reqTranscend: 3 
  },

  // ТИР 3: МАСТЕР-РЕЛИКВИИ (Открыты с 5-ти Прорывов)
  { 
    id: 'art_factory_overdrive', 
    key: 'factoryOverdrive', 
    name: '⚡ Гипер-Ускоритель Заводов', 
    desc: '+100% к CPS абсолютно всех фабрик за каждый уровень', 
    cost: 50000, 
    costStep: 15000, 
    max: 100, 
    tier: 3, 
    tierName: 'Тир 3: Мастер', 
    reqTranscend: 5 
  },
  { 
    id: 'art_evo_blessing', 
    key: 'evoBlessing', 
    name: '🧬 Благословение Демиурга', 
    desc: '+50% к множителю ВСЕХ форм мутации за каждый уровень', 
    cost: 75000, 
    costStep: 20000, 
    max: 100, 
    tier: 3, 
    tierName: 'Тир 3: Мастер', 
    reqTranscend: 5 
  },

  // ТИР 4: КОСМИЧЕСКАЯ СИНГУЛЯРНОСТЬ (Открыты с 10-ти Прорывов)
  { 
    id: 'art_omni_mult', 
    key: 'omniMult', 
    name: '🌌 Омни-Множитель Бытия', 
    desc: '+100% ко ВСЕЙ биомассе и силе клика за каждый уровень', 
    cost: 250000, 
    costStep: 100000, 
    max: 500, 
    tier: 4, 
    tierName: 'Тир 4: Сингулярность', 
    reqTranscend: 10 
  },
  { 
    id: 'art_singularity_rift', 
    key: 'singularityRift', 
    name: '♾️ Врата Вечности', 
    desc: 'Удваивает эффекты всех астральных реликвий и открывает доступ к Кейсу Абсолютной Вечности!', 
    cost: 1000000, 
    max: 1, 
    tier: 4, 
    tierName: 'Тир 4: Сингулярность', 
    reqTranscend: 10 
  }
];
