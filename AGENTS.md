# Project Rules & Guidelines for Poop Simulator

Фундаментальные правила проекта. Специализированные регламенты вынесены в навыки `.agents/skills/`.

## 🔢 1. Форматирование чисел (Number Formatting)
1. Все числа в UI выводятся только в укороченном виде (`10k`, `10M`, `10B`, `10T`, `10Qa`, `10Qi`...) без пробела.
2. Использовать `formatNumber(value)` из [`src/utils/numberFormatter.js`](src/utils/numberFormatter.js) для всех кнопок, плашек, цен, множителей, бонусов и уровней.
3. Запрещены «сырые» числа (`${count}`, `${mult.toFixed(1)}`). Исключения: таймеры (`15с`) и целые числа < 1 000.

## 🎨 2. UI: Ночной сад (Design System)
1. Зелёно-серая оболочка, мятный акцент по умолчанию. Без коричневых фонов и рамок.
2. Шрифт строго `Nunito` (700–800) для всего интерфейса и canvas. Запрещены Comfortaa, Fredoka One, системные моноширинные шрифты.
3. Форма: кнопки/баффы/бейджи — капсула (`--radius-full`). Карточки/модалки — `--radius-md` (28px) и `--radius-lg` (40px), обводка 3px, мягкие тени.
4. Цвета сущностей: Доход — мятный, Блестяшки — золото, Сытость — тёплый, Чистота — голубой, Счастье — розовый.
5. Использовать токены из [`styles/variables.css`](styles/variables.css) и [`styles/main.css`](styles/main.css).

## 🌿 3. Git и разработка
1. Коммиты и разработка строго в ветку **`main`** (Cloudflare Pages). Ветку `master` не создавать.
2. Обязательна проверка синтаксиса перед коммитом (`node --check`).

## 🔒 4. Архитектура безопасности
1. Сервер (`worker.js`) — источник правды для рейтинга, топ-10 и облачного сохранения.
2. Лимит кликов: все клики проходят через `takeClickBudget()` (базовый кап 40 CPS, бонусы в `getClickCapCps()`).
3. Секреты только в Cloudflare env (`DISCORD_WEBHOOK`). Никогда не коммитить ключи.
4. Не публиковать отладочные методы в `window` (`window.GAME`, `window.wipePlayerData`).

## 🛠️ 5. Регламенты по требованию (Skills)
- **Релиз патча**: при завершении работ оформлять патч по инструкции [.agents/skills/patch-release/SKILL.md](.agents/skills/patch-release/SKILL.md).
- **Скины и шапки**: при работе со спрайтами/балансом нарядов следовать [.agents/skills/skin-workflow/SKILL.md](.agents/skills/skin-workflow/SKILL.md).
- **Локализация (i18n)**: при добавлении переводов следовать [.agents/skills/i18n-workflow/SKILL.md](.agents/skills/i18n-workflow/SKILL.md).
- **Карта index.html**: при правке разметки использовать диапазоны строк из [.agents/skills/index-html-map/SKILL.md](.agents/skills/index-html-map/SKILL.md).
- **Схемы сущностей**: при добавлении ножей/фабрик/кейсов/талантов брать шаблоны из [.agents/skills/data-schemas/SKILL.md](.agents/skills/data-schemas/SKILL.md).
- **Карта модулей**: ориентироваться по структуре файлов в [.agents/skills/codebase-map/SKILL.md](.agents/skills/codebase-map/SKILL.md).
