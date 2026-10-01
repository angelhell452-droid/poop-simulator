import { GAME } from '../core/state.js';
import { FACTORIES } from '../data/factories.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getAffordableFactoryInfo } from '../economy/costs.js';
import { buyFactory } from '../systems/factoryService.js';
import { updateHUD } from './hudView.js';
import { saveLocal } from '../save/saveManager.js';

let activeFactoryTier = 'all'; // 'all' | '1' | '2' | '3' | '4'

export function initFactoryListeners() {
  document.querySelectorAll('.fac-tier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFactoryTier = btn.dataset.tier;
      renderFactories();
    });
  });
}

export function renderFactories() {
  const container = document.getElementById('factoriesContainer');
  if (!container) return;
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

  const visibleFactories = activeFactoryTier === 'all'
    ? FACTORIES
    : FACTORIES.filter(fac => fac.tierNumber === Number(activeFactoryTier));

  visibleFactories.forEach((fac) => {
    const currentCount = fac.count || 0;
    const isLocked = fac.reqStage !== undefined && (GAME.evoStage || 0) < fac.reqStage;

    if (currentCount === 0 && activeFactoryTier === 'all') {
      unownedCount++;
      // Show up to 2 unowned upcoming tiers, plus the next locked goal
      if (unownedCount > 3) return;
    }

    const facInfo = getAffordableFactoryInfo(fac);
    const canBuy = !isLocked && facInfo.canBuy;

    let nextMilestone = 25;
    let milestoneMultiplierDesc = 'x2';
    if (currentCount >= 25) { nextMilestone = 50; milestoneMultiplierDesc = 'x2'; }
    if (currentCount >= 50) { nextMilestone = 100; milestoneMultiplierDesc = 'x4'; }
    if (currentCount >= 100) { nextMilestone = 200; milestoneMultiplierDesc = 'x4'; }
    if (currentCount >= 200) { nextMilestone = 500; milestoneMultiplierDesc = 'x8'; }
    if (currentCount >= 500) { nextMilestone = 1000; milestoneMultiplierDesc = 'x16'; }
    if (currentCount >= 1000) {
      nextMilestone = (Math.floor(currentCount / 1000) + 1) * 1000;
      milestoneMultiplierDesc = 'x10';
    }

    const milestonePct = Math.min(100, Math.round((currentCount / nextMilestone) * 100));

    const countTxt = buyMultiplier === 'max'
      ? `+${facInfo.count} (МАКС)`
      : (buyMultiplier > 1 ? `+${facInfo.count}` : `+1`);

    let buttonLabel = `${countTxt}: ${formatNumber(facInfo.totalCost)} 💨`;
    if (isLocked) {
      buttonLabel = `🔒 Требуется Форма #${fac.reqStage + 1}`;
    }

    let tierBadge = `<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-stone-800 text-stone-300 border border-stone-700">⭐ Т1</span>`;
    if (fac.tierNumber === 2) tierBadge = `<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">⚡ Т2</span>`;
    else if (fac.tierNumber === 3) tierBadge = `<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">🔮 Т3</span>`;
    else if (fac.tierNumber === 4) tierBadge = `<span class="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-950/80 text-yellow-300 border border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.3)]">🌌 Т4</span>`;

    const row = document.createElement('div');
    row.className = `p-3 rounded-2xl bg-stone-900 border ${isLocked ? 'border-stone-800/60 opacity-75' : 'border-stone-800 hover:border-amber-600'} transition flex flex-col gap-2 shadow-sm`;
    row.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">${fac.icon}</span>
          <div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-xs text-stone-200">${fac.name}</span>
              ${tierBadge}
              ${isLocked ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-700/50 font-bold">Форма #${fac.reqStage + 1}</span>` : ''}
            </div>
            <div class="text-[11px] text-emerald-400 font-game">+${formatNumber(fac.baseCps * (currentCount || 1))} /сек</div>
          </div>
        </div>
        <div class="text-right">
          <span class="font-game text-sm text-yellow-400 font-bold">${currentCount.toLocaleString()}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex-1 bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-800">
          <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400" style="width: ${milestonePct}%"></div>
        </div>
        <span class="text-[9px] text-stone-400 shrink-0 font-bold">${currentCount}/${nextMilestone} (${milestoneMultiplierDesc})</span>
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
      ? `+${facInfo.count} (МАКС)`
      : (buyMultiplier > 1 ? `+${facInfo.count}` : `+1`);

    const newLabel = isLocked
      ? `🔒 Требуется Форма #${fac.reqStage + 1}`
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
