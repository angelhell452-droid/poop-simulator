import { GAME, feedCount, washCount } from '../core/state.js?v=5.0.80';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js?v=5.0.80';
import { feedPet, washPet, ticklePet } from '../systems/petCareService.js';
import { equipBestKnife, sharpenKnife } from '../systems/knifeService.js';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { updateHUD } from './hudView.js?v=5.0.80';
import { addVisualParticle } from './petCanvasView.js?v=5.0.80';
import { openCharacterInventoryModal, renderCharacterInventory } from './characterInventoryView.js?v=5.0.80';
import { openPrestigeModal } from './modalManager.js?v=5.0.80';
import { renderCasesSystem } from './casesView.js?v=5.0.80';
import { t, onLocaleChange } from '../i18n/t.js';
import { saveLocal } from '../save/saveManager.js?v=5.0.80';

export const BEGINNER_STEPS = [
  {
    id: 'wash',
    icon: '🫧',
    titleKey: 'tutorial.step1Title',
    descKey: 'tutorial.step1Desc',
    rewardKey: 'tutorial.step1Reward',
    beaconSelector: '#btnWash',
    check: () => (washCount > 0) || (GAME.clean >= 95),
    action: () => {
      washPet();
      updateHUD();
      addVisualParticle(t('tutorial.step1Done'), '#38bdf8', 1.3);
      saveLocal();
    }
  },
  {
    id: 'feed',
    icon: '🍗',
    titleKey: 'tutorial.step2Title',
    descKey: 'tutorial.step2Desc',
    rewardKey: 'tutorial.step2Reward',
    beaconSelector: '#btnFeed',
    check: () => (feedCount > 0) || (GAME.hunger >= 95),
    action: () => {
      feedPet();
      updateHUD();
      addVisualParticle(t('tutorial.step2Done'), '#f97316', 1.3);
      saveLocal();
    }
  },
  {
    id: 'tickle',
    icon: '💖',
    titleKey: 'tutorial.step3Title',
    descKey: 'tutorial.step3Desc',
    rewardKey: 'tutorial.step3Reward',
    beaconSelector: '#btnTickle',
    check: () => (GAME.tickleCount > 0) || (GAME.comboHeat >= 5),
    action: () => {
      ticklePet();
      updateHUD();
      addVisualParticle(t('tutorial.step3Done'), '#ec4899', 1.3);
      saveLocal();
    }
  },
  {
    id: 'hat',
    icon: '🧢',
    titleKey: 'tutorial.step4Title',
    descKey: 'tutorial.step4Desc',
    rewardKey: 'tutorial.step4Reward',
    beaconSelector: '#btnOpenCharacterInventory',
    check: () => SHOP_ITEMS.some(i => i.type === 'hat' && i.owned) || Boolean(GAME.equippedHat),
    action: () => {
      const cap = SHOP_ITEMS.find(i => i.id === 'hat_cap');
      if (cap && !cap.owned && (GAME.sparkles || 0) >= cap.cost) {
        GAME.sparkles -= cap.cost;
        cap.owned = true;
        GAME.equippedHat = 'hat_cap';
        updateHUD();
        renderCharacterInventory();
        addVisualParticle(t('tutorial.step4Bought'), '#facc15', 1.4);
        saveLocal();
      } else {
        openCharacterInventoryModal('hats');
      }
    }
  },
  {
    id: 'flush',
    icon: '🌀',
    titleKey: 'tutorial.step5Title',
    descKey: 'tutorial.step5Desc',
    rewardKey: 'tutorial.step5Reward',
    beaconSelector: '#btnCanvasPrestige',
    check: () => (GAME.totalPrestiges || 0) > 0,
    action: () => {
      openPrestigeModal();
    }
  },
  {
    id: 'case',
    icon: '📦',
    titleKey: 'tutorial.step6Title',
    descKey: 'tutorial.step6Desc',
    rewardKey: 'tutorial.step6Reward',
    beaconSelector: '.dash-tab[data-target="panelCases"]',
    check: () => (GAME.casesOpened || 0) > 0 || (GAME.unlockedKnives || []).length > 0,
    action: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelCases"]');
      if (tab) tab.click();
    }
  },
  {
    id: 'equipKnife',
    icon: '🗡️',
    titleKey: 'tutorial.step7Title',
    descKey: 'tutorial.step7Desc',
    rewardKey: 'tutorial.step7Reward',
    beaconSelector: '#btnOpenCharacterInventoryFromCases',
    check: () => Boolean(GAME.equippedKnife),
    action: () => {
      const res = equipBestKnife();
      if (res.success) {
        updateHUD();
        renderCasesSystem();
        renderCharacterInventory();
        addVisualParticle(t('tutorial.step7Equipped'), '#facc15', 1.35);
        saveLocal();
      } else {
        openCharacterInventoryModal('knives');
      }
    }
  },
  {
    id: 'sharpen',
    icon: '✨',
    titleKey: 'tutorial.step8Title',
    descKey: 'tutorial.step8Desc',
    rewardKey: 'tutorial.step8Reward',
    beaconSelector: '#btnSharpenEquippedKnife',
    check: () => Object.values(GAME.knifeStars || {}).some(s => s > 1),
    action: () => {
      if (GAME.equippedKnife && (GAME.sparkles || 0) >= 25) {
        const res = sharpenKnife(GAME.equippedKnife);
        if (res.success) {
          updateHUD();
          renderCharacterInventory();
          addVisualParticle(t('tutorial.step8Sharpened', { n: formatNumber(res.newStar) }), '#eab308', 1.35);
          saveLocal();
          return;
        }
      }
      openCharacterInventoryModal('knives');
    }
  },
  {
    id: 'talent',
    icon: '🌟',
    titleKey: 'tutorial.step9Title',
    descKey: 'tutorial.step9Desc',
    rewardKey: 'tutorial.step9Reward',
    beaconSelector: '.dash-tab[data-target="panelTalents"]',
    check: () => TALENTS.some(t => (t.level || 0) > 0),
    action: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelTalents"]');
      if (tab) tab.click();
    }
  }
];

let isListExpanded = false;
let currentBeaconEl = null;

export function getBeginnerGuideProgress() {
  let completed = 0;
  for (const step of BEGINNER_STEPS) {
    if (step.check()) completed++;
  }
  return {
    completed,
    total: BEGINNER_STEPS.length,
    isComplete: completed >= BEGINNER_STEPS.length
  };
}

export function getNextBeginnerStep() {
  for (const step of BEGINNER_STEPS) {
    if (!step.check()) return step;
  }
  return null;
}

export function isBeginnerGuideComplete() {
  return getBeginnerGuideProgress().isComplete;
}

function updateBeacon(nextStep) {
  if (currentBeaconEl) {
    currentBeaconEl.classList.remove('tutorial-beacon');
    currentBeaconEl = null;
  }
  if (!nextStep || !nextStep.beaconSelector) return;

  const target = document.querySelector(nextStep.beaconSelector);
  if (target) {
    target.classList.add('tutorial-beacon');
    currentBeaconEl = target;
  }
}

export function updateBeginnerGuide() {
  const container = document.getElementById('beginnerGuideBar');
  if (!container) return;

  const progress = getBeginnerGuideProgress();
  const nextStep = getNextBeginnerStep();

  // If completed and not rewarded, grant the completion reward!
  if (progress.isComplete && !GAME.tutorialRewardClaimed) {
    GAME.tutorialRewardClaimed = true;
    GAME.sparkles = (GAME.sparkles || 0) + 100;
    GAME.prestigeRolls = (GAME.prestigeRolls || 0) + 5;
    addVisualParticle(t('tutorial.allCompleted'), '#22c55e', 2.0);
    saveLocal();
  }

  // Update visual beacon on UI
  updateBeacon(nextStep);

  // Render main bar content
  const iconEl = document.getElementById('beginnerStepIcon');
  const titleEl = document.getElementById('beginnerStepTitle');
  const badgeEl = document.getElementById('beginnerProgressBadge');
  const fillEl = document.getElementById('beginnerProgressFill');
  const actionBtn = document.getElementById('beginnerActionBtn');
  const listDrawer = document.getElementById('beginnerListDrawer');

  if (iconEl) iconEl.textContent = nextStep ? nextStep.icon : '🎉';
  if (badgeEl) badgeEl.textContent = `${progress.completed} / ${progress.total}`;
  if (fillEl) fillEl.style.width = `${(progress.completed / progress.total) * 100}%`;

  if (progress.isComplete) {
    if (titleEl) {
      titleEl.innerHTML = `<span class="text-emerald-400 font-bold">${t('tutorial.allDoneBadge')}</span> · <span class="text-stone-300">${t('tutorial.rewardNotice')}</span>`;
    }
    if (actionBtn) {
      actionBtn.classList.add('hidden');
    }
  } else if (nextStep) {
    if (titleEl) {
      titleEl.innerHTML = `<span class="text-emerald-400 font-bold">${t(nextStep.titleKey)}</span> <span class="text-stone-400 hidden sm:inline">(${t(nextStep.rewardKey)})</span>`;
    }
    if (actionBtn) {
      actionBtn.classList.remove('hidden');
      actionBtn.textContent = t('tutorial.actionBtn');
      actionBtn.onclick = () => {
        nextStep.action();
      };
    }
  }

  // Render list drawer if expanded
  if (listDrawer) {
    if (isListExpanded) {
      listDrawer.classList.remove('hidden');
      renderListDrawer(listDrawer);
    } else {
      listDrawer.classList.add('hidden');
    }
  }
}

function renderListDrawer(drawerEl) {
  drawerEl.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2.5';

  BEGINNER_STEPS.forEach((step, idx) => {
    const isDone = step.check();
    const item = document.createElement('div');
    item.className = `p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
      isDone
        ? 'bg-emerald-950/40 border-emerald-500/30 text-stone-300'
        : 'bg-stone-900 border-amber-500/40 text-stone-100 shadow-md ring-1 ring-amber-500/20'
    }`;

    item.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-lg shrink-0">${isDone ? '✅' : step.icon}</span>
        <div class="min-w-0">
          <div class="font-bold truncate text-[11px] ${isDone ? 'line-through text-stone-400' : 'text-amber-200'}">
            ${idx + 1}. ${t(step.titleKey)}
          </div>
          <div class="text-[9.5px] text-stone-400 truncate">${t(step.rewardKey)}</div>
        </div>
      </div>
      <div class="shrink-0">
        ${
          isDone
            ? '<span class="text-[10px] text-emerald-400 font-bold">Готово</span>'
            : `<button class="beginner-step-btn px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-[9px] hover:brightness-110 shadow jelly-btn">
                ${t('tutorial.actionBtn')}
              </button>`
        }
      </div>
    `;

    if (!isDone) {
      item.querySelector('.beginner-step-btn')?.addEventListener('click', () => {
        step.action();
      });
    }

    grid.appendChild(item);
  });

  drawerEl.appendChild(grid);
}

export function initBeginnerGuideListeners() {
  const toggleBtn = document.getElementById('beginnerToggleListBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isListExpanded = !isListExpanded;
      toggleBtn.textContent = isListExpanded ? t('tutorial.closeListBtn') : t('tutorial.listBtn');
      updateBeginnerGuide();
    });
  }

  onLocaleChange(() => {
    updateBeginnerGuide();
  });
}
