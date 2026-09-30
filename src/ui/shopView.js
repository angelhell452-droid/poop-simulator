import { GAME } from '../core/state.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { saveLocal } from '../save/saveManager.js';
import { updateHUD } from './hudView.js';
import { checkAchievements } from '../systems/achievementsService.js';
import { requestCloudSync } from '../save/cloudSync.js';

export function renderShop() {
  const container = document.getElementById('shopItemsContainer');
  if (!container) return;
  container.innerHTML = '';

  const sparkleLabel = document.getElementById('shopSparkleLabel');
  if (sparkleLabel) sparkleLabel.textContent = `${formatNumber(GAME.sparkles)} ✨`;

  SHOP_ITEMS.forEach(it => {
    const isEquipped = GAME.equippedHat === it.id;
    const canBuy = GAME.sparkles >= it.cost && !it.owned;

    const row = document.createElement('div');
    row.className = `p-2.5 rounded-xl border flex items-center justify-between ${it.cost >= 25000 ? 'bg-gradient-to-r from-purple-950/80 to-amber-950/80 border-yellow-500/60' : 'bg-stone-950 border-stone-800'}`;
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-2xl">${it.icon}</span>
        <div>
          <div class="font-bold text-xs ${it.cost >= 25000 ? 'text-yellow-300' : 'text-stone-200'}">${it.name}</div>
          <div class="text-[10px] text-stone-400">${it.desc}</div>
        </div>
      </div>
      <div class="shrink-0 ml-2">
        ${it.type === 'hat' && it.owned ? `
          <button class="equip-btn font-game text-xs px-3 py-1.5 rounded-xl border ${isEquipped ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-stone-800 border-stone-600 text-stone-300'}" data-id="${it.id}">
            ${isEquipped ? 'Надето ✓' : 'Надеть'}
          </button>
        ` : (it.owned ? `
          <span class="text-xs font-bold text-emerald-400">Куплено ✓</span>
        ` : `
          <button class="buy-shop-btn font-game text-xs px-3 py-1.5 rounded-xl border transition ${canBuy ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950 border-yellow-300 jelly-btn' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'}" data-id="${it.id}" ${canBuy ? '' : 'disabled'}>
            ${formatNumber(it.cost)} ✨
          </button>
        `)}
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll('.buy-shop-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = SHOP_ITEMS.find(i => i.id === btn.dataset.id);
      if (item && GAME.sparkles >= item.cost && !item.owned) {
        GAME.sparkles -= item.cost;
        item.owned = true;
        if (item.type === 'hat') GAME.equippedHat = item.id;
        checkAchievements();
        renderShop();
        updateHUD();
        saveLocal();
        requestCloudSync(2000);
      }
    });
  });

  container.querySelectorAll('.equip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      GAME.equippedHat = GAME.equippedHat === btn.dataset.id ? null : btn.dataset.id;
      renderShop();
      updateHUD();
      saveLocal();
    });
  });
}
