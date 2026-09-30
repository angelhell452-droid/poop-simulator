import { GAME } from '../core/state.js';
import { CSGO_CASES } from '../data/cases.data.js';
import { KNIVES } from '../data/knives.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getPoopSkinInfo } from '../progression/evolutionService.js';
import { getKnifeStar, getKnifeSharpenCost, getEquippedKnife, sharpenKnife } from '../systems/knifeService.js';
import { saveLocal } from '../save/saveManager.js';
import { requestCloudSync } from '../save/cloudSync.js';
import { updateHUD } from './hudView.js';
import { renderCharacterInventory, openCharacterInventoryModal } from './characterInventoryView.js';
import { events } from '../core/events.js';

let csgoAudioEnabled = true;
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

export function playCsgoTick(volume = 0.35, freq = 820) {
  if (!csgoAudioEnabled) return;
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

export function playCsgoUnlock() {
  if (!csgoAudioEnabled) return;
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

export function playCsgoWinFanfare(rarity) {
  if (!csgoAudioEnabled) return;
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
  const caseObj = CSGO_CASES.find(c => c.id === caseId);
  if (!caseObj) return;

  if (caseObj.reqPrestiges && (GAME.totalPrestiges || 0) < caseObj.reqPrestiges) {
    alert(`Этот кейс откроется после ${caseObj.reqPrestiges} Смывов! У вас выполнено: ${GAME.totalPrestiges || 0}.`);
    return;
  }
  if (caseObj.reqTranscend && (GAME.totalTranscend || 0) < caseObj.reqTranscend) {
    alert(`Этот кейс откроется после ${caseObj.reqTranscend} Прорывов! У вас выполнено: ${GAME.totalTranscend || 0}.`);
    return;
  }

  if (caseObj.currency === 'rolls' && GAME.prestigeRolls < caseObj.cost) {
    alert('Недостаточно Золотых Втулок Судьбы (🧻)! Совершите Смыв Судьбы для их получения.');
    return;
  }
  if (caseObj.currency === 'plungers' && (GAME.transcendPlungers || 0) < caseObj.cost) {
    alert('Недостаточно Астральных Вантузов (🪠)! Совершите Астральный Прорыв.');
    return;
  }

  if (caseObj.currency === 'rolls') {
    GAME.prestigeRolls -= caseObj.cost;
  } else {
    GAME.transcendPlungers -= caseObj.cost;
  }
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
  playCsgoUnlock();

  unlockTimeoutId = setTimeout(() => {
    unlockTimeoutId = null;
    if (unlockScreen) unlockScreen.classList.add('hidden');
    if (wheelBox) wheelBox.classList.remove('opacity-40');
    setupAndRunRouletteTape(caseObj);
  }, 750);
}

export function setupAndRunRouletteTape(caseObj, instantSkip = false) {
  const track = document.getElementById('rouletteTrack');
  if (!track) return;
  track.style.transition = 'none';
  track.style.transform = 'translateX(0px)';
  track.style.filter = 'none';

  const poolKnives = caseObj.pool.map(id => KNIVES.find(k => k.id === id)).filter(Boolean);
  const roll = Math.random();

  const godlys = poolKnives.filter(k => k.rarity === 'godly' || k.rarity === 'special');
  const titaniums = poolKnives.filter(k => k.rarity === 'titanium');
  const celestials = poolKnives.filter(k => k.rarity === 'celestial');
  const rainbows = poolKnives.filter(k => k.rarity === 'rainbow');
  const coverts = poolKnives.filter(k => k.rarity === 'covert');
  const classifieds = poolKnives.filter(k => k.rarity === 'classified');
  const epics = poolKnives.filter(k => k.rarity === 'epic');
  const veryRares = poolKnives.filter(k => k.rarity === 'very_rare' || k.rarity === 'restricted');
  const rares = poolKnives.filter(k => k.rarity === 'rare');
  const commons = poolKnives.filter(k => k.rarity === 'common' || k.rarity === 'mil-spec');

  if (roll < 0.04 && godlys.length > 0) {
    rouletteWinningKnife = godlys[Math.floor(Math.random() * godlys.length)];
  } else if (roll < 0.09 && titaniums.length > 0) {
    rouletteWinningKnife = titaniums[Math.floor(Math.random() * titaniums.length)];
  } else if (roll < 0.16 && celestials.length > 0) {
    rouletteWinningKnife = celestials[Math.floor(Math.random() * celestials.length)];
  } else if (roll < 0.25 && rainbows.length > 0) {
    rouletteWinningKnife = rainbows[Math.floor(Math.random() * rainbows.length)];
  } else if (roll < 0.38 && coverts.length > 0) {
    rouletteWinningKnife = coverts[Math.floor(Math.random() * coverts.length)];
  } else if (roll < 0.54 && classifieds.length > 0) {
    rouletteWinningKnife = classifieds[Math.floor(Math.random() * classifieds.length)];
  } else if (roll < 0.70 && epics.length > 0) {
    rouletteWinningKnife = epics[Math.floor(Math.random() * epics.length)];
  } else if (roll < 0.85 && veryRares.length > 0) {
    rouletteWinningKnife = veryRares[Math.floor(Math.random() * veryRares.length)];
  } else if (rares.length > 0) {
    rouletteWinningKnife = rares[Math.floor(Math.random() * rares.length)];
  } else {
    rouletteWinningKnife = (commons.length > 0 ? commons : poolKnives)[Math.floor(Math.random() * (commons.length > 0 ? commons : poolKnives).length)];
  }

  const winnerIndex = 48;
  currentWinnerIndex = winnerIndex;
  currentWinningOffset = winnerIndex * 152;
  const cards = [];

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
        <span class="text-3xl my-0.5 filter drop-shadow">${itemKnife.icon}</span>
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
      playCsgoTick(tickVol, tickFreq);

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

  playCsgoWinFanfare(rouletteWinningKnife.rarity);

  const resBanner = document.getElementById('rouletteResultBanner');
  if (resBanner) resBanner.classList.remove('hidden');

  const rIcon = document.getElementById('rouletteResultIcon');
  if (rIcon) rIcon.textContent = rouletteWinningKnife.icon;
  const rName = document.getElementById('rouletteResultName');
  if (rName) rName.textContent = rouletteWinningKnife.name;

  if (!GAME.knifeStars) GAME.knifeStars = {};
  let isDuplicate = false;
  let star = 1;
  if (!GAME.unlockedKnives.includes(rouletteWinningKnife.id)) {
    GAME.unlockedKnives.push(rouletteWinningKnife.id);
    GAME.knifeStars[rouletteWinningKnife.id] = 1;
    star = 1;
  } else {
    isDuplicate = true;
    const cur = GAME.knifeStars[rouletteWinningKnife.id] || 1;
    if (cur < 25) {
      GAME.knifeStars[rouletteWinningKnife.id] = cur + 1;
      star = cur + 1;
    } else {
      star = 25;
    }
  }

  const rarityEl = document.getElementById('rouletteResultRarity');
  if (rarityEl) {
    if (isDuplicate) {
      rarityEl.textContent = `${rouletteWinningKnife.rarityName} (ДУБЛИКАТ! ★ Звезда повышена до Lv.${star})`;
    } else {
      rarityEl.textContent = `${rouletteWinningKnife.rarityName} (НОВЫЙ НОЖ! ★ Lv.1)`;
    }
  }

  const cbEl = document.getElementById('rouletteResultClickBoost');
  if (cbEl) cbEl.textContent = `+${Math.round((rouletteWinningKnife.clickMult * (1 + (star - 1) * 0.35) - 1) * 100)}% Клик`;

  const pbEl = document.getElementById('rouletteResultPassiveBoost');
  if (pbEl) pbEl.textContent = `+${Math.round((rouletteWinningKnife.passiveMult * (1 + (star - 1) * 0.25) - 1) * 100)}% Заводы`;

  GAME.casesOpened = (GAME.casesOpened || 0) + 1;
  saveLocal();
  updateHUD();
  renderCasesSystem();
  renderCharacterInventory();
  requestCloudSync(2000);
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

  const skinInfo = getPoopSkinInfo(GAME.evoStage, GAME.girlyMode);
  const skinIconEl = document.getElementById('poopSkinIcon');
  if (skinIconEl) skinIconEl.textContent = skinInfo.icon;
  const skinNameEl = document.getElementById('poopSkinName');
  if (skinNameEl) skinNameEl.textContent = skinInfo.name;
  const skinTierEl = document.getElementById('poopSkinTierBadge');
  if (skinTierEl) skinTierEl.textContent = `Тир ${skinInfo.tier}`;
  const skinHintEl = document.getElementById('poopSkinProgressHint');
  if (skinHintEl) {
    if (skinInfo.nextAt < 20000) {
      skinHintEl.textContent = `Форма #${GAME.evoStage + 1} • След. скин на Форме #${skinInfo.nextAt}`;
    } else {
      skinHintEl.textContent = `Форма #${GAME.evoStage + 1} • ВЫСШАЯ ФОРМА ОМНИВЕРСА!`;
    }
  }

  const cratesList = document.getElementById('casesCratesList');
  if (cratesList) {
    cratesList.innerHTML = CSGO_CASES.map(c => {
      const meetsPrestige = !c.reqPrestiges || (GAME.totalPrestiges || 0) >= c.reqPrestiges;
      const meetsTranscend = !c.reqTranscend || (GAME.totalTranscend || 0) >= c.reqTranscend;
      const isUnlocked = meetsPrestige && meetsTranscend;
      const hasCurrency = c.currency === 'rolls' ? GAME.prestigeRolls >= c.cost : (GAME.transcendPlungers || 0) >= c.cost;
      const canOpen = isUnlocked && hasCurrency;

      const lockBadge = !isUnlocked
        ? `<div class="mt-1 text-[9px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/50">🔒 Требуется: ${c.reqTranscend ? `${c.reqTranscend} Прорывов` : `${c.reqPrestiges} Смывов`}</div>`
        : '';

      const currIcon = c.currency === 'plungers' ? '<span class="plunger-icon"></span>' : '<span class="roll-icon"></span>';
      const btnText = !isUnlocked
        ? `🔒 ЗАБЛОКИРОВАНО`
        : (hasCurrency ? `ОТКРЫТЬ КЕЙС 🎰` : `НЕ ХВАТАЕТ ${c.currency === 'plungers' ? 'ВАНТУЗОВ' : 'ВТУЛОК'}`);

      return `
        <div class="p-3 rounded-2xl bg-gradient-to-br ${c.bgClass} border-2 ${c.borderClass} shadow-lg flex flex-col justify-between relative overflow-hidden ${!isUnlocked ? 'opacity-70 grayscale-[25%]' : ''}">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-2xl">${c.icon}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900/80 text-yellow-300 border border-yellow-500/40 inline-flex items-center gap-1">${formatNumber(c.cost)} ${currIcon}</span>
            </div>
            <div class="font-game text-xs text-yellow-200 mt-1">${c.name}</div>
            <div class="text-[10px] text-stone-300 mt-0.5 leading-snug">${c.desc}</div>
            ${lockBadge}
          </div>
          <button class="open-case-btn mt-3 w-full py-1.5 rounded-xl font-game text-xs transition jelly-btn ${canOpen ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black shadow-md' : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'}" data-case="${c.id}" ${canOpen ? '' : 'disabled'}>
            ${btnText}
          </button>
        </div>
      `;
    }).join('');

    cratesList.querySelectorAll('.open-case-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.dataset.case;
        openCaseRoulette(cid);
      });
    });
  }

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
      csgoAudioEnabled = !csgoAudioEnabled;
      const icon = document.getElementById('rouletteAudioIcon');
      const text = document.getElementById('rouletteAudioText');
      if (icon) icon.textContent = csgoAudioEnabled ? '🔊' : '🔇';
      if (text) text.textContent = csgoAudioEnabled ? 'ЗВУК CS:GO: ВКЛ' : 'ЗВУК CS:GO: ВЫКЛ';
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
    const c = CSGO_CASES.find(cs => cs.id === btn.dataset.case);
    if (!c) return;
    const hasCurrency = c.currency === 'rolls' ? GAME.prestigeRolls >= c.cost : (GAME.transcendPlungers || 0) >= c.cost;
    btn.disabled = !hasCurrency;
    if (hasCurrency) {
      btn.className = 'open-case-btn mt-3 w-full py-1.5 rounded-xl font-game text-xs transition jelly-btn bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black shadow-md';
    } else {
      btn.className = 'open-case-btn mt-3 w-full py-1.5 rounded-xl font-game text-xs transition jelly-btn bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700';
    }
  });
}
