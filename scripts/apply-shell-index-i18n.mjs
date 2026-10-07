import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { enNew, ruNew, patches } from './shell-index-keys.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function mergeLocale(rel, add) {
  const file = path.join(root, rel);
  let s = fs.readFileSync(file, 'utf8');
  const idx = s.lastIndexOf('};');
  if (idx < 0) throw new Error(`no closing brace in ${rel}`);
  if (s.includes('// --- index.html shell ---')) {
    console.warn(`skip duplicate shell keys in ${rel}`);
    return;
  }
  let head = s.slice(0, idx).replace(/\s+$/, '');
  if (!head.endsWith(',')) head += ',';
  const lines = Object.entries(add).map(
    ([k, v]) => `  '${k.replace(/'/g, "\\'")}': ${JSON.stringify(v)},`
  );
  const block = `\n\n  // --- index.html shell ---\n${lines.join('\n')}\n`;
  s = head + block + s.slice(idx);
  fs.writeFileSync(file, s);
}

mergeLocale('src/i18n/locales/en.js', enNew);
mergeLocale('src/i18n/locales/ru.js', ruNew);

const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
let applied = 0;
let missed = 0;
for (const [from, to] of patches) {
  if (!html.includes(from)) {
    missed += 1;
    console.warn('miss:', from.slice(0, 72).replace(/\s+/g, ' '));
    continue;
  }
  html = html.split(from).join(to);
  applied += 1;
}
fs.writeFileSync(htmlPath, html);
console.log(`keys: ${Object.keys(enNew).length}, patches: ${applied}, missed: ${missed}`);
