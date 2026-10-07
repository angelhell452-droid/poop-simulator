import fs from 'fs';
const path = new URL('../src/ui/casesView.js', import.meta.url);
let s = fs.readFileSync(path, 'utf8');
const reps = [
  [/caseObj\.name/g, 'caseName(caseObj)'],
  [/caseObj\.desc/g, 'caseDesc(caseObj)'],
  [/itemKnife\.name/g, 'knifeName(itemKnife)'],
  [/rouletteWinningKnife\.name/g, 'knifeName(rouletteWinningKnife)'],
  [/\$\{c\.name\}/g, '${caseName(c)}'],
  [/\$\{c\.desc\}/g, '${caseDesc(c)}'],
  [/\$\{knife\.name\}/g, '${knifeName(knife)}']
];
for (const [a, b] of reps) s = s.replace(a, b);
fs.writeFileSync(path, s);
console.log('ok');
