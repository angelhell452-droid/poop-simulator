import { updateTranscendModalRealtime, openTranscendModal } from './modalManager.js?v=5.4.10';
import { getTranscendRequirement, getTranscendRewardBreakdown, getTargetBreakthroughExperience, executeTranscend } from '../prestige/transcendService.js?v=5.4.10';

export {
  updateTranscendModalRealtime,
  openTranscendModal,
  getTranscendRequirement,
  getTranscendRewardBreakdown,
  getTargetBreakthroughExperience,
  executeTranscend
};

export function renderTranscendView() {
  updateTranscendModalRealtime();
}
