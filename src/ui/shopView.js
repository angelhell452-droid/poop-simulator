import { GAME } from '../core/state.js?v=5.0.80';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { saveLocal } from '../save/saveManager.js?v=5.0.80';
import { updateHUD } from './hudView.js?v=5.0.80';
import { checkAchievements } from '../systems/achievementsService.js?v=5.0.80';
import { requestCloudSync } from '../save/cloudSync.js?v=5.0.80';
import { openCharacterInventoryModal, showKnifeToast } from './characterInventoryView.js?v=5.0.80';
import { hatArtHtml } from './artIcon.js?v=5.0.17';
import { isBoutiqueUnlocked, peakForm } from '../progression/unlocks.js';
import { t, onLocaleChange } from '../i18n/t.js';
import { PERMANENT_PERKS, hasPerk, buyPermanentPerk } from '../data/perks.data.js';

export function renderShop() {
  const container = document.getElementById('shopItemsContainer');
  if (!container) return;
  container.innerHTML = '';

  const sparkleLabel = document.getElementById('shopSparkleLabel');
  if (sparkleLabel) sparkleLabel.textContent = `${formatNumber(GAME.sparkles)} ✨`;

  if (!isBoutiqueUnlocked()) {
    const lock = document.createElement('div');
    lock.className = 'p-4 rounded-2xl border border-amber-900/60 bg-stone-950 text-center';
    lock.innerHTML = `<div class="text-2xl mb-1">🔒</div><div class="font-game text-sm text-amber-200">${t('shop.lockedTitle')}</div><p class="text-[11px] text-stone-400 mt-1">${t('shop.lockedBody', { n: formatNumber(100), peak: formatNumber(peakForm()) })}</p>`;
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
        <div class="font-game text-xs text-pink-300">${t('shop.wardrobeTitle')}</div>
        <div class="text-[10px] text-pink-200/80">${t('shop.wardrobeBody')}</div>
      </div>
    </div>
    <button id="btnShopGoToWardrobe" class="font-game text-xs px-3 py-1.5 rounded-xl border transition bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-bold border-pink-300 jelly-btn shadow shrink-0">
      ${t('shop.goWardrobe')}
    </button>
  `;
  container.appendChild(wardrobeBanner);

  wardrobeBanner.querySelector('#btnShopGoToWardrobe')?.addEventListener('click', () => {
    document.getElementById('shopModal')?.classList.add('hidden');
    openCharacterInventoryModal('hats');
  });

  // 2. 20 PERMANENT PERKS FOR BREAKTHROUGHS
  const b = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;
  const perksHeader = document.createElement('div');
  perksHeader.className = 'font-game text-xs text-yellow-300 uppercase tracking-wider py-1 mt-2 border-b border-amber-800/40 flex items-center justify-between';
  perksHeader.innerHTML = `<span>🔮 ${t('shop.perksHeader')} (20)</span><span class="text-[9px] text-amber-400 font-normal">Прорыв: ${formatNumber(b)}</span>`;
  container.appendChild(perksHeader);

  const curSparkles = Number(GAME.sparkles) || 0;

  PERMANENT_PERKS.forEach(perk => {
    const isUnlocked = b >= perk.reqBreakthrough;
    const isOwned = hasPerk(perk.id);
    const canBuy = isUnlocked && !isOwned && curSparkles >= perk.cost;

    const row = document.createElement('div');
    row.className = `p-2.5 rounded-xl border flex items-center justify-between transition ${
      isOwned 
        ? 'bg-gradient-to-r from-emerald-950/40 to-stone-950 border-emerald-500/40 shadow-sm'
        : !isUnlocked
        ? 'bg-stone-950/70 border-stone-800 opacity-60'
        : 'bg-stone-950 border-yellow-500/40 shadow-sm'
    }`;

    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0 flex-1 mr-2 text-left">
        <span class="text-2xl shrink-0">${perk.icon}</span>
        <div class="min-w-0">
          <div class="font-bold text-xs ${isOwned ? 'text-yellow-300' : isUnlocked ? 'text-stone-200' : 'text-stone-400'} truncate">
            ${perk.nameRu || perk.name}
          </div>
          <div class="text-[10px] text-stone-400 mt-0.5 line-clamp-2">
            ${perk.desc}
          </div>
        </div>
      </div>
      <div class="shrink-0">
        ${isOwned ? `
          <span class="text-xs font-bold text-emerald-400 px-2 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30">${t('common.owned')} ✓</span>
        ` : !isUnlocked ? `
          <span class="text-[11px] font-game font-bold text-stone-400 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700">🔒 ${formatNumber(perk.reqBreakthrough)} Прорыв</span>
        ` : `
          <button class="buy-shop-perk-btn font-game text-xs px-3 py-1.5 rounded-xl border transition ${
            canBuy 
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-bold border-yellow-300 jelly-btn shadow' 
              : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
          }" data-id="${perk.id}" ${canBuy ? '' : 'disabled'}>
            ${formatNumber(perk.cost)} ✨
          </button>
        `}
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll('.buy-shop-perk-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = buyPermanentPerk(btn.dataset.id);
      if (res.success) {
        showKnifeToast(`✨ Куплен перк «${res.perk.nameRu || res.perk.name}»!`);
        checkAchievements();
        renderShop();
        updateHUD();
        saveLocal();
        requestCloudSync(2000);
      } else {
        showKnifeToast(res.msg);
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
  const b = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;

  container.querySelectorAll('.buy-shop-perk-btn').forEach(btn => {
    const perk = PERMANENT_PERKS.find(p => p.id === btn.dataset.id);
    if (!perk) return;
    const isUnlocked = b >= perk.reqBreakthrough;
    const isOwned = hasPerk(perk.id);
    const canBuy = isUnlocked && !isOwned && curSparkles >= perk.cost;

    btn.disabled = !canBuy;
    if (canBuy) {
      btn.className = 'buy-shop-perk-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-bold border-yellow-300 jelly-btn shadow';
    } else {
      btn.className = 'buy-shop-perk-btn font-game text-xs px-3 py-1.5 rounded-xl border transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });
}

let shopLocaleHooked = false;
export function initShopI18n() {
  if (shopLocaleHooked) return;
  shopLocaleHooked = true;
  onLocaleChange(() => renderShop());
}
