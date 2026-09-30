export const SHOP_ITEMS = [
  // --- STARTER TIER (5,000 - 250,000 ✨) ---
  { id: 'hat_cap', name: 'Кепка Новичка', type: 'hat', cost: 5000, clickBoost: 1.25, icon: '🧢', desc: '+25% к силе клика' },
  { id: 'hat_party', name: 'Праздничный Колпак', type: 'hat', cost: 20000, clickBoost: 1.60, icon: '🥳', desc: '+60% к силе клика' },
  { id: 'hat_shades', name: 'Крутые Очки Thug Life', type: 'hat', cost: 75000, clickBoost: 2.20, icon: '🕶️', desc: 'x2.2 к силе клика' },
  { id: 'hat_cowboy', name: 'Ковбойская Шляпа Шерифа', type: 'hat', cost: 250000, clickBoost: 3.50, icon: '🤠', desc: 'x3.5 к силе клика' },

  // --- ADVANCED TIER (1,000,000 - 40,000,000 ✨) ---
  { id: 'hat_viking', name: 'Шлем Викинга-Берсерка', type: 'hat', cost: 1000000, clickBoost: 6.0, icon: '⚔️', desc: 'x6.0 к силе клика' },
  { id: 'hat_chef', name: 'Колпак Шеф-Повара Мишлен', type: 'hat', cost: 3500000, clickBoost: 12.0, icon: '👨‍🍳', desc: 'x12.0 к силе клика' },
  { id: 'hat_crown', name: 'Корона Императора Унитаза', type: 'hat', cost: 12000000, clickBoost: 25.0, icon: '👑', desc: 'x25.0 к силе клика' },
  { id: 'hat_ninja', name: 'Повязка Мастера Синоби', type: 'hat', cost: 40000000, clickBoost: 60.0, icon: '🥷', desc: 'x60.0 к силе клика' },

  // --- COSMIC TIER (150,000,000 - 2,500,000,000 ✨) ---
  { id: 'hat_cosmic', name: 'Ореол Повелителя Времени', type: 'hat', cost: 150000000, clickBoost: 180.0, icon: '🌌', desc: 'Для элиты: x180 к силе клика!' },
  { id: 'hat_cyber', name: 'Киберпанк Голо-Визор 2077', type: 'hat', cost: 600000000, clickBoost: 500.0, icon: '👓', desc: 'Неоновый стиль: x500 к силе клика!' },
  { id: 'hat_multiverse', name: 'Корона Мультиверса (Billionaire)', type: 'hat', cost: 2500000000, clickBoost: 1500.0, icon: '✨', desc: 'Флекс миллиардеров: x1,500 к клику и радужный нимб!' },

  // --- ULTRA LUXURY WHALE TIER (10,000,000,000 - 250,000,000,000 ✨) ---
  { id: 'hat_black_hole', name: 'Гравитационный Нимб Сингулярности', type: 'hat', cost: 10000000000, clickBoost: 5000.0, icon: '🌀', desc: 'Черная дыра: x5,000 к клику и искажение пространства!' },
  { id: 'hat_godly_apex', name: 'Венец Демиурга Омниверса', type: 'hat', cost: 50000000000, clickBoost: 20000.0, icon: '🔱', desc: 'Священная реликвия: x20,000 к клику и сияние сверхновой!' },
  { id: 'hat_celestial_infinity', name: 'Абсолютные Кольца Бесконечности', type: 'hat', cost: 250000000000, clickBoost: 100000.0, icon: '🪐', desc: 'Пик могущества: x100,000 к клику и орбитальные планеты!' },

  { id: 'upg_autoclick', name: 'Нано-Автошмякалка 60 FPS', type: 'perk', cost: 500, icon: '⚡', desc: 'Автоматически делает 20 кликов в секунду!' },
  { id: 'upg_magnet', name: 'Магнит Блестяшек', type: 'perk', cost: 1500, icon: '🧲', desc: '+30% к шансу выпадения блестяшек при клике!' },
  { id: 'upg_goldrush', name: 'Золотая Лихорадка', type: 'perk', cost: 10000, icon: '💰', desc: 'Удваивает доход всех заводов навсегда!' },
  { id: 'upg_quantum_click', name: 'Квантовый Синергизм Кликера', type: 'perk', cost: 25000, icon: '🔮', desc: 'Сила клика получает +2% от ВСЕГО пассивного дохода заводов!' },
  { id: 'upg_comborush', name: 'Катализатор Ярости', type: 'perk', cost: 60000, icon: '🔥', desc: 'Увеличивает длительность Турбо-Режима Ярости до 18 секунд!' },
  { id: 'upg_factory_overclock', name: 'Оверклокинг Фабричных Турбин', type: 'perk', cost: 150000, icon: '🏭', desc: 'Удваивает мощность всех автоматических заводов!' },
  { id: 'upg_meteor_magnet', name: 'Радар Золотых Метеоритов', type: 'perk', cost: 400000, icon: '🌠', desc: 'Золотые метеориты прилетают на 40% чаще!' },
  { id: 'upg_zen_master', name: 'Дзен-Гармония Потребностей', type: 'perk', cost: 1000000, icon: '🧘', desc: 'Голод и чистота падают в 3 раза медленнее!' },
  { id: 'upg_infinite_sparkles', name: 'Рог Изобилия Блестяшек', type: 'perk', cost: 3000000, icon: '✨', desc: 'Утраивает выпадение всех блестяшек навсегда!' },
  { id: 'upg_afk_booster', name: 'Капсула Гиперсна', type: 'perk', cost: 8000000, icon: '💤', desc: 'Офлайн-доход работает со 100% максимальной эффективностью!' },
  { id: 'upg_singularity_core', name: 'Ядро Сингулярности', type: 'perk', cost: 25000000, icon: '💠', desc: 'Утраивает мощность заводов космического тира и выше (x3)!' },
  { id: 'upg_omniversal_wealth', name: 'Эссенция Омниверса', type: 'perk', cost: 100000000, icon: '👑', desc: 'Удваивает абсолютно весь пассивный доход и силу клика навсегда (x2)!' }
];

export const BOUTIQUE_REPEATABLES = [
  { id: 'diamond_sharpening', name: 'Алмазная Заточка Ножей', baseCost: 20000, costMult: 1.25, icon: '💎', desc: '+15% к урону всех ножей за уровень' },
  { id: 'crystal_factory', name: 'Кристальный Резонатор Фабрик', baseCost: 50000, costMult: 1.25, icon: '🔮', desc: '+20% к пассивному доходу всех заводов за уровень' },
  { id: 'golden_luck', name: 'Золотая Пыль Фортуны', baseCost: 100000, costMult: 1.30, icon: '🌠', desc: '+1% шанс крита и +25% золота с метеоритов за уровень' },
  { id: 'singularity_spark', name: 'Эссенция Сингулярности', baseCost: 500000, costMult: 1.35, icon: '👑', desc: '+25% ко ВСЕМУ доходу и клику навсегда за каждый уровень' }
];
