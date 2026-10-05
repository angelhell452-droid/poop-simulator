const HAT_ART = {
  hat_cap: 'assets/poop/props/hat-cap.png',
  hat_party: 'assets/poop/props/hat-party.png',
  hat_shades: 'assets/poop/props/hat-shades.png',
  hat_cowboy: 'assets/poop/props/hat-cowboy.png',
  hat_viking: 'assets/poop/props/hat-viking.png',
  hat_chef: 'assets/poop/props/hat-chef.png',
  hat_crown: 'assets/poop/props/hat-crown.png?v=cut5'
};

const cutCache = new Map();
const loading = new Map();
const fallbackHtml = new Map();
let fallbackSeq = 0;

function knifeArtSrc(knife) {
  if (!knife?.id || !String(knife.id).startsWith('knife_')) return '';
  const file = String(knife.id).replace('knife_', 'knife-').replaceAll('_', '-');
  return `assets/poop/props/${file}.png?v=cut5`;
}

function cutMagentaIcon(img) {
  const edge = Math.max(img.width, img.height);
  const scale = edge > 280 ? 280 / edge : 1;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const surface = document.createElement('canvas');
  surface.width = w;
  surface.height = h;
  const g = surface.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const image = g.getImageData(0, 0, w, h);
  const d = image.data;

  let sr = 0;
  let sg = 0;
  let sb = 0;
  let samples = 0;
  const sample = (i) => {
    const r = d[i * 4];
    const gc = d[i * 4 + 1];
    const b = d[i * 4 + 2];
    if (gc < 90 && r > 140 && r > gc + 80 && b > 20 && b < 170 && r > b + 40) {
      sr += r;
      sg += gc;
      sb += b;
      samples++;
    }
  };
  const step = Math.max(1, Math.floor(w / 40));
  for (let x = 0; x < w; x += step) {
    sample(x);
    sample((h - 1) * w + x);
  }
  for (let y = 0; y < h; y += step) {
    sample(y * w);
    sample(y * w + w - 1);
  }
  if (samples < 4) return surface;
  sr /= samples;
  sg /= samples;
  sb /= samples;

  const nearBackdrop = (i, reach) => {
    const o = i * 4;
    if (d[o + 3] === 0) return false;
    const dr = d[o] - sr;
    const dg = d[o + 1] - sg;
    const db = d[o + 2] - sb;
    return dr * dr + dg * dg + db * db <= reach && d[o + 1] < 110;
  };

  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  const fieldReach = 36 * 36;
  const push = (i) => {
    if (i < 0 || i >= seen.length || seen[i] || !nearBackdrop(i, fieldReach)) return;
    seen[i] = 1;
    stack[sp++] = i;
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (sp > 0) {
    const i = stack[--sp];
    d[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) push(i - 1);
    if (x + 1 < w) push(i + 1);
    if (y > 0) push(i - w);
    if (y + 1 < h) push(i + w);
  }
  for (let i = 0; i < w * h; i++) {
    if (nearBackdrop(i, fieldReach)) d[i * 4 + 3] = 0;
  }

  const fringeReach = 64 * 64;
  for (let pass = 0; pass < 4; pass++) {
    const kill = [];
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      if (d[o + 3] === 0 || d[o + 1] > 90) continue;
      const dr = d[o] - sr;
      const dg = d[o + 1] - sg;
      const db = d[o + 2] - sb;
      if (dr * dr + dg * dg + db * db > fringeReach) continue;
      const x = i % w;
      const y = (i / w) | 0;
      const touchesHole = (x === 0 || d[(i - 1) * 4 + 3] === 0)
        || (x + 1 === w || d[(i + 1) * 4 + 3] === 0)
        || (y === 0 || d[(i - w) * 4 + 3] === 0)
        || (y + 1 === h || d[(i + w) * 4 + 3] === 0);
      if (touchesHole) kill.push(i);
    }
    kill.forEach((i) => { d[i * 4 + 3] = 0; });
  }

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  g.putImageData(image, 0, 0);
  if (maxX < minX) return surface;
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cropped = document.createElement('canvas');
  cropped.width = maxX - minX + 1;
  cropped.height = maxY - minY + 1;
  cropped.getContext('2d').drawImage(surface, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  return cropped;
}

function paintIcon(el, canvas) {
  const size = Number.parseInt(el.style.width, 10) || 48;
  const view = document.createElement('canvas');
  view.width = size;
  view.height = size;
  const g = view.getContext('2d');
  const fit = Math.min(size / canvas.width, size / canvas.height);
  const dw = canvas.width * fit;
  const dh = canvas.height * fit;
  g.drawImage(canvas, (size - dw) / 2, (size - dh) / 2, dw, dh);
  el.replaceChildren(view);
  el.dataset.painted = '1';
}

function failIcon(el) {
  const html = fallbackHtml.get(Number(el.dataset.fb));
  fallbackHtml.delete(Number(el.dataset.fb));
  el.innerHTML = html || '';
  el.dataset.painted = '1';
}

function mountArtIcons() {
  document.querySelectorAll('.art-icon[data-art]').forEach((el) => {
    if (el.dataset.painted === '1' || el.dataset.queued === '1') return;
    const src = el.dataset.art;
    if (!src) return;
    el.dataset.queued = '1';
    const cached = cutCache.get(src);
    if (cached) {
      paintIcon(el, cached);
      return;
    }
    if (loading.has(src)) return;
    const img = new Image();
    loading.set(src, img);
    img.onload = () => {
      const cut = cutMagentaIcon(img);
      cutCache.set(src, cut);
      loading.delete(src);
      document.querySelectorAll('.art-icon[data-art]').forEach((node) => {
        if (node.dataset.art === src && node.dataset.painted !== '1') paintIcon(node, cut);
      });
    };
    img.onerror = () => {
      loading.delete(src);
      document.querySelectorAll('.art-icon[data-art]').forEach((node) => {
        if (node.dataset.art === src && node.dataset.painted !== '1') failIcon(node);
      });
    };
    img.src = src;
  });
}

export function artIconHtml(src, size, fallback) {
  fallbackSeq += 1;
  fallbackHtml.set(fallbackSeq, fallback || '');
  queueMicrotask(mountArtIcons);
  const safe = String(src).replace(/"/g, '');
  return `<span class="art-icon" data-art="${safe}" data-fb="${fallbackSeq}" style="width:${size}px;height:${size}px"></span>`;
}

export function knifeArtHtml(knife, size, fallback) {
  const src = knifeArtSrc(knife);
  if (!src) return fallback || '';
  return artIconHtml(src, size, fallback);
}

export function hatArtHtml(hat, size) {
  const src = hat && HAT_ART[hat.id];
  const emoji = `<span class="text-3xl">${hat?.icon || '🧢'}</span>`;
  if (!src) return emoji;
  return artIconHtml(src, size, emoji);
}
