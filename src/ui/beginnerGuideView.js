import { GAME, feedCount, washCount } from '../core/state.js?v=5.0.80';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js?v=5.0.80';
import { FACTORIES } from '../data/factories.data.js?v=5.0.80';
import { feedPet, washPet, ticklePet } from '../systems/petCareService.js';
import { equipBestKnife, sharpenKnife } from '../systems/knifeService.js';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { updateHUD } from './hudView.js?v=5.0.80';
import { addVisualParticle, triggerForcedMeteor } from './petCanvasView.js?v=5.0.80';
import { openCharacterInventoryModal, renderCharacterInventory } from './characterInventoryView.js?v=5.0.80';
import { openPrestigeModal, openTranscendModal } from './modalManager.js?v=5.0.80';
import { switchTalentSubTab } from './talentView.js?v=5.0.80';
import { renderCasesSystem } from './casesView.js?v=5.0.80';
import { t, onLocaleChange } from '../i18n/t.js';
import { saveLocal } from '../save/saveManager.js?v=5.0.80';
import { gainBio } from '../utils/big.js?v=5.0.80';

export const BEGINNER_STEPS = [
  // 1. Первые шаги
  {
    id: 'clicks',
    icon: '👆',
    titleKey: 'tutorial.step1Title',
    descKey: 'tutorial.step1Desc',
    rewardKey: 'tutorial.step1Reward',
    doneKey: 'tutorial.step1Done',
    beaconSelector: '#petCanvas',
    check: () => (GAME.totalClicks || 0) >= 50,
    progress: () => {
      const cur = Math.min(50, GAME.totalClicks || 0);
      return { current: cur, max: 50, label: `Клики: ${formatNumber(cur)} / 50` };
    },
    guide: () => {
      const el = document.getElementById('petCanvas');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    claim: () => {
      GAME.biomass = gainBio(GAME.biomass, 300);
      addVisualParticle('+300 биомассы', '#34d399', 1.8);
    }
  },
  // 2. Пассивный рост
  {
    id: 'factory',
    icon: '🏭',
    titleKey: 'tutorial.step2Title',
    descKey: 'tutorial.step2Desc',
    rewardKey: 'tutorial.step2Reward',
    doneKey: 'tutorial.step2Done',
    beaconSelector: '.dash-tab[data-target="panelFactories"]',
    check: () => (FACTORIES[0]?.count || 0) > 0 || FACTORIES.some(f => (f.count || 0) > 0),
    progress: () => {
      const count = FACTORIES.reduce((s, f) => s + (f.count || 0), 0);
      const cur = Math.min(1, count);
      return { current: cur, max: 1, label: `Заводы: ${formatNumber(cur)} / 1` };
    },
    guide: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelFactories"]');
      if (tab) tab.click();
    },
    claim: () => {
      GAME.sparkles = (GAME.sparkles || 0) + 20;
      addVisualParticle('+20 ✨ Блестяшек', '#facc15', 1.8);
    }
  },
  // 3. Полный уход
  {
    id: 'care',
    icon: '💖',
    titleKey: 'tutorial.step3Title',
    descKey: 'tutorial.step3Desc',
    rewardKey: 'tutorial.step3Reward',
    doneKey: 'tutorial.step3Done',
    beaconSelector: '#btnWash',
    check: () => {
      const w = GAME.tutorialCareDone?.wash || washCount > 0 || GAME.clean >= 95;
      const f = GAME.tutorialCareDone?.feed || feedCount > 0 || GAME.hunger >= 95;
      const tk = GAME.tutorialCareDone?.tickle || (GAME.tickleCount || 0) > 0 || (GAME.comboHeat || 0) >= 5;
      return Boolean(w && f && tk);
    },
    progress: () => {
      const w = GAME.tutorialCareDone?.wash || washCount > 0 || GAME.clean >= 95;
      const f = GAME.tutorialCareDone?.feed || feedCount > 0 || GAME.hunger >= 95;
      const tk = GAME.tutorialCareDone?.tickle || (GAME.tickleCount || 0) > 0 || (GAME.comboHeat || 0) >= 5;
      const n = (w ? 1 : 0) + (f ? 1 : 0) + (tk ? 1 : 0);
      return { current: n, max: 3, label: `Уход: ${n} / 3` };
    },
    guide: () => {
      if (!GAME.tutorialCareDone?.wash && washCount <= 0 && GAME.clean < 95) {
        washPet();
      } else if (!GAME.tutorialCareDone?.feed && feedCount <= 0 && GAME.hunger < 95) {
        feedPet();
      } else {
        ticklePet();
      }
      updateHUD();
    },
    claim: () => {
      GAME.sparkles = (GAME.sparkles || 0) + 10;
      addVisualParticle('+10 ✨ Блестяшек', '#facc15', 1.8);
    }
  },
  // 4. Оружие силы
  {
    id: 'knife',
    icon: '🗡️',
    titleKey: 'tutorial.step4Title',
    descKey: 'tutorial.step4Desc',
    rewardKey: 'tutorial.step4Reward',
    doneKey: 'tutorial.step4Done',
    beaconSelector: (GAME.unlockedKnives || []).length > 0 ? '#btnOpenCharacterInventory' : '.dash-tab[data-target="panelCases"]',
    check: () => Boolean(GAME.equippedKnife),
    progress: () => {
      const cur = GAME.equippedKnife ? 1 : 0;
      return { current: cur, max: 1, label: `Нож: ${cur} / 1` };
    },
    guide: () => {
      if ((GAME.unlockedKnives || []).length > 0) {
        const res = equipBestKnife();
        if (res.success) {
          updateHUD();
          renderCasesSystem();
          renderCharacterInventory();
        } else {
          openCharacterInventoryModal('knives');
        }
      } else {
        const tab = document.querySelector('.dash-tab[data-target="panelCases"]');
        if (tab) tab.click();
      }
    },
    claim: () => {
      GAME.sparkles = (GAME.sparkles || 0) + 20;
      addVisualParticle('+20 ✨ Блестяшек', '#facc15', 1.8);
    }
  },
  // 5. Острая заточка
  {
    id: 'sharpen',
    icon: '✨',
    titleKey: 'tutorial.step5Title',
    descKey: 'tutorial.step5Desc',
    rewardKey: 'tutorial.step5Reward',
    doneKey: 'tutorial.step5Done',
    beaconSelector: '#btnOpenCharacterInventory',
    check: () => Object.values(GAME.knifeStars || {}).some(s => s > 1),
    progress: () => {
      const has = Object.values(GAME.knifeStars || {}).some(s => s > 1);
      return { current: has ? 1 : 0, max: 1, label: `Заточка: ${has ? 1 : 0} / 1` };
    },
    guide: () => {
      if (GAME.equippedKnife && (GAME.sparkles || 0) >= 25) {
        const res = sharpenKnife(GAME.equippedKnife);
        if (res.success) {
          updateHUD();
          renderCharacterInventory();
          return;
        }
      }
      openCharacterInventoryModal('knives');
    },
    claim: () => {
      GAME.tutorialTempBoostUntil = Date.now() + 5 * 60 * 1000;
      addVisualParticle('+50% биомассы на 5 мин ⚡', '#f59e0b', 1.8);
    }
  },
  // 6. Стильный прикид
  {
    id: 'hat',
    icon: '🧢',
    titleKey: 'tutorial.step6Title',
    descKey: 'tutorial.step6Desc',
    rewardKey: 'tutorial.step6Reward',
    doneKey: 'tutorial.step6Done',
    beaconSelector: '#btnOpenCharacterInventory',
    check: () => Boolean(GAME.equippedHat) || SHOP_ITEMS.some(i => i.type === 'hat' && i.owned),
    progress: () => {
      const has = Boolean(GAME.equippedHat) || SHOP_ITEMS.some(i => i.type === 'hat' && i.owned);
      return { current: has ? 1 : 0, max: 1, label: `Шапка: ${has ? 1 : 0} / 1` };
    },
    guide: () => {
      const cap = SHOP_ITEMS.find(i => i.id === 'hat_cap');
      if (cap && !cap.owned && (GAME.sparkles || 0) >= cap.cost) {
        GAME.sparkles -= cap.cost;
        cap.owned = true;
        GAME.equippedHat = 'hat_cap';
        updateHUD();
        renderCharacterInventory();
      } else {
        openCharacterInventoryModal('hats');
      }
    },
    claim: () => {
      GAME.tutorialCritBonus = (GAME.tutorialCritBonus || 0) + 0.02;
      addVisualParticle('+2% к шансу крита 🎯', '#ec4899', 1.8);
    }
  },
  // 7. Броня кликера
  {
    id: 'skin',
    icon: '👕',
    titleKey: 'tutorial.step7Title',
    descKey: 'tutorial.step7Desc',
    rewardKey: 'tutorial.step7Reward',
    doneKey: 'tutorial.step7Done',
    beaconSelector: '#btnOpenCharacterInventory',
    check: () => Boolean(GAME.equippedSkin && GAME.equippedSkin !== 'default' && GAME.equippedSkin !== 'skin_default') || (Array.isArray(GAME.ownedSkins) && GAME.ownedSkins.some(s => s !== 'default' && s !== 'skin_default')),
    progress: () => {
      const has = Boolean(GAME.equippedSkin && GAME.equippedSkin !== 'default' && GAME.equippedSkin !== 'skin_default') || (Array.isArray(GAME.ownedSkins) && GAME.ownedSkins.some(s => s !== 'default' && s !== 'skin_default'));
      return { current: has ? 1 : 0, max: 1, label: `Одежда: ${has ? 1 : 0} / 1` };
    },
    guide: () => {
      openCharacterInventoryModal('skins');
    },
    claim: () => {
      triggerForcedMeteor();
      addVisualParticle('Золотой Метеорит призван! ☄️', '#fbbf24', 2.0);
    }
  },
  // 8. Большой Смыв
  {
    id: 'flush',
    icon: '🌀',
    titleKey: 'tutorial.step8Title',
    descKey: 'tutorial.step8Desc',
    rewardKey: 'tutorial.step8Reward',
    doneKey: 'tutorial.step8Done',
    beaconSelector: '#btnCanvasPrestige',
    check: () => (GAME.flushCount || GAME.totalPrestiges || 0) > 0,
    progress: () => {
      const cur = (GAME.flushCount || GAME.totalPrestiges || 0) > 0 ? 1 : 0;
      return { current: cur, max: 1, label: `Смывы: ${cur} / 1` };
    },
    guide: () => {
      openPrestigeModal();
    },
    claim: () => {
      GAME.prestigeRolls = (GAME.prestigeRolls || 0) + 5;
      addVisualParticle('+5 Втулок 🧻 + Таланты', '#a78bfa', 1.8);
    }
  },
  // 9. Скрытые Таланты
  {
    id: 'talent',
    icon: '🌟',
    titleKey: 'tutorial.step9Title',
    descKey: 'tutorial.step9Desc',
    rewardKey: 'tutorial.step9Reward',
    doneKey: 'tutorial.step9Done',
    beaconSelector: '.dash-tab[data-target="panelTalents"]',
    check: () => TALENTS.some(t => (t.level || 0) > 0),
    progress: () => {
      const cur = TALENTS.some(t => (t.level || 0) > 0) ? 1 : 0;
      return { current: cur, max: 1, label: `Таланты: ${cur} / 1` };
    },
    guide: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelTalents"]');
      if (tab) tab.click();
    },
    claim: () => {
      GAME.tutorialClickBonus = (GAME.tutorialClickBonus || 0) + 0.10;
      addVisualParticle('+10% к силе клика 💥', '#f43f5e', 1.8);
    }
  },
  // 10. Великий Прорыв
  {
    id: 'breakthrough',
    icon: '🌌',
    titleKey: 'tutorial.step10Title',
    descKey: 'tutorial.step10Desc',
    rewardKey: 'tutorial.step10Reward',
    doneKey: 'tutorial.step10Done',
    beaconSelector: '#btnCanvasTranscend',
    check: () => (GAME.breakthroughCount || GAME.totalTranscend || 0) > 0,
    progress: () => {
      const cur = (GAME.breakthroughCount || GAME.totalTranscend || 0) > 0 ? 1 : 0;
      return { current: cur, max: 1, label: `Прорывы: ${cur} / 1` };
    },
    guide: () => {
      openTranscendModal();
    },
    claim: () => {
      GAME.transcendPlungers = (GAME.transcendPlungers || 0) + 1;
      addVisualParticle('+1 Вантуз 🪠 + Реликвии & Гильдии', '#38bdf8', 1.8);
    }
  },
  // 11. Древняя сила
  {
    id: 'relic',
    icon: '👑',
    titleKey: 'tutorial.step11Title',
    descKey: 'tutorial.step11Desc',
    rewardKey: 'tutorial.step11Reward',
    doneKey: 'tutorial.step11Done',
    beaconSelector: '.dash-tab[data-target="panelTalents"]',
    check: () => Object.values(GAME.transcendUpgrades || {}).some(v => typeof v === 'boolean' ? v : v > 0),
    progress: () => {
      const has = Object.values(GAME.transcendUpgrades || {}).some(v => typeof v === 'boolean' ? v : v > 0);
      return { current: has ? 1 : 0, max: 1, label: `Реликвии: ${has ? 1 : 0} / 1` };
    },
    guide: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelTalents"]');
      if (tab) tab.click();
      switchTalentSubTab('transcend');
    },
    claim: () => {
      GAME.tutorialIncomeMult = (GAME.tutorialIncomeMult || 1) * 2;
      addVisualParticle('Глобальный доход x2 👑', '#facc15', 2.0);
    }
  },
  // 12. Рейдовый призыв
  {
    id: 'guildTicket',
    icon: '🎫',
    titleKey: 'tutorial.step12Title',
    descKey: 'tutorial.step12Desc',
    rewardKey: 'tutorial.step12Reward',
    doneKey: 'tutorial.step12Done',
    beaconSelector: '#btnGuildNav',
    check: () => (GAME.guildTicketsContributed || 0) > 0 || GAME.tutorialRaidDone === true,
    progress: () => {
      const cur = ((GAME.guildTicketsContributed || 0) > 0 || GAME.tutorialRaidDone === true) ? 1 : 0;
      return { current: cur, max: 1, label: `Вклад: ${cur} / 1` };
    },
    guide: () => {
      const btn = document.getElementById('btnGuildNav');
      if (btn) btn.click();
    },
    claim: () => {
      GAME.tutorialCompleted = true;
      showTriumphModal();
    }
  }
];

let isListExpanded = false;
let currentBeaconEl = null;

export function showTriumphModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('tutorialTriumphModal');
  if (modal) {
    modal.classList.remove('hidden');
    addVisualParticle('Вы готовы к бесконечности! 🌌', '#22c55e', 2.2);
    const closeBtn = document.getElementById('btnTriumphClose');
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.classList.add('hidden');
        updateBeginnerGuide();
      };
    }
  }
}

export function getCurrentTutorialStepIndex() {
  if (GAME.tutorialCompleted) return BEGINNER_STEPS.length;
  const idx = Math.max(0, Math.min(BEGINNER_STEPS.length - 1, Number(GAME.tutorialStepIndex) || 0));
  return idx;
}

export function isBeginnerGuideComplete() {
  return Boolean(GAME.tutorialCompleted) || (Number(GAME.tutorialStepIndex) >= BEGINNER_STEPS.length);
}

export function getNextBeginnerStep() {
  if (isBeginnerGuideComplete()) return null;
  const idx = getCurrentTutorialStepIndex();
  const step = BEGINNER_STEPS[idx];
  if (!step) return null;
  return {
    ...step,
    action: () => {
      if (step.check()) {
        step.claim();
        GAME.tutorialStepIndex = idx + 1;
        if (GAME.tutorialStepIndex >= BEGINNER_STEPS.length) {
          GAME.tutorialCompleted = true;
          showTriumphModal();
        }
        updateHUD();
        saveLocal();
        updateBeginnerGuide();
      } else {
        step.guide();
        updateBeginnerGuide();
      }
    }
  };
}

export function getBeginnerGuideProgress() {
  const completed = Math.min(BEGINNER_STEPS.length, Number(GAME.tutorialStepIndex) || 0);
  return {
    completed,
    total: BEGINNER_STEPS.length,
    isComplete: isBeginnerGuideComplete()
  };
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

  if (isBeginnerGuideComplete()) {
    container.classList.add('hidden');
    updateBeacon(null);
    return;
  }

  container.classList.remove('hidden');

  const stepIdx = getCurrentTutorialStepIndex();
  const currentStep = BEGINNER_STEPS[stepIdx];
  if (!currentStep) {
    container.classList.add('hidden');
    return;
  }

  const isStepDone = currentStep.check();
  const prog = currentStep.progress();

  // Update visual beacon
  updateBeacon(currentStep);

  // Render main bar content
  const iconEl = document.getElementById('beginnerStepIcon');
  const titleEl = document.getElementById('beginnerStepTitle');
  const badgeEl = document.getElementById('beginnerProgressBadge');
  const fillEl = document.getElementById('beginnerProgressFill');
  const actionBtn = document.getElementById('beginnerActionBtn');
  const listDrawer = document.getElementById('beginnerListDrawer');

  if (iconEl) iconEl.textContent = currentStep.icon;
  if (badgeEl) badgeEl.textContent = `${stepIdx + 1} / ${BEGINNER_STEPS.length}`;

  const pct = Math.min(100, Math.max(0, (prog.current / prog.max) * 100));
  if (fillEl) fillEl.style.width = `${pct}%`;

  if (titleEl) {
    const statusColor = isStepDone ? 'text-emerald-400 font-extrabold' : 'text-stone-100 font-bold';
    titleEl.innerHTML = `
      <span class="${statusColor}">${stepIdx + 1}. ${t(currentStep.titleKey)}</span>
      <span class="text-emerald-300 font-mono text-[11px] ml-1.5 font-bold">[${prog.label}]</span>
      <span class="text-stone-400 text-[10.5px] ml-1.5 hidden sm:inline">(${t(currentStep.rewardKey)})</span>
    `;
  }

  if (actionBtn) {
    actionBtn.classList.remove('hidden');
    if (isStepDone) {
      actionBtn.textContent = t('tutorial.claimBtn') || 'Забрать 🎁';
      actionBtn.className = 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-110 text-stone-950 font-game text-[10px] font-black px-3 py-1 rounded-xl shadow-lg border-2 border-yellow-200 animate-pulse jelly-btn transition';
      actionBtn.onclick = () => {
        currentStep.claim();
        GAME.tutorialStepIndex = stepIdx + 1;
        if (GAME.tutorialStepIndex >= BEGINNER_STEPS.length) {
          GAME.tutorialCompleted = true;
          showTriumphModal();
        }
        updateHUD();
        saveLocal();
        updateBeginnerGuide();
      };
    } else {
      actionBtn.textContent = t('tutorial.actionBtn') || 'Выполнить ⚡';
      actionBtn.className = 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-stone-950 font-game text-[9.5px] font-black px-2.5 py-0.5 rounded-lg shadow border border-emerald-300 jelly-btn transition';
      actionBtn.onclick = () => {
        currentStep.guide();
        updateBeginnerGuide();
      };
    }
  }

  // Render list drawer if expanded
  if (listDrawer) {
    if (isListExpanded) {
      listDrawer.classList.remove('hidden');
      renderListDrawer(listDrawer, stepIdx);
    } else {
      listDrawer.classList.add('hidden');
    }
  }
}

function renderListDrawer(drawerEl, activeStepIdx) {
  drawerEl.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2.5';

  BEGINNER_STEPS.forEach((step, idx) => {
    const isPast = idx < activeStepIdx;
    const isCurrent = idx === activeStepIdx;
    const isDone = step.check();
    const prog = step.progress();

    const item = document.createElement('div');
    const borderStyle = isCurrent
      ? (isDone ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/30' : 'bg-stone-900 border-emerald-500/60 ring-1 ring-emerald-500/20')
      : (isPast ? 'bg-emerald-950/40 border-emerald-500/30 opacity-75' : 'bg-stone-950 border-stone-800 opacity-60');

    item.className = `p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${borderStyle}`;

    const iconShow = isPast ? '✅' : (isDone ? '🎁' : step.icon);
    const titleClass = isPast ? 'line-through text-stone-400' : (isCurrent ? 'text-amber-200 font-black' : 'text-stone-300');

    item.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-lg shrink-0">${iconShow}</span>
        <div class="min-w-0">
          <div class="truncate text-[11px] ${titleClass}">
            ${idx + 1}. ${t(step.titleKey)}
          </div>
          <div class="text-[9.5px] text-stone-400 truncate">${prog.label} · ${t(step.rewardKey)}</div>
        </div>
      </div>
      <div class="shrink-0">
        ${
          isPast
            ? '<span class="text-[10px] text-emerald-400 font-bold">Готово</span>'
            : (isCurrent && isDone
                ? `<button class="drawer-claim-btn px-2.5 py-1 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-stone-950 font-black text-[10px] hover:brightness-110 shadow jelly-btn animate-pulse">
                    Забрать
                  </button>`
                : (isCurrent
                    ? `<button class="drawer-guide-btn px-2 py-0.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-black text-[9px] hover:brightness-110 shadow jelly-btn">
                        Перейти
                      </button>`
                    : '<span class="text-[9.5px] text-stone-500 font-bold">Закрыто</span>'
                  )
              )
        }
      </div>
    `;

    if (isCurrent && isDone) {
      item.querySelector('.drawer-claim-btn')?.addEventListener('click', () => {
        step.claim();
        GAME.tutorialStepIndex = activeStepIdx + 1;
        if (GAME.tutorialStepIndex >= BEGINNER_STEPS.length) {
          GAME.tutorialCompleted = true;
          showTriumphModal();
        }
        updateHUD();
        saveLocal();
        updateBeginnerGuide();
      });
    } else if (isCurrent && !isDone) {
      item.querySelector('.drawer-guide-btn')?.addEventListener('click', () => {
        step.guide();
        updateBeginnerGuide();
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

  const triumphClose = document.getElementById('btnTriumphClose');
  if (triumphClose) {
    triumphClose.addEventListener('click', () => {
      const modal = document.getElementById('tutorialTriumphModal');
      if (modal) modal.classList.add('hidden');
      updateBeginnerGuide();
    });
  }

  onLocaleChange(() => {
    updateBeginnerGuide();
  });
}
