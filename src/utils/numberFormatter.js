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
