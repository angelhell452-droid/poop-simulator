import { GAME } from '../core/state.js';
import { KNIVES } from '../data/knives.data.js';
import { getKnifeStar } from '../economy/production.js';
import { events } from '../core/events.js';

export function getKnifeSharpenCost(knife) {
  const currentStar = getKnifeStar(knife.id);
  if (currentStar >= 25) return { maxReached: true, cost: 0, currency: 'rolls', symbol: '🧻' };

  if (knife.rarity === 'celestial' || knife.rarity === 'godly') {
    const cost = Math.max(1, Math.floor(2 * Math.pow(1.35, currentStar - 1)));
    return { maxReached: false, cost, currency: 'plungers', symbol: '🪠' };
  } else {
    let baseCost = 15;
    let growth = 1.35;
    if (knife.rarity === 'restricted') { baseCost = 35; growth = 1.38; }
    if (knife.rarity === 'classified') { baseCost = 80; growth = 1.40; }
    if (knife.rarity === 'covert') { baseCost = 250; growth = 1.42; }
    if (knife.rarity === 'special') { baseCost = 800; growth = 1.45; }
    const cost = Math.floor(baseCost * Math.pow(growth, currentStar - 1));
    return { maxReached: false, cost, currency: 'rolls', symbol: '🧻' };
  }
}

export function sharpenKnife(knifeId) {
  const knife = KNIVES.find(k => k.id === knifeId);
  if (!knife) return { success: false, msg: 'Нож не найден' };

  const costInfo = getKnifeSharpenCost(knife);
  if (costInfo.maxReached) {
    return { success: false, msg: 'Этот нож уже имеет максимальный уровень заточки (★ Lv.25)!' };
  }

  if (costInfo.currency === 'plungers') {
    if ((GAME.transcendPlungers || 0) < costInfo.cost) {
      return { success: false, msg: `Недостаточно Астральных Вантузов (🪠)! Требуется: ${costInfo.cost} 🪠` };
    }
    GAME.transcendPlungers -= costInfo.cost;
  } else {
    if ((GAME.prestigeRolls || 0) < costInfo.cost) {
      return { success: false, msg: `Недостаточно Золотых Втулок (🧻)! Требуется: ${costInfo.cost} 🧻` };
    }
    GAME.prestigeRolls -= costInfo.cost;
  }

  if (!GAME.knifeStars) GAME.knifeStars = {};
  GAME.knifeStars[knifeId] = (GAME.knifeStars[knifeId] || 1) + 1;

  events.emit('knife:sharpened', { knife, newStar: GAME.knifeStars[knifeId] });
  return { success: true, newStar: GAME.knifeStars[knifeId] };
}

export function equipKnife(knifeId) {
  const knife = KNIVES.find(k => k.id === knifeId);
  if (!knife) return false;

  GAME.equippedKnife = knifeId;
  events.emit('knife:equipped', { knife });
  return true;
}

export function unequipKnife() {
  GAME.equippedKnife = null;
  events.emit('knife:unequipped');
  return true;
}

export function getEquippedKnife() {
  if (!GAME.equippedKnife) return null;
  return KNIVES.find(k => k.id === GAME.equippedKnife) || null;
}

export function getBestKnife() {
  if (!GAME.unlockedKnives || GAME.unlockedKnives.length === 0) return null;
  let best = null;
  let maxScore = -1;

  for (const kid of GAME.unlockedKnives) {
    const kn = KNIVES.find(k => k.id === kid);
    if (!kn) continue;
    const star = getKnifeStar(kn.id);
    const clickPower = kn.clickMult * (1 + (star - 1) * 0.35);
    const passPower = kn.passiveMult * (1 + (star - 1) * 0.25);
    const score = (clickPower * 1.5) + passPower;
    if (score > maxScore) {
      maxScore = score;
      best = kn;
    }
  }
  return best;
}

export function equipBestKnife() {
  const best = getBestKnife();
  if (!best) return { success: false, msg: 'У вас пока нет разблокированных ножей!' };
  if (GAME.equippedKnife === best.id) {
    return { success: false, msg: `Уже экипирован самый мощный нож: ${best.name}!`, knife: best, alreadyEquipped: true };
  }
  GAME.equippedKnife = best.id;
  events.emit('knife:equipped', { knife: best });
  return { success: true, knife: best };
}

export { getKnifeStar };
