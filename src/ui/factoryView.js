import { GAME } from '../core/state.js';
import { FACTORIES } from '../data/factories.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getAffordableFactoryInfo } from '../economy/costs.js';
import { buyFactory } from '../systems/factoryService.js';
import { updateHUD } from './hudView.js';
import { saveLocal } from '../save/saveManager.js';

export function renderFactories() {
  const container = document.getElementById('factoriesContainer');
  if (!container) return;
  container.innerHTML = '';

  let unownedCount = 0;
  const buyMultiplier = GAME.buyMultiplier || 1;

  FACTORIES.forEach((fac, idx) => {
    const currentCount = fac.count || 0;
    if (currentCount === 0) {
      unownedCount++;
      if (unownedCount > 3) return; // Keep UI clean: show up to 3 unowned upcoming tiers
    }

    const facInfo = getAffordableFactoryInfo(fac);
    const canBuy = facInfo.canBuy;

    let nextMilestone = 25;
    let milestoneMultiplierDesc = 'x2';
    if (currentCount >= 25) { nextMilestone = 50; milestoneMultiplierDesc = 'x2'; }
    if (currentCount >= 50) { nextMilestone = 100; milestoneMultiplierDesc = 'x4'; }
    if (currentCount >= 100) { nextMilestone = 200; milestoneMultiplierDesc = 'x4'; }
    if (currentCount >= 200) { nextMilestone = 500; milestoneMultiplierDesc = 'x8'; }
    if (currentCount >= 500) { nextMilestone = 1000; milestoneMultiplierDesc = 'x16'; }

    const milestonePct = Math.min(100, Math.round((currentCount / nextMilestone) * 100));

    const countTxt = buyMultiplier === 'max'
      ? `+${facInfo.count} (МАКС)`
      : (buyMultiplier > 1 ? `+${facInfo.count}` : `+1`);

    const row = document.createElement('div');
    row.className = 'p-3 rounded-2xl bg-stone-900 border border-stone-800 hover:border-amber-600 transition flex flex-col gap-2 shadow-sm';
    row.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">${fac.icon}</span>
          <div>
            <div class="font-bold text-xs text-stone-200">${fac.name}</div>
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
        ${countTxt}: ${formatNumber(facInfo.totalCost)} 💨
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

    const facInfo = getAffordableFactoryInfo(fac);
    const countTxt = buyMultiplier === 'max'
      ? `+${facInfo.count} (МАКС)`
      : (buyMultiplier > 1 ? `+${facInfo.count}` : `+1`);

    const newLabel = `${countTxt}: ${formatNumber(facInfo.totalCost)} 💨`;
    if (btn.textContent.trim() !== newLabel) {
      btn.textContent = newLabel;
    }

    if (btn.disabled !== !facInfo.canBuy) {
      btn.disabled = !facInfo.canBuy;
      btn.className = facInfo.canBuy
        ? 'buy-factory-btn w-full py-1.5 px-3 rounded-xl border text-xs font-game transition bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 border-yellow-300 hover:brightness-110 jelly-btn'
        : 'buy-factory-btn w-full py-1.5 px-3 rounded-xl border text-xs font-game transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });
}
