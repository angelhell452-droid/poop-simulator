import { GAME } from '../core/state.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { getEquippedKnife } from '../economy/production.js';
import { drawKnifeVectorOnCanvas } from '../utils/knifeVectorRenderer.js';

import { TALENTS } from '../data/talents.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { getClickPower, getPassiveIncome } from '../economy/production.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { checkAchievements } from '../systems/achievementsService.js';
import { updateHUD } from './hudView.js';
import { saveLocal } from '../save/saveManager.js';
import { requestCloudSync } from '../save/cloudSync.js';
import { events } from '../core/events.js';

let canvas = null;
let ctx = null;
let squashX = 1, squashY = 1;
let blinkTimer = 0;
let knifeSlashTimer = 0;
export const visualParticles = [];
export const sparkParticles = [];
let pendingAutoEarned = 0;
let pendingAutoCrits = 0;
let pendingAutoSparkles = 0;
let lastFloatingTextTime = 0;
let activeComboParticle = null;

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
function scheduleNextMeteor(extraMs = 0) {
  const hunter = TALENTS.find(t => t.id === 'meteor_hunter');
  const hunterScale = Math.pow(0.92, hunter ? hunter.level : 0);
  const magnet = SHOP_ITEMS.find(i => i.id === 'upg_meteor_magnet')?.owned ? 0.6 : 1;
  const base = 40000 + Math.random() * 35000 + extraMs;
  nextMeteorSpawn = Date.now() + Math.max(18000, base * hunterScale * magnet);
}
let listenersInitialized = false;

export function initPetCanvas() {
  canvas = document.getElementById('petCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  if (!listenersInitialized) {
    listenersInitialized = true;
    events.on('click:processed', (res) => {
      if (!res || res.totalEarned <= 0) return;

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
            text: `💥 КРИТ! +${formatNumber(totalEarned)} 💨`,
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
            text: `+${formatNumber(totalEarned)} 💨`,
            color: '#4ade80',
            scale: 1.15,
            life: 0.80
          });
        }

        if (sparklesEarned > 0) {
          addManagedTextParticle({
            x: clickX + (Math.random() * 30 - 15),
            y: clickY - 14,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -2.4,
            text: `+${formatNumber(sparklesEarned)} ✨`,
            color: '#fde047',
            scale: 1.2,
            life: 0.85
          });
        }
      } else {
        // Autoclicker bursts: throttled to ~200ms interval to keep screen elegant, maximum 4 on screen!
        pendingAutoEarned += totalEarned;
        pendingAutoCrits += critsCount;
        pendingAutoSparkles += (sparklesEarned || 0);

        if (now - lastFloatingTextTime >= 200) {
          const spawnX = w / 2 + (Math.random() * 50 - 25);
          const spawnY = h * 0.44 + (Math.random() * 30 - 15);

          if (pendingAutoCrits > 0) {
            addManagedTextParticle({
              x: spawnX,
              y: spawnY,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -2.3,
              text: `💥 КРИТ! +${formatNumber(pendingAutoEarned)} 💨`,
              color: '#facc15',
              scale: 1.35,
              life: 0.85
            });
          } else {
            addManagedTextParticle({
              x: spawnX,
              y: spawnY,
              vx: (Math.random() - 0.5) * 0.9,
              vy: -1.8,
              text: `+${formatNumber(pendingAutoEarned)} 💨`,
              color: '#38bdf8',
              scale: 1.15,
              life: 0.80
            });
          }

          if (pendingAutoSparkles > 0) {
            addManagedTextParticle({
              x: spawnX + (Math.random() * 30 - 15),
              y: spawnY - 12,
              vx: (Math.random() - 0.5) * 1.0,
              vy: -2.4,
              text: `+${formatNumber(pendingAutoSparkles)} ✨`,
              color: '#fde047',
              scale: 1.2,
              life: 0.85
            });
          }

          pendingAutoEarned = 0;
          pendingAutoCrits = 0;
          pendingAutoSparkles = 0;
          lastFloatingTextTime = now;
        }
      }
    });

    events.on('turbo:activated', () => {
      addVisualParticle('🔥 ТУРБО-РЕЖИМ x10! 🔥', '#ef4444', 1.5, 1.2, -2.5);
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
  knifeSlashTimer = 1.0;
}

export function addManagedTextParticle(p) {
  while (visualParticles.length >= 7) {
    visualParticles.shift();
  }
  visualParticles.push(p);
}

export function addVisualParticle(text, color = '#facc15', scale = 1.2, life = 1.0, vy = -2.2, x = null, y = null) {
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
  const currentEvo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];

  const isGirly = !!(GAME.girlyMode || GAME.gameMode === 'girls');

  // Background
  if (isGirly) {
    const pinkGrad = ctx.createLinearGradient(0, 0, 0, h);
    pinkGrad.addColorStop(0, '#fdf2f8');
    pinkGrad.addColorStop(0.5, '#fce7f3');
    pinkGrad.addColorStop(1, '#fbcfe8');
    ctx.fillStyle = pinkGrad;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = currentEvo.bgColor || '#0284c7';
    ctx.fillRect(0, 0, w, h);

    // Tiles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 45) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
  }

  // Adaptive base scale for smaller screens (mobile / tablet)
  const baseScale = Math.min(1.0, Math.max(0.68, Math.min(w / 380, h / 360)));
  const toiletBaseW = 170 * baseScale;
  const toiletBaseH = 70 * baseScale;
  const toiletWaterW = 120 * baseScale;
  const toiletWaterH = 44 * baseScale;
  const toiletCenterY = h * 0.77;

  // Porcelain Toilet Base
  ctx.fillStyle = isGirly ? '#fff1f2' : '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(w / 2, toiletCenterY, toiletBaseW, toiletBaseH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isGirly ? '#f472b6' : '#cbd5e1';
  ctx.lineWidth = Math.max(2.5, 4 * baseScale);
  ctx.stroke();

  // Toilet Water
  ctx.fillStyle = isGirly ? '#f9a8d4' : '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(w / 2, toiletCenterY + 1 * baseScale, toiletWaterW, toiletWaterH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Smooth Jelly Spring
  squashX += (1 - squashX) * 0.12;
  squashY += (1 - squashY) * 0.12;

  ctx.save();
  ctx.translate(w / 2, toiletCenterY - 45 * baseScale);
  ctx.scale(squashX * baseScale, squashY * baseScale);

  // Aura effects
  const isIdealPet = (GAME.hunger >= 90 && GAME.clean >= 90 && GAME.happy >= 90);
  if (isIdealPet) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
    ctx.beginPath();
    ctx.arc(0, -10, 92 + Math.sin(time * 0.008) * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (GAME.turboRushTime > 0) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.beginPath();
    ctx.arc(0, -10, 85 + Math.sin(time * 0.02) * 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Poop Body Swirls (Girly Mode Kawaii pastel gradient vs Boy/Default evolution color)
  let bodyFill = currentEvo.bodyColor || '#78350f';
  if (isGirly) {
    const bodyGrad = ctx.createLinearGradient(0, -50, 0, 50);
    bodyGrad.addColorStop(0, '#f472b6');
    bodyGrad.addColorStop(0.5, '#fb7185');
    bodyGrad.addColorStop(1, '#f43f5e');
    bodyFill = bodyGrad;
  }

  ctx.fillStyle = bodyFill;
  ctx.beginPath(); ctx.ellipse(0, 32, 65, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 2, 50, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -25, 36, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -32); ctx.quadraticCurveTo(0, -62, 14, -48); ctx.fill();

  // Girly Mode Ribbon Bow on Head Curl
  if (isGirly) {
    ctx.fillStyle = '#fb7185';
    ctx.beginPath(); ctx.ellipse(-12, -48, 9, 5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12, -48, 9, 5, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, -48, 3.5, 0, Math.PI * 2); ctx.fill();
  }

  // Eyes & Blink
  blinkTimer += 0.016;
  const isBlinking = (blinkTimer % 4.0) < 0.15;
  if (!isBlinking) {
    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-14, -6, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14, -6, 10, 13, 0, 0, Math.PI * 2); ctx.fill();

    // Pupils
    ctx.fillStyle = isGirly ? '#3b0764' : '#18181b';
    ctx.beginPath(); ctx.arc(-13, -5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, -5, 5, 0, Math.PI * 2); ctx.fill();

    // Shine highlights (Kawaii double star sparkle in Girly Mode)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-15, -8, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, -8, 2.5, 0, Math.PI * 2); ctx.fill();

    if (isGirly) {
      // Extra bottom sparkle
      ctx.beginPath(); ctx.arc(-11, -3, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(17, -3, 1.5, 0, Math.PI * 2); ctx.fill();

      // Cute eyelashes
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-22, -10); ctx.lineTo(-27, -15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, -10); ctx.lineTo(27, -15); ctx.stroke();
    }
  } else {
    // Closed happy eye curves
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-14, -6, 8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(14, -6, 8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }

  // Cute blushing cheeks in Girly Mode
  if (isGirly) {
    ctx.fillStyle = 'rgba(251, 113, 133, 0.65)';
    ctx.beginPath(); ctx.ellipse(-25, 3, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(25, 3, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Smile
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 8, 10, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Draw Equipped Wardrobe Hat
  if (GAME.equippedHat) {
    drawEquippedHat(ctx, GAME.equippedHat, time, isGirly);
  }

  // Equipped CS:GO Knife in pet hand
  const knife = getEquippedKnife();
  if (knife) {
    ctx.save();
    ctx.translate(42, 10);

    // Slashing rotation arc on click / autoclicker
    let slashAngle = 0.2;
    if (knifeSlashTimer > 0) {
      slashAngle = 0.2 + Math.sin(knifeSlashTimer * Math.PI) * 0.75;
      knifeSlashTimer = Math.max(0, knifeSlashTimer - 0.12);
    }
    ctx.rotate(slashAngle);

    // 1. Сначала рисуем нож (рукоять ложится точно под лапку)
    drawKnifeInHand(ctx, knife, time);

    // 2. Лапка питомца естественно сжимает рукоять поверх ножа
    ctx.fillStyle = isGirly ? '#fbcfe8' : (currentEvo.bodyColor || '#78350f');
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();

  // RENDER GOLDEN METEOR
  if (goldenMeteor.active) {
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
  } else if (Date.now() > nextMeteorSpawn) {
    goldenMeteor.active = true;
    goldenMeteor.life = 750;
    const fromLeft = Math.random() < 0.5;
    goldenMeteor.x = fromLeft ? -30 : w + 30;
    goldenMeteor.y = 80 + Math.random() * Math.max(120, h * 0.6);
    goldenMeteor.vx = (fromLeft ? 1 : -1) * (1.1 + Math.random() * 0.9);
    goldenMeteor.vy = (Math.random() - 0.5) * 0.8;
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
  }

  // 2. High-performance Floating text particles (Max 4, pre-set font outside loop!)
  if (visualParticles.length > 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 16px "Fredoka One", system-ui, -apple-system, sans-serif';
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
    ctx.globalAlpha = 1.0;
  }
  } catch (err) {
    console.error("renderPetLoop error:", err);
  } finally {
    requestAnimationFrame(renderPetLoop);
  }
}

export function catchGoldenMeteor() {
  goldenMeteor.active = false;
  GAME.meteorsCaught = (GAME.meteorsCaught || 0) + 1;

  const hunterTalent = TALENTS.find(t => t.id === 'meteor_hunter');
  const luckBonus = 1 + Math.min(20, GAME.boutiqueLevels?.golden_luck || 0) * 0.25;
  const hunterBonus = 1 + (hunterTalent ? hunterTalent.level * 0.20 : 0);
  const stormBonus = 1 + (GAME.transcendUpgrades?.meteorStorm || 0) * 0.40;
  const lootMult = hunterBonus * luckBonus * stormBonus;

  const roll = Math.random();
  let label = '';
  if (roll < 0.35) {
    GAME.turboRushTime = 8;
    label = '⚡ УЛЬТРА-ЛИХОРАДКА: Турбо 8с!';
  } else if (roll < 0.70) {
    const burst = Math.max(2500 * getClickPower(), getPassiveIncome() * 1200) * lootMult;
    GAME.biomass += burst;
    GAME.allTimeBiomass += burst;
    GAME.cycleBiomass += burst;
    label = `💰 ЗОЛОТОЙ ВЗРЫВ: +${formatNumber(burst)} 💨!`;
  } else if (roll < 0.90) {
    const stageMultiplier = 1 + Math.min(20, (GAME.evoStage || 0) * 0.15);
    const prestigeMultiplier = 1 + Math.min(10, (GAME.totalPrestiges || 0) * 0.25) + Math.min(20, (GAME.totalTranscend || 0) * 1.5);
    const baseSparkles = (150 + Math.random() * 200) * stageMultiplier * prestigeMultiplier * lootMult;
    const spGain = Math.max(100, Math.min(5000000, Math.round(Number.isFinite(baseSparkles) ? baseSparkles : 500)));
    GAME.sparkles = (Number.isFinite(GAME.sparkles) ? GAME.sparkles : 0) + spGain;
    label = `✨ ЗВЕЗДНЫЙ ДОЖДЬ: +${formatNumber(spGain)} Блестяшек!`;
  } else {
    const rollMultiplier = 1 + (GAME.totalPrestiges || 0) * 0.15 + (GAME.totalTranscend || 0) * 1.5;
    const rollGain = Math.max(10, Math.round((15 + Math.random() * 35) * rollMultiplier * lootMult));
    GAME.prestigeRolls = (GAME.prestigeRolls || 0) + rollGain;
    label = `🧻 СВЯЩЕННЫЙ РУЛОН: +${formatNumber(rollGain)} Втулок Судьбы!`;
  }

  addVisualParticle(label, '#facc15', 1.6, 2.2, -2.5);

  scheduleNextMeteor();
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

  let nearestShower = -1;
  let nearestDist = Infinity;
  showerMeteors.forEach((meteor, index) => {
    const dist = Math.hypot(clickX - meteor.x, clickY - meteor.y);
    if (dist < meteor.radius + 14 && dist < nearestDist) {
      nearestDist = dist;
      nearestShower = index;
    }
  });

  if (goldenMeteor.active) {
    const goldenDist = Math.hypot(clickX - goldenMeteor.x, clickY - goldenMeteor.y);
    if (goldenDist < goldenMeteor.radius + 18 && goldenDist <= nearestDist) {
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
  addVisualParticle('🌠 ЗВЁЗДНЫЙ РОЙ! Лови звёзды 12с', '#67e8f9', 1.5, 2.2, -2.2);
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

  for (let i = showerMeteors.length - 1; i >= 0; i--) {
    const meteor = showerMeteors[i];
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

function catchShowerMeteor(index) {
  if (!showerMeteors[index]) return;
  showerMeteors.splice(index, 1);
  GAME.meteorsCaught = (GAME.meteorsCaught || 0) + 1;
  const sparkGain = Math.max(8, Math.round(18 + Math.random() * 36));
  GAME.sparkles = (Number(GAME.sparkles) || 0) + sparkGain;
  addVisualParticle(`⭐ +${formatNumber(sparkGain)} ✨`, '#fde68a', 1.05);
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

// DRAW KNIFE IN PET HAND WITH DYNAMIC SHADERS & VECTOR MODELS
function drawKnifeInHand(ctx, knife, time) {
  if (!knife) return;
  drawKnifeVectorOnCanvas(ctx, knife, time);
}
