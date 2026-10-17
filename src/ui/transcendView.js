import { updateTranscendModalRealtime, openTranscendModal } from './modalManager.js?v=5.4.31';
import { getTranscendRequirement, getTranscendRewardBreakdown, getTargetBreakthroughExperience, executeTranscend } from '../prestige/transcendService.js?v=5.4.31';

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
