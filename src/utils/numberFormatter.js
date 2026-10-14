import { isBig, log10Of, rehydrateBig } from './big.js?v=5.4.2';

function mantissaDecimals(absMantissa, decimals) {
  return absMantissa >= 10 ? 1 : decimals;
}

//function roundMantissa(scaled, decimals) {
//  return Number(scaled.toFixed(mantissaDecimals(Math.abs(scaled), decimals)));
//}
function roundMantissa(scaled, decimals) {
  // Вычисляем количество знаков после запятой
  const dec = mantissaDecimals(Math.abs(scaled), decimals);
  const factor = Math.pow(10, dec);
  // Используем Math.trunc для отсекания вместо округления
  return Math.trunc(scaled * factor) / factor;
}

// Ordinary numbers stay as they were. Bigger values print as 1.23e603.
export function formatNumber(rawNum, decimals = 2) {
  const num = rehydrateBig(rawNum);
  if (isBig(num)) {
    const exp = Math.floor(log10Of(num));
    const mantissa = Math.pow(10, log10Of(num) - exp);
    let shown = roundMantissa(mantissa, decimals);
    let outExp = exp;
    if (shown >= 1000) {
      shown /= 1000;
      outExp += 3;
    } else if (shown >= 10) {
      shown /= 10;
      outExp += 1;
    }
    return `${shown}e${outExp}`;
  }
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (!isFinite(num) || num >= 1.7976931348623157e308) return '1.79e308 (MAX)';
  if (num === 0) return '0';
  
  const abs = Math.abs(num);
  if (abs < 0.001) return '0';
 // if (abs < 1000) {
 //   if (Math.abs(num - Math.round(num)) < 1e-6) return String(Math.round(num));
 //   return Number(num.toFixed(1)).toString();
 // }
 if (abs < 1000) {
  if (Math.abs(num - Math.round(num)) < 1e-6) return String(Math.round(num));
  return String(Math.trunc(num * 10) / 10);
}

  const units = [
    'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
    'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod',
    'Vg'
  ];
  const exp = Math.floor(Math.log10(abs));
  let unitIndex = Math.floor(exp / 3) - 1;

  if (unitIndex >= 0 && unitIndex < units.length) {
    const sign = num < 0 ? -1 : 1;
    let scaled = sign * (abs / Math.pow(10, (unitIndex + 1) * 3));
    let shown = roundMantissa(scaled, decimals);
    if (Math.abs(shown) >= 1000) {
      if (unitIndex + 1 < units.length) {
        unitIndex += 1;
        scaled = sign * (abs / Math.pow(10, (unitIndex + 1) * 3));
        shown = roundMantissa(scaled, decimals);
      } else {
        return (sign * abs).toExponential(decimals).replace('+', '');
      }
    }
    return shown + units[unitIndex];
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
