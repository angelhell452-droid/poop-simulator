---
name: i18n-workflow
description: Регламент добавления и редактирования переводов игры (ru.js, en.js, data.en.js) с защитой от перерасхода токенов.
---

# Регламент локализации (i18n) в Poop Simulator

Использовать этот навык при добавлении новых текстов, кнопок или переводов на русский и английский языки.

## ⚠️ Критическое правило экономии токенов
Файлы локализации огромны: `data.en.js` (142 КБ), `ru.js` (90 КБ), `en.js` (65 КБ).
- **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО** читать эти файлы целиком (`view_file` без диапазона строк).
- **Всегда использовать `grep_search`** для поиска нужной секции или ключа.
- Читать только конкретный диапазон строк (например, строки 40–80) и использовать `replace_file_content`.

## 1. Структура файлов локализации
- [`src/i18n/locales/ru.js`](../../src/i18n/locales/ru.js) — русский интерфейс (шапка, вкладки, модалки, баффы, подсказки).
- [`src/i18n/locales/en.js`](../../src/i18n/locales/en.js) — английский интерфейс.
- [`src/i18n/locales/data.en.js`](../../src/i18n/locales/data.en.js) — английские переводы названий сущностей (ножи, кейсы, заводы, таланты, боссы).
- [`src/i18n/t.js`](../../src/i18n/t.js) — функция вызова перевода `t('key.subkey')`.

## 2. Локализация в HTML
В `index.html` статичные тексты размечаются атрибутами:
- `data-i18n="section.key"` — заменяет `textContent`.
- `data-i18n-title="section.keyTitle"` — заменяет атрибут `title`.
- `data-i18n-placeholder="section.keyPlaceholder"` — заменяет `placeholder`.

## 3. Локализация в JS-коде
```javascript
import { t } from '../i18n/t.js';

// Простой вызов:
const text = t('guild.createSuccess');

// С подстановкой параметров:
const note = t('modal.nowNeed', { now: formatNumber(val), need: formatNumber(target) });
```
