import { GAME } from '../core/state.js?v=5.0.79';
import { FACTORIES } from '../data/factories.data.js?v=5.0.79';
import { buyFactory } from '../systems/factoryService.js?v=5.0.79';
import { getAffordableFactoryInfo } from '../economy/costs.js?v=5.0.79';
import { getBestKnife, equipBestKnife } from '../systems/knifeService.js';
import { feedPet, washPet } from '../systems/petCareService.js';
import { getPrestigeRollsReward } from '../prestige/prestigeService.js?v=5.0.79';
import { WEAPON_CASES } from '../data/cases.data.js?v=5.0.79';
import { peakForm } from '../progression/unlocks.js?v=5.0.79';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.79';
import { gte } from '../utils/big.js?v=5.0.79';
import { updateHUD } from './hudView.js?v=5.0.79';
import { renderCasesSystem } from './casesView.js?v=5.0.79';
import { renderCharacterInventory } from './characterInventoryView.js?v=5.0.79';
import { addVisualParticle } from './petCanvasView.js?v=5.0.79';
import { t, onLocaleChange } from '../i18n/t.js';
import { factoryName, knifeName, caseName } from '../i18n/localize.js';

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
        addVisualParticle(t('assist.washedParticle'), '#38bdf8');
      }
    };
  }

  // 3. New Factory Available (Zero count unlocked factory affordable!)
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
  for (let c of WEAPON_CASES) {
    const meetsEpoch = peakForm() >= (c.reqForm || 1);
    if (meetsEpoch) {
      const hasCur = (GAME.prestigeRolls || 0) >= (c.cost || 0) && (GAME.transcendPlungers || 0) >= (c.costPlungers || 0);
      if (hasCur) {
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
