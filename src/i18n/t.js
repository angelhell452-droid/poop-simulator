import { DEFAULT_LOCALE, LOCALE_META, LOCALES } from './locales/index.js';

export const LOCALE_STORAGE_KEY = 'PoopSim_Locale';

let locale = DEFAULT_LOCALE;
const listeners = new Set();

function readStoredLocale() {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw && LOCALES[raw]) return raw;
  } catch (_) { /* ignore */ }
  return null;
}

function detectLocale() {
  try {
    const nav = String(navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('en')) return 'en';
  } catch (_) { /* ignore */ }
  return DEFAULT_LOCALE;
}

function interpolate(template, vars) {
  if (!vars || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => (
    vars[key] == null ? `{${key}}` : String(vars[key])
  ));
}

export function getLocale() {
  return locale;
}

export function listLocales() {
  return LOCALE_META.slice();
}

export function t(key, vars) {
  const pack = LOCALES[locale] || LOCALES[DEFAULT_LOCALE] || {};
  const fallback = LOCALES[DEFAULT_LOCALE] || {};
  const raw = pack[key] ?? fallback[key] ?? key;
  return interpolate(raw, vars);
}

export function onLocaleChange(fn) {
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => {
    try { fn(locale); } catch (_) { /* ignore */ }
  });
}

export function applyDomI18n(root = document) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (!key) return;
    const text = t(key);
    if (node.dataset.i18nAttr === 'placeholder') {
      node.setAttribute('placeholder', text);
      return;
    }
    node.textContent = text;
  });
  root.querySelectorAll('[data-i18n-title]').forEach((node) => {
    const key = node.getAttribute('data-i18n-title');
    if (key) node.setAttribute('title', t(key));
  });
}

export function setLocale(code, { persist = true, applyDom = true } = {}) {
  const next = LOCALES[code] ? code : DEFAULT_LOCALE;
  const changed = next !== locale;
  locale = next;
  try {
    if (typeof document !== 'undefined') document.documentElement.lang = next;
  } catch (_) { /* ignore */ }
  if (persist) {
    try { localStorage.setItem(LOCALE_STORAGE_KEY, next); } catch (_) { /* ignore */ }
  }
  if (applyDom && typeof document !== 'undefined') applyDomI18n(document);
  if (changed) notify();
  return locale;
}

/** Call once at boot before painting account UI. */
export function initI18n() {
  const stored = readStoredLocale();
  const hasDom = typeof document !== 'undefined';
  setLocale(stored || detectLocale(), { persist: !!stored, applyDom: hasDom });
  return locale;
}
