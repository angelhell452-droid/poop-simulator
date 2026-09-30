import { GAME } from '../core/state.js';
import { KNIVES } from '../data/knives.data.js';
import { getKnifeStar, getKnifeSharpenCost, sharpenKnife } from '../systems/knifeService.js';
import { saveLocal } from '../save/saveManager.js';
import { updateHUD } from './hudView.js';
import { renderCasesSystem } from './casesView.js';

let indexFilterRarity = 'all';
let indexFilterStatus = 'all';
let indexSearchQuery = '';

export function openKnivesIndexModal() {
  const modal = document.getElementById('knivesIndexModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  renderKnivesIndexBook();
}

export function closeKnivesIndexModal() {
  const modal = document.getElementById('knivesIndexModal');
  if (!modal) return;
  modal.classList.add('hidden');
}

export function renderKnivesIndexBook() {
  const grid = document.getElementById('knivesIndexGrid');
  if (!grid) return;

  const unlockedSet = new Set(GAME.unlockedKnives || []);
  const totalUnlocked = unlockedSet.size;
  const totalKnives = KNIVES.length;
  const pct = ((totalUnlocked / totalKnives) * 100).toFixed(1);

  const pCount = document.getElementById('indexBookProgressCount');
  if (pCount) pCount.textContent = `${totalUnlocked} / ${totalKnives} Открыто`;

  const pPct = document.getElementById('indexBookProgressPercent');
  if (pPct) pPct.textContent = `${pct}%`;

  const pBar = document.getElementById('indexBookProgressBar');
  if (pBar) pBar.style.width = `${pct}%`;

  const topBadge = document.getElementById('topKnivesIndexCount');
  if (topBadge) topBadge.textContent = `${totalUnlocked}/${totalKnives}`;

  const pnlBadge = document.getElementById('indexBookHeaderBadge');
  if (pnlBadge) pnlBadge.textContent = `${totalUnlocked} / ${totalKnives}`;

  const milestones = [
    { el: 'milestone10', count: 10 },
    { el: 'milestone25', count: 25 },
    { el: 'milestone50', count: 50 },
    { el: 'milestone100', count: 100 },
    { el: 'milestone150', count: 150 },
    { el: 'milestone200', count: 200 }
  ];
  milestones.forEach(m => {
    const mel = document.getElementById(m.el);
    if (!mel) return;
    if (totalUnlocked >= m.count) {
      mel.className = 'p-1 rounded-lg bg-emerald-950/80 border-2 border-emerald-400 text-center text-emerald-300 font-bold shadow-[0_0_10px_rgba(52,211,153,0.3)]';
    } else {
      mel.className = 'p-1 rounded-lg bg-stone-800/80 border border-stone-700 text-center text-stone-500';
    }
  });

  const filtered = KNIVES.filter(k => {
    const isUnlocked = unlockedSet.has(k.id);
    if (indexFilterStatus === 'unlocked' && !isUnlocked) return false;
    if (indexFilterStatus === 'locked' && isUnlocked) return false;

    if (indexFilterRarity !== 'all') {
      if (indexFilterRarity === 'common' && k.rarity !== 'common' && k.rarity !== 'mil-spec') return false;
      else if (indexFilterRarity === 'very_rare' && k.rarity !== 'very_rare' && k.rarity !== 'restricted') return false;
      else if (indexFilterRarity === 'godly' && k.rarity !== 'godly' && k.rarity !== 'special') return false;
      else if (indexFilterRarity !== 'common' && indexFilterRarity !== 'very_rare' && indexFilterRarity !== 'godly' && k.rarity !== indexFilterRarity) return false;
    }

    if (indexSearchQuery.trim()) {
      const q = indexSearchQuery.toLowerCase();
      const matchName = k.name.toLowerCase().includes(q);
      const matchRarity = k.rarityName.toLowerCase().includes(q);
      if (!matchName && !matchRarity) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-12 text-stone-500 text-xs text-center">Ножи по выбранным фильтрам не найдены. Попробуйте сбросить фильтры!</div>`;
    return;
  }

  grid.innerHTML = filtered.map(k => {
    const isUnlocked = unlockedSet.has(k.id);
    const isEquipped = GAME.equippedKnife === k.id;
    const rarityClass = 'rarity-' + k.rarity;

    if (isUnlocked) {
      const star = getKnifeStar(k.id);
      const costInfo = getKnifeSharpenCost(k);
      const clickBonusPct = Math.round((k.clickMult * (1 + (star - 1) * 0.35) - 1) * 100);
      return `
        <div class="p-2.5 rounded-2xl border-2 ${rarityClass} shadow flex flex-col justify-between text-left relative transition hover:scale-[1.02]">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-2xl filter drop-shadow">${k.icon}</span>
              <div class="flex items-center gap-1">
                <span class="text-[9px] font-black text-amber-300">★ Lv.${star}</span>
                <span class="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-black/60 text-yellow-300 border border-yellow-400/40">${k.rarityName}</span>
              </div>
            </div>
            <div class="font-game text-xs text-yellow-200 mt-1 truncate" title="${k.name}">${k.name}</div>
            <div class="text-[10px] text-emerald-400 font-bold mt-0.5">+${clickBonusPct}% Клик</div>
            <div class="text-[9px] text-stone-400 font-mono mt-0.5">★ StatTrak™: ${(k.statTrak || 0)}</div>
          </div>
          <div class="mt-2 flex flex-col gap-1">
            <button class="index-equip-btn w-full py-1 rounded-lg text-[10px] font-bold ${isEquipped ? 'bg-emerald-600 text-white cursor-default' : 'bg-amber-600 hover:bg-amber-500 text-white jelly-btn'}" data-id="${k.id}">
              ${isEquipped ? '✓ НАДЕТ' : 'НАДЕТЬ'}
            </button>
            <button class="index-sharpen-btn w-full py-0.5 rounded text-[9px] font-bold bg-amber-500/80 hover:bg-amber-400 text-stone-950 ${costInfo.maxReached ? 'opacity-40 cursor-not-allowed' : ''}" data-id="${k.id}" ${costInfo.maxReached ? 'disabled' : ''}>
              ${costInfo.maxReached ? '★ МАКС' : `⭐ Заточить (${costInfo.cost} ${costInfo.symbol})`}
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="p-2.5 rounded-2xl border-2 border-stone-800 bg-stone-950/80 shadow flex flex-col justify-between text-left opacity-75 relative">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-2xl opacity-40">🔒</span>
              <span class="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded bg-stone-900 text-stone-400 border border-stone-800">${k.rarityName}</span>
            </div>
            <div class="font-game text-xs text-stone-500 mt-1 truncate">??? Заблокировано</div>
            <div class="text-[10px] text-stone-500 mt-0.5">Множитель: ???</div>
            <div class="text-[9px] text-amber-500/80 mt-1 italic">Выпадает из кейсов</div>
          </div>
          <div class="mt-2">
            <div class="w-full py-1 rounded-lg text-[10px] font-bold bg-stone-900 text-stone-600 text-center border border-stone-800">
              НЕ ОТКРЫТ
            </div>
          </div>
        </div>
      `;
    }
  }).join('');

  grid.querySelectorAll('.index-equip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      GAME.equippedKnife = btn.dataset.id;
      updateHUD();
      renderKnivesIndexBook();
      renderCasesSystem();
      saveLocal();
    });
  });

  grid.querySelectorAll('.index-sharpen-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sharpenKnife(btn.dataset.id);
      renderKnivesIndexBook();
      renderCasesSystem();
      updateHUD();
      saveLocal();
    });
  });
}

export function initKnivesIndexListeners() {
  const btnOpenIndexModal = document.getElementById('btnOpenKnivesIndexModal');
  if (btnOpenIndexModal) btnOpenIndexModal.addEventListener('click', openKnivesIndexModal);

  const btnTopIndexModal = document.getElementById('btnTopKnivesIndex');
  if (btnTopIndexModal) btnTopIndexModal.addEventListener('click', openKnivesIndexModal);

  const btnCloseIndexModal = document.getElementById('btnCloseKnivesIndex');
  if (btnCloseIndexModal) btnCloseIndexModal.addEventListener('click', closeKnivesIndexModal);

  const searchInput = document.getElementById('knifeIndexSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      indexSearchQuery = e.target.value;
      renderKnivesIndexBook();
    });
  }

  document.querySelectorAll('.index-status-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.index-status-filter-btn').forEach(b => {
        b.className = 'index-status-filter-btn px-2.5 py-1 rounded-lg text-stone-400 hover:text-white';
      });
      btn.className = 'index-status-filter-btn px-2.5 py-1 rounded-lg bg-yellow-500 text-stone-950 font-bold';
      indexFilterStatus = btn.dataset.status;
      renderKnivesIndexBook();
    });
  });

  document.querySelectorAll('.index-rarity-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.index-rarity-filter-btn').forEach(b => {
        b.classList.remove('bg-yellow-500', 'text-stone-950');
      });
      btn.classList.add('bg-yellow-500', 'text-stone-950');
      indexFilterRarity = btn.dataset.rarity;
      renderKnivesIndexBook();
    });
  });
}
