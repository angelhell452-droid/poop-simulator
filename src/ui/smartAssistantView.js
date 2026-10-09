import { GAME } from '../core/state.js?v=5.0.80';
import { FACTORIES } from '../data/factories.data.js?v=5.0.80';
import { buyFactory } from '../systems/factoryService.js?v=5.0.80';
import { getAffordableFactoryInfo } from '../economy/costs.js?v=5.0.80';
import { getBestKnife, equipBestKnife } from '../systems/knifeService.js';
import { feedPet, washPet } from '../systems/petCareService.js';
import { getPrestigeRollsReward } from '../prestige/prestigeService.js?v=5.0.80';
import { WEAPON_CASES } from '../data/cases.data.js?v=5.0.80';
import { peakForm, isCasesUnlocked } from '../progression/unlocks.js?v=5.0.80';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { gte } from '../utils/big.js?v=5.0.80';
import { updateHUD } from './hudView.js?v=5.0.80';
import { renderCasesSystem, FIRST_CASE_ID, isFirstCaseDiscountAvailable, canAffordCase } from './casesView.js?v=5.0.80';
import { renderCharacterInventory } from './characterInventoryView.js?v=5.0.80';
import { t, onLocaleChange } from '../i18n/t.js';
import { factoryName, knifeName, caseName } from '../i18n/localize.js';
import { getNextBeginnerStep, isBeginnerGuideComplete } from './beginnerGuideView.js';

let lastHintAction = null;

export function updateSmartAssistant() {
  const container = document.getElementById('smartHintBanner');
  if (!container) return;

  const hint = determineBestHint();
  if (!hint) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');

  const textEl = document.getElementById('smartHintText');
  const btnEl = document.getElementById('smartHintBtn');
  const iconEl = document.getElementById('smartHintIcon');

  if (iconEl) iconEl.textContent = hint.icon;
  if (textEl) textEl.innerHTML = hint.text;
  if (btnEl) {
    btnEl.textContent = hint.btnText;
    lastHintAction = hint.action;
  }
}

export function initSmartAssistantListeners() {
  onLocaleChange(() => updateSmartAssistant());
  const btnEl = document.getElementById('smartHintBtn');
  if (btnEl) {
    btnEl.addEventListener('click', () => {
      if (typeof lastHintAction === 'function') {
        lastHintAction();
      }
    });
  }
}

function determineBestHint() {
  // 1. Critical Need: Hunger < 35%
  if (GAME.hunger < 35) {
    return {
      icon: '🍕',
      text: t('assist.hungry', { n: formatNumber(50) }),
      btnText: t('assist.feedBtn'),
      action: () => {
        feedPet();
        updateHUD();
        addVisualParticle(t('assist.fedParticle'), '#f97316');
      }
    };
  }

  // 2. Critical Need: Clean < 35%
  if (GAME.clean < 35) {
    return {
      icon: '🧼',
      text: t('assist.dirty', { n: formatNumber(40) }),
      btnText: t('assist.washBtn'),
      action: () => {
        washPet();
        updateHUD();
      }
    };
  }

  // 3. Beginner Steps Guidance (Top Priority for New Players)
  if (!isBeginnerGuideComplete()) {
    const nextBeginner = getNextBeginnerStep();
    if (nextBeginner) {
      return {
        icon: nextBeginner.icon,
        text: `<span class="text-amber-400 font-bold">${t('tutorial.bannerTitle')}:</span> ${t(nextBeginner.titleKey)} <span class="text-stone-400 font-normal">(${t(nextBeginner.rewardKey)})</span>`,
        btnText: t('tutorial.actionBtn'),
        action: () => {
          nextBeginner.action();
        }
      };
    }
  }

  // 4. New Factory Available (Zero count unlocked factory affordable!)
  for (let i = 0; i < FACTORIES.length; i++) {
    const fac = FACTORIES[i];
    const unlocked = fac.reqStage === undefined || GAME.evoStage >= fac.reqStage;
    if (unlocked && (!fac.count || fac.count === 0)) {
      const info = getAffordableFactoryInfo(fac);
      if (info.canBuy && info.count > 0) {
        return {
          icon: '🏭',
          text: t('assist.newFactory', { name: factoryName(fac), n: formatNumber(fac.baseCps) }),
          btnText: t('assist.buyBtn'),
          action: () => {
            if (buyFactory(fac.id)) {
              updateHUD();
              addVisualParticle(t('assist.factoryOpened', { name: factoryName(fac) }), '#22c55e');
            }
          }
        };
      }
    }
  }

  // 4. Stronger Knife available in inventory
  const bestKnife = getBestKnife();
  if (bestKnife && bestKnife.id !== GAME.equippedKnife) {
    return {
      icon: '⚔️',
      text: t('assist.bestKnife', { name: knifeName(bestKnife) }),
      btnText: t('assist.equipBtn'),
      action: () => {
        const res = equipBestKnife();
        if (res.success) {
          updateHUD();
          renderCasesSystem();
          renderCharacterInventory();
          addVisualParticle(t('assist.equipped', { name: knifeName(bestKnife) }), '#facc15');
        }
      }
    };
  }

  // 6. Good Flush Opportunity (Gain >= 25 rolls and accumulated cycle biomass)
  const rollsGain = getPrestigeRollsReward();
  if (rollsGain >= 25 && gte(GAME.cycleBiomass || 0, 300000)) {
    return {
      icon: '🌀',
      text: t('assist.flushReady', { n: formatNumber(rollsGain) }),
      btnText: t('assist.flushBtn'),
      action: () => {
        document.getElementById('btnCanvasPrestige')?.click();
      }
    };
  }

  // 7. Affordable CS:GO Case
  if (isCasesUnlocked()) {
    const firstCase = WEAPON_CASES.find(c => c.id === FIRST_CASE_ID);
    if (firstCase && isFirstCaseDiscountAvailable(firstCase) && canAffordCase(firstCase, 1)) {
      return {
        icon: '🎁',
        text: t('assist.firstCaseAffordable', { name: caseName(firstCase) }),
        btnText: t('assist.openFirstCaseBtn'),
        action: () => {
          const tabBtn = document.querySelector('.dash-tab[data-target="panelCases"]');
          if (tabBtn) tabBtn.click();
        }
      };
    }

    for (let c of WEAPON_CASES) {
      const meetsEpoch = peakForm() >= (c.reqForm || 1);
      if (meetsEpoch && canAffordCase(c, 1)) {
        return {
          icon: '📦',
          text: t('assist.caseAffordable', { name: caseName(c) }),
          btnText: t('assist.casesBtn'),
          action: () => {
            const tabBtn = document.querySelector('.dash-tab[data-target="panelCases"]');
            if (tabBtn) tabBtn.click();
          }
        };
      }
    }
  }

  // 8. General Encouraging Hint
  return {
    icon: '💡',
    text: t('assist.generalTip', { n: formatNumber(100), x: formatNumber(10) }),
    btnText: t('assist.guideBtn'),
    action: () => {
      document.getElementById('btnGuideModal')?.click();
    }
  };
}
