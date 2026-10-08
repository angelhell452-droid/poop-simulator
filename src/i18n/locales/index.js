import ruShell from './ru.js';
import enShell from './en.js';
import enData from './data.en.js';

/** RU shell only — gameplay data text stays in src/data as fallback. */
export const LOCALES = {
  ru: { ...ruShell },
  en: { ...enShell, ...enData }
};

export const LOCALE_META = [
  { code: 'en', labelKey: 'lang.en' },
  { code: 'ru', labelKey: 'lang.ru' }
];

export const DEFAULT_LOCALE = 'en';
