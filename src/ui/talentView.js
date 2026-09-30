import { GAME } from '../core/state.js';
import { TALENTS } from '../data/talents.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getAffordableTalentInfo, buyTalent } from '../systems/talentService.js';
import { updateHUD } from './hudView.js';
import { saveLocal } from '../save/saveManager.js';
import { getRollIcon } from '../utils/icons.js';

export function renderTalents() {
  const container = document.getElementById('talentsContainer');
  if (!container) return;
  container.innerHTML = '';

  const label = document.getElementById('talentRollsLabel');
  if (label) label.innerHTML = `${formatNumber(GAME.prestigeRolls)} <span class="roll-icon"></span>`;


  const buyMultiplier = GAME.buyMultiplier || 1;

  TALENTS.forEach(tl => {
    const tlInfo = getAffordableTalentInfo(tl);
    const maxed = tl.level >= tl.max;
    const canBuy = tlInfo.canBuy && !maxed;

    const nextCost = tlInfo.nextCost || tl.cost;
    const btnLabel = maxed
      ? 'МАКС'
      : (buyMultiplier === 'max'
        ? `+${tlInfo.count} (${formatNumber(tlInfo.totalCost)} 🧻)`
        : (buyMultiplier > 1 ? `+${tlInfo.count} (${formatNumber(tlInfo.totalCost)} 🧻)` : `${formatNumber(tlInfo.totalCost)} 🧻`));

    let tierBadgeClass = 'bg-stone-800 text-stone-300 border-stone-700';
    if (tl.tier === 2) tierBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    else if (tl.tier === 3) tierBadgeClass = 'bg-purple-950/80 text-purple-300 border-purple-500/40';
    else if (tl.tier === 4) tierBadgeClass = 'bg-amber-950/80 text-yellow-300 border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.3)]';

    const row = document.createElement('div');
    row.className = `flex items-center justify-between p-2.5 rounded-2xl bg-stone-900 border ${tl.tier === 4 ? 'border-amber-500/50 shadow-md' : 'border-purple-900/60'} shadow-sm`;
    row.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="text-2xl">${tl.icon}</span>
        <div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-xs text-purple-200">${tl.name}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${tierBadgeClass}">${tl.tierName || 'Базовый'}</span>
            <span class="text-yellow-400 font-game text-[11px]">(${tl.level.toLocaleString()}/${tl.max.toLocaleString()})</span>
          </div>
          <div class="text-[10px] text-stone-400 mt-0.5">
            ${tl.desc}
            ${!maxed ? `<span class="text-purple-300 font-semibold font-game ml-1.5 flex-inline items-center gap-0.5">След: ${formatNumber(nextCost)} <span class="roll-icon"></span></span>` : ''}
          </div>
        </div>
      </div>
      <button class="buy-talent-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 ml-2 transition ${maxed ? 'bg-stone-800 text-stone-500 border-stone-700' : (canBuy ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white border-purple-400 jelly-btn' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed')}" data-id="${tl.id}" ${canBuy ? '' : 'disabled'}>
        ${btnLabel}
      </button>
    `;

    row.querySelector('.buy-talent-btn').addEventListener('click', () => {
      if (buyTalent(tl.id)) {
        renderTalents();
        updateHUD();
        saveLocal();
      }
    });

    container.appendChild(row);
  });
}

export function updateTalentButtons() {
  const panel = document.getElementById('panelTalents');
  if (!panel || panel.classList.contains('hidden')) return;

  const label = document.getElementById('talentRollsLabel');
  if (label) label.innerHTML = `${formatNumber(GAME.prestigeRolls)} <span class="roll-icon"></span>`;


  const buyMultiplier = GAME.buyMultiplier || 1;
  const buttons = panel.querySelectorAll('.buy-talent-btn');
  buttons.forEach(btn => {
    const tlId = btn.dataset.id;
    const tl = TALENTS.find(t => t.id === tlId);
    if (!tl) return;

    const tlInfo = getAffordableTalentInfo(tl);
    const maxed = tl.level >= tl.max;
    const canBuy = tlInfo.canBuy && !maxed;

    const btnLabel = maxed
      ? 'МАКС'
      : (buyMultiplier === 'max'
        ? `+${tlInfo.count} (${formatNumber(tlInfo.totalCost)} 🧻)`
        : (buyMultiplier > 1 ? `+${tlInfo.count} (${formatNumber(tlInfo.totalCost)} 🧻)` : `${formatNumber(tlInfo.totalCost)} 🧻`));

    if (btn.textContent.trim() !== btnLabel) {
      btn.textContent = btnLabel;
    }

    if (btn.disabled !== !canBuy && !maxed) {
      btn.disabled = !canBuy;
      btn.className = canBuy
        ? 'buy-talent-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 ml-2 transition bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white border-purple-400 jelly-btn'
        : 'buy-talent-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 ml-2 transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });
}

