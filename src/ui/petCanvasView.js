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

let canvas = null;
let ctx = null;
let squashX = 1, squashY = 1;
let blinkTimer = 0;
let knifeSlashTimer = 0;
export const visualParticles = [];

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

export function initPetCanvas() {
  canvas = document.getElementById('petCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
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

export function addVisualParticle(text, color = '#facc15', scale = 1.4, life = 1.5, vy = -2.5) {
  if (!canvas) return;
  visualParticles.push({
    x: canvas.width / 2 + (Math.random() * 80 - 40),
    y: canvas.height * 0.45,
    text,
    color,
    scale,
    life,
    vy
  });
}

function renderPetLoop(time) {
  if (!canvas || !ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const currentEvo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];

  // Background
  if (GAME.girlyMode) {
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
  ctx.fillStyle = GAME.girlyMode ? '#fff1f2' : '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.76, 170, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GAME.girlyMode ? '#f472b6' : '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Toilet Water
  ctx.fillStyle = GAME.girlyMode ? '#f9a8d4' : '#38bdf8';
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

  // Poop Body Swirls
  ctx.fillStyle = currentEvo.bodyColor || '#78350f';
  ctx.beginPath(); ctx.ellipse(0, 32, 65, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 2, 50, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -25, 36, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -32); ctx.quadraticCurveTo(0, -62, 14, -48); ctx.fill();

  // Eyes & Blink
  blinkTimer += 0.016;
  const isBlinking = (blinkTimer % 4.0) < 0.15;
  if (!isBlinking) {
    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-14, -6, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14, -6, 10, 13, 0, 0, Math.PI * 2); ctx.fill();

    // Pupils
    ctx.fillStyle = '#18181b';
    ctx.beginPath(); ctx.arc(-13, -5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, -5, 5, 0, Math.PI * 2); ctx.fill();

    // Shine highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-15, -8, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, -8, 2.5, 0, Math.PI * 2); ctx.fill();
  } else {
    // Closed happy eye curves
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-14, -6, 8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(14, -6, 8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }

  // Smile
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 8, 10, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Equipped Knife in hand
  const knife = getEquippedKnife();
  if (knife) {
    ctx.save();
    ctx.translate(45, 15);
    ctx.rotate(knifeSlashTimer > 0 ? Math.sin(time * 0.05) * 0.4 : 0);
    ctx.fillStyle = knife.bladeColor === 'rainbow' ? '#f43f5e' : (knife.bladeColor || '#94a3b8');
    ctx.fillRect(0, -3, 30, 6);
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

  // Floating text particles
  for (let i = visualParticles.length - 1; i >= 0; i--) {
    const p = visualParticles[i];
    p.y += p.vy;
    p.life -= 0.025;

    ctx.save();
    ctx.font = `bold ${Math.round(15 * p.scale)}px "Fredoka One", cursive`;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();

    if (p.life <= 0) visualParticles.splice(i, 1);
  }

  requestAnimationFrame(renderPetLoop);
}

export function catchGoldenMeteor() {
  goldenMeteor.active = false;
  GAME.meteorsCaught = (GAME.meteorsCaught || 0) + 1;

  const hunterTalent = TALENTS.find(t => t.id === 'meteor_hunter');
  const rewardMult = 1 + (hunterTalent ? hunterTalent.level * 0.25 : 0);

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
