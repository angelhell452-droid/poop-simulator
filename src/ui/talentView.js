import { GAME } from '../core/state.js?v=5.0.80';
import { TALENT_TIERS, TALENTS } from '../data/talents.data.js';
import { RELIC_TIERS, RELICS, getRelicLevel } from '../data/relics.data.js?v=5.0.80';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js?v=5.0.80';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { drawPlunger } from '../utils/icons.js?v=5.0.80';
import { getAffordableTalentInfo, buyTalent } from '../systems/talentService.js';
import { buyRelic, buyTranscendUpgrade } from '../prestige/transcendService.js?v=5.0.80';
import { updateHUD } from './hudView.js?v=5.0.80';
import { saveLocal } from '../save/saveManager.js?v=5.0.80';
import { getRollIcon } from '../utils/icons.js';
import { isRelicSectionUnlocked, isTalentVisible } from '../progression/unlocks.js';
import { t, td, onLocaleChange } from '../i18n/t.js';
import { talentName, talentDesc, transcendName, transcendDesc } from '../i18n/localize.js';

let activeTalentSubTab = 'flush'; // 'flush' | 'transcend'
let activeFlushTier = '1'; // '1' | '2' | '3' | '4'
let activeTranscendTier = '1'; // '1' | '2' | '3' | '4'

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

  const currentFlushes = Math.max(0, Number(GAME.flushCount ?? GAME.totalPrestiges ?? 0) || 0);

  // Update tier filter button styles and lock markers
  document.querySelectorAll('.talent-flush-tier-btn').forEach(b => {
    const tierNum = Number(b.dataset.tier);
    const cfg = TALENT_TIERS.find(t => t.tier === tierNum);
    const isLocked = currentFlushes < (cfg?.reqFlushes || 0);
    const isAct = b.dataset.tier === String(activeFlushTier);

    if (isAct) {
      b.className = 'talent-flush-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold shrink-0 text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-400';
    } else if (isLocked) {
      b.className = 'talent-flush-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold shrink-0 text-center bg-stone-900 text-stone-500 border border-stone-800 opacity-70 hover:opacity-100';
    } else {
      b.className = 'talent-flush-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold shrink-0 text-center bg-stone-900 text-stone-400 hover:text-yellow-300 border border-stone-800';
    }

    const tierEmoji = tierNum === 1 ? '⭐' : (tierNum === 2 ? '⚡' : (tierNum === 3 ? '🔮' : '🌌'));
    b.innerHTML = isLocked ? `🔒 Тир ${tierNum}` : `${tierEmoji} Тир ${tierNum}`;
    b.title = isLocked ? `🔒 Открывается на ${cfg?.reqFlushes || 0} уровне Смыва` : (cfg?.title || '');
  });

  const buyMultiplier = GAME.buyMultiplier || 1;
  const selectedTier = Number(activeFlushTier) || 1;
  const activeCfg = TALENT_TIERS.find(t => t.tier === selectedTier) || TALENT_TIERS[0];
  const tierLocked = currentFlushes < (activeCfg.reqFlushes || 0);

  if (tierLocked) {
    const lockBanner = document.createElement('div');
    lockBanner.className = 'p-8 my-4 rounded-2xl border border-stone-800 bg-stone-950/90 text-center flex flex-col items-center justify-center gap-2 shadow-lg';
    lockBanner.innerHTML = `
      <span class="text-4xl filter drop-shadow">🔒</span>
      <div class="font-game text-sm text-yellow-300 font-bold tracking-wide">
        🔒 Открывается на ${formatNumber(activeCfg.reqFlushes)} уровне Смыва
      </div>
      <div class="text-xs text-stone-400 mt-1">
        Текущий уровень Смыва: <span class="text-purple-300 font-bold font-game">${formatNumber(currentFlushes)}</span> / <span class="text-yellow-300 font-bold font-game">${formatNumber(activeCfg.reqFlushes)}</span>
      </div>
      <div class="text-[11px] text-stone-500 mt-1 max-w-sm">
        ${activeCfg.desc}
      </div>
    `;
    container.appendChild(lockBanner);
    return;
  }

  // Tier is Unlocked: Header + exactly 5 talents
  const tierHeader = document.createElement('div');
  tierHeader.className = 'text-[11px] font-game text-yellow-300 uppercase tracking-wider pt-2 pb-1 border-b border-yellow-500/30 flex items-center justify-between';
  tierHeader.innerHTML = `
    <span>${activeCfg.title}</span>
    <span class="text-[9px] text-stone-400 font-sans font-normal hidden sm:inline">${activeCfg.desc}</span>
  `;
  container.appendChild(tierHeader);

  const tierTalents = selectedTier === 4 ? TALENTS.filter(tl => tl.tier >= 4) : TALENTS.filter(tl => tl.tier === activeCfg.tier);

  tierTalents.forEach(tl => {
    const tlInfo = getAffordableTalentInfo(tl);
    const isInfinite = !Number.isFinite(tl.max);
    const maxed = !isInfinite && tl.level >= tl.max;
    const canBuy = tlInfo.canBuy && !maxed;
    const nextCost = tlInfo.nextCost || tl.cost;

    const btnLabel = maxed
      ? t('common.max')
      : (buyMultiplier === 'max'
        ? `+${formatNumber(tlInfo.count)} (${formatNumber(tlInfo.totalCost)} 🧻)`
        : (buyMultiplier > 1 ? `+${formatNumber(tlInfo.count)} (${formatNumber(tlInfo.totalCost)} 🧻)` : `${formatNumber(tlInfo.totalCost)} 🧻`));

    let tierBadgeClass = 'bg-stone-800 text-stone-300 border-stone-700';
    if (tl.tier === 2) tierBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    else if (tl.tier === 3) tierBadgeClass = 'bg-purple-950/80 text-purple-300 border-purple-500/40';
    else if (tl.tier === 4) tierBadgeClass = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
    else if (tl.tier === 5) tierBadgeClass = 'bg-amber-950/80 text-yellow-300 border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.3)]';

    const maxDisplay = isInfinite ? '∞' : formatNumber(tl.max);

    const row = document.createElement('div');
    row.className = `flex items-center justify-between p-2.5 rounded-2xl bg-stone-900 border ${tl.tier === 5 ? 'border-amber-500/50 shadow-md' : 'border-purple-900/60'} shadow-sm`;
    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
        <span class="text-2xl shrink-0">${drawPlunger(tl.icon)}</span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-xs text-purple-200">${talentName(tl)}</span>
            <span class="text-[9px] px-1.5 py-0.2 rounded-full border font-bold ${tierBadgeClass}">${td(`talent.tierName.${tl.tier}`, tl.tierName || 'Basic')}</span>
            <span class="text-yellow-400 font-game text-[11px]">(${formatNumber(tl.level)}/${maxDisplay})</span>
          </div>
          <div class="text-[10px] text-stone-400 mt-0.5 leading-snug">
            ${talentDesc(tl)}
            ${!maxed ? `<span class="text-purple-300 font-semibold font-game ml-1.5 inline-flex items-center gap-0.5">${t('talent.next', { n: formatNumber(nextCost) })} <span class="roll-icon"></span></span>` : ''}
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
        const inventory = await import('./characterInventoryView.js?v=5.0.80');
        const index = await import('./knivesIndexView.js?v=5.0.80');
        inventory.renderCharacterInventory();
        index.renderKnivesIndexBook();
        updateHUD();
        saveLocal();
      }
    });

    container.appendChild(row);
  });
}

export function renderTranscendRelics() {
  const container = document.getElementById('transcendRelicsContainer');
  if (!container) return;
  container.innerHTML = '';

  const label = document.getElementById('talentPlungersLabel');
  if (label) label.innerHTML = `${formatNumber(GAME.transcendPlungers || 0)} <span class="plunger-icon"></span>`;

  const currentBreakthroughs = Math.max(0, Math.floor(Number(GAME.breakthroughCount ?? GAME.totalTranscend ?? 0) || 0));

  // Update tier filter button styles
  document.querySelectorAll('.talent-transcend-tier-btn').forEach(b => {
    const tierVal = b.dataset.tier;
    const isAct = tierVal === String(activeTranscendTier);
    const tierNum = Number(tierVal);
    const tierCfg = RELIC_TIERS.find(t => t.tier === tierNum);
    const isLocked = tierCfg ? (currentBreakthroughs < tierCfg.reqBreakthrough) : false;

    if (isAct) {
      b.className = 'talent-transcend-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold shrink-0 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-700 text-white shadow-md border border-cyan-400 text-center';
    } else if (isLocked) {
      b.className = 'talent-transcend-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold shrink-0 bg-stone-900 text-stone-500 border border-stone-800 opacity-70 hover:opacity-100 text-center';
    } else {
      b.className = 'talent-transcend-tier-btn px-2.5 py-1 rounded-xl text-xs font-game transition font-bold shrink-0 bg-stone-900 text-stone-400 hover:text-cyan-300 border border-stone-800 text-center';
    }

    const tierEmoji = tierNum === 1 ? '⭐' : (tierNum === 2 ? '⚡' : (tierNum === 3 ? '🔮' : '🌌'));
    b.innerHTML = isLocked ? `🔒 Тир ${tierNum}` : `${tierEmoji} Тир ${tierNum}`;
    b.title = isLocked ? `🔒 Требуется ${tierCfg?.reqBreakthrough || 0} Прорыв` : (tierCfg?.name || '');
  });

  const selectedRelicTier = Number(activeTranscendTier) || 1;
  const visibleTiers = selectedRelicTier === 4
    ? RELIC_TIERS.filter(cfg => cfg.tier >= 4)
    : RELIC_TIERS.filter(cfg => cfg.tier === selectedRelicTier);

  visibleTiers.forEach(tInfo => {
    const tierUpgrades = RELICS.filter(u => u.tier === tInfo.tier);
    if (tierUpgrades.length === 0) return;

    const isTierLocked = currentBreakthroughs < tInfo.reqBreakthrough;

    const tierHeader = document.createElement('div');
    tierHeader.className = 'text-[11px] font-game text-cyan-300 uppercase tracking-wider pt-2.5 pb-1 border-b border-cyan-500/30 flex items-center justify-between';
    tierHeader.innerHTML = `
      <span class="flex items-center gap-1.5 flex-wrap">
        <span>${tInfo.icon}</span>
        <span>${tInfo.name}</span>
        ${isTierLocked ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 font-normal">🔒 Требуется ${formatNumber(tInfo.reqBreakthrough)} Прорыв</span>` : ''}
      </span>
      <span class="text-[9px] text-stone-400 font-sans font-normal hidden sm:inline">${tInfo.desc}</span>
    `;
    container.appendChild(tierHeader);

    if (isTierLocked) {
      const lockBanner = document.createElement('div');
      lockBanner.className = 'p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 text-center shadow-inner my-1';
      lockBanner.innerHTML = `
        <div class="font-game font-bold text-xs text-indigo-300 flex items-center justify-center gap-1.5">
          <span>🔒</span>
          <span>Требуется ${formatNumber(tInfo.reqBreakthrough)} Прорыв</span>
        </div>
        <div class="text-[10px] text-stone-400 mt-0.5">Совершите Прорыв в окне Смыва Судьбы, чтобы открыть этот Тир реликвий.</div>
      `;
      container.appendChild(lockBanner);
    }

    tierUpgrades.forEach(upg => {
      const isLocked = isTierLocked || (currentBreakthroughs < upg.reqBreakthrough);
      const lvl = getRelicLevel(upg.id);
      const isMax = lvl >= upg.max;
      const cost = upg.cost;
      const canBuy = !isLocked && !isMax && ((GAME.transcendPlungers || 0) >= cost);

      const lockBadge = isLocked
        ? `<span class="text-[9px] text-red-400 font-bold block mt-0.5">🔒 Требуется ${formatNumber(upg.reqBreakthrough)} Прорыв (у вас: ${formatNumber(currentBreakthroughs)})</span>`
        : '';

      const btnText = isLocked
        ? '🔒'
        : (isMax ? t('common.max') : `${formatNumber(cost)} <span class="plunger-icon"></span>`);

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
          if (buyRelic(upg.id)) {
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
    const isInfinite = !Number.isFinite(tl.max);
    const maxed = !isInfinite && tl.level >= tl.max;
    const canBuy = tlInfo.canBuy && !maxed;

    const btnLabel = maxed
      ? t('common.max')
      : (buyMultiplier === 'max'
        ? `+${formatNumber(tlInfo.count)} (${formatNumber(tlInfo.totalCost)} 🧻)`
        : (buyMultiplier > 1 ? `+${formatNumber(tlInfo.count)} (${formatNumber(tlInfo.totalCost)} 🧻)` : `${formatNumber(tlInfo.totalCost)} 🧻`));

    if (btn.textContent.trim() !== btnLabel) {
      btn.textContent = btnLabel;
    }

    if (btn.disabled !== (!canBuy || maxed)) {
      btn.disabled = !canBuy || maxed;
      btn.className = canBuy
        ? 'buy-talent-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white border-purple-400 jelly-btn shadow-md'
        : 'buy-talent-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });

  // Also update transcend relics buttons in panel
  const transcendButtons = panel.querySelectorAll('.buy-art-btn');
  const currentBreakthroughs = Math.max(0, Math.floor(Number(GAME.breakthroughCount ?? GAME.totalTranscend ?? 0) || 0));
  transcendButtons.forEach(btn => {
    const upgId = btn.dataset.id;
    const upg = RELICS.find(u => u.id === upgId || u.key === upgId);
    if (!upg) return;

    const isLocked = currentBreakthroughs < upg.reqBreakthrough;
    const lvl = getRelicLevel(upg.id);
    const isMax = lvl >= upg.max;
    const cost = upg.cost;
    const canBuy = !isLocked && !isMax && ((GAME.transcendPlungers || 0) >= cost);

    btn.disabled = !canBuy || isMax;
    if (isMax) {
      btn.textContent = t('common.max');
      btn.className = 'buy-art-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-stone-800 text-stone-500 border-stone-700';
    } else if (canBuy) {
      btn.className = 'buy-art-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-black border-cyan-300 jelly-btn shadow-md';
    } else {
      btn.className = 'buy-art-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed';
    }
  });
}

onLocaleChange(() => {
  renderTalents();
});
