import { GAME } from '../core/state.js?v=5.0.30';
import { FACTORIES } from '../data/factories.data.js?v=5.0.30';
import { buyFactory } from '../systems/factoryService.js?v=5.0.30';
import { getAffordableFactoryInfo } from '../economy/costs.js?v=5.0.30';
import { getBestKnife, equipBestKnife } from '../systems/knifeService.js';
import { feedPet, washPet } from '../systems/petCareService.js';
import { getPrestigeRollsReward } from '../prestige/prestigeService.js?v=5.0.30';
import { WEAPON_CASES } from '../data/cases.data.js';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.30';
import { gte } from '../utils/big.js?v=5.0.30';
import { updateHUD } from './hudView.js?v=5.0.30';
import { renderCasesSystem } from './casesView.js?v=5.0.30';
import { renderCharacterInventory } from './characterInventoryView.js?v=5.0.30';
import { addVisualParticle } from './petCanvasView.js?v=5.0.30';

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
      text: 'Какашич очень голоден! Покормите его, чтобы вернуть <b>+50% к клику</b>!',
      btnText: 'Покормить 🍕',
      action: () => {
        feedPet();
        updateHUD();
        addVisualParticle('🍕 ВКУСНО! +Сытость', '#f97316');
      }
    };
  }

  // 2. Critical Need: Clean < 35%
  if (GAME.clean < 35) {
    return {
      icon: '🧼',
      text: 'Какашич испачкался! Помойте его для возврата <b>+40% к доходу заводов</b>!',
      btnText: 'Помыть 🧼',
      action: () => {
        washPet();
        updateHUD();
        addVisualParticle('🧼 СВЕЖЕСТЬ! +Чистота', '#38bdf8');
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
          text: `Откройте новый завод <b>«${fac.name}»</b> (+${formatNumber(fac.baseCps)}/сек)!`,
          btnText: 'Купить 🏭',
          action: () => {
            if (buyFactory(fac.id)) {
              updateHUD();
              addVisualParticle(`🏭 Завод «${fac.name}» открыт!`, '#22c55e');
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
      text: `В инвентаре найден мощный нож: <b>«${bestKnife.name}»</b>!`,
      btnText: 'Надеть ⚔️',
      action: () => {
        const res = equipBestKnife();
        if (res.success) {
          updateHUD();
          renderCasesSystem();
          renderCharacterInventory();
          addVisualParticle(`⚔️ Экипирован: ${bestKnife.name}!`, '#facc15');
        }
      }
    };
  }

  // 6. Good Flush Opportunity (Gain >= 25 rolls and accumulated cycle biomass)
  const rollsGain = getPrestigeRollsReward();
  if (rollsGain >= 25 && gte(GAME.cycleBiomass || 0, 300000)) {
    return {
      icon: '🌀',
      text: `За Смыв Судьбы доступно <b>+${formatNumber(rollsGain)} 🧻 Втулок</b>! Пора совершить Смыв!`,
      btnText: 'Смыв 🌀',
      action: () => {
        document.getElementById('btnCanvasPrestige')?.click();
      }
    };
  }

  // 7. Affordable CS:GO Case
  for (let c of WEAPON_CASES) {
    const meetsP = !c.reqPrestiges || (GAME.totalPrestiges || 0) >= c.reqPrestiges;
    const meetsT = !c.reqTranscend || (GAME.totalTranscend || 0) >= c.reqTranscend;
    if (meetsP && meetsT) {
      const hasCur = c.currency === 'rolls' ? GAME.prestigeRolls >= c.cost : (GAME.transcendPlungers || 0) >= c.cost;
      if (hasCur) {
        return {
          icon: '📦',
          text: `Хватает валюты на <b>«${c.name}»</b>! Испытайте удачу и выбейте редкий клинок!`,
          btnText: 'К кейсам 🎰',
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
    text: 'Кликайте по персонажу, заполняйте Комбо-шкалу до 100% для <b>Турбо x10</b>!',
    btnText: 'Гид 📖',
    action: () => {
      document.getElementById('btnGuideModal')?.click();
    }
  };
}
