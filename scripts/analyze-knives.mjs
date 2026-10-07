import fs from 'fs';
const text = fs.readFileSync(new URL('../src/data/knives.data.js', import.meta.url), 'utf8');
const names = [...text.matchAll(/"name":\s*"([^"]+)"/g)].map((m) => m[1]);
let withParen = 0;
let without = 0;
const noParen = [];
for (const n of names) {
  if (/\([^)]+\)\s*$/.test(n)) withParen += 1;
  else {
    without += 1;
    if (noParen.length < 15) noParen.push(n);
  }
}
console.log(JSON.stringify({ total: names.length, withParen, without, noParen }, null, 2));
