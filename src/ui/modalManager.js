import { GAME } from '../core/state.js?v=5.0.23';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.23';
import { getPrestigeRollsReward, executePrestige, getPrestigeRequirement, getPrestigeRewardBreakdown } from '../prestige/prestigeService.js?v=5.0.23';
import { getTranscendPlungersReward, executeTranscend, getTranscendRequirement, getTranscendRewardBreakdown, flushesNeededForBridge, plungerFlushCap, currentBridgePhase } from '../prestige/transcendService.js?v=5.0.23';
import { getRollsIncomeMult, getEchoBonus } from '../economy/metaMultipliers.js?v=5.0.23';

import { updateHUD } from './hudView.js?v=5.0.23';
import { renderCasesSystem } from './casesView.js?v=5.0.23';
import { renderCharacterInventory } from './characterInventoryView.js?v=5.0.23';
import { renderTalents, switchTalentSubTab } from './talentView.js';
import { renderFactories } from './factoryView.js?v=5.0.23';
import { renderShop } from './shopView.js';
import { events } from '../core/events.js';
import { isRelicSectionUnlocked } from '../progression/unlocks.js';

let pendingPrestigeArchetype = 'balanced';

export function updatePrestigeModalRealtime() {
  const modal = document.getElementById('prestigeModal');
  if (!modal || modal.classList.contains('hidden')) return;

  const b = getPrestigeRewardBreakdown();
  const gain = b.totalGain;

  const reqLabel = document.getElementById('prestigeReqLabel');
  if (reqLabel) {
    reqLabel.innerHTML = `
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="${b.meetsStage ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            🧬 Форма: #${formatNumber(b.currentForm)} / #${formatNumber(b.reqForm)}
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${b.meetsStage ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${b.meetsStage ? '✓ Достигнуто' : `Нужно еще +${formatNumber(Math.max(0, b.reqForm - b.currentForm))} форм`}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="${b.meetsBiomass ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            💨 Биомасса: ${formatNumber(b.currentBiomass)} / ${formatNumber(b.reqBiomass)} 💨
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${b.meetsBiomass ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${b.meetsBiomass ? '✓ Накоплено' : `Нужно еще ${formatNumber(Math.max(0, b.reqBiomass - b.currentBiomass))} 💨`}
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

    let nextMilestoneText = '';
    if (!b.isMet) nextMilestoneText = 'Смыв откроется на нужной форме этой эпохи';
    else if (b.pairSealed) nextMilestoneText = 'Пара уже закрыта прорывом. Этот смыв даёт только втулки';
    else if (!b.countsForBridge) nextMilestoneText = `Этот смыв даст втулки и эхо. Для прорыва нужны ${formatNumber(bridgeNeed)} смыва на эпохе ${formatNumber(bridge.id)}: сейчас ${formatNumber(bridgeHave)} из ${formatNumber(bridgeNeed)}`;
    else if (b.plungerGain > 0) nextMilestoneText = `Этот смыв идёт в прорыв и даёт ${formatNumber(1)} вантуз. На эпохе ${formatNumber(bridge.id)}: ${formatNumber(bridgeHave)} из ${formatNumber(bridgeNeed)}`;
    else nextMilestoneText = `Этот смыв идёт в прорыв. Вантузы этой эпохи уже набраны: ${formatNumber(bridgeHave)} из ${formatNumber(bridgeNeed)}`;

    calcEl.innerHTML = `
      <div class="mt-2 p-2.5 rounded-xl bg-purple-950/80 border border-yellow-400/40 text-left space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-yellow-300 uppercase font-black tracking-wider">💰 Награда: втулки</span>
          <span class="font-game text-sm text-yellow-300 font-bold">+${formatNumber(gain)} <span class="roll-icon"></span></span>
        </div>
        <div class="text-[10px] text-purple-200 space-y-0.5 font-mono">
          <div>├─ 🧻 Втулки за этот смыв: <b class="text-white">+${formatNumber(b.bioPart)}</b></div>
          <div>├─ 🌀 Эхо эпохи ${formatNumber(echoPhaseId)}: <b class="text-white">${b.pairSealed ? 'пара уже на x3' : `x${formatNumber(nextEcho)} у этой эпохи`}</b></div>
          <div>├─ 🪠 Вантуз: <b class="${b.plungerGain > 0 ? 'text-cyan-300' : 'text-stone-400'}">${b.plungerGain > 0 ? `+${formatNumber(1)}` : (echoPhaseId === bridge.id && !b.pairSealed ? (plungerRoom > 0 ? `даст +${formatNumber(1)}, запас ${formatNumber(plungerRoom)}` : 'запас эпохи набран') : 'с этой эпохи вантуза нет')}</b></div>
          <div>├─ 🗡️ Бонус оружия (Коса): <b class="${b.scytheActive ? 'text-emerald-300' : 'text-stone-400'}">${b.scytheActive ? '+25% (АКТИВЕН)' : '0%'}</b></div>
          <div>└─ 📜 Таланты Смыва: <b class="${b.flushTalentBonus > 1 ? 'text-emerald-300' : 'text-stone-400'}">+${formatNumber(Math.round((b.flushTalentBonus - 1) * 100))}%</b></div>
        </div>
        <div class="pt-1.5 border-t border-purple-800/60 text-[10px] text-amber-300 font-sans space-y-0.5">
          <div class="font-bold flex items-center gap-1">
            <span>💡</span>
            <span>Втулки, эхо и прорыв — разные вещи</span>
          </div>
          <div class="text-purple-200/90 text-[9px] leading-tight">
            • Втулки тратят на таланты и кейсы. Ранняя эпоха даёт их меньше<br/>
            • Пока пара открыта, первый смыв эпохи даёт x2, повторы ползут к x3<br/>
            • Прорыв ставит всей паре x3, даже если эпоху до неё не смывали. Забег он не сбрасывает<br/>
            • Смыв эпохи ${formatNumber(bridge.id)} даёт ${formatNumber(1)} вантуз, пока с пары не собрано ${formatNumber(plungerFlushCap())}<br/>
            • Прорыву нужны ${formatNumber(bridgeNeed)} смыва на эпохе ${formatNumber(bridge.id)}. Потом снова дойдите до формы и биомассы и нажмите Прорыв
          </div>
        </div>
      </div>
      <div class="text-[11px] text-purple-200 mt-2">
        Доход от эха: <b class="text-white">x${formatNumber(nowMult)}</b> ➔ после смыва <b class="text-emerald-300">x${formatNumber(afterMult)}</b>
      </div>
      <div class="mt-1.5 pt-1.5 border-t border-yellow-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
        <span class="text-yellow-400 font-bold">Смыв: Ранг ${formatNumber(flushes)}</span>
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

  const t = getTranscendRewardBreakdown();
  const gain = t.totalGain;

  const rollsEl = document.getElementById('transcendCurrentRolls');
  if (rollsEl) rollsEl.innerHTML = `${formatNumber(GAME.prestigeRolls)} <span class="roll-icon"></span>`;

  const plungersEl = document.getElementById('transcendCalcPlungers');
  if (plungersEl) {
    if (!t.isMet) {
      plungersEl.innerHTML = `
        <div class="flex items-center gap-1.5 flex-wrap justify-end">
          <span class="text-cyan-300 font-bold text-sm">+${formatNumber(gain)} <span class="plunger-icon"></span></span>
          <span class="text-[10px] text-amber-300/80 font-mono">(прогноз к открытию)</span>
        </div>
      `;
    } else {
      plungersEl.innerHTML = `+${formatNumber(gain)} <span class="plunger-icon"></span> Вантузов`;
    }
  }

  const tReqLabel = document.getElementById('transcendReqLabel');
  if (tReqLabel) {
    tReqLabel.innerHTML = `
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="${t.meetsPrestiges ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            🌀 Смывы на эпохе ${formatNumber(t.phase?.id || 2)}: ${formatNumber(t.currentPrestiges)} из ${formatNumber(t.reqPrestiges)}
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${t.meetsPrestiges ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${t.meetsPrestiges ? '✓ Выполнено' : `Ещё ${formatNumber(t.reqPrestiges - t.currentPrestiges)} ${t.reqPrestiges - t.currentPrestiges === 1 ? 'смыв' : 'смыва'} на этой эпохе`}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="${t.meetsStage ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            🧬 Форма: #${formatNumber(t.currentForm)} / #${formatNumber(t.reqForm)}
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${t.meetsStage ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${t.meetsStage ? '✓ Достигнуто' : `Нужно еще +${formatNumber(Math.max(0, t.reqForm - t.currentForm))} форм`}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="${t.meetsBiomass ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
            💨 Биомасса забега: ${formatNumber(t.currentBiomass)} / ${formatNumber(t.reqBiomass)}
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${t.meetsBiomass ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
            ${t.meetsBiomass ? '✓ Накоплено' : `Нужно еще ${formatNumber(Math.max(0, t.reqBiomass - t.currentBiomass))} 💨`}
          </span>
        </div>
      </div>

      <div class="mt-2 p-2.5 rounded-xl bg-indigo-950/80 border border-cyan-400/40 text-left space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-cyan-300 uppercase font-black tracking-wider">🪠 Расчет награды Вантузов:</span>
          <span class="font-game text-sm text-cyan-300 font-bold">+${formatNumber(gain)} <span class="plunger-icon"></span></span>
        </div>
        <div class="text-[10px] text-indigo-200 space-y-0.5 font-mono">
          <div>├─ 🌀 База прорыва: <b class="text-white">+${formatNumber(t.basePlungers)}</b> вантуз</div>
          <div>├─ 🧬 Конец эпохи: <b class="text-white">${t.stagePart > 0 ? `+${formatNumber(t.stagePart)} вантуз` : 'ещё не дошли до конца эпохи'}</b></div>
          <div>├─ <span class="plunger-icon"></span> Астральный Инкубатор: <b class="${t.incubatorBonus > 0 ? 'text-cyan-300' : 'text-stone-400'}">+${formatNumber(Math.round(t.incubatorBonus * 100))}%</b></div>
          <div>└─ 🔮 Душа Прорыва (Талант): <b class="${t.soulBonus > 0 ? 'text-cyan-300' : 'text-stone-400'}">+${formatNumber(Math.round(t.soulBonus * 100))}%</b></div>
        </div>
        <div class="pt-1.5 border-t border-indigo-800/60 text-[10px] text-cyan-300 font-sans space-y-0.5">
          <div class="font-bold flex items-center gap-1">
            <span>💡</span>
            <span>Как получить больше Вантузов?</span>
          </div>
          <div class="text-indigo-200/90 text-[9px] leading-tight space-y-0.5">
            <div>• <b>${formatNumber(t.reqPrestiges)} смыва на эпохе ${formatNumber(t.phase?.id || 2)}</b>. Смыв этой эпохи даёт ${formatNumber(1)} вантуз, пока не набран запас пары</div>
            <div>• <b>Потом Прорыв</b>: снова наберите форму и биомассу этой эпохи. Лишний смыв не нужен</div>
            <div>• <b>Пара</b> получает доход x3, сколько бы смывов на ней ни было. Уже сделанные прорывы этот дар тоже получают</div>
            <div>• <b>Забег остаётся</b>. Прорыв открывает следующую пару. Награда — ${formatNumber(1)} вантуз, и ещё ${formatNumber(1)} за конец эпохи</div>
          </div>
        </div>
      </div>
    `;
  }

  const milestoneEl = document.getElementById('transcendMilestoneHint');
  if (milestoneEl) {
    const transcends = t.transcends;
    let tMilestoneText = '';
    if (transcends < 1) tMilestoneText = '🎯 Прорыв #1: Вантузы и Базовые Реликвии (Тир 1)';
    else if (transcends < 3) tMilestoneText = `🎯 Прорыв #3: 🌠 Звёздный дождь и кузница [${formatNumber(transcends)}/3]`;
    else if (transcends < 5) tMilestoneText = `🎯 Прорыв #5: ⏳ Временной Разлом (+25% к CPS) [${formatNumber(transcends)}/5]`;
    else if (transcends < 10) tMilestoneText = `🎯 Прорыв #10: 🌌 Сингулярность & Корона Демиурга [${formatNumber(transcends)}/10]`;
    else tMilestoneText = `🏆 Повелитель Астральной Сингулярности (${formatNumber(transcends)} прорывов)!`;

    milestoneEl.innerHTML = `
      <div class="flex items-center justify-between text-[10px] text-cyan-300 font-bold px-1 py-0.5">
        <span>Прорыв: Ранг ${formatNumber(transcends)}</span>
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
    relicBranch.title = relicsOpen ? 'Открыть реликвии прорыва' : 'Откроется после 1 Прорыва';
  }
  if (relicBranchLabel) {
    relicBranchLabel.textContent = relicsOpen
      ? 'Открыть ветку Реликвий в Талантах ➔'
      : '🔒 Ветка реликвий откроется после 1 Прорыва';
  }

  const execTransBtn = document.getElementById('btnExecuteTranscend');
  if (execTransBtn) {
    if (!t.isMet) {
      execTransBtn.disabled = true;
      if (!t.meetsPrestiges) {
        execTransBtn.textContent = `НУЖНЫ ${formatNumber(t.reqPrestiges)} СМЫВА НА ЭПОХЕ ${formatNumber(t.phase?.id || 2)} (${formatNumber(t.currentPrestiges)} ИЗ ${formatNumber(t.reqPrestiges)}) 🔒`;
      } else if (!t.meetsStage) {
        execTransBtn.textContent = `ТРЕБУЕТСЯ ФОРМА #${formatNumber(t.reqForm)} (СЕЙЧАС #${formatNumber(t.currentForm)}) 🔒`;
      } else {
        execTransBtn.textContent = `ТРЕБУЕТСЯ ${formatNumber(t.reqBiomass)} БИОМАССЫ 🔒`;
      }
    } else {
      execTransBtn.disabled = gain <= 0;
      execTransBtn.textContent = `СОВЕРШИТЬ АСТРАЛЬНЫЙ ПРОРЫВ! 🌌`;
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

export function initModals() {
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
}

function renderArchetypeButtons() {
  document.querySelectorAll('.arch-select-btn').forEach(btn => {
    const isSelected = btn.dataset.arch === pendingPrestigeArchetype;
    if (isSelected) {
      btn.className = 'arch-select-btn p-1.5 rounded-xl border text-center transition bg-purple-900/90 border-yellow-400 text-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.5)]';
    } else {
      btn.className = 'arch-select-btn p-1.5 rounded-xl border text-center transition bg-stone-900 border-stone-700 text-stone-300 hover:border-amber-500';
    }
  });
}
