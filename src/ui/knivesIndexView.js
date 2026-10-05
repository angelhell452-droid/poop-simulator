import { GAME } from '../core/state.js?v=5.0.29';
import { KNIVES } from '../data/knives.data.js';
import { WEAPON_CASES } from '../data/cases.data.js';
import { FACTORIES } from '../data/factories.data.js?v=5.0.29';
import { SHOP_ITEMS, BOUTIQUE_REPEATABLES } from '../data/shop.data.js?v=5.0.29';
import { TALENTS } from '../data/talents.data.js';
import { getKnifeStar, getKnifeSharpenCost, sharpenKnife, getHatLevel } from '../systems/knifeService.js';
import { saveLocal } from '../save/saveManager.js?v=5.0.29';
import { updateHUD } from './hudView.js?v=5.0.29';
import { renderCasesSystem } from './casesView.js?v=5.0.29';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.29';
import { getKnifeImageHtml } from '../utils/knifeIcons.js';
import { hatArtHtml } from './artIcon.js?v=5.0.17';
import { getHatClickMult, getKnifeShownBonuses } from '../economy/production.js?v=5.0.29';
import { getKnifeCpsBonus } from '../systems/autoclickService.js?v=5.0.29';

// Быстрый поиск кейса для ножа
const KNIFE_CASE_MAP = new Map();
WEAPON_CASES.forEach(c => {
  (c.pool || []).forEach(kid => {
    if (!KNIFE_CASE_MAP.has(kid)) {
      KNIFE_CASE_MAP.set(kid, { id: c.id, name: c.name, icon: c.icon, cost: c.cost, currency: c.currency });
    }
  });
});

let currentCategory = 'knives'; // 'knives' | 'factories' | 'hats' | 'perks'
let indexFilterRarity = 'all';
let indexFilterStatus = 'all';
let indexSearchQuery = '';

export function openKnivesIndexModal() {
  const modal = document.getElementById('knivesIndexModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  switchIndexCategory(currentCategory);
}

export function closeKnivesIndexModal() {
  const modal = document.getElementById('knivesIndexModal');
  if (!modal) return;
  modal.classList.add('hidden');
}

export function switchIndexCategory(cat) {
  currentCategory = cat;

  const tabs = {
    knives: document.getElementById('tabIndexKnives'),
    factories: document.getElementById('tabIndexFactories'),
    hats: document.getElementById('tabIndexHats'),
    perks: document.getElementById('tabIndexPerks')
  };

  const views = {
    knives: document.getElementById('viewIndexKnives'),
    factories: document.getElementById('viewIndexFactories'),
    hats: document.getElementById('viewIndexHats'),
    perks: document.getElementById('viewIndexPerks')
  };

  for (const key in tabs) {
    if (tabs[key]) {
      if (key === cat) {
        tabs[key].className = 'index-category-tab px-3 py-1.5 rounded-xl font-game text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-md';
      } else {
        tabs[key].className = 'index-category-tab px-3 py-1.5 rounded-xl font-game text-xs font-bold bg-stone-900 text-stone-400 hover:text-white border border-stone-800';
      }
    }
    if (views[key]) {
      views[key].classList.toggle('hidden', key !== cat);
    }
  }

  if (cat === 'knives') renderKnivesIndexBook();
  else if (cat === 'factories') renderFactoriesIndex();
  else if (cat === 'hats') renderHatsIndex();
  else if (cat === 'perks') renderPerksIndex();
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
    if (indexFilterRarity !== 'all' && k.rarity !== indexFilterRarity) return false;
    if (indexSearchQuery.trim()) {
      const q = indexSearchQuery.toLowerCase().trim();
      return k.name.toLowerCase().includes(q) || (k.caseName && k.caseName.toLowerCase().includes(q));
    }
    return true;
  });

  grid.innerHTML = filtered.map(knife => {
    const isUnlocked = unlockedSet.has(knife.id);
    const isEquipped = GAME.equippedKnife === knife.id;
    const star = getKnifeStar(knife.id);
    const costInfo = getKnifeSharpenCost(knife);
    const caseInfo = KNIFE_CASE_MAP.get(knife.id) || { name: 'Коллекция', icon: '📦' };

    const rarityColors = {
      common: 'border-stone-600 bg-stone-900/60 text-stone-400',
      rare: 'border-sky-500 bg-sky-950/40 text-sky-400',
      very_rare: 'border-indigo-500 bg-indigo-950/40 text-indigo-400',
      epic: 'border-purple-500 bg-purple-950/40 text-purple-400',
      classified: 'border-pink-500 bg-pink-950/40 text-pink-400',
      covert: 'border-red-500 bg-red-950/40 text-red-400',
      rainbow: 'border-yellow-400 bg-gradient-to-br from-red-950/40 via-purple-950/40 to-blue-950/40 text-yellow-300',
      celestial: 'border-cyan-400 bg-cyan-950/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]',
      titanium: 'border-teal-400 bg-teal-950/50 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]',
      godly: 'border-amber-400 bg-amber-950/60 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-pulse'
    };

    const colorClass = rarityColors[knife.rarity] || 'border-stone-700 bg-stone-900 text-stone-400';
    const shown = getKnifeShownBonuses(knife);
    const clickPct = shown.clickPct;

    return `
      <div class="p-2 sm:p-2.5 rounded-2xl border-2 flex flex-col justify-between relative transition duration-200 min-h-[195px] overflow-hidden ${isUnlocked ? colorClass : 'border-stone-800 bg-stone-950/80 opacity-65 grayscale'} ${isEquipped ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : ''}">
        ${isEquipped ? '<span class="absolute top-1.5 right-1.5 text-[8.5px] bg-yellow-400 text-stone-950 font-black px-1.5 py-0.5 rounded-full shadow z-10">НАДЕТ</span>' : ''}
        ${!isUnlocked ? '<span class="absolute top-1.5 right-1.5 text-xs text-stone-500 z-10">🔒</span>' : ''}
        
        <div class="flex flex-col items-center text-center w-full">
          <div class="my-0.5 flex justify-center items-center select-none h-14">${getKnifeImageHtml(knife, 50)}</div>
          <div class="font-game text-xs font-bold text-yellow-100 line-clamp-1 w-full text-center px-0.5" title="${knife.name}">${knife.name}</div>
          <div class="mt-1 text-[8.5px] font-bold text-amber-300/90 bg-stone-950/80 px-2 py-0.5 rounded-full border border-amber-500/30 truncate max-w-full inline-flex items-center gap-1 shadow-sm" title="Выпадает из: ${caseInfo.name}">
            <span>${caseInfo.icon}</span> <span class="truncate">${caseInfo.name}</span>
          </div>
        </div>

        <div class="mt-2 pt-1.5 border-t border-stone-800/80 w-full">
          ${isUnlocked ? `
            <div class="flex justify-between items-center text-[10px] font-bold mb-1">
              <span class="text-amber-400">★ Lv.${star}</span>
              <span class="text-emerald-400">+${formatNumber(clickPct)}% Клик</span>
            </div>
            <div class="text-[9px] text-cyan-300 font-mono text-center mb-1.5">+${formatNumber(getKnifeCpsBonus(knife))} CPS</div>
            <div class="flex gap-1">
              ${!isEquipped ? `
                <button class="index-equip-btn flex-1 py-1 rounded-xl text-[10px] font-game bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition shadow" data-id="${knife.id}">
                  Надеть
                </button>
              ` : `
                <span class="flex-1 py-1 text-center text-[10px] font-game text-yellow-300 font-bold">✓ В руке</span>
              `}
              ${costInfo.maxReached ? `
                <button class="px-2 py-1 rounded-xl text-[10px] font-game bg-stone-900 text-stone-500 font-bold border border-stone-800 cursor-not-allowed" disabled>
                  ★ МАКС
                </button>
              ` : ((GAME.sparkles || 0) < costInfo.cost ? `
                <button class="px-2 py-1 rounded-xl text-[10px] font-game bg-stone-900 text-stone-500 font-bold border border-stone-800 cursor-not-allowed opacity-60 flex items-center gap-1" disabled title="Недостаточно Блестяшек">
                  <span>🔒</span> <span>${formatNumber(costInfo.cost)} ✨</span>
                </button>
              ` : `
                <button class="index-sharpen-btn px-2 py-1 rounded-xl text-[10px] font-game bg-stone-800 hover:bg-stone-700 text-yellow-300 border border-yellow-500/40 font-bold shadow jelly-btn flex items-center gap-1" data-id="${knife.id}" title="Заточить нож (+1 Lv)">
                  ⭐ +1 (${formatNumber(costInfo.cost)} ✨)
                </button>
              `)}
            </div>
          ` : `
            <div class="text-[9px] text-stone-400 text-center py-1 bg-stone-900/60 rounded-lg border border-stone-800/60">
              Выпадает из <b class="text-yellow-400 font-bold">${caseInfo.name}</b>
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.index-equip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
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

export function renderFactoriesIndex() {
  const container = document.getElementById('viewIndexFactories');
  if (!container) return;

  container.innerHTML = FACTORIES.map((fac, idx) => {
    const isUnlocked = (GAME.evoStage || 0) >= (fac.reqStage || 0);
    const count = fac.count || 0;
    const isActive = count > 0;

    return `
      <div class="p-3 rounded-2xl border ${isActive ? 'border-amber-500/60 bg-stone-900/90 shadow' : 'border-stone-800 bg-stone-950/70'} flex items-start gap-3">
        <span class="text-3xl shrink-0 p-2 bg-stone-800/80 rounded-xl border border-stone-700">${fac.icon}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="font-game text-xs font-bold ${isActive ? 'text-yellow-300' : 'text-stone-200'} truncate">#${idx + 1} ${fac.name}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${isActive ? 'bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-400'} shrink-0">
              ${isActive ? `${count} шт` : (isUnlocked ? '0 шт' : '🔒 Заблокировано')}
            </span>
          </div>
          <div class="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
            <span class="text-emerald-400 font-bold">+${formatNumber(fac.baseCps)}/сек</span>
            <span>•</span>
            <span class="text-yellow-400 font-mono">База: ${formatNumber(fac.cost)} 💨</span>
          </div>
          <div class="text-[9px] text-stone-500 mt-0.5">
            Тир: <b class="text-stone-300 uppercase">${fac.tier || 'early'}</b> (Требуется форма: #${formatNumber((fac.reqStage || 0) + 1)})
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function renderHatsIndex() {
  const container = document.getElementById('viewIndexHats');
  if (!container) return;

  const hats = SHOP_ITEMS.filter(i => i.type === 'hat');
  container.innerHTML = hats.map(hat => {
    const isOwned = !!hat.owned;
    const isEquipped = GAME.equippedHat === hat.id;
    const hatLvl = getHatLevel(hat.id);
    const liveBoost = getHatClickMult(hat, isOwned ? hatLvl : 1);

    return `
      <div class="p-2.5 rounded-2xl border ${isEquipped ? 'border-pink-500 bg-pink-950/30 ring-2 ring-pink-500/50' : (isOwned ? 'border-stone-700 bg-stone-900/80' : 'border-stone-800 bg-stone-950/60 opacity-70')} flex flex-col justify-between text-left">
        <div>
          <div class="flex items-center justify-between">
            <span>${hatArtHtml(hat, 40)}</span>
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded ${isEquipped ? 'bg-pink-500 text-white' : (isOwned ? 'bg-stone-800 text-pink-300' : 'bg-stone-900 text-stone-500')}">
              ${isEquipped ? 'НАДЕТО' : (isOwned ? `💎 Lv.${hatLvl}` : 'В БУТИКЕ')}
            </span>
          </div>
          <div class="font-game text-xs font-bold text-yellow-200 mt-1 truncate">${hat.name}</div>
          <div class="text-[9px] text-pink-300 font-currency mt-0.5">x${formatNumber(liveBoost)} к силе клика</div>
        </div>
        <div class="mt-2 pt-1 border-t border-stone-800/80 text-[10px] flex justify-between items-center">
          <span class="text-yellow-400 font-mono font-bold">${formatNumber(hat.cost)} ✨</span>
          <span class="text-emerald-400 font-bold">x${formatNumber(liveBoost)} Клик</span>
        </div>
      </div>
    `;
  }).join('');
}

export function renderPerksIndex() {
  const container = document.getElementById('viewIndexPerks');
  if (!container) return;

  const perks = SHOP_ITEMS.filter(i => i.type === 'perk');

  let html = `
    <div class="col-span-1 sm:col-span-2 text-left mb-1">
      <h4 class="font-game text-xs text-yellow-300 font-bold uppercase tracking-wider">🌟 Перки Бутика и Улучшения</h4>
    </div>
  `;

  html += perks.map(p => {
    const isOwned = !!p.owned;
    return `
      <div class="p-2.5 rounded-2xl border ${isOwned ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-stone-800 bg-stone-950/80'} flex items-start gap-2.5 text-left">
        <span class="text-2xl shrink-0 p-1.5 bg-stone-800/80 rounded-xl">${p.icon}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="font-game text-xs font-bold ${isOwned ? 'text-yellow-300' : 'text-stone-300'} truncate">${p.name}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-black ${isOwned ? 'bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-400'}">
              ${isOwned ? '✓ КУПЛЕНО' : `${formatNumber(p.cost)} ✨`}
            </span>
          </div>
          <div class="text-[10px] text-stone-400 mt-0.5">${p.desc}</div>
        </div>
      </div>
    `;
  }).join('');

  html += `
    <div class="col-span-1 sm:col-span-2 text-left mt-3 mb-1">
      <h4 class="font-game text-xs text-yellow-300 font-bold uppercase tracking-wider">🔮 Усиления Бутика</h4>
    </div>
  `;

  html += BOUTIQUE_REPEATABLES.map(b => {
    const curLvl = GAME.boutiqueLevels?.[b.id] || 0;
    return `
      <div class="p-2.5 rounded-2xl border border-stone-800 bg-stone-950/80 flex items-start gap-2.5 text-left">
        <span class="text-2xl shrink-0 p-1.5 bg-stone-800/80 rounded-xl">${b.icon}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="font-game text-xs font-bold text-yellow-300 truncate">${b.name}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-black bg-purple-900 text-purple-200">
              Lv.${curLvl}
            </span>
          </div>
          <div class="text-[10px] text-stone-400 mt-0.5">${b.desc}</div>
        </div>
      </div>
    `;
  }).join('');

  html += `
    <div class="col-span-1 sm:col-span-2 text-left mt-3 mb-1">
      <h4 class="font-game text-xs text-yellow-300 font-bold uppercase tracking-wider">📜 Священные Таланты Смыва</h4>
    </div>
  `;

  html += TALENTS.map(t => {
    const curLvl = t.level || 0;
    return `
      <div class="p-2.5 rounded-2xl border border-stone-800 bg-stone-950/80 flex items-start gap-2.5 text-left">
        <span class="text-2xl shrink-0 p-1.5 bg-stone-800/80 rounded-xl">${t.icon}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="font-game text-xs font-bold text-yellow-300 truncate">${t.name}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-black bg-amber-950 text-amber-300 border border-amber-800/50">
              Lv.${curLvl} / ${t.max}
            </span>
          </div>
          <div class="text-[10px] text-stone-400 mt-0.5">${t.desc}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

export function initKnivesIndexListeners() {
  const btnOpenIndexModal = document.getElementById('btnOpenKnivesIndexModal');
  if (btnOpenIndexModal) btnOpenIndexModal.addEventListener('click', openKnivesIndexModal);

  const btnTopIndexModal = document.getElementById('btnTopKnivesIndex');
  if (btnTopIndexModal) btnTopIndexModal.addEventListener('click', openKnivesIndexModal);

  const btnCloseIndexModal = document.getElementById('btnCloseKnivesIndex');
  if (btnCloseIndexModal) btnCloseIndexModal.addEventListener('click', closeKnivesIndexModal);

  // Category Tabs
  document.getElementById('tabIndexKnives')?.addEventListener('click', () => switchIndexCategory('knives'));
  document.getElementById('tabIndexFactories')?.addEventListener('click', () => switchIndexCategory('factories'));
  document.getElementById('tabIndexHats')?.addEventListener('click', () => switchIndexCategory('hats'));
  document.getElementById('tabIndexPerks')?.addEventListener('click', () => switchIndexCategory('perks'));

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
