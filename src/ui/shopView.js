import { GAME } from '../core/state.js';
import { SHOP_ITEMS, BOUTIQUE_REPEATABLES } from '../data/shop.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { saveLocal } from '../save/saveManager.js';
import { updateHUD } from './hudView.js';
import { checkAchievements } from '../systems/achievementsService.js';
import { requestCloudSync } from '../save/cloudSync.js';

export function getBoutiqueRepeatableCost(item) {
  const lvl = (GAME.boutiqueLevels && GAME.boutiqueLevels[item.id]) || 0;
  return Math.round(item.baseCost * Math.pow(item.costMult, lvl));
}

export function buyBoutiqueRepeatable(itemId) {
  const item = BOUTIQUE_REPEATABLES.find(i => i.id === itemId);
  if (!item) return false;
  const cost = getBoutiqueRepeatableCost(item);
  const curSp = Number(GAME.sparkles) || 0;
  if (curSp < cost) return false;

  GAME.sparkles = Math.max(0, curSp - cost);
  if (!GAME.boutiqueLevels) GAME.boutiqueLevels = {};
  GAME.boutiqueLevels[itemId] = (GAME.boutiqueLevels[itemId] || 0) + 1;
  return true;
}

export function renderShop() {
  const container = document.getElementById('shopItemsContainer');
  if (!container) return;
  container.innerHTML = '';

  const sparkleLabel = document.getElementById('shopSparkleLabel');
  if (sparkleLabel) sparkleLabel.textContent = `${formatNumber(GAME.sparkles)} ✨`;

  // 1. REPEATABLE ENDLESS SPARKLE SINKS
  const repHeader = document.createElement('div');
  repHeader.className = 'font-game text-xs text-yellow-300 uppercase tracking-wider py-1 border-b border-amber-800/40 flex items-center justify-between';
  repHeader.innerHTML = '<span>💎 Реликвии Омниверса (Многоуровневые)</span><span class="text-[9px] text-amber-400 font-normal">Бесконечные улучшения</span>';
  container.appendChild(repHeader);

  BOUTIQUE_REPEATABLES.forEach(it => {
    const lvl = (GAME.boutiqueLevels && GAME.boutiqueLevels[it.id]) || 0;
    const cost = getBoutiqueRepeatableCost(it);
    const canBuy = (GAME.sparkles || 0) >= cost;

    const row = document.createElement('div');
    row.className = 'p-2.5 rounded-xl border flex items-center justify-between bg-gradient-to-r from-amber-950/80 via-purple-950/70 to-stone-950 border-yellow-500/50 shadow-sm';
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-2xl">${it.icon}</span>
        <div>
          <div class="font-bold text-xs text-yellow-200">
            ${it.name} <span class="text-yellow-400 font-game text-[11px] font-black">★ Lv.${lvl.toLocaleString()}</span>
          </div>
          <div class="text-[10px] text-amber-200/80">${it.desc}</div>
        </div>
      </div>
      <div class="shrink-0 ml-2">
        <button class="buy-repeatable-btn font-game text-xs px-3 py-1.5 rounded-xl border transition ${canBuy ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-bold border-yellow-300 jelly-btn shadow' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'}" data-id="${it.id}" ${canBuy ? '' : 'disabled'}>
          ${formatNumber(cost)} ✨
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  // 2. EXCLUSIVE ONE-OFF ITEMS & HATS
  const oneOffHeader = document.createElement('div');
  oneOffHeader.className = 'font-game text-xs text-amber-400 uppercase tracking-wider py-1 mt-3 border-b border-stone-800 flex items-center justify-between';
  oneOffHeader.innerHTML = '<span>✨ Эксклюзивные Шляпы и Перки</span><span class="text-[9px] text-stone-400 font-normal">Разовые покупки</span>';
  container.appendChild(oneOffHeader);

  SHOP_ITEMS.forEach(it => {
    const isEquipped = GAME.equippedHat === it.id;
    const canBuy = GAME.sparkles >= it.cost && !it.owned;

    const row = document.createElement('div');
    row.className = `p-2.5 rounded-xl border flex items-center justify-between ${it.cost >= 1000000 ? 'bg-gradient-to-r from-purple-950/90 to-amber-950/90 border-yellow-400 shadow-md' : (it.cost >= 25000 ? 'bg-gradient-to-r from-purple-950/60 to-amber-950/60 border-yellow-500/40' : 'bg-stone-950 border-stone-800')}`;
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

  container.querySelectorAll('.buy-repeatable-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (buyBoutiqueRepeatable(btn.dataset.id)) {
        checkAchievements();
        renderShop();
        updateHUD();
        saveLocal();
        requestCloudSync(2000);
      }
    });
  });

  container.querySelectorAll('.buy-shop-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = SHOP_ITEMS.find(i => i.id === btn.dataset.id);
      const curSp = Number(GAME.sparkles) || 0;
      if (item && curSp >= item.cost && !item.owned) {
        GAME.sparkles = Math.max(0, curSp - item.cost);
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

export function updateShopButtons() {
  const container = document.getElementById('shopItemsContainer');
  if (!container) return;

  const sparkleLabel = document.getElementById('shopSparkleLabel');
  if (sparkleLabel) sparkleLabel.textContent = `${formatNumber(GAME.sparkles)} ✨`;

  const curSparkles = Number(GAME.sparkles) || 0;

  container.querySelectorAll('.buy-repeatable-btn').forEach(btn => {
    const it = BOUTIQUE_REPEATABLES.find(i => i.id === btn.dataset.id);
    if (!it) return;
    const cost = getBoutiqueRepeatableCost(it);
    const canBuy = curSparkles >= cost;
    btn.disabled = !canBuy;
    if (canBuy) {
      btn.className = 'buy-repeatable-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-bold border-yellow-300 jelly-btn shadow';
    } else {
      btn.className = 'buy-repeatable-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
    btn.textContent = `${formatNumber(cost)} ✨`;
  });

  container.querySelectorAll('.buy-shop-btn').forEach(btn => {
    const it = SHOP_ITEMS.find(i => i.id === btn.dataset.id);
    if (!it) return;
    const canBuy = curSparkles >= it.cost && !it.owned;
    btn.disabled = !canBuy;
    if (canBuy) {
      btn.className = 'buy-shop-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold border-yellow-300 jelly-btn shadow';
    } else {
      btn.className = 'buy-shop-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });
}
