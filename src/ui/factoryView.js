import { factoryName, factoryTier } from '../i18n/localize.js';
import { t, onLocaleChange } from '../i18n/t.js';
import { GAME } from '../core/state.js?v=5.0.79';
import { FACTORIES } from '../data/factories.data.js?v=5.0.79';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.79';
import { getAffordableFactoryInfo } from '../economy/costs.js?v=5.0.79';
import { buyFactory } from '../systems/factoryService.js?v=5.0.79';
import { updateHUD, openRateBreakdown } from './hudView.js?v=5.0.79';
import { factoryMilestoneRank, getFactoryBreakdown } from '../economy/production.js?v=5.0.79';
import { saveLocal } from '../save/saveManager.js?v=5.0.79';
import { getPhaseForStage } from '../progression/phases.data.js?v=5.0.79';
import { buyHorizonUpgrade, horizonOpen, horizonShopRows, horizonSparkCount } from '../economy/horizon.js?v=5.0.79';
import { mul } from '../utils/big.js?v=5.0.79';
import { drawPlunger } from '../utils/icons.js?v=5.0.79';

let activeFactoryTier = 'all'; // 'all' | '1' | '2' | '3' | '4' | '5'

function horizonEpochWindow() {
  const epoch = getPhaseForStage(GAME.evoStage || 0).id;
  if (epoch < 41) return null;
  const pairStart = epoch % 2 === 0 ? epoch - 1 : epoch;
  return { lo: Math.max(41, pairStart - 2), hi: pairStart + 1 };
}

function factoryVisible(fac) {
  if ((fac.tierNumber || 1) !== 5) {
    if (activeFactoryTier === '5') return false;
    if (activeFactoryTier === 'all') return true;
    return fac.tierNumber === Number(activeFactoryTier);
  }
  const window = horizonEpochWindow();
  if (!window) return false;
  const inWindow = fac.epoch >= window.lo && fac.epoch <= window.hi;
  return (activeFactoryTier === 'all' || activeFactoryTier === '5') && inWindow;
}
let paintedFactoryStage = -1;

export function initFactoryListeners() {
  onLocaleChange(() => {
    const container = document.getElementById('factoriesContainer');
    if (container?.offsetParent) renderFactories();
  });
  document.querySelectorAll('.fac-tier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFactoryTier = btn.dataset.tier;
      renderFactories();
    });
  });
  document.getElementById('factoriesContainer')?.addEventListener('click', (e) => {
    const income = e.target.closest('.factory-income-btn');
    if (!income) return;
    e.preventDefault();
    e.stopPropagation();
    openRateBreakdown(getFactoryBreakdown(income.dataset.id));
  });
}

export function renderFactories() {
  const container = document.getElementById('factoriesContainer');
  if (!container) return;
  paintedFactoryStage = GAME.evoStage || 0;
  container.innerHTML = '';

  // Update tier filter button styles
  document.querySelectorAll('.fac-tier-btn').forEach(b => {
    const isAct = b.dataset.tier === String(activeFactoryTier);
    if (isAct) {
      b.className = 'fac-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 shadow border border-yellow-300';
    } else {
      b.className = 'fac-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold bg-stone-900 text-stone-400 hover:text-yellow-300 border border-stone-800';
    }
  });

  let unownedCount = 0;
  const buyMultiplier = GAME.buyMultiplier || 1;

  const shop = document.getElementById('horizonShop');
  if (shop) {
    if (activeFactoryTier === '5') {
      const sparks = horizonSparkCount();
      const rows = horizonOpen()
        ? horizonShopRows().map((row) => {
          const disabled = row.locked || row.owned || sparks < row.cost;
          return `<button type="button" class="horizon-buy w-full text-left px-3 py-2 rounded-full border border-emerald-700/50 ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-emerald-300'}" data-horizon="${row.id}" ${disabled ? 'disabled' : ''}><b>${row.name}</b> — ${row.text}<br><span class="text-amber-200">${row.label}</span></button>`;
        }).join('')
        : '';
      const horizonLive = !!horizonEpochWindow();
      const closed = horizonLive
        ? ''
        : `<div class="px-3 py-2 rounded-full bg-stone-900 border border-stone-700 text-stone-300">${t('factory.horizonUnlock', { n: formatNumber(20000) })}</div>`;
      const sparkLine = horizonLive
        ? `<div class="px-3 py-2 rounded-full bg-stone-900 border border-emerald-700/40 text-emerald-100">${t('factory.sparks', { n: formatNumber(sparks), spend: formatNumber(100000) })}</div>`
        : '';
      shop.innerHTML = `${sparkLine}${closed}${rows}`;
      shop.classList.remove('hidden');
      shop.querySelectorAll('.horizon-buy').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (buyHorizonUpgrade(btn.dataset.horizon)) {
            renderFactories();
            updateHUD();
            saveLocal();
          }
        });
      });
    } else {
      shop.innerHTML = '';
      shop.classList.add('hidden');
    }
  }

  const visibleFactories = FACTORIES.filter(factoryVisible);

  visibleFactories.forEach((fac) => {
    const currentCount = fac.count || 0;
    const isLocked = fac.reqStage !== undefined && (GAME.evoStage || 0) < fac.reqStage;

    if (currentCount === 0 && activeFactoryTier === 'all' && fac.tierNumber !== 5) {
      unownedCount++;
      // Show up to 2 unowned upcoming tiers, plus the next locked goal
      if (unownedCount > 3) return;
    }

    const facInfo = getAffordableFactoryInfo(fac);
    const canBuy = !isLocked && facInfo.canBuy;

    let nextMilestone = 25;
    let milestoneMultiplierDesc = 'x2';
    if (currentCount >= 25) { nextMilestone = 50; milestoneMultiplierDesc = 'x2'; }
    if (currentCount >= 50) { nextMilestone = 100; milestoneMultiplierDesc = 'x1.5'; }
    if (currentCount >= 100) { nextMilestone = 200; milestoneMultiplierDesc = 'x1.5'; }
    if (currentCount >= 200) { nextMilestone = 500; milestoneMultiplierDesc = 'x1.5'; }
    if (currentCount >= 500) { nextMilestone = 1000; milestoneMultiplierDesc = 'x2'; }
    if (currentCount >= 1000) {
      nextMilestone = (Math.floor(currentCount / 1000) + 1) * 1000;
      milestoneMultiplierDesc = 'x1.5';
    }

    const milestonePct = Math.min(100, Math.round((currentCount / nextMilestone) * 100));
    const milestoneRank = factoryMilestoneRank(currentCount);
    const starCount = Math.min(5, milestoneRank);
    const frameRank = Math.max(0, milestoneRank - 5);
    let starFrame = '';
    let starTitle = t('factory.milestones', { n: formatNumber(milestoneRank) });
    if (frameRank === 1) {
      starFrame = 'border border-slate-200 bg-slate-800/80 shadow-[0_0_6px_rgba(226,232,240,0.75)]';
      starTitle += t('factory.frameSilver');
    } else if (frameRank === 2) {
      starFrame = 'border border-yellow-300 bg-amber-950/80 shadow-[0_0_6px_rgba(250,204,21,0.8)]';
      starTitle += t('factory.frameGold');
    } else if (frameRank >= 3) {
      starFrame = 'border border-cyan-200 bg-cyan-950/70 shadow-[0_0_8px_rgba(103,232,249,0.85)]';
      starTitle += t('factory.frameShine', { n: formatNumber(frameRank - 2) });
    }
    const starsHtml = starCount > 0
      ? `<span class="inline-flex items-center text-[11px] leading-none text-amber-300 rounded px-0.5 ${starFrame}" title="${starTitle}">${'★'.repeat(starCount)}</span>`
      : '';

    const countTxt = buyMultiplier === 'max'
      ? t('factory.maxOwned', { n: formatNumber(facInfo.count) })
      : (buyMultiplier > 1 ? `+${formatNumber(facInfo.count)}` : `+1`);

    let buttonLabel = `${countTxt}: ${formatNumber(facInfo.totalCost)} 💨`;
    if (isLocked) {
      buttonLabel = t('factory.needForm', { n: formatNumber(fac.reqStage + 1) });
    }

    let tierBadge = `<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-stone-800 text-stone-300 border border-stone-700">${t('factory.tier1')}</span>`;
    if (fac.tierNumber === 2) tierBadge = `<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">${t('factory.tier2')}</span>`;
    else if (fac.tierNumber === 3) tierBadge = `<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">${t('factory.tier3')}</span>`;
    else if (fac.tierNumber === 4) tierBadge = `<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-950/80 text-yellow-300 border border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.3)]">${t('factory.tier4')}</span>`;
    else if (fac.tierNumber === 5) tierBadge = `<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950/80 text-emerald-200 border border-emerald-400/50">🌅 ${t('factory.horizon')}</span>`;

    const row = document.createElement('div');
    row.className = `factory-card p-3 rounded-2xl bg-stone-900 border ${isLocked ? 'border-stone-800/60 opacity-75' : 'border-stone-800 hover:border-amber-600'} transition flex flex-col gap-2 shadow-sm`;
    row.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="factory-icon">${drawPlunger(fac.icon)}</span>
          <div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-xs text-stone-200">${factoryName(fac)}</span>
              ${starsHtml}
              ${tierBadge}
              ${isLocked ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-700/50 font-bold">${t('factory.formBadge', { n: fac.reqStage + 1 })}</span>` : ''}
            </div>
            <div class="flex items-center gap-2 text-[11px] font-game flex-wrap">
              <button type="button" class="factory-income-btn text-emerald-400 underline decoration-dotted decoration-emerald-700" data-id="${fac.id}" title="${t('factory.incomeTitle')}">${t('hud.perSec', { n: formatNumber(mul(fac.baseCps, currentCount || 1)) })}</button>
              <span class="text-stone-600">•</span>
              <span class="text-stone-400">${t('factory.each')} <b class="text-amber-300 font-mono">${formatNumber(facInfo.singleCost)} 💨</b></span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <span class="font-game text-sm text-yellow-400 font-bold">${formatNumber(currentCount)}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex-1 bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-800">
          <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400" style="width: ${milestonePct}%"></div>
        </div>
        <span class="text-[9px] text-stone-400 shrink-0 font-bold" title="${t('factory.nextMilestone')}">${t('factory.milestoneProgress', { current: formatNumber(currentCount), next: formatNumber(nextMilestone), mult: milestoneMultiplierDesc })}</span>
      </div>

      <button class="buy-factory-btn w-full py-1.5 px-3 rounded-xl border text-xs font-game transition ${canBuy ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 border-yellow-300 hover:brightness-110 jelly-btn' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'}" data-id="${fac.id}" ${canBuy ? '' : 'disabled'}>
        ${buttonLabel}
      </button>
    `;

    row.querySelector('.buy-factory-btn').addEventListener('click', () => {
      if (buyFactory(fac.id)) {
        renderFactories();
        updateHUD();
        saveLocal();
      }
    });

    container.appendChild(row);
  });
}

export function updateFactoryButtons() {
  const container = document.getElementById('factoriesContainer');
  if (!container || !container.offsetParent) return;
  if ((GAME.evoStage || 0) !== paintedFactoryStage) {
    renderFactories();
    return;
  }

  const buyMultiplier = GAME.buyMultiplier || 1;
  const buttons = container.querySelectorAll('.buy-factory-btn');
  buttons.forEach(btn => {
    const facId = btn.dataset.id;
    const fac = FACTORIES.find(f => f.id === facId);
    if (!fac) return;

    const isLocked = fac.reqStage !== undefined && (GAME.evoStage || 0) < fac.reqStage;
    const facInfo = getAffordableFactoryInfo(fac);
    const canBuy = !isLocked && facInfo.canBuy;

    const countTxt = buyMultiplier === 'max'
      ? t('factory.maxOwned', { n: formatNumber(facInfo.count) })
      : (buyMultiplier > 1 ? `+${formatNumber(facInfo.count)}` : `+1`);

    const newLabel = isLocked
      ? t('factory.needForm', { n: formatNumber(fac.reqStage + 1) })
      : `${countTxt}: ${formatNumber(facInfo.totalCost)} 💨`;

    if (btn.textContent.trim() !== newLabel) {
      btn.textContent = newLabel;
    }

    if (btn.disabled !== !canBuy) {
      btn.disabled = !canBuy;
      btn.className = canBuy
        ? 'buy-factory-btn w-full py-1.5 px-3 rounded-xl border text-xs font-game transition bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 border-yellow-300 hover:brightness-110 jelly-btn'
        : 'buy-factory-btn w-full py-1.5 px-3 rounded-xl border text-xs font-game transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });
}
