import { GAME, feedCount, washCount } from '../core/state.js?v=5.0.80';
import { FACTORIES } from '../data/factories.data.js?v=5.0.80';
import { TALENTS } from '../data/talents.data.js';
import { PERMANENT_PERKS, hasPerk } from '../data/perks.data.js';
import { RELICS, hasRelic } from '../data/relics.data.js';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { gainBio } from '../utils/big.js?v=5.0.80';
import { saveLocal } from '../save/saveManager.js?v=5.0.80';
import { updateHUD } from './hudView.js?v=5.0.80';
import { addVisualParticle, triggerForcedMeteor } from './petCanvasView.js?v=5.0.80';
import { openCharacterInventoryModal } from './characterInventoryView.js?v=5.0.80';
import { openPrestigeModal, openTranscendModal } from './modalManager.js?v=5.0.80';
import { switchTalentSubTab } from './talentView.js?v=5.0.80';
import { t, onLocaleChange } from '../i18n/t.js';

let activeSpotlightElement = null;
let isSpotlightActive = false;

export const TUTORIAL_QUESTS = [
  // 1. Первая слизь
  {
    id: 'first_slime',
    num: 1,
    icon: '👆',
    titleKey: 'tutorial.step1Title',
    fallbackTitle: 'Первая слизь',
    rewardDesc: '+300 💨',
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
    claim: (silent = false) => {
      GAME.biomass = gainBio(GAME.biomass, 300);
      if (!silent) addVisualParticle('+300 биомассы', '#34d399', 1.8);
    }
  },

  // 2. Автоматизация
  {
    id: 'automation',
    num: 2,
    icon: '🏭',
    titleKey: 'tutorial.step2Title',
    fallbackTitle: 'Автоматизация',
    rewardDesc: '+20 ✨',
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
    claim: (silent = false) => {
      GAME.sparkles = (GAME.sparkles || 0) + 20;
      if (!silent) addVisualParticle('+20 Блестяшек ✨', '#fbbf24', 1.8);
    }
  },

  // 3. Полный уход
  {
    id: 'full_care',
    num: 3,
    icon: '🧼',
    titleKey: 'tutorial.step3Title',
    fallbackTitle: 'Полный уход',
    rewardDesc: '+10 ✨',
    beaconSelector: '#petNeedsStation',
    check: () => {
      const w = GAME.tutorialCareDone?.wash || washCount > 0 || (GAME.clean || 0) >= 90;
      const f = GAME.tutorialCareDone?.feed || feedCount > 0 || (GAME.hunger || 0) >= 90;
      const tk = GAME.tutorialCareDone?.tickle || (GAME.tickleCount || 0) > 0 || (GAME.comboHeat || 0) >= 5;
      return w && f && tk;
    },
    progress: () => {
      const w = GAME.tutorialCareDone?.wash || washCount > 0 || (GAME.clean || 0) >= 90;
      const f = GAME.tutorialCareDone?.feed || feedCount > 0 || (GAME.hunger || 0) >= 90;
      const tk = GAME.tutorialCareDone?.tickle || (GAME.tickleCount || 0) > 0 || (GAME.comboHeat || 0) >= 5;
      const doneCount = (w ? 1 : 0) + (f ? 1 : 0) + (tk ? 1 : 0);
      return { current: doneCount, max: 3, label: `Уход: ${doneCount} / 3` };
    },
    guide: () => {
      const el = document.getElementById('petNeedsStation');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    claim: (silent = false) => {
      GAME.sparkles = (GAME.sparkles || 0) + 10;
      if (!silent) addVisualParticle('+10 Блестяшек ✨', '#fbbf24', 1.8);
    }
  },

  // 4. Включить пулемет
  {
    id: 'machine_gun',
    num: 4,
    icon: '⚡',
    titleKey: 'tutorial.step4Title',
    fallbackTitle: 'Включить пулемет',
    rewardDesc: 'Турбо-х4',
    beaconSelector: '#btnToggleAutoclicker',
    check: () => GAME.autoclickerActive === true || (GAME.turboCount || 0) > 0 || GAME.turboUnlocked === true,
    progress: () => {
      const on = GAME.autoclickerActive || (GAME.turboCount || 0) > 0 || GAME.turboUnlocked;
      return { current: on ? 1 : 0, max: 1, label: `Автокликер: ${on ? 'ВКЛ' : 'ВЫКЛ'}` };
    },
    guide: () => {
      const btn = document.getElementById('btnToggleAutoclicker');
      if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    claim: (silent = false) => {
      GAME.turboUnlocked = true;
      GAME.turboRushTime = Math.max(12, GAME.turboRushTime || 0);
      GAME.comboHeat = 100;
      if (!silent) addVisualParticle('Турбо-х4 Режим!', '#ef4444', 2.0);
    }
  },

  // 5. Первый сундук
  {
    id: 'first_chest',
    num: 5,
    icon: '📦',
    titleKey: 'tutorial.step5Title',
    fallbackTitle: 'Первый сундук',
    rewardDesc: '+20 ✨',
    beaconSelector: '.dash-tab[data-target="panelCases"]',
    check: () => (GAME.casesOpened || 0) >= 1 || (Array.isArray(GAME.unlockedKnives) && GAME.unlockedKnives.length > 0),
    progress: () => {
      const cur = Math.min(1, GAME.casesOpened || (GAME.unlockedKnives?.length ? 1 : 0));
      return { current: cur, max: 1, label: `Кейсы: ${formatNumber(cur)} / 1` };
    },
    guide: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelCases"]');
      if (tab) tab.click();
    },
    claim: (silent = false) => {
      GAME.sparkles = (GAME.sparkles || 0) + 20;
      if (!silent) addVisualParticle('+20 Блестяшек ✨', '#fbbf24', 1.8);
    }
  },

  // 6. Стальной хват
  {
    id: 'steel_grip',
    num: 6,
    icon: '🗡️',
    titleKey: 'tutorial.step6Title',
    fallbackTitle: 'Стальной хват',
    rewardDesc: 'CPS Ножа',
    beaconSelector: '#btnCanvasInventory',
    check: () => Boolean(GAME.equippedKnife),
    progress: () => {
      const on = Boolean(GAME.equippedKnife);
      return { current: on ? 1 : 0, max: 1, label: `Нож: ${on ? 'Надет' : 'Не надет'}` };
    },
    guide: () => {
      openCharacterInventoryModal();
    },
    claim: (silent = false) => {
      if (!silent) addVisualParticle('Нож экипирован! CPS активирован', '#38bdf8', 1.8);
    }
  },

  // 7. Закалка стали
  {
    id: 'steel_temper',
    num: 7,
    icon: '⭐',
    titleKey: 'tutorial.step7Title',
    fallbackTitle: 'Закалка стали',
    rewardDesc: '+50% биомассы на 5 мин',
    beaconSelector: '#btnCanvasInventory',
    check: () => Object.values(GAME.knifeStars || {}).some(s => Number(s) >= 2) || (GAME.equippedKnife && Number(GAME.knifeStars?.[GAME.equippedKnife] || 1) >= 2),
    progress: () => {
      const has2 = Object.values(GAME.knifeStars || {}).some(s => Number(s) >= 2) || (GAME.equippedKnife && Number(GAME.knifeStars?.[GAME.equippedKnife] || 1) >= 2);
      return { current: has2 ? 1 : 0, max: 1, label: `Заточка: ${has2 ? '★2+' : '★1'}` };
    },
    guide: () => {
      openCharacterInventoryModal();
    },
    claim: (silent = false) => {
      GAME.tutorialTempBoostUntil = Date.now() + 5 * 60 * 1000;
      if (!silent) addVisualParticle('+50% доход на 5 минут!', '#a855f7', 2.0);
    }
  },

  // 8. Стиль и Сила
  {
    id: 'style_and_power',
    num: 8,
    icon: '👑',
    titleKey: 'tutorial.step8Title',
    fallbackTitle: 'Стиль и Сила',
    rewardDesc: '+2% крит',
    beaconSelector: '#btnCanvasInventory',
    check: () => Boolean(GAME.equippedHat) || Object.keys(GAME.hatLevels || {}).length > 0,
    progress: () => {
      const on = Boolean(GAME.equippedHat) || Object.keys(GAME.hatLevels || {}).length > 0;
      return { current: on ? 1 : 0, max: 1, label: `Шапка: ${on ? 'Надета' : '0 / 1'}` };
    },
    guide: () => {
      openCharacterInventoryModal();
      setTimeout(() => {
        document.getElementById('invTabHats')?.click();
      }, 100);
    },
    claim: (silent = false) => {
      GAME.tutorialCritBonus = (GAME.tutorialCritBonus || 0) + 0.02;
      if (!silent) addVisualParticle('+2% крит шанс навсегда!', '#f43f5e', 2.0);
    }
  },

  // 9. Новая кожа
  {
    id: 'new_skin',
    num: 9,
    icon: '🥋',
    titleKey: 'tutorial.step9Title',
    fallbackTitle: 'Новая кожа',
    rewardDesc: '☄️ Метеорит',
    beaconSelector: '#btnCanvasInventory',
    check: () => Boolean(GAME.equippedSkin) || (Array.isArray(GAME.ownedSkins) && GAME.ownedSkins.length > 0),
    progress: () => {
      const on = Boolean(GAME.equippedSkin) || (Array.isArray(GAME.ownedSkins) && GAME.ownedSkins.length > 0);
      return { current: on ? 1 : 0, max: 1, label: `Одежда: ${on ? 'Куплена' : '0 / 1'}` };
    },
    guide: () => {
      openCharacterInventoryModal();
      setTimeout(() => {
        document.getElementById('invTabSkins')?.click();
      }, 100);
    },
    claim: (silent = false) => {
      triggerForcedMeteor();
      if (!silent) addVisualParticle('Метеорит в небе!', '#eab308', 2.0);
    }
  },

  // 10. Поймай звезду
  {
    id: 'catch_star',
    num: 10,
    icon: '☄️',
    titleKey: 'tutorial.step10Title',
    fallbackTitle: 'Поймай звезду',
    rewardDesc: '+50 ✨',
    beaconSelector: '#petCanvas',
    check: () => (GAME.meteorsCaught || 0) >= 1,
    progress: () => {
      const cur = Math.min(1, GAME.meteorsCaught || 0);
      return { current: cur, max: 1, label: `Метеориты: ${formatNumber(cur)} / 1` };
    },
    guide: () => {
      triggerForcedMeteor();
      const el = document.getElementById('petCanvas');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    claim: (silent = false) => {
      GAME.sparkles = (GAME.sparkles || 0) + 50;
      if (!silent) addVisualParticle('+50 Блестяшек ✨', '#fbbf24', 1.8);
    }
  },

  // 11. Промышленный бум
  {
    id: 'industrial_boom',
    num: 11,
    icon: '🚀',
    titleKey: 'tutorial.step11Title',
    fallbackTitle: 'Промышленный бум',
    rewardDesc: '+25% пассив',
    beaconSelector: '.buy-mult-btn[data-mult="max"]',
    check: () => FACTORIES.reduce((s, f) => s + (f.count || 0), 0) >= 50 || (GAME.flushCount || GAME.totalPrestiges || 0) > 0 || (GAME.breakthroughCount || 0) > 0,
    progress: () => {
      const count = FACTORIES.reduce((s, f) => s + (f.count || 0), 0);
      const cur = Math.min(50, count);
      return { current: cur, max: 50, label: `Заводы: ${formatNumber(cur)} / 50` };
    },
    guide: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelFactories"]');
      if (tab) tab.click();
      const btnMax = document.querySelector('.buy-mult-btn[data-mult="max"]');
      if (btnMax) btnMax.click();
    },
    claim: (silent = false) => {
      GAME.tutorialIncomeMult = (GAME.tutorialIncomeMult || 1) * 1.25;
      if (!silent) addVisualParticle('+25% постоянный пассивный доход!', '#10b981', 2.0);
    }
  },

  // 12. Испытание кликом
  {
    id: 'click_trial',
    num: 12,
    icon: '🎯',
    titleKey: 'tutorial.step12Title',
    fallbackTitle: 'Испытание кликом',
    rewardDesc: '+100 ✨',
    beaconSelector: '#btnToggleAutoclicker',
    check: () => (GAME.totalClicks || 0) >= 10000 || (GAME.flushCount || GAME.totalPrestiges || 0) > 0 || (GAME.breakthroughCount || 0) > 0,
    progress: () => {
      const cur = Math.min(10000, GAME.totalClicks || 0);
      return { current: cur, max: 10000, label: `Клики: ${formatNumber(cur)} / 10k` };
    },
    guide: () => {
      if (!GAME.autoclickerActive) {
        document.getElementById('btnToggleAutoclicker')?.click();
      }
    },
    claim: (silent = false) => {
      GAME.sparkles = (GAME.sparkles || 0) + 100;
      if (!silent) addVisualParticle('+100 Блестяшек ✨', '#fbbf24', 2.0);
    }
  },

  // 13. Большой Смыв
  {
    id: 'big_flush',
    num: 13,
    icon: '🌀',
    titleKey: 'tutorial.step13Title',
    fallbackTitle: 'Большой Смыв',
    rewardDesc: '+5 Втулок',
    beaconSelector: '#currencyPrestigeBox',
    check: () => (GAME.flushCount || GAME.totalPrestiges || 0) >= 1 || (GAME.breakthroughCount || GAME.totalTranscend || 0) > 0,
    progress: () => {
      const flushes = (GAME.flushCount || GAME.totalPrestiges || 0);
      const cur = Math.min(1, flushes);
      return { current: cur, max: 1, label: `Смывы: ${formatNumber(cur)} / 1` };
    },
    guide: () => {
      openPrestigeModal();
    },
    claim: (silent = false) => {
      GAME.prestigeRolls = (GAME.prestigeRolls || 0) + 5;
      GAME.allTimePrestigeRolls = (GAME.allTimePrestigeRolls || 0) + 5;
      if (!silent) addVisualParticle('+5 Втулок Судьбы!', '#a855f7', 2.0);
    }
  },

  // 14. Скрытый потенциал
  {
    id: 'hidden_potential',
    num: 14,
    icon: '🌳',
    titleKey: 'tutorial.step14Title',
    fallbackTitle: 'Скрытый потенциал',
    rewardDesc: '+10% клик',
    beaconSelector: '.dash-tab[data-target="panelTalents"]',
    check: () => TALENTS.some(t => (t.level || 0) > 0) || (GAME.breakthroughCount || 0) > 0,
    progress: () => {
      const hasTalent = TALENTS.some(t => (t.level || 0) > 0) || (GAME.breakthroughCount || 0) > 0;
      return { current: hasTalent ? 1 : 0, max: 1, label: `Таланты: ${hasTalent ? 'Куплен' : '0 / 1'}` };
    },
    guide: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelTalents"]');
      if (tab) tab.click();
    },
    claim: (silent = false) => {
      GAME.tutorialClickBonus = (GAME.tutorialClickBonus || 0) + 0.10;
      if (!silent) addVisualParticle('+10% базовой силы клика!', '#38bdf8', 2.0);
    }
  },

  // 15. Постоянная роскошь
  {
    id: 'permanent_luxury',
    num: 15,
    icon: '🔮',
    titleKey: 'tutorial.step15Title',
    fallbackTitle: 'Постоянная роскошь',
    rewardDesc: 'Вечный Перк',
    beaconSelector: '.dash-tab[data-target="panelShop"]',
    check: () => PERMANENT_PERKS.some(p => p.owned || hasPerk(p.id)) || Object.keys(GAME.ownedPerks || {}).length > 0 || (GAME.breakthroughCount || 0) > 0,
    progress: () => {
      const hasP = PERMANENT_PERKS.some(p => p.owned || hasPerk(p.id)) || Object.keys(GAME.ownedPerks || {}).length > 0 || (GAME.breakthroughCount || 0) > 0;
      return { current: hasP ? 1 : 0, max: 1, label: `Перки: ${hasP ? 'Куплен' : '0 / 1'}` };
    },
    guide: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelShop"]');
      if (tab) tab.click();
    },
    claim: (silent = false) => {
      GAME.sparkles = (GAME.sparkles || 0) + 50;
      if (!silent) addVisualParticle('Вечный бафф активен! +50 ✨', '#fbbf24', 2.0);
    }
  },

  // 16. Марафонец Смывов
  {
    id: 'flush_marathon',
    num: 16,
    icon: '🏃',
    titleKey: 'tutorial.step16Title',
    fallbackTitle: 'Марафонец Смывов',
    rewardDesc: '+10 Втулок',
    beaconSelector: '#currencyPrestigeBox',
    check: () => (GAME.flushCount || GAME.totalPrestiges || 0) >= 20 || (GAME.breakthroughCount || GAME.totalTranscend || 0) > 0,
    progress: () => {
      const flushes = (GAME.flushCount || GAME.totalPrestiges || 0);
      const cur = Math.min(20, flushes);
      return { current: cur, max: 20, label: `Смывы: ${formatNumber(cur)} / 20` };
    },
    guide: () => {
      openPrestigeModal();
    },
    claim: (silent = false) => {
      GAME.prestigeRolls = (GAME.prestigeRolls || 0) + 10;
      GAME.allTimePrestigeRolls = (GAME.allTimePrestigeRolls || 0) + 10;
      if (!silent) addVisualParticle('Ядро готово к Прорыву! +10 Втулок', '#a855f7', 2.0);
    }
  },

  // 17. Великий Прорыв
  {
    id: 'great_breakthrough',
    num: 17,
    icon: '🪠',
    titleKey: 'tutorial.step17Title',
    fallbackTitle: 'Великий Прорыв',
    rewardDesc: '+1 🪠 Вантуз',
    beaconSelector: '#currencyPlungersBox',
    check: () => (GAME.breakthroughCount || GAME.totalTranscend || 0) >= 1,
    progress: () => {
      const b = (GAME.breakthroughCount || GAME.totalTranscend || 0);
      const cur = Math.min(1, b);
      return { current: cur, max: 1, label: `Прорывы: ${formatNumber(cur)} / 1` };
    },
    guide: () => {
      openTranscendModal();
    },
    claim: (silent = false) => {
      GAME.transcendPlungers = (GAME.transcendPlungers || 0) + 1;
      if (!silent) addVisualParticle('+1 Астральный Вантуз 🪠!', '#06b6d4', 2.2);
    }
  },

  // 18. Древняя Святыня
  {
    id: 'ancient_shrine',
    num: 18,
    icon: '🏛️',
    titleKey: 'tutorial.step18Title',
    fallbackTitle: 'Древняя Святыня',
    rewardDesc: 'Триумф 🏆',
    beaconSelector: '.dash-tab[data-target="panelTalents"]',
    check: () => RELICS.some(r => hasRelic(r.id)) || Object.values(GAME.relics || {}).some(lvl => Number(lvl) > 0) || Object.values(GAME.transcendUpgrades || {}).some(lvl => Number(lvl) > 0),
    progress: () => {
      const hasRelicPurchased = RELICS.some(r => hasRelic(r.id)) || Object.values(GAME.relics || {}).some(lvl => Number(lvl) > 0) || Object.values(GAME.transcendUpgrades || {}).some(lvl => Number(lvl) > 0);
      return { current: hasRelicPurchased ? 1 : 0, max: 1, label: `Реликвии: ${hasRelicPurchased ? 'Куплена' : '0 / 1'}` };
    },
    guide: () => {
      const tab = document.querySelector('.dash-tab[data-target="panelTalents"]');
      if (tab) tab.click();
      switchTalentSubTab('transcendUpgrades');
    },
    claim: (silent = false) => {
      GAME.tutorialCompleted = true;
      if (!silent) showTriumphModal();
    }
  }
];

export function getCurrentQuest() {
  if (GAME.tutorialCompleted) return null;
  const idx = Math.max(0, Math.min(TUTORIAL_QUESTS.length - 1, Number(GAME.tutorialStepIndex) || 0));
  return TUTORIAL_QUESTS[idx] || null;
}

export function isTutorialComplete() {
  return Boolean(GAME.tutorialCompleted || (GAME.tutorialStepIndex || 0) >= TUTORIAL_QUESTS.length);
}

/**
 * Ретроактивная проверка: если условия квестов уже выполнены в state.js,
 * автоматически засчитываем их без зависаний.
 */
export function validateAndAdvanceRetroactiveQuests() {
  if (GAME.tutorialCompleted) return;
  let advanced = false;
  while ((GAME.tutorialStepIndex || 0) < TUTORIAL_QUESTS.length) {
    const step = TUTORIAL_QUESTS[GAME.tutorialStepIndex || 0];
    if (step && step.check()) {
      step.claim(true);
      GAME.tutorialStepIndex = (GAME.tutorialStepIndex || 0) + 1;
      GAME.currentQuestId = (GAME.tutorialStepIndex || 0) + 1;
      advanced = true;
    } else {
      break;
    }
  }
  if ((GAME.tutorialStepIndex || 0) >= TUTORIAL_QUESTS.length) {
    GAME.tutorialCompleted = true;
  }
  if (advanced) {
    saveLocal();
  }
}

/**
 * Активация Spotlight затемнения экрана с подсветкой целевой зоны
 */
let activeElevatedModal = null;

/**
 * Интеллектуальный динамический резолвер: возвращает конкретный элемент,
 * который должен подсвечиваться прямо сейчас в зависимости от открытых вкладок и модалок.
 */
export function resolveSpotlightTarget(step) {
  if (!step) return null;

  switch (step.num) {
    case 1: {
      // 1. Первая слизь: 50 ручных кликов
      return document.getElementById('canvasBox') || document.getElementById('petCanvas');
    }

    case 2: {
      // 2. Автоматизация: Купить первый Авто-завод Тира 1
      const panel = document.getElementById('panelFactories');
      if (!panel || panel.classList.contains('hidden')) {
        return document.querySelector('.dash-tab[data-target="panelFactories"]');
      }
      return panel.querySelector('.buy-factory-btn') || panel;
    }

    case 3: {
      // 3. Полный уход: Помыть, покормить, пощекотать
      const needs = document.getElementById('petNeedsStation');
      const wDone = GAME.tutorialCareDone?.wash || (GAME.clean || 0) >= 90;
      const fDone = GAME.tutorialCareDone?.feed || (GAME.hunger || 0) >= 90;
      const tDone = GAME.tutorialCareDone?.tickle || (GAME.comboHeat || 0) >= 5;
      if (!wDone) return document.getElementById('btnWash') || needs;
      if (!fDone) return document.getElementById('btnFeed') || needs;
      if (!tDone) return document.getElementById('btnTickle') || needs;
      return needs;
    }

    case 4: {
      // 4. Включить пулемет: Активировать встроенный автокликер
      return document.getElementById('btnToggleAutoclicker');
    }

    case 5: {
      // 5. Первый сундук: Открыть Кейс №1 в магазине за Блестяшки
      const panel = document.getElementById('panelCases');
      if (!panel || panel.classList.contains('hidden')) {
        return document.querySelector('.dash-tab[data-target="panelCases"]');
      }
      return document.querySelector('.open-case-btn[data-case="case_weapon_1"]') ||
             panel.querySelector('.open-case-btn') ||
             panel;
    }

    case 6: {
      // 6. Стальной хват: Зайти в Инвентарь и экипировать выбитый Нож
      const invModal = document.getElementById('characterInventoryModal');
      if (!invModal || invModal.classList.contains('hidden')) {
        return document.getElementById('btnCanvasInventory');
      }
      const knivesPanel = document.getElementById('invKnivesPanel');
      if (!knivesPanel || knivesPanel.classList.contains('hidden')) {
        return document.getElementById('invTabKnives') || invModal;
      }
      return invModal.querySelector('.equip-knife-btn') || invModal;
    }

    case 7: {
      // 7. Закалка стали: Заточить нож на +1 звезду в гардеробе
      const invModal = document.getElementById('characterInventoryModal');
      if (!invModal || invModal.classList.contains('hidden')) {
        return document.getElementById('btnCanvasInventory');
      }
      return document.getElementById('btnSharpenEquippedKnife') ||
             invModal.querySelector('.sharpen-knife-btn') ||
             invModal;
    }

    case 8: {
      // 8. Стиль и Сила: Купить и экипировать первую Шапку в гардеробе
      const invModal = document.getElementById('characterInventoryModal');
      if (!invModal || invModal.classList.contains('hidden')) {
        return document.getElementById('btnCanvasInventory');
      }
      const hatsPanel = document.getElementById('invHatsPanel');
      if (!hatsPanel || hatsPanel.classList.contains('hidden')) {
        return document.getElementById('invTabHats') || invModal;
      }
      return hatsPanel.querySelector('.buy-hat-btn:not([disabled])') ||
             hatsPanel.querySelector('.equip-hat-btn') ||
             hatsPanel.querySelector('.buy-hat-btn') ||
             hatsPanel;
    }

    case 9: {
      // 9. Новая кожа: Купить и экипировать первую Одежду (скин) по акции за 1000 ✨
      const invModal = document.getElementById('characterInventoryModal');
      if (!invModal || invModal.classList.contains('hidden')) {
        return document.getElementById('btnCanvasInventory');
      }
      const skinsPanel = document.getElementById('invSkinsPanel');
      if (!skinsPanel || skinsPanel.classList.contains('hidden')) {
        return document.getElementById('invTabSkins') || invModal;
      }
      return skinsPanel.querySelector('.buy-skin-btn[data-id="skin_robe"]') ||
             skinsPanel.querySelector('.buy-skin-btn') ||
             skinsPanel.querySelector('.equip-skin-btn') ||
             skinsPanel;
    }

    case 10: {
      // 10. Поймай звезду: Кликнуть по прилетевшему Метеориту
      return document.getElementById('canvasBox') || document.getElementById('petCanvas');
    }

    case 11: {
      // 11. Промышленный бум: Купить заводы пакетом MAX
      const panel = document.getElementById('panelFactories');
      if (!panel || panel.classList.contains('hidden')) {
        return document.querySelector('.dash-tab[data-target="panelFactories"]');
      }
      if (GAME.buyMultiplier !== 'max') {
        return document.querySelector('.buy-mult-btn[data-mult="max"]');
      }
      return panel.querySelector('.buy-factory-btn') || panel;
    }

    case 12: {
      // 12. Испытание кликом: 10 000 кликов автокликером
      if (!GAME.autoclickerActive) {
        return document.getElementById('btnToggleAutoclicker');
      }
      return document.getElementById('tqActionBtn') || document.getElementById('tutorialQuestWidget');
    }

    case 13: {
      // 13. Большой Смыв: Нажать Смыв
      const prestModal = document.getElementById('prestigeModal');
      if (prestModal && !prestModal.classList.contains('hidden')) {
        return document.getElementById('btnExecutePrestige') || prestModal;
      }
      return document.getElementById('btnCanvasPrestige') || document.getElementById('btnFlush');
    }

    case 14: {
      // 14. Скрытый потенциал: Купить первый Талант за Втулки
      const panel = document.getElementById('panelTalents');
      if (!panel || panel.classList.contains('hidden')) {
        return document.querySelector('.dash-tab[data-target="panelTalents"]');
      }
      const viewFlush = document.getElementById('viewTalentsFlush');
      if (!viewFlush || viewFlush.classList.contains('hidden')) {
        return document.getElementById('tabTalentsFlush') || panel;
      }
      return viewFlush.querySelector('.buy-talent-btn:not([disabled])') ||
             viewFlush.querySelector('.buy-talent-btn') ||
             panel;
    }

    case 15: {
      // 15. Постоянная роскошь: Купить Постоянный Перк в Бутике
      const panel = document.getElementById('panelShop');
      if (!panel || panel.classList.contains('hidden')) {
        return document.querySelector('.dash-tab[data-target="panelShop"]');
      }
      return panel.querySelector('.buy-shop-perk-btn:not([disabled])') ||
             panel.querySelector('.buy-shop-perk-btn') ||
             panel;
    }

    case 16: {
      // 16. Марафонец Смывов: Достичь 20-го Уровня Смыва
      const prestModal = document.getElementById('prestigeModal');
      if (prestModal && !prestModal.classList.contains('hidden')) {
        return document.getElementById('btnExecutePrestige') || prestModal;
      }
      return document.getElementById('btnCanvasPrestige') || document.getElementById('btnFlush');
    }

    case 17: {
      // 17. Великий Прорыв: Нажать Прорыв
      const transcModal = document.getElementById('transcendModal');
      if (transcModal && !transcModal.classList.contains('hidden')) {
        return document.getElementById('btnExecuteTranscend') || transcModal;
      }
      return document.getElementById('btnCanvasTranscend') || document.getElementById('btnTranscend');
    }

    case 18: {
      // 18. Древняя Святыня: Купить Реликвию за Вантузы
      const panel = document.getElementById('panelTalents');
      if (!panel || panel.classList.contains('hidden')) {
        return document.querySelector('.dash-tab[data-target="panelTalents"]');
      }
      const viewRelics = document.getElementById('viewTalentsTranscend');
      if (!viewRelics || viewRelics.classList.contains('hidden')) {
        return document.getElementById('tabTalentsTranscend') || panel;
      }
      return viewRelics.querySelector('.buy-art-btn:not([disabled])') ||
             viewRelics.querySelector('.buy-art-btn') ||
             panel;
    }

    default:
      return step.beaconSelector ? document.querySelector(step.beaconSelector) : null;
  }
}

/**
 * Интеллектуальное обновление фокуса: срабатывает только когда игрок запросил подсветку
 */
export function refreshTutorialSpotlight() {
  if (!isSpotlightActive || isTutorialComplete()) {
    deactivateTutorialSpotlight();
    return;
  }

  const step = getCurrentQuest();
  if (!step) {
    deactivateTutorialSpotlight();
    return;
  }

  const overlay = document.getElementById('tutorialSpotlightOverlay');
  if (overlay) {
    overlay.classList.remove('hidden');
  }

  const widget = document.getElementById('tutorialQuestWidget');
  if (widget) {
    widget.style.zIndex = '860';
  }

  let target = null;
  if (step.check()) {
    target = document.getElementById('tqActionBtn') || widget;
  } else {
    target = resolveSpotlightTarget(step);
  }

  if (activeSpotlightElement && activeSpotlightElement !== target) {
    activeSpotlightElement.classList.remove('tutorial-spotlight-target');
  }

  if (activeElevatedModal && (!target || !target.closest('.fixed'))) {
    activeElevatedModal.style.zIndex = '';
    activeElevatedModal = null;
  }

  if (target) {
    target.classList.add('tutorial-spotlight-target');
    activeSpotlightElement = target;

    const modal = target.closest('.fixed:not(#tutorialSpotlightOverlay):not(#bootVeil)');
    if (modal) {
      modal.style.zIndex = '860';
      activeElevatedModal = modal;
    }
  }
}

/**
 * Активация Spotlight затемнения экрана строго по клику игрока
 */
export function activateTutorialSpotlight(step) {
  if (!step || isTutorialComplete()) return;
  isSpotlightActive = true;
  step.guide();
  setTimeout(() => {
    if (isSpotlightActive) refreshTutorialSpotlight();
  }, 50);
}

/**
 * Снятие Spotlight затемнения экрана
 */
export function deactivateTutorialSpotlight() {
  isSpotlightActive = false;
  if (activeSpotlightElement) {
    activeSpotlightElement.classList.remove('tutorial-spotlight-target');
    activeSpotlightElement = null;
  }
  if (activeElevatedModal) {
    activeElevatedModal.style.zIndex = '';
    activeElevatedModal = null;
  }
  document.querySelectorAll('.tutorial-spotlight-target').forEach(el => {
    el.classList.remove('tutorial-spotlight-target');
  });
  const overlay = document.getElementById('tutorialSpotlightOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
  const widget = document.getElementById('tutorialQuestWidget');
  if (widget) {
    widget.style.zIndex = '';
  }
}

/**
 * Переключение Spotlight по клику на плашку квеста
 */
export function toggleTutorialSpotlight(step) {
  if (isSpotlightActive) {
    deactivateTutorialSpotlight();
  } else {
    activateTutorialSpotlight(step || getCurrentQuest());
  }
}


/**
 * Обновление плашки текущего Квеста на экране питомца
 */
export function updateTutorialQuestWidget() {
  const widget = document.getElementById('tutorialQuestWidget');

  if (isTutorialComplete()) {
    if (widget) widget.classList.add('hidden');
    deactivateTutorialSpotlight();
    return;
  }

  // Запуск быстрой ретро-проверки
  validateAndAdvanceRetroactiveQuests();

  if (isTutorialComplete()) {
    if (widget) widget.classList.add('hidden');
    deactivateTutorialSpotlight();
    return;
  }

  const currentStep = getCurrentQuest();
  if (!currentStep) {
    if (widget) widget.classList.add('hidden');
    deactivateTutorialSpotlight();
    return;
  }

  if (widget) widget.classList.remove('hidden');

  const stepIdx = currentStep.num - 1;
  GAME.currentQuestId = currentStep.num;
  const isDone = currentStep.check();
  const prog = currentStep.progress();

  const iconEl = document.getElementById('tqQuestIcon');
  const headerEl = document.getElementById('tqQuestHeader');
  const actionBtn = document.getElementById('tqActionBtn');
  const fillEl = document.getElementById('tqProgressFill');
  const progLabel = document.getElementById('tqProgressLabel');
  const rewLabel = document.getElementById('tqRewardLabel');

  if (iconEl) iconEl.textContent = isDone ? '🎁' : currentStep.icon;

  const questTitle = t(currentStep.titleKey) || currentStep.fallbackTitle;
  if (headerEl) {
    headerEl.textContent = `Квест ${currentStep.num}/18: ${questTitle}`;
    headerEl.className = isDone
      ? 'font-game text-xs text-emerald-300 font-extrabold block truncate animate-pulse'
      : 'font-game text-xs text-yellow-300 font-extrabold block truncate';
  }

  const pct = Math.min(100, Math.max(0, (prog.current / prog.max) * 100));
  if (fillEl) fillEl.style.width = `${pct}%`;

  if (progLabel) progLabel.textContent = prog.label;
  if (rewLabel) rewLabel.textContent = currentStep.rewardDesc;

  if (widget) {
    widget.classList.toggle('quest-ready', isDone);
  }

  if (actionBtn) {
    if (isDone) {
      actionBtn.textContent = 'Забрать 🎁';
      actionBtn.className = 'shrink-0 font-game text-[10px] font-black px-2.5 py-0.5 rounded-xl shadow-lg border-2 border-yellow-200 animate-pulse jelly-btn transition bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-stone-950 cursor-pointer';
      actionBtn.onclick = (e) => {
        e.stopPropagation();
        currentStep.claim(false);
        GAME.tutorialStepIndex = stepIdx + 1;
        GAME.currentQuestId = Math.min(19, stepIdx + 2);
        deactivateTutorialSpotlight();
        if (GAME.tutorialStepIndex >= TUTORIAL_QUESTS.length) {
          GAME.tutorialCompleted = true;
          showTriumphModal();
        }
        updateHUD();
        saveLocal();
        updateTutorialQuestWidget();
      };
    } else {
      actionBtn.textContent = '⚡';
      actionBtn.className = 'shrink-0 font-game text-[10px] font-black px-2.5 py-0.5 rounded-xl shadow border border-emerald-300 jelly-btn transition bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 cursor-pointer';
      actionBtn.onclick = (e) => {
        e.stopPropagation();
        toggleTutorialSpotlight(currentStep);
      };
    }
  }

  // Обновление подсветки только если игрок сам её включил
  if (isSpotlightActive) {
    refreshTutorialSpotlight();
  } else {
    const overlay = document.getElementById('tutorialSpotlightOverlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      overlay.classList.add('hidden');
    }
    if (widget) widget.style.zIndex = '';
    if (activeSpotlightElement) {
      activeSpotlightElement.classList.remove('tutorial-spotlight-target');
      activeSpotlightElement = null;
    }
  }
}

export function showTriumphModal() {
  const modal = document.getElementById('tutorialTriumphModal');
  if (modal) modal.classList.remove('hidden');
}

export function initTutorialListeners() {
  const overlay = document.getElementById('tutorialSpotlightOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      deactivateTutorialSpotlight();
    });
  }

  // Реактивный трекинг действий игрока для переключения фокуса внутри вкладок и модалок
  document.addEventListener('click', () => {
    if (isSpotlightActive && !isTutorialComplete()) {
      setTimeout(() => {
        if (isSpotlightActive) refreshTutorialSpotlight();
      }, 40);
    }
  }, true);

  const widget = document.getElementById('tutorialQuestWidget');
  if (widget) {
    widget.addEventListener('click', (e) => {
      if (e.target.id === 'tqActionBtn' || e.target.closest('#tqActionBtn')) return;
      const current = getCurrentQuest();
      if (!current) return;
      if (current.check()) {
        current.claim(false);
        GAME.tutorialStepIndex = (GAME.tutorialStepIndex || 0) + 1;
        GAME.currentQuestId = Math.min(19, (GAME.tutorialStepIndex || 0) + 1);
        deactivateTutorialSpotlight();
        if (GAME.tutorialStepIndex >= TUTORIAL_QUESTS.length) {
          GAME.tutorialCompleted = true;
          showTriumphModal();
        }
        updateHUD();
        saveLocal();
        updateTutorialQuestWidget();
      } else {
        toggleTutorialSpotlight(current);
      }
    });
  }

  const triumphClose = document.getElementById('btnTriumphClose');
  if (triumphClose) {
    triumphClose.addEventListener('click', () => {
      const modal = document.getElementById('tutorialTriumphModal');
      if (modal) modal.classList.add('hidden');
      deactivateTutorialSpotlight();
      updateTutorialQuestWidget();
    });
  }

  onLocaleChange(() => {
    updateTutorialQuestWidget();
  });
}
