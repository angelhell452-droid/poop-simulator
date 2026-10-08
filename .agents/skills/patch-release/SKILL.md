---
name: patch-release
description: Регламент выпуска патча игры, бампа версий, добавления записи в patchNotes.data.js и предрелизной валидации.
---

# Регламент выпуска патча для Poop Simulator

Использовать этот регламент при завершении фичи/багфикса для оформления релиза.

## 1. Запись в `src/data/patchNotes.data.js`
Добавить новый элемент в начало массива `PATCH_NOTES`:
```javascript
{
  version: 'vX.Y.Z PRO',
  date: 'ДД Месяца ГГГГ',
  title: 'Краткий заголовок патча',
  badge: 'Патч X.Y',
  badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
  changes: [
    { type: 'feature' | 'fix' | 'balance' | 'ui' | 'perf', icon: '⚡', text: 'Описание изменения' }
  ]
}
```
*Примечание:* Архивные патчи хранятся в `src/data/patchNotesArchive.data.js` и импортируются автоматически. Менять архив не требуется.

## 2. Синхронизация версии в проекте
1. **`index.html`**:
   - Тег `<title>Poop Simulator vX.Y.Z PRO</title>`
   - Версия кэша стилей: `<link rel="stylesheet" href="styles/main.css?v=X.Y.Z">`
   - Элемент версии в шапке: `<span ... id="versionTag">vX.Y.Z PRO</span>`
2. **`package.json`**:
   - Поле `"version": "X.Y.Z"`
3. **Кэш импорта модулей**:
   - При необходимости обновить query-параметры `?v=X.Y.Z` в затронутых импортах интерфейса.

## 3. Предрелизная проверка
1. Выполнить проверку синтаксиса всех затронутых JS-модулей:
   ```bash
   node --check src/main.js
   node --check src/data/patchNotes.data.js
   ```
2. Убедиться, что режим примерки `SKIN_FITTING` выключен (`false`).
3. Разработка и коммиты ведутся строго в ветку `main`.
