import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { guideEn, guideRu } from './shell-index-guide.mjs';
import { enNew, ruNew } from './shell-index-keys.mjs';

Object.assign(enNew, guideEn);
Object.assign(ruNew, guideRu);

const patches = [];
const p = (from, to) => patches.push([from, to]);

// boot & header
p('<span>Загрузка</span>', '<span data-i18n="common.loading">Загрузка</span>');
p(
  '<span id="headerAccountName" class="max-w-[70px] sm:max-w-[110px] truncate text-[11px]">Гость</span>',
  '<span id="headerAccountName" class="max-w-[70px] sm:max-w-[110px] truncate text-[11px]" data-i18n="common.guest">Гость</span>'
);

// hud
p('<span id="labelBiomass">Биомасса</span>', '<span id="labelBiomass" data-i18n="currency.biomass">Биомасса</span>');
p('<span id="labelSparkles">Блестяшки</span>', '<span id="labelSparkles" data-i18n="currency.sparkles">Блестяшки</span>');
p(
  '<span class="text-[9px] text-stone-500 italic">Нет активных баффов</span>',
  '<span class="text-[9px] text-stone-500 italic" data-i18n="hud.noActiveBuffs">Нет активных баффов</span>'
);
p(
  '<span class="text-[10px] text-amber-200/90 font-currency">Потолок CPS растёт от ножа</span>',
  '<span class="text-[10px] text-amber-200/90 font-currency" data-i18n="hud.autoclickCapHint">Потолок CPS растёт от ножа</span>'
);
p(
  '<span class="text-stone-400 font-bold mr-0.5">Скорость:</span>',
  '<span class="text-stone-400 font-bold mr-0.5" data-i18n="hud.speedLabel">Скорость:</span>'
);
p('title="Открыть Прорыв">', 'data-i18n-title="hud.transcendAutoLockedTitle" title="Открыть Прорыв">');
p(
  '<span>Авто-заводы открываются на тире 1 Прорыва</span>',
  '<span data-i18n="hud.transcendAutoLocked">Авто-заводы открываются на тире 1 Прорыва</span>'
);
p('title="Авто-кормление"', 'data-i18n-title="hud.autoFeedTitle" title="Авто-кормление"');
p('title="Авто-мытье"', 'data-i18n-title="hud.autoWashTitle" title="Авто-мытье"');
p('title="Авто-щекотка"', 'data-i18n-title="hud.autoTickleTitle" title="Авто-щекотка"');
p('<span id="autoFeedText">Авто</span>', '<span id="autoFeedText" data-i18n="hud.autoOff">Авто</span>');
p('<span id="autoWashText">Авто</span>', '<span id="autoWashText" data-i18n="hud.autoOff">Авто</span>');
p('<span id="autoTickleText">Авто</span>', '<span id="autoTickleText" data-i18n="hud.autoOff">Авто</span>');
p(
  '<div class="text-[10px] text-stone-300 truncate" id="smartHintText">Загрузка советов...</div>',
  '<div class="text-[10px] text-stone-300 truncate" id="smartHintText" data-i18n="assist.loadingTips">Загрузка советов...</div>'
);
p(
  'class="shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-game text-[9px] font-black px-2 py-0.5 rounded shadow border border-yellow-300 jelly-btn">\n          Действие ⚡\n        </button>',
  'class="shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-game text-[9px] font-black px-2 py-0.5 rounded shadow border border-yellow-300 jelly-btn" data-i18n="assist.actionBtn">\n          Действие ⚡\n        </button>'
);

p(
  '<span id="relicTabLabel">🔒 Реликвии Прорыва</span>',
  '<span id="relicTabLabel" data-i18n="talent.relicTabLocked">🔒 Реликвии Прорыва</span>'
);

// split paragraph fixes
p(
  'data-i18n="cases.panelIntro">Раздел открывается после первого Смыва. Дальше кейсы за втулки и вантузы.\n              Выбитые ножи отправляются в ваш Инвентарь Персонажа и дают сокрушительные множители силы.</p>',
  'data-i18n="cases.panelIntro">Раздел открывается после первого Смыва. Дальше кейсы за втулки и вантузы. Выбитые ножи отправляются в ваш Инвентарь Персонажа и дают сокрушительные множители силы.</p>'
);
p(
  'data-i18n="talent.flushIntro">Бонусы сохраняются при Смыве Судьбы навсегда. Развивайте\n                ветви\n                по тирам!</p>',
  'data-i18n="talent.flushIntro">Бонусы сохраняются при Смыве Судьбы навсегда. Развивайте ветви по тирам!</p>'
);
p(
  'data-i18n="talent.relicIntro">Высшие артефакты автоматизации и космической силы,\n                открываемые\n                за Астральные Вантузы.</p>',
  'data-i18n="talent.relicIntro">Высшие артефакты автоматизации и космической силы, открываемые за Астральные Вантузы.</p>'
);

// auth modal
p('<h3 class="font-game text-xl text-yellow-300">Облачный Аккаунт D1</h3>', '<h3 class="font-game text-xl text-yellow-300" data-i18n="auth.cloudTitle">Облачный Аккаунт D1</h3>');
p(
  'Создайте аккаунт, чтобы сохранять формы, ножи и возвращаться к игре с любого устройства!',
  '<span data-i18n="auth.cloudIntro">Создайте аккаунт, чтобы сохранять формы, ножи и возвращаться к игре с любого устройства!</span>'
);
p(
  '<button id="tabAuthLogin" class="flex-1 py-2 rounded-lg bg-amber-600 text-white shadow transition font-game">\n          🔑 Вход\n        </button>',
  '<button id="tabAuthLogin" class="flex-1 py-2 rounded-lg bg-amber-600 text-white shadow transition font-game" data-i18n="auth.loginTabShort">\n          🔑 Вход\n        </button>'
);
p(
  '<button id="tabAuthRegister"\n          class="flex-1 py-2 rounded-lg text-stone-400 hover:text-white transition font-game">\n          ✨ Регистрация\n        </button>',
  '<button id="tabAuthRegister"\n          class="flex-1 py-2 rounded-lg text-stone-400 hover:text-white transition font-game" data-i18n="auth.registerTabShort">\n          ✨ Регистрация\n        </button>'
);

p('<label class="block text-[10px] font-bold text-stone-400 uppercase mb-1">Имя пользователя (Логин):</label>', '<label class="block text-[10px] font-bold text-stone-400 uppercase mb-1" data-i18n="auth.usernameLabel">Имя пользователя (Логин):</label>');
p('<label class="block text-[10px] font-bold text-stone-400 uppercase mb-1">Пароль:</label>', '<label class="block text-[10px] font-bold text-stone-400 uppercase mb-1" data-i18n="auth.passwordLabel">Пароль:</label>');
p('placeholder="Введите ваш логин"', 'data-i18n="auth.loginUsernamePh" data-i18n-attr="placeholder" placeholder="Введите ваш логин"');
p('placeholder="Введите пароль"', 'data-i18n="auth.loginPasswordPh" data-i18n-attr="placeholder" placeholder="Введите пароль"');
p(
  '<button id="btnSubmitLogin" type="submit"\n          class="w-full py-2.5 rounded-xl font-game text-xs bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-stone-950 font-bold border border-yellow-300 shadow jelly-btn transition">\n          🚀 Войти в аккаунт\n        </button>',
  '<button id="btnSubmitLogin" type="submit"\n          class="w-full py-2.5 rounded-xl font-game text-xs bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-stone-950 font-bold border border-yellow-300 shadow jelly-btn transition" data-i18n="auth.submitLogin">\n          🚀 Войти в аккаунт\n        </button>'
);
p('<label class="block text-[10px] font-bold text-stone-400 uppercase mb-1">Придумайте Логин:</label>', '<label class="block text-[10px] font-bold text-stone-400 uppercase mb-1" data-i18n="auth.registerUsernameLabel">Придумайте Логин:</label>');
p('<label class="block text-[10px] font-bold text-stone-400 uppercase mb-1">Придумайте Пароль:</label>', '<label class="block text-[10px] font-bold text-stone-400 uppercase mb-1" data-i18n="auth.registerPasswordLabel">Придумайте Пароль:</label>');
p('placeholder="От 3 до 30 символов"', 'data-i18n="auth.registerUsernamePh" data-i18n-attr="placeholder" placeholder="От 3 до 30 символов"');
p('placeholder="Минимум 4 символа"', 'data-i18n="auth.registerPasswordPh" data-i18n-attr="placeholder" placeholder="Минимум 4 символа"');
p(
  '💡 Весь ваш текущий прогресс, ножи и рулоны будут сохранены в Cloudflare D1 под этим логином!',
  '<span data-i18n="auth.registerHint">💡 Весь ваш текущий прогресс, ножи и рулоны будут сохранены в Cloudflare D1 под этим логином!</span>'
);
p(
  '<button id="btnSubmitRegister" type="submit"\n          class="w-full py-2.5 rounded-xl font-game text-xs bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-bold border border-emerald-400 shadow jelly-btn transition">\n          ✨ Создать аккаунт\n        </button>',
  '<button id="btnSubmitRegister" type="submit"\n          class="w-full py-2.5 rounded-xl font-game text-xs bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-bold border border-emerald-400 shadow jelly-btn transition" data-i18n="auth.createAccount">\n          ✨ Создать аккаунт\n        </button>'
);
p(
  '<button id="btnPlayAsGuest" type="button"\n          class="text-xs text-stone-400 hover:text-amber-300 transition underline underline-offset-4 font-semibold">\n          🎮 Играть как Гость (без пароля)\n        </button>',
  '<button id="btnPlayAsGuest" type="button"\n          class="text-xs text-stone-400 hover:text-amber-300 transition underline underline-offset-4 font-semibold" data-i18n="auth.playGuest">\n          🎮 Играть как Гость (без пароля)\n        </button>'
);
p(
  '<p class="text-[9px] text-stone-500 mt-1">Вы сможете создать или привязать аккаунт в любое удобное время через\n          меню профиля.</p>',
  '<p class="text-[9px] text-stone-500 mt-1" data-i18n="auth.guestHint">Вы сможете создать или привязать аккаунт в любое удобное время через меню профиля.</p>'
);

// account modal extras
p('<span id="accountStatusBadge" class="text-[11px] text-emerald-400 font-medium">⚪ Гостевой режим</span>', '<span id="accountStatusBadge" class="text-[11px] text-emerald-400 font-medium" data-i18n="auth.guestMode">⚪ Гостевой режим</span>');
p(
  '<button id="btnAuthAction"\n          class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-stone-950 font-game text-xs font-bold border border-yellow-300 shadow jelly-btn transition">\n          🔑 Войти / Создать аккаунт\n        </button>',
  '<button id="btnAuthAction"\n          class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-stone-950 font-game text-xs font-bold border border-yellow-300 shadow jelly-btn transition" data-i18n="auth.loginCreate">\n          🔑 Войти / Создать аккаунт\n        </button>'
);
p('<option value="ru">Русский</option>', '<option value="ru" data-i18n="lang.ru">Русский</option>');
p('<option value="en">English</option>', '<option value="en" data-i18n="lang.en">English</option>');
p('<label class="text-[10px] text-stone-400 font-bold uppercase">Имя / Никнейм игрока:</label>', '<label class="text-[10px] text-stone-400 font-bold uppercase" data-i18n="account.playerNameLabel">Имя / Никнейм игрока:</label>');
p('placeholder="Введите имя игрока"', 'data-i18n="account.playerNamePh" data-i18n-attr="placeholder" placeholder="Введите имя игрока"');
p('class="bg-amber-700 hover:bg-amber-600 px-3 py-1 rounded-lg text-xs font-bold">ОК</button>', 'class="bg-amber-700 hover:bg-amber-600 px-3 py-1 rounded-lg text-xs font-bold" data-i18n="common.ok">ОК</button>');
p('<label class="text-[10px] text-stone-400 font-bold uppercase">Ваш Cloud Player ID:</label>', '<label class="text-[10px] text-stone-400 font-bold uppercase" data-i18n="account.cloudIdLabel">Ваш Cloud Player ID:</label>');
p('class="bg-stone-700 hover:bg-stone-600 px-3 py-1 rounded-lg text-xs font-bold">Копия</button>', 'class="bg-stone-700 hover:bg-stone-600 px-3 py-1 rounded-lg text-xs font-bold" data-i18n="account.copyBtn">Копия</button>');
p(
  'class="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl font-game text-xs jelly-btn">Сохранить в\n            БД 🚀</button>',
  'class="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl font-game text-xs jelly-btn" data-i18n="account.saveCloud">Сохранить в БД 🚀</button>'
);
p(
  'class="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded-xl font-game text-xs jelly-btn">Загрузить из БД\n            📥</button>',
  'class="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded-xl font-game text-xs jelly-btn" data-i18n="account.loadCloud">Загрузить из БД 📥</button>'
);
p('<span>🏆</span> <span>Топ игроков (База Данных)</span>', '<span>🏆</span> <span data-i18n="account.lbTitle">Топ игроков (База Данных)</span>');
p('<span>🔄</span> Обновить', '<span>🔄</span> <span data-i18n="account.refresh">Обновить</span>');
p('<div class="text-stone-400 text-center py-2 text-[11px]">Нажмите обновить для загрузки...</div>', '<div class="text-stone-400 text-center py-2 text-[11px]" data-i18n="account.lbHint">Нажмите обновить для загрузки...</div>');
p('<button id="btnManualExport" class="hover:underline">Экспорт текста</button>', '<button id="btnManualExport" class="hover:underline" data-i18n="account.export">Экспорт текста</button>');
p('<button id="btnManualImport" class="hover:underline">Импорт текста</button>', '<button id="btnManualImport" class="hover:underline" data-i18n="account.import">Импорт текста</button>');
p('<button id="btnRepairSave" class="text-amber-400 font-bold hover:underline">🛠️ Починить баланс</button>', '<button id="btnRepairSave" class="text-amber-400 font-bold hover:underline" data-i18n="account.repair">🛠️ Починить баланс</button>');
p('<button id="btnResetData" class="text-red-400 hover:underline">Полный сброс</button>', '<button id="btnResetData" class="text-red-400 hover:underline" data-i18n="account.reset">Полный сброс</button>');

// leaderboard modal
p('<h3 class="font-game text-xl sm:text-2xl text-yellow-300">Зал Славы: Топ Игроков</h3>', '<h3 class="font-game text-xl sm:text-2xl text-yellow-300" data-i18n="lb.modalTitle">Зал Славы: Топ Игроков</h3>');
p(
  'Глобальный рейтинг по Очкам Славы. Список один и тот же у всех: его считает сервер.',
  '<span data-i18n="lb.modalBlurb">Глобальный рейтинг по Очкам Славы. Список один и тот же у всех: его считает сервер.</span>'
);
p('<span class="text-[11px] font-bold text-amber-300">Один рейтинг для всех</span>', '<span class="text-[11px] font-bold text-amber-300" data-i18n="lb.oneRanking">Один рейтинг для всех</span>');
p('<span>Ежедневная Награда Топ-10</span>', '<span data-i18n="lb.dailyTitle">Ежедневная Награда Топ-10</span>');
p('class="text-[9px] bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-black">#? В РЕЙТИНГЕ</span>', 'class="text-[9px] bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-black" data-i18n="lb.rankBadge">#? В РЕЙТИНГЕ</span>');
p(
  'Игроки в Топ-10 получают до 50k ✨ Блестяшек раз в 24 часа!',
  '<span data-i18n="lb.dailyBlurb">Игроки в Топ-10 получают до 50k ✨ Блестяшек раз в 24 часа!</span>'
);
p(
  'class="w-full sm:w-auto shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-game font-bold text-xs px-3 py-1.5 rounded-xl transition shadow jelly-btn disabled:opacity-50 disabled:cursor-not-allowed">\n          🎁 Забрать ✨\n        </button>',
  'class="w-full sm:w-auto shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-game font-bold text-xs px-3 py-1.5 rounded-xl transition shadow jelly-btn disabled:opacity-50 disabled:cursor-not-allowed" data-i18n="lb.claimSparkles">\n          🎁 Забрать ✨\n        </button>'
);
p('<span>💡 Место в рейтинге обновляется при сохранении в облако</span>', '<span data-i18n="lb.rankHint">💡 Место в рейтинге обновляется при сохранении в облако</span>');
p('<button class="modal-close font-game text-xs text-amber-400 hover:underline">Закрыть</button>', '<button class="modal-close font-game text-xs text-amber-400 hover:underline" data-i18n="common.close">Закрыть</button>');
p('aria-label="Закрыть"', 'data-i18n-aria-label="common.close" aria-label="Закрыть"');

// guild chrome
p('placeholder="Название" autocomplete="off">', 'data-i18n="guild.namePh" data-i18n-attr="placeholder" placeholder="Название" autocomplete="off">');
p('placeholder="Титул, 2–5 букв" autocomplete="off">', 'data-i18n="guild.tagPh" data-i18n-attr="placeholder" placeholder="Титул, 2–5 букв" autocomplete="off">');
p('class="garden-pill accent jelly-btn">Создать</button>', 'class="garden-pill accent jelly-btn" data-i18n="guild.createBtn">Создать</button>');
p('placeholder="Название или титул" autocomplete="off">', 'data-i18n="guild.searchPh" data-i18n-attr="placeholder" placeholder="Название или титул" autocomplete="off">');
p('placeholder="Уровень" autocomplete="off">', 'data-i18n="guild.levelPh" data-i18n-attr="placeholder" placeholder="Уровень" autocomplete="off">');
p('class="garden-pill accent jelly-btn shrink-0">Найти</button>', 'class="garden-pill accent jelly-btn shrink-0" data-i18n="guild.findBtn">Найти</button>');

// prestige / transcend modals
p('<h3 class="font-game text-2xl text-yellow-300">ВЕЛИКИЙ СМЫВ СУДЬБЫ</h3>', '<h3 class="font-game text-2xl text-yellow-300" data-i18n="prestige.title">ВЕЛИКИЙ СМЫВ СУДЬБЫ</h3>');
p(
  '<p class="text-xs text-purple-200 mt-1">Сбросьте биомассу, текущую форму и фабрики. За это дают втулки и эхо дохода.</p>',
  '<p class="text-xs text-purple-200 mt-1" data-i18n="prestige.blurb">Сбросьте биомассу, текущую форму и фабрики. За это дают втулки и эхо дохода.</p>'
);
p('<span class="text-stone-300 text-[10px] uppercase font-bold">Условие доступа:</span>', '<span class="text-stone-300 text-[10px] uppercase font-bold" data-i18n="prestige.reqLabel">Условие доступа:</span>');
p('<span>Специализация на следующий забег:</span>', '<span data-i18n="prestige.archTitle">Специализация на следующий забег:</span>');
p('<span class="text-[9px] text-stone-400 font-normal">Выбор стиля игры</span>', '<span class="text-[9px] text-stone-400 font-normal" data-i18n="prestige.archHint">Выбор стиля игры</span>');
p('⚖️ Универсал\n            <div class="text-[8px] text-purple-300 font-normal">+15% ко всему</div>', '<span data-i18n="prestige.arch.balanced">⚖️ Универсал</span>\n            <div class="text-[8px] text-purple-300 font-normal" data-i18n="prestige.arch.balancedDesc">+15% ко всему</div>');
p('🗡️ Кликер\n            <div class="text-[8px] text-stone-400 font-normal">+50% к силе клика</div>', '<span data-i18n="prestige.arch.clicker">🗡️ Кликер</span>\n            <div class="text-[8px] text-stone-400 font-normal" data-i18n="prestige.arch.clickerDesc">+50% к силе клика</div>');
p('🏭 Магнат\n            <div class="text-[8px] text-stone-400 font-normal">+50% к заводам</div>', '<span data-i18n="prestige.arch.tycoon">🏭 Магнат</span>\n            <div class="text-[8px] text-stone-400 font-normal" data-i18n="prestige.arch.tycoonDesc">+50% к заводам</div>');
p('🎲 Фортуна\n            <div class="text-[8px] text-stone-400 font-normal">x2 Блестяшки ✨</div>', '<span data-i18n="prestige.arch.gambler">🎲 Фортуна</span>\n            <div class="text-[8px] text-stone-400 font-normal" data-i18n="prestige.arch.gamblerDesc">x2 Блестяшки ✨</div>');
p('🔥 Комбо\n            <div class="text-[8px] text-stone-400 font-normal">x15 Турбо-Ярость</div>', '<span data-i18n="prestige.arch.combo">🔥 Комбо</span>\n            <div class="text-[8px] text-stone-400 font-normal" data-i18n="prestige.arch.comboDesc">x15 Турбо-Ярость</div>');
p(
  'class="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:brightness-110 text-stone-950 font-game text-sm py-2.5 rounded-2xl shadow-xl disabled:opacity-40 disabled:cursor-not-allowed">\n        СОВЕРШИТЬ СМЫВ! 🌊\n      </button>',
  'class="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:brightness-110 text-stone-950 font-game text-sm py-2.5 rounded-2xl shadow-xl disabled:opacity-40 disabled:cursor-not-allowed" data-i18n="modal.doFlush">\n        СОВЕРШИТЬ СМЫВ! 🌊\n      </button>'
);

p('<h3 class="font-game text-2xl text-cyan-300">АСТРАЛЬНЫЙ ПРОРЫВ</h3>', '<h3 class="font-game text-2xl text-cyan-300" data-i18n="transcend.title">АСТРАЛЬНЫЙ ПРОРЫВ</h3>');
p(
  '<p class="text-xs text-indigo-200 mt-1">Открывает следующую пару эпох и ставит текущей паре доход x3. Забег не сбрасывается.</p>',
  '<p class="text-xs text-indigo-200 mt-1" data-i18n="transcend.blurb">Открывает следующую пару эпох и ставит текущей паре доход x3. Забег не сбрасывается.</p>'
);
p('<span class="text-stone-300">Запас Втулок Судьбы:</span>', '<span class="text-stone-300" data-i18n="transcend.rollsStock">Запас Втулок Судьбы:</span>');
p('<span class="text-stone-300">Награда за Прорыв:</span>', '<span class="text-stone-300" data-i18n="transcend.rewardLabel">Награда за Прорыв:</span>');
p(
  'class="w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:brightness-110 text-white font-game text-sm py-2.5 rounded-2xl shadow-xl disabled:opacity-40 disabled:cursor-not-allowed">\n        СОВЕРШИТЬ АСТРАЛЬНЫЙ ПРОРЫВ! 🌌\n      </button>',
  'class="w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:brightness-110 text-white font-game text-sm py-2.5 rounded-2xl shadow-xl disabled:opacity-40 disabled:cursor-not-allowed" data-i18n="modal.doTranscend">\n        СОВЕРШИТЬ АСТРАЛЬНЫЙ ПРОРЫВ! 🌌\n      </button>'
);

// case preview / offline
p('<h3 class="font-game text-xl text-yellow-300" id="casePreviewTitle">Оружейный Кейс</h3>', '<h3 class="font-game text-xl text-yellow-300" id="casePreviewTitle" data-i18n="cases.previewTitle">Оружейный Кейс</h3>');
p(
  '<p class="text-xs text-stone-300" id="casePreviewDesc">Содержимое кейса и вероятности выпадения предметов</p>',
  '<p class="text-xs text-stone-300" id="casePreviewDesc" data-i18n="cases.previewDescDefault">Содержимое кейса и вероятности выпадения предметов</p>'
);
p('<span class="text-stone-400">Стоимость открытия:</span>', '<span class="text-stone-400" data-i18n="cases.openCost">Стоимость открытия:</span>');
p('<span>Возможная добыча:</span>', '<span data-i18n="cases.possibleLoot">Возможная добыча:</span>');
p('<span class="text-[10px] text-stone-400 font-sans font-normal">Точные вероятности</span>', '<span class="text-[10px] text-stone-400 font-sans font-normal" data-i18n="cases.exactOdds">Точные вероятности</span>');

p('<h3 class="font-game text-2xl text-yellow-300">С ВОЗВРАЩЕНИЕМ!</h3>', '<h3 class="font-game text-2xl text-yellow-300" data-i18n="offline.welcome">С ВОЗВРАЩЕНИЕМ!</h3>');
p(
  '<p class="text-xs text-stone-300 mt-1" id="offlineTimeText">Вы отсутствовали некоторое время.</p>',
  '<p class="text-xs text-stone-300 mt-1" id="offlineTimeText" data-i18n="offline.awayDefault">Вы отсутствовали некоторое время.</p>'
);
p('<div class="text-stone-400">Пока вас не было, заводы продолжали добычу:</div>', '<div class="text-stone-400" data-i18n="offline.factoriesWorked">Пока вас не было, заводы продолжали добычу:</div>');
p('<span class="text-stone-300">Биомасса:</span>', '<span class="text-stone-300" data-i18n="offline.biomassLabel">Биомасса:</span>');
p('<span class="text-stone-300">Блестяшки:</span>', '<span class="text-stone-300" data-i18n="offline.sparklesLabel">Блестяшки:</span>');
p(
  'class="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-game text-sm py-2.5 rounded-2xl shadow-xl jelly-btn">\n        ЗАБРАТЬ ДОБЫЧУ! 🚀\n      </button>',
  'class="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-game text-sm py-2.5 rounded-2xl shadow-xl jelly-btn" data-i18n="offline.claimBtn">\n        ЗАБРАТЬ ДОБЫЧУ! 🚀\n      </button>'
);

// knives index modal
p('<h3 class="font-game text-xl sm:text-2xl text-yellow-300 tracking-wide">ОМНИВЕРС ЭНЦИКЛОПЕДИЯ</h3>', '<h3 class="font-game text-xl sm:text-2xl text-yellow-300 tracking-wide" data-i18n="index.omniTitle">ОМНИВЕРС ЭНЦИКЛОПЕДИЯ</h3>');
p(
  'Полный справочник вселенной: 202 ножа, 760 заводов (три в первых 40 эпохах, четыре на горизонте), 7 шапок до потолка x80 и постоянные перки!',
  '<span data-i18n="index.omniBlurb">Полный справочник вселенной: 202 ножа, 760 заводов (три в первых 40 эпохах, четыре на горизонте), 7 шапок до потолка x80 и постоянные перки!</span>'
);
p('🗡️ Ножи (202)\n        </button>', '<span data-i18n="index.tabKnives">🗡️ Ножи (202)</span>\n        </button>');
p('🏭 Заводы (14)\n        </button>', '<span data-i18n="index.tabFactories">🏭 Заводы (14)</span>\n        </button>');
p('🎩 Шапки (12)\n        </button>', '<span data-i18n="index.tabHats">🎩 Шапки (12)</span>\n        </button>');
p('🔮 Перки & Таланты\n        </button>', '<span data-i18n="index.tabPerks">🔮 Перки & Таланты</span>\n        </button>');
p('<span>Прогресс Коллекции:</span>', '<span data-i18n="index.progressLabel">Прогресс Коллекции:</span>');
p('class="text-emerald-400 font-game text-sm">0 / 202 Открыто</span>', 'class="text-emerald-400 font-game text-sm"><span id="indexBookProgressCountValue">0 / 202</span> <span data-i18n="index.openedSuffix">Открыто</span></span>');
p('<div class="font-bold">10 Ножей</div>', '<div class="font-bold" data-i18n="index.m10">10 Ножей</div>');
p('<div class="text-[9px] text-stone-400">+10% Клик</div>', '<div class="text-[9px] text-stone-400" data-i18n="index.m10b">+10% Клик</div>');
p('<div class="font-bold">25 Ножей</div>', '<div class="font-bold" data-i18n="index.m25">25 Ножей</div>');
p('<div class="text-[9px] text-stone-400">+25% Заводы</div>', '<div class="text-[9px] text-stone-400" data-i18n="index.m25b">+25% Заводы</div>');
p('<div class="font-bold">50 Ножей</div>', '<div class="font-bold" data-i18n="index.m50">50 Ножей</div>');
p('<div class="text-[9px] text-stone-400">+50% Клик</div>', '<div class="text-[9px] text-stone-400" data-i18n="index.m50b">+50% Клик</div>');
p('<div class="font-bold">100 Ножей</div>', '<div class="font-bold" data-i18n="index.m100">100 Ножей</div>');
p('<div class="text-[9px] text-stone-400">x2.0 Всё!</div>', '<div class="text-[9px] text-stone-400" data-i18n="index.m100b">x2.0 Всё!</div>');
p('<div class="font-bold">150 Ножей</div>', '<div class="font-bold" data-i18n="index.m150">150 Ножей</div>');
p('<div class="text-[9px] text-stone-400">x3.0 Всё!</div>', '<div class="text-[9px] text-stone-400" data-i18n="index.m150b">x3.0 Всё!</div>');
p('<div class="font-bold text-yellow-300">200 Ножей</div>', '<div class="font-bold text-yellow-300" data-i18n="index.m200">200 Ножей</div>');
p('<div class="text-[9px] text-yellow-400 font-bold">★ x5.0 МАСТЕР</div>', '<div class="text-[9px] text-yellow-400 font-bold" data-i18n="index.m200b">★ x5.0 МАСТЕР</div>');
p('placeholder="🔍 Поиск ножа по названию..."', 'data-i18n="index.searchPh" data-i18n-attr="placeholder" placeholder="🔍 Поиск ножа по названию..."');
p('data-status="all">Все</button>', 'data-status="all" data-i18n="index.filterAll">Все</button>');
p('data-status="unlocked">✓ Открыто</button>', 'data-status="unlocked" data-i18n="index.filterUnlocked">✓ Открыто</button>');
p('data-status="locked">🔒 Закрыто</button>', 'data-status="locked" data-i18n="index.filterLocked">🔒 Закрыто</button>');
p('<div class="text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-1.5 select-none">Фильтр по редкости:</div>', '<div class="text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-1.5 select-none" data-i18n="index.rarityFilter">Фильтр по редкости:</div>');
p('data-rarity="all">Все (202)</button>', 'data-rarity="all" data-i18n="index.rarityAll">Все (202)</button>');
p('data-rarity="common">Обычный (20)</button>', 'data-rarity="common" data-i18n="index.rarity.common">Обычный (20)</button>');
p('data-rarity="rare">Редкий (25)</button>', 'data-rarity="rare" data-i18n="index.rarity.rare">Редкий (25)</button>');
p('data-rarity="very_rare">Очень редкий (25)</button>', 'data-rarity="very_rare" data-i18n="index.rarity.very_rare">Очень редкий (25)</button>');
p('data-rarity="epic">Эпичный (30)</button>', 'data-rarity="epic" data-i18n="index.rarity.epic">Эпичный (30)</button>');
p('data-rarity="classified">Засекреченный (25)</button>', 'data-rarity="classified" data-i18n="index.rarity.classified">Засекреченный (25)</button>');
p('data-rarity="covert">Тайный (25)</button>', 'data-rarity="covert" data-i18n="index.rarity.covert">Тайный (25)</button>');
p('data-rarity="rainbow">Радужный (20)</button>', 'data-rarity="rainbow" data-i18n="index.rarity.rainbow">Радужный (20)</button>');
p('data-rarity="celestial">Небесный (15)</button>', 'data-rarity="celestial" data-i18n="index.rarity.celestial">Небесный (15)</button>');
p('data-rarity="titanium">Титановый (10)</button>', 'data-rarity="titanium" data-i18n="index.rarity.titanium">Титановый (10)</button>');
p('data-rarity="godly">Божественный (5)</button>', 'data-rarity="godly" data-i18n="index.rarity.godly">Божественный (5)</button>');

// roulette
p('<span id="rouletteAudioText">🔊 ЗВУК: ВКЛ</span>', '<span id="rouletteAudioText" data-i18n="roulette.soundOn">🔊 ЗВУК: ВКЛ</span>');
p('id="rouletteCaseSubtitle">ОТКРЫТИЕ\n        КОНТЕЙНЕРА</div>', 'id="rouletteCaseSubtitle" data-i18n="roulette.subtitle">ОТКРЫТИЕ КОНТЕЙНЕРА</div>');
p('<div class="font-game text-yellow-400 text-lg">ВСТАВКА КЛЮЧА И ОТПИРАНИЕ ЗАМКА...</div>', '<div class="font-game text-yellow-400 text-lg" data-i18n="roulette.unlockTitle">ВСТАВКА КЛЮЧА И ОТПИРАНИЕ ЗАМКА...</div>');
p('<div class="text-xs text-stone-400 mt-1">Декодирование секретного содержимого контейнера</div>', '<div class="text-xs text-stone-400 mt-1" data-i18n="roulette.unlockSub">Декодирование секретного содержимого контейнера</div>');
p('<div class="text-[11px] uppercase tracking-wider font-bold text-stone-400 z-10">Вам выпал легендарный предмет!\n        </div>', '<div class="text-[11px] uppercase tracking-wider font-bold text-stone-400 z-10" data-i18n="roulette.dropBanner">Вам выпал легендарный предмет!</div>');
p('<span class="font-bold">Качество:</span>', '<span class="font-bold" data-i18n="roulette.quality">Качество:</span>');
p('⚔️ ЭКИПИРОВАТЬ НОЖ!\n          </button>', '<span data-i18n="roulette.equipBtn">⚔️ ЭКИПИРОВАТЬ НОЖ!</span>\n          </button>');
p('>В инвентарь\n          </button>', ' data-i18n="roulette.toInventory">В инвентарь\n          </button>');
p('title="Открыть этот же кейс ещё 1 раз"', 'data-i18n-title="roulette.reopenTitle" title="Открыть этот же кейс ещё 1 раз"');
p('<span>Открыть ещё раз</span>', '<span data-i18n="roulette.reopenBtn">Открыть ещё раз</span>');
p('title="Открыть сразу 3 кейса мгновенно"', 'data-i18n-title="roulette.open3Title" title="Открыть сразу 3 кейса мгновенно"');
p('<span>Открыть 3 шт</span>', '<span data-i18n="roulette.open3Btn">Открыть 3 шт</span>');
p('title="Включить — рулетка пропускается всегда"', 'data-i18n-title="roulette.fastTitle" title="Включить — рулетка пропускается всегда"');
p('<span>⚡ Быстрое открытие (всегда скип)</span>', '<span data-i18n="roulette.fastLabel">⚡ Быстрое открытие (всегда скип)</span>');
p('title="Мгновенно остановить рулетку и открыть нож"', 'data-i18n-title="roulette.skipTitle" title="Мгновенно остановить рулетку и открыть нож"');
p('<span>Скип</span>', '<span data-i18n="roulette.skipBtn">Скип</span>');
p('<span class="text-xs text-stone-400 font-bold animate-pulse">Рулетка крутится...</span>', '<span class="text-xs text-stone-400 font-bold animate-pulse" data-i18n="roulette.spinning">Рулетка крутится...</span>');

// journal / inventory / vip / buff
p('<h3 class="font-game text-xl sm:text-2xl text-yellow-300 tracking-wide">ЖУРНАЛ ОБНОВЛЕНИЙ</h3>', '<h3 class="font-game text-xl sm:text-2xl text-yellow-300 tracking-wide" data-i18n="journal.modalTitle">ЖУРНАЛ ОБНОВЛЕНИЙ</h3>');
p('<p class="text-xs text-amber-200">Патчи и новости о том, что впереди</p>', '<p class="text-xs text-amber-200" data-i18n="journal.modalSub">Патчи и новости о том, что впереди</p>');
p('text-yellow-200">Новости</button>', 'text-yellow-200" data-i18n="journal.tabNews">Новости</button>');
p('text-stone-300">Патчи</button>', 'text-stone-300" data-i18n="journal.tabPatches">Патчи</button>');

p('<h3 class="font-game text-xl sm:text-2xl text-yellow-300 tracking-wide">ИНВЕНТАРЬ ПЕРСОНАЖА</h3>', '<h3 class="font-game text-xl sm:text-2xl text-yellow-300 tracking-wide" data-i18n="inv.modalTitle">ИНВЕНТАРЬ ПЕРСОНАЖА</h3>');
p('<p class="text-xs text-amber-200">Снаряжение какашечки, головные уборы и арсенал боевых ножей</p>', '<p class="text-xs text-amber-200" data-i18n="inv.modalSub">Снаряжение какашечки, головные уборы и арсенал боевых ножей</p>');
p('<span class="text-[11px] font-bold text-cyan-200">Доступный CPS</span>', '<span class="text-[11px] font-bold text-cyan-200" data-i18n="inv.cpsLabel">Доступный CPS</span>');
p('<span class="text-[11px] font-bold text-yellow-200">Блестяшки</span>', '<span class="text-[11px] font-bold text-yellow-200" data-i18n="inv.sparklesLabel">Блестяшки</span>');
p('<span>👕</span> Слот Тела', '<span>👕</span> <span data-i18n="inv.bodySlot">Слот Тела</span>');
p('>Скины\n          </button>', ' data-i18n="inv.skinsBtn">Скины\n          </button>');
p('<span>⚔️</span> Слот Оружия', '<span>⚔️</span> <span data-i18n="inv.weaponSlot">Слот Оружия</span>');
p('<span class="text-[9px] text-stone-400 font-mono">Боевой клинок</span>', '<span class="text-[9px] text-stone-400 font-mono" data-i18n="inv.bladeSubtitle">Боевой клинок</span>');
p('<span>🎩</span> Слот Головного Убора', '<span>🎩</span> <span data-i18n="inv.hatSlot">Слот Головного Убора</span>');
p('>Гардероб 🎩\n            </button>', ' data-i18n="inv.wardrobeBtn">Гардероб 🎩\n            </button>');
p('<span>🗡️</span> Арсенал Ножей (', '<span data-i18n="inv.tabKnivesPrefix">🗡️ Арсенал Ножей</span> (');
p('<span>🎩</span> Гардероб Шапок (', '<span data-i18n="inv.tabHatsPrefix">🎩 Гардероб Шапок</span> (');
p('<span>👕</span> Скины (', '<span data-i18n="inv.tabSkinsPrefix">👕 Скины</span> (');
p('<span class="font-bold text-stone-200 uppercase text-xs font-game">🗡️ Коллекция Клинков:</span>', '<span class="font-bold text-stone-200 uppercase text-xs font-game" data-i18n="inv.collectionHeader">🗡️ Коллекция Клинков:</span>');
p('id="knivesCountBadge">0 / 202 найдено</span>', 'id="knivesCountBadge"><span id="knivesCountBadgeValue">0 / 202</span> <span data-i18n="inv.foundSuffix">найдено</span></span>');
p('<span>Надеть лучший нож</span>', '<span data-i18n="inv.equipBestLong">Надеть лучший нож</span>');
p('title="Автоматически найти и надеть самый мощный нож в вашей коллекции"', 'data-i18n-title="inv.bestTitle" title="Автоматически найти и надеть самый мощный нож в вашей коллекции"');
p('<option value="power">⚡ По Мощи (Клик+Заводы)</option>', '<option value="power" data-i18n="inv.sort.power">⚡ По Мощи (Клик+Заводы)</option>');
p('<option value="click">🗡️ По Силе Клика</option>', '<option value="click" data-i18n="inv.sort.click">🗡️ По Силе Клика</option>');
p('<option value="passive">🏭 По пассивному доходу</option>', '<option value="passive" data-i18n="inv.sort.passive">🏭 По пассивному доходу</option>');
p('<option value="stattrak">🔥 По StatTrak™</option>', '<option value="stattrak" data-i18n="inv.sort.stattrak">🔥 По StatTrak™</option>');
p('<option value="star">⭐ По Уровню Заточки</option>', '<option value="star" data-i18n="inv.sort.star">⭐ По Уровню Заточки</option>');
p('<option value="name">🔤 По Названию</option>', '<option value="name" data-i18n="inv.sort.name">🔤 По Названию</option>');
p('data-filter="godly">★ Боги & Небесные</button>', 'data-filter="godly" data-i18n="inv.filter.godly">★ Боги & Небесные</button>');
p('data-filter="covert">Тайные & Титан</button>', 'data-filter="covert" data-i18n="inv.filter.covert">Тайные & Титан</button>');
p('data-filter="classified">Засекреченные</button>', 'data-filter="classified" data-i18n="inv.filter.classified">Засекреченные</button>');
p('data-filter="common">Обычные</button>', 'data-filter="common" data-i18n="inv.filter.common">Обычные</button>');
p('<div class="font-game text-yellow-300">Королевский Гардероб Шапок</div>', '<div class="font-game text-yellow-300" data-i18n="inv.hatsHeader">Королевский Гардероб Шапок</div>');
p('<div class="text-[10px] text-stone-300">Каждая надетая шапка умножает силу каждого клика какашечки!</div>', '<div class="text-[10px] text-stone-300" data-i18n="inv.hatsBlurb">Каждая надетая шапка умножает силу каждого клика какашечки!</div>');
p('<div class="font-game text-yellow-300">Скины какашечки</div>', '<div class="font-game text-yellow-300" data-i18n="inv.skinsHeader">Скины какашечки</div>');
p('<div class="text-[10px] text-stone-300">Наряд покупается за блестяшки и надевается с нужной формы. Бонус только к клику.</div>', '<div class="text-[10px] text-stone-300" data-i18n="inv.skinsBlurb">Наряд покупается за блестяшки и надевается с нужной формы. Бонус только к клику.</div>');

p('<p class="vip-shop-lead">Пять уровней множителя дохода поверх общего темпа. Покупка пока недоступна.</p>', '<p class="vip-shop-lead" data-i18n="vip.lead">Пять уровней множителя дохода поверх общего темпа. Покупка пока недоступна.</p>');
p('<h3 class="font-game text-base text-emerald-300 pr-6" id="rateBreakdownTitle">Доход</h3>', '<h3 class="font-game text-base text-emerald-300 pr-6" id="rateBreakdownTitle" data-i18n="vip.income">Доход</h3>');

p('<span id="buffModalBadge" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">Множитель</span>', '<span id="buffModalBadge" class="text-[10px] font-bold px-2 py-0.5 rounded-full border" data-i18n="buff.modalBadgeDefault">Множитель</span>');
p('Описание действия баффа.', '<span data-i18n="buff.modalDescDefault">Описание действия баффа.</span>');
p('<span>Статус эффекта:</span>', '<span data-i18n="buff.statusLabel">Статус эффекта:</span>');
p('<span>Источник:</span>', '<span data-i18n="buff.sourceLabel">Источник:</span>');
p('Совет по усилению эффекта.', '<span data-i18n="buff.tipDefault">Совет по усилению эффекта.</span>');

// guide modal header + sections (leaf nodes)
p('<h3 class="font-game text-xl sm:text-2xl text-yellow-300 tracking-wide">СПРАВОЧНИК ВЫЖИВАНИЯ</h3>', '<h3 class="font-game text-xl sm:text-2xl text-yellow-300 tracking-wide" data-i18n="guide.title">СПРАВОЧНИК ВЫЖИВАНИЯ</h3>');
p('<p class="text-xs text-cyan-200">Полный гид по ресурсам, экономике и стратегиям развития</p>', '<p class="text-xs text-cyan-200" data-i18n="guide.subtitle">Полный гид по ресурсам, экономике и стратегиям развития</p>');
p('<b class="text-emerald-400">⚡ Как зарабатывать:</b>', '<b class="text-emerald-400" data-i18n="guide.common.earn">⚡ Как зарабатывать:</b>');
p('<b class="text-yellow-400">🎯 Зачем нужна:</b>', '<b class="text-yellow-400" data-i18n="guide.common.why">🎯 Зачем нужна:</b>');

// biomass block
p('<span class="font-game text-sm text-yellow-300">Биомасса (Biomass)</span>', '<span class="font-game text-sm text-yellow-300" data-i18n="guide.biomass.title">Биомасса (Biomass)</span>');
p('>Основная\n              валюта</span>', ' data-i18n="guide.biomass.badge">Основная валюта</span>');
p('Фундаментальная энергия вселенной какашечки. Необходима для любого первичного роста.', '<span data-i18n="guide.biomass.intro">Фундаментальная энергия вселенной какашечки. Необходима для любого первичного роста.</span>');
p('<li>Клики по персонажу (усиливаются ножами, сытостью и талантами)</li>', '<li data-i18n="guide.biomass.e1">Клики по персонажу (усиливаются ножами, сытостью и талантами)</li>');
p('<li>Автоматические заводы: три в эпохах 1–40, четыре на вкладке «Горизонт»</li>', '<li data-i18n="guide.biomass.e2">Автоматические заводы: три в эпохах 1–40, четыре на вкладке «Горизонт»</li>');
p('<li>Ловля пролетающей золотой звезды</li>', '<li data-i18n="guide.biomass.e3">Ловля пролетающей золотой звезды</li>');
p('<li>Покупка новых фабрик и расширение пассивного дохода</li>', '<li data-i18n="guide.biomass.w1">Покупка новых фабрик и расширение пассивного дохода</li>');
p('<li>Форма растёт сама от биомассы забега. Последняя форма — 100k</li>', '<li data-i18n="guide.biomass.w2">Форма растёт сама от биомассы забега. Последняя форма — 100k</li>');
p('<li>Активация множителей покупки (x1, x10, x100, МАКС)</li>', '<li data-i18n="guide.biomass.w3">Активация множителей покупки (x1, x10, x100, МАКС)</li>');

p('<span class="font-game text-sm text-emerald-300">Вехи копий завода</span>', '<span class="font-game text-sm text-emerald-300" data-i18n="guide.factoryMilestones.title">Вехи копий завода</span>');
p(
  '<p class="text-stone-300 leading-relaxed">\n            Полоска под заводом считает копии до следующей вехи. Надпись вроде <b class="text-emerald-300">12/25 (след. x2)</b> — это не текущий множитель. x2 включится, когда копий станет 25, и останется навсегда. Следующая надпись меньше не потому, что бонус сняли, а потому что следующая веха даёт меньшую добавку.\n          </p>',
  '<p class="text-stone-300 leading-relaxed" data-i18n="guide.factoryMilestones.intro">\n            Полоска под заводом считает копии до следующей вехи. Надпись вроде 12/25 (след. x2) — это не текущий множитель. x2 включится, когда копий станет 25, и останется навсегда. Следующая надпись меньше не потому, что бонус сняли, а потому что следующая веха даёт меньшую добавку.\n          </p>'
);
p('<li>25 копий: весь доход этого завода x2.</li>', '<li data-i18n="guide.factoryMilestones.l1">25 копий: весь доход этого завода x2.</li>');
p('<li>50 копий: ещё x2. Вместе уже x4.</li>', '<li data-i18n="guide.factoryMilestones.l2">50 копий: ещё x2. Вместе уже x4.</li>');
p('<li>100, 200 и 500 копий: ещё по x1.5 каждая.</li>', '<li data-i18n="guide.factoryMilestones.l3">100, 200 и 500 копий: ещё по x1.5 каждая.</li>');
p('<li>1000 копий: ещё x2. Каждая следующая тысяча: ещё x1.5.</li>', '<li data-i18n="guide.factoryMilestones.l4">1000 копий: ещё x2. Каждая следующая тысяча: ещё x1.5.</li>');
p('<li>Зелёное число на карточке — сырой доход без вех. Нажмите на него: там видна веха и вклад в нижний доход.</li>', '<li data-i18n="guide.factoryMilestones.l5">Зелёное число на карточке — сырой доход без вех. Нажмите на него: там видна веха и вклад в нижний доход.</li>');
p('<li>Каждая взятая веха рисует звезду на заводе, до пяти. Шестая веха заключает звёзды в серебряную рамку, седьмая — в золотую, дальше рамка сияет.</li>', '<li data-i18n="guide.factoryMilestones.l6">Каждая взятая веха рисует звезду на заводе, до пяти. Шестая веха заключает звёзды в серебряную рамку, седьмая — в золотую, дальше рамка сияет.</li>');

p('<span class="font-game text-sm text-yellow-300">Золотая звезда</span>', '<span class="font-game text-sm text-yellow-300" data-i18n="guide.goldStar.title">Золотая звезда</span>');
p('>Событие на экране</span>', ' data-i18n="guide.goldStar.badge">Событие на экране</span>');
p('Время от времени по экрану пролетает золотая звезда. Нажми на неё, пока она не ушла. Один клик выбирает одну награду.', '<span data-i18n="guide.goldStar.intro">Время от времени по экрану пролетает золотая звезда. Нажми на неё, пока она не ушла. Один клик выбирает одну награду.</span>');
p('<li>Чаще всего: турбо x2 на 12 секунд или большой всплеск биомассы. Клики это усиление не продлевают.</li>', '<li data-i18n="guide.goldStar.l1">Чаще всего: турбо x2 на 12 секунд или большой всплеск биомассы. Клики это усиление не продлевают.</li>');
p('<li>Реже: пачка блестяшек.</li>', '<li data-i18n="guide.goldStar.l2">Реже: пачка блестяшек.</li>');
p('<li>Реже всего: втулки судьбы.</li>', '<li data-i18n="guide.goldStar.l3">Реже всего: втулки судьбы.</li>');
p('<li>Охотник за метеоритами, радар и буря усиливают награду и зовут звезду чаще.</li>', '<li data-i18n="guide.goldStar.l4">Охотник за метеоритами, радар и буря усиливают награду и зовут звезду чаще.</li>');
p('<li>Примерно каждая шестая звезда открывает звёздный рой на 12 секунд. Мелкие звёзды тоже ловятся: пачка блестяшек растёт с эпохой и с тем, как далеко уже зашёл забег.</li>', '<li data-i18n="guide.goldStar.l5">Примерно каждая шестая звезда открывает звёздный рой на 12 секунд. Мелкие звёзды тоже ловятся: пачка блестяшек растёт с эпохой и с тем, как далеко уже зашёл забег.</li>');

p('<span class="font-game text-sm text-pink-300">Блестяшки (Sparkles)</span>', '<span class="font-game text-sm text-pink-300" data-i18n="guide.sparkles.title">Блестяшки (Sparkles)</span>');
p('>Премиум-ресурс</span>', ' data-i18n="guide.sparkles.badge">Премиум-ресурс</span>');
p('Драгоценные искры сияния, дающие доступ к роскоши Бутика и прокачке оружия.', '<span data-i18n="guide.sparkles.intro">Драгоценные искры сияния, дающие доступ к роскоши Бутика и прокачке оружия.</span>');
p('<li>Критические удары при кликах (базово 5%, растет от счастья и талантов)</li>', '<li data-i18n="guide.sparkles.e1">Критические удары при кликах (базово 5%, растет от счастья и талантов)</li>');
p('<li>Автокликер. Потолок задаёт персонаж: голые руки — 40 кликов в секунду, нож поднимает его</li>', '<li data-i18n="guide.sparkles.e2">Автокликер. Потолок задаёт персонаж: голые руки — 40 кликов в секунду, нож поднимает его</li>');
p('<li>Сбор летающих метеоритов и выполнение достижений</li>', '<li data-i18n="guide.sparkles.e3">Сбор летающих метеоритов и выполнение достижений</li>');
p('<li>Бутик: шапки до короны. Потолок силы клика от шапки — x80, каждый уровень шапки добавляет ещё 15%</li>', '<li data-i18n="guide.sparkles.w1">Бутик: шапки до короны. Потолок силы клика от шапки — x80, каждый уровень шапки добавляет ещё 15%</li>');
p('<li>Заточка ножей StatTrak™ звездами (★ Lv.1 - Lv.10)</li>', '<li data-i18n="guide.sparkles.w2">Заточка ножей StatTrak™ звездами (★ Lv.1 - Lv.10)</li>');
p('<li>Покупка элитных перков бесконечного дохода</li>', '<li data-i18n="guide.sparkles.w3">Покупка элитных перков бесконечного дохода</li>');

p('<span class="font-game text-sm text-yellow-300">Втулки Судьбы (Toilet Rolls)</span>', '<span class="font-game text-sm text-yellow-300" data-i18n="guide.rolls.title">Втулки Судьбы (Toilet Rolls)</span>');
p('>Престиж\n              I ранга</span>', ' data-i18n="guide.rolls.badge">Престиж I ранга</span>');
p('Священные втулки от Великого Смыва Судьбы. Их тратят на таланты и кейсы. Доход умножает не запас втулок, а эхо смытой эпохи.', '<span data-i18n="guide.rolls.intro">Священные втулки от Великого Смыва Судьбы. Их тратят на таланты и кейсы. Доход умножает не запас втулок, а эхо смытой эпохи.</span>');
p('<li>Первый Смыв созревает примерно за 5–10 минут: форма 80 и биомасса забега. Он даёт втулки и эхо x2</li>', '<li data-i18n="guide.rolls.e1">Первый Смыв созревает примерно за 5–10 минут: форма 80 и биомасса забега. Он даёт втулки и эхо x2</li>');
p('<li>Эхо — множитель дохода этой эпохи. Первый смыв ставит x2, следующие подходят к x3. Эхо не тратится и для прорыва не копится</li>', '<li data-i18n="guide.rolls.e2">Эхо — множитель дохода этой эпохи. Первый смыв ставит x2, следующие подходят к x3. Эхо не тратится и для прорыва не копится</li>');
p('<li>Дальше смыв эпохи стоит примерно на 40% её форм. Втулки тратят на таланты и кейсы</li>', '<li data-i18n="guide.rolls.e3">Дальше смыв эпохи стоит примерно на 40% её форм. Втулки тратят на таланты и кейсы</li>');
p('<li>Пассивный Хроно-генератор втулок из Прорыва</li>', '<li data-i18n="guide.rolls.e4">Пассивный Хроно-генератор втулок из Прорыва</li>');
p('<li>Древо Талантов: 18 вечных умений прокачки</li>', '<li data-i18n="guide.rolls.w1">Древо Талантов: 18 вечных умений прокачки</li>');
p('<li>Открытие оружейных контейнеров (Фазы 1-3)</li>', '<li data-i18n="guide.rolls.w2">Открытие оружейных контейнеров (Фазы 1-3)</li>');
p('<li>Астральный Прорыв открывает следующую пару эпох и ставит закрытой паре доход x3. Первый просит 2 смыва, второй 3, дальше 4</li>', '<li data-i18n="guide.rolls.w3">Астральный Прорыв открывает следующую пару эпох и ставит закрытой паре доход x3. Первый просит 2 смыва, второй 3, dальше 4</li>');

p('<span class="font-game text-sm text-cyan-300">Астральные Вантузы (Astral Plungers)</span>', '<span class="font-game text-sm text-cyan-300" data-i18n="guide.plungers.title">Астральные Вантузы (Astral Plungers)</span>');
p('>Престиж\n              II ранга</span>', ' data-i18n="guide.plungers.badge">Престиж II ранга</span>');
p('Высшая эндгейм-валюта Космического Прорыва. Раздвигает границы реальности и открывает полную автоматизацию.', '<span data-i18n="guide.plungers.intro">Высшая эндгейм-валюта Космического Прорыва. Раздвигает границы реальности и открывает полную автоматизацию.</span>');
p('<li>Астральный Прорыв (кнопка <span class="plunger-icon" aria-hidden="true"></span> Прорыв)</li>', '<li data-i18n="guide.plungers.e1">Астральный Прорыв (кнопка Прорыв)</li>');
p('<li>Смывы чётной эпохи открытой пары: сначала 2, потом 3, с третьего прорыва всегда 4. Затем снова форма и биомасса, и кнопка Прорыв. Забег не сбрасывается. Награда — 1 вантуз, и ещё 1 если дошли до конца эпохи. Смыв этой эпохи тоже даёт 1 вантуз, пока не набран запас пары.</li>', '<li data-i18n="guide.plungers.e2">Смывы чётной эпохи открытой пары: сначала 2, потом 3, с третьего прорыва всегда 4. Затем снова форма и биомасса, и кнопка Прорыв. Забег не сбрасывается. Награда — 1 вантуз, и ещё 1 если дошли до конца эпохи. Смыв этой эпохи тоже даёт 1 вантуз, пока не набран запас пары.</li>');
p('<li>Втулки и вантузы остаются. Смыв сбрасывает форму и заводы. Прорыв сбрасывает только счётчик смывов пары</li>', '<li data-i18n="guide.plungers.e3">Втулки и вантузы остаются. Смыв сбрасывает форму и заводы. Прорыв сбрасывает только счётчик смывов пары</li>');
p('<li>4 Тира Астральных Реликвий (авто-заводы, кузница, бури)</li>', '<li data-i18n="guide.plungers.w1">4 Тира Астральных Реликвий (авто-заводы, кузница, бури)</li>');
p('<li>Открытие богоподобных кейсов (Небесный, Cobblestone, Демиург, Вечность)</li>', '<li data-i18n="guide.plungers.w2">Открытие богоподобных кейсов (Небесный, Cobblestone, Демиург, Вечность)</li>');
p('<li>Высшая Космическая Сингулярность</li>', '<li data-i18n="guide.plungers.w3">Высшая Космическая Сингулярность</li>');

p('<span class="font-game text-sm text-amber-300">Коллекция 202 Ножа & Боевой Счётчик</span>', '<span class="font-game text-sm text-amber-300" data-i18n="guide.knives.title">Коллекция 202 Ножа & Боевой Счётчик</span>');
p('>Арсенал</span>', ' data-i18n="guide.knives.badge">Арсенал</span>');
p('Все 202 легендарных ножа с настоящей физической рулеткой, звуками открытия, анимацией в руке\n            какашечки и счетчиком кликов StatTrak™!', '<span data-i18n="guide.knives.intro">Все 202 легендарных ножа с настоящей физической рулеткой, звуками открытия, анимацией в руке какашечки и счетчиком кликов StatTrak™!</span>');
p('<div><b class="text-cyan-300">⭐ Редкости:</b> Армейские ➔ Запрещенные ➔ Засекреченные ➔ Тайные (Covert) ➔\n              Радужные (Rainbow) ➔ Титановые ➔ Небесные (Celestial) ➔ Божественные (Godly Omega)!</div>', '<div data-i18n="guide.knives.rarities"><b class="text-cyan-300">⭐ Редкости:</b> Армейские ➔ Запрещенные ➔ Засекреченные ➔ Тайные (Covert) ➔ Радужные (Rainbow) ➔ Титановые ➔ Небесные (Celestial) ➔ Божественные (Godly Omega)!</div>');
p('<div><b class="text-yellow-300">⭐ Фазы кейсов:</b> Кейс открывается с рекорда эпохи и стоит два-три смыва этой эпохи.\n              С эпохи 3 к втулкам добавляются вантузы. Смыв рекорд не стирает, кейс остаётся открытым.\n              В каждом кейсе, кроме последнего, 1% на лучший обычный нож следующего.\n              Ножи разложены ровнее по кейсам. В каждом кейсе керамбит самый сильный, а катана — следующая за ним, где она есть. На вершине Вечности они выше остальных форм.</div>', '<div data-i18n="guide.knives.phases"><b class="text-yellow-300">⭐ Фазы кейсов:</b> Кейс открывается с рекорда эпохи и стоит два-три смыва этой эпохи. С эпохи 3 к втулкам добавляются вантузы. Смыв рекорд не стирает, кейс остаётся открытым. В каждом кейсе, кроме последнего, 1% на лучший обычный нож следующего. Ножи разложены ровнее по кейсам. В каждом кейсе керамбит самый сильный, а катана — следующая за ним, где она есть. На вершине Вечности они выше остальных форм.</div>');
p('<div><b class="text-orange-400">⭐ StatTrak™:</b> Каждый клик экипированным ножом навсегда увеличивает\n              счётчик его фрагов!</div>', '<div data-i18n="guide.knives.stattrak"><b class="text-orange-400">⭐ StatTrak™:</b> Каждый клик экипированным ножом навсегда увеличивает счётчик его фрагов!</div>');

p('<span class="font-game text-sm text-emerald-300">Гильдия и боссы</span>', '<span class="font-game text-sm text-emerald-300" data-i18n="guide.guild.title">Гильдия и боссы</span>');
p('<span class="font-game text-sm text-yellow-300">Советы и Стратегии для Быстрого Прогресса</span>', '<span class="font-game text-sm text-yellow-300" data-i18n="guide.tips.title">Советы и Стратегии для Быстрого Прогресса</span>');
p('<li>Один аккаунт состоит в одной гильдии, до 20 человек. Перед ником стоит титул.</li>', '<li data-i18n="guide.guild.l1">Один аккаунт состоит в одной гильдии, до 20 человек. Перед ником стоит титул.</li>');
p('<li>Глава и офицер приглашают и вызывают босса из уже открытых. Участник только бьёт.</li>', '<li data-i18n="guide.guild.l2">Глава и офицер приглашают и вызывают босса из уже открытых. Участник только бьёт.</li>');
p('<li>Окно гильдии: своя, бонусы, бой, журнал, поиск. У главы и офицеров ещё «Настройки». Поиск ищет по названию и по уровню.</li>', '<li data-i18n="guide.guild.l3">Окно гильдии: своя, бонусы, бой, журнал, поиск. У главы и офицеров ещё «Настройки». Поиск ищет по названию и по уровню.</li>');
p('<li>На странице боя видно, можно ли бить, идёт ли удар, живой урон и клики. На боссе подсказка «Нажми, чтобы начать бой». Можно включить автобой на потолке кликов. Состав гильдии там не показывается.</li>', '<li data-i18n="guide.guild.l4">На странице боя видно, можно ли бить, идёт ли удар, живой урон и клики. На боссе подсказка «Нажми, чтобы начать бой». Можно включить автобой на потолке кликов. Состав гильдии там не показывается.</li>');
p('<li>Вкладка «Журнал» открыта даже во время боя: там книга боссов гильдии и недавние победы и проигрыши.</li>', '<li data-i18n="guide.guild.l5">Вкладка «Журнал» открыта даже во время боя: там книга боссов гильдии и недавние победы и проигрыши.</li>');
p('<li>Вкладка «Настройки» видна главе и офицерам: порог эпохи, заявки и роспуск. Состав гильдии выделен на странице «Моя гильдия».</li>', '<li data-i18n="guide.guild.l6">Вкладка «Настройки» видна главе и офицерам: порог эпохи, заявки и роспуск. Состав гильдии выделен на странице «Моя гильдия».</li>');
p('<li>Урон за клик считает сервер: √формы × (1 + сила ножа), звёзды ножа чуть усиливают. Быстрее потолка кликов удар не идёт.</li>', '<li data-i18n="guide.guild.l7">Урон за клик считает сервер: √формы × (1 + сила ножа), звёзды ножа чуть усиливают. Быстрее потолка кликов удар не идёт.</li>');
p('<li>На «Моя гильдия» шкала уровня с очками. Вкладка «Бонусы» — множители до ур. 25 (прыжки на 5 / 10 / 15 / 20 / 25). Потолок x2.25 к клику и заводам.</li>', '<li data-i18n="guide.guild.l8">На «Моя гильдия» шкала уровня с очками. Вкладка «Бонусы» — множители до ур. 25 (прыжки на 5 / 10 / 15 / 20 / 25). Потолок x2.25 к клику и заводам.</li>');
p('<li>После победы, проигрыша или конца 15 секунд удара открывается окно итогов: клики, урон и награды.</li>', '<li data-i18n="guide.guild.l9">После победы, проигрыша или конца 15 секунд удара открывается окно итогов: клики, урон и награды.</li>');
p('<li>Удар длится 15 секунд, потом личные 3 часа. На попытку есть 12 часов.</li>', '<li data-i18n="guide.guild.l10">Удар длится 15 секунд, потом личные 3 часа. На попытку есть 12 часов.</li>');
p('<li>Письмо о победе или проигрыше приходит всей гильдии. Вантузы внутри только у того, кто сам бил.</li>', '<li data-i18n="guide.guild.l11">Письмо о победе или проигрыше приходит всей гильдии. Вантузы внутри только у того, кто сам бил.</li>');
p('<li><b class="text-amber-300">Триада ухода:</b> Держите Сытость и Чистоту высокими (до +25% к клику и заводам), а Счастье — ради шанса крита (до +20%). Включите Авто-Уход при первой\n              возможности!</li>', '<li data-i18n="guide.tips.l1"><b class="text-amber-300">Триада ухода:</b> Держите Сытость и Чистоту высокими (до +25% к клику и заводам), а Счастье — ради шанса крита (до +20%). Включите Авто-Уход при первой возможности!</li>');
p('<li><b class="text-amber-300">Турбо-Ярость:</b> Набивайте быстрые клики, чтобы заполнить шкалу Комбо до 100%\n              и активировать Турбо-Режим с x4 уроном (x6 у архетипа Комбо)!</li>', '<li data-i18n="guide.tips.l2"><b class="text-amber-300">Турбо-Ярость:</b> Набивайте быстрые клики, чтобы заполнить шкалу Комбо до 100% и активировать Турбо-Режим с x4 уроном (x6 у архетипа Комбо)!</li>');
p('<li><b class="text-amber-300">Архетипы:</b> Перед Смывом выбирайте подходящий архетип (например,\n              <i>Магнат</i> для ночного AFK или <i>Кликер</i> для активной игры).\n            </li>', '<li data-i18n="guide.tips.l3"><b class="text-amber-300">Архетипы:</b> Перед Смывом выбирайте подходящий архетип (например, Магнат для ночного AFK или Кликер для активной игры).</li>');
p('<li><b class="text-amber-300">Грамотный Смыв:</b> Не сидите слишком долго на одном забеге, если прирост\n              биомассы замедлился — смыв даст Втулки и резко разгонит следующий цикл!</li>', '<li data-i18n="guide.tips.l4"><b class="text-amber-300">Грамотный Смыв:</b> Не сидите слишком долго на одном забеге, если прирост биомассы замедлился — смыв даст Втулки и резко разгонит следующий цикл!</li>');

const dir = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(dir, 'shell-index-patches.mjs'), `export const patches = ${JSON.stringify(patches, null, 2)};\n`);

// merge keys back into shell-index-keys for apply script
const keysPath = path.join(dir, 'shell-index-keys.mjs');
let keysSrc = fs.readFileSync(keysPath, 'utf8');
keysSrc = keysSrc.replace(
  "export const patches = [];",
  `import { patches } from './shell-index-patches.mjs';\nimport { guideEn, guideRu } from './shell-index-guide.mjs';\nObject.assign(enNew, guideEn);\nObject.assign(ruNew, guideRu);\nexport { patches };`
);
fs.writeFileSync(keysPath, keysSrc);

console.log('patches', patches.length, 'total en keys', Object.keys(enNew).length);
