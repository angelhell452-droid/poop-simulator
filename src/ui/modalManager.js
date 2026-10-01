import { GAME } from '../core/state.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getPrestigeRollsReward, executePrestige, getPrestigeRequirement, getPrestigeRewardBreakdown } from '../prestige/prestigeService.js';
import { getTranscendPlungersReward, executeTranscend, getTranscendRequirement, getTranscendRewardBreakdown } from '../prestige/transcendService.js';
import { TALENTS } from '../data/talents.data.js';

import { updateHUD } from './hudView.js';
import { renderCasesSystem } from './casesView.js';
import { renderCharacterInventory } from './characterInventoryView.js';
import { renderTalents, switchTalentSubTab } from './talentView.js';
import { renderFactories } from './factoryView.js';
import { renderShop } from './shopView.js';
import { events } from '../core/events.js';

let pendingPrestigeArchetype = 'balanced';

export function initModals() {
  // Global modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fixed.inset-0').forEach(m => m.classList.add('hidden'));
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

  // Open Prestige Modal
  const openPrestigeModal = () => {
    pendingPrestigeArchetype = GAME.archetype || 'balanced';
    renderArchetypeButtons();

    const b = getPrestigeRewardBreakdown();
    const gain = b.totalGain;

    const reqLabel = document.getElementById('prestigeReqLabel');
    if (reqLabel) {
      reqLabel.innerHTML = `
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="${b.meetsStage ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
              🧬 Форма: #${b.currentForm} / #${b.reqForm}
            </span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${b.meetsStage ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
              ${b.meetsStage ? '✓ Достигнуто' : `Нужно еще +${Math.max(0, b.reqForm - b.currentForm)} форм`}
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
      const flushes = GAME.totalPrestiges || 0;
      const bonusPerRoll = (flushes >= 25 ? 0.04 : 0.02) * (1 + (TALENTS.find(t => t.id === 'golden_leaf')?.level || 0) * 0.05);
      const currentBoost = ((GAME.prestigeRolls || 0) * bonusPerRoll * 100);
      const postBoost = (((GAME.prestigeRolls || 0) + gain) * bonusPerRoll * 100);

      let nextMilestoneText = '';
      if (flushes < 1) nextMilestoneText = '🎯 Смыв #1: Втулки Судьбы и Древо Талантов';
      else if (flushes < 5) nextMilestoneText = `🎯 Смыв #5: 🪠 Открытие Астрального Прорыва [${flushes}/5]`;
      else if (flushes < 10) nextMilestoneText = `🎯 Смыв #10: 🌠 Золотая Лихорадка (x2 Метеориты) [${flushes}/10]`;
      else if (flushes < 25) nextMilestoneText = `🎯 Смыв #25: 👑 Втулочная Империя (удвоенный бонус) [${flushes}/25]`;
      else nextMilestoneText = `🏆 Высший Магистр Смыва (${flushes} смывов)!`;

      calcEl.innerHTML = `
        <div class="mt-2 p-2.5 rounded-xl bg-purple-950/80 border border-yellow-400/40 text-left space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-yellow-300 uppercase font-black tracking-wider">💰 Расчет награды Втулок:</span>
            <span class="font-game text-sm text-yellow-300 font-bold">+${formatNumber(gain)} <span class="roll-icon"></span></span>
          </div>
          <div class="text-[10px] text-purple-200 space-y-0.5 font-mono">
            <div>├─ 💨 От биомассы забега: <b class="text-white">+${formatNumber(b.bioPart)}</b> втулок</div>
            <div>├─ 🧬 От эволюции формы: <b class="text-white">+${formatNumber(b.stagePart)}</b> втулок ${b.extraForms > 0 ? `(+${formatNumber(b.extraForms)} сверх цели)` : ''}</div>
            <div>├─ 🗡️ Бонус оружия (Коса): <b class="${b.scytheActive ? 'text-emerald-300' : 'text-stone-400'}">${b.scytheActive ? '+25% (АКТИВЕН)' : '0%'}</b></div>
            <div>└─ 📜 Таланты Смыва: <b class="${b.flushTalentBonus > 1 ? 'text-emerald-300' : 'text-stone-400'}">+${Math.round((b.flushTalentBonus - 1) * 100)}%</b></div>
          </div>
          <div class="pt-1.5 border-t border-purple-800/60 text-[10px] text-amber-300 font-sans space-y-0.5">
            <div class="font-bold flex items-center gap-1">
              <span>💡</span>
              <span>Как получить больше Втулок?</span>
            </div>
            <div class="text-purple-200/90 text-[9px] leading-tight">
              • Копите больше биомассы (до +1 втулки еще: <b>${formatNumber(b.nextRollBiomassNeeded)} 💨</b>)<br/>
              • Развивайте форму выше цели (каждая форма увеличивает награду!)<br/>
              • Качайте таланты "Бесконечный Смыв" и "Гипер-Смыв"
            </div>
          </div>
        </div>
        <div class="text-[11px] text-purple-200 mt-2">
          Бонус ко ВСЕМУ доходу: <b class="text-white">+${formatNumber(currentBoost)}%</b> ➔ После смыва: <b class="text-emerald-300">+${formatNumber(postBoost)}%</b>
        </div>
        <div class="mt-1.5 pt-1.5 border-t border-yellow-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
          <span class="text-yellow-400 font-bold">Смыв: Ранг ${formatNumber(flushes)}</span>
          <span class="text-stone-300 font-semibold">${nextMilestoneText}</span>
        </div>
      `;
    }
    const execBtn = document.getElementById('btnExecutePrestige');
    if (execBtn) execBtn.disabled = !b.isMet || gain <= 0;
    document.getElementById('prestigeModal')?.classList.remove('hidden');
  };

  document.getElementById('btnPrestigeModal')?.addEventListener('click', openPrestigeModal);
  document.getElementById('btnCanvasPrestige')?.addEventListener('click', openPrestigeModal);
  document.getElementById('currencyPrestigeBox')?.addEventListener('click', openPrestigeModal);

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

  // Open Transcend Modal (accessible from header button, canvas button, and plungers currency bar)
  const openTranscendModal = () => {
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
              🌀 Смывы: ${formatNumber(t.currentPrestiges)} / ${formatNumber(t.reqPrestiges)}
            </span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${t.meetsPrestiges ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
              ${t.meetsPrestiges ? '✓ Выполнено' : `Нужно еще ${formatNumber(t.reqPrestiges - t.currentPrestiges)} смывов`}
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
            <span class="${t.meetsRolls ? 'text-emerald-300 font-bold' : 'text-stone-300'}">
              <span class="roll-icon"></span> Накоплено Втулок: ${formatNumber(t.currentRolls)} / ${formatNumber(t.reqRolls)}
            </span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${t.meetsRolls ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-stone-800 text-stone-400'}">
              ${t.meetsRolls ? '✓ Накоплено' : `Нужно еще ${formatNumber(Math.max(0, t.reqRolls - t.currentRolls))} втулок`}
            </span>
          </div>
        </div>

        <div class="mt-2 p-2.5 rounded-xl bg-indigo-950/80 border border-cyan-400/40 text-left space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-cyan-300 uppercase font-black tracking-wider">🪠 Расчет награды Вантузов:</span>
            <span class="font-game text-sm text-cyan-300 font-bold">+${formatNumber(gain)} <span class="plunger-icon"></span></span>
          </div>
          <div class="text-[10px] text-indigo-200 space-y-0.5 font-mono">
            <div>├─ 🌀 От числа Смывов (${formatNumber(t.currentPrestiges)}): <b class="text-white">+${formatNumber(t.flushPart)}</b> вантузов (+1 за каждый смыв)</div>
            <div>├─ <span class="roll-icon"></span> От накопленных Втулок за Прорыв (${formatNumber(t.currentRolls)}): <b class="text-white">+${formatNumber(t.rollsPart)}</b> вантузов (+1 за 500 втулок)</div>
            <div>├─ 🧬 От эволюции формы (Форма #${formatNumber(t.currentForm)}): <b class="text-white">+${formatNumber(t.stagePart)}</b> вантузов (+1 за каждые 10 форм)</div>
            <div>├─ <span class="plunger-icon"></span> Астральный Инкубатор: <b class="${t.incubatorBonus > 0 ? 'text-cyan-300' : 'text-stone-400'}">+${Math.round(t.incubatorBonus * 100)}%</b></div>
            <div>└─ 🔮 Душа Прорыва (Талант): <b class="${t.soulBonus > 0 ? 'text-cyan-300' : 'text-stone-400'}">+${Math.round(t.soulBonus * 100)}%</b></div>
          </div>
          <div class="pt-1.5 border-t border-indigo-800/60 text-[10px] text-cyan-300 font-sans space-y-0.5">
            <div class="font-bold flex items-center gap-1">
              <span>💡</span>
              <span>Как получить больше Вантузов?</span>
            </div>
            <div class="text-indigo-200/90 text-[9px] leading-tight space-y-0.5">
              <div>• <b>Смывы</b>: делайте больше Смывов! Каждый Смыв гарантирует <b>+1 Вантуз</b> (+${formatNumber(t.flushPart)} сейчас)</div>
              <div>• <b>Втулки</b>: делайте Смывы и зарабатывайте Втулки! До следующего +1 вантуза нужно ещё: <b>${formatNumber(t.nextPlungerRollsNeeded)}</b> <span class="roll-icon"></span></div>
              <div>• <b>Формы</b>: развивайте какашку дальше (до следующего +1 вантуза ещё <b>${formatNumber(t.nextPlungerFormsNeeded)}</b> форм)</div>
              <div>• <b>Таланты</b>: качайте "Душа Прорыва" в Древе Смыва (+20% за ур.) и "Астральный Инкубатор" в Прорыве (+10% за ур.)</div>
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
      else if (transcends < 2) tMilestoneText = `🎯 Прорыв #2: 🤖 Авто-Уход за Питомцем & Авто-Заводы [${formatNumber(transcends)}/2]`;
      else if (transcends < 3) tMilestoneText = `🎯 Прорыв #3: 🌀 Авто-Эволюция Мутаций [${formatNumber(transcends)}/3]`;
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

    const execBtn = document.getElementById('btnExecuteTranscend');
    if (execBtn) {
      if (!t.isMet) {
        execBtn.disabled = true;
        if (!t.meetsPrestiges) {
          execBtn.textContent = `ТРЕБУЕТСЯ ${formatNumber(t.reqPrestiges)} СМЫВОВ (${formatNumber(t.currentPrestiges)}/${formatNumber(t.reqPrestiges)}) 🔒`;
        } else if (!t.meetsStage) {
          execBtn.textContent = `ТРЕБУЕТСЯ ФОРМА #${formatNumber(t.reqForm)} (СЕЙЧАС #${formatNumber(t.currentForm)}) 🔒`;
        } else {
          execBtn.textContent = `ТРЕБУЕТСЯ ${formatNumber(t.reqRolls)} ВТУЛОК 🔒`;
        }
      } else {
        execBtn.disabled = gain <= 0;
        execBtn.textContent = `СОВЕРШИТЬ АСТРАЛЬНЫЙ ПРОРЫВ! 🌌`;
      }
    }

    document.getElementById('transcendModal')?.classList.remove('hidden');
  };

  document.getElementById('btnTranscendModal')?.addEventListener('click', openTranscendModal);
  document.getElementById('btnCanvasTranscend')?.addEventListener('click', openTranscendModal);
  document.getElementById('currencyPlungersBox')?.addEventListener('click', openTranscendModal);

  // Quick navigation to Transcend Relics sub-tab in dashboard
  const navigateToTranscendRelics = () => {
    document.getElementById('transcendModal')?.classList.add('hidden');
    const talentDashBtn = document.querySelector('.dash-tab[data-target="panelTalents"]');
    if (talentDashBtn) talentDashBtn.click();
    switchTalentSubTab('transcend');
  };

  document.getElementById('btnOpenTranscendRelicsFromModal')?.addEventListener('click', navigateToTranscendRelics);
  document.getElementById('btnTranscendAutoInfo')?.addEventListener('click', navigateToTranscendRelics);

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
