import { GAME } from '../core/state.js?v=5.4.1';
import { KNIVES } from '../data/knives.data.js?v=5.4.1';
import {
  getKnifeStar,
  getKnifeSharpenCost,
  getKnifeSharpenChance,
  canSharpenKnife,
  applyKnifeSharpen
} from '../systems/knifeService.js';
import { knifeName } from '../i18n/localize.js';
import { formatNumber } from '../utils/numberFormatter.js?v=5.4.1';
import { updateHUD } from './hudView.js?v=5.4.1';
import { renderCharacterInventory } from './characterInventoryView.js';
import { saveLocal } from '../save/saveManager.js?v=5.4.1';
import { t } from '../i18n/t.js';

let currentKnifeId = null;
let currentRotation = 0;
let isSpinning = false;
let animFrameId = null;

export function openSharpenWheelModal(knifeId, autoSpin = false) {
  const modal = document.getElementById('knifeSharpenModal');
  if (!modal) return;

  const knife = KNIVES.find(k => k.id === knifeId);
  if (!knife) return;

  currentKnifeId = knifeId;
  modal.classList.remove('hidden');

  updateModalUI();
  drawWheel(currentRotation, getKnifeSharpenChance(knifeId));

  const resultTitle = document.getElementById('sharpenResultTitle');
  const resultDesc = document.getElementById('sharpenResultDesc');
  if (resultTitle) {
    resultTitle.className = 'font-game text-base sm:text-lg font-black text-amber-300';
    resultTitle.textContent = 'Колесо Кузнеца';
  }
  if (resultDesc) {
    resultDesc.className = 'text-[11px] text-stone-400 font-game';
    resultDesc.textContent = 'Испытай удачу, чтобы повысить звёзды клинка!';
  }

  if (autoSpin) {
    startWheelSpin();
  }
}

export function closeSharpenWheelModal() {
  if (isSpinning) return;
  const modal = document.getElementById('knifeSharpenModal');
  if (modal) modal.classList.add('hidden');
  if (animFrameId) cancelAnimationFrame(animFrameId);
}

function updateModalUI() {
  if (!currentKnifeId) return;
  const knife = KNIVES.find(k => k.id === currentKnifeId);
  if (!knife) return;

  const check = canSharpenKnife(currentKnifeId);
  const curStar = getKnifeStar(currentKnifeId);
  const costInfo = getKnifeSharpenCost(knife);
  const chance = getKnifeSharpenChance(currentKnifeId);
  const chancePct = Math.round(chance * 100);

  // Icon, name, stars
  const iconEl = document.getElementById('sharpenKnifeIcon');
  const nameEl = document.getElementById('sharpenKnifeName');
  const starsEl = document.getElementById('sharpenKnifeStars');
  const chanceBadge = document.getElementById('sharpenChanceBadge');
  const costBadge = document.getElementById('sharpenCostBadge');
  const btnSpin = document.getElementById('btnSpinSharpenWheel');
  const btnLabel = document.getElementById('btnSpinSharpenLabel');

  if (iconEl) iconEl.textContent = knife.icon || '🔪';
  if (nameEl) nameEl.textContent = knifeName(knife);
  if (starsEl) {
    starsEl.textContent = costInfo.maxReached
      ? `★${curStar} (${t('common.max')})`
      : `★${curStar} ➔ ★${curStar + 1}`;
  }
  if (chanceBadge) {
    chanceBadge.textContent = `${chancePct}% шанс`;
    chanceBadge.className = chancePct >= 80
      ? 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
      : (chancePct >= 60
        ? 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
        : 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40');
  }
  if (costBadge) {
    costBadge.textContent = costInfo.maxReached ? '★ МАКС' : `${formatNumber(costInfo.cost)} ✨`;
  }

  if (btnSpin && btnLabel) {
    if (isSpinning) {
      btnSpin.disabled = true;
      btnLabel.textContent = 'Колесо вращается...';
    } else if (costInfo.maxReached) {
      btnSpin.disabled = true;
      btnLabel.textContent = '★ Максимальная заточка';
    } else if ((GAME.sparkles || 0) < costInfo.cost) {
      btnSpin.disabled = true;
      btnLabel.textContent = `Нужно ${formatNumber(costInfo.cost)} ✨`;
    } else {
      btnSpin.disabled = false;
      btnLabel.textContent = `Заточить за ${formatNumber(costInfo.cost)} ✨`;
    }
  }
}

function drawWheel(rotationAngle, successChance) {
  const canvas = document.getElementById('sharpenWheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const outerR = 122;
  const innerR = 26;

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationAngle);

  const twoPi = Math.PI * 2;
  const clampedChance = Math.max(0, Math.min(1, successChance));
  const successEndAngle = clampedChance * twoPi;

  // 1. Success Sector (Green)
  if (clampedChance > 0) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, outerR, 0, successEndAngle);
    ctx.closePath();

    const greenGrad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
    greenGrad.addColorStop(0, '#10b981');
    greenGrad.addColorStop(1, '#047857');
    ctx.fillStyle = greenGrad;
    ctx.fill();

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Success text along sector
    if (clampedChance >= 0.12) {
      ctx.save();
      const midAngle = successEndAngle / 2;
      ctx.rotate(midAngle);
      ctx.translate(outerR * 0.62, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText('УСПЕХ', 0, 0);
      ctx.restore();
    }
  }

  // 2. Failure Sector (Red)
  if (clampedChance < 1) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, outerR, successEndAngle, twoPi);
    ctx.closePath();

    const redGrad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
    redGrad.addColorStop(0, '#ef4444');
    redGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = redGrad;
    ctx.fill();

    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fail text along sector
    const failSpan = 1 - clampedChance;
    if (failSpan >= 0.12) {
      ctx.save();
      const midAngle = successEndAngle + (failSpan * twoPi) / 2;
      ctx.rotate(midAngle);
      ctx.translate(outerR * 0.62, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText('СРЫВ', 0, 0);
      ctx.restore();
    }
  }

  // 3. Dividing Line
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(outerR, 0);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  if (clampedChance < 1) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(outerR * Math.cos(successEndAngle), outerR * Math.sin(successEndAngle));
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // 4. Outer Rim & Rivets
  ctx.beginPath();
  ctx.arc(0, 0, outerR - 2, 0, twoPi);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.stroke();

  for (let i = 0; i < 16; i++) {
    const rivetA = (i * twoPi) / 16;
    const rx = (outerR - 6) * Math.cos(rivetA);
    const ry = (outerR - 6) * Math.sin(rivetA);
    ctx.beginPath();
    ctx.arc(rx, ry, 2, 0, twoPi);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
  }

  // 5. Center Hub
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, twoPi);
  const hubGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, innerR);
  hubGrad.addColorStop(0, '#292524');
  hubGrad.addColorStop(1, '#0c0a09');
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Hub Icon
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 15px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⭐', 0, 0);

  ctx.restore();
}

function startWheelSpin() {
  if (isSpinning || !currentKnifeId) return;

  const check = canSharpenKnife(currentKnifeId);
  if (!check.can) {
    updateModalUI();
    return;
  }

  const chance = getKnifeSharpenChance(currentKnifeId);
  const isSuccess = Math.random() < chance;

  isSpinning = true;
  updateModalUI();

  const resultTitle = document.getElementById('sharpenResultTitle');
  const resultDesc = document.getElementById('sharpenResultDesc');
  if (resultTitle) {
    resultTitle.className = 'font-game text-base sm:text-lg font-bold text-yellow-300 animate-pulse';
    resultTitle.textContent = 'Колесо вращается...';
  }
  if (resultDesc) {
    resultDesc.className = 'text-[11px] text-stone-400 font-game';
    resultDesc.textContent = 'Закалка клинка в огне кузницы!';
  }

  // Target local angle under top pointer (-π / 2):
  // localAngle = (-π/2 - R) mod 2π => R = -π/2 - targetLocalAngle + 2π * fullSpins
  const twoPi = Math.PI * 2;
  let targetLocalAngle = 0;

  if (isSuccess) {
    // Pick safely inside [0, chance * 2π]
    const minA = Math.min(chance * twoPi * 0.15, 0.15);
    const maxA = Math.max(chance * twoPi * 0.85, chance * twoPi - 0.15);
    targetLocalAngle = minA + Math.random() * Math.max(0.05, maxA - minA);
  } else {
    // Pick safely inside [chance * 2π, 2π]
    const failSpan = (1 - chance) * twoPi;
    const minA = chance * twoPi + Math.min(failSpan * 0.15, 0.15);
    const maxA = chance * twoPi + Math.max(failSpan * 0.85, failSpan - 0.15);
    targetLocalAngle = minA + Math.random() * Math.max(0.05, maxA - minA);
  }

  const fullSpins = 5 + Math.floor(Math.random() * 2);
  let finalRotation = -Math.PI / 2 - targetLocalAngle + twoPi * fullSpins;

  // Make sure finalRotation is ahead of currentRotation
  while (finalRotation < currentRotation + 4 * twoPi) {
    finalRotation += twoPi;
  }

  const startRotation = currentRotation;
  const duration = 1800; // 1.8 seconds
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // Smooth ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3);

    currentRotation = startRotation + (finalRotation - startRotation) * ease;
    drawWheel(currentRotation, chance);

    if (progress < 1) {
      animFrameId = requestAnimationFrame(animate);
    } else {
      currentRotation = finalRotation;
      drawWheel(currentRotation, chance);
      onSpinComplete(isSuccess);
    }
  }

  animFrameId = requestAnimationFrame(animate);
}

function onSpinComplete(isSuccess) {
  isSpinning = false;
  if (!currentKnifeId) return;

  const res = applyKnifeSharpen(currentKnifeId, isSuccess);

  updateHUD();
  renderCharacterInventory();
  saveLocal();
  updateModalUI();

  const resultTitle = document.getElementById('sharpenResultTitle');
  const resultDesc = document.getElementById('sharpenResultDesc');

  if (res.success) {
    if (resultTitle) {
      resultTitle.className = 'font-game text-lg sm:text-xl font-black text-emerald-400 animate-bounce';
      resultTitle.textContent = '🎉 УСПЕХ!';
    }
    if (resultDesc) {
      resultDesc.className = 'text-[11px] text-emerald-200 font-bold';
      resultDesc.textContent = `Уровень заточки повышен до ★${res.newStar}! Бонус к урону усилен!`;
    }
  } else {
    if (resultTitle) {
      resultTitle.className = 'font-game text-lg sm:text-xl font-black text-rose-400';
      resultTitle.textContent = '❌ ПРОИГРЫШ';
    }
    if (resultDesc) {
      resultDesc.className = 'text-[11px] text-rose-300 font-bold';
      resultDesc.textContent = res.msg || 'Заточка сорвалась! Звезда понижена.';
    }
  }
}

export function initSharpenView() {
  const btnClose = document.getElementById('btnCloseSharpenModal');
  if (btnClose) {
    btnClose.addEventListener('click', closeSharpenWheelModal);
  }

  const btnSpin = document.getElementById('btnSpinSharpenWheel');
  if (btnSpin) {
    btnSpin.addEventListener('click', () => {
      startWheelSpin();
    });
  }
}
