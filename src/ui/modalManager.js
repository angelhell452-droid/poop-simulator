import { GAME } from '../core/state.js?v=5.0.79';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.79';
import { getPrestigeRollsReward, executePrestige, getPrestigeRequirement, getPrestigeRewardBreakdown } from '../prestige/prestigeService.js?v=5.0.79';
import { getTranscendPlungersReward, executeTranscend, getTranscendRequirement, getTranscendRewardBreakdown, flushesNeededForBridge, plungerFlushCap, currentBridgePhase } from '../prestige/transcendService.js?v=5.0.79';
import { getRollsIncomeMult, getEchoBonus } from '../economy/metaMultipliers.js?v=5.0.79';
import { getPhaseForStage } from '../progression/phases.data.js?v=5.0.79';

import { updateHUD } from './hudView.js?v=5.0.79';
import { renderCasesSystem } from './casesView.js?v=5.0.79';
import { renderCharacterInventory } from './characterInventoryView.js?v=5.0.79';
import { renderTalents, switchTalentSubTab } from './talentView.js?v=5.0.79';
import { renderFactories } from './factoryView.js?v=5.0.79';
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
  const bridgePhase = currentBridgePhase();
  const bridgeForm = bridgePhase.flushForm;
  const countsNow = !!(b.isMet && b.countsForBridge && !b.pairSealed);
  const verdict = countsNow ? t('modal.flushCounts') : t('modal.flushNoCount');
  const verdictClass = countsNow
    ? 'bg-emerald-400 text-stone-950 border-emerald-200'
    : 'bg-amber-400 text-stone-950 border-amber-200';

  const reqLabel = document.getElementById('prestigeReqLabel');
  if (reqLabel) {
    reqLabel.innerHTML = `
      <div class="space-y-1.5">
        <div class="rounded-full border-2 px-3 py-2 text-center font-game text-sm font-bold ${verdictClass}">${verdict}</div>
        <div class="rounded-full border-2 border-yellow-300 bg-stone-950 px-3 py-1.5 text-center font-game text-xs text-yellow-200 whitespace-nowrap">
          ${t('modal.nowNeed', { now: formatNumber(b.currentForm), need: formatNumber(bridgeForm) })}
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="${b.meetsStage ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            ${t('modal.flushOpens', { cur: formatNumber(b.currentForm), req: formatNumber(b.reqForm) })}
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${b.meetsStage ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${b.meetsStage ? t('modal.reached') : t('modal.needMoreForms', { n: formatNumber(Math.max(0, b.reqForm - b.currentForm)) })}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="${b.meetsBiomass ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            ${t('modal.biomassLine', { cur: formatNumber(b.currentBiomass), req: formatNumber(b.reqBiomass) })}
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${b.meetsBiomass ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${b.meetsBiomass ? t('modal.collected') : t('modal.needMoreBiomass', { n: formatNumber(Math.max(0, b.reqBiomass - b.currentBiomass)) })}
          </span>
        </div>
      </div>
    `;
  }

  const calcEl = document.getElementById('prestigeCalcRolls');
  if (calcEl) {
    const flushes = b.flushes || GAME.totalPrestiges || 0;
    const echoPhaseId = b.echoPhase || b.phase?.id || 1;
    const hadEcho = Number((GAME.phaseEcho || {})[echoPhaseId] ?? (GAME.phaseEcho || {})[String(echoPhaseId)] ?? 0);
    const nextEcho = 1 + getEchoBonus(hadEcho + 1);
    const nowMult = getRollsIncomeMult();
    const afterMult = getRollsIncomeMult(echoPhaseId, b.isMet ? 1 : 0);
    const bridge = currentBridgePhase();
    const bridgeHave = GAME.flushesThisCycle || 0;
    const bridgeNeed = flushesNeededForBridge();
    const plungerRoom = Math.max(0, plungerFlushCap() - (GAME.pairPlungersFromFlushes || 0));
    const yourEpoch = getPhaseForStage(GAME.evoStage || 0).id;
    const plungerLine = b.plungerGain > 0
      ? `+${formatNumber(1)}`
      : (echoPhaseId === bridge.id && !b.pairSealed
        ? (plungerRoom > 0 ? t('modal.plungerGives', { n: formatNumber(1), room: formatNumber(plungerRoom) }) : t('modal.plungerCapFull'))
        : t('modal.yourEpoch', { yours: formatNumber(yourEpoch), need: formatNumber(bridge.id) }));

    let nextMilestoneText = '';
    if (!b.isMet) nextMilestoneText = t('modal.ms.notMet');
    else if (b.pairSealed) nextMilestoneText = t('modal.ms.sealed');
    else if (!b.countsForBridge) nextMilestoneText = t('modal.ms.noBridge', { need: formatNumber(bridgeNeed), epoch: formatNumber(bridge.id), have: formatNumber(bridgeHave) });
    else if (b.plungerGain > 0) nextMilestoneText = t('modal.ms.toBridgePlunger', { n: formatNumber(1), epoch: formatNumber(bridge.id), have: formatNumber(bridgeHave), need: formatNumber(bridgeNeed) });
    else nextMilestoneText = t('modal.ms.toBridge', { have: formatNumber(bridgeHave), need: formatNumber(bridgeNeed) });

    calcEl.innerHTML = `
      <div class="mt-2 p-2.5 rounded-xl bg-purple-950/80 border border-yellow-400/40 text-left space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-yellow-300 uppercase font-black tracking-wider">${t('modal.rewardBushings')}</span>
          <span class="font-game text-sm text-yellow-300 font-bold">+${formatNumber(gain)} <span class="roll-icon"></span></span>
        </div>
        <div class="text-[10px] text-purple-200 space-y-0.5 font-mono">
          <div>├─ 🧻 ${t('modal.bioPart')}: <b class="text-white">+${formatNumber(b.bioPart)}</b></div>
          <div>├─ 🌀 ${t('modal.echoOfEpoch', { n: formatNumber(echoPhaseId) })}: <b class="text-white">${b.pairSealed ? t('modal.echoSealed') : t('modal.echoAfter', { n: formatNumber(nextEcho) })}</b></div>
          <div>├─ <span class="plunger-icon" aria-hidden="true"></span> ${t('modal.plunger')}: <b class="${b.plungerGain > 0 ? 'text-cyan-300' : 'text-amber-200'}">${plungerLine}</b></div>
          <div>└─ 📜 ${t('modal.flushTalents')}: <b class="${b.flushTalentBonus > 1 ? 'text-emerald-300' : 'text-stone-400'}">+${formatNumber(Math.round((b.flushTalentBonus - 1) * 100))}%</b></div>
        </div>
        <div class="text-[11px] text-yellow-100 font-game leading-snug">
          ${b.pairSealed ? t('modal.echoNoteSealed') : t('modal.echoNote', { n: formatNumber(nextEcho) })}
        </div>
        <button type="button" id="flushNotesToggle" class="w-full text-left font-bold text-[10px] text-amber-200 flex items-center justify-between gap-2 rounded-full border border-amber-400/50 px-3 py-1.5">
          <span>${t('modal.notesToggle')}</span>
          <span>${notesAreOpen('prestigeModal') ? '▴' : '▾'}</span>
        </button>
        <div class="${notesAreOpen('prestigeModal') ? '' : 'hidden'} text-purple-200/90 text-[9px] leading-tight space-y-0.5">
          <div>• ${t('modal.note1')}</div>
          <div>• ${t('modal.note2')}</div>
          <div>• ${t('modal.note3', { epoch: formatNumber(bridge.id), form: formatNumber(bridgeForm), have: formatNumber(bridgeHave), need: formatNumber(bridgeNeed) })}</div>
          <div>• ${t('modal.note4')}</div>
        </div>
      </div>
      <div class="text-[11px] text-purple-200 mt-2">
        ${t('modal.echoIncome')} <b class="text-white">x${formatNumber(nowMult)}</b> ➔ ${t('modal.afterFlush')} <b class="text-emerald-300">x${formatNumber(afterMult)}</b>
      </div>
      <div class="mt-1.5 pt-1.5 border-t border-yellow-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
        <span class="text-yellow-400 font-bold">${t('modal.flushRank', { n: formatNumber(flushes) })}</span>
        <span class="text-stone-300 font-semibold">${nextMilestoneText}</span>
      </div>
    `;
  }
  const execBtn = document.getElementById('btnExecutePrestige');
  if (execBtn) execBtn.disabled = !b.isMet || gain <= 0;
}

export function updateTranscendModalRealtime() {
  const modal = document.getElementById('transcendModal');
  if (!modal || modal.classList.contains('hidden')) return;

  const tb = getTranscendRewardBreakdown();
  const gain = tb.totalGain;

  const rollsEl = document.getElementById('transcendCurrentRolls');
  if (rollsEl) rollsEl.innerHTML = `${formatNumber(GAME.prestigeRolls)} <span class="roll-icon"></span>`;

  const plungersEl = document.getElementById('transcendCalcPlungers');
  if (plungersEl) {
    if (!tb.isMet) {
      plungersEl.innerHTML = `
        <div class="flex items-center gap-1.5 flex-wrap justify-end">
          <span class="text-cyan-300 font-bold text-sm">+${formatNumber(gain)} <span class="plunger-icon"></span></span>
          <span class="text-[10px] text-amber-300/80 font-mono">${t('modal.forecast')}</span>
        </div>
      `;
    } else {
      plungersEl.innerHTML = `+${formatNumber(gain)} <span class="plunger-icon"></span> ${t('modal.plungersWord')}`;
    }
  }

  const tReqLabel = document.getElementById('transcendReqLabel');
  if (tReqLabel) {
    tReqLabel.innerHTML = `
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="${tb.meetsPrestiges ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            ${t('modal.tFlushes', { epoch: formatNumber(tb.phase?.id || 2), cur: formatNumber(tb.currentPrestiges), req: formatNumber(tb.reqPrestiges) })}
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${tb.meetsPrestiges ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${tb.meetsPrestiges ? t('modal.done') : t(tb.reqPrestiges - tb.currentPrestiges === 1 ? 'modal.moreFlushesOne' : 'modal.moreFlushesMany', { n: formatNumber(tb.reqPrestiges - tb.currentPrestiges) })}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="${tb.meetsStage ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            ${t('modal.formLine', { cur: formatNumber(tb.currentForm), req: formatNumber(tb.reqForm) })}
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${tb.meetsStage ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${tb.meetsStage ? t('modal.reached') : t('modal.needMoreForms', { n: formatNumber(Math.max(0, tb.reqForm - tb.currentForm)) })}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="${tb.meetsBiomass ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            ${t('modal.runBiomass', { cur: formatNumber(tb.currentBiomass), req: formatNumber(tb.reqBiomass) })}
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${tb.meetsBiomass ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${tb.meetsBiomass ? t('modal.collected') : t('modal.needMoreBiomass', { n: formatNumber(Math.max(0, tb.reqBiomass - tb.currentBiomass)) })}
          </span>
        </div>
      </div>

      <div class="mt-2 p-2.5 rounded-xl bg-indigo-950/80 border border-cyan-400/40 text-left space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-cyan-300 uppercase font-black tracking-wider"><span class="plunger-icon" aria-hidden="true"></span> ${t('modal.plungerCalc')}</span>
          <span class="font-game text-sm text-cyan-300 font-bold">+${formatNumber(gain)} <span class="plunger-icon"></span></span>
        </div>
        <div class="text-[10px] text-indigo-200 space-y-0.5 font-mono">
          <div>├─ 🌀 ${t('modal.bridgeBase')}: <b class="text-white">+${formatNumber(tb.basePlungers)}</b> ${t('modal.plungerUnit')}</div>
          <div>├─ 🧬 ${t('modal.epochEnd')}: <b class="text-white">${tb.stagePart > 0 ? `+${formatNumber(tb.stagePart)} ${t('modal.plungerUnit')}` : t('modal.epochEndNo')}</b></div>
          <div>├─ <span class="plunger-icon"></span> ${t('modal.incubator')}: <b class="${tb.incubatorBonus > 0 ? 'text-cyan-300' : 'text-stone-400'}">+${formatNumber(Math.round(tb.incubatorBonus * 100))}%</b></div>
          <div>└─ 🔮 ${t('modal.soul')}: <b class="${tb.soulBonus > 0 ? 'text-cyan-300' : 'text-stone-400'}">+${formatNumber(Math.round(tb.soulBonus * 100))}%</b></div>
        </div>
        <div class="text-[11px] text-cyan-100 font-game leading-snug">
          ${t('modal.pairIncome')}
          ${tb.doubleChance > 0 ? ` ${t('modal.doubleChance')}` : ''}
        </div>
        <button type="button" id="transcendNotesToggle" class="w-full text-left font-bold text-[10px] text-cyan-200 flex items-center justify-between gap-2 rounded-full border border-cyan-400/50 px-3 py-1.5">
          <span>${t('modal.howMore')}</span>
          <span>${notesAreOpen('transcendModal') ? '▴' : '▾'}</span>
        </button>
        <div class="${notesAreOpen('transcendModal') ? '' : 'hidden'} text-indigo-200/90 text-[9px] leading-tight space-y-0.5">
          <div>• ${t('modal.tnote1', { req: formatNumber(tb.reqPrestiges), epoch: formatNumber(tb.phase?.id || 2), n: formatNumber(1) })}</div>
          <div>• ${t('modal.tnote2')}</div>
          <div>• ${t('modal.tnote3')}</div>
          <div>• ${t('modal.tnote4', { n: formatNumber(1) })}</div>
        </div>
      </div>
    `;
  }

  const milestoneEl = document.getElementById('transcendMilestoneHint');
  if (milestoneEl) {
    const transcends = tb.transcends;
    let tMilestoneText = '';
    if (transcends < 1) tMilestoneText = t('modal.tm1');
    else if (transcends < 3) tMilestoneText = t('modal.tm3', { n: formatNumber(transcends) });
    else if (transcends < 5) tMilestoneText = t('modal.tm5', { n: formatNumber(transcends) });
    else if (transcends < 10) tMilestoneText = t('modal.tm10', { n: formatNumber(transcends) });
    else tMilestoneText = t('modal.tmMax', { n: formatNumber(transcends) });

    milestoneEl.innerHTML = `
      <div class="flex items-center justify-between text-[10px] text-cyan-300 font-bold px-1 py-0.5">
        <span>${t('modal.transcendRank', { n: formatNumber(transcends) })}</span>
        <span class="text-indigo-200">${tMilestoneText}</span>
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
    relicBranch.title = relicsOpen ? t('modal.relicOpenTitle') : t('hud.relicsLocked');
  }
  if (relicBranchLabel) {
    relicBranchLabel.textContent = relicsOpen
      ? t('modal.relicOpenLabel')
      : t('modal.relicLockedLabel');
  }

  const execTransBtn = document.getElementById('btnExecuteTranscend');
  if (execTransBtn) {
    if (!tb.isMet) {
      execTransBtn.disabled = true;
      if (!tb.meetsPrestiges) {
        execTransBtn.textContent = t('modal.needFlushesBtn', { req: formatNumber(tb.reqPrestiges), epoch: formatNumber(tb.phase?.id || 2), cur: formatNumber(tb.currentPrestiges) });
      } else if (!tb.meetsStage) {
        execTransBtn.textContent = t('modal.needFormBtn', { req: formatNumber(tb.reqForm), cur: formatNumber(tb.currentForm) });
      } else {
        execTransBtn.textContent = t('modal.needBiomassBtn', { req: formatNumber(tb.reqBiomass) });
      }
    } else {
      execTransBtn.disabled = gain <= 0;
      execTransBtn.textContent = t('modal.doTranscend');
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
