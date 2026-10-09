import { PATCH_NOTES_ARCHIVE } from './patchNotesArchive.data.js?v=5.0.86';

export const PATCH_NOTES = [
  {
    version: 'v5.1.0 PRO',
    date: '10 Октября 2026',
    dateEn: 'October 10, 2026',
    title: 'Патч 5.1: Великое Восхождение, 12 шагов онбординга и ребаланс ядра Infinite Idle',
    titleEn: 'Patch 5.1: The Infinite Ascension, 12-Step Onboarding & Infinite Idle Rebalance',
    badge: 'Патч 5.1',
    badgeEn: 'Patch 5.1',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🗺️',
        text: '12-ступенчатая Квестовая Лесенка (Onboarding): Полноценная стартовая кампания от первого клика до рейдов в Гильдии с прогресс-баром, сочными наградами и торжественным триумфом!',
        textEn: '12-Step Onboarding Questline: Complete starting campaign from first click to Guild raids with dynamic progress bars, juicy rewards, and triumph modal celebration!'
      },
      {
        type: 'balance',
        icon: '🧼',
        text: 'Синергия Ухода: Баффы Чистоты (доход), Сытости (клики) и Настроения (криты) теперь сквозным образом перемножаются со всеми множителями big.js и усиливают рейдовый урон по боссам!',
        textEn: 'Pet Care Synergy: Cleanliness (income), Hunger (clicks), and Happiness (crit chance) buffs now multiply through the full big.js chain and empower raid boss strikes!'
      },
      {
        type: 'perf',
        icon: '♾️',
        text: 'Бесконечная математика: Устранено демпфирование Прорывов при расчете ножей; расчеты кнопки MAX на коэффициенте r=1.4 полностью защищены от переполнения.',
        textEn: 'Infinite Math: Removed Breakthrough dampening on knives; MAX button purchases with ratio r=1.4 fully protected from overflow.'
      },
      {
        type: 'ui',
        icon: '🏆',
        text: 'Модальное окно триумфа: Завершение обучающей кампании награждается торжественным окном «Вы полностью готовы к бесконечности!» и скрытием плашки.',
        textEn: 'Triumph Modal: Finishing the onboarding campaign rewards players with a celebration modal "You are ready for infinity!" and cleanly hides the tutorial bar.'
      }
    ]
  },
  {
    version: 'v5.0.87 PRO',
    date: '9 Октября 2026',
    dateEn: 'October 9, 2026',
    title: 'Roblox-модель: 41 кейс за Блестяшки ✨, множители блестяшек на ножах и быстрое открытие',
    titleEn: 'Roblox Simulator Model: 41 Cases for Sparkles ✨, Knife Multipliers & Fast Open',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
    changes: [
      {
        type: 'feature',
        icon: '📦',
        text: '41 Тематический Кейс: Все 205 ножей в игре распределены строго по 5 уникальных клинков на каждый кейс (50% Common, 32% Rare, 13% Epic, 4% Covert, 1% Secret Jackpot). Кейсы плавно открываются от Формы 1 до Формы 200,000.',
        textEn: '41 Themed Cases: All 205 knives in the game are strictly divided into 5 unique blades per case (50% Common, 32% Rare, 13% Epic, 4% Covert, 1% Secret Jackpot), smoothly unlocking from Form 1 up to Form 200,000.'
      },
      {
        type: 'balance',
        icon: '✨',
        text: 'Все кейсы за Блестяшки: Кейсы больше не требуют втулок и смывов. Первый кейс доступен сразу со старта за 20 ✨ (10 ✨ со скидкой 50%), а дубликаты возвращают 40% стоимости в Блестяшках.',
        textEn: 'All Cases Cost Sparkles: Cases no longer require flushes or plungers. Case #1 is available immediately at launch for 20 ✨ (10 ✨ with 50% discount), and duplicates refund 40% in Sparkles.'
      },
      {
        type: 'feature',
        icon: '🗡️',
        text: 'Множитель Блестяшек у ножей: Каждый клинок теперь обладает бонусом sparkleMult (от x1.15 до x937.5), масштабирующим доход блестяшек от каждого клика и падения золотых метеоров.',
        textEn: 'Knife Sparkle Multiplier: Every knife now features a sparkleMult stat (from x1.15 up to x937.5), scaling sparkle earnings from clicks and golden meteor drops.'
      },
      {
        type: 'feature',
        icon: '⚡',
        text: 'Тумблер «Быстрое открытие»: Включите режим «⚡ Быстро» в панели кейсов для моментального открытия без ожидания анимации рулетки.',
        textEn: 'Fast Open Toggle: Enable "⚡ Fast" in the cases panel for instant openings skipping roulette spinning delays.'
      },
      {
        type: 'ui',
        icon: '👀',
        text: 'Наглядная витрина шансов: На каждой карточке кейса отображаются все 5 ножей с процентной вероятностью выпадения в стиле симуляторов Roblox.',
        textEn: 'Roblox-Style Drop Preview: Every case card showcases its 5 knives with their exact drop chances.'
      }
    ]
  },
  {
    version: 'v5.0.86 PRO',
    date: '9 Октября 2026',
    dateEn: 'October 9, 2026',
    title: 'Ускорение старта, усиление базовых ножей и система «Первые шаги»',
    titleEn: 'Early-Game Acceleration, Starter Knife Buff & First Steps Onboarding',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🎒',
        text: 'Интерактивная система «Первые шаги»: пошаговый маршрут из 9 ознакомительных заданий (уход за какашечкой, первая шапка, смыв, кейс, экипировка и заточка ножа, таланты) со световыми маячками и финальной наградой +100 ✨ и +5 🧻.',
        textEn: 'Interactive "First Steps" Roadmap: 9 step-by-step onboarding quests (pet care, rookie cap, flush, case opening, knife equip & sharpening, talents) with pulsing visual beacons and a +100 ✨ / +5 🧻 completion reward.'
      },
      {
        type: 'balance',
        icon: '⚔️',
        text: 'Усиление базовых ножей Контейнера #1: минимальная планка пассивного дохода повышена до +100% (множитель x2.0) и клика до x6.0. Даже самый обычный нож сразу дает мощный ощутимый скачок дохода!',
        textEn: 'Case #1 Knife Floor Buffed: Minimum factory passive boost raised to +100% (x2.0 mult) and clicks to x6.0. Even the most common drop immediately gives a punchy power spike!'
      },
      {
        type: 'balance',
        icon: '🏭',
        text: 'Смягчение темпа ранних эпох: убран штраф демпфирования на эпохах 1–3, благодаря чему заводы на формах 500–1000 производят почти в 3 раза больше биомассы без утомительного гринда.',
        textEn: 'Early Epoch Pacing Smoothed: Removed harsh factory dampening on epochs 1–3, granting ~3x higher factory output at forms 500–1000 to eliminate sluggish walls.'
      },
      {
        type: 'balance',
        icon: '🧢',
        text: 'Доступная «Кепка Новичка»: стоимость снижена с 5,000 до 50 ✨ Блестяшек и открыта с 1-й формы без ожидания 100-й формы, давая мгновенный множитель клика x4.',
        textEn: 'Accessible Rookie Cap: Cost lowered from 5,000 to 50 ✨ Sparkles and available from Form 1 without waiting for Form 100, providing an instant early x4 click power boost.'
      },
      {
        type: 'balance',
        icon: '📦',
        text: 'Кейс «Хрома 3» теперь открывается на Эпохе 2 (Форма 501): цена снижена до 75 втулок, вантузы не требуются. Игрок получает доступ ко второму кейсу сразу после первого смыва.',
        textEn: 'Chroma 3 Case Unlocks at Epoch 2 (Form 501): Price lowered to 75 rolls with 0 plungers needed. Immediate access to Case 2 right after first flush.'
      }
    ]
  },
  {
    version: 'v5.0.85 PRO',
    date: '9 Октября 2026',
    dateEn: 'October 9, 2026',
    title: 'Большой ребаланс прогрессии: сетка кейсов, тупики эпох и сила талантов',
    titleEn: 'Progression Overhaul: Case Spacing, Epoch Walls & Powered Talents',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'balance',
        icon: '📦',
        text: 'Новая сетка кейсов: 12 кейсов равномерно распределены с 1-й по 100-ю эпоху (с выходом в Горизонт), делая каждый кейс долгожданной и ценной целью.',
        textEn: 'New Case Spacing: 12 weapon cases are now distributed from Epoch 1 to 100 (extending into Horizon), making every case a meaningful long-term milestone.'
      },
      {
        type: 'balance',
        icon: '⚔️',
        text: 'Калибровка ножей: разброс силы ножей внутри кейса оптимизирован до 4x–5x. Ножи из ранних кейсов больше не ломают баланс далеких эпох, а лучшие ножи остаются желанными трофеями.',
        textEn: 'Knife Spread Calibration: Intra-case knife power gap adjusted to 4x–5x. Early drops no longer break future epochs, while top blades remain thrilling rewards.'
      },
      {
        type: 'balance',
        icon: '🏭',
        text: 'Заводы и тупики эпох: фабрика «Венец» теперь ускоряет середину эпохи без перегрева, создавая естественное испытание на формах 350–500, требующее кликов и прокачки.',
        textEn: 'Factory Curves & Epoch Walls: Apex factories now smoothly support mid-epoch forms without instantly blowing past forms 350–500.'
      },
      {
        type: 'feature',
        icon: '🌟',
        text: 'Усиление Талантов Смыва: Мягкость 4-х слоев (+12%/ур), Разгон заводов (+15%/ур), Ультра-Шмяк (+1.2% крит, +35% урон/ур), Синергизм (+8%/ур) стали мощным двигателем прохождения.',
        textEn: 'Strengthened Flush Talents: 4-Ply Softness (+12%/lvl), Pipeline Boost (+15%/lvl), Ultra-Splat (+1.2% crit, +35% dmg/lvl) and Synergy now provide game-changing progression boosts.'
      },
      {
        type: 'feature',
        icon: '🪠',
        text: 'Усиление Реликвий Прорыва: Космический Резонатор (+12%/ур), Кузница Ножей (+18%/ур), Гипер-Ускоритель (+20%/ур) и Омни-Множитель (+8%/ур) делают вантузы незаменимыми.',
        textEn: 'Empowered Astral Relics: Cosmic Resonator (+12%/lvl), Knife Forge (+18%/lvl), Factory Overdrive (+20%/lvl) and Omni Multiplier (+8%/lvl) make plungers essential.'
      }
    ]
  },
  {
    version: 'v5.0.84 PRO',
    date: '9 Октября 2026',
    dateEn: 'October 9, 2026',
    title: 'Ребаланс цен кейсов, скидка на первый кейс и уведомления',
    titleEn: 'Case Economy Rebalance, First Case Discount & Notifications',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🎁',
        text: 'Скидка на 1-ю покупку: первый кейс доступен со скидкой 73% (всего 12 🧻 вместо 45 🧻), позволяя открыть кейс сразу после 1-го Смыва!',
        textEn: 'First Purchase Discount: The first case is available with a 73% discount (only 12 🧻 instead of 45 🧻), allowing an open right after the 1st Flush!'
      },
      {
        type: 'balance',
        icon: '⚖️',
        text: 'Ребаланс цен кейсов: повышены требования к втулкам и вантузам на поздних кейсах, сбалансировав возросшую силу ножей и вантузы из рейдов гильдий.',
        textEn: 'Case Pricing Rebalance: Scaled roll and plunger requirements for late-tier cases to match increased knife power and guild raid rewards.'
      },
      {
        type: 'ui',
        icon: '🔔',
        text: 'Интерактивное уведомление и пульсирующий бейдж на вкладке «Кейсы», когда доступен первый кейс со скидкой.',
        textEn: 'Interactive toast notification and pulsing badge on the Cases tab whenever the discounted first case is ready to buy.'
      },
      {
        type: 'ui',
        icon: '🤖',
        text: 'Умный советник теперь сразу подсказывает открыть первый кейс со скидкой после совершения Смыва.',
        textEn: 'Smart Assistant now immediately suggests claiming your discounted first case right after flushing.'
      },
      {
        type: 'balance',
        icon: '🛡️',
        text: 'Защита прогрессии форм: активирован мягкий кап на пассивный бонус ножей к заводам. Ножи сохраняют 100% сокрушительной силы клика, а заводы больше не перегреваются до бесконечного пропуска уровней.',
        textEn: 'Form Progression Guard: Activated soft-cap on knife passive factory multiplier. Knives retain 100% click power, while factories no longer skip dozens of forms uncontrollably.'
      }
    ]
  },
  {
    version: 'v5.0.83 PRO',
    date: '8 Октября 2026',
    dateEn: 'October 8, 2026',
    title: 'Глобальный ребаланс кейсов и усиление ножей',
    titleEn: 'Global Weapon Cases Rebalance & Massive Knife Buff',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🗡️',
        text: 'Ножи в каждом кейсе теперь дают в 15 раз больше разницы в силе — выбивать редкие клинки стало в разы выгоднее!',
        textEn: 'Knives inside each case now have a 15x power spread — dropping rare blades is significantly more rewarding!'
      },
      {
        type: 'feature',
        icon: '📦',
        text: 'Все 12 оружейных кейсов теперь содержат ровно по 18 ножей, а 1% джекпот даёт топовый нож следующего кейса.',
        textEn: 'All 12 weapon cases now contain exactly 18 knives, and the 1% jackpot awards the top blade of the next case tier.'
      },
      {
        type: 'balance',
        icon: '🐉',
        text: 'Множитель легендарного Karambit Dragon Lore вырос до x500,000, а скрытое ограничение софт-капа полностью снято.',
        textEn: 'Legendary Karambit Dragon Lore multiplier increased to x500,000, and the legacy knife soft-cap has been removed.'
      },
      {
        type: 'feature',
        icon: '⚙️',
        text: 'Внедрён глобальный конфиг масштабирования множителей ножей KNIFE_BALANCE_CONFIG для гибкой регулировки силы.',
        textEn: 'Added global knife balance configuration KNIFE_BALANCE_CONFIG for instant multiplier series scaling.'
      },
      {
        type: 'ui',
        icon: '📰',
        text: 'Добавлена иллюстрированная игровая новость в Журнал об улучшении системы ножей.',
        textEn: 'Added an illustrated in-game news announcement in the Journal about the knife system upgrade.'
      }
    ]
  },
  {
    version: 'v5.0.82 PRO',
    date: '8 Октября 2026',
    dateEn: 'October 8, 2026',
    title: 'Полная локализация патч-ноутов и дефолтный English',
    titleEn: 'Full Patch Notes Localization & Default English',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🌐',
        text: 'Журнал обновлений и новости теперь полностью переводятся на английский при выборе языка English.',
        textEn: 'Update log and news now fully translate to English when English language is chosen.'
      },
      {
        type: 'balance',
        icon: '🌍',
        text: 'Английский язык теперь является стандартным языком игры по умолчанию.',
        textEn: 'English is now the standard default game language.'
      },
      {
        type: 'ui',
        icon: '🎯',
        text: 'Устранена утечка языков при переключении: отображается строго выбранный язык без смешивания.',
        textEn: 'Eliminated language leaks on switch: strictly the chosen language is displayed with no mixing.'
      }
    ]
  },
  {
    version: 'v5.0.81 PRO',
    date: '8 Октября 2026',
    title: 'Оптимизация проекта и расхода токенов',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'perf', icon: '⚡', text: 'Архив патч-ноутов вынесен в patchNotesArchive: размер активного файла уменьшен со 165 КБ до 9 КБ (экономия 95% токенов при патчах).' },
      { type: 'perf', icon: '🧹', text: 'Удалены тяжелые бэкап-файлы (index.backup.html 409 КБ), обновлен .gitignore для защиты контекста.' },
      { type: 'ui', icon: '📜', text: 'Правила проекта AGENTS.md уплотнены и оптимизированы без потери инструкций, экономит тысячи токенов на каждый запрос к ИИ.' }
    ]
  },
  {
    version: 'v5.0.80 PRO',
    date: '8 Октября 2026',
    title: 'Устаревшая ачивка и баг-репорт',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'fix', icon: '🐛', text: 'Баг-репорт снова ходит в Discord через Pages Function /api/bug-report. Убран битый avatar_url, из‑за которого Discord мог отклонять вебхук.' },
      { type: 'ui', icon: '💎', text: 'Ачивка «Клуб Миллиардеров» (Корона Мультиверса) убрана — шапка давно retired и больше не продаётся.' }
    ]
  },
  {
    version: 'v5.0.79 PRO',
    date: '7 Октября 2026',
    title: 'English доведён до всей оболочки',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '🌐', text: 'English закрывает оставшуюся оболочку: гид, смыв/прорыв, индекс ножей, гильдия, админка, баг-репорт, умный советник, холст и динамические подписи форм/вех.' },
      { type: 'ui', icon: '🧩', text: 'Статичный HTML тоже на data-i18n — после смены языка в профиле шапка, уход, вкладки и модалки не остаются на русском. Патч-ноуты по-прежнему на русском.' }
    ]
  },
  {
    version: 'v5.0.78 PRO',
    date: '7 Октября 2026',
    title: 'Полный English для игры',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '🌐', text: 'English покрывает оболочку и данные: ножи, кейсы, заводы, таланты, шапки, скины, боссы, эпохи, реликвии. Имена и описания берутся из словаря, русский остаётся базой в data.' },
      { type: 'ui', icon: '🧩', text: 'HUD, бутик, кейсы, таланты и инвентарь переключаются вместе с языком в профиле. История патч-ноутов пока на русском.' }
    ]
  },
  {
    version: 'v5.0.77 PRO',
    date: '7 Октября 2026',
    title: 'Язык интерфейса: русский и English',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '🌐', text: 'В профиле появился переключатель языка. База — русский, первый второй язык — English. Переводится оболочка: шапка, друзья, гильдия, почта, статус серверов и короткие клиентские ошибки.' },
      { type: 'ui', icon: '🧩', text: 'Новые языки добавляются одним файлом в реестр локалей — без переделки вызовов по всей игре. Патч-ноуты и имена ножей пока остаются на русском.' }
    ]
  },
  {
    version: 'v5.0.76 PRO',
    date: '7 Октября 2026',
    title: 'Награда босса без бонуса за круг',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'balance', icon: '🪠', text: 'Вантузы и очки за босса больше не растут с кругом. Награда фиксирована по номеру босса: 1-й даёт 1 вантуз, 26-й — 26. Круг остаётся только для попытки и сложности HP.' }
    ]
  },
  {
    version: 'v5.0.75 PRO',
    date: '7 Октября 2026',
    title: '26 гильдейских боссов с артом',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '🚽', text: 'В гильдии новая лестница из 26 боссов: 13 тем, у каждой младший и старший. Свои картинки, награды и книга боссов с портретами.' },
      { type: 'balance', icon: '❤️', text: 'HP боссов пересчитаны под длинную лестницу, чтобы финал не был в миллиардах от старой формулы n².' },
      { type: 'ui', icon: '📖', text: 'Вызов босса и журнал показывают тему, портрет и кто младший / старший.' }
    ]
  },
  {
    version: 'v5.0.74 PRO',
    date: '7 Октября 2026',
    title: 'Текст в друзьях больше не обрезается',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'ui', icon: '🧩', text: 'В списке друзей форма и эпоха на отдельных строках, кнопки снизу. Убрана огромная «полоса» эпохи, из‑за которой строка уезжала в многоточие.' }
    ]
  },
  {
    version: 'v5.0.73 PRO',
    date: '7 Октября 2026',
    title: 'Починка «облако перегружено» у друзей',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'fix', icon: '🛠️', text: 'Ошибка 500 у друзей/почты/гильдии была не от игроков, а от лимита CPU: social Worker каждый раз гонял создание таблиц. DDL убран с этого пути, при сбое отвечает основной сервер.' }
    ]
  },
  {
    version: 'v5.0.72 PRO',
    date: '7 Октября 2026',
    title: 'Друзья и гильдия открываются сразу',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'ui', icon: '⚡', text: 'Окна друзей и гильдии сразу показывают кэш или «Загружаем…», а сервер догружается в фоне. Список поиска гильдий тянется только на вкладке «Поиск».' },
      { type: 'ui', icon: '🧩', text: 'В составе гильдии кнопки Глава / Офицер / Выгнать переносятся на новую строку и больше не обрезаются.' }
    ]
  },
  {
    version: 'v5.0.71 PRO',
    date: '7 Октября 2026',
    title: 'Друзья на отдельном Worker без своего домена',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '📡', text: 'Основной сервер пересылает /api/social во второй Worker через service binding — свой домен и Route в Dashboard не нужны. Если social ещё не подключён, отвечает сам основной.' }
    ]
  },
  {
    version: 'v5.0.70 PRO',
    date: '7 Октября 2026',
    title: 'Отдельный сервер для друзей и гильдий',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '📡', text: 'Друзья, почта и гильдия ходят на /api/social. Можно вынести на отдельный Worker с той же базой; пока маршрут не повешен, отвечает основной сервер.' }
    ]
  },
  {
    version: 'v5.0.69 PRO',
    date: '7 Октября 2026',
    title: 'Заявки в друзья без ожидания',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'ui', icon: '🤝', text: 'Вписал логин и отправил — поле сразу чистое, заявка появляется в исходящих, сервер отвечает в фоне. Принять / отклонить / отменить тоже без зависания окна.' }
    ]
  },
  {
    version: 'v5.0.68 PRO',
    date: '7 Октября 2026',
    title: 'Статус серверов в профиле',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'ui', icon: '📡', text: 'В меню профиля блок «Статус серверов»: сохранение, друзья/почта/гильдия и сессия с кнопкой «Проверить».' },
      { type: 'ui', icon: '🛠️', text: 'Ошибка «сервер друзей» заменена на понятный текст про облако. При сбое сети запрос повторяется один раз.' }
    ]
  },
  ...PATCH_NOTES_ARCHIVE
];
