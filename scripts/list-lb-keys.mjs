import fs from 'fs';
import { LOCALES } from '../src/i18n/locales/index.js';
const src = fs.readFileSync(new URL('../src/ui/leaderboardView.js', import.meta.url), 'utf8');
const keys = [...new Set((src.match(/t\('(lb\.[^']+)'/g) || []).map((m) => m.slice(3, -1)))].sort();
const miss = keys.filter((k) => !LOCALES.ru[k] || !LOCALES.en[k]);
console.log(JSON.stringify({ used: keys.length, missing: miss }, null, 2));
