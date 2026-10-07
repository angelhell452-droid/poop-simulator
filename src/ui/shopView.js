import { GAME } from '../core/state.js?v=5.0.72';
import { SHOP_ITEMS, BOUTIQUE_REPEATABLES } from '../data/shop.data.js?v=5.0.72';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.72';
import { saveLocal } from '../save/saveManager.js?v=5.0.72';
import { updateHUD } from './hudView.js?v=5.0.72';
import { checkAchievements } from '../systems/achievementsService.js?v=5.0.72';
import { requestCloudSync } from '../save/cloudSync.js?v=5.0.72';
import { openCharacterInventoryModal } from './characterInventoryView.js?v=5.0.72';
import { hatArtHtml } from './artIcon.js?v=5.0.17';
import { isBoutiqueUnlocked, isShopOfferUnlocked, peakForm } from '../progression/unlocks.js';

export function getBoutiqueRepeatableCost(item) {
  const lvl = (GAME.boutiqueLevels && GAME.boutiqueLevels[item.id]) || 0;
  return Math.round(item.baseCost * Math.pow(item.costMult, lvl));
}

export function buyBoutiqueRepeatable(itemId) {
  const item = BOUTIQUE_REPEATABLES.find(i => i.id === itemId);
  if (!item || !isShopOfferUnlocked(item.reqForm)) return false;
  const lvl = (GAME.boutiqueLevels && GAME.boutiqueLevels[item.id]) || 0;
  if (item.max && lvl >= item.max) return false;
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

  if (!isBoutiqueUnlocked()) {
    const lock = document.createElement('div');
    lock.className = 'p-4 rounded-2xl border border-amber-900/60 bg-stone-950 text-center';
    lock.innerHTML = `<div class="text-2xl mb-1">🔒</div><div class="font-game text-sm text-amber-200">Бутик закрыт</div><p class="text-[11px] text-stone-400 mt-1">Откроется навсегда, когда форма на аккаунте впервые дойдёт до ${formatNumber(100)}. Рекорд сейчас: форма ${formatNumber(peakForm())}.</p>`;
    container.appendChild(lock);
    return;
  }

  // 1. WARDROBE REDIRECT BANNER
  const wardrobeBanner = document.createElement('div');
  wardrobeBanner.className = 'p-3 rounded-2xl bg-gradient-to-r from-purple-950/70 via-pink-950/60 to-stone-900 border border-pink-500/50 flex items-center justify-between gap-3 shadow-md mb-2';
  wardrobeBanner.innerHTML = `
    <div class="flex items-center gap-2.5">
      <span>${hatArtHtml({ id: 'hat_crown', icon: '👑' }, 40)}</span>
      <div class="text-left">
        <div class="font-game text-xs text-pink-300">Гардероб и Головные Уборы</div>
        <div class="text-[10px] text-pink-200/80">Покупка, примерка и управление шапками находятся в Инвентаре</div>
      </div>
    </div>
    <button id="btnShopGoToWardrobe" class="font-game text-xs px-3 py-1.5 rounded-xl border transition bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-bold border-pink-300 jelly-btn shadow shrink-0">
      В гардероб 🎒
    </button>
  `;
  container.appendChild(wardrobeBanner);

  wardrobeBanner.querySelector('#btnShopGoToWardrobe')?.addEventListener('click', () => {
    document.getElementById('shopModal')?.classList.add('hidden');
    openCharacterInventoryModal('hats');
  });

  // 2. REPEATABLE ENDLESS SPARKLE SINKS
  const repHeader = document.createElement('div');
  repHeader.className = 'font-game text-xs text-yellow-300 uppercase tracking-wider py-1 border-b border-amber-800/40 flex items-center justify-between';
  repHeader.innerHTML = '<span>💎 Реликвии Омниверса (Многоуровневые)</span><span class="text-[9px] text-amber-400 font-normal">С потолком уровня</span>';
  container.appendChild(repHeader);

  [...BOUTIQUE_REPEATABLES].sort((a, b) => (a.reqForm || 0) - (b.reqForm || 0)).forEach(it => {
    const lvl = (GAME.boutiqueLevels && GAME.boutiqueLevels[it.id]) || 0;
    const cost = getBoutiqueRepeatableCost(it);
    const maxed = it.max && lvl >= it.max;
    const unlocked = isShopOfferUnlocked(it.reqForm);
    const canBuy = unlocked && !maxed && (GAME.sparkles || 0) >= cost;

    const row = document.createElement('div');
    row.className = 'p-2.5 rounded-xl border flex items-center justify-between bg-gradient-to-r from-amber-950/80 via-purple-950/70 to-stone-950 border-yellow-500/50 shadow-sm';
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-2xl">${it.icon}</span>
        <div>
          <div class="font-bold text-xs text-yellow-200">
            ${it.name} <span class="text-yellow-400 font-game text-[11px] font-black">★ Lv.${formatNumber(lvl)}</span>
          </div>
          <div class="text-[10px] text-amber-200/80">${unlocked ? it.desc : `Откроется на форме ${formatNumber(it.reqForm)}. Рекорд: ${formatNumber(peakForm())}.`}</div>
        </div>
      </div>
      <div class="shrink-0 ml-2">
        <button class="buy-repeatable-btn font-game text-xs px-3 py-1.5 rounded-xl border transition ${canBuy ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-bold border-yellow-300 jelly-btn shadow' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'}" data-id="${it.id}" ${canBuy ? '' : 'disabled'}>
          ${!unlocked ? '🔒' : (maxed ? 'МАКС' : `${formatNumber(cost)} ✨`)}
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  // 3. EXCLUSIVE ONE-OFF PERKS (WITHOUT HATS)
  const oneOffHeader = document.createElement('div');
  oneOffHeader.className = 'font-game text-xs text-amber-400 uppercase tracking-wider py-1 mt-3 border-b border-stone-800 flex items-center justify-between';
  oneOffHeader.innerHTML = '<span>✨ Эксклюзивные Пассивные Перки</span><span class="text-[9px] text-stone-400 font-normal">Разовые покупки</span>';
  container.appendChild(oneOffHeader);

  const perkItems = SHOP_ITEMS.filter(it => it.type !== 'hat').sort((a, b) => (a.reqForm || 0) - (b.reqForm || 0));

  perkItems.forEach(it => {
    const unlocked = isShopOfferUnlocked(it.reqForm);
    const canBuy = unlocked && GAME.sparkles >= it.cost && !it.owned;

    const row = document.createElement('div');
    row.className = `p-2.5 rounded-xl border flex items-center justify-between ${it.cost >= 1000000 ? 'bg-gradient-to-r from-purple-950/90 to-amber-950/90 border-yellow-400 shadow-md' : (it.cost >= 25000 ? 'bg-gradient-to-r from-purple-950/60 to-amber-950/60 border-yellow-500/40' : 'bg-stone-950 border-stone-800')}`;
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-2xl">${it.icon}</span>
        <div>
          <div class="font-bold text-xs ${it.cost >= 25000 ? 'text-yellow-300' : 'text-stone-200'}">${it.name}</div>
          <div class="text-[10px] text-stone-400">${unlocked ? it.desc : `Откроется на форме ${formatNumber(it.reqForm)}. Рекорд: ${formatNumber(peakForm())}.`}</div>
        </div>
      </div>
      <div class="shrink-0 ml-2">
        ${it.owned ? `
          <span class="text-xs font-bold text-emerald-400">Куплено ✓</span>
        ` : !unlocked ? `
          <span class="text-xs font-bold text-stone-500">🔒</span>
        ` : `
          <button class="buy-shop-btn font-game text-xs px-3 py-1.5 rounded-xl border transition ${canBuy ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950 border-yellow-300 jelly-btn' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'}" data-id="${it.id}" ${canBuy ? '' : 'disabled'}>
            ${formatNumber(it.cost)} ✨
          </button>
        `}
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
      if (item && isShopOfferUnlocked(item.reqForm) && curSp >= item.cost && !item.owned) {
        GAME.sparkles = Math.max(0, curSp - item.cost);
        item.owned = true;
        checkAchievements();
        renderShop();
        updateHUD();
        saveLocal();
        requestCloudSync(2000);
      }
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
    const lvl = (GAME.boutiqueLevels && GAME.boutiqueLevels[it.id]) || 0;
    const maxed = it.max && lvl >= it.max;
    const cost = getBoutiqueRepeatableCost(it);
    const unlocked = isShopOfferUnlocked(it.reqForm);
    const canBuy = unlocked && !maxed && curSparkles >= cost;
    btn.disabled = !canBuy;
    if (canBuy) {
      btn.className = 'buy-repeatable-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-bold border-yellow-300 jelly-btn shadow';
    } else {
      btn.className = 'buy-repeatable-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
    btn.textContent = !unlocked ? '🔒' : (maxed ? 'МАКС' : `${formatNumber(cost)} ✨`);
  });

  container.querySelectorAll('.buy-shop-btn').forEach(btn => {
    const it = SHOP_ITEMS.find(i => i.id === btn.dataset.id);
    if (!it) return;
    const canBuy = isShopOfferUnlocked(it.reqForm) && curSparkles >= it.cost && !it.owned;
    btn.disabled = !canBuy;
    if (canBuy) {
      btn.className = 'buy-shop-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold border-yellow-300 jelly-btn shadow';
    } else {
      btn.className = 'buy-shop-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });
}
