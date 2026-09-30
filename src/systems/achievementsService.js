import { GAME, feedCount, washCount, polishCount, flushCount } from '../core/state.js';
import { ACHIEVEMENTS } from '../data/achievements.data.js';
import { FACTORIES } from '../data/factories.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { events } from '../core/events.js';

export function checkAchievements() {
  const completed = [];

  ACHIEVEMENTS.forEach(ach => {
    if (ach.done) return;
    let met = false;
    if (ach.type === 'clicks' && GAME.totalClicks >= ach.target) met = true;
    if (ach.type === 'evo' && GAME.evoStage >= ach.target) met = true;
    if (ach.type === 'allBiomass' && GAME.allTimeBiomass >= ach.target) met = true;
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

    if (met) {
      ach.done = true;
      GAME.sparkles += ach.reward;
      completed.push(ach);
      events.emit('achievement:unlocked', { achievement: ach });
    }
  });

  return completed;
}
