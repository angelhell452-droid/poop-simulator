import {
  TUTORIAL_QUESTS,
  getCurrentQuest,
  isTutorialComplete,
  validateAndAdvanceRetroactiveQuests,
  updateTutorialQuestWidget,
  initTutorialListeners,
  showTriumphModal
} from './tutorialView.js';

export const BEGINNER_STEPS = TUTORIAL_QUESTS;

export function isBeginnerGuideComplete() {
  return isTutorialComplete();
}

export function getCurrentTutorialStepIndex() {
  const current = getCurrentQuest();
  return current ? current.num - 1 : TUTORIAL_QUESTS.length;
}

export function getNextBeginnerStep() {
  const current = getCurrentQuest();
  if (!current) return null;
  return {
    ...current,
    titleKey: current.titleKey,
    rewardKey: current.rewardDesc,
    action: () => {
      if (current.check()) {
        current.claim(false);
      } else {
        current.guide();
      }
    }
  };
}

export function updateBeginnerGuide() {
  updateTutorialQuestWidget();
}

export function initBeginnerGuideListeners() {
  initTutorialListeners();
}

export { showTriumphModal };
