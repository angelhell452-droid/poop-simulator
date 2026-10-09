import { PATCH_NOTES_ARCHIVE } from './patchNotesArchive.data.js?v=5.0.84';

export const PATCH_NOTES = [
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
