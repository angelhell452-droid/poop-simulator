---
name: codebase-map
description: Карта архитектуры и ключевых модулей проекта для мгновенной навигации без поискового расхода токенов.
---

# Архитектурная карта модулей Poop Simulator

Используйте эту карту, чтобы сразу открывать целевой файл без поисковых запросов (`grep`) по всему проекту.

## 1. Ядро (Core)
- [`src/core/state.js`](../../src/core/state.js) — единое состояние игры `GAME` (биомасса, форма, валюты, инвентарь).
- [`src/core/gameLoop.js`](../../src/core/gameLoop.js) — основной игровой тик (начисление пассивного дохода, CPS).
- [`src/core/events.js`](../../src/core/events.js) — шина событий (эмиттеры и слушатели).

## 2. Экономика (Economy)
- [`src/economy/production.js`](../../src/economy/production.js) — расчет силы клика `getClickPower()`, пассивного дохода `getPassiveIncome()`, множителей ножей и шапок.
- [`src/economy/metaMultipliers.js`](../../src/economy/metaMultipliers.js) — постоянные множители от смыва и вантузов.
- [`src/economy/costs.js`](../../src/economy/costs.js) — расчет цен и возможности покупки.

## 3. Прогрессия и Престиж (Progression & Prestige)
- [`src/progression/evolutionService.js`](../../src/progression/evolutionService.js) — переход на новые формы какашечки.
- [`src/prestige/prestigeService.js`](../../src/prestige/prestigeService.js) — механика Смыва (рулоны/втулки `rolls`).
- [`src/prestige/transcendService.js`](../../src/prestige/transcendService.js) — механика Прорыва (астральные вантузы `plungers`).

## 4. Сохранения (Save System)
- [`src/save/saveManager.js`](../../src/save/saveManager.js) — локальное сохранение в `localStorage`.
- [`src/save/cloudSync.js`](../../src/save/cloudSync.js) — облачная синхронизация с Cloudflare Worker и базой D1.

## 5. Серверная часть (Cloudflare Workers)
- [`worker.js`](../../worker.js) — основной API сервер, облачные сохранения, валидация CPS, таблица лидеров Топ-10.
- [`workerGuild.js`](../../workerGuild.js) — система гильдий, рейдовые боссы, взносы, чат/лог.
- [`workerFriends.js`](../../workerFriends.js) — система друзей, заявки, подарки, статус онлайна.
- [`workerAdmin.js`](../../workerAdmin.js) — панель администратора, бан игроков, мониторинг.

## 6. Пользовательский интерфейс (UI)
- [`src/ui/hudView.js`](../../src/ui/hudView.js) — верхняя панель (валюты, форма, доход в секунду).
- [`src/ui/modalManager.js`](../../src/ui/modalManager.js) — открытие/закрытие всех модальных окон, подписки.
- [`src/ui/petCanvasView.js`](../../src/ui/petCanvasView.js) — холст анимации какашки, клики, эмоции, нож и шапка.
- [`src/ui/guildView.js`](../../src/ui/guildView.js) — окно гильдии, список участников, боссы.
- [`src/ui/casesView.js`](../../src/ui/casesView.js) — витрина и рулетка кейсов.
- [`src/ui/characterInventoryView.js`](../../src/ui/characterInventoryView.js) — гардероб и надевание скинов/шапок.
