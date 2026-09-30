import { GAME } from '../core/state.js';
import { KNIVES } from '../data/knives.data.js';
import { getKnifeStar, getKnifeSharpenCost, getEquippedKnife, sharpenKnife, getBestKnife, equipBestKnife } from '../systems/knifeService.js';
import { getPoopSkinInfo } from '../progression/evolutionService.js';
import { saveLocal } from '../save/saveManager.js';
import { updateHUD } from './hudView.js';

let knifeFilterRarity = 'all';
let knifeSearchQuery = '';
let knifeSortMode = 'power';

export function openCharacterInventoryModal() {
  const modal = document.getElementById('characterInventoryModal');
  if (!modal) return;
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

function showKnifeToast(text) {
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
  // 1. Character Skin & Cosmetics Overview
  const skinInfo = getPoopSkinInfo(GAME.evoStage, GAME.girlyMode);
  const pIcon = document.getElementById('invPoopIcon');
  if (pIcon) pIcon.textContent = skinInfo.icon;
  const pName = document.getElementById('invPoopFormName');
  if (pName) pName.textContent = `Форма #${GAME.evoStage + 1}: ${skinInfo.name}`;
  const pTier = document.getElementById('invPoopTierBadge');
  if (pTier) pTier.textContent = `Тир ${skinInfo.tier}`;

  const hIcon = document.getElementById('invHatIcon');
  const hName = document.getElementById('invHatName');
  if (hIcon && hName) {
    if (GAME.selectedHat && GAME.selectedHat !== 'none') {
      hIcon.textContent = '🎩';
      hName.textContent = GAME.selectedHat;
    } else {
      hIcon.textContent = '🧢';
      hName.textContent = 'Без головного убора';
    }
  }

  // 2. Equipped Knife Card
  const equippedCard = document.getElementById('equippedKnifeCard');
  const equippedObj = getEquippedKnife();
  if (equippedCard) {
    if (equippedObj) {
      const eqStar = getKnifeStar(equippedObj.id);
      const eqClickPct = Math.round((equippedObj.clickMult * (1 + (eqStar - 1) * 0.35) - 1) * 100);
      const eqPassPct = Math.round((equippedObj.passiveMult * (1 + (eqStar - 1) * 0.25) - 1) * 100);
      equippedCard.innerHTML = `
        <div class="flex items-center justify-between gap-2 w-full">
          <div class="flex items-center gap-3">
            <span class="text-3xl">${equippedObj.icon}</span>
            <div>
              <div class="font-game text-sm text-yellow-300">${equippedObj.name} <span class="text-amber-400 font-black">★ Lv.${eqStar}</span></div>
              <div class="text-[10px] text-pink-300 font-bold">${equippedObj.rarityName} ★ <span class="text-emerald-300">+${eqClickPct}% Клик</span> ★ <span class="text-cyan-300">+${eqPassPct}% Заводы</span></div>
              <div class="text-[10px] text-orange-400 font-mono font-bold mt-0.5">★ StatTrak™: ${(equippedObj.statTrak || 0).toLocaleString()} кликов</div>
              <div class="text-[9px] text-stone-400 mt-0.5">${equippedObj.desc}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button id="btnEquipBestKnifeEquipped" class="bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black text-xs px-2.5 py-1.5 rounded-xl transition shadow jelly-btn flex items-center gap-1" title="Автоматически выбрать нож с наивысшим уроном и бонусами">
              ⚔️ Лучший
            </button>
            <button id="btnUnequipKnife" class="bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 text-xs px-2.5 py-1.5 rounded-xl font-bold">
              Снять
            </button>
          </div>
        </div>
      `;
      document.getElementById('btnUnequipKnife')?.addEventListener('click', () => {
        GAME.equippedKnife = null;
        updateHUD();
        renderCharacterInventory();
        saveLocal();
      });
      document.getElementById('btnEquipBestKnifeEquipped')?.addEventListener('click', handleEquipBestKnife);
    } else {
      equippedCard.innerHTML = `
        <div class="text-center py-2 flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
          <span class="text-stone-400 text-xs">Нож не экипирован (урон стандартный). Выберите нож ниже или:</span>
          <button id="btnEquipBestKnifeEmpty" class="bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black text-xs px-3 py-1.5 rounded-xl transition shadow jelly-btn flex items-center gap-1 shrink-0">
            ⚔️ Надеть лучший нож
          </button>
        </div>
      `;
      document.getElementById('btnEquipBestKnifeEmpty')?.addEventListener('click', handleEquipBestKnife);
    }
  }

  // 3. Knives Inventory Count Badge
  const countBadge = document.getElementById('knivesCountBadge');
  const unlockedCount = (GAME.unlockedKnives || []).length;
  if (countBadge) countBadge.textContent = `${unlockedCount} / ${KNIVES.length} найдено`;

  // 4. Knives Inventory Grid
  const invContainer = document.getElementById('knivesInventoryContainer');
  if (invContainer) {
    if (!GAME.unlockedKnives || GAME.unlockedKnives.length === 0) {
      invContainer.innerHTML = '<div class="col-span-2 text-center text-stone-500 py-6 text-xs">Коллекция ножей пуста. Открывайте кейсы во вкладке "Кейсы" за Золотые Втулки (🧻) или Астральные Вантузы (🪠)!</div>';
    } else {
      let filteredKnives = (GAME.unlockedKnives || [])
        .map(kid => KNIVES.find(k => k.id === kid))
        .filter(Boolean);

      // Search
      if (knifeSearchQuery.trim()) {
        const q = knifeSearchQuery.trim().toLowerCase();
        filteredKnives = filteredKnives.filter(k => 
          k.name.toLowerCase().includes(q) || 
          (k.rarityName && k.rarityName.toLowerCase().includes(q))
        );
      }

      // Filter by rarity
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

      // Sorting
      filteredKnives.sort((a, b) => {
        const starA = getKnifeStar(a.id);
        const starB = getKnifeStar(b.id);
        const clickA = a.clickMult * (1 + (starA - 1) * 0.35);
        const clickB = b.clickMult * (1 + (starB - 1) * 0.35);
        const passA = a.passiveMult * (1 + (starA - 1) * 0.25);
        const passB = b.passiveMult * (1 + (starB - 1) * 0.25);
        const powerA = clickA * 1.5 + passA;
        const powerB = clickB * 1.5 + passB;

        switch (knifeSortMode) {
          case 'power':
            return powerB - powerA;
          case 'click':
            return clickB - clickA;
          case 'passive':
            return passB - passA;
          case 'stattrak':
            return (b.statTrak || 0) - (a.statTrak || 0);
          case 'stars':
          case 'star':
            return starB - starA;
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return powerB - powerA;
        }
      });

      if (filteredKnives.length === 0) {
        invContainer.innerHTML = '<div class="col-span-2 text-center text-stone-400 py-6 text-xs">По вашему запросу ножи не найдены 🔍</div>';
      } else {
        invContainer.innerHTML = filteredKnives.map(kn => {
          const isEquipped = GAME.equippedKnife === kn.id;
          const star = getKnifeStar(kn.id);
          const costInfo = getKnifeSharpenCost(kn);
          const clickBonusPct = Math.round((kn.clickMult * (1 + (star - 1) * 0.35) - 1) * 100);
          const passBonusPct = Math.round((kn.passiveMult * (1 + (star - 1) * 0.25) - 1) * 100);
          const rarityClass = (kn.rarity === 'special' || kn.rarity === 'godly' || kn.rarity === 'celestial') 
            ? 'border-yellow-400 bg-yellow-950/30 shadow-[0_0_8px_rgba(250,204,21,0.25)]' 
            : (kn.rarity === 'covert' ? 'border-red-500 bg-red-950/30 shadow-[0_0_8px_rgba(239,68,68,0.25)]' 
            : (kn.rarity === 'classified' ? 'border-pink-500 bg-pink-950/30' : 'border-purple-500 bg-purple-950/30'));
          const sharpenBtnTxt = costInfo.maxReached ? '★ МАКС' : `⭐ Заточить (${costInfo.cost} ${costInfo.symbol})`;
          return `
            <div class="p-2.5 rounded-xl border-2 ${rarityClass} shadow flex flex-col justify-between ${isEquipped ? 'ring-2 ring-emerald-400' : ''}">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-xl">${kn.icon}</span>
                  <span class="text-[9px] font-bold uppercase text-stone-400">${kn.rarityName}</span>
                  <span class="text-[10px] font-black text-amber-400">★ Lv.${star}</span>
                </div>
                <div class="font-game text-xs text-yellow-300 mt-1 truncate" title="${kn.name}">${kn.name}</div>
                <div class="flex items-center justify-between mt-0.5">
                  <span class="text-[10px] text-emerald-400 font-bold">+${clickBonusPct}% Клик</span>
                  <span class="text-[10px] text-cyan-400 font-bold">+${passBonusPct}% Зав</span>
                </div>
                <div class="text-[9px] text-orange-400 font-mono font-bold mt-0.5">
                  ★ StatTrak: ${(kn.statTrak || 0).toLocaleString()}
                </div>
              </div>
              <div class="flex flex-col gap-1.5 mt-2.5">
                <div class="flex gap-1.5">
                  <button class="equip-knife-btn flex-1 py-1 rounded-lg text-[10px] font-bold ${isEquipped ? 'bg-emerald-600 text-white cursor-default' : 'bg-amber-600 hover:bg-amber-500 text-white jelly-btn'}" data-id="${kn.id}">
                    ${isEquipped ? '✓ НАДЕТ' : 'НАДЕТЬ'}
                  </button>
                  <button class="sell-knife-btn bg-stone-800 hover:bg-stone-700 text-yellow-300 font-bold px-2 py-1 rounded-lg text-[10px] border border-stone-700" data-id="${kn.id}" data-price="${kn.rarity === 'special' ? 60 : (kn.rarity === 'covert' ? 25 : (kn.rarity === 'classified' ? 12 : (kn.rarity === 'restricted' ? 5 : 2)))}" title="Утилизировать за Втулки">
                    +${kn.rarity === 'special' ? 60 : (kn.rarity === 'covert' ? 25 : (kn.rarity === 'classified' ? 12 : (kn.rarity === 'restricted' ? 5 : 2)))} 🧻
                  </button>
                </div>
                <button class="sharpen-knife-btn w-full py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition ${costInfo.maxReached ? 'opacity-50 cursor-not-allowed' : ''}" data-id="${kn.id}" ${costInfo.maxReached ? 'disabled' : ''}>
                  ${sharpenBtnTxt}
                </button>
              </div>
            </div>
          `;
        }).join('');

        invContainer.querySelectorAll('.equip-knife-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            GAME.equippedKnife = btn.dataset.id;
            updateHUD();
            renderCharacterInventory();
            saveLocal();
          });
        });

        invContainer.querySelectorAll('.sharpen-knife-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sharpenKnife(btn.dataset.id);
            renderCharacterInventory();
            updateHUD();
            saveLocal();
          });
        });

        invContainer.querySelectorAll('.sell-knife-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const kid = btn.dataset.id;
            const kn = KNIVES.find(k => k.id === kid);
            const price = parseInt(btn.dataset.price) || 2;
            if (confirm(`Утилизировать нож "${kn ? kn.name : kid}" и получить +${price} 🧻 Втулок Судьбы?`)) {
              const idx = GAME.unlockedKnives.indexOf(kid);
              if (idx !== -1) {
                GAME.unlockedKnives.splice(idx, 1);
                if (GAME.equippedKnife === kid) GAME.equippedKnife = null;
                GAME.prestigeRolls += price;
                updateHUD();
                renderCharacterInventory();
                saveLocal();
              }
            }
          });
        });
      }
    }
  }
}

export function initCharacterInventoryListeners() {
  document.getElementById('btnOpenCharacterInventory')?.addEventListener('click', openCharacterInventoryModal);
  document.getElementById('btnCanvasInventory')?.addEventListener('click', openCharacterInventoryModal);
  document.getElementById('btnOpenCharacterInventoryFromCases')?.addEventListener('click', openCharacterInventoryModal);

  document.getElementById('btnEquipBestKnifeInv')?.addEventListener('click', handleEquipBestKnife);

  const searchInput = document.getElementById('knifeInvSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      knifeSearchQuery = e.target.value;
      renderCharacterInventory();
    });
  }

  const sortSelect = document.getElementById('knifeInvSort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      knifeSortMode = e.target.value;
      renderCharacterInventory();
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
      renderCharacterInventory();
    });
  });

  document.getElementById('btnInvGoToShop')?.addEventListener('click', () => {
    document.getElementById('characterInventoryModal')?.classList.add('hidden');
    // Switch to shop tab
    const shopTab = document.querySelector('.dash-tab[data-target="panelShop"]');
    if (shopTab) shopTab.click();
  });
}
