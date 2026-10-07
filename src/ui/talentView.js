import { GAME } from '../core/state.js?v=5.0.54';
import { TALENTS } from '../data/talents.data.js';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js?v=5.0.54';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.54';
import { drawPlunger } from '../utils/icons.js?v=5.0.54';
import { getAffordableTalentInfo, buyTalent } from '../systems/talentService.js';
import { buyTranscendUpgrade } from '../prestige/transcendService.js?v=5.0.54';
import { updateHUD } from './hudView.js?v=5.0.54';
import { saveLocal } from '../save/saveManager.js?v=5.0.54';
import { getRollIcon } from '../utils/icons.js';
import { isRelicSectionUnlocked, isTalentVisible } from '../progression/unlocks.js';

let activeTalentSubTab = 'flush'; // 'flush' | 'transcend'
let activeFlushTier = 'all'; // 'all' | '1' | '2' | '3' | '4'
let activeTranscendTier = 'all'; // 'all' | '1' | '2' | '3' | '4'

export function switchTalentSubTab(tabName) {
  if (tabName === 'transcend' && !isRelicSectionUnlocked()) return;
  activeTalentSubTab = tabName;
  const btnFlush = document.getElementById('tabTalentsFlush');
  const btnTranscend = document.getElementById('tabTalentsTranscend');
  const viewFlush = document.getElementById('viewTalentsFlush');
  const viewTranscend = document.getElementById('viewTalentsTranscend');

  if (tabName === 'flush') {
    if (btnFlush) {
      btnFlush.className = 'talent-sub-tab flex-1 py-1.5 px-3 rounded-xl font-game text-xs flex items-center justify-center gap-1.5 transition font-bold bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md border border-yellow-400';
    }
    if (btnTranscend) {
      btnTranscend.className = 'talent-sub-tab flex-1 py-1.5 px-3 rounded-xl font-game text-xs flex items-center justify-center gap-1.5 transition font-bold bg-stone-900 text-stone-400 hover:text-cyan-300 border border-stone-800';
    }
    if (viewFlush) viewFlush.classList.remove('hidden');
    if (viewTranscend) viewTranscend.classList.add('hidden');
    renderFlushTalents();
  } else {
    if (btnFlush) {
      btnFlush.className = 'talent-sub-tab flex-1 py-1.5 px-3 rounded-xl font-game text-xs flex items-center justify-center gap-1.5 transition font-bold bg-stone-900 text-stone-400 hover:text-yellow-300 border border-stone-800';
    }
    if (btnTranscend) {
      btnTranscend.className = 'talent-sub-tab flex-1 py-1.5 px-3 rounded-xl font-game text-xs flex items-center justify-center gap-1.5 transition font-bold bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-700 text-white shadow-md border border-cyan-400';
    }
    if (viewFlush) viewFlush.classList.add('hidden');
    if (viewTranscend) viewTranscend.classList.remove('hidden');
    renderTranscendRelics();
  }
}

export function initTalentsListeners() {
  document.getElementById('tabTalentsFlush')?.addEventListener('click', () => {
    switchTalentSubTab('flush');
  });
  document.getElementById('tabTalentsTranscend')?.addEventListener('click', () => {
    switchTalentSubTab('transcend');
  });

  document.querySelectorAll('.talent-flush-tier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFlushTier = btn.dataset.tier;
      renderFlushTalents();
    });
  });

  document.querySelectorAll('.talent-transcend-tier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTranscendTier = btn.dataset.tier;
      renderTranscendRelics();
    });
  });
}

export function renderFlushTalents() {
  const container = document.getElementById('talentsContainer');
  if (!container) return;
  container.innerHTML = '';

  const label = document.getElementById('talentRollsLabel');
  if (label) label.innerHTML = `${formatNumber(GAME.prestigeRolls)} <span class="roll-icon"></span>`;

  // Update tier filter button styles
  document.querySelectorAll('.talent-flush-tier-btn').forEach(b => {
    const isAct = b.dataset.tier === String(activeFlushTier);
    if (isAct) {
      b.className = 'talent-flush-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-400';
    } else {
      b.className = 'talent-flush-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold bg-stone-900 text-stone-400 hover:text-yellow-300 border border-stone-800';
    }
  });

  const buyMultiplier = GAME.buyMultiplier || 1;

  // Group by Tiers: 1, 2, 3, 4
  const tierConfigs = [
    { tier: 1, title: '⭐ Тир 1: Базовый', desc: 'Сразу, ещё до первого Смыва' },
    { tier: 2, title: '⚡ Тир 2: Продвинутый', desc: 'После 1 Смыва' },
    { tier: 3, title: '🔮 Тир 3: Мастер', desc: 'После 3 Смывов' },
    { tier: 4, title: '🌌 Тир 4: Астральный', desc: 'После 8 Прорывов' }
  ];

  const visibleConfigs = activeFlushTier === 'all'
    ? tierConfigs
    : tierConfigs.filter(t => t.tier === Number(activeFlushTier));

  let showedNextLock = false;
  visibleConfigs.forEach(tInfo => {
    const tierTalents = TALENTS.filter(tl => tl.tier === tInfo.tier);
    const openTalents = tierTalents.filter(isTalentVisible);
    const closedTalents = tierTalents.filter(tl => !isTalentVisible(tl));
    if (openTalents.length === 0) {
      if (!showedNextLock && closedTalents.length) {
        showedNextLock = true;
        const needFlush = Math.min(...closedTalents.map(tl => tl.reqFlushes || 0));
        const needTranscend = Math.min(...closedTalents.map(tl => tl.reqTranscend || 0));
        const lock = document.createElement('div');
        lock.className = 'p-3 rounded-2xl border border-stone-800 bg-stone-950 text-[11px] text-stone-400';
        lock.textContent = needTranscend > (GAME.totalTranscend || 0)
          ? `${tInfo.title} откроется на прорыве ${formatNumber(needTranscend)}. Сейчас прорывов: ${formatNumber(GAME.totalTranscend || 0)}.`
          : `${tInfo.title} откроется на смыве ${formatNumber(needFlush)}. Сейчас смывов: ${formatNumber(GAME.totalPrestiges || 0)}.`;
        container.appendChild(lock);
      }
      return;
    }

    const tierHeader = document.createElement('div');
    tierHeader.className = 'text-[11px] font-game text-yellow-300 uppercase tracking-wider pt-2.5 pb-1 border-b border-yellow-500/30 flex items-center justify-between';
    tierHeader.innerHTML = `
      <span>${tInfo.title}</span>
      <span class="text-[9px] text-stone-400 font-sans font-normal hidden sm:inline">${tInfo.desc}</span>
    `;
    container.appendChild(tierHeader);

    openTalents.forEach(tl => {
      const tlInfo = getAffordableTalentInfo(tl);
      const maxed = tl.level >= tl.max;
      const canBuy = tlInfo.canBuy && !maxed;
      const nextCost = tlInfo.nextCost || tl.cost;

      const btnLabel = maxed
        ? 'МАКС'
        : (buyMultiplier === 'max'
          ? `+${formatNumber(tlInfo.count)} (${formatNumber(tlInfo.totalCost)} 🧻)`
          : (buyMultiplier > 1 ? `+${formatNumber(tlInfo.count)} (${formatNumber(tlInfo.totalCost)} 🧻)` : `${formatNumber(tlInfo.totalCost)} 🧻`));

      let tierBadgeClass = 'bg-stone-800 text-stone-300 border-stone-700';
      if (tl.tier === 2) tierBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      else if (tl.tier === 3) tierBadgeClass = 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      else if (tl.tier === 4) tierBadgeClass = 'bg-amber-950/80 text-yellow-300 border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.3)]';

      const row = document.createElement('div');
      row.className = `flex items-center justify-between p-2.5 rounded-2xl bg-stone-900 border ${tl.tier === 4 ? 'border-amber-500/50 shadow-md' : 'border-purple-900/60'} shadow-sm`;
      row.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <span class="text-2xl shrink-0">${drawPlunger(tl.icon)}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-xs text-purple-200">${tl.name}</span>
              <span class="text-[9px] px-1.5 py-0.2 rounded-full border font-bold ${tierBadgeClass}">${tl.tierName || 'Базовый'}</span>
              <span class="text-yellow-400 font-game text-[11px]">(${formatNumber(tl.level)}/${formatNumber(tl.max)})</span>
            </div>
            <div class="text-[10px] text-stone-400 mt-0.5 leading-snug">
              ${tl.desc}
              ${!maxed ? `<span class="text-purple-300 font-semibold font-game ml-1.5 inline-flex items-center gap-0.5">След: ${formatNumber(nextCost)} <span class="roll-icon"></span></span>` : ''}
            </div>
          </div>
        </div>
        <button class="buy-talent-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition ${maxed ? 'bg-stone-800 text-stone-500 border-stone-700' : (canBuy ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white border-purple-400 jelly-btn shadow-md' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed')}" data-id="${tl.id}" ${canBuy ? '' : 'disabled'}>
          ${btnLabel}
        </button>
      `;

      row.querySelector('.buy-talent-btn').addEventListener('click', async () => {
        if (buyTalent(tl.id)) {
          renderTalents();
          const inventory = await import('./characterInventoryView.js?v=5.0.54');
          const index = await import('./knivesIndexView.js?v=5.0.54');
          inventory.renderCharacterInventory();
          index.renderKnivesIndexBook();
          updateHUD();
          saveLocal();
        }
      });

      container.appendChild(row);
    });
  });
}

export function renderTranscendRelics() {
  const container = document.getElementById('transcendRelicsContainer');
  if (!container) return;
  container.innerHTML = '';

  const label = document.getElementById('talentPlungersLabel');
  if (label) label.innerHTML = `${formatNumber(GAME.transcendPlungers || 0)} <span class="plunger-icon"></span>`;

  const transcends = GAME.totalTranscend || 0;

  const tiers = [
    { tier: 1, name: '⭐ Тир 1: Базовые Реликвии (1+ Прорыв)', desc: 'Пассивный доход, авто-уход и защита времени' },
    { tier: 2, name: '⚡ Тир 2: Продвинутые Реликвии (2+ Прорывов)', desc: 'Кузница ножей. Авто-покупка заводов уже в тире 1' },
    { tier: 3, name: '🔮 Тир 3: Мастер-Реликвии Омниверса (3+ Прорывов)', desc: 'Метеоритные бури, разломы и сингулярность' },
    { tier: 4, name: '🌌 Тир 4: Космическая Сингулярность (5-10+ Прорывов)', desc: 'Эндгейм-квантование и бесконечная вечность' }
  ];

  // Update tier filter button styles
  document.querySelectorAll('.talent-transcend-tier-btn').forEach(b => {
    const isAct = b.dataset.tier === String(activeTranscendTier);
    if (isAct) {
      b.className = 'talent-transcend-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-700 text-white shadow-md border border-cyan-400';
    } else {
      b.className = 'talent-transcend-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold bg-stone-900 text-stone-400 hover:text-cyan-300 border border-stone-800';
    }
  });

  const visibleTiers = activeTranscendTier === 'all'
    ? tiers
    : tiers.filter(t => t.tier === Number(activeTranscendTier));

  visibleTiers.forEach(tInfo => {
    const tierUpgrades = TRANSCEND_UPGRADES.filter(u => u.tier === tInfo.tier);
    if (tierUpgrades.length === 0) return;

    const tierHeader = document.createElement('div');
    tierHeader.className = 'text-[11px] font-game text-cyan-300 uppercase tracking-wider pt-2.5 pb-1 border-b border-cyan-500/30 flex items-center justify-between';
    tierHeader.innerHTML = `
      <span>${tInfo.name}</span>
      <span class="text-[9px] text-stone-400 font-sans font-normal hidden sm:inline">${tInfo.desc}</span>
    `;
    container.appendChild(tierHeader);

    tierUpgrades.forEach(upg => {
      const isLocked = upg.reqTranscend && (transcends < upg.reqTranscend);
      let isMax = false;
      let lvl = 0;

      if (typeof GAME.transcendUpgrades?.[upg.key] === 'boolean') {
        isMax = !!GAME.transcendUpgrades[upg.key];
        lvl = isMax ? 1 : 0;
      } else {
        lvl = GAME.transcendUpgrades?.[upg.key] || 0;
        isMax = lvl >= upg.max;
      }

      const cost = upg.costStep ? (upg.cost + lvl * upg.costStep) : upg.cost;
      const canBuy = !isLocked && !isMax && ((GAME.transcendPlungers || 0) >= cost);

      const lockBadge = isLocked
        ? `<span class="text-[9px] text-red-400 font-bold block mt-0.5">🔒 Требуется ${upg.reqTranscend} Прорывов (Сделано: ${transcends})</span>`
        : '';

      const btnText = isLocked
        ? '🔒'
        : (isMax ? 'МАКС' : `${formatNumber(cost)} <span class="plunger-icon"></span>`);

      const row = document.createElement('div');
      row.className = `p-2.5 rounded-2xl border flex items-center justify-between shadow-sm transition ${isLocked ? 'bg-indigo-950/20 border-stone-800 opacity-60' : 'bg-indigo-950/50 border-cyan-500/40 hover:border-cyan-400'}`;
      row.innerHTML = `
        <div class="pr-2 min-w-0 flex-1">
          <div class="font-bold text-xs flex items-center gap-1.5 flex-wrap ${isLocked ? 'text-stone-400' : 'text-cyan-200'}">
            <span>${drawPlunger(upg.name)}</span>
            <span class="text-yellow-400 font-game text-[11px]">(${formatNumber(lvl)}/${formatNumber(upg.max)})</span>
          </div>
          <div class="text-[10px] text-stone-300 leading-snug mt-0.5">${upg.desc}</div>
          ${lockBadge}
        </div>
        <button class="buy-art-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition ${isMax ? 'bg-stone-800 text-stone-500 border-stone-700' : (canBuy ? 'bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-black border-cyan-300 jelly-btn shadow-md' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed')}" data-id="${upg.id}" ${canBuy ? '' : 'disabled'}>
          ${btnText}
        </button>
      `;

      if (canBuy) {
        row.querySelector('.buy-art-btn').addEventListener('click', () => {
          if (buyTranscendUpgrade(upg.id)) {
            renderTranscendRelics();
            updateHUD();
            saveLocal();
          }
        });
      }

      container.appendChild(row);
    });
  });
}

export function renderTalents() {
  const relicsOpen = isRelicSectionUnlocked();
  const relicBtn = document.getElementById('tabTalentsTranscend');
  if (relicBtn) relicBtn.classList.remove('hidden');
  if (!relicsOpen && activeTalentSubTab === 'transcend') activeTalentSubTab = 'flush';
  if (activeTalentSubTab === 'transcend') switchTalentSubTab('transcend');
  else switchTalentSubTab('flush');
}

export function updateTalentButtons() {
  const panel = document.getElementById('panelTalents');
  if (!panel || panel.classList.contains('hidden')) return;

  const rollsLabel = document.getElementById('talentRollsLabel');
  if (rollsLabel) rollsLabel.innerHTML = `${formatNumber(GAME.prestigeRolls)} <span class="roll-icon"></span>`;

  const plungersLabel = document.getElementById('talentPlungersLabel');
  if (plungersLabel) plungersLabel.innerHTML = `${formatNumber(GAME.transcendPlungers || 0)} <span class="plunger-icon"></span>`;

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
        ? `+${formatNumber(tlInfo.count)} (${formatNumber(tlInfo.totalCost)} 🧻)`
        : (buyMultiplier > 1 ? `+${formatNumber(tlInfo.count)} (${formatNumber(tlInfo.totalCost)} 🧻)` : `${formatNumber(tlInfo.totalCost)} 🧻`));

    if (btn.textContent.trim() !== btnLabel) {
      btn.textContent = btnLabel;
    }

    if (btn.disabled !== !canBuy && !maxed) {
      btn.disabled = !canBuy;
      btn.className = canBuy
        ? 'buy-talent-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white border-purple-400 jelly-btn shadow-md'
        : 'buy-talent-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });

  // Also update transcend relics buttons in panel
  const transcendButtons = panel.querySelectorAll('.buy-art-btn');
  const transcends = GAME.totalTranscend || 0;
  transcendButtons.forEach(btn => {
    const upgId = btn.dataset.id;
    const upg = TRANSCEND_UPGRADES.find(u => u.id === upgId);
    if (!upg) return;

    const isLocked = upg.reqTranscend && (transcends < upg.reqTranscend);
    let isMax = false;
    let lvl = 0;
    if (typeof GAME.transcendUpgrades?.[upg.key] === 'boolean') {
      isMax = !!GAME.transcendUpgrades[upg.key];
      lvl = isMax ? 1 : 0;
    } else {
      lvl = GAME.transcendUpgrades?.[upg.key] || 0;
      isMax = lvl >= upg.max;
    }

    const cost = upg.costStep ? (upg.cost + lvl * upg.costStep) : upg.cost;
    const canBuy = !isLocked && !isMax && ((GAME.transcendPlungers || 0) >= cost);

    btn.disabled = !canBuy;
    if (isMax) {
      btn.textContent = 'МАКС';
      btn.className = 'buy-art-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-stone-800 text-stone-500 border-stone-700';
    } else if (canBuy) {
      btn.className = 'buy-art-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-black border-cyan-300 jelly-btn shadow-md';
    } else {
      btn.className = 'buy-art-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });
}
