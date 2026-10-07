import { GAME } from '../core/state.js?v=5.0.54';
import { WEAPON_CASES } from '../data/cases.data.js?v=5.0.54';
import { KNIVES } from '../data/knives.data.js?v=5.0.54';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.54';
import { getKnifeStar, getKnifeSharpenCost, getEquippedKnife, sharpenKnife } from '../systems/knifeService.js';
import { saveLocal } from '../save/saveManager.js?v=5.0.54';
import { requestCloudSync } from '../save/cloudSync.js?v=5.0.54';
import { updateHUD } from './hudView.js?v=5.0.54';
import { renderCharacterInventory, openCharacterInventoryModal, showKnifeToast } from './characterInventoryView.js?v=5.0.54';
import { events } from '../core/events.js';
import { getKnifeImageHtml } from '../utils/knifeIcons.js';
import { getKnifeShownBonuses } from '../economy/production.js?v=5.0.54';
import { getKnifeCpsBonus } from '../systems/autoclickService.js?v=5.0.54';
import { isCasesUnlocked, peakForm } from '../progression/unlocks.js?v=5.0.54';
import { getPhaseForForm } from '../progression/phases.data.js?v=5.0.54';

let caseAudioEnabled = true;
let audioCtx = null;
let activeRouletteCase = null;
let rouletteWinningKnife = null;
let isRouletteSpinning = false;
let confettiParticles = [];
let confettiAnimId = null;
let spinAnimFrameId = null;
let unlockTimeoutId = null;
let currentWinnerIndex = 48;
let currentWinningOffset = 0;

function casePlungerCost(caseObj) {
  return Math.max(0, Number(caseObj?.costPlungers) || 0);
}

function caseIsOpen(caseObj) {
  return peakForm() >= (caseObj?.reqForm || 1);
}

function caseRollNeed(caseObj, count = 1) {
  return Math.max(0, Number(caseObj?.cost) || 0) * count;
}

function missingCaseFunds(caseObj, count = 1) {
  const parts = [];
  const rolls = caseRollNeed(caseObj, count);
  const plungers = casePlungerCost(caseObj) * count;
  if ((GAME.prestigeRolls || 0) < rolls) parts.push(`${formatNumber(rolls)} втулок`);
  if ((GAME.transcendPlungers || 0) < plungers) parts.push(`${formatNumber(plungers)} вантузов`);
  return parts;
}

function canAffordCase(caseObj, count = 1) {
  return missingCaseFunds(caseObj, count).length === 0;
}

function payForCase(caseObj, count = 1) {
  GAME.prestigeRolls -= caseRollNeed(caseObj, count);
  const plungers = casePlungerCost(caseObj) * count;
  if (plungers > 0) GAME.transcendPlungers = (GAME.transcendPlungers || 0) - plungers;
}

function refundDuplicate(caseObj) {
  const rolls = caseRollNeed(caseObj) > 0 ? Math.max(1, Math.round(caseRollNeed(caseObj) * 0.5)) : 0;
  const plungers = Math.floor(casePlungerCost(caseObj) * 0.5);
  if (rolls > 0) GAME.prestigeRolls = (GAME.prestigeRolls || 0) + rolls;
  if (plungers > 0) GAME.transcendPlungers = (GAME.transcendPlungers || 0) + plungers;
  return { rolls, plungers };
}

function refundLabel(refund) {
  const parts = [];
  if (refund.rolls > 0) parts.push(`+${formatNumber(refund.rolls)} втулок`);
  if (refund.plungers > 0) parts.push(`+${formatNumber(refund.plungers)} вантузов`);
  return parts.join(' и ');
}

function casePriceHtml(caseObj) {
  const rolls = `<span class="inline-flex items-center gap-1">${formatNumber(caseObj.cost)} <span class="roll-icon"></span></span>`;
  const plungers = casePlungerCost(caseObj);
  if (plungers <= 0) return rolls;
  return `${rolls}<span class="text-stone-500">+</span><span class="inline-flex items-center gap-1">${formatNumber(plungers)} <span class="plunger-icon"></span></span>`;
}

function casesInEpochOrder() {
  return [...WEAPON_CASES].sort((a, b) => (a.reqEpoch || 1) - (b.reqEpoch || 1));
}

function assertCaseReady(caseObj, count = 1) {
  if (!caseIsOpen(caseObj)) {
    const epoch = getPhaseForForm(peakForm()).id;
    alert(`Этот кейс откроется с эпохи ${formatNumber(caseObj.reqEpoch)}. Рекорд сейчас: эпоха ${formatNumber(epoch)}.`);
    return false;
  }
  const missing = missingCaseFunds(caseObj, count);
  if (missing.length > 0) {
    alert(`Не хватает: ${missing.join(' и ')}.`);
    return false;
  }
  return true;
}

let knifeFilterRarity = 'all';
let knifeSearchQuery = '';
let knifeSortMode = 'power';

export function skipRouletteSpin() {
  if (unlockTimeoutId) {
    clearTimeout(unlockTimeoutId);
    unlockTimeoutId = null;
    const unlockScreen = document.getElementById('rouletteUnlockScreen');
    const wheelBox = document.getElementById('rouletteWheelBox');
    if (unlockScreen) unlockScreen.classList.add('hidden');
    if (wheelBox) wheelBox.classList.remove('opacity-40');
    if (activeRouletteCase) {
      setupAndRunRouletteTape(activeRouletteCase, true);
      return;
    }
  }

  if (isRouletteSpinning) {
    if (spinAnimFrameId) {
      cancelAnimationFrame(spinAnimFrameId);
      spinAnimFrameId = null;
    }
    const track = document.getElementById('rouletteTrack');
    if (track) {
      track.style.transition = 'none';
      track.style.filter = 'none';
      track.style.transform = `translateX(-${currentWinningOffset || (currentWinnerIndex * 152)}px)`;
    }
    onRouletteFinished();
  }
}


function getAudioCtx() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playCaseTick(volume = 0.35, freq = 820) {
  if (!caseAudioEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.022);
    gain.gain.setValueAtTime(Math.min(0.5, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.025);
  } catch (e) { }
}

export function playCaseUnlock() {
  if (!caseAudioEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) { }
}

export function playCaseWinFanfare(rarity) {
  if (!caseAudioEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const isSpecial = (rarity === 'special' || rarity === 'godly');
    const isCovert = (rarity === 'covert');
    const notes = isSpecial ? [523.25, 659.25, 783.99, 1046.50] : (isCovert ? [392.00, 493.88, 587.33, 783.99] : [329.63, 392.00, 493.88, 659.25]);
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = now + idx * 0.12;
      osc.type = isSpecial ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);
      gain.gain.setValueAtTime(0.28, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + (idx === notes.length - 1 ? 1.6 : 0.35));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + (idx === notes.length - 1 ? 1.7 : 0.4));
    });
  } catch (e) { }
}

export function launchConfettiFireworks(isGold = false) {
  const c = document.getElementById('rouletteConfettiCanvas');
  if (!c) return;
  c.width = c.clientWidth;
  c.height = c.clientHeight;
  const ctx = c.getContext('2d');
  confettiParticles = [];

  const colors = isGold
    ? ['#facc15', '#fde047', '#ffd700', '#f59e0b', '#ffffff']
    : ['#ef4444', '#f43f5e', '#ec4899', '#a855f7', '#38bdf8', '#facc15'];

  for (let i = 0; i < 75; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    confettiParticles.push({
      x: c.width / 2,
      y: c.height * 0.45,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      life: 1.0,
      decay: 0.012 + Math.random() * 0.008
    });
  }

  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

  function stepConfetti() {
    ctx.clearRect(0, 0, c.width, c.height);
    let active = 0;
    for (let p of confettiParticles) {
      if (p.life <= 0) continue;
      active++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.vx *= 0.98;
      p.rotation += p.rotSpeed;
      p.life -= p.decay;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      ctx.restore();
    }
    if (active > 0) {
      confettiAnimId = requestAnimationFrame(stepConfetti);
    } else {
      ctx.clearRect(0, 0, c.width, c.height);
    }
  }
  stepConfetti();
}

export function openCaseRoulette(caseId) {
  if (isRouletteSpinning) return;
  if (!isCasesUnlocked()) return;
  const caseObj = WEAPON_CASES.find(c => c.id === caseId);
  if (!caseObj) return;

  if (!assertCaseReady(caseObj, 1)) return;
  payForCase(caseObj, 1);
  saveLocal();

  activeRouletteCase = caseObj;
  const modal = document.getElementById('caseRouletteModal');
  if (modal) modal.classList.remove('hidden');

  const titleEl = document.getElementById('rouletteCaseTitle');
  if (titleEl) titleEl.textContent = caseObj.name;
  const resBanner = document.getElementById('rouletteResultBanner');
  if (resBanner) resBanner.classList.add('hidden');
  const ctrlSec = document.getElementById('rouletteControlSection');
  if (ctrlSec) ctrlSec.classList.remove('hidden');

  const unlockScreen = document.getElementById('rouletteUnlockScreen');
  const wheelBox = document.getElementById('rouletteWheelBox');
  if (unlockScreen) unlockScreen.classList.remove('hidden');
  if (wheelBox) wheelBox.classList.add('opacity-40');
  playCaseUnlock();

  unlockTimeoutId = setTimeout(() => {
    unlockTimeoutId = null;
    if (unlockScreen) unlockScreen.classList.add('hidden');
    if (wheelBox) wheelBox.classList.remove('opacity-40');
    setupAndRunRouletteTape(caseObj);
  }, 750);
}

export const KNIFE_RARITY_WEIGHTS = {
  godly: 0.15,
  special: 0.25,
  titanium: 0.50,
  celestial: 1.20,
  rainbow: 2.50,
  covert: 6.00,
  classified: 14.00,
  epic: 24.00,
  very_rare: 36.00,
  restricted: 36.00,
  rare: 50.00,
  common: 70.00,
  'mil-spec': 70.00
};

export function getKnifePoolWithChances(poolKnives, fixedChances = null) {
  if (!poolKnives || poolKnives.length === 0) return [];

  const fixedChanceOf = (knife) => {
    const value = fixedChances && Number(fixedChances[knife.id]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };
  const fixedKnives = [];
  const regular = [];
  for (const knife of poolKnives) {
    if (fixedChanceOf(knife) > 0) fixedKnives.push(knife);
    else regular.push(knife);
  }

  const asked = fixedKnives.reduce((sum, knife) => sum + fixedChanceOf(knife), 0);
  const fixedBudget = Math.min(0.95, asked);
  const fixedScale = asked > 0 ? fixedBudget / asked : 1;
  const rest = 1 - fixedBudget;

  const rows = [];
  if (regular.length > 0) {
    const minPower = Math.min(...regular.map(k => k.clickMult || 1));
    // Curve strength: 0.0 = equal chances, 1.0 = fully linear inverse.
    // 0.65 gives a nice balance — strongest is ~3-8x rarer than weakest,
    // but never falls below 5% of the max weight (so always obtainable).
    const CURVE = 0.65;
    const MIN_WEIGHT_RATIO = 0.05;
    const rawWeights = regular.map(k => {
      const normalizedPower = (k.clickMult || 1) / minPower;
      const raw = 1.0 / Math.pow(normalizedPower, CURVE);
      return Math.max(raw, MIN_WEIGHT_RATIO);
    });
    const totalWeight = rawWeights.reduce((s, w) => s + w, 0);
    const shareOfRest = fixedKnives.length > 0 ? rest : 1;
    regular.forEach((knife, i) => {
      const share = (rawWeights[i] / totalWeight) * shareOfRest;
      rows.push({ knife, weight: share, chancePercent: share * 100 });
    });
  }

  for (const knife of fixedKnives) {
    const chance = fixedChanceOf(knife) * fixedScale;
    rows.push({ knife, weight: chance, chancePercent: chance * 100 });
  }
  return rows;
}


export function pickWeightedKnife(poolKnives, fixedChances = null) {
  if (!poolKnives || poolKnives.length === 0) return null;
  const list = getKnifePoolWithChances(poolKnives, fixedChances);
  const totalWeight = list.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const item of list) {
    if (rand <= item.weight) return item.knife;
    rand -= item.weight;
  }
  return list[list.length - 1].knife;
}

export function setupAndRunRouletteTape(caseObj, instantSkip = false) {
  const track = document.getElementById('rouletteTrack');
  if (!track) return;
  track.style.transition = 'none';
  track.style.transform = 'translateX(0px)';
  track.style.filter = 'none';

  const poolKnives = caseObj.pool.map(id => KNIVES.find(k => k.id === id)).filter(Boolean);
  rouletteWinningKnife = pickWeightedKnife(poolKnives, caseObj.fixedChances) || poolKnives[0];

  const winnerIndex = 48;
  currentWinnerIndex = winnerIndex;
  currentWinningOffset = winnerIndex * 152;
  const cards = [];

  // Pre-compute rarity groups for neighbor card selection
  const godlys = poolKnives.filter(k => k.rarity === 'godly' || k.rarity === 'special');
  const titaniums = poolKnives.filter(k => k.rarity === 'titanium');
  const celestials = poolKnives.filter(k => k.rarity === 'celestial');
  const rainbows = poolKnives.filter(k => k.rarity === 'rainbow');
  const coverts = poolKnives.filter(k => k.rarity === 'covert');

  for (let i = 0; i < 65; i++) {
    let itemKnife;
    if (i === winnerIndex) {
      itemKnife = rouletteWinningKnife;
    } else if ((i === winnerIndex - 1 || i === winnerIndex + 1) && Math.random() < 0.65) {
      const topPool = (godlys.length > 0 ? godlys : (titaniums.length > 0 ? titaniums : (celestials.length > 0 ? celestials : (rainbows.length > 0 ? rainbows : (coverts.length > 0 ? coverts : poolKnives)))));
      itemKnife = topPool[Math.floor(Math.random() * topPool.length)] || poolKnives[Math.floor(Math.random() * poolKnives.length)];
    } else {
      itemKnife = poolKnives[Math.floor(Math.random() * poolKnives.length)];
    }

    const isGodly = itemKnife.rarity === 'godly' || itemKnife.rarity === 'special';
    const isTitanium = itemKnife.rarity === 'titanium';
    const isCelestial = itemKnife.rarity === 'celestial';
    const isRainbow = itemKnife.rarity === 'rainbow';
    const isCovert = itemKnife.rarity === 'covert';
    const isClassified = itemKnife.rarity === 'classified';
    const isEpic = itemKnife.rarity === 'epic';
    const isVeryRare = itemKnife.rarity === 'very_rare' || itemKnife.rarity === 'restricted';
    const isRare = itemKnife.rarity === 'rare';

    let rColor = 'border-stone-500 bg-stone-900/90';
    let barColor = 'bg-stone-500';
    let badgeColor = 'bg-stone-800 text-stone-300';
    let starBadge = '';

    if (isGodly) {
      rColor = 'border-yellow-400 bg-gradient-to-b from-yellow-950/70 to-purple-950/70 shadow-[0_0_16px_rgba(250,204,21,0.6)]';
      barColor = 'bg-yellow-400';
      badgeColor = 'bg-yellow-400 text-stone-950 font-black';
      starBadge = '<span class="text-yellow-300 animate-spin-slow">★</span>';
    } else if (isTitanium) {
      rColor = 'border-teal-400 bg-gradient-to-b from-teal-950/60 to-stone-900 shadow-[0_0_14px_rgba(45,212,191,0.5)]';
      barColor = 'bg-teal-400';
      badgeColor = 'bg-teal-400 text-stone-950 font-black';
      starBadge = '<span class="text-teal-300">⚙️</span>';
    } else if (isCelestial) {
      rColor = 'border-cyan-300 bg-gradient-to-b from-cyan-950/60 to-indigo-950/60 shadow-[0_0_14px_rgba(103,232,249,0.5)]';
      barColor = 'bg-cyan-300';
      badgeColor = 'bg-cyan-400 text-stone-950 font-black';
      starBadge = '<span class="text-cyan-300">✨</span>';
    } else if (isRainbow) {
      rColor = 'border-amber-300 bg-gradient-to-b from-red-950/40 via-purple-950/40 to-blue-950/40 shadow-[0_0_14px_rgba(244,63,94,0.5)]';
      barColor = 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500';
      badgeColor = 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white font-black';
      starBadge = '<span class="text-yellow-300">🌈</span>';
    } else if (isCovert) {
      rColor = 'border-red-500 bg-gradient-to-b from-red-950/40 to-stone-900 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
      barColor = 'bg-red-500';
      badgeColor = 'bg-red-600 text-white font-bold';
    } else if (isClassified) {
      rColor = 'border-pink-500 bg-gradient-to-b from-pink-950/40 to-stone-900 shadow-[0_0_10px_rgba(236,72,153,0.35)]';
      barColor = 'bg-pink-500';
      badgeColor = 'bg-pink-600 text-white font-bold';
    } else if (isEpic) {
      rColor = 'border-purple-500 bg-gradient-to-b from-purple-950/30 to-stone-900';
      barColor = 'bg-purple-500';
      badgeColor = 'bg-purple-600 text-white font-bold';
    } else if (isVeryRare) {
      rColor = 'border-indigo-500 bg-gradient-to-b from-indigo-950/30 to-stone-900';
      barColor = 'bg-indigo-500';
      badgeColor = 'bg-indigo-600 text-white font-bold';
    } else if (isRare) {
      rColor = 'border-sky-500 bg-gradient-to-b from-blue-950/30 to-stone-900';
      barColor = 'bg-sky-400';
      badgeColor = 'bg-sky-600 text-white font-bold';
    }

    cards.push(`
      <div class="w-36 h-28 shrink-0 rounded-2xl border-2 ${rColor} p-2 flex flex-col items-center justify-between text-center relative select-none">
        <div class="w-full flex justify-between items-center text-[8px]">
          <span class="font-bold uppercase ${badgeColor} px-1.5 py-0.2 rounded">${itemKnife.rarityName}</span>
          ${starBadge}
        </div>
        <div class="my-0.5 flex items-center justify-center">${getKnifeImageHtml(itemKnife, 52)}</div>
        <div class="font-game text-[10px] text-yellow-200 truncate w-full px-1">${itemKnife.name}</div>
        <div class="h-1 w-full rounded-full ${barColor}"></div>
      </div>
    `);
  }
  track.innerHTML = cards.join('');

  if (instantSkip || GAME.fastCaseOpen) {
    track.style.transition = 'none';
    track.style.filter = 'none';
    track.style.transform = `translateX(-${currentWinningOffset}px)`;
    onRouletteFinished();
    return;
  }

  runPhysicalRouletteSpin(winnerIndex);
}

export function runPhysicalRouletteSpin(winnerIndex) {
  if (isRouletteSpinning) return;
  isRouletteSpinning = true;

  const track = document.getElementById('rouletteTrack');
  const needle = document.getElementById('rouletteNeedle');
  const cardPitch = 152;
  const randomJitter = (Math.random() - 0.5) * 70;
  const targetOffset = winnerIndex * cardPitch + randomJitter;
  currentWinningOffset = targetOffset;

  const durationMs = 6200;
  const startTime = performance.now();
  let lastCardIndex = -1;

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1.0, elapsed / durationMs);
    const ease = 1.0 - Math.pow(1.0 - progress, 4.6);
    const currentOffset = targetOffset * ease;

    if (track) {
      track.style.transform = `translateX(-${currentOffset}px)`;
      const velocity = (1.0 - progress);
      if (velocity > 0.4) {
        track.style.filter = `blur(${Math.min(2.5, (velocity - 0.3) * 5)}px)`;
      } else {
        track.style.filter = 'none';
      }
    }

    const centerMarkerPos = currentOffset + 120;
    const currentCardIndex = Math.floor(centerMarkerPos / cardPitch);

    if (currentCardIndex !== lastCardIndex && currentCardIndex >= 0) {
      lastCardIndex = currentCardIndex;
      const tickFreq = 860 - Math.min(320, progress * 320);
      const tickVol = Math.max(0.12, 0.42 * (1.0 - progress * 0.4));
      playCaseTick(tickVol, tickFreq);

      if (needle) {
        needle.style.transform = 'translateX(-50%) rotate(-16deg)';
        setTimeout(() => {
          if (needle) needle.style.transform = 'translateX(-50%) rotate(0deg)';
        }, 35);
      }
    }

    if (progress < 1.0) {
      spinAnimFrameId = requestAnimationFrame(frame);
    } else {
      spinAnimFrameId = null;
      onRouletteFinished();
    }
  }

  spinAnimFrameId = requestAnimationFrame(frame);
}

function onRouletteFinished() {
  if (spinAnimFrameId) {
    cancelAnimationFrame(spinAnimFrameId);
    spinAnimFrameId = null;
  }
  isRouletteSpinning = false;

  const ctrlSec = document.getElementById('rouletteControlSection');
  if (ctrlSec) ctrlSec.classList.add('hidden');

  const isGold = ['godly', 'special', 'celestial', 'titanium', 'rainbow'].includes(rouletteWinningKnife.rarity);
  const isCovert = rouletteWinningKnife.rarity === 'covert';

  if (isGold || isCovert) {
    const flash = document.getElementById('rouletteFlashOverlay');
    if (flash) {
      flash.style.opacity = isGold ? '0.85' : '0.5';
      setTimeout(() => { flash.style.opacity = '0'; }, 280);
    }
    launchConfettiFireworks(isGold);
  }

  playCaseWinFanfare(rouletteWinningKnife.rarity);

  const resBanner = document.getElementById('rouletteResultBanner');
  if (resBanner) resBanner.classList.remove('hidden');

  const rIcon = document.getElementById('rouletteResultIcon');
  if (rIcon) rIcon.innerHTML = getKnifeImageHtml(rouletteWinningKnife, 80);
  const rName = document.getElementById('rouletteResultName');
  if (rName) rName.textContent = rouletteWinningKnife.name;

  if (!GAME.knifeStars) GAME.knifeStars = {};
  let isDuplicate = false;
  let star = 1;
  let duplicateRefundText = '';

  if (!GAME.unlockedKnives.includes(rouletteWinningKnife.id)) {
    GAME.unlockedKnives.push(rouletteWinningKnife.id);
    GAME.knifeStars[rouletteWinningKnife.id] = 1;
    star = 1;
  } else {
    isDuplicate = true;
    star = GAME.knifeStars[rouletteWinningKnife.id] || 1;
    duplicateRefundText = refundLabel(refundDuplicate(activeRouletteCase || { cost: 10, costPlungers: 0 }));
  }

  const rarityEl = document.getElementById('rouletteResultRarity');
  if (rarityEl) {
    if (isDuplicate) {
      rarityEl.innerHTML = `<span class="text-amber-300 font-bold">${rouletteWinningKnife.rarityName}</span> • <span class="text-yellow-400 font-bold">🔁 ДУБЛИКАТ! (Кэшбэк 50%: ${duplicateRefundText})</span>`;
    } else {
      rarityEl.innerHTML = `<span class="text-amber-300 font-bold">${rouletteWinningKnife.rarityName}</span> • <span class="text-emerald-400 font-bold">✨ НОВЫЙ НОЖ! (★ Lv.1)</span>`;
    }
  }

  const shown = getKnifeShownBonuses(rouletteWinningKnife);
  const cbEl = document.getElementById('rouletteResultClickBoost');
  if (cbEl) cbEl.textContent = `+${formatNumber(shown.clickPct)}% Клик`;

  const pbEl = document.getElementById('rouletteResultPassiveBoost');
  if (pbEl) pbEl.textContent = `+${formatNumber(getKnifeCpsBonus(rouletteWinningKnife))} CPS`;

  showKnifeToast(isDuplicate
    ? `🔁 Дубликат "${rouletteWinningKnife.name}"! Кэшбэк 50%: ${duplicateRefundText}`
    : `🎉 Новый нож получен: ${rouletteWinningKnife.name}!`
  );

  GAME.casesOpened = (GAME.casesOpened || 0) + 1;
  saveLocal();
  updateHUD();
  renderCasesSystem();
  renderCharacterInventory();
  requestCloudSync(2000);
}

export function openMultipleCases(caseObj, count = 3) {
  if (!caseObj || count <= 0 || !isCasesUnlocked()) return;
  if (!assertCaseReady(caseObj, count)) return;

  const poolKnives = caseObj.pool.map(id => KNIVES.find(k => k.id === id)).filter(Boolean);
  if (poolKnives.length === 0) return;
  payForCase(caseObj, count);

  const wonKnives = [];
  for (let i = 0; i < count; i++) {
    const won = pickWeightedKnife(poolKnives, caseObj.fixedChances) || poolKnives[0];
    wonKnives.push(won);

    if (!GAME.knifeStars) GAME.knifeStars = {};
    if (!GAME.unlockedKnives.includes(won.id)) {
      GAME.unlockedKnives.push(won.id);
      GAME.knifeStars[won.id] = 1;
    } else {
      refundDuplicate(caseObj);
    }
  }

  GAME.casesOpened = (GAME.casesOpened || 0) + count;
  saveLocal();
  updateHUD();
  renderCasesSystem();
  renderCharacterInventory();
  requestCloudSync(2000);

  // Set the highest tier knife as winning preview
  wonKnives.sort((a, b) => (b.clickMult || 1) - (a.clickMult || 1));
  rouletteWinningKnife = wonKnives[0];
  activeRouletteCase = caseObj;

  // Show banner with best knife and multi-toast summary
  const modal = document.getElementById('caseRouletteModal');
  if (modal) modal.classList.remove('hidden');

  const titleEl = document.getElementById('rouletteCaseTitle');
  if (titleEl) titleEl.textContent = `${caseObj.name} (Открыто ${count}x)`;

  const unlockScreen = document.getElementById('rouletteUnlockScreen');
  if (unlockScreen) unlockScreen.classList.add('hidden');
  const wheelBox = document.getElementById('rouletteWheelBox');
  if (wheelBox) wheelBox.classList.remove('opacity-40');
  const ctrlSec = document.getElementById('rouletteControlSection');
  if (ctrlSec) ctrlSec.classList.add('hidden');

  const resBanner = document.getElementById('rouletteResultBanner');
  if (resBanner) resBanner.classList.remove('hidden');

  const rIcon = document.getElementById('rouletteResultIcon');
  if (rIcon) rIcon.innerHTML = getKnifeImageHtml(rouletteWinningKnife, 80);
  const rName = document.getElementById('rouletteResultName');
  if (rName) rName.textContent = `★ Топ из 3 шт: ${rouletteWinningKnife.name}`;

  const rarityEl = document.getElementById('rouletteResultRarity');
  if (rarityEl) {
    rarityEl.innerHTML = `<span class="text-amber-300 font-bold">${rouletteWinningKnife.rarityName}</span> • <span class="text-yellow-400 font-bold">✨ Открыто сразу 3 кейса!</span>`;
  }

  playCaseWinFanfare(rouletteWinningKnife.rarity);
  launchConfettiFireworks(true);

  showKnifeToast(`🎁 Открыто 3 кейса! Лучший: "${rouletteWinningKnife.name}" (+ещё 2 в инвентаре)`);
}

export function renderCasesSystem() {
  const rollsLabel = document.getElementById('casesRollsLabel');
  if (rollsLabel) rollsLabel.innerHTML = `${formatNumber(GAME.prestigeRolls)} <span class="roll-icon"></span>`;
  const plungersLabel = document.getElementById('casesPlungersLabel');
  if (plungersLabel) plungersLabel.innerHTML = `${formatNumber(GAME.transcendPlungers || 0)} <span class="plunger-icon"></span>`;

  const countBadge = document.getElementById('knivesCountBadge');
  const unlockedCount = (GAME.unlockedKnives || []).length;
  if (countBadge) countBadge.textContent = `${unlockedCount} / ${KNIVES.length} найдено`;

  const topIndexCount = document.getElementById('topKnivesIndexCount');
  if (topIndexCount) topIndexCount.textContent = `${unlockedCount}/${KNIVES.length}`;

  const pnlIndexBadge = document.getElementById('indexBookHeaderBadge');
  if (pnlIndexBadge) pnlIndexBadge.textContent = `${unlockedCount} / ${KNIVES.length}`;

  const cratesList = document.getElementById('casesCratesList');
  if (cratesList && !isCasesUnlocked()) {
    cratesList.innerHTML = `<div class="col-span-full p-4 rounded-2xl border border-amber-900/60 bg-stone-950 text-center"><div class="text-2xl mb-1">🔒</div><div class="font-game text-sm text-amber-200">Кейсы закрыты</div><p class="text-[11px] text-stone-400 mt-1">Раздел откроется после первого Смыва. Смывов сейчас: ${formatNumber(GAME.totalPrestiges || 0)}.</p></div>`;
  } else if (cratesList) {
    cratesList.innerHTML = casesInEpochOrder().map(c => {
      const isUnlocked = caseIsOpen(c);
      const hasCurrency = canAffordCase(c, 1);
      const hasCurrency3 = isUnlocked && canAffordCase(c, 3);
      const canOpen = isUnlocked && hasCurrency;
      const lockReason = `Эпоха ${formatNumber(c.reqEpoch)}`;

      const lockBadge = !isUnlocked
        ? `<div class="mt-1 text-[9px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/50">🔒 ${lockReason}</div>`
        : '';

      const btnText = !isUnlocked
        ? `🔒 ${lockReason}`
        : (hasCurrency ? `Открыть 🎰` : `Мало валюты ❌`);

      return `
        <div class="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br ${c.bgClass} border-2 ${c.borderClass} shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${!isUnlocked ? 'opacity-70 grayscale-[25%]' : ''}">
          <div>
            <!-- Top Bar: Info button & Price badge cleanly separated -->
            <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 gap-2">
              <button class="case-info-btn w-6 h-6 rounded-full bg-stone-950/80 hover:bg-stone-850 text-yellow-300 border border-yellow-400/70 flex items-center justify-center text-xs font-black transition shadow-sm jelly-btn cursor-pointer shrink-0" data-case="${c.id}" title="Просмотреть шансы выпадения и список ножей">ⓘ</button>
              <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-stone-950/90 text-yellow-300 border border-yellow-500/50 inline-flex items-center gap-1.5 shrink-0 shadow-sm whitespace-nowrap">${casePriceHtml(c)}</span>
            </div>

            <!-- Central Showcase: Centered big icon, full readable title and description -->
            <div class="flex flex-col items-center text-center my-1 px-1">
              <div class="text-4xl my-1 select-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] transform transition-transform duration-200 hover:scale-110">${c.icon}</div>
              <div class="font-game text-xs sm:text-sm text-yellow-200 font-bold tracking-wide leading-tight min-h-[2.2rem] flex items-center justify-center text-center">${c.name}</div>
              <div class="text-[10.5px] text-stone-300 mt-1 leading-snug line-clamp-2 min-h-[26px]">${c.desc}</div>
              ${lockBadge}
            </div>
          </div>

          <!-- Bottom Action Buttons: Open 1x and Open 3x -->
          <div class="mt-3 flex gap-1.5 w-full">
            <button class="open-case-btn flex-1 py-2 px-1.5 rounded-xl font-game text-[11px] font-bold transition jelly-btn shadow-md text-center flex items-center justify-center gap-1 ${canOpen ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black' : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'}" data-case="${c.id}" ${canOpen ? '' : 'disabled'}>
              ${btnText}
            </button>
            ${isUnlocked ? `
              <button class="open-case-3x-btn py-2 px-2.5 rounded-xl font-game text-[11px] font-bold transition jelly-btn shadow-md text-center flex items-center justify-center gap-1 ${hasCurrency3 ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white font-black' : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'}" data-case="${c.id}" ${hasCurrency3 ? '' : 'disabled'} title="Открыть сразу 3 кейса мгновенно">
                <span>⚡3x</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    cratesList.querySelectorAll('.open-case-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.dataset.case;
        openCaseRoulette(cid);
      });
    });

    cratesList.querySelectorAll('.open-case-3x-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.dataset.case;
        const caseObj = WEAPON_CASES.find(c => c.id === cid);
        if (caseObj) openMultipleCases(caseObj, 3);
      });
    });

    cratesList.querySelectorAll('.case-info-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cid = btn.dataset.case;
        openCasePreviewModal(cid);
      });
    });
  }

}

export function openCasePreviewModal(caseId) {
  const caseObj = WEAPON_CASES.find(c => c.id === caseId);
  if (!caseObj) return;

  const modal = document.getElementById('casePreviewModal');
  if (!modal) return;

  const titleEl = document.getElementById('casePreviewTitle');
  const iconEl = document.getElementById('casePreviewIcon');
  const descEl = document.getElementById('casePreviewDesc');
  const costEl = document.getElementById('casePreviewCostBadge');
  const listEl = document.getElementById('casePreviewKnivesList');

  if (titleEl) titleEl.textContent = caseObj.name;
  if (iconEl) iconEl.textContent = caseObj.icon;
  if (descEl) descEl.textContent = caseObj.desc;
  if (costEl) costEl.innerHTML = casePriceHtml(caseObj);

  if (listEl) {
    listEl.innerHTML = '';
    const poolKnives = caseObj.pool.map(id => KNIVES.find(k => k.id === id)).filter(Boolean);
    const poolWithChances = getKnifePoolWithChances(poolKnives, caseObj.fixedChances);

    // Sort by rarity (rarest knives first), then by clickMult descending
    poolWithChances.sort((a, b) => (a.weight - b.weight) || (b.knife.clickMult - a.knife.clickMult));

    poolWithChances.forEach(item => {
      const knife = item.knife;
      const shown = getKnifeShownBonuses(knife);
      const clickPct = shown.clickPct;
      const pct = item.chancePercent < 1.0 ? item.chancePercent.toFixed(2) : item.chancePercent.toFixed(1);

      let rColor = 'border-stone-700 bg-stone-900/80';
      let badgeColor = 'bg-stone-800 text-stone-300';
      if (['godly', 'special'].includes(knife.rarity)) {
        rColor = 'border-amber-400 bg-gradient-to-r from-amber-950/60 to-purple-950/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
        badgeColor = 'bg-yellow-400 text-stone-950 font-black';
      } else if (knife.rarity === 'titanium') {
        rColor = 'border-teal-400 bg-teal-950/50';
        badgeColor = 'bg-teal-400 text-stone-950 font-black';
      } else if (knife.rarity === 'celestial') {
        rColor = 'border-cyan-300 bg-indigo-950/60 shadow-[0_0_8px_rgba(103,232,249,0.3)]';
        badgeColor = 'bg-cyan-400 text-stone-950 font-black';
      } else if (knife.rarity === 'rainbow') {
        rColor = 'border-pink-500 bg-purple-950/50';
        badgeColor = 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-black';
      } else if (knife.rarity === 'covert') {
        rColor = 'border-red-500 bg-red-950/40';
        badgeColor = 'bg-red-600 text-white font-bold';
      } else if (knife.rarity === 'classified') {
        rColor = 'border-pink-500 bg-pink-950/30';
        badgeColor = 'bg-pink-600 text-white font-bold';
      } else if (knife.rarity === 'epic') {
        rColor = 'border-purple-500 bg-purple-950/30';
        badgeColor = 'bg-purple-600 text-white font-bold';
      } else {
        rColor = 'border-stone-700 bg-stone-900/90';
        badgeColor = 'bg-stone-800 text-stone-300';
      }

      const itemRow = document.createElement('div');
      itemRow.className = `p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition ${rColor}`;
      itemRow.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="shrink-0 flex items-center justify-center">${getKnifeImageHtml(knife, 42)}</div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-xs text-stone-100 truncate">${knife.name}</span>
              <span class="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${badgeColor}">${knife.rarityName}</span>
            </div>
            <div class="text-[10px] text-stone-400 mt-1 flex items-center gap-2 flex-wrap font-mono">
              <span>Клик: <b class="text-emerald-300 font-bold">+${formatNumber(clickPct)}%</b></span>
              <span class="text-stone-600">•</span>
              <span>CPS: <b class="text-cyan-300 font-bold">+${formatNumber(getKnifeCpsBonus(knife))}</b></span>
              <span class="text-stone-600">•</span>
              <span>Множитель: <b class="text-amber-300 font-bold">x${formatNumber(knife.clickMult)}</b></span>
            </div>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="text-[10px] text-stone-400 block">Шанс:</span>
          <span class="font-game text-xs font-bold text-yellow-300 px-2 py-0.5 rounded-lg bg-stone-950 border border-yellow-500/40">${pct}%</span>
        </div>
      `;
      listEl.appendChild(itemRow);
    });
  }

  modal.classList.remove('hidden');
}

export function initCasesListeners() {
  document.getElementById('btnOpenCharacterInventoryFromCases')?.addEventListener('click', openCharacterInventoryModal);

  const btnSkip = document.getElementById('btnSkipRoulette');
  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      skipRouletteSpin();
    });
  }

  const fastToggle = document.getElementById('toggleFastCaseOpen');
  if (fastToggle) {
    fastToggle.checked = !!GAME.fastCaseOpen;
    fastToggle.addEventListener('change', () => {
      GAME.fastCaseOpen = fastToggle.checked;
      saveLocal();
    });
  }

  const btnEquip = document.getElementById('btnEquipRouletteKnife');
  if (btnEquip) {
    btnEquip.addEventListener('click', () => {
      if (rouletteWinningKnife) {
        GAME.equippedKnife = rouletteWinningKnife.id;
        document.getElementById('caseRouletteModal')?.classList.add('hidden');
        updateHUD();
        renderCasesSystem();
        renderCharacterInventory();
        saveLocal();
      }
    });
  }

  const btnKeep = document.getElementById('btnKeepRouletteKnife');
  if (btnKeep) {
    btnKeep.addEventListener('click', () => {
      document.getElementById('caseRouletteModal')?.classList.add('hidden');
      updateHUD();
      renderCasesSystem();
      renderCharacterInventory();
    });
  }

  // 🔄 Кнопка "Открыть ещё раз"
  const btnReopen = document.getElementById('btnReopenCase');
  if (btnReopen) {
    btnReopen.addEventListener('click', () => {
      if (!activeRouletteCase) return;
      openCaseRoulette(activeRouletteCase.id);
    });
  }

  // ⚡x3 Кнопка "Открыть сразу 3 кейса"
  const btnOpen3 = document.getElementById('btnOpen3Cases');
  if (btnOpen3) {
    btnOpen3.addEventListener('click', () => {
      if (!activeRouletteCase) return;
      openMultipleCases(activeRouletteCase, 3);
    });
  }

  const btnClose = document.getElementById('btnCloseCaseRoulette');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      isRouletteSpinning = false;
      document.getElementById('caseRouletteModal')?.classList.add('hidden');
      updateHUD();
      renderCasesSystem();
    });
  }

  const btnAudioToggle = document.getElementById('btnToggleRouletteAudio');
  if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', () => {
      caseAudioEnabled = !caseAudioEnabled;
      const icon = document.getElementById('rouletteAudioIcon');
      const text = document.getElementById('rouletteAudioText');
      if (icon) icon.textContent = caseAudioEnabled ? '🔊' : '🔇';
      if (text) text.textContent = caseAudioEnabled ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ';
    });
  }

  events.on('prestige:completed', () => {
    renderCasesSystem();
  });
  events.on('transcend:completed', () => {
    renderCasesSystem();
  });
}

export function updateCasesButtons() {
  const rollsLabel = document.getElementById('casesRollsLabel');
  if (rollsLabel) rollsLabel.innerHTML = `${formatNumber(GAME.prestigeRolls)} <span class="roll-icon"></span>`;
  const plungersLabel = document.getElementById('casesPlungersLabel');
  if (plungersLabel) plungersLabel.innerHTML = `${formatNumber(GAME.transcendPlungers || 0)} <span class="plunger-icon"></span>`;


  const cratesList = document.getElementById('casesCratesList');
  if (!cratesList) return;

  cratesList.querySelectorAll('.open-case-btn').forEach(btn => {
    const c = WEAPON_CASES.find(cs => cs.id === btn.dataset.case);
    if (!c) return;
    const isUnlocked = caseIsOpen(c);
    const hasCurrency = canAffordCase(c, 1);
    const canOpen = isUnlocked && hasCurrency;
    btn.disabled = !canOpen;

    const newText = !isUnlocked
      ? `🔒 Эпоха ${formatNumber(c.reqEpoch)}`
      : (hasCurrency ? `Открыть 🎰` : `Мало валюты ❌`);

    if (btn.textContent.trim() !== newText) {
      btn.textContent = newText;
    }

    if (canOpen) {
      btn.className = 'open-case-btn mt-3 w-full py-2 px-2.5 rounded-xl font-game text-xs font-bold transition jelly-btn bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black shadow-md text-center flex items-center justify-center gap-1.5';
    } else {
      btn.className = 'open-case-btn mt-3 w-full py-2 px-2.5 rounded-xl font-game text-xs font-bold transition jelly-btn bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700 text-center flex items-center justify-center gap-1.5';
    }
  });
}
