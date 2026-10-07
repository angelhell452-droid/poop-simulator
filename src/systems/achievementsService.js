import { GAME, feedCount, washCount, polishCount, flushCount } from '../core/state.js?v=5.0.77';
import { ACHIEVEMENTS } from '../data/achievements.data.js?v=5.0.77';
import { FACTORIES } from '../data/factories.data.js?v=5.0.77';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.77';
import { events } from '../core/events.js';
import { gte } from '../utils/big.js?v=5.0.77';

export function checkAchievements() {
  const completed = [];

  ACHIEVEMENTS.forEach(ach => {
    if (ach.done) return;
    let met = false;
    if (ach.type === 'clicks' && GAME.totalClicks >= ach.target) met = true;
    if (ach.type === 'evo' && GAME.evoStage >= ach.target) met = true;
    if (ach.type === 'allBiomass' && gte(GAME.allTimeBiomass, ach.target)) met = true;
    if (ach.type === 'feed' && feedCount >= ach.target) met = true;
    if (ach.type === 'wash' && washCount >= ach.target) met = true;
    if (ach.type === 'knives' && (GAME.unlockedKnives || []).length >= ach.target) met = true;
    if (ach.type === 'polish' && polishCount >= ach.target) met = true;
    if (ach.type === 'flush' && flushCount >= ach.target) met = true;
    if (ach.type === 'prestige' && GAME.totalPrestiges >= ach.target) met = true;
    if (ach.type === 'hat' && GAME.equippedHat) met = true;
    if (ach.type === 'billionaire' && SHOP_ITEMS.find(i => i.id === 'hat_multiverse')?.owned) met = true;
    if (ach.type === 'factories') {
      let totalFac = 0;
      FACTORIES.forEach(f => { totalFac += (f.count || 0); });
      if (totalFac >= ach.target) met = true;
    }
    if (ach.type === 'meteor' && (GAME.meteorsCaught || 0) >= ach.target) met = true;
    if (ach.type === 'turbo' && (GAME.turboCount || 0) >= ach.target) met = true;
    if (ach.type === 'transcend' && (GAME.totalTranscend || 0) >= ach.target) met = true;
    if (ach.type === 'ideal' && ((GAME.hunger >= 90 || GAME.petHunger >= 90) && (GAME.clean >= 90 || GAME.petClean >= 90) && (GAME.happy >= 90 || GAME.petHappy >= 90))) met = true;
    if (ach.type === 'sharpen') {
      const maxStar = Object.values(GAME.knifeStars || {}).reduce((mx, cur) => Math.max(mx, cur), 0);
      if (maxStar >= ach.target) met = true;
    }

    if (met) {
      ach.done = true;
      if (ach.reward) {
        GAME.sparkles = (GAME.sparkles || 0) + ach.reward;
      }
      if (ach.rewardRolls) {
        GAME.prestigeRolls = (GAME.prestigeRolls || 0) + ach.rewardRolls;
        GAME.allTimePrestigeRolls = (GAME.allTimePrestigeRolls || 0) + ach.rewardRolls;
        GAME.transcendCycleRolls = (GAME.transcendCycleRolls || 0) + ach.rewardRolls;
      }
      if (ach.rewardPlungers) {
        GAME.transcendPlungers = (GAME.transcendPlungers || 0) + ach.rewardPlungers;
      }
      completed.push(ach);
      events.emit('achievement:unlocked', { achievement: ach });
    }
  });

  return completed;
}
