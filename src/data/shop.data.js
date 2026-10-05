export const SHOP_ITEMS = [
  // --- STARTER TIER (5,000 - 250,000 ✨) ---
  { id: 'hat_cap', name: 'Кепка Новичка', type: 'hat', cost: 5000, clickBoost: 4, icon: '🧢', desc: 'x4 к силе клика' },
  { id: 'hat_party', name: 'Праздничный Колпак', type: 'hat', cost: 25200, clickBoost: 10, icon: '🥳', desc: 'x10 к силе клика' },
  { id: 'hat_shades', name: 'Крутые Очки Thug Life', type: 'hat', cost: 57600, clickBoost: 20, icon: '🕶️', desc: 'x20 к силе клика' },
  { id: 'hat_cowboy', name: 'Ковбойская Шляпа Шерифа', type: 'hat', cost: 144000, clickBoost: 35, icon: '🤠', desc: 'x35 к силе клика' },

  // --- ADVANCED TIER (1,000,000 - 40,000,000 ✨) ---
  { id: 'hat_viking', name: 'Шлем Викинга-Берсерка', type: 'hat', cost: 317000, clickBoost: 55, icon: '⚔️', desc: 'x55 к силе клика' },
  { id: 'hat_chef', name: 'Колпак Шеф-Повара Мишлен', type: 'hat', cost: 684000, clickBoost: 70, icon: '👨‍🍳', desc: 'x70 к силе клика' },
  { id: 'hat_crown', name: 'Корона Императора Унитаза', type: 'hat', cost: 900000, clickBoost: 80, icon: '👑', desc: 'Потолок шапки: x80 к силе клика' },
  { id: 'hat_ninja', name: 'Повязка Мастера Синоби', type: 'hat', cost: 40000000, clickBoost: 80, icon: '🥷', desc: 'Сила клика уже у потолка шапки', retired: true },

  // --- COSMIC TIER (150,000,000 - 2,500,000,000 ✨) ---
  { id: 'hat_cosmic', name: 'Ореол Повелителя Времени', type: 'hat', cost: 150000000, clickBoost: 80, icon: '🌌', desc: 'Сила клика уже у потолка шапки', retired: true },
  { id: 'hat_cyber', name: 'Киберпанк Голо-Визор 2077', type: 'hat', cost: 600000000, clickBoost: 80, icon: '👓', desc: 'Сила клика уже у потолка шапки', retired: true },
  { id: 'hat_multiverse', name: 'Корона Мультиверса (Billionaire)', type: 'hat', cost: 2500000000, clickBoost: 80, icon: '✨', desc: 'Сила клика уже у потолка шапки', retired: true },

  // --- ULTRA LUXURY WHALE TIER (10,000,000,000 - 250,000,000,000 ✨) ---
  { id: 'hat_black_hole', name: 'Гравитационный Нимб Сингулярности', type: 'hat', cost: 10000000000, clickBoost: 80, icon: '🌀', desc: 'Сила клика уже у потолка шапки', retired: true },
  { id: 'hat_godly_apex', name: 'Венец Демиурга Омниверса', type: 'hat', cost: 50000000000, clickBoost: 80, icon: '🔱', desc: 'Сила клика уже у потолка шапки', retired: true },
  { id: 'hat_celestial_infinity', name: 'Абсолютные Кольца Бесконечности', type: 'hat', cost: 250000000000, clickBoost: 80, icon: '🪐', desc: 'Сила клика уже у потолка шапки', retired: true },

  { id: 'upg_magnet', name: 'Магнит Блестяшек', type: 'perk', cost: 1500, reqForm: 100, icon: '🧲', desc: '+30% к шансу выпадения блестяшек при клике!' },
  { id: 'upg_goldrush', name: 'Золотая Лихорадка', type: 'perk', cost: 12600, reqForm: 220, icon: '💰', desc: 'x1.25 к доходу всех заводов навсегда' },
  { id: 'upg_quantum_click', name: 'Квантовый Синергизм Кликера', type: 'perk', cost: 39600, reqForm: 340, icon: '🔮', desc: 'Сила клика получает +2% от ВСЕГО пассивного дохода заводов!' },
  { id: 'upg_comborush', name: 'Катализатор Ярости', type: 'perk', cost: 187000, reqForm: 640, icon: '🔥', desc: 'Увеличивает длительность Турбо-Режима Ярости до 18 секунд!' },
  { id: 'upg_factory_overclock', name: 'Оверклокинг Фабричных Турбин', type: 'perk', cost: 108000, reqForm: 580, icon: '🏭', desc: 'x1.25 к мощности всех заводов' },
  { id: 'upg_meteor_magnet', name: 'Радар Золотых Метеоритов', type: 'perk', cost: 245000, reqForm: 700, icon: '🌠', desc: 'Золотые метеориты прилетают на 40% чаще!' },
  { id: 'upg_zen_master', name: 'Дзен-Гармония Потребностей', type: 'perk', cost: 410000, reqForm: 760, icon: '🧘', desc: 'Голод и чистота падают в 3 раза медленнее!' },
  { id: 'upg_infinite_sparkles', name: 'Рог Изобилия Блестяшек', type: 'perk', cost: 533000, reqForm: 820, icon: '✨', desc: 'Удваивает выпадение блестяшек с кликов' },
  { id: 'upg_swift_click', name: 'Перчатка Скорости', type: 'perk', cost: 79200, reqForm: 460, icon: '👆', desc: '+2 CPS к потолку автокликера' },
  { id: 'upg_afk_booster', name: 'Капсула Гиперсна', type: 'perk', cost: 540000, reqForm: 880, icon: '💤', desc: 'Офлайн-доход работает со 100% максимальной эффективностью!' },
  { id: 'upg_singularity_core', name: 'Ядро Сингулярности', type: 'perk', cost: 864000, reqForm: 940, icon: '💠', desc: 'x1.5 к заводам позднего, эндгейм и сингулярного тира' },
  { id: 'upg_omniversal_wealth', name: 'Эссенция Омниверса', type: 'perk', cost: 1908000, reqForm: 1000, icon: '👑', desc: 'x1.20 ко всему доходу и силе клика' }
];

export const BOUTIQUE_REPEATABLES = [
  { id: 'diamond_sharpening', name: 'Алмазная Заточка Ножей', baseCost: 12000, costMult: 1.25, max: 20, reqForm: 160, icon: '💎', desc: '+5% к силе ножей за уровень (макс. 20)' },
  { id: 'crystal_factory', name: 'Кристальный Резонатор Фабрик', baseCost: 25000, costMult: 1.25, max: 20, reqForm: 280, icon: '🔮', desc: '+5% к пассивному доходу заводов за уровень (макс. 20)' },
  { id: 'golden_luck', name: 'Золотая Пыль Фортуны', baseCost: 40000, costMult: 1.25, max: 20, reqForm: 400, icon: '🌠', desc: '+0.4% шанс крита и +25% награды метеоритов за уровень (макс. 20)' },
  { id: 'singularity_spark', name: 'Эссенция Сингулярности', baseCost: 80000, costMult: 1.25, max: 12, reqForm: 520, icon: '👑', desc: '+4% ко всему доходу и клику за уровень (макс. 12)' }
];
