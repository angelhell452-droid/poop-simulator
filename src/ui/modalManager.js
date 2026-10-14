import { GAME } from '../core/state.js?v=5.4.17';
import { formatMult, formatNumber } from '../utils/numberFormatter.js?v=5.4.17';
import { getPrestigeRollsReward, executePrestige, getPrestigeRequirement, getPrestigeRewardBreakdown } from '../prestige/prestigeService.js?v=5.4.17';
import { getTranscendPlungersReward, executeTranscend, getTranscendRequirement, getTranscendRewardBreakdown, flushesNeededForBridge, plungerFlushCap, currentBridgePhase, getBreakthroughExpLevel, getTargetBreakthroughExperience } from '../prestige/transcendService.js?v=5.4.17';
import { gte, rehydrateBig } from '../utils/big.js?v=5.4.17';
import { saveLocal } from '../save/saveManager.js?v=5.4.17';
import { getRollsIncomeMult, getEchoBonus } from '../economy/metaMultipliers.js?v=5.4.17';
import { getPhaseForStage } from '../progression/phases.data.js?v=5.4.17';

import { updateHUD } from './hudView.js?v=5.4.17';
import { renderCasesSystem } from './casesView.js?v=5.4.17';
import { renderCharacterInventory } from './characterInventoryView.js?v=5.4.17';
import { renderTalents, switchTalentSubTab } from './talentView.js?v=5.4.17';
import { renderFactories } from './factoryView.js?v=5.4.17';
import { renderShop } from './shopView.js';
import { events } from '../core/events.js';
import { isRelicSectionUnlocked } from '../progression/unlocks.js';
import { t, onLocaleChange } from '../i18n/t.js';
import { ARCHETYPES } from '../progression/archetypes.js';
import { archetypeName } from '../i18n/localize.js';

let pendingPrestigeArchetype = 'balanced';
function notesAreOpen(modalId) {
  return document.getElementById(modalId)?.dataset.notesOpen === '1';
}

export function updatePrestigeModalRealtime() {
  const modal = document.getElementById('prestigeModal');
  if (!modal || modal.classList.contains('hidden')) return;

  const b = getPrestigeRewardBreakdown();
  const gain = b.totalGain;
  const flushes = b.flushes ?? GAME.flushCount ?? 0;
  const currentBoost = formatMult(b.currentIncomeMult ?? 1);
  const nextBoost = formatMult(b.nextIncomeMult ?? 1);
  const currentBoostLabel = currentBoost.pctLabel || currentBoost.multLabel;
  const nextBoostLabel = nextBoost.pctLabel
    ? `${nextBoost.pctLabel} (${nextBoost.multLabel})`
    : nextBoost.multLabel;

  const reqLabel = document.getElementById('prestigeReqLabel');
  if (reqLabel) {
    const isReady = b.isMet;
    const badgeClass = isReady
      ? 'bg-emerald-400 text-stone-950 border-emerald-200'
      : 'bg-amber-400 text-stone-950 border-amber-200';
    const statusText = isReady ? 'Готово к Смыву! 🌊' : 'Копите биомассу для Смыва ⏳';

    reqLabel.innerHTML = `
      <div class="space-y-2">
        <div class="rounded-full border-2 px-3 py-1.5 text-center font-game text-xs font-bold ${badgeClass}">
          ${statusText}
        </div>
        <div class="flex items-center justify-between text-xs py-0.5 border-b border-purple-800/60">
          <span class="text-stone-300 font-semibold">Текущий Уровень Смыва:</span>
          <span class="font-game text-yellow-300 font-bold">${formatNumber(flushes)}</span>
        </div>
        <div class="flex items-center justify-between text-xs py-0.5 border-b border-purple-800/60">
          <span class="text-stone-300 font-semibold">Требуется биомассы:</span>
          <span class="font-mono text-xs font-bold ${b.isMet ? 'text-emerald-300' : 'text-amber-300'}">
            ${formatNumber(b.reqBiomass)}
          </span>
        </div>
        <div class="flex items-center justify-between text-[11px] text-stone-400">
          <span>В наличии в кошельке:</span>
          <span class="font-mono font-bold text-stone-200">${formatNumber(b.currentBiomass)}</span>
        </div>
      </div>
    `;
  }

  const calcEl = document.getElementById('prestigeCalcRolls');
  if (calcEl) {
    calcEl.innerHTML = `
      <div class="mt-2 p-2.5 rounded-xl bg-purple-950/80 border border-yellow-400/40 text-left space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-yellow-300 uppercase font-black tracking-wider">Награда за Смыв:</span>
          <span class="font-game text-sm text-yellow-300 font-bold">+${formatNumber(gain)} <span class="roll-icon"></span> Втулок</span>
        </div>
        <div class="p-2 rounded-lg bg-stone-950/60 border border-purple-500/20 text-xs space-y-1 font-mono">
          <div class="flex items-center justify-between">
            <span class="text-purple-200">Пассивный буст к доходу:</span>
            <span class="text-emerald-300 font-bold">${currentBoostLabel}</span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-stone-400">
            <span>После Смыва станет:</span>
            <span class="text-yellow-300 font-bold">${nextBoostLabel}</span>
          </div>
          ${b.flushTalentBonus > 1 ? `
            <div class="flex items-center justify-between text-[10px] text-purple-300 pt-1 border-t border-purple-900/40">
              <span>Бонус талантов Смыва:</span>
              <span class="text-cyan-300 font-bold">+${formatNumber(Math.round((b.flushTalentBonus - 1) * 100))}%</span>
            </div>
          ` : ''}
          ${b.vipMult > 1 ? `
            <div class="flex items-center justify-between text-[10px] text-yellow-300">
              <span>VIP статус:</span>
              <span class="text-yellow-300 font-bold">x${formatNumber(b.vipMult)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  const execBtn = document.getElementById('btnExecutePrestige');
  if (execBtn) {
    execBtn.disabled = !b.isMet || !gte(gain, 1);
    if (b.isMet) {
      execBtn.textContent = 'СОВЕРШИТЬ СМЫВ! 🌊';
    } else {
      execBtn.textContent = `НУЖНО ${formatNumber(b.reqBiomass)} БИОМАССЫ (ЕСТЬ ${formatNumber(b.currentBiomass)}) 🔒`;
    }
  }

  // VIP Auto-Flush toggle UI
  const autoFlushBox = document.getElementById('prestigeAutoFlushBox');
  const btnToggleAutoFlush = document.getElementById('btnToggleAutoFlush');
  const autoFlushToggleState = document.getElementById('autoFlushToggleState');
  const autoFlushDesc = document.getElementById('autoFlushDesc');
  const autoFlushVipBadge = document.getElementById('autoFlushVipBadge');
  const isVip = Boolean(GAME.vipPass || GAME.hasVipPass);

  if (autoFlushBox && btnToggleAutoFlush) {
    if (!isVip) {
      GAME.autoFlushActive = false;
      autoFlushBox.className = 'mb-3 p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-2.5 bg-stone-950/60 border-stone-800 opacity-60';
      btnToggleAutoFlush.disabled = true;
      btnToggleAutoFlush.className = 'px-3 py-1.5 rounded-xl font-game text-[11px] font-bold bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed';
      if (autoFlushToggleState) autoFlushToggleState.textContent = '🔒 ВЫКЛ';
      if (autoFlushDesc) autoFlushDesc.innerHTML = '<span class="text-amber-400 font-bold">🔒 Требуется VIP-Пасс Вселенной</span>';
      if (autoFlushVipBadge) autoFlushVipBadge.className = 'text-[9px] bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded font-bold uppercase';
    } else {
      const active = Boolean(GAME.autoFlushActive);
      autoFlushBox.className = active
        ? 'mb-3 p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-2.5 bg-gradient-to-r from-emerald-950/70 to-purple-950/70 border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
        : 'mb-3 p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-2.5 bg-purple-950/50 border-purple-800/60';
      btnToggleAutoFlush.disabled = false;
      btnToggleAutoFlush.className = active
        ? 'jelly-btn px-3 py-1.5 rounded-xl font-game text-[11px] font-bold transition flex items-center gap-1.5 shadow bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 border border-emerald-300 font-black animate-pulse'
        : 'jelly-btn px-3 py-1.5 rounded-xl font-game text-[11px] font-bold transition flex items-center gap-1.5 shadow bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600';
      if (autoFlushToggleState) autoFlushToggleState.textContent = active ? '✓ ВКЛ' : 'ВЫКЛ';
      if (autoFlushDesc) autoFlushDesc.textContent = active ? 'Авто-Смыв активен: срабатывает каждую секунду при готовности' : 'Нажмите, чтобы включить автоматический Смыв при готовности';
      if (autoFlushVipBadge) autoFlushVipBadge.className = 'text-[9px] bg-gradient-to-r from-yellow-400 to-amber-500 text-stone-950 px-1.5 py-0.2 rounded font-black uppercase shadow-sm';
    }

    if (!btnToggleAutoFlush._bound) {
      btnToggleAutoFlush._bound = true;
      btnToggleAutoFlush.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!Boolean(GAME.vipPass || GAME.hasVipPass)) return;
        GAME.autoFlushActive = !GAME.autoFlushActive;
        saveLocal();
        updatePrestigeModalRealtime();
      });
    }
  }
}

export function updateTranscendModalRealtime() {
  const modal = document.getElementById('transcendModal');
  if (!modal || modal.classList.contains('hidden')) return;

  const tb = getTranscendRewardBreakdown();
  const currentCount = tb.breakthroughCount;
  const reqLevel = tb.reqLevel;
  const currentLevel = tb.currentLevel;
  const gain = tb.totalGain;
  const reqPrestiges = tb.reqPrestiges ?? 2;
  const currentPrestiges = tb.currentPrestiges;
  const meetsForm = tb.meetsForm ?? (currentLevel >= reqLevel);
  const meetsPrestiges = tb.meetsPrestiges;
  const isMet = tb.isMet;
  const pctExp = Math.min(100, Math.max(0, Math.round((currentLevel / reqLevel) * 100)));

  const rollsEl = document.getElementById('transcendCurrentRolls');
  if (rollsEl) rollsEl.innerHTML = `${formatNumber(GAME.prestigeRolls || 0)} <span class="roll-icon"></span> Втулок`;

  const plungersEl = document.getElementById('transcendCalcPlungers');
  if (plungersEl) {
    plungersEl.innerHTML = `+${formatNumber(gain)} <span class="plunger-icon"></span> Вантузов`;
  }

  const nb = tb.nextBoost || {};
  const cb = tb.curBoost || {};
  const hasRelicBoost = (nb.boostLvl || 0) > 0;
  const hasTalentHack = (nb.hackLvl || 0) > 0;

  let modifierBadgesHtml = '';
  if (hasRelicBoost || hasTalentHack) {
    const badges = [];
    if (hasRelicBoost) {
      badges.push(`<span class="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">🪐 База +${formatNumber(nb.baseBonus)} (Резонатор ур. ${formatNumber(nb.boostLvl)})</span>`);
    }
    if (hasTalentHack) {
      badges.push(`<span class="inline-flex items-center gap-1 text-[10px] text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">🔮 Степень +${formatNumber(nb.expBonus)} (Взлом ур. ${formatNumber(nb.hackLvl)})</span>`);
    }
    modifierBadgesHtml = `<div class="flex flex-wrap gap-1.5 pt-0.5">${badges.join('')}</div>`;
  }

  const nextCalcFormula = `(${formatNumber(nb.base || 1.5)})^${formatNumber(nb.exp || 1)}`;

  const tReqLabel = document.getElementById('transcendReqLabel');
  if (tReqLabel) {
    tReqLabel.innerHTML = `
      <div class="space-y-2.5">
        <!-- 1. Условие по Форме -->
        <div class="p-2.5 rounded-xl bg-indigo-950/70 border border-cyan-500/30 text-left space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-cyan-300 font-bold uppercase tracking-wider text-[10px]">Форма</span>
            <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ${meetsForm ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
              ${meetsForm ? '✓ Готово' : '⏳ В процессе'}
            </span>
          </div>
          <div class="text-[11px] text-indigo-200">
            Цель: ${formatNumber(reqLevel)} ур. ${currentCount === 0 ? '(1-й Прорыв: 500 ур.)' : '(+1000 за каждый Прорыв)'}
          </div>
          <div class="flex items-center justify-between text-xs font-mono font-bold">
            <span class="text-stone-300">Текущая Форма:</span>
            <span class="${meetsForm ? 'text-emerald-300' : 'text-yellow-300'}">${formatNumber(currentLevel)} / ${formatNumber(reqLevel)} ур.</span>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-stone-900 rounded-full h-2 border border-white/10 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300" style="width: ${pctExp}%"></div>
          </div>
        </div>

        <!-- 2. Условие по Смывам -->
        <div class="p-2.5 rounded-xl bg-indigo-950/70 border border-cyan-500/30 text-left space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-cyan-300 font-bold uppercase tracking-wider text-[10px]">Требование Смывов</span>
            <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ${meetsPrestiges ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
              ${meetsPrestiges ? '✓ Выполнено' : 'Нужно ещё ' + formatNumber(Math.max(0, reqPrestiges - currentPrestiges))}
            </span>
          </div>
          <div class="text-xs font-semibold text-stone-200 leading-snug">
            Требуется совершенных Смывов для этого шага: <b class="text-cyan-300">${formatNumber(reqPrestiges)}</b> <span class="text-stone-400">(Ваш счетчик: <b class="text-yellow-300">${formatNumber(currentPrestiges)}</b>)</span>
          </div>
        </div>

        <!-- 3. Бесконечный буст дохода от Прорывов -->
        <div class="p-2.5 rounded-xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-cyan-400/40 text-left space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-cyan-300 font-bold uppercase tracking-wider text-[10px]">Бесконечный буст дохода от Прорывов</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono">
              (База)^Степень
            </span>
          </div>

          <div class="text-[11px] text-indigo-200 leading-snug space-y-1">
            <div class="text-[10px] text-stone-300">
              Базовая формула: <span class="font-mono text-cyan-200 font-bold">(1.5 + 0.1 × Прорывы)^Прорывы</span>
            </div>
            ${modifierBadgesHtml}
            <div class="text-[10px] text-stone-300">
              Формула шага #${formatNumber(currentCount + 1)}: <span class="font-mono text-emerald-300 font-bold">${nextCalcFormula}</span>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-cyan-500/20">
            <div class="space-y-0.5">
              <span class="text-stone-400 text-[10px] block">Активен сейчас (#${formatNumber(currentCount)}):</span>
              <span class="text-white font-bold text-xs">x${formatNumber(tb.currentMult)}</span>
            </div>
            <span class="text-cyan-400 font-bold text-sm">➔</span>
            <div class="text-right space-y-0.5">
              <span class="text-stone-400 text-[10px] block">После Прорыва (#${formatNumber(currentCount + 1)}):</span>
              <span class="text-emerald-300 font-extrabold text-sm">x${formatNumber(tb.nextMult)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const milestoneEl = document.getElementById('transcendMilestoneHint');
  if (milestoneEl) {
    milestoneEl.innerHTML = `
      <div class="flex items-center justify-between text-xs text-cyan-300 font-bold px-1 py-0.5">
        <span>Текущий уровень Прорывов: <b class="text-yellow-300 font-game text-sm">${formatNumber(currentCount)}</b></span>
        <span class="text-indigo-200 text-[11px] font-mono">Следующий: #${formatNumber(currentCount + 1)}</span>
      </div>
    `;
  }

  const relicBranch = document.getElementById('btnOpenTranscendRelicsFromModal');
  const relicBranchLabel = document.getElementById('relicBranchLabel');
  const relicsOpen = isRelicSectionUnlocked();
  if (relicBranch) {
    relicBranch.disabled = !relicsOpen;
    relicBranch.classList.toggle('opacity-60', !relicsOpen);
    relicBranch.classList.toggle('cursor-not-allowed', !relicsOpen);
    relicBranch.title = relicsOpen ? 'Открыть ветку Реликвий в Талантах' : 'Реликвии заблокированы';
  }
  if (relicBranchLabel) {
    relicBranchLabel.textContent = relicsOpen
      ? 'Открыть ветку Реликвий в Талантах ➔'
      : '🔒 Ветка реликвий откроется после 1 Прорыва';
  }

  const execTransBtn = document.getElementById('btnExecuteTranscend');
  if (execTransBtn) {
    if (!isMet) {
      execTransBtn.disabled = true;
      if (!meetsForm) {
        execTransBtn.textContent = `ТРЕБУЕТСЯ ФОРМА ${formatNumber(reqLevel)} УР. (СЕЙЧАС ${formatNumber(currentLevel)}) 🔒`;
      } else if (!meetsPrestiges) {
        execTransBtn.textContent = `ТРЕБУЕТСЯ ${formatNumber(reqPrestiges)} СМЫВОВ (ЕСТЬ ${formatNumber(currentPrestiges)}) 🔒`;
      }
    } else {
      execTransBtn.disabled = gain <= 0;
      execTransBtn.textContent = 'СОВЕРШИТЬ АСТРАЛЬНЫЙ ПРОРЫВ! 🌌';
    }
  }

  // VIP Auto-Breakthrough toggle UI
  const autoBreakthroughBox = document.getElementById('transcendAutoBreakthroughBox');
  const btnToggleAutoBreakthrough = document.getElementById('btnToggleAutoBreakthrough');
  const autoBreakthroughToggleState = document.getElementById('autoBreakthroughToggleState');
  const autoBreakthroughDesc = document.getElementById('autoBreakthroughDesc');
  const autoBreakthroughVipBadge = document.getElementById('autoBreakthroughVipBadge');
  const isVip = Boolean(GAME.vipPass || GAME.hasVipPass);

  if (autoBreakthroughBox && btnToggleAutoBreakthrough) {
    if (!isVip) {
      GAME.autoBreakthroughActive = false;
      autoBreakthroughBox.className = 'mb-3 p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-2.5 bg-stone-950/60 border-stone-800 opacity-60';
      btnToggleAutoBreakthrough.disabled = true;
      btnToggleAutoBreakthrough.className = 'px-3 py-1.5 rounded-xl font-game text-[11px] font-bold bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed';
      if (autoBreakthroughToggleState) autoBreakthroughToggleState.textContent = '🔒 ВЫКЛ';
      if (autoBreakthroughDesc) autoBreakthroughDesc.innerHTML = `<span class="text-amber-400 font-bold">${t('transcend.autoVipReq')}</span>`;
      if (autoBreakthroughVipBadge) autoBreakthroughVipBadge.className = 'text-[9px] bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded font-bold uppercase';
    } else {
      const active = Boolean(GAME.autoBreakthroughActive);
      autoBreakthroughBox.className = active
        ? 'mb-3 p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-2.5 bg-gradient-to-r from-cyan-950/70 to-purple-950/70 border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
        : 'mb-3 p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-2.5 bg-indigo-950/50 border-indigo-800/60';
      btnToggleAutoBreakthrough.disabled = false;
      btnToggleAutoBreakthrough.className = active
        ? 'jelly-btn px-3 py-1.5 rounded-xl font-game text-[11px] font-bold transition flex items-center gap-1.5 shadow bg-gradient-to-r from-cyan-500 to-indigo-500 text-stone-950 border border-cyan-300 font-black animate-pulse'
        : 'jelly-btn px-3 py-1.5 rounded-xl font-game text-[11px] font-bold transition flex items-center gap-1.5 shadow bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600';
      if (autoBreakthroughToggleState) autoBreakthroughToggleState.textContent = active ? '✓ ВКЛ' : 'ВЫКЛ';
      if (autoBreakthroughDesc) autoBreakthroughDesc.textContent = active ? t('transcend.autoDescActive') : t('transcend.autoDescInactive');
      if (autoBreakthroughVipBadge) autoBreakthroughVipBadge.className = 'text-[9px] bg-gradient-to-r from-yellow-400 to-amber-500 text-stone-950 px-1.5 py-0.2 rounded font-black uppercase shadow-sm';
    }

    if (!btnToggleAutoBreakthrough._bound) {
      btnToggleAutoBreakthrough._bound = true;
      btnToggleAutoBreakthrough.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!Boolean(GAME.vipPass || GAME.hasVipPass)) return;
        GAME.autoBreakthroughActive = !GAME.autoBreakthroughActive;
        saveLocal();
        updateTranscendModalRealtime();
      });
    }
  }
}

export function openPrestigeModal() {
  pendingPrestigeArchetype = GAME.archetype || 'balanced';
  renderArchetypeButtons();
  document.getElementById('prestigeModal')?.classList.remove('hidden');
  updatePrestigeModalRealtime();
}

export function openTranscendModal() {
  document.getElementById('transcendModal')?.classList.remove('hidden');
  updateTranscendModalRealtime();
}

function bindNotesToggle(modalId, buttonId, update) {
  const modal = document.getElementById(modalId);
  if (!modal || modal.dataset.notesBound === '1') return;
  modal.dataset.notesBound = '1';
  modal.addEventListener('pointerdown', (event) => {
    if (!event.target.closest(buttonId)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const now = Date.now();
    if (now < Number(modal.dataset.notesGuard || 0)) return;
    modal.dataset.notesGuard = String(now + 450);
    modal.dataset.notesOpen = modal.dataset.notesOpen === '1' ? '0' : '1';
    update();
  });
}

export function initModals() {
  bindNotesToggle('prestigeModal', '#flushNotesToggle', updatePrestigeModalRealtime);
  bindNotesToggle('transcendModal', '#transcendNotesToggle', updateTranscendModalRealtime);

  // Global modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.fixed.inset-0');
      if (!modal || modal.id === 'offlineModal') return;
      modal.classList.add('hidden');
      if (modal.id === 'patchNotesModal') events.emit('journal:closed');
    });
  });

  // Universal click-outside dismiss on backdrop
  document.querySelectorAll('.fixed.inset-0').forEach(modal => {
    modal.addEventListener('pointerdown', (e) => {
      if (e.target === modal && modal.id !== 'offlineModal') {
        modal.classList.add('hidden');
        if (modal.id === 'patchNotesModal') events.emit('journal:closed');
      }
    });
  });

  // Archetype selection in Prestige Modal
  document.querySelectorAll('.arch-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingPrestigeArchetype = btn.dataset.arch;
      renderArchetypeButtons();
    });
  });

  // Guide Modal
  document.getElementById('btnGuideModal')?.addEventListener('click', () => {
    document.getElementById('guideModal')?.classList.remove('hidden');
  });

  document.getElementById('btnPrestigeModal')?.addEventListener('click', openPrestigeModal);
  document.getElementById('btnCanvasPrestige')?.addEventListener('click', openPrestigeModal);
  document.getElementById('currencyPrestigeBox')?.addEventListener('click', openPrestigeModal);
  document.getElementById('btnTranscendModal')?.addEventListener('click', openTranscendModal);
  document.getElementById('btnCanvasTranscend')?.addEventListener('click', openTranscendModal);
  document.getElementById('currencyPlungersBox')?.addEventListener('click', openTranscendModal);

  // Execute Prestige
  const btnExecutePrestige = document.getElementById('btnExecutePrestige');
  if (btnExecutePrestige) {
    btnExecutePrestige.addEventListener('click', () => {
      if (executePrestige(pendingPrestigeArchetype)) {
        document.getElementById('prestigeModal')?.classList.add('hidden');
        renderCasesSystem();
        renderCharacterInventory();
        renderTalents();
        renderFactories();
        renderShop();
        updateHUD();
      }
    });
  }

  // Quick navigation to Transcend Relics sub-tab in dashboard
  const navigateToTranscendRelics = () => {
    if (!isRelicSectionUnlocked()) return;
    document.getElementById('transcendModal')?.classList.add('hidden');
    const talentDashBtn = document.querySelector('.dash-tab[data-target="panelTalents"]');
    if (talentDashBtn) talentDashBtn.click();
    switchTalentSubTab('transcend');
  };

  document.getElementById('btnOpenTranscendRelicsFromModal')?.addEventListener('click', navigateToTranscendRelics);
  document.getElementById('transcendAutoLockedNotice')?.addEventListener('click', navigateToTranscendRelics);

  // Execute Transcend
  const btnExecuteTranscend = document.getElementById('btnExecuteTranscend');
  if (btnExecuteTranscend) {
    btnExecuteTranscend.addEventListener('click', () => {
      if (executeTranscend()) {
        document.getElementById('transcendModal')?.classList.add('hidden');
        renderCasesSystem();
        renderCharacterInventory();
        renderTalents();
        renderFactories();
        renderShop();
        updateHUD();
      }
    });
  }

  // Claim Offline
  const btnClaimOffline = document.getElementById('btnClaimOffline');
  if (btnClaimOffline) {
    btnClaimOffline.addEventListener('click', () => {
      document.getElementById('offlineModal')?.classList.add('hidden');
    });
  }

  // Reactive listener: refresh transcend modal if open when prestige completes
  events.on('prestige:completed', () => {
    const tModal = document.getElementById('transcendModal');
    if (tModal && !tModal.classList.contains('hidden')) {
      openTranscendModal();
    }
  });

  onLocaleChange(() => {
    updatePrestigeModalRealtime();
    updateTranscendModalRealtime();
    renderArchetypeButtons();
  });

  renderArchetypeButtons();
}

function renderArchetypeButtons() {
  document.querySelectorAll('.arch-select-btn').forEach(btn => {
    const id = btn.dataset.arch;
    const arch = ARCHETYPES[id];
    const isSelected = id === pendingPrestigeArchetype;
    if (isSelected) {
      btn.className = 'arch-select-btn p-1.5 rounded-xl border text-center transition bg-purple-900/90 border-yellow-400 text-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.5)]';
    } else {
      btn.className = 'arch-select-btn p-1.5 rounded-xl border text-center transition bg-stone-900 border-stone-700 text-stone-300 hover:border-amber-500';
    }
    if (arch) {
      const subClass = isSelected ? 'text-purple-300' : 'text-stone-400';
      btn.innerHTML = `${archetypeName(arch)}<div class="text-[8px] ${subClass} font-normal">${t(`archetype.${id}.short`)}</div>`;
    }
  });
}
