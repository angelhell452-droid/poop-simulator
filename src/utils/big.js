// Values that fit in a JS number stay numbers, so epochs 1–40 match the old math.
// Past ~1e308 the value is { __big, m, e } meaning m * 10^e, with 1 <= m < 10.

const EXP_LIMIT = 1e15;

export function isBig(value) {
  return !!value && typeof value === 'object' && value.__big === true;
}

function normalize(mantissa, exponent) {
  if (!Number.isFinite(mantissa) || mantissa === 0) return 0;
  let m = mantissa;
  let e = exponent;
  if (m < 0) return 0;
  const shift = Math.floor(Math.log10(m));
  if (shift !== 0 && Number.isFinite(shift)) {
    m /= Math.pow(10, shift);
    e += shift;
  }
  if (!Number.isFinite(e) || e > EXP_LIMIT) return bigPow10(EXP_LIMIT);
  if (e < -8) return 0;
  if (e < 308 && m * Math.pow(10, e) < 1e308 && Number.isFinite(m * Math.pow(10, e))) {
    return m * Math.pow(10, e);
  }
  return { __big: true, m, e };
}

export function bigPow10(exponent) {
  const e = Math.floor(Number(exponent) || 0);
  if (e < 308) {
    const n = Math.pow(10, e);
    if (Number.isFinite(n)) return n;
  }
  if (e > EXP_LIMIT) return { __big: true, m: 1, e: EXP_LIMIT };
  return { __big: true, m: 1, e };
}

export function rehydrateBig(value) {
  if (isBig(value) && Number.isFinite(value.m) && Number.isFinite(value.e) && value.m > 0) {
    return normalize(value.m, value.e);
  }
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return n;
  return 0;
}

export function log10Of(value) {
  if (isBig(value)) return value.e + Math.log10(value.m);
  const n = Number(value) || 0;
  if (n <= 0) return -Infinity;
  return Math.log10(n);
}

export function cmp(a, b) {
  const left = rehydrateBig(a);
  const right = rehydrateBig(b);
  if (!isBig(left) && !isBig(right)) {
    if (left > right) return 1;
    if (left < right) return -1;
    return 0;
  }
  const d = log10Of(left) - log10Of(right);
  if (Math.abs(d) < 1e-9) return 0;
  return d > 0 ? 1 : -1;
}

export function gte(a, b) {
  return cmp(a, b) >= 0;
}

export function gt(a, b) {
  return cmp(a, b) > 0;
}

export function lt(a, b) {
  return cmp(a, b) < 0;
}

export function add(a, b) {
  const left = rehydrateBig(a);
  const right = rehydrateBig(b);
  if (!isBig(left) && !isBig(right)) {
    const sum = left + right;
    if (Number.isFinite(sum) && sum < 1e308) return sum < 0 ? 0 : sum;
  }
  if (cmp(left, 0) === 0) return right;
  if (cmp(right, 0) === 0) return left;
  const le = log10Of(left);
  const re = log10Of(right);
  if (le > re + 18) return left;
  if (re > le + 18) return right;
  const base = Math.max(le, re);
  const mantissa = Math.pow(10, le - base) + Math.pow(10, re - base);
  return normalize(mantissa, base);
}

export function sub(a, b) {
  const left = rehydrateBig(a);
  const right = rehydrateBig(b);
  if (!isBig(left) && !isBig(right)) {
    const diff = left - right;
    if (Number.isFinite(diff)) return diff < 0 ? 0 : diff;
  }
  if (cmp(right, left) >= 0) return 0;
  if (cmp(right, 0) === 0) return left;
  const le = log10Of(left);
  const re = log10Of(right);
  if (le > re + 18) return left;
  const base = le;
  const mantissa = 1 - Math.pow(10, re - base);
  return normalize(mantissa, base);
}

export function mul(a, b) {
  const left = rehydrateBig(a);
  const right = rehydrateBig(b);
  if (!isBig(left) && !isBig(right)) {
    const product = left * right;
    if (Number.isFinite(product) && product < 1e308) return product < 0 ? 0 : product;
  }
  if (cmp(left, 0) === 0 || cmp(right, 0) === 0) return 0;
  return normalize(1, log10Of(left) + log10Of(right));
}

export function div(a, b) {
  const left = rehydrateBig(a);
  const right = rehydrateBig(b);
  if (!isBig(right) && right === 0) return left;
  if (!isBig(left) && !isBig(right)) {
    const quote = left / right;
    if (Number.isFinite(quote) && quote < 1e308) return quote < 0 ? 0 : quote;
  }
  if (cmp(left, 0) === 0) return 0;
  return normalize(1, log10Of(left) - log10Of(right));
}

export function mulFloor(value, factor) {
  const out = mul(value, factor);
  if (isBig(out)) return out;
  return Math.max(1, Math.floor(out));
}

export function gainBio(current, amount) {
  return add(current || 0, amount || 0);
}

export function spendBio(current, amount) {
  return sub(current || 0, amount || 0);
}
