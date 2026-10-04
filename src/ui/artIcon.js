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
  const scale = edge > 160 ? 160 / edge : 1;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const surface = document.createElement('canvas');
  surface.width = w;
  surface.height = h;
  const g = surface.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const image = g.getImageData(0, 0, w, h);
  const d = image.data;
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  const isField = (i) => {
    const o = i * 4;
    const r = d[o];
    const gc = d[o + 1];
    const b = d[o + 2];
    return gc < 120 && r > 130 && b > 70 && r > gc + 50 && b > gc + 20;
  };
  const push = (i) => {
    if (i < 0 || i >= seen.length || seen[i] || !isField(i)) return;
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
  g.putImageData(image, 0, 0);
  return surface;
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
