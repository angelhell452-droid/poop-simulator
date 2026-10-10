import { GAME } from '../core/state.js?v=5.0.80';
import { KNIVES } from '../data/knives.data.js?v=5.0.80';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.80';
import { getKnifeStar, getHatLevel } from '../economy/production.js?v=5.0.80';
import { events } from '../core/events.js';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { t } from '../i18n/t.js';
import { knifeName } from '../i18n/localize.js';
import { TALENTS } from '../data/talents.data.js';
import { hasPerk } from '../data/perks.data.js';
import { getRelicLevel } from '../data/relics.data.js?v=5.0.80';

// Bases ~10× below the old table. Power no longer scales with raw clickMult
// (godly knives sit at 1e5+ and used to make sharpening/sell impossible or broken).
const BASE_RARITY_SPARKLES = {
  common: 25,
  rare: 150,
  very_rare: 500,
  restricted: 500,
  epic: 1500,
  classified: 4500,
  covert: 12000,
  rainbow: 35000,
  titanium: 80000,
  celestial: 180000,
  godly: 350000,
  special: 350000
};

const RECYCLE_BASE = {
  common: 2,
  rare: 4,
  very_rare: 8,
  restricted: 8,
  epic: 15,
  classified: 28,
  covert: 45,
  rainbow: 70,
  titanium: 100,
  celestial: 1,
  godly: 3,
  special: 3
};

function sharpenPowerFactor(clickMult) {
  const mult = Math.max(1, Number(clickMult) || 1);
  return 1 + Math.min(2.5, Math.log10(mult) * 0.4);
}

export function getKnifeSharpenCost(knifeOrId, explicitStar = null) {
  const knife = typeof knifeOrId === 'string' ? KNIVES.find(k => k.id === knifeOrId) : knifeOrId;
  if (!knife) return { maxReached: true, cost: 0, currency: 'sparkles', symbol: '✨' };

  const currentStar = explicitStar !== null && explicitStar !== undefined ? explicitStar : getKnifeStar(knife.id);
  if (currentStar >= 25) return { maxReached: true, cost: 0, currency: 'sparkles', symbol: '✨' };

  const baseCost = BASE_RARITY_SPARKLES[knife.rarity] || 50;
  const powerFactor = sharpenPowerFactor(knife.clickMult);
  const growth = 1.42;
  const cost = Math.max(50, Math.floor(baseCost * powerFactor * Math.pow(growth, currentStar - 1)));

  return { maxReached: false, cost, currency: 'sparkles', symbol: '✨' };
}

/** Sleeve/plunger scrap for inventory sell. Softcap so high clickMult cannot mint currency. */
export function getKnifeRecycleReward(knifeOrId, explicitStar = null) {
  const knife = typeof knifeOrId === 'string' ? KNIVES.find(k => k.id === knifeOrId) : knifeOrId;
  if (!knife) return { amount: 1, currency: 'rolls', symbol: '🧻', isAstral: false };

  const isAstral = ['godly', 'special', 'celestial'].includes(knife.rarity);
  const currency = isAstral ? 'plungers' : 'rolls';
  const symbol = isAstral ? '🪠' : '🧻';
  const star = explicitStar !== null && explicitStar !== undefined ? explicitStar : getKnifeStar(knife.id);
  const base = RECYCLE_BASE[knife.rarity] || 2;
  const mult = Math.max(1, Number(knife.clickMult) || 1);
  const powerBonus = isAstral
    ? Math.min(5, Math.floor(Math.log10(mult)))
    : Math.min(base, Math.round(Math.sqrt(mult)));
  const starBonus = Math.round(Math.max(0, star - 1) * base * 0.12);
  const amount = Math.max(1, base + powerBonus + starBonus);
  return { amount, currency, symbol, isAstral };
}

export function sharpenKnife(knifeId) {
  const knife = KNIVES.find(k => k.id === knifeId);
  if (!knife) return { success: false, msg: t('knife.err.notFound') };

  const costInfo = getKnifeSharpenCost(knife);
  if (costInfo.maxReached) {
    return { success: false, msg: t('knife.err.maxSharpen') };
  }

  if ((GAME.sparkles || 0) < costInfo.cost) {
    return { success: false, msg: t('knife.err.needSparkles', { n: formatNumber(costInfo.cost) }) };
  }
  GAME.sparkles -= costInfo.cost;

  // talent_upgrade_chance (MAX 10): +3% к шансу успешной заточки ножа (база 70%, на капе 100%)
  const upgChanceTalent = TALENTS.find(t => t.id === 'talent_upgrade_chance')?.level || 0;
  const forgeLuckLvl = getRelicLevel('relic_forge_luck');
  const successChance = Math.min(1.0, 0.70 + upgChanceTalent * 0.03 + forgeLuckLvl * 0.05);

  if (Math.random() > successChance) {
    const curStar = GAME.knifeStars?.[knifeId] || 1;
    const hasBlessing = hasPerk('perk_blacksmith_blessing');
    const hasProtection = hasBlessing || forgeLuckLvl > 0;
    const newStar = hasProtection ? Math.max(1, curStar - 1) : 1;
    if (!GAME.knifeStars) GAME.knifeStars = {};
    GAME.knifeStars[knifeId] = newStar;
    events.emit('knife:sharpenFailed', { knife, newStar });
    return {
      success: false,
      msg: hasProtection
        ? `Заточка сорвалась! Защита «Небесная Кузница» сохранила уровень: снижен лишь на -1 (★${newStar}).`
        : `Заточка сорвалась (${Math.round(successChance * 100)}% шанс)! Звезда ножа сброшена до ★1. Откройте реликвию «Небесная Кузница Ножей».`
    };
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
  if (!best) return { success: false, msg: t('knife.err.noUnlocked') };
  if (GAME.equippedKnife === best.id) {
    return {
      success: false,
      msg: t('knife.err.alreadyBest', { name: knifeName(best) }),
      knife: best,
      alreadyEquipped: true
    };
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
  if (!hat) return { success: false, msg: t('hat.err.notFound') };

  const costInfo = getHatInlayCost(hat);
  if (costInfo.maxReached) {
    return { success: false, msg: t('hat.err.maxInlay') };
  }

  if ((GAME.sparkles || 0) < costInfo.cost) {
    return { success: false, msg: t('knife.err.needSparkles', { n: formatNumber(costInfo.cost) }) };
  }

  GAME.sparkles -= costInfo.cost;
  if (!GAME.hatLevels) GAME.hatLevels = {};
  GAME.hatLevels[hatId] = (GAME.hatLevels[hatId] || 1) + 1;

  events.emit('hat:inlayed', { hat, newLevel: GAME.hatLevels[hatId] });
  return { success: true, newLevel: GAME.hatLevels[hatId] };
}

export { getKnifeStar, getHatLevel };

