// Safe number formatting supporting up to 1.79e308 (Break Infinity)
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (!isFinite(num) || num >= 1.7976931348623157e308) return '1.79e308 (MAX)';
  if (num === 0) return '0';
  
  const abs = Math.abs(num);
  if (abs < 0.001) return '0';
  if (abs < 1000) {
    if (Math.abs(num - Math.round(num)) < 1e-6) return String(Math.round(num));
    return Number(num.toFixed(1)).toString();
  }

  const units = [
    'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
    'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod',
    'Vg'
  ];
  const exp = Math.floor(Math.log10(abs));
  const unitIndex = Math.floor(exp / 3) - 1;

  if (unitIndex >= 0 && unitIndex < units.length) {
    const scaled = num / Math.pow(10, (unitIndex + 1) * 3);
    const dec = scaled >= 100 ? 0 : (scaled >= 10 ? 1 : decimals);
    return Number(scaled.toFixed(dec)) + units[unitIndex];
  }

  // Beyond 10^66: Scientific exponential notation (e.g., 1.23e75, 4.56e200)
  return num.toExponential(decimals).replace('+', '');
}

const SHORTHAND = [
  ['sp', 1e24], ['oc', 1e27], ['no', 1e30], ['dc', 1e33],
  ['ud', 1e36], ['dd', 1e39], ['td', 1e42], ['qad', 1e45], ['qid', 1e48],
  ['sxd', 1e51], ['spd', 1e54], ['ocd', 1e57], ['nod', 1e60], ['vg', 1e63],
  ['qa', 1e15], ['qi', 1e18], ['sx', 1e21],
  ['k', 1e3], ['m', 1e6], ['b', 1e9], ['t', 1e12]
].sort((a, b) => b[0].length - a[0].length);

export function parseShorthand(raw) {
  const text = String(raw ?? '').trim().replace(/\s+/g, '').replace(',', '.');
  if (!text) return null;
  if (/^\d+(?:\.\d+)?e[+-]?\d+$/i.test(text)) {
    const n = Number(text);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  const match = text.match(/^(\d+(?:\.\d+)?)([a-z]+)$/i);
  if (match) {
    const suffix = SHORTHAND.find(([name]) => name === match[2].toLowerCase());
    if (!suffix) return null;
    const n = Number(match[1]) * suffix[1];
    return Number.isFinite(n) ? n : null;
  }
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}
