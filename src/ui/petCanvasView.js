import { GAME } from '../core/state.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { getEquippedKnife } from '../economy/production.js';

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
let listenersInitialized = false;

let lastAutoclickParticleTime = 0;

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
      const { clicks, totalEarned, critsCount, clientX, clientY } = res;

      const w = canvas ? canvas.width : 360;
      const h = canvas ? canvas.height : 480;

      let clickX = (clientX !== null && clientX !== undefined && canvas) ? (clientX - canvas.getBoundingClientRect().left) : (w / 2);
      let clickY = (clientY !== null && clientY !== undefined && canvas) ? (clientY - canvas.getBoundingClientRect().top) : (h * 0.48);

      // 1. Lightweight atmospheric spark burst (fast circle batch, zero font cost)
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

      // 2. High-Speed Click Consolidation (The Combo Nexus)
      // When rapid clicks / autoclick occurs, consolidate damage into ONE punchy combo counter!
      if (!isManual) {
        if (activeComboParticle && activeComboParticle.life > 0.25) {
          // Accumulate ongoing stream
          activeComboParticle.totalEarned += totalEarned;
          activeComboParticle.clicks += clicks;
          activeComboParticle.text = `⚡ +${formatNumber(activeComboParticle.totalEarned)} 💨 (x${activeComboParticle.clicks})`;
          activeComboParticle.life = 0.95; // refresh duration while firing
          activeComboParticle.scale = Math.min(1.4, activeComboParticle.scale + 0.04);
          activeComboParticle.y = Math.max(h * 0.35, activeComboParticle.y - 0.5);
          if (activeComboParticle.clicks >= 200 || GAME.turboRushTime > 0) {
            activeComboParticle.color = '#ef4444';
          } else if (activeComboParticle.clicks >= 50) {
            activeComboParticle.color = '#f59e0b';
          }
        } else {
          // Start a new clean combo float
          activeComboParticle = {
            x: w / 2,
            y: h * 0.44,
            vx: 0,
            vy: -0.8,
            totalEarned: totalEarned,
            clicks: clicks,
            text: clicks > 1 ? `⚡ +${formatNumber(totalEarned)} 💨 (x${clicks})` : `+${formatNumber(totalEarned)} 💨`,
            color: critsCount > 0 ? '#f59e0b' : '#38bdf8',
            scale: 1.25,
            life: 1.0,
            isCombo: true
          };
          addManagedTextParticle(activeComboParticle);
        }

        // Spawn a standalone big crit number only if a crit occurred and not overwhelmed
        if (critsCount > 0 && visualParticles.length < 4) {
          addManagedTextParticle({
            x: clickX + (Math.random() * 50 - 25),
            y: clickY - 20,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -2.4,
            text: `💥 КРИТ! +${formatNumber(totalEarned)} 💨`,
            color: '#fbbf24',
            scale: 1.35,
            life: 0.9
          });
        }
        return;
      }

      // 3. Manual Player Clicks (Punchy, responsive feedback directly at cursor)
      const manualLabel = critsCount > 0 
        ? `💥 КРИТ! +${formatNumber(totalEarned)} 💨` 
        : `+${formatNumber(totalEarned)} 💨`;

      addManagedTextParticle({
        x: clickX,
        y: clickY,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -2.0,
        text: manualLabel,
        color: critsCount > 0 ? '#fbbf24' : '#4ade80',
        scale: critsCount > 0 ? 1.4 : 1.2,
        life: 1.0
      });
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
  if (visualParticles.length >= 4) {
    const nonComboIdx = visualParticles.findIndex(vp => !vp.isCombo);
    if (nonComboIdx >= 0) {
      visualParticles.splice(nonComboIdx, 1);
    } else {
      visualParticles.shift();
    }
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

  // Porcelain Toilet Base
  ctx.fillStyle = isGirly ? '#fff1f2' : '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.76, 170, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isGirly ? '#f472b6' : '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Toilet Water
  ctx.fillStyle = isGirly ? '#f9a8d4' : '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.77, 120, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  // Smooth Jelly Spring
  squashX += (1 - squashX) * 0.12;
  squashY += (1 - squashY) * 0.12;

  ctx.save();
  ctx.translate(w / 2, h * 0.63);
  ctx.scale(squashX, squashY);

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

    // Cute pet hand holding the blade
    ctx.fillStyle = isGirly ? '#fbcfe8' : (currentEvo.bodyColor || '#78350f');
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawCSGOKnife(ctx, knife, time);
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
      nextMeteorSpawn = Date.now() + 40000 + Math.random() * 30000;
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
        if (p === activeComboParticle) activeComboParticle = null;
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

  requestAnimationFrame(renderPetLoop);
}

export function catchGoldenMeteor() {
  goldenMeteor.active = false;
  GAME.meteorsCaught = (GAME.meteorsCaught || 0) + 1;

  const hunterTalent = TALENTS.find(t => t.id === 'meteor_hunter');
  const luckBonus = 1 + (GAME.boutiqueLevels?.golden_luck || 0) * 0.25;
  const rewardMult = (1 + (hunterTalent ? hunterTalent.level * 0.25 : 0)) * luckBonus;

  const roll = Math.random();
  let label = '';
  if (roll < 0.35) {
    GAME.turboRushTime = 15;
    label = '⚡ УЛЬТРА-ЛИХОРАДКА: КЛИК x777 (15с)!';
  } else if (roll < 0.70) {
    const burst = Math.max(2500 * getClickPower(), getPassiveIncome() * 1200) * rewardMult;
    GAME.biomass += burst;
    GAME.allTimeBiomass += burst;
    GAME.cycleBiomass += burst;
    label = `💰 ЗОЛОТОЙ ВЗРЫВ: +${formatNumber(burst)} 💨!`;
  } else if (roll < 0.90) {
    const spGain = Math.round((75 + Math.random() * 175) * rewardMult);
    GAME.sparkles += spGain;
    label = `✨ ЗВЕЗДНЫЙ ДОЖДЬ: +${spGain} Блестяшек!`;
  } else {
    const rollGain = Math.round((5 + Math.random() * 20) * rewardMult);
    GAME.prestigeRolls += rollGain;
    label = `🧻 СВЯЩЕННЫЙ РУЛОН: +${rollGain} Втулок Судьбы!`;
  }

  addVisualParticle(label, '#facc15', 1.6, 2.2, -2.5);

  const nextInterval = (40000 + Math.random() * 35000) * (SHOP_ITEMS.find(i => i.id === 'upg_meteor_magnet')?.owned ? 0.6 : 1.0);
  nextMeteorSpawn = Date.now() + nextInterval;

  checkAchievements();
  updateHUD();
  saveLocal();
  requestCloudSync(2500);
}

export function checkMeteorClick(clientX, clientY) {
  if (!goldenMeteor.active || !canvas) return false;
  const rect = canvas.getBoundingClientRect();
  const clickX = clientX - rect.left;
  const clickY = clientY - rect.top;
  const dist = Math.hypot(clickX - goldenMeteor.x, clickY - goldenMeteor.y);
  if (dist < goldenMeteor.radius + 18) {
    catchGoldenMeteor();
    return true;
  }
  return false;
}

// DRAW CS:GO KNIFE IN PET HAND WITH DYNAMIC SHADERS & VECTOR MODELS
function drawCSGOKnife(ctx, knife, time) {
  if (!knife) return;
  ctx.save();
  ctx.translate(8, -2);

  // Dynamic CS:GO Blade Gradients & Shaders
  let bladeFill = knife.bladeColor;
  if (knife.bladeColor === 'fade') {
    const fadeGrad = ctx.createLinearGradient(0, -6, 50, 10);
    fadeGrad.addColorStop(0, '#facc15'); // 100% Fade Gold
    fadeGrad.addColorStop(0.35, '#f43f5e'); // Pink
    fadeGrad.addColorStop(0.7, '#8b5cf6'); // Purple
    fadeGrad.addColorStop(1, '#06b6d4'); // Electric Blue
    bladeFill = fadeGrad;
  } else if (knife.bladeColor === 'marble') {
    const marbleGrad = ctx.createLinearGradient(0, -6, 50, 10);
    marbleGrad.addColorStop(0, '#ef4444');
    marbleGrad.addColorStop(0.5, '#3b82f6');
    marbleGrad.addColorStop(1, '#eab308');
    bladeFill = marbleGrad;
  } else if (knife.bladeColor === 'fire_ice') {
    const fiGrad = ctx.createLinearGradient(0, -6, 50, 10);
    fiGrad.addColorStop(0, '#ef4444'); // Max Fire
    fiGrad.addColorStop(0.5, '#3b82f6'); // Max Ice
    fiGrad.addColorStop(1, '#06b6d4');
    bladeFill = fiGrad;
  } else if (knife.bladeColor === 'lore') {
    const loreGrad = ctx.createLinearGradient(0, -6, 50, 10);
    loreGrad.addColorStop(0, '#fef08a');
    loreGrad.addColorStop(0.4, '#eab308');
    loreGrad.addColorStop(1, '#ca8a04');
    bladeFill = loreGrad;
  } else if (knife.bladeColor === 'ruby') {
    const rubyGrad = ctx.createLinearGradient(0, -6, 50, 10);
    rubyGrad.addColorStop(0, '#f87171');
    rubyGrad.addColorStop(0.5, '#dc2626');
    rubyGrad.addColorStop(1, '#991b1b');
    bladeFill = rubyGrad;
  } else if (knife.bladeColor === 'sapphire') {
    const saphGrad = ctx.createLinearGradient(0, -6, 50, 10);
    saphGrad.addColorStop(0, '#60a5fa');
    saphGrad.addColorStop(0.5, '#2563eb');
    saphGrad.addColorStop(1, '#1e3a8a');
    bladeFill = saphGrad;
  } else if (knife.bladeColor === 'emerald') {
    const emGrad = ctx.createLinearGradient(0, -6, 50, 10);
    emGrad.addColorStop(0, '#34d399');
    emGrad.addColorStop(0.5, '#059669');
    emGrad.addColorStop(1, '#064e3b');
    bladeFill = emGrad;
  } else if (knife.bladeColor === 'bluegem') {
    const bgGrad = ctx.createLinearGradient(0, -6, 50, 10);
    bgGrad.addColorStop(0, '#38bdf8');
    bgGrad.addColorStop(0.7, '#0284c7');
    bgGrad.addColorStop(1, '#ca8a04');
    bladeFill = bgGrad;
  } else if (knife.bladeColor === 'tiger') {
    const tigerGrad = ctx.createLinearGradient(0, -6, 50, 10);
    tigerGrad.addColorStop(0, '#fef08a');
    tigerGrad.addColorStop(0.5, '#f59e0b');
    tigerGrad.addColorStop(1, '#b45309');
    bladeFill = tigerGrad;
  } else if (knife.bladeColor === 'slaughter') {
    const slGrad = ctx.createLinearGradient(0, -6, 50, 10);
    slGrad.addColorStop(0, '#f87171');
    slGrad.addColorStop(0.5, '#b91c1c');
    slGrad.addColorStop(1, '#7f1d1d');
    bladeFill = slGrad;
  } else if (knife.bladeColor === 'crimson') {
    const cwGrad = ctx.createLinearGradient(0, -6, 50, 10);
    cwGrad.addColorStop(0, '#ef4444');
    cwGrad.addColorStop(1, '#7f1d1d');
    bladeFill = cwGrad;
  } else if (knife.bladeColor === 'autotronic') {
    const atGrad = ctx.createLinearGradient(0, -6, 50, 10);
    atGrad.addColorStop(0, '#e4e4e7');
    atGrad.addColorStop(0.6, '#71717a');
    atGrad.addColorStop(1, '#ef4444');
    bladeFill = atGrad;
  } else if (knife.bladeColor === 'damascus') {
    const damGrad = ctx.createLinearGradient(0, -6, 50, 10);
    damGrad.addColorStop(0, '#f4f4f5');
    damGrad.addColorStop(0.3, '#71717a');
    damGrad.addColorStop(0.6, '#d4d4d8');
    damGrad.addColorStop(1, '#52525b');
    bladeFill = damGrad;
  } else if (knife.bladeColor === 'hyper') {
    const hypGrad = ctx.createLinearGradient(0, -6, 50, 10);
    hypGrad.addColorStop(0, '#06b6d4');
    hypGrad.addColorStop(0.5, '#ec4899');
    hypGrad.addColorStop(1, '#8b5cf6');
    bladeFill = hypGrad;
  } else if (knife.bladeColor === 'printstream') {
    const psGrad = ctx.createLinearGradient(0, -6, 50, 10);
    psGrad.addColorStop(0, '#ffffff');
    psGrad.addColorStop(0.5, '#f1f5f9');
    psGrad.addColorStop(1, '#e2e8f0');
    bladeFill = psGrad;
  } else if (knife.bladeColor === 'doppler_pink') {
    const dpGrad = ctx.createLinearGradient(0, -6, 50, 10);
    dpGrad.addColorStop(0, '#f472b6');
    dpGrad.addColorStop(0.6, '#db2777');
    dpGrad.addColorStop(1, '#581c87');
    bladeFill = dpGrad;
  } else if (knife.bladeColor === 'doppler_blue') {
    const dbGrad = ctx.createLinearGradient(0, -6, 50, 10);
    dbGrad.addColorStop(0, '#38bdf8');
    dbGrad.addColorStop(0.6, '#1d4ed8');
    dbGrad.addColorStop(1, '#0f172a');
    bladeFill = dbGrad;
  } else if (knife.bladeColor === 'rainbow') {
    const rbGrad = ctx.createLinearGradient(0, -6, 50, 10);
    rbGrad.addColorStop(0, '#ef4444');
    rbGrad.addColorStop(0.18, '#f97316');
    rbGrad.addColorStop(0.36, '#eab308');
    rbGrad.addColorStop(0.54, '#22c55e');
    rbGrad.addColorStop(0.72, '#06b6d4');
    rbGrad.addColorStop(0.9, '#8b5cf6');
    rbGrad.addColorStop(1, '#ec4899');
    bladeFill = rbGrad;
  } else if (knife.bladeColor === 'celestial') {
    const celGrad = ctx.createLinearGradient(0, -6, 50, 10);
    celGrad.addColorStop(0, '#ffffff');
    celGrad.addColorStop(0.4, '#67e8f9');
    celGrad.addColorStop(0.8, '#0284c7');
    celGrad.addColorStop(1, '#facc15');
    bladeFill = celGrad;
  } else if (knife.bladeColor === 'titanium') {
    const titGrad = ctx.createLinearGradient(0, -6, 50, 10);
    titGrad.addColorStop(0, '#f1f5f9');
    titGrad.addColorStop(0.5, '#64748b');
    titGrad.addColorStop(0.85, '#2dd4bf');
    titGrad.addColorStop(1, '#0f766e');
    bladeFill = titGrad;
  } else if (knife.bladeColor === 'godly') {
    const godGrad = ctx.createLinearGradient(0, -6, 50, 10);
    godGrad.addColorStop(0, '#fef08a');
    godGrad.addColorStop(0.4, '#f59e0b');
    godGrad.addColorStop(0.7, '#7e22ce');
    godGrad.addColorStop(1, '#000000');
    bladeFill = godGrad;
  }

  ctx.fillStyle = knife.handleColor || '#18181b';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.5;

  if (knife.style === 'karambit' || knife.style === 'talon') {
    ctx.beginPath();
    ctx.arc(-8, -3, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-8, -3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = knife.handleColor || '#18181b';
    ctx.beginPath();
    ctx.moveTo(-3, -5);
    ctx.lineTo(12, -2);
    ctx.lineTo(10, 6);
    ctx.lineTo(-5, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = bladeFill;
    ctx.beginPath();
    ctx.moveTo(10, -3);
    ctx.quadraticCurveTo(34, -7, 48, 14);
    ctx.quadraticCurveTo(28, 8, 10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#18181b';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(12, -2);
    ctx.quadraticCurveTo(30, -5, 46, 12);
    ctx.stroke();
  } else if (knife.style === 'butterfly') {
    ctx.fillStyle = knife.handleColor || '#4c1d95';
    ctx.fillRect(-6, -9, 17, 5);
    ctx.fillRect(-6, 4, 17, 5);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.arc(10, -6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, 6, 2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = bladeFill;
    ctx.beginPath();
    ctx.moveTo(11, -4);
    ctx.lineTo(44, -1);
    ctx.lineTo(48, 0);
    ctx.lineTo(44, 1);
    ctx.lineTo(11, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (knife.style === 'katana') {
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(10, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = knife.handleColor || '#18181b';
    ctx.fillRect(-12, -3.5, 20, 7);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-11, -2, 2, 4);
    ctx.fillRect(-6, -2, 2, 4);
    ctx.fillRect(-1, -2, 2, 4);

    ctx.fillStyle = bladeFill;
    ctx.beginPath();
    ctx.moveTo(10, -3);
    ctx.quadraticCurveTo(38, -7, 60, -3);
    ctx.lineTo(62, -1);
    ctx.quadraticCurveTo(38, 2, 10, 3);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (knife.style === 'bayonet' || knife.style === 'm9') {
    ctx.fillStyle = '#52525b';
    ctx.fillRect(8, -10, 4, 20);
    ctx.fillStyle = knife.handleColor || '#27272a';
    ctx.fillRect(-8, -4, 16, 8);
    ctx.fillStyle = bladeFill;
    ctx.beginPath();
    ctx.moveTo(12, -5); ctx.lineTo(44, -5); ctx.lineTo(52, 0); ctx.lineTo(12, 5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#18181b';
    for (let s = 16; s < 34; s += 4) {
      ctx.beginPath(); ctx.moveTo(s, -5); ctx.lineTo(s + 2, -8); ctx.lineTo(s + 4, -5); ctx.fill();
    }
  } else {
    // Bowie / Huntsman / Skeleton / Stiletto / Classic / Navaja
    ctx.fillStyle = knife.handleColor || '#1c1917';
    ctx.fillRect(-6, -4, 16, 8);
    ctx.fillStyle = bladeFill;
    ctx.beginPath();
    ctx.moveTo(10, -5); ctx.lineTo(38, -6); ctx.lineTo(48, 2); ctx.lineTo(10, 5); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  // Specular Shine Glint
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(36, -1, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
