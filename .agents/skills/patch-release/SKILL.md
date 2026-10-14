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
*Примечание:* Архивные патчи хранятся в `src/data/patchNotesArchive.data.js` и импортируются автоматически. Менять архив не требуется. Исторические записи старых патчей в `PATCH_NOTES` **не** переименовывать под новую версию.

## 2. Синхронизация версии везде (обязательный чеклист)

Номер патча `X.Y.Z` должен совпасть **во всех** точках ниже. Если клиент отстаёт от сервера (или наоборот), баннер «ДОСТУПНО ОБНОВЛЕНИЕ ИГРЫ!» крутится бесконечно.

### 2.1. Авторитет версий (критично — не пропускать)
1. **`src/core/serverAuthority.js`**
   - `export const CURRENT_CLIENT_PATCH_VERSION = 'X.Y.Z';`
   - Это версия **кода клиента**. Сравнивается с `patchVersion` с `/api/version`.
2. **`src/core/state.js`**
   - Дефолт `GAME.patchVersion: 'X.Y.Z'`
3. **`workerAdmin.js`** (и любые серверные фолбэки `patch_version`)
   - `INSERT … 'patch_version', 'X.Y.Z'`
   - Фоллбеки `patchVersion` / `clientPatchVersion`
   - Пол `compareSemver('X.Y.Z', patchVersion)` и дефолты `setServerPatchVersion`
   - Серверный `patch_version` в D1 не должен быть **выше** клиента после релиза (иначе soft-reload loop).

### 2.2. UI и пакет
1. **`index.html`**:
   - `<title>Poop Simulator vX.Y.Z PRO</title>`
   - `<link rel="stylesheet" href="styles/main.css?v=X.Y.Z">`
   - `#lobbyVersionTag` и `#versionTag`: `vX.Y.Z PRO`
   - `<script type="module" src="src/main.js?v=X.Y.Z">`
2. **`package.json`**: `"version": "X.Y.Z"`
3. **`src/data/patchNotes.data.js`**: новая запись `version: 'vX.Y.Z PRO'` (см. §1)

### 2.3. Кэш модулей
- Обновить query `?v=X.Y.Z` во **всех** импортах `src/**/*.js` и связанных точках входа (не только в изменённых файлах), чтобы Cloudflare/браузер не отдавали старый бандл.
- Не трогать суффиксы ассетов вида `?v=5.4.4m` / `?v=5.4.4h` (это отдельные ревизии спрайтов, не semver патча).
- Не переписывать тексты старых патчноутов (`v5.4.3 PRO` и т.п.).

### 2.4. Быстрая сверка перед коммитом
```bash
# Клиентский авторитет
rg "CURRENT_CLIENT_PATCH_VERSION\\s*=\\s*'" src/core/serverAuthority.js
rg "patchVersion:\\s*'" src/core/state.js

# Серверные фолбэки
rg "patch_version|patchVersion|clientPatchVersion" workerAdmin.js

# Видимая версия
rg "vX\\.Y\\.Z PRO|main\\.css\\?v=|main\\.js\\?v=" index.html
rg '"version"' package.json

# Не должно остаться старого номера в авторитетных константах
rg "CURRENT_CLIENT_PATCH_VERSION\\s*=\\s*'OLD'" src/
```
Заменить `X.Y.Z` / `OLD` на фактические номера. Если `CURRENT_CLIENT_PATCH_VERSION` ≠ `workerAdmin` floor ≠ `package.json` — **не пушить**.

## 3. Предрелизная проверка
1. Выполнить проверку синтаксиса всех затронутых JS-модулей:
   ```bash
   node --check src/main.js
   node --check src/data/patchNotes.data.js
   node --check src/core/serverAuthority.js
   ```
2. Убедиться, что режим примерки `SKIN_FITTING` выключен (`false`).
3. Разработка и коммиты ведутся строго в ветку `main`.
4. После пуша на Cloudflare: убедиться, что баннер обновления не появляется при уже актуальном клиенте (`serverPatch <= CURRENT_CLIENT_PATCH_VERSION`).
