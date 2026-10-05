import { GAME } from '../core/state.js?v=5.0.22';
import { KNIVES } from '../data/knives.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { getKnifeStar, getHatLevel } from '../economy/production.js?v=5.0.22';
import { events } from '../core/events.js';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.22';

const BASE_RARITY_SPARKLES = {
  common: 500,
  rare: 1500,
  very_rare: 5000,
  restricted: 5000,
  epic: 15000,
  classified: 45000,
  covert: 120000,
  rainbow: 350000,
  titanium: 800000,
  celestial: 1800000,
  godly: 3500000,
  special: 3500000
};

export function getKnifeSharpenCost(knifeOrId, explicitStar = null) {
  const knife = typeof knifeOrId === 'string' ? KNIVES.find(k => k.id === knifeOrId) : knifeOrId;
  if (!knife) return { maxReached: true, cost: 0, currency: 'sparkles', symbol: '✨' };

  const currentStar = explicitStar !== null && explicitStar !== undefined ? explicitStar : getKnifeStar(knife.id);
  if (currentStar >= 25) return { maxReached: true, cost: 0, currency: 'sparkles', symbol: '✨' };

  const baseCost = BASE_RARITY_SPARKLES[knife.rarity] || 500;
  // Scaled by knife click multiplier power
  const powerFactor = 1 + (knife.clickMult || 1) * 0.05;
  const growth = 1.45;
  const cost = Math.max(500, Math.floor(baseCost * powerFactor * Math.pow(growth, currentStar - 1)));

  return { maxReached: false, cost, currency: 'sparkles', symbol: '✨' };
}

export function sharpenKnife(knifeId) {
  const knife = KNIVES.find(k => k.id === knifeId);
  if (!knife) return { success: false, msg: 'Нож не найден' };

  const costInfo = getKnifeSharpenCost(knife);
  if (costInfo.maxReached) {
    return { success: false, msg: 'Этот нож уже имеет максимальный уровень заточки (★ Lv.25)!' };
  }

  if ((GAME.sparkles || 0) < costInfo.cost) {
    return { success: false, msg: `Недостаточно Блестяшек (✨)! Требуется: ${formatNumber(costInfo.cost)} ✨` };
  }
  GAME.sparkles -= costInfo.cost;

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

export function getHatInlayCost(hat) {
  if (!hat) return { maxReached: true, cost: 0, currency: 'sparkles', symbol: '✨' };
  const currentLvl = getHatLevel(hat.id);
  if (currentLvl >= 15) return { maxReached: true, cost: 0, currency: 'sparkles', symbol: '✨' };

  const baseCost = Math.max(1500, Math.floor((hat.cost || 5000) * 0.35));
  const growth = 1.75;
  const cost = Math.floor(baseCost * Math.pow(growth, currentLvl - 1));
  return { maxReached: false, cost, currency: 'sparkles', symbol: '✨' };
}

export function inlayHat(hatId) {
  const hat = SHOP_ITEMS.find(i => i.id === hatId && i.type === 'hat');
  if (!hat) return { success: false, msg: 'Шапка не найдена!' };

  const costInfo = getHatInlayCost(hat);
  if (costInfo.maxReached) {
    return { success: false, msg: 'Эта шапка уже инкрустирована до максимума (💎 Lv.15)!' };
  }

  if ((GAME.sparkles || 0) < costInfo.cost) {
    return { success: false, msg: `Недостаточно Блестяшек (✨)! Требуется: ${formatNumber(costInfo.cost)} ✨` };
  }

  GAME.sparkles -= costInfo.cost;
  if (!GAME.hatLevels) GAME.hatLevels = {};
  GAME.hatLevels[hatId] = (GAME.hatLevels[hatId] || 1) + 1;

  events.emit('hat:inlayed', { hat, newLevel: GAME.hatLevels[hatId] });
  return { success: true, newLevel: GAME.hatLevels[hatId] };
}

export { getKnifeStar, getHatLevel };

