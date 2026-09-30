import { GAME } from '../core/state.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getPrestigeRollsReward, executePrestige } from '../prestige/prestigeService.js';
import { getTranscendPlungersReward, executeTranscend, buyTranscendUpgrade } from '../prestige/transcendService.js';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js';
import { TALENTS } from '../data/talents.data.js';
import { updateHUD } from './hudView.js';

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
      pendingPrestigeArchetype = btn.dataset.arch || 'balanced';
      renderArchetypeButtons();
    });
  });

  // Open Prestige Modal
  const btnPrestigeModal = document.getElementById('btnPrestigeModal');
  if (btnPrestigeModal) {
    btnPrestigeModal.addEventListener('click', () => {
      pendingPrestigeArchetype = GAME.archetype || 'balanced';
      renderArchetypeButtons();

      const gain = getPrestigeRollsReward();
      const calcEl = document.getElementById('prestigeCalcRolls');
      if (calcEl) {
        const bonusPerRoll = 0.02 * (1 + (TALENTS.find(t => t.id === 'golden_leaf')?.level || 0) * 0.05);
        const currentBoost = ((GAME.prestigeRolls || 0) * bonusPerRoll * 100).toFixed(0);
        const postBoost = (((GAME.prestigeRolls || 0) + gain) * bonusPerRoll * 100).toFixed(0);
        calcEl.innerHTML = `
          <div class="font-game text-yellow-300 text-base mb-1">+${formatNumber(gain)} 🧻 Втулок Судьбы</div>
          <div class="text-[11px] text-purple-200">Текущий пассивный бонус: <b class="text-white">+${currentBoost}%</b> ➔ После смыва: <b class="text-emerald-300">+${postBoost}%</b> к доходу</div>
        `;
      }
      const execBtn = document.getElementById('btnExecutePrestige');
      if (execBtn) execBtn.disabled = gain <= 0;
      document.getElementById('prestigeModal')?.classList.remove('hidden');
    });
  }

  // Execute Prestige
  const btnExecutePrestige = document.getElementById('btnExecutePrestige');
  if (btnExecutePrestige) {
    btnExecutePrestige.addEventListener('click', () => {
      if (executePrestige(pendingPrestigeArchetype)) {
        document.getElementById('prestigeModal')?.classList.add('hidden');
        updateHUD();
      }
    });
  }

  // Open Transcend Modal
  const btnTranscendModal = document.getElementById('btnTranscendModal');
  if (btnTranscendModal) {
    btnTranscendModal.addEventListener('click', () => {
      const gain = getTranscendPlungersReward();
      const rollsEl = document.getElementById('transcendCurrentRolls');
      if (rollsEl) rollsEl.textContent = `${formatNumber(GAME.prestigeRolls)} 🧻`;
      const plungersEl = document.getElementById('transcendCalcPlungers');
      if (plungersEl) plungersEl.textContent = `+${formatNumber(gain)} 🪠 Вантузов`;
      const execBtn = document.getElementById('btnExecuteTranscend');
      if (execBtn) execBtn.disabled = gain <= 0;
      renderTranscendUpgrades();
      document.getElementById('transcendModal')?.classList.remove('hidden');
    });
  }

  // Execute Transcend
  const btnExecuteTranscend = document.getElementById('btnExecuteTranscend');
  if (btnExecuteTranscend) {
    btnExecuteTranscend.addEventListener('click', () => {
      if (executeTranscend()) {
        document.getElementById('transcendModal')?.classList.add('hidden');
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

  TRANSCEND_UPGRADES.forEach(upg => {
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
    const canBuy = (GAME.transcendPlungers || 0) >= cost && !isMax;

    const row = document.createElement('div');
    row.className = 'p-3 rounded-2xl bg-indigo-950/60 border border-cyan-500/40 flex items-center justify-between shadow-sm';
    row.innerHTML = `
      <div>
        <div class="font-bold text-xs text-cyan-200">${upg.name} <span class="text-yellow-400 font-game">(${lvl}/${upg.max})</span></div>
        <div class="text-[10px] text-stone-400">${upg.desc}</div>
      </div>
      <button class="buy-art-btn font-game text-xs px-3 py-1.5 rounded-xl border shrink-0 ml-2 transition ${isMax ? 'bg-stone-800 text-stone-500 border-stone-700' : (canBuy ? 'bg-cyan-500 hover:bg-cyan-400 text-stone-950 border-cyan-300 jelly-btn' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed')}" data-id="${upg.id}" ${canBuy ? '' : 'disabled'}>
        ${isMax ? 'МАКС' : `${cost} 🪠`}
      </button>
    `;

    row.querySelector('.buy-art-btn').addEventListener('click', () => {
      if (buyTranscendUpgrade(upg.id)) {
        renderTranscendUpgrades();
        updateHUD();
      }
    });

    listEl.appendChild(row);
  });
}
