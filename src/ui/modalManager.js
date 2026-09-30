import { GAME } from '../core/state.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getPrestigeRollsReward, executePrestige, getPrestigeRequirement } from '../prestige/prestigeService.js';
import { getTranscendPlungersReward, executeTranscend, buyTranscendUpgrade, getTranscendRequirement } from '../prestige/transcendService.js';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js';
import { TALENTS } from '../data/talents.data.js';
import { updateHUD } from './hudView.js';
import { renderCasesSystem } from './casesView.js';
import { renderCharacterInventory } from './characterInventoryView.js';
import { renderTalents } from './talentView.js';
import { renderFactories } from './factoryView.js';
import { renderShop } from './shopView.js';

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

    const req = getPrestigeRequirement();
    const gain = getPrestigeRollsReward();

    const reqLabel = document.getElementById('prestigeReqLabel');
    if (reqLabel) {
      const stageOk = req.meetsStage ? 'text-emerald-300 font-bold' : 'text-stone-300';
      const bioOk = req.meetsBiomass ? 'text-emerald-300 font-bold' : 'text-stone-300';
      const statusBadge = req.isMet 
        ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold">✓ ГОТОВО К СМЫВУ</span>'
        : '<span class="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/50 font-bold">🔒 НУЖЕН РОСТ</span>';
      reqLabel.innerHTML = `
        <div class="flex items-center justify-between gap-1 flex-wrap">
          <div><span class="${stageOk}">Форма #${req.reqForm}</span> (сейчас #${req.currentForm}) или <span class="${bioOk}">${formatNumber(req.reqBiomass)} 💨</span></div>
          ${statusBadge}
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
      else if (flushes < 5) nextMilestoneText = `🎯 Смыв #5: 🪠 Открытие Астрального Прорыва (Transcend) [${flushes}/5]`;
      else if (flushes < 10) nextMilestoneText = `🎯 Смыв #10: 🌠 Золотая Лихорадка (x2 Метеориты, +50% Блестяшки) [${flushes}/10]`;
      else if (flushes < 25) nextMilestoneText = `🎯 Смыв #25: 👑 Втулочная Империя (удвоенный бонус за втулку) [${flushes}/25]`;
      else if (flushes < 50) nextMilestoneText = `🎯 Смыв #50: 🌌 Сингулярность Бездны (Кейс 50B 🧻) [${flushes}/50]`;
      else nextMilestoneText = `🏆 Высший Магистр Смыва Омниверса (${flushes} смывов)!`;

      calcEl.innerHTML = `
        <div class="font-game text-yellow-300 text-base mb-1">+${formatNumber(gain)} 🧻 Втулок Судьбы</div>
        <div class="text-[11px] text-purple-200">
          Бонус ко ВСЕМУ доходу (Клики + Заводы): <b class="text-white">+${formatNumber(currentBoost)}%</b> ➔ После смыва: <b class="text-emerald-300">+${formatNumber(postBoost)}%</b>
        </div>
        <div class="mt-2 pt-2 border-t border-yellow-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
          <span class="text-yellow-400 font-bold">Смывов совершено: ${flushes}</span>
          <span class="text-stone-300 font-semibold">${nextMilestoneText}</span>
        </div>
      `;
    }
    const execBtn = document.getElementById('btnExecutePrestige');
    if (execBtn) execBtn.disabled = !req.isMet || gain <= 0;
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
    const tReq = getTranscendRequirement();
    const gain = getTranscendPlungersReward();

    const rollsEl = document.getElementById('transcendCurrentRolls');
    if (rollsEl) rollsEl.textContent = `${formatNumber(GAME.prestigeRolls)} 🧻`;

    const plungersEl = document.getElementById('transcendCalcPlungers');
    if (plungersEl) {
      if (!tReq.meetsPrestiges) {
        plungersEl.innerHTML = `<span class="text-red-400 font-bold text-xs">🔒 Требуется ${tReq.reqPrestiges} Смывов! (${tReq.currentPrestiges}/${tReq.reqPrestiges})</span>`;
      } else {
        plungersEl.textContent = `+${formatNumber(gain)} 🪠 Вантузов`;
      }
    }

    const tReqLabel = document.getElementById('transcendReqLabel');
    if (tReqLabel) {
      const formOk = tReq.meetsStage ? 'text-emerald-300 font-bold' : 'text-stone-300';
      const pOk = tReq.meetsPrestiges ? 'text-emerald-300 font-bold' : 'text-stone-300';
      const rOk = tReq.meetsRolls ? 'text-emerald-300 font-bold' : 'text-stone-300';
      const statusBadge = tReq.isMet 
        ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold">✓ ГОТОВ К ПРОРЫВУ</span>'
        : '<span class="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/50 font-bold">🔒 ТРЕБУЮТСЯ РЕСУРСЫ</span>';
      tReqLabel.innerHTML = `
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="${pOk}">• Смывы: ${tReq.currentPrestiges} / ${tReq.reqPrestiges}</span>
            ${statusBadge}
          </div>
          <div class="flex items-center justify-between">
            <span class="${formOk}">• Форма: #${tReq.currentForm} / #${tReq.reqForm}</span>
            <span class="${rOk}">• Втулки: ${formatNumber(tReq.currentRolls)} / ${formatNumber(tReq.reqRolls)} 🧻</span>
          </div>
        </div>
      `;
    }

    const milestoneEl = document.getElementById('transcendMilestoneHint');
    if (milestoneEl) {
      const transcends = tReq.transcends;
      let tMilestoneText = '';
      if (transcends < 1) tMilestoneText = '🎯 Прорыв #1: Вантузы и Базовые Реликвии (Тир 1)';
      else if (transcends < 2) tMilestoneText = `🎯 Прорыв #2: 🤖 Авто-Уход за Питомцем & Авто-Заводы [${transcends}/2]`;
      else if (transcends < 3) tMilestoneText = `🎯 Прорыв #3: 🌀 Авто-Эволюция Мутаций [${transcends}/3]`;
      else if (transcends < 5) tMilestoneText = `🎯 Прорыв #5: ⏳ Временной Разлом (+25% к CPS всех фабрик) [${transcends}/5]`;
      else if (transcends < 10) tMilestoneText = `🎯 Прорыв #10: 🌌 Сингулярность & Корона Демиурга [${transcends}/10]`;
      else tMilestoneText = `🏆 Повелитель Астральной Сингулярности (${transcends} прорывов)!`;

      milestoneEl.innerHTML = `
        <div class="flex items-center justify-between text-[10px] text-cyan-300 font-bold px-1 py-0.5">
          <span>Прорывов: ${transcends}</span>
          <span class="text-indigo-200">${tMilestoneText}</span>
        </div>
      `;
    }

    const execBtn = document.getElementById('btnExecuteTranscend');
    if (execBtn) {
      if (!tReq.isMet) {
        execBtn.disabled = true;
        if (!tReq.meetsPrestiges) {
          execBtn.textContent = `ТРЕБУЕТСЯ ${tReq.reqPrestiges} СМЫВОВ (${tReq.currentPrestiges}/${tReq.reqPrestiges}) 🔒`;
        } else {
          execBtn.textContent = `ТРЕБУЕТСЯ ФОРМА #${tReq.reqForm} ИЛИ ${formatNumber(tReq.reqRolls)} 🧻 🔒`;
        }
      } else {
        execBtn.disabled = gain <= 0;
        execBtn.textContent = `СОВЕРШИТЬ АСТРАЛЬНЫЙ ПРОРЫВ! 🌌`;
      }
    }

    renderTranscendUpgrades();
    document.getElementById('transcendModal')?.classList.remove('hidden');
  };

  document.getElementById('btnTranscendModal')?.addEventListener('click', openTranscendModal);
  document.getElementById('btnCanvasTranscend')?.addEventListener('click', openTranscendModal);
  document.getElementById('currencyPlungersBox')?.addEventListener('click', openTranscendModal);

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

export function renderTranscendUpgrades() {
  const listEl = document.getElementById('transcendUpgradesList');
  if (!listEl) return;
  listEl.innerHTML = '';

  const transcends = GAME.totalTranscend || 0;

  // Group by Tiers
  const tiers = [
    { tier: 1, name: '⭐ Тир 1: Базовые Реликвии (1+ Прорыв)' },
    { tier: 2, name: '⚡ Тир 2: Продвинутая Автоматизация (3+ Прорывов)' },
    { tier: 3, name: '🔮 Тир 3: Мастер-Реликвии (5+ Прорывов)' },
    { tier: 4, name: '🌌 Тир 4: Космическая Сингулярность (10+ Прорывов)' }
  ];

  tiers.forEach(tInfo => {
    const tierUpgrades = TRANSCEND_UPGRADES.filter(u => u.tier === tInfo.tier);
    if (tierUpgrades.length === 0) return;

    const tierHeader = document.createElement('div');
    tierHeader.className = 'text-[11px] font-game text-cyan-300 uppercase tracking-wider pt-2 pb-1 border-b border-cyan-500/30 flex items-center justify-between';
    tierHeader.innerHTML = `<span>${tInfo.name}</span>`;
    listEl.appendChild(tierHeader);

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

      const row = document.createElement('div');
      row.className = `p-2.5 rounded-2xl border flex items-center justify-between shadow-sm transition ${isLocked ? 'bg-indigo-950/30 border-stone-800 opacity-60' : 'bg-indigo-950/60 border-cyan-500/40'}`;
      
      const lockBadge = isLocked 
        ? `<span class="text-[9px] text-red-400 font-bold block mt-0.5">🔒 Требуется ${upg.reqTranscend} Прорывов (Сделано: ${transcends})</span>`
        : '';

      const btnText = isLocked 
        ? '🔒' 
        : (isMax ? 'МАКС' : `${formatNumber(cost)} 🪠`);

      row.innerHTML = `
        <div class="pr-2">
          <div class="font-bold text-xs ${isLocked ? 'text-stone-400' : 'text-cyan-200'}">
            ${upg.name} <span class="text-yellow-400 font-game">(${lvl}/${upg.max})</span>
          </div>
          <div class="text-[10px] text-stone-300 leading-tight mt-0.5">${upg.desc}</div>
          ${lockBadge}
        </div>
        <button class="buy-art-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 transition ${isMax ? 'bg-stone-800 text-stone-500 border-stone-700' : (canBuy ? 'bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-black border-cyan-300 jelly-btn shadow-md' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed')}" data-id="${upg.id}" ${canBuy ? '' : 'disabled'}>
          ${btnText}
        </button>
      `;

      if (canBuy) {
        row.querySelector('.buy-art-btn').addEventListener('click', () => {
          if (buyTranscendUpgrade(upg.id)) {
            renderTranscendUpgrades();
            updateHUD();
          }
        });
      }

      listEl.appendChild(row);
    });
  });
}
