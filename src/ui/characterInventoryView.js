import { GAME } from '../core/state.js';
import { KNIVES } from '../data/knives.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import {
  getKnifeStar, getKnifeSharpenCost, getEquippedKnife, sharpenKnife, getBestKnife, equipBestKnife,
  getHatLevel, getHatInlayCost, inlayHat
} from '../systems/knifeService.js';
import { getPoopSkinInfo } from '../progression/evolutionService.js';
import { getKnifeShownBonuses } from '../economy/production.js';
import { getClickCapCps, getKnifeCpsBonus } from '../systems/autoclickService.js';
import { saveLocal } from '../save/saveManager.js';
import { updateHUD } from './hudView.js';
import { renderShop } from './shopView.js';
import { checkAchievements } from '../systems/achievementsService.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getPlungerIcon, getRollIcon } from '../utils/icons.js';
import { getKnifeImageHtml } from '../utils/knifeIcons.js';


let currentInvTab = 'knives'; // 'knives' | 'hats'
let knifeFilterRarity = 'all';
let knifeSearchQuery = '';
let knifeSortMode = 'power';
let activeInfoCardId = null; // ID of card whose "!" info is expanded

export function openCharacterInventoryModal(initialTab = 'knives') {
  const modal = document.getElementById('characterInventoryModal');
  if (!modal) return;
  if (initialTab) currentInvTab = initialTab;
  renderCharacterInventory();
  modal.classList.remove('hidden');
}

export function handleEquipBestKnife() {
  const res = equipBestKnife();
  if (res.success) {
    updateHUD();
    renderCharacterInventory();
    saveLocal();
    showKnifeToast(`⚔️ Экипирован лучший нож: ${res.knife.icon} ${res.knife.name}!`);
  } else {
    showKnifeToast(res.msg || 'Нет доступных ножей для экипировки');
  }
}

export function showKnifeToast(text) {
  const existing = document.getElementById('knifeToastNotification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'knifeToastNotification';
  toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-game font-bold text-xs px-4 py-2 rounded-2xl shadow-2xl border-2 border-yellow-200 flex items-center gap-2 animate-bounce';
  toast.innerHTML = `<span>${text}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 2400);
}

export function renderCharacterInventory() {
  // 1. Character Skin & Form Overview
  const skinInfo = getPoopSkinInfo(GAME.evoStage, GAME.girlyMode);
  const pIcon = document.getElementById('invPoopIcon');
  if (pIcon) pIcon.textContent = skinInfo.icon;
  const pName = document.getElementById('invPoopFormName');
  if (pName) pName.textContent = `Форма #${GAME.evoStage + 1}: ${skinInfo.name}`;
  const pTier = document.getElementById('invPoopTierBadge');
  if (pTier) pTier.textContent = `Тир ${skinInfo.tier}`;
  const cpsEl = document.getElementById('invTotalCps');
  if (cpsEl) cpsEl.textContent = `${formatNumber(getClickCapCps())} CPS`;

  // 2. Dedicated Hat Slot (Слот Шапки)
  const equippedHat = GAME.equippedHat ? SHOP_ITEMS.find(i => i.id === GAME.equippedHat) : null;
  const hIcon = document.getElementById('invHatIcon');
  const hName = document.getElementById('invHatName');
  const hBonus = document.getElementById('invHatBonus');
  const btnUnequipHat = document.getElementById('btnUnequipHat');
  const btnInlayHat = document.getElementById('btnInlayEquippedHat');

  if (hIcon) hIcon.textContent = equippedHat ? equippedHat.icon : '🧢';
  if (hName) {
    if (equippedHat) {
      const hatLvl = getHatLevel(equippedHat.id);
      hName.innerHTML = `${equippedHat.name} <span class="text-pink-400 font-black">💎 Lv.${hatLvl}</span>`;
    } else {
      hName.textContent = 'Без головного убора';
    }
  }
  if (hBonus) {
    if (equippedHat) {
      const hatLvl = getHatLevel(equippedHat.id);
      const totalBoost = (equippedHat.clickBoost || 1.0) * (1 + (hatLvl - 1) * 0.35);
      hBonus.textContent = `${equippedHat.desc || ''} (Итог: x${formatNumber(totalBoost)} к клику)`;
      hBonus.className = 'text-[10px] text-pink-300 font-bold';
    } else {
      hBonus.textContent = 'Шапка не надета (+0% бонус)';
      hBonus.className = 'text-[10px] text-stone-400';
    }
  }
  if (btnUnequipHat) {
    btnUnequipHat.classList.toggle('hidden', !equippedHat);
  }
  if (btnInlayHat) {
    if (equippedHat) {
      btnInlayHat.classList.remove('hidden');
      const costInfo = getHatInlayCost(equippedHat);
      if (costInfo.maxReached) {
        btnInlayHat.textContent = '💎 MAX';
        btnInlayHat.disabled = true;
        btnInlayHat.className = 'shrink-0 text-[10px] font-game bg-stone-800 text-stone-500 font-bold px-2 py-1.5 rounded-xl cursor-not-allowed';
      } else {
        btnInlayHat.disabled = false;
        btnInlayHat.className = 'shrink-0 text-[10px] font-game bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-bold px-2 py-1.5 rounded-xl jelly-btn flex items-center gap-1 shadow';
        btnInlayHat.innerHTML = `💎 +1 (${formatNumber(costInfo.cost)} ✨)`;
      }
      btnInlayHat.onclick = () => {
        const res = inlayHat(equippedHat.id);
        if (res.success) {
          updateHUD();
          renderCharacterInventory();
          saveLocal();
          showKnifeToast(`💎 Шапка "${equippedHat.name}" инкрустирована до Lv.${res.newLevel}! (+35% силы клика)`);
        } else {
          alert(res.msg);
        }
      };
    } else {
      btnInlayHat.classList.add('hidden');
    }
  }

  // 3. Dedicated Knife Slot (Слот Ножа)
  const equippedCard = document.getElementById('equippedKnifeCard');
  const equippedObj = getEquippedKnife();
  if (equippedCard) {
    if (equippedObj) {
      const eqStar = getKnifeStar(equippedObj.id);
      const shown = getKnifeShownBonuses(equippedObj);
      const eqClickPct = shown.clickPct;
      const costInfo = getKnifeSharpenCost(equippedObj);
      const canAffordSharpen = (GAME.sparkles || 0) >= costInfo.cost;
      let sharpenBtnHtml = '';
      if (costInfo.maxReached) {
        sharpenBtnHtml = `<button class="bg-stone-900 text-stone-500 font-black text-[11px] px-2.5 py-1.5 rounded-xl border border-stone-800 cursor-not-allowed" disabled>★ МАКС</button>`;
      } else if (!canAffordSharpen) {
        sharpenBtnHtml = `<button class="bg-stone-900 text-stone-500 font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-stone-800 cursor-not-allowed opacity-60 flex items-center gap-1" disabled title="Недостаточно Блестяшек">
          <span>🔒</span> <span>${formatNumber(costInfo.cost)} ✨</span>
        </button>`;
      } else {
        sharpenBtnHtml = `<button id="btnSharpenEquippedKnife" class="bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-stone-950 font-black text-[11px] px-2.5 py-1.5 rounded-xl transition shadow jelly-btn flex items-center gap-1" title="Заточить надетый нож (+1 Lv)">
          ⭐ Точить (${formatNumber(costInfo.cost)} ✨)
        </button>`;
      }

      equippedCard.innerHTML = `
        <div class="flex items-center justify-between gap-2 w-full">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="shrink-0 flex items-center justify-center">${getKnifeImageHtml(equippedObj, 52)}</div>
            <div class="truncate">
              <div class="font-game text-sm text-white font-black truncate drop-shadow-md" style="text-shadow:0 1px 4px rgba(0,0,0,0.9)">${equippedObj.name}</div>
              <div class="flex items-center gap-1.5 text-[10px] mt-0.5">
                <span class="text-emerald-300 font-bold bg-emerald-950/70 px-1.5 py-0.5 rounded">+${formatNumber(eqClickPct)}% 🗗️</span>
                <span class="text-cyan-300 font-bold bg-cyan-950/70 px-1.5 py-0.5 rounded">+${formatNumber(getKnifeCpsBonus(equippedObj))} CPS</span>
                <span class="text-amber-300 font-black bg-amber-950/70 px-1.5 py-0.5 rounded">★ Lv.${eqStar}</span>
                ${equippedObj.statTrak ? `<span class="text-orange-400 font-mono font-bold bg-orange-950/70 px-1.5 py-0.5 rounded">🔥 ${formatNumber(equippedObj.statTrak)}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            ${sharpenBtnHtml}
            <button id="btnEquipBestKnifeEquipped" class="bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black text-[11px] px-2 py-1.5 rounded-xl transition shadow jelly-btn flex items-center gap-1" title="Надеть нож с наибольшим уроном">
              ⚔️ Лучший
            </button>
            <button id="btnUnequipKnife" class="bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 text-[11px] px-2 py-1.5 rounded-xl font-bold jelly-btn">
              Снять
            </button>
          </div>
        </div>
      `;
      document.getElementById('btnSharpenEquippedKnife')?.addEventListener('click', () => {
        const res = sharpenKnife(equippedObj.id);
        if (res.success) {
          updateHUD();
          renderCharacterInventory();
          saveLocal();
          showKnifeToast(`⭐ ${equippedObj.name} заточен до Lv.${res.newStar}! (+35% силы)`);
        } else {
          alert(res.msg);
        }
      });
      document.getElementById('btnUnequipKnife')?.addEventListener('click', () => {
        GAME.equippedKnife = null;
        updateHUD();
        renderCharacterInventory();
        saveLocal();
      });
      document.getElementById('btnEquipBestKnifeEquipped')?.addEventListener('click', handleEquipBestKnife);
    } else {
      equippedCard.innerHTML = `
        <div class="flex items-center justify-between gap-2 w-full py-1">
          <div class="flex items-center gap-2 text-stone-400 text-xs">
            <span class="text-2xl">✊</span>
            <span>Голые руки (Без ножа)</span>
          </div>
          <button id="btnEquipBestKnifeEmpty" class="bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black text-[11px] px-3 py-1.5 rounded-xl transition shadow jelly-btn flex items-center gap-1 shrink-0">
            ⚔️ Надеть лучший
          </button>
        </div>
      `;
      document.getElementById('btnEquipBestKnifeEmpty')?.addEventListener('click', handleEquipBestKnife);
    }
  }

  // 4. Update Tab Counters
  const unlockedKnivesCount = (GAME.unlockedKnives || []).length;
  const countBadge = document.getElementById('knivesCountBadge');
  if (countBadge) countBadge.textContent = `${unlockedKnivesCount} / ${KNIVES.length} найдено`;

  const invKnivesCount = document.getElementById('invKnivesCount');
  if (invKnivesCount) invKnivesCount.textContent = `${unlockedKnivesCount}/${KNIVES.length}`;

  const allHats = SHOP_ITEMS.filter(i => i.type === 'hat' && (!i.retired || i.owned || GAME.equippedHat === i.id));
  const ownedHatsCount = allHats.filter(i => i.owned).length;
  const invHatsCount = document.getElementById('invHatsCount');
  if (invHatsCount) invHatsCount.textContent = `${ownedHatsCount}/${allHats.length}`;

  // 5. Update Tab Visibility and Styles
  const tabKnivesBtn = document.getElementById('invTabKnives');
  const tabHatsBtn = document.getElementById('invTabHats');
  const knivesPanel = document.getElementById('invKnivesPanel');
  const hatsPanel = document.getElementById('invHatsPanel');

  if (tabKnivesBtn && tabHatsBtn && knivesPanel && hatsPanel) {
    if (currentInvTab === 'knives') {
      tabKnivesBtn.className = 'inv-sub-tab px-4 py-2 rounded-2xl font-game text-xs flex items-center gap-1.5 transition font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-md border border-yellow-300';
      tabHatsBtn.className = 'inv-sub-tab px-4 py-2 rounded-2xl font-game text-xs flex items-center gap-1.5 transition font-bold bg-stone-900 text-stone-400 hover:text-white border border-stone-800';
      knivesPanel.classList.remove('hidden');
      hatsPanel.classList.add('hidden');
      renderKnivesGrid();
    } else {
      tabHatsBtn.className = 'inv-sub-tab px-4 py-2 rounded-2xl font-game text-xs flex items-center gap-1.5 transition font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md border border-pink-300';
      tabKnivesBtn.className = 'inv-sub-tab px-4 py-2 rounded-2xl font-game text-xs flex items-center gap-1.5 transition font-bold bg-stone-900 text-stone-400 hover:text-white border border-stone-800';
      hatsPanel.classList.remove('hidden');
      knivesPanel.classList.add('hidden');
      renderHatsGrid();
    }
  }
}

function renderKnivesGrid() {
  const invContainer = document.getElementById('knivesInventoryContainer');
  if (!invContainer) return;

  if (!GAME.unlockedKnives || GAME.unlockedKnives.length === 0) {
    invContainer.innerHTML = '<div class="col-span-2 text-center text-stone-500 py-8 text-xs">Коллекция ножей пуста. Открывайте оружейные кейсы за Золотые Втулки (' + getRollIcon() + ') или Астральные Вантузы (' + getPlungerIcon() + ')!</div>';
    return;
  }


  let filteredKnives = (GAME.unlockedKnives || [])
    .map(kid => KNIVES.find(k => k.id === kid))
    .filter(Boolean);

  // Search filter
  if (knifeSearchQuery.trim()) {
    const q = knifeSearchQuery.trim().toLowerCase();
    filteredKnives = filteredKnives.filter(k =>
      k.name.toLowerCase().includes(q) ||
      (k.rarityName && k.rarityName.toLowerCase().includes(q))
    );
  }

  // Rarity filter
  if (knifeFilterRarity !== 'all') {
    if (knifeFilterRarity === 'godly') {
      filteredKnives = filteredKnives.filter(k => ['godly', 'special', 'celestial', 'titanium', 'rainbow'].includes(k.rarity));
    } else if (knifeFilterRarity === 'covert') {
      filteredKnives = filteredKnives.filter(k => k.rarity === 'covert');
    } else if (knifeFilterRarity === 'classified') {
      filteredKnives = filteredKnives.filter(k => k.rarity === 'classified');
    } else if (knifeFilterRarity === 'common') {
      filteredKnives = filteredKnives.filter(k => !['godly', 'special', 'celestial', 'titanium', 'rainbow', 'covert', 'classified'].includes(k.rarity));
    }
  }

  // Sort
  filteredKnives.sort((a, b) => {
    const starA = getKnifeStar(a.id);
    const starB = getKnifeStar(b.id);
    const clickA = a.clickMult * (1 + (starA - 1) * 0.35);
    const clickB = b.clickMult * (1 + (starB - 1) * 0.35);
    const passA = a.passiveMult * (1 + (starA - 1) * 0.25);
    const passB = b.passiveMult * (1 + (starB - 1) * 0.25);

    if (knifeSortMode === 'click') return clickB - clickA;
    if (knifeSortMode === 'passive') return passB - passA;
    if (knifeSortMode === 'stattrak') return (b.statTrak || 0) - (a.statTrak || 0);
    if (knifeSortMode === 'star') return starB - starA;
    if (knifeSortMode === 'name') return a.name.localeCompare(b.name);
    return (clickB * passB) - (clickA * passA);
  });

  if (filteredKnives.length === 0) {
    invContainer.innerHTML = '<div class="col-span-2 text-center text-stone-500 py-6 text-xs">По вашему запросу ножи не найдены.</div>';
    return;
  }

  invContainer.innerHTML = '';
  filteredKnives.forEach(kn => {
    const isEq = GAME.equippedKnife === kn.id;
    const star = getKnifeStar(kn.id);
    const starCostInfo = getKnifeSharpenCost(kn);
    const canAffordSharpen = (GAME.sparkles || 0) >= starCostInfo.cost;
    const shown = getKnifeShownBonuses(kn);
    const clickBonus = shown.clickPct;

    // Balanced realistic recycle returns
    const isAstral = ['godly', 'special', 'celestial'].includes(kn.rarity);
    const recycleCurrency = isAstral ? 'plungers' : 'rolls';
    const recycleSymbol = isAstral ? getPlungerIcon() : getRollIcon();
    const baseRecycleTable = {
      common: 30,
      rare: 90,
      very_rare: 280,
      restricted: 280,
      epic: 850,
      classified: 2600,
      covert: 8500,
      rainbow: 28000,
      titanium: 75000,
      celestial: 15,
      godly: 85,
      special: 85
    };
    const baseRecycle = baseRecycleTable[kn.rarity] || 30;
    const powerBonus = Math.round((kn.clickMult || 1) * (isAstral ? 1 : 12));
    const starRecycleBonus = Math.round((star - 1) * baseRecycle * 0.25);
    const recyclePrice = Math.max(1, baseRecycle + powerBonus + starRecycleBonus);
    const isInfoOpen = activeInfoCardId === kn.id;

    let rarityBorder = 'border-stone-700 bg-stone-950';
    let rarityBadge = 'bg-stone-800 text-stone-300';
    if (['godly', 'special', 'celestial', 'titanium', 'rainbow'].includes(kn.rarity)) {
      rarityBorder = 'border-yellow-400/90 bg-stone-900/95 shadow-[0_0_12px_rgba(250,204,21,0.2)]';
      rarityBadge = 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50';
    } else if (kn.rarity === 'covert') {
      rarityBorder = 'border-red-500/80 bg-stone-900/95 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      rarityBadge = 'bg-red-500/20 text-red-300 border border-red-500/50';
    } else if (kn.rarity === 'classified') {
      rarityBorder = 'border-pink-500/70 bg-stone-900/95';
      rarityBadge = 'bg-pink-500/20 text-pink-300 border border-pink-500/50';
    }

    const card = document.createElement('div');
    card.className = `p-2 sm:p-2.5 rounded-2xl border-2 transition relative flex flex-col justify-between ${isEq ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-stone-900' : rarityBorder}`;
    card.innerHTML = `
      <div>
        <!-- Row 1: Icon, Name, Level, and Mini "!" button -->
        <div class="flex items-start justify-between gap-1.5">
          <div class="flex items-center gap-2 overflow-hidden flex-1">
            <div class="shrink-0 flex items-center justify-center">${getKnifeImageHtml(kn, 40)}</div>
            <div class="truncate">
              <div class="font-game text-xs text-yellow-300 truncate font-bold" title="${kn.name}">${kn.name}</div>
              <div class="flex items-center gap-1.5 text-[9px] mt-0.5">
                <span class="px-1.5 py-0.2 rounded font-bold uppercase ${rarityBadge}">${kn.rarityName}</span>
                <span class="text-amber-400 font-black font-mono">★ Lv.${star}</span>
              </div>
            </div>
          </div>
          <button class="knife-info-toggle w-5 h-5 shrink-0 rounded-full bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-600 flex items-center justify-center font-bold text-[11px] transition shadow" data-id="${kn.id}" title="Характеристики и описание">
            !
          </button>
        </div>

        <!-- Row 2: Compact Stats Badges -->
        <div class="flex items-center gap-1.5 my-1.5 text-[9px] sm:text-[10px] font-mono font-bold flex-wrap">
          <span class="bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">🗡️ +${formatNumber(clickBonus)}%</span>
          <span class="bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">+${formatNumber(getKnifeCpsBonus(kn))} CPS</span>
          ${kn.statTrak ? `<span class="bg-orange-950/80 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30" title="Кликов StatTrak">🔥 ${formatNumber(kn.statTrak)}</span>` : ''}
        </div>

        <!-- Row 3: Collapsible Info Drawer -->
        <div id="knifeInfo_${kn.id}" class="${isInfoOpen ? '' : 'hidden'} p-2 my-1 rounded-xl bg-stone-900 border border-stone-700 text-[10px] text-stone-300 space-y-1">
          <p class="italic text-stone-400 text-[9px]">${kn.desc}</p>
          <div class="pt-1 border-t border-stone-800 flex justify-between text-[9px] font-mono">
            <span>База клика: x${kn.clickMult}</span>
            <span class="text-amber-300">Рост Lv: +35%</span>
          </div>
        </div>
      </div>

      <!-- Row 4: Compact Action Bar -->
      <div class="flex items-center gap-1 pt-1.5 border-t border-stone-800/80 mt-1">
        ${isEq ? `
          <button class="flex-1 py-1 px-2 rounded-xl text-[10px] font-game bg-emerald-600 text-white font-bold border border-emerald-400 shadow cursor-default">
            ✓ Надет
          </button>
        ` : `
          <button class="equip-knife-btn flex-1 py-1 px-2 rounded-xl text-[10px] font-game bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-bold border border-yellow-300 shadow jelly-btn" data-id="${kn.id}">
            Надеть
          </button>
        `}
        ${starCostInfo.maxReached ? `
          <button class="py-1 px-2 rounded-xl text-[10px] font-game bg-stone-900 text-stone-500 font-bold border border-stone-800 cursor-not-allowed" disabled>
            ★ МАКС
          </button>
        ` : (!canAffordSharpen ? `
          <button class="py-1 px-2 rounded-xl text-[10px] font-game bg-stone-900 text-stone-500 font-bold border border-stone-800 cursor-not-allowed opacity-60 flex items-center gap-1" disabled title="Недостаточно Блестяшек">
            <span>🔒</span> <span>${formatNumber(starCostInfo.cost)} ✨</span>
          </button>
        ` : `
          <button class="sharpen-knife-btn py-1 px-2 rounded-xl text-[10px] font-game bg-stone-800 hover:bg-stone-700 text-yellow-300 font-bold border border-yellow-500/40 jelly-btn flex items-center gap-1" data-id="${kn.id}" title="Повысить уровень заточки (+1 Lv)">
            <span>⭐</span> <span>${formatNumber(starCostInfo.cost)} ✨</span>
          </button>
        `)}
        ${!isEq ? `
          <button class="sell-knife-btn py-1 px-2 rounded-xl text-[10px] font-game bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-300 border border-stone-700 jelly-btn flex items-center gap-1" data-id="${kn.id}" data-price="${recyclePrice}" data-currency="${recycleCurrency}" data-symbol="${isAstral ? '🪠' : '🧻'}" title="Утилизировать нож за +${formatNumber(recyclePrice)} ${isAstral ? '🪠' : '🧻'}">
            +${formatNumber(recyclePrice)} ${recycleSymbol}
          </button>
        ` : ''}
      </div>
    `;

    invContainer.appendChild(card);
  });

  // Attach dynamic event listeners for knives
  invContainer.querySelectorAll('.knife-info-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const kid = btn.dataset.id;
      activeInfoCardId = activeInfoCardId === kid ? null : kid;
      renderKnivesGrid();
    });
  });

  invContainer.querySelectorAll('.equip-knife-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      GAME.equippedKnife = btn.dataset.id;
      updateHUD();
      renderCharacterInventory();
      saveLocal();
    });
  });

  invContainer.querySelectorAll('.sharpen-knife-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const kid = btn.dataset.id;
      const res = sharpenKnife(kid);
      if (res.success) {
        updateHUD();
        renderCharacterInventory();
        saveLocal();
        showKnifeToast(`⭐ Нож успешно заточен до Lv.${res.newStar}!`);
      } else {
        alert(res.msg);
      }
    });
  });

  invContainer.querySelectorAll('.sell-knife-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const kid = btn.dataset.id;
      const kn = KNIVES.find(k => k.id === kid);
      const price = parseInt(btn.dataset.price) || 25;
      const curr = btn.dataset.currency || 'rolls';
      const sym = btn.dataset.symbol || '🧻';
      const currName = curr === 'plungers' ? 'Астральных Вантузов' : 'Втулок Судьбы';
      if (confirm(`Утилизировать нож "${kn ? kn.name : kid}" и получить +${formatNumber(price)} ${sym} ${currName}?`)) {
        const idx = GAME.unlockedKnives.indexOf(kid);
        if (idx !== -1) {
          GAME.unlockedKnives.splice(idx, 1);
          if (GAME.equippedKnife === kid) GAME.equippedKnife = null;
          if (curr === 'plungers') {
            GAME.transcendPlungers = (GAME.transcendPlungers || 0) + price;
          } else {
            GAME.prestigeRolls = (GAME.prestigeRolls || 0) + price;
          }
          updateHUD();
          renderCharacterInventory();
          saveLocal();
        }
      }
    });
  });
}

function renderHatsGrid() {
  const container = document.getElementById('hatsInventoryContainer');
  if (!container) return;
  container.innerHTML = '';

  const allHats = SHOP_ITEMS.filter(i => i.type === 'hat' && (!i.retired || i.owned || GAME.equippedHat === i.id));
  allHats.forEach(hat => {
    const isEquipped = GAME.equippedHat === hat.id;
    const isInfoOpen = activeInfoCardId === hat.id;
    const hatLvl = getHatLevel(hat.id);
    const costInfo = getHatInlayCost(hat);
    const totalBoost = (hat.clickBoost || 1.0) * (1 + (hatLvl - 1) * 0.35);

    const card = document.createElement('div');
    card.className = `p-2 sm:p-2.5 rounded-2xl border-2 transition relative flex flex-col justify-between ${isEquipped ? 'border-pink-500 ring-2 ring-pink-500/40 bg-stone-900' : (hat.owned ? 'border-stone-700 bg-stone-950' : 'border-stone-800 bg-stone-950/60 opacity-80')}`;

    card.innerHTML = `
      <div>
        <!-- Row 1: Hat Icon, Name, Mini "!" button -->
        <div class="flex items-start justify-between gap-1.5">
          <div class="flex items-center gap-2 overflow-hidden flex-1">
            <span class="text-3xl shrink-0">${hat.icon}</span>
            <div class="truncate">
              <div class="font-game text-xs text-yellow-300 truncate font-bold flex items-center gap-1.5">
                <span>${hat.name}</span>
                ${hat.owned ? `<span class="text-pink-400 font-mono text-[10px]">💎 Lv.${hatLvl}</span>` : ''}
              </div>
              <div class="text-[9px] text-pink-300 mt-0.5 font-bold">${hat.desc} ${hat.owned && hatLvl > 1 ? `(Итог: x${formatNumber(totalBoost)})` : ''}</div>
            </div>
          </div>
          <button class="hat-info-toggle w-5 h-5 shrink-0 rounded-full bg-stone-800 hover:bg-stone-700 text-pink-300 border border-stone-600 flex items-center justify-center font-bold text-[11px] transition shadow" data-id="${hat.id}" title="Подробности">
            !
          </button>
        </div>

        <!-- Row 2: Collapsible Info Drawer -->
        <div id="hatInfo_${hat.id}" class="${isInfoOpen ? '' : 'hidden'} p-2 my-1.5 rounded-xl bg-stone-900 border border-stone-700 text-[10px] text-stone-300 space-y-1">
          <p class="text-stone-300 font-bold">${hat.desc}</p>
          <div class="text-[9px] text-stone-400">Базовый множитель: x${hat.clickBoost || 1.0}</div>
          ${hat.owned ? `<div class="text-[9px] text-pink-300 font-bold">Уровень инкрустации: 💎 Lv.${hatLvl} (Итог: x${totalBoost} к клику)</div>` : ''}
          <div class="text-[9px] text-amber-300">${hat.owned ? '✓ Куплено в Бутике' : `Стоимость: ${formatNumber(hat.cost)} ✨ Блестяшек`}</div>
        </div>
      </div>

      <!-- Row 3: Action Buttons -->
      <div class="flex items-center justify-between gap-1 pt-1.5 border-t border-stone-800/80 mt-1.5">
        ${hat.owned ? `
          <div class="flex items-center gap-1.5 w-full">
            ${isEquipped ? `
              <button class="unequip-hat-btn flex-1 py-1 px-2 rounded-xl text-[10px] font-game bg-emerald-600 text-white font-bold border border-emerald-400 shadow jelly-btn">
                ✓ Надет (Снять)
              </button>
            ` : `
              <button class="equip-hat-btn flex-1 py-1 px-2 rounded-xl text-[10px] font-game bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-bold border border-pink-400 shadow jelly-btn" data-id="${hat.id}">
                Надеть
              </button>
            `}
            <button class="inlay-hat-btn py-1 px-2 rounded-xl text-[10px] font-game ${costInfo.maxReached ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-stone-800 hover:bg-stone-700 text-pink-300 border border-pink-500/50'} font-bold shadow jelly-btn shrink-0" data-id="${hat.id}" title="Инкрустировать драгоценностями (+1 Lv)">
              💎 ${costInfo.maxReached ? 'MAX' : `+1 (${formatNumber(costInfo.cost)} ✨)`}
            </button>
          </div>
        ` : `
          <div class="flex items-center justify-between w-full">
            <span class="text-[10px] text-yellow-400 font-mono font-bold">${formatNumber(hat.cost)} ✨</span>
            <button class="buy-hat-inv-btn py-1 px-2.5 rounded-xl text-[10px] font-game ${GAME.sparkles >= hat.cost ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 border-yellow-300 jelly-btn' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'} font-bold border shadow" data-id="${hat.id}" ${GAME.sparkles >= hat.cost ? '' : 'disabled'}>
              Купить 🎩
            </button>
          </div>
        `}
      </div>
    `;
    container.appendChild(card);
  });

  // Attach dynamic event listeners for hats
  container.querySelectorAll('.hat-info-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const hid = btn.dataset.id;
      activeInfoCardId = activeInfoCardId === hid ? null : hid;
      renderHatsGrid();
    });
  });

  container.querySelectorAll('.equip-hat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      GAME.equippedHat = btn.dataset.id;
      updateHUD();
      renderShop();
      renderCharacterInventory();
      saveLocal();
    });
  });

  container.querySelectorAll('.unequip-hat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      GAME.equippedHat = null;
      updateHUD();
      renderShop();
      renderCharacterInventory();
      saveLocal();
    });
  });

  container.querySelectorAll('.buy-hat-inv-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hat = SHOP_ITEMS.find(i => i.id === btn.dataset.id);
      const curSp = Number(GAME.sparkles) || 0;
      if (hat && curSp >= hat.cost && !hat.owned) {
        GAME.sparkles = Math.max(0, curSp - hat.cost);
        hat.owned = true;
        GAME.equippedHat = hat.id;
        checkAchievements();
        renderShop();
        updateHUD();
        renderCharacterInventory();
        saveLocal();
        showKnifeToast(`🎩 Куплена и надета: ${hat.name}!`);
      }
    });
  });

  container.querySelectorAll('.inlay-hat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hid = btn.dataset.id;
      const res = inlayHat(hid);
      if (res.success) {
        updateHUD();
        renderCharacterInventory();
        renderShop();
        saveLocal();
        const hatObj = SHOP_ITEMS.find(i => i.id === hid);
        showKnifeToast(`💎 Шапка "${hatObj ? hatObj.name : hid}" инкрустирована до Lv.${res.newLevel}! (+35% силы)`);
      } else {
        alert(res.msg);
      }
    });
  });
}

export function initCharacterInventoryListeners() {
  document.getElementById('btnOpenCharacterInventory')?.addEventListener('click', () => openCharacterInventoryModal('knives'));
  document.getElementById('btnCanvasInventory')?.addEventListener('click', () => openCharacterInventoryModal('knives'));
  document.getElementById('btnOpenCharacterInventoryFromCases')?.addEventListener('click', () => openCharacterInventoryModal('knives'));

  document.getElementById('btnEquipBestKnifeInv')?.addEventListener('click', handleEquipBestKnife);

  // Tab switching
  document.getElementById('invTabKnives')?.addEventListener('click', () => {
    currentInvTab = 'knives';
    renderCharacterInventory();
  });
  document.getElementById('invTabHats')?.addEventListener('click', () => {
    currentInvTab = 'hats';
    renderCharacterInventory();
  });

  // Unequip Hat button in loadout slot
  document.getElementById('btnUnequipHat')?.addEventListener('click', () => {
    GAME.equippedHat = null;
    updateHUD();
    renderShop();
    renderCharacterInventory();
    saveLocal();
  });

  const searchInput = document.getElementById('knifeInvSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      knifeSearchQuery = e.target.value;
      renderKnivesGrid();
    });
  }

  const sortSelect = document.getElementById('knifeInvSort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      knifeSortMode = e.target.value;
      renderKnivesGrid();
    });
  }

  document.querySelectorAll('.knife-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      knifeFilterRarity = btn.dataset.filter || 'all';
      document.querySelectorAll('.knife-filter-btn').forEach(b => {
        if (b.dataset.filter === knifeFilterRarity) {
          b.className = 'knife-filter-btn px-2.5 py-1 rounded-lg text-[10px] font-bold transition bg-amber-600 text-white shadow';
        } else {
          b.className = 'knife-filter-btn px-2.5 py-1 rounded-lg text-[10px] font-bold transition bg-stone-800 text-stone-400 hover:text-white';
        }
      });
      renderKnivesGrid();
    });
  });

  document.getElementById('btnInvGoToShop')?.addEventListener('click', () => {
    currentInvTab = 'hats';
    renderCharacterInventory();
  });
}
