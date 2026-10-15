import { GAME } from '../core/state.js?v=5.4.29';
import { TALENTS } from '../data/talents.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.4.29';
import { hasPerk } from '../data/perks.data.js';
import {
  getClickPower,
  getPassiveIncome,
  getTurboClickMult,
  getKnifeFactorySynergyMult,
  getEquippedKnife,
  getKnifeStar
} from '../economy/production.js?v=5.4.29';
import { formatNumber } from '../utils/numberFormatter.js?v=5.4.29';
import { add, cmp, gainBio, gt, gte, isBig, mul } from '../utils/big.js?v=5.4.29';
import { checkAchievements } from '../systems/achievementsService.js?v=5.4.29';
import { updateHUD } from './hudView.js?v=5.4.29';
import { saveLocal } from '../save/saveManager.js?v=5.4.29';
import { requestCloudSync } from '../save/cloudSync.js?v=5.4.29';
import { events } from '../core/events.js';
import { getPhaseForStage } from '../progression/phases.data.js?v=5.4.29';
import { getMeteorSparkleGain, getSparkleEpochMult } from '../economy/sparkleScale.js?v=5.4.29';
import { ECONOMY } from '../economy/economy.config.js?v=5.4.29';
import { KNIVES } from '../data/knives.data.js?v=5.4.29';
import { findBodySkin, SKIN_FITTING } from '../data/skins.data.js?v=5.4.29';
import { t } from '../i18n/t.js';
import { getRelicLevel, hasRelic } from '../data/relics.data.js?v=5.4.29';
import { executeTimeWarp } from './vipShopView.js?v=5.4.29';
import { AVAILABLE_KNIFE_ART } from '../data/availableKnifeArt.data.js';

let canvas = null;
let ctx = null;
let squashX = 1, squashY = 1;
let blinkTimer = 0;
let knifeSlashTimer = 0;
let knifeStrikeStart = 0;
const KNIFE_STRIKE_MS = 170;
export const visualParticles = [];
export const sparkParticles = [];
let pendingAutoEarned = 0;
let pendingAutoCrits = 0;
let pendingAutoSparkles = 0;
let lastFloatingTextTime = 0;
/** Autoclick earn popups: was 200ms — after Big fix real numbers made that feel like blinking. */
const AUTO_FLOAT_MS = 550;
let activeAutoEarnParticle = null;
let activeAutoSparkleParticle = null;

export let goldenMeteor = {
  active: false,
  x: -50,
  y: 100,
  vx: 0,
  vy: 0,
  radius: 24,
  life: 0,
  rotation: 0
};
let nextMeteorSpawn = Date.now() + 25000;
const showerMeteors = [];
let showerUntil = 0;
let showerNextSpawn = 0;
const SHOWER_CHANCE = 0.18;
const SHOWER_MS = 12000;

/**
 * Мягкая пульсация (Scale Bump) кошелька Блестяшек в верхнем HUD при прилете искр
 */
export function triggerSparklesBalanceBump() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('sparklesBalance') || document.getElementById('topSparkles')?.parentElement;
  if (!el) return;
  el.classList.remove('sparkle-bump');
  void el.offsetWidth;
  el.classList.add('sparkle-bump');
}

/**
 * Эффект Магнитных Искр:
 * Микровзрыв из 12-15 мелких золотых светящихся искр в точке звезды,
 * которые по красивой дуге с ускорением (ease-in) улетают прямо в #sparklesBalance.
 */
export function spawnMagneticSparkleTrail(canvasX, canvasY) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const cvs = canvas || document.getElementById('petCanvas');
  const rect = cvs ? cvs.getBoundingClientRect() : null;
  const scaleX = (cvs && cvs.width > 0 && rect) ? (rect.width / cvs.width) : 1;
  const scaleY = (cvs && cvs.height > 0 && rect) ? (rect.height / cvs.height) : 1;

  const startX = rect ? (rect.left + canvasX * scaleX) : (window.innerWidth / 2);
  const startY = rect ? (rect.top + canvasY * scaleY) : (window.innerHeight * 0.35);

  const targetEl = document.getElementById('sparklesBalance') || document.getElementById('topSparkles');
  let targetX = window.innerWidth / 2;
  let targetY = 32;
  if (targetEl) {
    const tRect = targetEl.getBoundingClientRect();
    targetX = tRect.left + tRect.width / 2;
    targetY = tRect.top + tRect.height / 2;
  }

  const sparkCount = 14;
  let arrivedCount = 0;

  for (let i = 0; i < sparkCount; i++) {
    const spark = document.createElement('div');
    spark.className = 'vip-magnetic-spark';
    const size = Math.round(5 + Math.random() * 4);
    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;

    // Начальный микровзрыв: радиальный разлет
    const burstAngle = (Math.PI * 2 / sparkCount) * i + (Math.random() - 0.5) * 0.45;
    const burstDist = 20 + Math.random() * 38;
    const burstX = startX + Math.cos(burstAngle) * burstDist;
    const burstY = startY + Math.sin(burstAngle) * burstDist;

    // Контрольная точка изгиба дуги Безье
    const arcSide = (i % 2 === 0 ? 1 : -1) * (35 + Math.random() * 55);
    const ctrlX = (burstX + targetX) / 2 + arcSide;
    const ctrlY = Math.min(burstY, targetY) - (20 + Math.random() * 35);

    spark.style.transform = `translate3d(${burstX}px, ${burstY}px, 0)`;
    document.body.appendChild(spark);

    const duration = 500 + Math.random() * 200;
    const delay = Math.random() * 50;
    const startTime = performance.now() + delay;

    function step(now) {
      if (now < startTime) {
        requestAnimationFrame(step);
        return;
      }
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // Ускорение притяжения (ease-in квадратичный)
      const easeT = t * t;

      // Квадратичная кривая Безье к кошельку Блестяшек
      const inv = 1 - easeT;
      const curX = inv * inv * burstX + 2 * inv * easeT * ctrlX + easeT * easeT * targetX;
      const curY = inv * inv * burstY + 2 * inv * easeT * ctrlY + easeT * easeT * targetY;

      const scale = 1 - easeT * 0.4;
      const opacity = t > 0.82 ? ((1 - t) / 0.18) : 1;

      spark.style.transform = `translate3d(${curX}px, ${curY}px, 0) scale(${scale})`;
      spark.style.opacity = `${opacity}`;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        if (spark.parentNode) {
          spark.parentNode.removeChild(spark);
        }
        arrivedCount++;
        // Толчок кошелька при прилете первой и последующих искр
        if (arrivedCount === 1 || arrivedCount === Math.floor(sparkCount / 2)) {
          triggerSparklesBalanceBump();
        }
      }
    }

    requestAnimationFrame(step);
  }
}

/**
 * Sparkle purse for a meteor. The frontier epoch sets the size: the open pair
 * after a flush still counts, and the current epoch can only raise it.
 * Walking through that epoch adds up to half again. Flushes add a soft bonus.
 */
export function meteorSparkleProfile(evoStage, transcends, flushes) {
  const phase = getPhaseForStage(evoStage || 0);
  // Только текущая эпоха формы — не maxUnlockedForm (после BT метеор иначе брал epoch 4+ уже на форме 1–500).
  const phaseId = phase.id;
  const span = Math.max(1, phase.formEnd - phase.formStart);
  const local = Math.min(1, Math.max(0, ((evoStage || 0) + 1 - phase.formStart) / span));
  const epochMult = getSparkleEpochMult(phaseId);
  const purse = typeof epochMult === 'number'
    ? ECONOMY.meteorPurseBase * epochMult
    : mul(ECONOMY.meteorPurseBase, epochMult);
  const localMult = 1 + local * ECONOMY.meteorEpochWalk;
  const flushBonus = 1 + ((flushes || 0) / ((flushes || 0) + 20)) * ECONOMY.meteorFlushCap;
  return { phaseId, purse, localMult, flushBonus };
}

function meteorTalentSparkle() {
  const meteorBonus = TALENTS.find(t => t.id === 'talent_meteor_bonus')?.level || 0;
  const luck = Math.min(20, GAME.boutiqueLevels?.golden_luck || 0);
  const storm = GAME.transcendUpgrades?.meteorStorm || 0;
  const stacked = meteorBonus * 0.05 + luck * 0.03 + storm * 0.05;
  return 1 + stacked;
}
function scheduleNextMeteor(extraMs = 0) {
  const spawnTalent = TALENTS.find(t => t.id === 'talent_meteor_spawn')?.level || 0;
  const spawnScale = 1 / (1 + spawnTalent * 0.05);
  const catcherScale = (hasPerk('perk_meteor_catcher') || hasPerk('upg_meteor_magnet')) ? 0.85 : 1;
  const magnet = SHOP_ITEMS.find(i => i.id === 'upg_meteor_magnet')?.owned ? 0.6 : 1;
  const base = 40000 + Math.random() * 35000 + extraMs;
  let delay = Math.max(12000, base * spawnScale * magnet * catcherScale);
  if (getKnifeFactorySynergyMult() <= 0.10) {
    // Аварийный буст при штрафе: частота метеоритов временно увеличивается до 1 раза в 45 сек
    delay = Math.min(delay, 45000);
  }
  nextMeteorSpawn = Date.now() + delay;
}
let listenersInitialized = false;

const boyLook = { open: null, blink: null };
const girlLook = { open: null, blink: null };
const robeBoyLook = { open: null, blink: null };
const robeGirlLook = { open: null, blink: null };
const hoodieBoyLook = { open: null, blink: null };
const hoodieGirlLook = { open: null, blink: null };
const tunicBoyLook = { open: null, blink: null };
const tunicGirlLook = { open: null, blink: null };
const tuxedoBoyLook = { open: null, blink: null };
const tuxedoGirlLook = { open: null, blink: null };
const bodyLooks = {
  skin_robe: {
    boy: { key: 'robe-boy', look: robeBoyLook },
    girl: { key: 'robe-girl', look: robeGirlLook }
  },
  skin_hoodie: {
    boy: { key: 'hoodie-boy', look: hoodieBoyLook },
    girl: { key: 'hoodie-girl', look: hoodieGirlLook }
  },
  skin_tunic: {
    boy: { key: 'tunic-boy', look: tunicBoyLook },
    girl: { key: 'tunic-girl', look: tunicGirlLook }
  },
  skin_tuxedo: {
    boy: { key: 'tuxedo-boy', look: tuxedoBoyLook },
    girl: { key: 'tuxedo-girl', look: tuxedoGirlLook }
  }
};
const propLooks = {
  chef: null, cap: null, party: null, shades: null, cowboy: null, viking: null, crown: null
};
const clayKnifeOrder = KNIVES.map(knife => ({
  id: knife.id,
  key: knife.id
}));
const clayKnives = Object.fromEntries(clayKnifeOrder.map(knife => [knife.id, knife.key]));
const clayHats = {
  hat_chef: { key: 'chef', x: 4, h: 64, overlap: 28 },
  hat_cap: { key: 'cap', x: 0, h: 62, overlap: 50 },
  hat_party: { key: 'party', x: 4, xSkin: -2, h: 74, overlap: 32 },
  hat_shades: { key: 'shades', x: 0, h: 32, face: 0.52, faceSkin: 0.38 },
  hat_cowboy: { key: 'cowboy', x: 0, h: 78, overlap: 74 },
  hat_viking: { key: 'viking', x: 0, h: 92, overlap: 60 },
  hat_crown: { key: 'crown', x: 0, h: 92, overlap: 55 }
};
const epochBackgrounds = [null];

function fitForCut(img, maxEdge) {
  const edge = Math.max(img.width, img.height);
  if (edge <= maxEdge) return img;
  const scale = maxEdge / edge;
  const fitted = document.createElement('canvas');
  fitted.width = Math.max(1, Math.round(img.width * scale));
  fitted.height = Math.max(1, Math.round(img.height * scale));
  const g = fitted.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, fitted.width, fitted.height);
  return fitted;
}

function cutSpriteBackdrop(img, options = {}) {
  img = fitForCut(img, options.maxEdge ?? 720);
  const maxSpread = options.maxSpread ?? 14;
  const keepWarm = options.keepWarm !== false;
  const neutral = options.neutral === true;
  const w = img.width;
  const h = img.height;
  const surface = document.createElement('canvas');
  surface.width = w;
  surface.height = h;
  const g = surface.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const image = g.getImageData(0, 0, w, h);
  const d = image.data;
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  const prepared = options.prepared === true;
  const isBackdrop = (i) => {
    const o = i * 4;
    if (d[o + 3] < 16) return true;
    if (prepared) return false;
    const r = d[o];
    const gc = d[o + 1];
    const b = d[o + 2];
    const spread = Math.max(r, gc, b) - Math.min(r, gc, b);
    // The girl file sits on a noisy checker. Gray noise goes, pink skin stays, so the soft edge is not shaved off.
    if (neutral) {
      return Math.abs(r - gc) <= 22 && Math.abs(gc - b) <= 26 && Math.abs(r - b) <= 30 && r < gc + 26;
    }
    if (spread > maxSpread) return false;
    // The boy bow is warm white, so slightly warm grays stay.
    if (keepWarm && gc + 1 < r) return false;
    return true;
  };
  const push = (i) => {
    if (i < 0 || i >= seen.length || seen[i] || !isBackdrop(i)) return;
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
  if (neutral) {
    const keepSkin = (r, gc) => r > gc + 28 && r > 110;
    for (let pass = 0; pass < 16; pass++) {
      const kill = [];
      for (let i = 0; i < w * h; i++) {
        if (d[i * 4 + 3] < 16) continue;
        if (keepSkin(d[i * 4], d[i * 4 + 1])) continue;
        const x = i % w;
        const y = (i / w) | 0;
        let touch = x === 0 || y === 0 || x === w - 1 || y === h - 1;
        if (!touch && x > 0 && d[(i - 1) * 4 + 3] < 16) touch = true;
        if (!touch && x + 1 < w && d[(i + 1) * 4 + 3] < 16) touch = true;
        if (!touch && y > 0 && d[(i - w) * 4 + 3] < 16) touch = true;
        if (!touch && y + 1 < h && d[(i + w) * 4 + 3] < 16) touch = true;
        if (touch) kill.push(i);
      }
      if (!kill.length) break;
      for (let k = 0; k < kill.length; k++) d[kill[k] * 4 + 3] = 0;
    }
  }
  const seenBlob = new Uint8Array(w * h);
  const blobStack = new Int32Array(w * h);
  const labels = new Int32Array(w * h);
  let bestCount = 0;
  let bestId = 0;
  let blobId = 0;
  for (let start = 0; start < w * h; start++) {
    if (seenBlob[start] || d[start * 4 + 3] < 16) continue;
    blobId++;
    let spBlob = 0;
    let count = 0;
    seenBlob[start] = 1;
    blobStack[spBlob++] = start;
    while (spBlob > 0) {
      const i = blobStack[--spBlob];
      labels[i] = blobId;
      count++;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0 && !seenBlob[i - 1] && d[(i - 1) * 4 + 3] >= 16) {
        seenBlob[i - 1] = 1;
        blobStack[spBlob++] = i - 1;
      }
      if (x + 1 < w && !seenBlob[i + 1] && d[(i + 1) * 4 + 3] >= 16) {
        seenBlob[i + 1] = 1;
        blobStack[spBlob++] = i + 1;
      }
      if (y > 0 && !seenBlob[i - w] && d[(i - w) * 4 + 3] >= 16) {
        seenBlob[i - w] = 1;
        blobStack[spBlob++] = i - w;
      }
      if (y + 1 < h && !seenBlob[i + w] && d[(i + w) * 4 + 3] >= 16) {
        seenBlob[i + w] = 1;
        blobStack[spBlob++] = i + w;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestId = blobId;
    }
  }
  if (!prepared && bestId) {
    for (let i = 0; i < w * h; i++) {
      if (labels[i] !== bestId) d[i * 4 + 3] = 0;
    }
  }
  g.putImageData(image, 0, 0);
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < w * h; i++) {
    if (d[i * 4 + 3] < 16) continue;
    const x = i % w;
    const y = (i / w) | 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (maxX < minX || maxY < minY) {
    return { canvas: surface, sx: 0, sy: 0, sw: w, sh: h, glow: null };
  }
  const sw = maxX - minX + 1;
  const sh = maxY - minY + 1;
  const tight = document.createElement('canvas');
  tight.width = sw;
  tight.height = sh;
  tight.getContext('2d').drawImage(surface, minX, minY, sw, sh, 0, 0, sw, sh);
  const glow = document.createElement('canvas');
  glow.width = sw;
  glow.height = sh;
  const glowCtx = glow.getContext('2d');
  glowCtx.drawImage(tight, 0, 0);
  glowCtx.globalCompositeOperation = 'source-in';
  glowCtx.fillStyle = '#fde047';
  glowCtx.fillRect(0, 0, sw, sh);
  return { canvas: tight, sx: 0, sy: 0, sw, sh, glow };
}

function cutMagentaBackdrop(img, options = {}) {
  img = fitForCut(img, options.maxEdge ?? 512);
  const w = img.width;
  const h = img.height;
  const surface = document.createElement('canvas');
  surface.width = w;
  surface.height = h;
  const g = surface.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const image = g.getImageData(0, 0, w, h);
  const d = image.data;
  let backdropR = 0;
  let backdropG = 0;
  let backdropB = 0;
  let backdropSamples = 0;
  const backdropPoints = [
    [2, 2], [w >> 1, 2], [w - 3, 2],
    [2, h >> 1], [w - 3, h >> 1],
    [2, h - 3], [w >> 1, h - 3], [w - 3, h - 3]
  ];
  for (let s = 0; s < backdropPoints.length; s++) {
    const x = Math.max(0, Math.min(w - 1, backdropPoints[s][0]));
    const y = Math.max(0, Math.min(h - 1, backdropPoints[s][1]));
    const o = (y * w + x) * 4;
    const r = d[o];
    const gc = d[o + 1];
    const b = d[o + 2];
    if (r > 120 && r > gc + 40 && b > gc + 15) {
      backdropR += r;
      backdropG += gc;
      backdropB += b;
      backdropSamples++;
    }
  }
  if (backdropSamples) {
    backdropR /= backdropSamples;
    backdropG /= backdropSamples;
    backdropB /= backdropSamples;
  }
  const colorDist = (r, gc, b) => Math.max(
    Math.abs(r - backdropR),
    Math.abs(gc - backdropG),
    Math.abs(b - backdropB)
  );
  const edgeJump = (x, y) => {
    const o = (y * w + x) * 4;
    const r = d[o];
    const gc = d[o + 1];
    const b = d[o + 2];
    let best = 0;
    const look = (nx, ny) => {
      const n = (ny * w + nx) * 4;
      const jump = Math.max(Math.abs(r - d[n]), Math.abs(gc - d[n + 1]), Math.abs(b - d[n + 2]));
      if (jump > best) best = jump;
    };
    if (x > 0) look(x - 1, y);
    if (x + 1 < w) look(x + 1, y);
    if (y > 0) look(x, y - 1);
    if (y + 1 < h) look(x, y + 1);
    return best;
  };
  const isField = (r, gc, b) => {
    if (!backdropSamples) return gc < 80 && r > 140 && b > 70 && r > gc + 80 && b > gc + 40;
    const dist = colorDist(r, gc, b);
    if (dist <= 16) return true;
    return r >= backdropR - 6 && gc >= backdropG - 4 && b >= backdropB - 6
      && dist <= 50 && gc < 105 && b < backdropB + 36 && r < backdropR + 28;
  };
  const isGlow = (x, y, r, gc, b) => {
    if (!backdropSamples || x <= 0 || y <= 0 || x >= w - 1 || y >= h - 1) return false;
    const dist = colorDist(r, gc, b);
    if (!(r >= backdropR - 4 && gc >= backdropG + 8 && b >= backdropB - 10 && b <= backdropB + 18 && gc < 190 && dist <= 140)) return false;
    return edgeJump(x, y) <= 24;
  };
  const isBlueFringe = (r, gc, b) => backdropSamples
    && gc < 48 && b > backdropB + 16 && b < backdropB + 110
    && r > backdropR - 45 && r < backdropR + 50;
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  const pushField = (i) => {
    if (i < 0 || i >= seen.length || seen[i]) return;
    const x = i % w;
    const y = (i / w) | 0;
    const o = i * 4;
    if (!isField(d[o], d[o + 1], d[o + 2]) && !isGlow(x, y, d[o], d[o + 1], d[o + 2])) return;
    seen[i] = 1;
    stack[sp++] = i;
  };
  for (let x = 0; x < w; x++) {
    pushField(x);
    pushField((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    pushField(y * w);
    pushField(y * w + w - 1);
  }
  while (sp > 0) {
    const i = stack[--sp];
    d[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) pushField(i - 1);
    if (x + 1 < w) pushField(i + 1);
    if (y > 0) pushField(i - w);
    if (y + 1 < h) pushField(i + w);
  }
  const pushBlue = (i) => {
    if (i < 0 || i >= seen.length || seen[i]) return;
    const o = i * 4;
    if (!isBlueFringe(d[o], d[o + 1], d[o + 2])) return;
    seen[i] = 1;
    stack[sp++] = i;
  };
  sp = 0;
  for (let i = 0; i < w * h; i++) {
    if (d[i * 4 + 3] >= 16) continue;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) pushBlue(i - 1);
    if (x + 1 < w) pushBlue(i + 1);
    if (y > 0) pushBlue(i - w);
    if (y + 1 < h) pushBlue(i + w);
  }
  while (sp > 0) {
    const i = stack[--sp];
    d[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) pushBlue(i - 1);
    if (x + 1 < w) pushBlue(i + 1);
    if (y > 0) pushBlue(i - w);
    if (y + 1 < h) pushBlue(i + w);
  }
  if (backdropSamples) {
    const isMagentaSpeck = (r, gc, b) => gc < 30 && r > 150 && b > 40 && r > gc + 100;
    const pushSpeck = (i) => {
      if (i < 0 || i >= seen.length || seen[i]) return;
      const o = i * 4;
      if (!isMagentaSpeck(d[o], d[o + 1], d[o + 2])) return;
      seen[i] = 1;
      stack[sp++] = i;
    };
    sp = 0;
    for (let i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] >= 16) continue;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0) pushSpeck(i - 1);
      if (x + 1 < w) pushSpeck(i + 1);
      if (y > 0) pushSpeck(i - w);
      if (y + 1 < h) pushSpeck(i + w);
    }
    while (sp > 0) {
      const i = stack[--sp];
      d[i * 4 + 3] = 0;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0) pushSpeck(i - 1);
      if (x + 1 < w) pushSpeck(i + 1);
      if (y > 0) pushSpeck(i - w);
      if (y + 1 < h) pushSpeck(i + w);
    }
  }
  if (options.celestial && backdropSamples) {
    const isCelestialHalo = (r, gc, b) => {
      if (r <= 120 || gc >= 188) return false;
      if (b <= gc + 18) return false;
      if (b > 148) return true;
      return gc < 110 && b > backdropB + 10 && r > b - 50;
    };
    const pushHalo = (i) => {
      if (i < 0 || i >= seen.length || seen[i]) return;
      const o = i * 4;
      if (!isCelestialHalo(d[o], d[o + 1], d[o + 2])) return;
      seen[i] = 1;
      stack[sp++] = i;
    };
    sp = 0;
    for (let i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] >= 16) continue;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0) pushHalo(i - 1);
      if (x + 1 < w) pushHalo(i + 1);
      if (y > 0) pushHalo(i - w);
      if (y + 1 < h) pushHalo(i + w);
    }
    while (sp > 0) {
      const i = stack[--sp];
      d[i * 4 + 3] = 0;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0) pushHalo(i - 1);
      if (x + 1 < w) pushHalo(i + 1);
      if (y > 0) pushHalo(i - w);
      if (y + 1 < h) pushHalo(i + w);
    }
  }
  if (backdropSamples && (options.goldHalo || options.voidHalo || options.neonHalo)) {
    const isSeriesHalo = (r, gc, b) => {
      if (options.goldHalo) return r > 145 && gc < 125 && b < 145 && r > gc + 45;
      if (options.voidHalo) return gc < 45 && r > 140 && b < backdropB + 50 && r > gc + 60;
      return r > 130 && gc < 110 && b < 170 && r > b && r > gc + 28;
    };
    const pushSeries = (i) => {
      if (i < 0 || i >= seen.length || seen[i]) return;
      const o = i * 4;
      if (!isSeriesHalo(d[o], d[o + 1], d[o + 2])) return;
      seen[i] = 1;
      stack[sp++] = i;
    };
    sp = 0;
    for (let i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] >= 16) continue;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0) pushSeries(i - 1);
      if (x + 1 < w) pushSeries(i + 1);
      if (y > 0) pushSeries(i - w);
      if (y + 1 < h) pushSeries(i + w);
    }
    while (sp > 0) {
      const i = stack[--sp];
      d[i * 4 + 3] = 0;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0) pushSeries(i - 1);
      if (x + 1 < w) pushSeries(i + 1);
      if (y > 0) pushSeries(i - w);
      if (y + 1 < h) pushSeries(i + w);
    }
  }
  const clearEnclosed = (match, protect) => {
    const mark = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (mark[i] || d[i * 4 + 3] < 16 || !match(i)) continue;
      let sp2 = 0;
      const comp = [];
      let open = false;
      let warm = false;
      mark[i] = 1;
      stack[sp2++] = i;
      while (sp2 > 0) {
        const c = stack[--sp2];
        comp.push(c);
        if (comp.length > 18000) {
          warm = true;
          break;
        }
        const x = c % w;
        const y = (c / w) | 0;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) open = true;
        const next = [];
        if (x > 0) next.push(c - 1);
        if (x + 1 < w) next.push(c + 1);
        if (y > 0) next.push(c - w);
        if (y + 1 < h) next.push(c + w);
        for (let k = 0; k < next.length; k++) {
          const j = next[k];
          if (mark[j] || d[j * 4 + 3] < 16) continue;
          if (!match(j)) {
            if (protect && protect(j)) warm = true;
            continue;
          }
          mark[j] = 1;
          stack[sp2++] = j;
        }
      }
      if (!open && !warm) {
        for (let k = 0; k < comp.length; k++) d[comp[k] * 4 + 3] = 0;
      }
    }
  };
  if (backdropSamples) {
    clearEnclosed((i) => {
      const o = i * 4;
      return colorDist(d[o], d[o + 1], d[o + 2]) <= 8;
    });
    clearEnclosed(
      (i) => {
        const o = i * 4;
        return isBlueFringe(d[o], d[o + 1], d[o + 2]);
      },
      (i) => {
        const o = i * 4;
        return d[o + 1] > 110 && d[o] > 140;
      }
    );
  }
  g.putImageData(image, 0, 0);
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < w * h; i++) {
    if (d[i * 4 + 3] < 16) continue;
    const x = i % w;
    const y = (i / w) | 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (maxX < minX || maxY < minY) {
    return { canvas: surface, sx: 0, sy: 0, sw: w, sh: h, fist: null };
  }
  const sw = maxX - minX + 1;
  const sh = maxY - minY + 1;
  const tight = document.createElement('canvas');
  tight.width = sw;
  tight.height = sh;
  tight.getContext('2d').drawImage(surface, minX, minY, sw, sh, 0, 0, sw, sh);
  return {
    canvas: tight,
    sx: 0,
    sy: 0,
    sw,
    sh,
    fist: options.glove ? measureGlove(d, w, h, minX, minY) : null
  };
}

function measureGlove(d, w, h, cropX, cropY) {
  const count = w * h;
  const cream = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    if (d[o + 3] < 16) continue;
    const r = d[o];
    const gc = d[o + 1];
    const b = d[o + 2];
    if (r >= 168 && gc >= 140 && b >= 110 && r >= gc && gc + 8 >= b && (r - b) <= 75 && (r - gc) <= 48) {
      cream[i] = 1;
    }
  }
  const seen = new Uint8Array(count);
  const stack = new Int32Array(count);
  let best = 0;
  let box = null;
  for (let i = 0; i < count; i++) {
    if (!cream[i] || seen[i]) continue;
    let sp = 0;
    stack[sp++] = i;
    seen[i] = 1;
    let area = 0;
    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;
    while (sp > 0) {
      const p = stack[--sp];
      const x = p % w;
      const y = (p / w) | 0;
      area++;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
      if (x > 0 && cream[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack[sp++] = p - 1; }
      if (x + 1 < w && cream[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack[sp++] = p + 1; }
      if (y > 0 && cream[p - w] && !seen[p - w]) { seen[p - w] = 1; stack[sp++] = p - w; }
      if (y + 1 < h && cream[p + w] && !seen[p + w]) { seen[p + w] = 1; stack[sp++] = p + w; }
    }
    if (area > best) {
      best = area;
      box = { x: x0 - cropX, y: y0 - cropY, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    }
  }
  const areaScale = (w * h) / (1024 * 1024);
  return best > 8000 * areaScale ? box : null;
}

function fistCenter(placed) {
  return {
    x: placed.x + placed.destW * 0.87,
    y: placed.y + placed.destH * 0.71,
    h: placed.destH * 0.15
  };
}

function knifeStrike() {
  if (knifeSlashTimer <= 0) return { angle: 0, lunge: 0, slash: 0 };
  const p = Math.min(1, (performance.now() - knifeStrikeStart) / KNIFE_STRIKE_MS);
  if (p < 0.28) {
    const windup = p / 0.28;
    return { angle: -0.4 * Math.sin(windup * Math.PI / 2), lunge: 0, slash: 0 };
  }
  if (p < 0.55) {
    const swing = (p - 0.28) / 0.27;
    return {
      angle: -0.4 + swing * 0.95,
      lunge: Math.sin(swing * Math.PI),
      slash: swing
    };
  }
  const settle = (p - 0.55) / 0.45;
  const ease = (1 - settle) * (1 - settle);
  return { angle: 0.55 * ease, lunge: 0, slash: 0 };
}

const artJobs = [];
const artCuts = [];
const artSeen = new Set();
let artInflight = 0;
let artCutting = false;
let sceneKnown = false;
let bootArmed = false;
let bootFinished = false;
const bootNeed = new Set();
let finishBoot = null;

function queueArt(id, src, apply, priority) {
  const waiting = artJobs.find(job => job.id === id);
  if (waiting && priority < waiting.priority) waiting.priority = priority;
  const cutting = artCuts.find(job => job.id === id);
  if (cutting && priority < cutting.priority) cutting.priority = priority;
  if (artSeen.has(id)) return;
  artSeen.add(id);
  artJobs.push({ id, src, apply, priority });
  pumpArt();
}

function pumpArt() {
  while (artInflight < 2 && artJobs.length) {
    artJobs.sort((a, b) => a.priority - b.priority);
    const job = artJobs.shift();
    artInflight++;
    const img = new Image();
    img.onload = () => {
      artInflight--;
      artCuts.push({ ...job, img });
      pumpArt();
      pumpCuts();
    };
    img.onerror = () => {
      artInflight--;
      bootArrive(job.id);
      pumpArt();
    };
    img.src = job.src;
  }
}

function pumpCuts() {
  if (artCutting || !artCuts.length) return;
  artCutting = true;
  artCuts.sort((a, b) => a.priority - b.priority);
  const job = artCuts.shift();
  try {
    job.apply(job.img);
  } catch (err) {
    console.warn(err);
  }
  bootArrive(job.id);
  setTimeout(() => {
    artCutting = false;
    pumpCuts();
  }, 0);
}

function bootArrive(id) {
  bootNeed.delete(id);
  if (bootArmed && bootNeed.size === 0) finishBoot?.();
}

function knifeCutOptions(id) {
  const cut = { glove: true, maxEdge: 512 };
  if (id.startsWith('knife_celestial_')) cut.celestial = true;
  if (id === 'knife_godly_katana' || id === 'knife_godly_omega' || id === 'knife_celestial_karambit') cut.goldHalo = true;
  if (id === 'knife_godly_scythe' || id === 'knife_godly_eclipse') cut.voidHalo = true;
  if (id.startsWith('knife_titanium_')) cut.neonHalo = true;
  return cut;
}

function queueProp(key, src, options, priority) {
  queueArt(key, src, (img) => {
    propLooks[key] = cutMagentaBackdrop(img, options);
  }, priority);
}

function queueKnife(id, priority) {
  const file = id.replace('knife_', 'knife-').replaceAll('_', '-');
  if (!AVAILABLE_KNIFE_ART.has(file)) return;
  queueProp(id, `assets/poop/props/${file}.png?v=cut5`, knifeCutOptions(id), priority);
}

function queueEpoch(index, priority) {
  const file = String(index + 1).padStart(2, '0');
  queueArt(`epoch-${index}`, `assets/backgrounds/epoch-${file}.png`, (img) => {
    epochBackgrounds[index] = img;
  }, priority);
}

function queueLook(prefix, look, openSrc, blinkSrc, options, priority) {
  const apply = (img) => {
    const frame = cutSpriteBackdrop(img, options);
    if (options.foot != null) frame.foot = options.foot;
    return frame;
  };
  queueArt(`${prefix}-open`, openSrc, (img) => {
    look.open = apply(img);
  }, priority);
  queueArt(`${prefix}-blink`, blinkSrc, (img) => {
    look.blink = apply(img);
  }, priority + 1);
}

const hatFiles = {
  chef: 'assets/poop/props/hat-chef.png',
  cap: 'assets/poop/props/hat-cap.png',
  party: 'assets/poop/props/hat-party.png',
  shades: 'assets/poop/props/hat-shades.png',
  cowboy: 'assets/poop/props/hat-cowboy.png',
  viking: 'assets/poop/props/hat-viking.png',
  crown: 'assets/poop/props/hat-crown.png?v=cut5'
};

function equippedBodyArt(isGirly) {
  const skin = findBodySkin(GAME.equippedSkin);
  if (!skin) return null;
  if (!Array.isArray(GAME.ownedSkins) || !GAME.ownedSkins.includes(skin.id)) {
    if (!SKIN_FITTING) return null;
  }
  const pair = bodyLooks[skin.id];
  return pair ? (isGirly ? pair.girl : pair.boy) : null;
}

function visibleArtIds() {
  const isGirly = !!(GAME.girlyMode || GAME.gameMode === 'girls');
  const body = equippedBodyArt(isGirly);
  const look = body ? body.look : (isGirly ? girlLook : boyLook);
  const prefix = body ? body.key : (isGirly ? 'girl' : 'boy');
  const epoch = Math.max(0, Math.floor((GAME.evoStage || 0) / 500)) % 40;
  const hat = clayHats[GAME.equippedHat];
  const knife = getEquippedKnife();
  return {
    lookId: look.open ? null : `${prefix}-open`,
    epochId: epochBackgrounds[epoch] ? null : `epoch-${epoch}`,
    epoch,
    hatId: hat && !propLooks[hat.key] ? hat.key : null,
    knifeId: knife && !propLooks[knife.id] ? knife.id : null
  };
}

function ensureVisibleArt() {
  if (!sceneKnown) return;
  const need = visibleArtIds();
  if (need.epochId) queueEpoch(need.epoch, 0);
  if (need.hatId) queueProp(need.hatId, hatFiles[need.hatId], { maxEdge: 512 }, 0);
  if (need.knifeId) queueKnife(need.knifeId, 0);
}

export function warmSceneArt() {
  sceneKnown = true;
  const isGirly = !!(GAME.girlyMode || GAME.gameMode === 'girls');
  const active = artJobs.find(job => job.id === `${isGirly ? 'girl' : 'boy'}-open`);
  if (active) active.priority = 0;
  const need = visibleArtIds();
  for (const id of [need.lookId, need.epochId, need.hatId, need.knifeId]) {
    if (id) bootNeed.add(id);
  }
  ensureVisibleArt();
  for (const [key, src] of Object.entries(hatFiles)) queueProp(key, src, { maxEdge: 512 }, 2);
  bootArmed = true;
  return new Promise((resolve) => {
    finishBoot = () => {
      if (bootFinished) return;
      bootFinished = true;
      const veil = document.getElementById('bootVeil');
      if (veil) {
        veil.setAttribute('hidden', '');
        veil.style.display = 'none';
      }
      resolve();
    };
    if (bootNeed.size === 0) finishBoot();
    setTimeout(finishBoot, 8000);
  });
}

function drawProp(ctx, frame, x, y, destH) {
  const destW = destH * (frame.sw / frame.sh);
  ctx.drawImage(frame.canvas, frame.sx, frame.sy, frame.sw, frame.sh, x - destW / 2, y, destW, destH);
}

function drawClayKnife(ctx, frame, fistCenterX, fistCenterY, fistH) {
  const fist = frame.fist;
  if (!fist || fist.h < 8) {
    drawProp(ctx, frame, fistCenterX, fistCenterY - fistH / 2, fistH);
    return;
  }
  const scale = fistH / fist.h;
  const fx = fist.x + fist.w / 2;
  const fy = fist.y + fist.h / 2;
  ctx.drawImage(
    frame.canvas,
    frame.sx, frame.sy, frame.sw, frame.sh,
    fistCenterX - fx * scale,
    fistCenterY - fy * scale,
    frame.sw * scale,
    frame.sh * scale
  );
}

function drawCoverImage(ctx, img, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function characterDest(frame) {
  const destH = 168;
  const destW = destH * (frame.sw / frame.sh);
  const foot = frame.foot == null ? 62 : frame.foot;
  return { destW, destH, x: -destW / 2, y: foot - destH };
}

function drawCharacterFrame(ctx, frame, layoutFrame = frame) {
  const box = characterDest(layoutFrame);
  ctx.drawImage(
    frame.canvas,
    frame.sx, frame.sy, frame.sw, frame.sh,
    box.x, box.y, box.destW, box.destH
  );
}

function drawCharacterGlow(ctx, frame, alpha, layoutFrame = frame) {
  if (!frame.glow) return;
  const box = characterDest(layoutFrame);
  // Thin rim only — wide blur used to wash the whole poop yellow.
  const pulse = 0.97 + Math.sin(performance.now() * 0.0012) * 0.03;
  const paint = (pad, blur, strength) => {
    ctx.save();
    ctx.filter = `blur(${blur}px)`;
    ctx.globalAlpha = Math.min(0.45, alpha * pulse * strength);
    ctx.drawImage(frame.glow, box.x - pad, box.y - pad, box.destW + pad * 2, box.destH + pad * 2);
    ctx.restore();
  };
  paint(10, 6, 0.55);
  paint(4, 2, 0.35);
}

export function initPetCanvas() {
  canvas = document.getElementById('petCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  queueLook('boy', boyLook, 'assets/poop/boy.png', 'assets/poop/boy-blink.png?v=5.4.4m', { maxEdge: 720 }, 1);
  queueLook('girl', girlLook, 'assets/poop/girl.png?v=5.0', 'assets/poop/girl-blink.png?v=5.4.4m', { neutral: true, maxEdge: 720 }, 1);
  queueLook('robe-boy', robeBoyLook, 'assets/poop/skins/robe-boy.png?v=5.4.4h', 'assets/poop/skins/robe-boy-blink.png?v=5.4.4l', { maxEdge: 720, prepared: true }, 2);
  queueLook('robe-girl', robeGirlLook, 'assets/poop/skins/robe-girl.png?v=5.4.4h', 'assets/poop/skins/robe-girl-blink.png?v=5.4.4l', { maxEdge: 720, prepared: true }, 2);
  queueLook('hoodie-boy', hoodieBoyLook, 'assets/poop/skins/hoodie-boy.png?v=5.4.4m', 'assets/poop/skins/hoodie-boy-blink.png?v=5.4.4m', { maxEdge: 720, prepared: true }, 2);
  queueLook('hoodie-girl', hoodieGirlLook, 'assets/poop/skins/hoodie-girl.png?v=5.4.4m', 'assets/poop/skins/hoodie-girl-blink.png?v=5.4.4m', { maxEdge: 720, prepared: true }, 2);
  queueLook('tunic-boy', tunicBoyLook, 'assets/poop/skins/tunic-boy.png?v=5.4.4m', 'assets/poop/skins/tunic-boy-blink.png?v=5.4.4m', { maxEdge: 720, prepared: true }, 2);
  queueLook('tunic-girl', tunicGirlLook, 'assets/poop/skins/tunic-girl.png?v=5.4.4m', 'assets/poop/skins/tunic-girl-blink.png?v=5.4.4m', { maxEdge: 720, prepared: true }, 2);
  queueLook('tuxedo-boy', tuxedoBoyLook, 'assets/poop/skins/tuxedo-boy.png?v=5.4.4m', 'assets/poop/skins/tuxedo-boy-blink.png?v=5.4.4m', { maxEdge: 720, prepared: true }, 2);
  queueLook('tuxedo-girl', tuxedoGirlLook, 'assets/poop/skins/tuxedo-girl.png?v=5.4.4m', 'assets/poop/skins/tuxedo-girl-blink.png?v=5.4.4m', { maxEdge: 720, prepared: true }, 2);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  if (!listenersInitialized) {
    listenersInitialized = true;
    events.on('click:processed', (res) => {
      // Big objects break JS `<=` / `>` / `+=` — use big.js helpers only.
      if (!res || !gt(res.totalEarned, 0)) return;

      const isManual = !!res.isManual;
      const { clicks, totalEarned, sparklesEarned, critsCount, clientX, clientY } = res;

      const w = canvas ? canvas.width : 360;
      const h = canvas ? canvas.height : 480;

      let clickX = (clientX !== null && clientX !== undefined && canvas) 
        ? (clientX - canvas.getBoundingClientRect().left) 
        : (w / 2 + (Math.random() * 40 - 20));
      let clickY = (clientY !== null && clientY !== undefined && canvas) 
        ? (clientY - canvas.getBoundingClientRect().top) 
        : (h * 0.46 + (Math.random() * 30 - 15));

      // 1. Lightweight atmospheric spark burst (max 3 circles, zero lag)
      const sparkCount = Math.min(3, Math.max(1, Math.floor(clicks / 3) || 1));
      for (let s = 0; s < sparkCount; s++) {
        if (sparkParticles.length < 16) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 1.0 + Math.random() * 2.2;
          sparkParticles.push({
            x: clickX + (Math.random() * 16 - 8),
            y: clickY + (Math.random() * 16 - 8),
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 1.2,
            r: Math.random() * 2.5 + 1.5,
            color: critsCount > 0 ? '#f59e0b' : (isManual ? '#4ade80' : '#38bdf8'),
            life: 0.55
          });
        }
      }

      // 2. Discrete Floating Labels (Max 4, short format only, NO infinite stack)
      const now = performance.now();
      if (isManual) {
        if (critsCount > 0) {
          addManagedTextParticle({
            x: clickX,
            y: clickY,
            vx: (Math.random() - 0.5) * 1.4,
            vy: -2.2,
            text: t('canvas.critEarn', { n: formatNumber(totalEarned) }),
            color: '#facc15',
            scale: 1.35,
            life: 0.85
          });
        } else {
          addManagedTextParticle({
            x: clickX,
            y: clickY,
            vx: (Math.random() - 0.5) * 1.0,
            vy: -1.9,
            text: t('canvas.earn', { n: formatNumber(totalEarned) }),
            color: '#4ade80',
            scale: 1.15,
            life: 0.80
          });
        }

        if (gt(sparklesEarned, 0)) {
          addManagedTextParticle({
            x: clickX + (Math.random() * 30 - 15),
            y: clickY - 14,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -2.4,
            text: t('canvas.sparkles', { n: formatNumber(sparklesEarned) }),
            color: '#fde047',
            scale: 1.2,
            life: 0.85
          });
        }
      } else {
        // Autoclicker: accumulate Big-safe, refresh one floating label (no spam/blink)
        pendingAutoEarned = add(pendingAutoEarned, totalEarned);
        pendingAutoCrits += critsCount;
        pendingAutoSparkles = add(pendingAutoSparkles, sparklesEarned || 0);

        if (now - lastFloatingTextTime >= AUTO_FLOAT_MS) {
          const spawnX = w / 2 + (Math.random() * 36 - 18);
          const spawnY = h * 0.44 + (Math.random() * 20 - 10);
          const earnText = pendingAutoCrits > 0
            ? t('canvas.critEarn', { n: formatNumber(pendingAutoEarned) })
            : t('canvas.earn', { n: formatNumber(pendingAutoEarned) });
          const earnColor = pendingAutoCrits > 0 ? '#facc15' : '#38bdf8';

          const earnAlive = activeAutoEarnParticle
            && activeAutoEarnParticle.life > 0.12
            && visualParticles.includes(activeAutoEarnParticle);
          if (earnAlive) {
            activeAutoEarnParticle.text = earnText;
            activeAutoEarnParticle.color = earnColor;
            activeAutoEarnParticle.life = Math.min(1.15, activeAutoEarnParticle.life + 0.35);
            activeAutoEarnParticle.scale = pendingAutoCrits > 0 ? 1.35 : 1.15;
          } else {
            activeAutoEarnParticle = {
              x: spawnX,
              y: spawnY,
              vx: (Math.random() - 0.5) * 0.7,
              vy: pendingAutoCrits > 0 ? -2.1 : -1.7,
              text: earnText,
              color: earnColor,
              scale: pendingAutoCrits > 0 ? 1.35 : 1.15,
              life: 1.05
            };
            addManagedTextParticle(activeAutoEarnParticle);
          }

          if (gt(pendingAutoSparkles, 0)) {
            const spText = t('canvas.sparkles', { n: formatNumber(pendingAutoSparkles) });
            const spAlive = activeAutoSparkleParticle
              && activeAutoSparkleParticle.life > 0.12
              && visualParticles.includes(activeAutoSparkleParticle);
            if (spAlive) {
              activeAutoSparkleParticle.text = spText;
              activeAutoSparkleParticle.life = Math.min(1.15, activeAutoSparkleParticle.life + 0.3);
            } else {
              activeAutoSparkleParticle = {
                x: spawnX + (Math.random() * 24 - 12),
                y: spawnY - 12,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -2.2,
                text: spText,
                color: '#fde047',
                scale: 1.15,
                life: 1.0
              };
              addManagedTextParticle(activeAutoSparkleParticle);
            }
          }

          pendingAutoEarned = 0;
          pendingAutoCrits = 0;
          pendingAutoSparkles = 0;
          lastFloatingTextTime = now;
        }
      }
    });

    events.on('turbo:activated', () => {
      addVisualParticle(t('canvas.turboActivated', { x: formatNumber(10) }), '#ef4444', 1.5, 1.2, -2.5);
    });
  }

  requestAnimationFrame(renderPetLoop);
}

export function resizeCanvas() {
  if (!canvas || !canvas.parentElement) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}

export function triggerPetSquash(sx = 1.25, sy = 0.8) {
  squashX = sx;
  squashY = sy;
  if (knifeSlashTimer <= 0) {
    knifeSlashTimer = 1;
    knifeStrikeStart = performance.now();
  }
}

export function addManagedTextParticle(p) {
  while (visualParticles.length >= 7) {
    visualParticles.shift();
  }
  visualParticles.push(p);
}

export function addVisualParticle(text, color = '#facc15', scale = 1.2, life = 1.0, vy = -2.2, x = null, y = null) {
  if (typeof document === 'undefined') return;
  if (!canvas) canvas = document.getElementById('petCanvas');
  if (!canvas) return;
  const w = canvas.width || 360;
  const h = canvas.height || 480;
  addManagedTextParticle({
    x: (x !== null && x !== undefined && !isNaN(x)) ? x : (w / 2 + (Math.random() * 40 - 20)),
    y: (y !== null && y !== undefined && !isNaN(y)) ? y : (h * 0.45),
    vx: (Math.random() - 0.5) * 0.8,
    vy: vy || -2.0,
    text,
    color,
    scale,
    life
  });
}

function renderPetLoop(time) {
  if (!canvas || !ctx) return;
  try {
    const w = canvas.width;
    const h = canvas.height;
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  const isGirly = !!(GAME.girlyMode || GAME.gameMode === 'girls');

  const epochIndex = Math.max(0, Math.floor((GAME.evoStage || 0) / 500)) % 40;
  const epochBg = epochBackgrounds[epochIndex];

  // Painted epoch scene. Until the picture arrives, the canvas stays the garden color.
  if (epochBg) {
    drawCoverImage(ctx, epochBg, w, h);
  } else {
    ctx.fillStyle = '#121816';
    ctx.fillRect(0, 0, w, h);
  }

  // Adaptive base scale for smaller screens (mobile / tablet)
  const baseScale = Math.min(1.0, Math.max(0.68, Math.min(w / 380, h / 360)));
  const toiletBaseW = 170 * baseScale;
  const toiletCenterY = h * 0.77;

  if (epochBg) {
    ctx.save();
    ctx.translate(w / 2, toiletCenterY + 10 * baseScale);
    const shadow = ctx.createRadialGradient(0, 0, 10 * baseScale, 0, 0, toiletBaseW * 0.7);
    shadow.addColorStop(0, 'rgba(12, 62, 74, 0.22)');
    shadow.addColorStop(1, 'rgba(12, 62, 74, 0)');
    ctx.scale(1, 0.38);
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(0, 0, toiletBaseW * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Smooth Jelly Spring
  squashX += (1 - squashX) * 0.12;
  squashY += (1 - squashY) * 0.12;

  ctx.save();
  ctx.translate(w / 2, toiletCenterY - 45 * baseScale);
  ctx.scale(squashX * baseScale, squashY * baseScale);

  blinkTimer += 0.016;
  const isBlinking = (blinkTimer % 4.0) < 0.15;
  const body = equippedBodyArt(isGirly);
  const baseLook = isGirly ? girlLook : boyLook;
  const look = (body && body.look.open) ? body.look : baseLook;
  // Layout always from open eyes — blink crop differs and used to jump hat/knife off for a frame.
  const layoutFrame = look.open || null;
  const characterFrame = layoutFrame
    ? ((isBlinking && look.blink) ? look.blink : layoutFrame)
    : null;
  ensureVisibleArt();

  // Ideal = soft golden rim. Meteor star turbo = brief bump.
  // turboRush stays off — autoclicker kept it forever and washed the sprite.
  const isIdealPet = (GAME.hunger >= 90 && GAME.clean >= 90 && GAME.happy >= 90);
  const starTurbo = (GAME.turboStarMultTime || 0) > 0;
  if (characterFrame && layoutFrame && (isIdealPet || starTurbo)) {
    drawCharacterGlow(ctx, characterFrame, starTurbo ? 0.32 : 0.18, layoutFrame);
  }
  if (characterFrame && layoutFrame) {
    drawCharacterFrame(ctx, characterFrame, layoutFrame);
  }

  const placed = layoutFrame ? characterDest(layoutFrame) : null;
  const clayHat = layoutFrame ? clayHats[GAME.equippedHat] : null;
  if (clayHat && propLooks[clayHat.key] && placed) {
    const skinOn = !!(body && body.look.open);
    const face = skinOn && clayHat.faceSkin != null ? clayHat.faceSkin : clayHat.face;
    const hatTop = face != null
      ? placed.y + placed.destH * face
      : placed.y - clayHat.h + clayHat.overlap;
    const hatX = skinOn && clayHat.xSkin != null ? clayHat.xSkin : clayHat.x;
    drawProp(ctx, propLooks[clayHat.key], hatX, hatTop, clayHat.h);
  } else if (layoutFrame && GAME.equippedHat && !clayHats[GAME.equippedHat]) {
    drawEquippedHat(ctx, GAME.equippedHat, time, isGirly);
  }

  const knife = getEquippedKnife();
  const clayKnifeKey = knife && clayKnives[knife.id];
  if (layoutFrame && placed && clayKnifeKey && propLooks[clayKnifeKey]) {
    const fist = fistCenter(placed);
    const strike = knifeStrike();
    ctx.save();
    ctx.translate(fist.x, fist.y);
    ctx.rotate(strike.angle);
    if (strike.slash > 0.25) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(142, 224, 192, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.arc(0, 0, fist.h * 0.95, -0.15, 0.55, false);
      ctx.stroke();
    }
    ctx.translate(strike.lunge * fist.h * 0.35, 0);
    drawClayKnife(ctx, propLooks[clayKnifeKey], 0, 0, fist.h);
    ctx.restore();
    if (knifeSlashTimer > 0 && performance.now() - knifeStrikeStart >= KNIFE_STRIKE_MS) {
      knifeSlashTimer = 0;
    }
  }

  ctx.restore();

  // RENDER GOLDEN METEOR
  if (goldenMeteor.active) {
    if (GAME.vipPass || GAME.hasVipPass) {
      catchGoldenMeteor();
    } else {
      goldenMeteor.x += goldenMeteor.vx;
      goldenMeteor.y += goldenMeteor.vy;
      goldenMeteor.rotation += 0.04;
      goldenMeteor.life--;

      if (goldenMeteor.life <= 0 || goldenMeteor.x < -60 || goldenMeteor.x > w + 60 || goldenMeteor.y < -60 || goldenMeteor.y > h + 60) {
        goldenMeteor.active = false;
        scheduleNextMeteor();
      } else {
      ctx.save();
      ctx.translate(goldenMeteor.x, goldenMeteor.y);
      ctx.rotate(goldenMeteor.rotation);

      const glowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, goldenMeteor.radius + 14);
      glowGrad.addColorStop(0, 'rgba(250, 204, 21, 0.95)');
      glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.55)');
      glowGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, goldenMeteor.radius + 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌟', 0, 0);
      ctx.restore();
    }
  }
} else {
  // При активном штрафе ножа ограничиваем время ожидания прилета метеорита до максимум 45 секунд
    if (getKnifeFactorySynergyMult() <= 0.10 && nextMeteorSpawn > Date.now() + 45000) {
      nextMeteorSpawn = Date.now() + 45000;
    }
    if (Date.now() > nextMeteorSpawn) {
      goldenMeteor.active = true;
      goldenMeteor.life = 750;
      const fromLeft = Math.random() < 0.5;
      goldenMeteor.x = fromLeft ? -30 : w + 30;
      goldenMeteor.y = 80 + Math.random() * Math.max(120, h * 0.6);
      goldenMeteor.vx = (fromLeft ? 1 : -1) * (1.1 + Math.random() * 0.9);
      goldenMeteor.vy = (Math.random() - 0.5) * 0.8;
    }
  }

  tickMeteorShower(ctx, w, h);

  // 1. Lightweight atmospheric spark particles (fast circle batch, zero font cost)
  if (sparkParticles.length > 0) {
    for (let i = sparkParticles.length - 1; i >= 0; i--) {
      const sp = sparkParticles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.life -= 0.025;
      if (sp.life <= 0) {
        sparkParticles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, sp.life);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r || 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Must reset — otherwise next frame draws the pet at leftover spark alpha.
    ctx.globalAlpha = 1;
  }

  // 2. High-performance Floating text particles (Max 4, pre-set font outside loop!)
  if (visualParticles.length > 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 16px Nunito, sans-serif';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';

    for (let i = visualParticles.length - 1; i >= 0; i--) {
      const p = visualParticles[i];
      p.x += (p.vx || 0);
      p.y += p.vy;
      p.vy *= 0.98;
      p.life -= 0.016;

      if (p.life <= 0) {
        visualParticles.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, Math.min(1, p.life));
      ctx.globalAlpha = alpha;

      if (p.scale && Math.abs(p.scale - 1) > 0.05) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.scale, p.scale);
        ctx.strokeText(p.text, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
      } else {
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
      }
    }
    ctx.globalAlpha = 1;
  }
  } catch (err) {
    console.error("renderPetLoop error:", err);
  } finally {
    requestAnimationFrame(renderPetLoop);
  }
}

export function autoCollectVipMeteors() {
  const isVip = Boolean(GAME.vipPass || GAME.hasVipPass);
  if (!isVip) return;

  if (goldenMeteor.active) {
    catchGoldenMeteor();
  }
  while (showerMeteors.length > 0) {
    catchShowerMeteor(0);
  }
}

export function triggerForcedMeteor() {
  nextMeteorSpawn = Date.now() - 1;
  goldenMeteor.active = false;
}

export function catchGoldenMeteor() {
  const w = canvas?.width || 360;
  const h = canvas?.height || 480;
  const spawnX = (goldenMeteor.x > 0 && goldenMeteor.x < w) ? goldenMeteor.x : (w / 2);
  const spawnY = (goldenMeteor.y > 0 && goldenMeteor.y < h) ? goldenMeteor.y : (h * 0.35);
  goldenMeteor.active = false;
  if (!GAME.stats || typeof GAME.stats !== 'object') {
    GAME.stats = { totalMeteorsCaught: 0 };
  }
  GAME.stats.totalMeteorsCaught = (Number(GAME.stats.totalMeteorsCaught) || 0) + 1;
  GAME.meteorsCaught = GAME.stats.totalMeteorsCaught;
  events.emit('stats:meteorCaught', { total: GAME.stats.totalMeteorsCaught });

  const hunterTalent = TALENTS.find(t => t.id === 'meteor_hunter');
  const luckBonus = 1 + Math.min(20, GAME.boutiqueLevels?.golden_luck || 0) * 0.25;
  const hunterBonus = 1 + (hunterTalent ? hunterTalent.level * 0.20 : 0);
  const catcherBonus = (hasPerk('perk_meteor_catcher') || hasPerk('upg_meteor_magnet')) ? 1.25 : 1;
  const lootMult = hunterBonus * luckBonus * catcherBonus;

  // perk_sparkle_magnet: на 15 сек +5% крит шанса автокликеру
  if (hasPerk('perk_sparkle_magnet') || hasPerk('upg_magnet')) {
    GAME.sparkleMagnetUntil = Date.now() + 15000;
  }

  // Гарантия ✨: ~8–15 крит-пачек того же ножа (для всех; VIP только автосбор).
  const eqKnife = getEquippedKnife();
  const knifeStar = eqKnife ? getKnifeStar(eqKnife.id) : 1;
  let spGain = getMeteorSparkleGain(eqKnife, knifeStar, {
    lootMult,
    talentMult: meteorTalentSparkle(),
    shower: false
  });
  const tripleTalent = TALENTS.find(t => t.id === 'talent_meteor_triple');
  const tripleChance = tripleTalent ? tripleTalent.level * 0.001 : 0;
  let isTriple = false;
  if (tripleChance > 0 && Math.random() < tripleChance) {
    spGain = mul(spGain, 3);
    isTriple = true;
    addVisualParticle('✨ ЗОЛОТАЯ ИСКРА x3! ✨', '#fde047', 1.8, 2.5, -2.8);
  }
  GAME.sparkles = gainBio(GAME.sparkles, spGain);

  // ВТОРИЧНЫЙ СУПЕР-БОНУС МЕТЕОРИТА
  const roll = Math.random();
  let bonusLabel = '';
  if (roll < 0.35) {
    GAME.turboStarMultTime = 12;
    if ((GAME.turboRushTime || 0) <= 0) {
      GAME.comboHeat = 100;
      GAME.turboRushTime = 12;
    }
    bonusLabel = t('canvas.meteorStarTurbo', { n: formatNumber(getTurboClickMult()) });
  } else if (roll < 0.70) {
    const burst = mul(cmp(mul(2500, getClickPower()), mul(getPassiveIncome(), 1200)) >= 0 ? mul(2500, getClickPower()) : mul(getPassiveIncome(), 1200), lootMult);
    GAME.biomass = gainBio(GAME.biomass, burst);
    GAME.allTimeBiomass = gainBio(GAME.allTimeBiomass, burst);
    GAME.cycleBiomass = gainBio(GAME.cycleBiomass, burst);
    bonusLabel = t('canvas.meteorGoldBurst', { n: formatNumber(burst) });
  } else if (roll < 0.85) {
    const rollMultiplier = 1 + Math.min(1.5, (GAME.totalPrestiges || 0) * 0.02) + Math.min(1.5, (GAME.totalTranscend || 0) * 0.12);
    const rollGain = Math.max(1, Math.min(3, Math.round((1 + Math.random()) * rollMultiplier * Math.min(1.5, lootMult))));
    GAME.prestigeRolls = gainBio(GAME.prestigeRolls, rollGain);
    bonusLabel = t('canvas.meteorSacredRoll', { n: formatNumber(rollGain) });
  } else {
    // Джекпот: дополнительные x2 Блестяшек!
    GAME.sparkles = gainBio(GAME.sparkles, spGain);
    spGain = mul(spGain, 2);
    bonusLabel = '✨ МЕТЕОРИТНЫЙ ДЖЕКПОТ x2! ✨';
  }

  const sparkleLabel = t('canvas.meteorSparkleRain', { n: formatNumber(spGain) });
  addVisualParticle(sparkleLabel, '#facc15', 1.6, 2.2, -2.5);
  if (bonusLabel) {
    addVisualParticle(bonusLabel, '#fde047', 1.4, 2.0, -1.8);
  }

  // VIP Визуализация автосбора метеорита (Эффект Магнитных Искр в #sparklesBalance)
  if (Boolean(GAME.vipPass || GAME.hasVipPass)) {
    GAME.vipCollectedSparkles = gainBio(GAME.vipCollectedSparkles, spGain);
    spawnMagneticSparkleTrail(spawnX, spawnY);
  }

  // relic_quantum_meteor: шанс дать бесплатный 2-часовой Варп биомассы (+0.5% за ур, до 4% на макс ур)
  const quantumLvl = getRelicLevel('relic_quantum_meteor');
  if (quantumLvl > 0 && Math.random() < quantumLvl * 0.005) {
    executeTimeWarp(2, true);
    addVisualParticle('🌌 КВАНТОВЫЙ ВАРП (2ч)! 🌌', '#c084fc', 1.8, 2.5, -2.8);
  }

  // relic_meteor_progression_skip: +0.25%/lvl шанс мгновенно дать ~+20 уровней опыта Прорыва
  const skipLvl = getRelicLevel('relic_meteor_progression_skip');
  if (skipLvl > 0 && Math.random() < skipLvl * 0.0025) {
    const cur = GAME.lifetimeBiomassInCurrentCycle || 1;
    const addBio = mul(cur, Math.pow(31.62, 0.2));
    GAME.biomass = gainBio(GAME.biomass, addBio);
    GAME.lifetimeBiomassInCurrentCycle = gainBio(GAME.lifetimeBiomassInCurrentCycle, addBio);
    GAME.breakthroughProgress = GAME.lifetimeBiomassInCurrentCycle;
    addVisualParticle('⚡ ГАЛАКТИЧЕСКИЙ ШТОРМ (+20 УР)! ⚡', '#38bdf8', 1.8, 2.5, -2.8);
  }

  scheduleNextMeteor();

  // relic_double_meteors: Метеориты всегда прилетают строго по два
  if (hasRelic('relic_double_meteors')) {
    setTimeout(() => {
      triggerForcedMeteor();
    }, 450);
  } else if (hasPerk('perk_meteor_echo') && Math.random() < 0.15) {
    // perk_meteor_echo: 15% шанс на мгновенный спавн второго Метеорита
    setTimeout(() => {
      triggerForcedMeteor();
      addVisualParticle('☄️ МЕТЕОРИТНОЕ ЭХО! ☄️', '#38bdf8', 1.8, 2.5, -2.8);
    }, 400);
  }

  if (Date.now() >= showerUntil && Math.random() < SHOWER_CHANCE) {
    startMeteorShower();
  }

  checkAchievements();
  updateHUD();
  saveLocal();
  requestCloudSync(2500);
}

export function checkMeteorClick(clientX, clientY) {
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  const clickX = clientX - rect.left;
  const clickY = clientY - rect.top;

  const magnetLvl = TALENTS.find(t => t.id === 'talent_meteor_magnet')?.level || 0;
  const hitboxMult = 1 + magnetLvl * 0.10;
  let nearestShower = -1;
  let nearestDist = Infinity;
  showerMeteors.forEach((meteor, index) => {
    const dist = Math.hypot(clickX - meteor.x, clickY - meteor.y);
    if (dist < (meteor.radius + 14) * hitboxMult && dist < nearestDist) {
      nearestDist = dist;
      nearestShower = index;
    }
  });

  if (goldenMeteor.active) {
    const goldenDist = Math.hypot(clickX - goldenMeteor.x, clickY - goldenMeteor.y);
    if (goldenDist < (goldenMeteor.radius + 18) * hitboxMult && goldenDist <= nearestDist) {
      catchGoldenMeteor();
      return true;
    }
  }

  if (nearestShower >= 0) {
    catchShowerMeteor(nearestShower);
    return true;
  }
  return false;
}

function startMeteorShower() {
  showerUntil = Date.now() + SHOWER_MS;
  showerNextSpawn = Date.now();
  addVisualParticle(t('canvas.meteorShowerStart'), '#67e8f9', 1.5, 2.2, -2.2);
}

function tickMeteorShower(drawCtx, w, h) {
  const now = Date.now();
  if (now < showerUntil && now >= showerNextSpawn && showerMeteors.length < 5) {
    const fromLeft = Math.random() < 0.5;
    showerMeteors.push({
      x: fromLeft ? -20 : w + 20,
      y: 36 + Math.random() * Math.max(80, h * 0.7),
      vx: (fromLeft ? 1 : -1) * (1.7 + Math.random() * 1.1),
      vy: (Math.random() - 0.5) * 0.7,
      radius: 16,
      life: 380,
      rotation: Math.random() * Math.PI
    });
    showerNextSpawn = now + 850;
  }

  // Omnivorous VIP auto-collector: auto-catches all shower / small / event stars instantly!
  if (Boolean(GAME.vipPass || GAME.hasVipPass)) {
    while (showerMeteors.length > 0) {
      catchShowerMeteor(0);
    }
    return;
  }

  const magnetLvl = TALENTS.find(t => t.id === 'talent_meteor_magnet')?.level || 0;
  for (let i = showerMeteors.length - 1; i >= 0; i--) {
    const meteor = showerMeteors[i];
    if (magnetLvl > 0) {
      meteor.vx += ((w / 2) - meteor.x) * 0.0004 * magnetLvl;
      meteor.vy += ((h / 2) - meteor.y) * 0.0004 * magnetLvl;
    }
    meteor.x += meteor.vx;
    meteor.y += meteor.vy;
    meteor.rotation += 0.08;
    meteor.life--;
    if (meteor.life <= 0 || meteor.x < -50 || meteor.x > w + 50 || meteor.y < -50 || meteor.y > h + 50) {
      showerMeteors.splice(i, 1);
      continue;
    }
    drawCtx.save();
    drawCtx.translate(meteor.x, meteor.y);
    drawCtx.rotate(meteor.rotation);
    drawCtx.font = '22px sans-serif';
    drawCtx.textAlign = 'center';
    drawCtx.textBaseline = 'middle';
    drawCtx.fillText('⭐', 0, 0);
    drawCtx.restore();
  }
}

export function catchShowerMeteor(index) {
  const m = showerMeteors[index];
  if (!m) return;
  const w = canvas?.width || 360;
  const h = canvas?.height || 480;
  const mx = (m.x > 0 && m.x < w) ? m.x : (w / 2);
  const my = (m.y > 0 && m.y < h) ? m.y : (h * 0.35);
  showerMeteors.splice(index, 1);
  if (!GAME.stats || typeof GAME.stats !== 'object') {
    GAME.stats = { totalMeteorsCaught: 0 };
  }
  GAME.stats.totalMeteorsCaught = (Number(GAME.stats.totalMeteorsCaught) || 0) + 1;
  GAME.meteorsCaught = GAME.stats.totalMeteorsCaught;
  events.emit('stats:meteorCaught', { total: GAME.stats.totalMeteorsCaught });
  const eqKnife = getEquippedKnife();
  const knifeStar = eqKnife ? getKnifeStar(eqKnife.id) : 1;
  let sparkGain = getMeteorSparkleGain(eqKnife, knifeStar, {
    lootMult: 1,
    talentMult: meteorTalentSparkle(),
    shower: true
  });

  const tripleTalent = TALENTS.find(t => t.id === 'talent_meteor_triple');
  const tripleChance = tripleTalent ? tripleTalent.level * 0.001 : 0;
  const isTriple = tripleChance > 0 && Math.random() < tripleChance;
  if (isTriple) {
    sparkGain = mul(sparkGain, 3);
    addVisualParticle('✨ ЗОЛОТАЯ ИСКРА x3! ✨', '#fde047', 1.8, 2.5, -2.8);
  }

  GAME.sparkles = gainBio(GAME.sparkles, sparkGain);
  addVisualParticle(t('canvas.meteorShowerCatch', { n: formatNumber(sparkGain) }), '#fde68a', 1.05);

  // VIP Визуализация автосбора звездопада (Эффект Магнитных Искр в #sparklesBalance)
  if (Boolean(GAME.vipPass || GAME.hasVipPass)) {
    GAME.vipCollectedSparkles = gainBio(GAME.vipCollectedSparkles, sparkGain);
    spawnMagneticSparkleTrail(mx, my);
  }
  checkAchievements();
  updateHUD();
  saveLocal();
}

// DRAW EQUIPPED WARDROBE HATS WITH RICH PROCEDURAL CANVAS VECTORS
function drawEquippedHat(ctx, hatId, time, isGirly) {
  if (!hatId) return;
  ctx.save();

  if (hatId === 'hat_cap') {
    // 🧢 Кепка Новичка (Baseball cap with visor)
    ctx.translate(0, -48);
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(0, -2, 17, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Top button
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Visor bill
    ctx.fillStyle = '#1e40af';
    ctx.beginPath();
    ctx.moveTo(4, -2);
    ctx.quadraticCurveTo(28, -6, 26, 3);
    ctx.lineTo(10, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  } else if (hatId === 'hat_party') {
    // 🥳 Праздничный Колпак (Party Cone)
    ctx.translate(0, -50);
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(0, -32);
    ctx.lineTo(13, 0);
    ctx.closePath();
    const partyGrad = ctx.createLinearGradient(-13, 0, 13, -32);
    partyGrad.addColorStop(0, '#ec4899');
    partyGrad.addColorStop(0.33, '#facc15');
    partyGrad.addColorStop(0.66, '#06b6d4');
    partyGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = partyGrad;
    ctx.fill();
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Pom-pom on tip
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, -34, 4.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (hatId === 'hat_shades') {
    // 🕶️ Крутые Очки Thug Life (Sunglasses over eyes)
    ctx.translate(0, -6);
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-24, -5, 20, 11);
    ctx.fillRect(4, -5, 20, 11);
    ctx.fillRect(-4, -2, 8, 3);
    ctx.strokeRect(-24, -5, 20, 11);
    ctx.strokeRect(4, -5, 20, 11);
    // Glare shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-20, -3); ctx.lineTo(-14, 4); ctx.lineTo(-12, 4); ctx.lineTo(-18, -3);
    ctx.moveTo(8, -3); ctx.lineTo(14, 4); ctx.lineTo(16, 4); ctx.lineTo(10, -3);
    ctx.fill();

  } else if (hatId === 'hat_cowboy') {
    // 🤠 Ковбойская Шляпа Шерифа (Stetson cowboy hat)
    ctx.translate(0, -46);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, 1, 33, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(-15, 1);
    ctx.lineTo(-13, -18);
    ctx.quadraticCurveTo(0, -14, 13, -18);
    ctx.lineTo(15, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-14, -2, 28, 3.5);
    ctx.beginPath();
    ctx.arc(0, -0.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (hatId === 'hat_viking') {
    // 🪖 Шлем Викинга-Берсерка (Steel helm with horns)
    ctx.translate(0, -46);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.quadraticCurveTo(-30, -10, -29, -28);
    ctx.quadraticCurveTo(-22, -18, -13, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(15, -4);
    ctx.quadraticCurveTo(30, -10, 29, -28);
    ctx.quadraticCurveTo(22, -18, 13, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const ironGrad = ctx.createLinearGradient(-18, -14, 18, 0);
    ironGrad.addColorStop(0, '#64748b');
    ironGrad.addColorStop(0.5, '#94a3b8');
    ironGrad.addColorStop(1, '#475569');
    ctx.fillStyle = ironGrad;
    ctx.beginPath();
    ctx.arc(0, -2, 17, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-2.5, -18, 5, 17);

  } else if (hatId === 'hat_chef') {
    // 👨‍🍳 Колпак Шеф-Повара Мишлен (Toque)
    ctx.translate(0, -48);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-15, -4, 30, 8);
    ctx.strokeRect(-15, -4, 30, 8);
    ctx.beginPath();
    ctx.arc(-11, -16, 11, 0, Math.PI * 2);
    ctx.arc(0, -21, 13, 0, Math.PI * 2);
    ctx.arc(11, -16, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

  } else if (hatId === 'hat_crown') {
    // 👑 Корона Императора Унитаза (Royal golden crown)
    ctx.translate(0, -48);
    const crownGrad = ctx.createLinearGradient(-22, -22, 22, 0);
    crownGrad.addColorStop(0, '#fde047');
    crownGrad.addColorStop(0.5, '#eab308');
    crownGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = crownGrad;
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-22, -18);
    ctx.lineTo(-11, -7);
    ctx.lineTo(0, -24);
    ctx.lineTo(11, -7);
    ctx.lineTo(22, -18);
    ctx.lineTo(22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(0, -9, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath(); ctx.arc(-11, -2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(11, -2, 2.5, 0, Math.PI * 2); ctx.fill();

  } else if (hatId === 'hat_ninja') {
    // 🥷 Повязка Мастера Синоби (Headband + ribbon)
    ctx.translate(0, -18);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-28, -5, 56, 10);
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-11, -4, 22, 8);
    ctx.strokeRect(-11, -4, 22, 8);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 1.5);
    ctx.stroke();
    const wave = Math.sin(time * 0.008) * 4;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-26, -1);
    ctx.quadraticCurveTo(-38, -6 + wave, -46, -1 + wave * 1.5);
    ctx.lineTo(-44, 4 + wave * 1.5);
    ctx.quadraticCurveTo(-36, 1 + wave, -26, 3);
    ctx.closePath();
    ctx.fill();

  } else if (hatId === 'hat_cosmic') {
    // 🌌 Ореол Повелителя Времени (Glowing halo)
    ctx.translate(0, -56);
    const pulse = Math.sin(time * 0.005) * 3;
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 32 + pulse, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26 + pulse * 0.5, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

  } else if (hatId === 'hat_cyber') {
    // 🥽 Киберпанк Голо-Визор 2077 (Visor)
    ctx.translate(0, -7);
    const cyberGrad = ctx.createLinearGradient(-26, -5, 26, 7);
    cyberGrad.addColorStop(0, 'rgba(6, 182, 212, 0.9)');
    cyberGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.85)');
    cyberGrad.addColorStop(1, 'rgba(244, 63, 94, 0.9)');
    ctx.fillStyle = cyberGrad;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-26, -5, 52, 12, 4);
    else ctx.rect(-26, -5, 52, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, -2, 4, 1.5);
    ctx.fillRect(15, -3, 1.5, 4);

  } else if (hatId === 'hat_multiverse') {
    // ✨ Корона Мультиверса (Rainbow spectrum)
    ctx.translate(0, -52);
    const rainbowGrad = ctx.createLinearGradient(-24, 0, 24, -24);
    const tShift = (time * 0.001) % 1;
    rainbowGrad.addColorStop(0, `hsl(${(tShift * 360) % 360}, 100%, 65%)`);
    rainbowGrad.addColorStop(0.33, `hsl(${((tShift + 0.33) * 360) % 360}, 100%, 65%)`);
    rainbowGrad.addColorStop(0.66, `hsl(${((tShift + 0.66) * 360) % 360}, 100%, 65%)`);
    rainbowGrad.addColorStop(1, `hsl(${((tShift + 1.0) * 360) % 360}, 100%, 65%)`);
    ctx.fillStyle = rainbowGrad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, 0); ctx.lineTo(-24, -18); ctx.lineTo(-12, -8);
    ctx.lineTo(0, -26); ctx.lineTo(12, -8); ctx.lineTo(24, -18);
    ctx.lineTo(24, 0); ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, -26, 36, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

  } else if (hatId === 'hat_black_hole') {
    // 🕳️ Гравитационный Нимб Сингулярности (Black hole)
    ctx.translate(0, -56);
    const rot = time * 0.003;
    ctx.save();
    ctx.rotate(rot);
    const holeGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 28);
    holeGrad.addColorStop(0, '#000000');
    holeGrad.addColorStop(0.35, '#7c3aed');
    holeGrad.addColorStop(0.7, '#ea580c');
    holeGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (hatId === 'hat_godly_apex') {
    // 🔱 Венец Демиурга Омниверса (Demigod trident crown)
    ctx.translate(0, -54);
    ctx.save();
    ctx.rotate(time * 0.001);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 2;
    for (let r = 0; r < 8; r++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const ang = (r * Math.PI) / 4;
      ctx.lineTo(Math.cos(ang) * 34, Math.sin(ang) * 34);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-20, -26);
    ctx.lineTo(-14, -20);
    ctx.lineTo(0, -34);
    ctx.lineTo(14, -20);
    ctx.lineTo(20, -26);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-20, -27, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -35, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, -27, 3, 0, Math.PI * 2); ctx.fill();

  } else if (hatId === 'hat_celestial_infinity') {
    // 🪐 Абсолютные Кольца Бесконечности (Diamond planetary rings)
    ctx.translate(0, -54);
    ctx.save();
    ctx.rotate(0.35);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.9)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    const pAng = time * 0.004;
    const px = Math.cos(pAng) * 36;
    const py = Math.sin(pAng) * 10;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

