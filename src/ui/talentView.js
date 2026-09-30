import { GAME } from '../core/state.js';
import { TALENTS } from '../data/talents.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getAffordableTalentInfo, buyTalent } from '../systems/talentService.js';
import { updateHUD } from './hudView.js';
import { saveLocal } from '../save/saveManager.js';

export function renderTalents() {
  const container = document.getElementById('talentsContainer');
  if (!container) return;
  container.innerHTML = '';

  const label = document.getElementById('talentRollsLabel');
  if (label) label.textContent = `${formatNumber(GAME.prestigeRolls)} 🧻`;

  const buyMultiplier = GAME.buyMultiplier || 1;

  TALENTS.forEach(tl => {
    const tlInfo = getAffordableTalentInfo(tl);
    const maxed = tl.level >= tl.max;
    const canBuy = tlInfo.canBuy && !maxed;

    const btnLabel = maxed
      ? 'МАКС'
      : (buyMultiplier === 'max'
        ? `+${tlInfo.count} (МАКС): ${formatNumber(tlInfo.totalCost)} 🧻`
        : (buyMultiplier > 1 ? `+${tlInfo.count}: ${formatNumber(tlInfo.totalCost)} 🧻` : `${formatNumber(tlInfo.totalCost)} 🧻`));

    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2.5 rounded-2xl bg-stone-900 border border-purple-900/60 shadow-sm';
    row.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="text-2xl">${tl.icon}</span>
        <div>
          <div class="font-bold text-xs text-purple-200">
            ${tl.name} <span class="text-yellow-400 font-game">(${tl.level.toLocaleString()}/${tl.max.toLocaleString()})</span>
          </div>
          <div class="text-[10px] text-stone-400">${tl.desc}</div>
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
  if (label) label.textContent = `${formatNumber(GAME.prestigeRolls)} 🧻`;

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
        ? `+${tlInfo.count} (МАКС): ${formatNumber(tlInfo.totalCost)} 🧻`
        : (buyMultiplier > 1 ? `+${tlInfo.count}: ${formatNumber(tlInfo.totalCost)} 🧻` : `${formatNumber(tlInfo.totalCost)} 🧻`));

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

