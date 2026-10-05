import { GAME } from '../core/state.js?v=5.0.29';
import { EVOLUTIONS } from '../data/evolutions.data.js?v=5.0.29';
import { FACTORIES } from '../data/factories.data.js?v=5.0.29';
import { TALENTS } from '../data/talents.data.js';
import { KNIVES } from '../data/knives.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.29';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.29';
import { dampenGearMult, getIdealMult, getOmniRelicMult, getPlungersIncomeMult, getRiftMult, getRollsIncomeMult, isIdealPet, lateComboMult } from './metaMultipliers.js?v=5.0.29';
import { ARCHETYPES } from '../progression/archetypes.js';
import { getPhaseForStage } from '../progression/phases.data.js?v=5.0.29';
import { getIncomePace, getVipIncomeMult, INCOME_PACE } from './pace.js';
import { findBodySkin } from '../data/skins.data.js?v=5.0.29';
import { add, cmp, isBig, mul } from '../utils/big.js?v=5.0.29';
import { horizonIncomeMult } from './horizon.js?v=5.0.29';

export function getEquippedBodySkin() {
  const skin = findBodySkin(GAME.equippedSkin);
  if (!skin) return null;
  if (!Array.isArray(GAME.ownedSkins) || !GAME.ownedSkins.includes(skin.id)) return null;
  if ((GAME.evoStage || 0) + 1 < skin.form) return null;
  return skin;
}

export function getSkinClickMult() {
  const skin = getEquippedBodySkin();
  return skin ? skin.clickMult : 1;
}

export function getEquippedKnife() {
  if (!GAME.equippedKnife) return null;
  return KNIVES.find(k => k.id === GAME.equippedKnife) || null;
}

export function getKnifeStar(knifeId) {
  if (!GAME.knifeStars) GAME.knifeStars = {};
  return GAME.knifeStars[knifeId] || 1;
}

export function getHatLevel(hatId) {
  if (!GAME.hatLevels || !hatId) return 1;
  return GAME.hatLevels[hatId] || 1;
}

const HAT_LEVEL_STEP = 0.15;
const HAT_SOFT_KNEE = 250;

export function getHatClickMult(hat, level) {
  if (!hat) return 1;
  const lvl = Math.min(15, Math.max(1, Number(level) || 1));
  const raw = (hat.clickBoost || 1) * (1 + (lvl - 1) * HAT_LEVEL_STEP);
  return softCap(raw, HAT_SOFT_KNEE, 0.55);
}

const LEGACY_HAT_BOOST = {
  hat_cap: 1.25,
  hat_party: 1.6,
  hat_shades: 2.2,
  hat_cowboy: 3.5,
  hat_viking: 6,
  hat_chef: 7
};

function legacyHatFill(hat, hatLvl) {
  const base = LEGACY_HAT_BOOST[hat.id] ?? 8;
  const raw = base * (1 + (Math.max(1, hatLvl) - 1) * 0.08);
  return Math.min(1, Math.max(0, softCap(raw, 8, 0.55) - 1) / 4);
}

function talentLevel(id) {
  return TALENTS.find(t => t.id === id)?.level || 0;
}

/** Click multiplier from Turbo. A caught star doubles it for a short timer that clicks do not refresh. */
export function getTurboClickMult() {
  if ((GAME.turboRushTime || 0) <= 0) return 1;
  const turboBase = GAME.archetype === 'combo' ? 6 : 4;
  const turboBonus = 1 + talentLevel('combo_master') * 0.15;
  const star = (GAME.turboStarMultTime || 0) > 0 ? 2 : 1;
  return turboBase * turboBonus * star;
}

function softCap(raw, knee, power) {
  return raw > knee ? (knee + Math.pow(raw - knee, power)) : raw;
}

function knifeBonusStack(knife, perStar) {
  const knifeStar = getKnifeStar(knife.id);
  const knifeForgeBoost = 1 + (GAME.transcendUpgrades?.knifeForge || 0) * 0.08;
  const diamondLvl = Math.min(20, GAME.boutiqueLevels?.diamond_sharpening || 0);
  const diamondBoost = 1 + diamondLvl * 0.05;
  const starForge = 1 + talentLevel('star_forge_master') * 0.05;
  return (1 + Math.max(0, knifeStar - 1) * perStar) * knifeForgeBoost * diamondBoost * starForge;
}

export function getKnifeClickMult(knife) {
  if (!knife) return 1;
  return softCap(knife.clickMult || 1, 50, 0.65) * knifeBonusStack(knife, 0.35);
}

export function getKnifePassiveMult(knife) {
  if (!knife) return 1;
  return softCap(knife.passiveMult || 1, 30, 0.65) * knifeBonusStack(knife, 0.25);
}

export function getKnifeShownBonuses(knife) {
  const passive = getKnifePassiveMult(knife);
  return {
    clickPct: Math.round((getKnifeClickMult(knife) - 1) * 100),
    passPct: Math.round((passive - 1) * 100),
    cpsMult: passive
  };
}

function lateComboReadiness() {
  const knife = getEquippedKnife();
  const knifePassive = knife ? getKnifePassiveMult(knife) : 1;
  const knifeFill = Math.min(1, Math.max(0, knifePassive - 1) / 20);

  const hatItem = GAME.equippedHat ? SHOP_ITEMS.find(i => i.id === GAME.equippedHat) : null;
  const hatLvl = hatItem ? Math.min(15, getHatLevel(hatItem.id)) : 1;
  const hatFill = hatItem ? legacyHatFill(hatItem, hatLvl) : 0;

  const plungeFill = Math.min(1, Math.max(0, GAME.transcendPlungers || 0) / 6);
  const incomeTalents = talentLevel('soft_rolls') + talentLevel('turbo_pipe') + talentLevel('cosmic_resonance') + talentLevel('quantum_replication');
  const talentFill = Math.min(1, incomeTalents / 8);

  let shopScore = 0;
  if (SHOP_ITEMS.find(i => i.id === 'upg_goldrush')?.owned) shopScore += 1;
  if (SHOP_ITEMS.find(i => i.id === 'upg_factory_overclock')?.owned) shopScore += 1;
  if (SHOP_ITEMS.find(i => i.id === 'upg_omniversal_wealth')?.owned) shopScore += 1;
  if (SHOP_ITEMS.find(i => i.id === 'upg_singularity_core')?.owned) shopScore += 1;
  shopScore += Math.min(1, (GAME.boutiqueLevels?.crystal_factory || 0) / 8);
  shopScore += Math.min(1, (GAME.boutiqueLevels?.singularity_spark || 0) / 4);
  const shopFill = Math.min(1, shopScore / 3);

  const ups = GAME.transcendUpgrades || {};
  const relicPoints = (ups.cosmicSynergy || 0) + (ups.factoryOverdrive || 0) + (ups.evoBlessing || 0) + (ups.omniMult || 0) + (ups.singularityRift ? 2 : 0);
  const relicFill = Math.min(1, relicPoints / 2);
  const support = Math.min(1, talentFill * 0.75 + shopFill * 0.25 + relicFill * 0.15);
  return knifeFill * hatFill * plungeFill * support;
}

function getLateComboMult() {
  return lateComboMult(getPhaseForStage(GAME.evoStage).id, lateComboReadiness());
}

function pushAboveOne(lines, name, value, text) {
  const v = Number(value) || 1;
  if (v > 1.001) lines.push({ name, value: v, text });
}

function pushArchetype(lines, mult) {
  const arch = ARCHETYPES[GAME.archetype];
  if (!arch || !(mult > 1.001)) return;
  const pct = Math.round((mult - 1) * 100);
  pushAboveOne(lines, arch.name, mult, `+${formatNumber(pct)}%`);
}

function milestoneMult(count) {
  let mult = 1;
  if (count >= 25) mult *= 2;
  if (count >= 50) mult *= 2;
  if (count >= 100) mult *= 1.5;
  if (count >= 200) mult *= 1.5;
  if (count >= 500) mult *= 1.5;
  if (count >= 1000) {
    mult *= 2;
    const extraThousands = Math.floor((count - 1000) / 1000);
    if (extraThousands > 0) mult *= Math.pow(1.5, extraThousands);
  }
  return mult;
}

export function factoryMilestoneRank(count) {
  const owned = count || 0;
  let rank = 0;
  if (owned >= 25) rank += 1;
  if (owned >= 50) rank += 1;
  if (owned >= 100) rank += 1;
  if (owned >= 200) rank += 1;
  if (owned >= 500) rank += 1;
  if (owned >= 1000) rank += 1 + Math.floor((owned - 1000) / 1000);
  return rank;
}

function knifeStyleBonuses() {
  const knife = getEquippedKnife();
  const style = knife ? knife.style : '';
  return {
    knife,
    early: ['daggers', 'navaja', 'stiletto'].includes(style) ? 1.5 : 1,
    heavy: ['bayonet', 'm9', 'bowie', 'huntsman'].includes(style) ? 1.4 : 1,
    butterfly: style === 'butterfly' ? 1.2 : 1
  };
}

function describeFactory(fac, idx, count) {
  const styles = knifeStyleBonuses();
  const qReplMult = 1 + talentLevel('quantum_replication') * 0.08;
  let knife = 1;
  if (idx < 5) knife = styles.early;
  else if (idx >= 5 && idx < 12) knife = styles.heavy;
  const quantum = idx >= 10 ? qReplMult : 1;
  const coreOn = !!SHOP_ITEMS.find(i => i.id === 'upg_singularity_core')?.owned;
  const highTier = fac.tier === 'late' || fac.tier === 'endgame' || fac.tier === 'singularity';
  const core = (coreOn && highTier) ? 1.5 : 1;
  const milestone = milestoneMult(count);
  const raw = mul(mul(mul(count, fac.baseCps), milestone * knife * quantum * core), 1);
  return { raw, milestone, knife, quantum, core, count, perCopy: fac.baseCps };
}

function passiveGlobalLines() {
  const styles = knifeStyleBonuses();
  const turboMult = 1 + talentLevel('turbo_pipe') * 0.06;
  const goldRushMult = SHOP_ITEMS.find(i => i.id === 'upg_goldrush')?.owned ? 1.25 : 1;
  const overclockMult = SHOP_ITEMS.find(i => i.id === 'upg_factory_overclock')?.owned ? 1.25 : 1;
  const softRollsMult = 1 + talentLevel('soft_rolls') * 0.04;
  const evo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];
  const rollsMult = getRollsIncomeMult();
  const cosmicMult = Math.pow(1.08, Math.floor(talentLevel('cosmic_resonance') / 2));
  const plungersMult = getPlungersIncomeMult();
  const facOverdriveMult = 1 + (GAME.transcendUpgrades?.factoryOverdrive || 0) * 0.12;
  const cleanBuff = 1 + Math.max(0, (GAME.clean || 0) / 100) * 0.25;
  const knifePassiveMult = getKnifePassiveMult(styles.knife);
  let archMult = 1;
  if (GAME.archetype === 'tycoon') archMult = 1.5;
  else if (GAME.archetype === 'balanced') archMult = 1.15;
  const evoBlessingMult = 1 + (GAME.transcendUpgrades?.evoBlessing || 0) * 0.08;
  const omniWealthMult = SHOP_ITEMS.find(i => i.id === 'upg_omniversal_wealth')?.owned ? 1.2 : 1;
  const crystalLvl = Math.min(20, GAME.boutiqueLevels?.crystal_factory || 0);
  const crystalMult = 1 + crystalLvl * 0.05;
  const sparkLvl = Math.min(12, GAME.boutiqueLevels?.singularity_spark || 0);
  const sparkMult = 1 + sparkLvl * 0.04;
  const cosmicSynergyMult = 1 + (GAME.transcendUpgrades?.cosmicSynergy || 0) * 0.06;
  const timeWarpMult = (GAME.totalTranscend >= 5) ? 1.25 : 1;
  const riftMult = getRiftMult();
  const idealMult = getIdealMult();
  const omniRelicMult = getOmniRelicMult();
  const gearRaw = rollsMult * plungersMult * knifePassiveMult;
  const gearMult = dampenGearMult(gearRaw, getPhaseForStage(GAME.evoStage).id);
  const late = getLateComboMult();

  const gearBits = [];
  pushAboveOne(gearBits, 'Эхо смыва', rollsMult);
  pushAboveOne(gearBits, 'Вантузы', plungersMult);
  pushAboveOne(gearBits, 'Нож', knifePassiveMult);

  const lines = [];
  pushAboveOne(lines, 'Разгон заводов', turboMult);
  pushAboveOne(lines, 'Золотая лихорадка', goldRushMult);
  pushAboveOne(lines, 'Оверклок заводов', overclockMult);
  pushAboveOne(lines, 'Нож-бабочка', styles.butterfly);
  pushAboveOne(lines, 'Кристальный резонатор', crystalMult);
  pushAboveOne(lines, 'Форма', evo.mult);
  pushAboveOne(lines, 'Снаряжение', gearMult);
  pushAboveOne(lines, 'Мягкость слоёв', softRollsMult);
  pushAboveOne(lines, 'Космический резонанс', cosmicMult);
  pushAboveOne(lines, 'Омни-множитель', omniRelicMult);
  pushAboveOne(lines, 'Гипер-ускоритель', facOverdriveMult);
  pushAboveOne(lines, 'Чистота', cleanBuff);
  pushArchetype(lines, archMult);
  pushAboveOne(lines, 'Благословение форм', evoBlessingMult);
  pushAboveOne(lines, 'Эссенция омниверса', omniWealthMult);
  pushAboveOne(lines, 'Эссенция сингулярности', sparkMult);
  pushAboveOne(lines, 'Космическая синергия', cosmicSynergyMult);
  pushAboveOne(lines, 'Разлом времени', timeWarpMult);
  pushAboveOne(lines, 'Врата вечности', riftMult);
  pushAboveOne(lines, 'Идеал', idealMult);
  pushAboveOne(lines, 'Собранный билд', late);
  pushAboveOne(lines, 'Темп игры', INCOME_PACE);
  pushAboveOne(lines, 'VIP', getVipIncomeMult());
  pushAboveOne(lines, 'Горизонт', horizonIncomeMult());

  const product = turboMult * goldRushMult * overclockMult * styles.butterfly
    * crystalMult * evo.mult * gearMult * softRollsMult * cosmicMult * omniRelicMult
    * facOverdriveMult * cleanBuff * archMult * evoBlessingMult * omniWealthMult
    * sparkMult * cosmicSynergyMult * timeWarpMult * riftMult * idealMult * late
    * getIncomePace() * horizonIncomeMult();
  return { lines, gearBits, product, gearRaw, gearMult };
}

function clickParts() {
  const evo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];
  const rollsMult = getRollsIncomeMult();
  const softRollsMult = 1 + talentLevel('soft_rolls') * 0.04;
  const cosmicMult = Math.pow(1.08, Math.floor(talentLevel('cosmic_resonance') / 2));

  let totalFactories = 0;
  FACTORIES.forEach(fac => { totalFactories += (fac.count || 0); });
  const synergyMult = 1 + Math.floor(totalFactories / 10) * talentLevel('golden_synergy') * 0.03;

  const hyperStacks = Math.min(30, Math.floor((GAME.totalClicks || 0) / 500));
  const hyperMult = 1 + hyperStacks * talentLevel('hyper_click') * 0.02;

  const plungersMult = getPlungersIncomeMult();
  const omniRelicMult = getOmniRelicMult();
  const turboMult = getTurboClickMult();
  const knife = getEquippedKnife();
  const knifeClickMult = getKnifeClickMult(knife);
  const katanaBonus = knife && knife.style === 'katana'
    ? Math.min(3, 1 + Math.floor(GAME.evoStage / 50) * 0.15)
    : 1;
  const hungerBuff = 1 + Math.max(0, (GAME.hunger || 0) / 100) * 0.25;

  let archMult = 1;
  if (GAME.archetype === 'clicker') archMult = 1.5;
  else if (GAME.archetype === 'balanced') archMult = 1.15;

  const evoBlessingMult = 1 + (GAME.transcendUpgrades?.evoBlessing || 0) * 0.08;
  const equippedHatItem = GAME.equippedHat ? SHOP_ITEMS.find(i => i.id === GAME.equippedHat) : null;
  const hatLvl = equippedHatItem ? Math.min(15, getHatLevel(equippedHatItem.id)) : 1;
  const hatClickBoost = equippedHatItem ? getHatClickMult(equippedHatItem, hatLvl) : 1;
  const skinClickMult = getSkinClickMult();
  const omniWealthMult = SHOP_ITEMS.find(i => i.id === 'upg_omniversal_wealth')?.owned ? 1.2 : 1;
  const sparkLvl = Math.min(12, GAME.boutiqueLevels?.singularity_spark || 0);
  const sparkMult = 1 + sparkLvl * 0.04;
  const cosmicSynergyMult = 1 + (GAME.transcendUpgrades?.cosmicSynergy || 0) * 0.06;
  const riftMult = getRiftMult();
  const idealMult = getIdealMult();
  const gearRaw = rollsMult * plungersMult * knifeClickMult;
  const gearMult = dampenGearMult(gearRaw, getPhaseForStage(GAME.evoStage).id);
  const late = getLateComboMult();
  const product = evo.mult * gearMult * hatClickBoost * skinClickMult * softRollsMult * cosmicMult * synergyMult * hyperMult * omniRelicMult * turboMult * katanaBonus * hungerBuff * archMult * evoBlessingMult * omniWealthMult * sparkMult * cosmicSynergyMult * riftMult * idealMult * late * getIncomePace() * horizonIncomeMult();
  const syncRate = talentLevel('quantum_mastery') * 0.004 + (SHOP_ITEMS.find(i => i.id === 'upg_quantum_click')?.owned ? 0.02 : 0);

  const gearBits = [];
  pushAboveOne(gearBits, 'Эхо смыва', rollsMult);
  pushAboveOne(gearBits, 'Вантузы', plungersMult);
  pushAboveOne(gearBits, 'Нож', knifeClickMult);
  pushAboveOne(gearBits, 'Шапка', hatClickBoost);
  pushAboveOne(gearBits, 'Скин', skinClickMult);

  const lines = [];
  pushAboveOne(lines, 'Форма', evo.mult);
  pushAboveOne(lines, 'Снаряжение', gearMult);
  pushAboveOne(lines, 'Мягкость слоёв', softRollsMult);
  pushAboveOne(lines, 'Космический резонанс', cosmicMult);
  pushAboveOne(lines, 'Синергизм заводов', synergyMult);
  pushAboveOne(lines, 'Гипер-клик', hyperMult);
  pushAboveOne(lines, 'Омни-множитель', omniRelicMult);
  pushAboveOne(lines, 'Турбо', turboMult);
  pushAboveOne(lines, 'Катана', katanaBonus);
  pushAboveOne(lines, 'Сытость', hungerBuff);
  pushArchetype(lines, archMult);
  pushAboveOne(lines, 'Благословение форм', evoBlessingMult);
  pushAboveOne(lines, 'Эссенция омниверса', omniWealthMult);
  pushAboveOne(lines, 'Эссенция сингулярности', sparkMult);
  pushAboveOne(lines, 'Космическая синергия', cosmicSynergyMult);
  pushAboveOne(lines, 'Врата вечности', riftMult);
  pushAboveOne(lines, 'Идеал', idealMult);
  pushAboveOne(lines, 'Собранный билд', late);
  pushAboveOne(lines, 'Темп игры', INCOME_PACE);
  pushAboveOne(lines, 'VIP', getVipIncomeMult());
  pushAboveOne(lines, 'Горизонт', horizonIncomeMult());
  return { lines, gearBits, product, syncRate, gearRaw, gearMult };
}

function multRows(parts) {
  const rows = [];
  parts.gearBits.forEach(bit => {
    rows.push({ name: bit.name, text: `x${formatNumber(bit.value)}`, detail: true });
  });
  if (parts.gearRaw > parts.gearMult * 1.001) {
    rows.push({ name: 'Снаряжение до потолка', text: `x${formatNumber(parts.gearRaw)}`, detail: true });
  }
  parts.lines.forEach(line => {
    rows.push({ name: line.name, text: line.text || `x${formatNumber(line.value)}` });
  });
  return rows;
}

export function getClickPower() {
  const parts = clickParts();
  let basePower = parts.product;
  if (parts.syncRate > 0) {
    basePower = add(basePower, mul(getPassiveIncome(), parts.syncRate));
  }
  if (isBig(basePower)) return basePower;
  return Math.max(1, basePower);
}

export function getClickBreakdown() {
  const parts = clickParts();
  const rows = [{ name: 'База клика', text: '1' }, ...multRows(parts)];
  if (parts.syncRate > 0) {
    rows.push({ name: 'Доля дохода заводов', text: `+${formatNumber(mul(getPassiveIncome(), parts.syncRate))}` });
  }
  const critTalent = TALENTS.find(t => t.id === 'crit_master');
  const luckLvl = Math.min(20, GAME.boutiqueLevels?.golden_luck || 0);
  const happyCrit = Math.max(0, (GAME.happy || 0) / 100) * 0.20;
  const clickerCrit = GAME.archetype === 'clicker' ? 0.10 : 0;
  const critChance = Math.min(0.85, (critTalent ? 0.05 + critTalent.level * 0.004 : 0.05) + luckLvl * 0.004 + happyCrit + clickerCrit);
  const critMultiplier = 20 * (1 + (critTalent ? critTalent.level * 0.10 : 0));
  rows.push({
    name: 'Крит, отдельно от числа',
    text: `${formatNumber(critChance * 100)}% · x${formatNumber(critMultiplier)}`,
    detail: true
  });
  return {
    title: 'Сила клика',
    rows,
    total: `Итог: ${formatNumber(getClickPower())}`
  };
}

export function getPassiveIncome() {
  let base = 0;
  FACTORIES.forEach((fac, idx) => {
    base = add(base, describeFactory(fac, idx, fac.count || 0).raw);
  });
  const { product } = passiveGlobalLines();
  const scaled = mul(base, product);
  const finalGPS = isBig(scaled) ? scaled : Math.max(0, Math.round(scaled));
  if (cmp(finalGPS, GAME.currentRunPeakGPS || 0) > 0) {
    GAME.currentRunPeakGPS = finalGPS;
  }
  return finalGPS;
}

export function getPassiveBreakdown() {
  const rows = [];
  let rawSum = 0;
  FACTORIES.forEach((fac, idx) => {
    const count = fac.count || 0;
    if (!count) return;
    const stack = describeFactory(fac, idx, count);
    rawSum = add(rawSum, stack.raw);
    const extra = stack.milestone > 1.001 ? ` · веха x${formatNumber(stack.milestone)}` : '';
    rows.push({ name: `${fac.icon} ${fac.name} ×${formatNumber(count)}`, text: `${formatNumber(stack.raw)}${extra}` });
  });
  if (!rows.length) rows.push({ name: 'Заводы', text: '0' });
  rows.push({ name: 'Сырой доход всех заводов', text: formatNumber(rawSum) });
  rows.push({ kind: 'head', name: 'Множители' });
  rows.push(...multRows(passiveGlobalLines()));
  return {
    title: 'Доход заводов',
    rows,
    total: `Итог: +${formatNumber(getPassiveIncome())} /сек`
  };
}

export function getFactoryBreakdown(facId) {
  const idx = FACTORIES.findIndex(f => f.id === facId);
  const fac = FACTORIES[idx];
  if (!fac) return { title: 'Завод', rows: [], total: '' };
  const owned = fac.count || 0;
  const count = Math.max(1, owned);
  const stack = describeFactory(fac, idx, count);
  const globals = passiveGlobalLines();
  const live = Math.max(0, Math.round(stack.raw * globals.product));
  const rows = [
    { name: 'Сырой доход одной копии', text: formatNumber(fac.baseCps) },
    { name: owned > 0 ? 'Куплено штук' : 'Показ для 1 штуки', text: formatNumber(count) },
    { name: 'Число на карточке', text: formatNumber(fac.baseCps * count) }
  ];
  if (stack.milestone > 1.001) rows.push({ name: 'Веха копий', text: `x${formatNumber(stack.milestone)}` });
  if (stack.knife > 1.001) rows.push({ name: 'Нож на этом заводе', text: `x${formatNumber(stack.knife)}` });
  if (stack.quantum > 1.001) rows.push({ name: 'Квантовая репликация', text: `x${formatNumber(stack.quantum)}` });
  if (stack.core > 1.001) rows.push({ name: 'Ядро сингулярности', text: `x${formatNumber(stack.core)}` });
  rows.push({ name: 'Сырой доход с вехами', text: formatNumber(stack.raw) });
  rows.push({ kind: 'head', name: 'Множители всего дохода' });
  rows.push(...multRows(globals));
  return {
    title: fac.name,
    rows,
    total: owned > 0
      ? `Вклад в нижний доход: +${formatNumber(live)} /сек`
      : `Одна штука даст внизу: +${formatNumber(live)} /сек`
  };
}

export function getActiveBuffsList() {
  const buffs = [];

  // 1. Гипер-Кликер
  const hyperTalent = TALENTS.find(t => t.id === 'hyper_click');
  if (hyperTalent && hyperTalent.level > 0) {
    const maxHyperStacks = 30;
    const hyperStacks = Math.min(maxHyperStacks, Math.floor((GAME.totalClicks || 0) / 500));
    if (hyperStacks > 0) {
      const bonusPct = Math.round(hyperStacks * (hyperTalent.level * 2));
      buffs.push({
        id: 'hyper_click',
        icon: '👆',
        name: 'Гипер-Клик (Овердрайв)',
        short: `+${formatNumber(bonusPct)}%`,
        bonusText: `+${formatNumber(bonusPct)}% к силе клика`,
        badgeColor: 'bg-amber-950/90 border-yellow-400/80 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.25)]',
        desc: 'Талант Смыва: +2% к силе клика за каждые 500 кликов (до 30 стаков).',
        progress: `Накоплено: ${formatNumber(hyperStacks)} из ${formatNumber(maxHyperStacks)} стаков (всего кликов: ${formatNumber(GAME.totalClicks || 0)}). Уровень таланта: ${formatNumber(hyperTalent.level)}.`,
        source: 'Таланты Смыва (Тир 2)',
        tip: 'Делайте больше кликов мышкой или развивайте уровень таланта в Древе Втулок.'
      });
    }
  }

  // 2. Турбо-Ярость (Frenzy)
  if ((GAME.turboRushTime || 0) > 0) {
    const mult = getTurboClickMult();
    const starLeft = GAME.turboStarMultTime || 0;
    const starNote = starLeft > 0 ? ` · звезда ${formatNumber(Math.ceil(starLeft))}с` : '';
    buffs.push({
      id: 'turbo_rush',
      icon: '⚡',
      name: 'Турбо-Ярость (Frenzy Rush)',
      short: `x${formatNumber(mult)}${starNote}`,
      bonusText: `x${formatNumber(mult)} к силе клика`,
      badgeColor: 'bg-red-950/90 border-red-500/80 text-red-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]',
      desc: 'Временный ураганный режим! Сила клика колоссально умножается во время ярости. Звезда на время удваивает этот множитель.',
      progress: starLeft > 0
        ? `Звезда удваивает турбо ещё ${formatNumber(Math.ceil(starLeft))} сек. Клики это время не продлевают.`
        : `Турбо держится, пока идут клики. База: x${formatNumber(GAME.archetype === 'combo' ? 6 : 4)}.`,
      source: 'Быстрые клики (Комбо) / Золотой метеорит',
      tip: 'Кликайте, чтобы не дать турбо погаснуть. Звезда на 12 секунд удваивает его множитель.'
    });
  }

  // 3. Статус «Идеал x2»
  if (isIdealPet()) {
    buffs.push({
      id: 'ideal_status',
      icon: '👑',
      name: 'Статус «Идеал»',
      short: '+20% Доход',
      bonusText: '+20% ко всему доходу, пока все потребности выше 90%',
      badgeColor: 'bg-yellow-950 border-yellow-300 text-yellow-300',
      desc: 'Сытость, чистота и настроение выше 90%. Доход выше, пока уход держится.',
      progress: `Сытость: ${formatNumber(Math.round(GAME.hunger))}% | Чистота: ${formatNumber(Math.round(GAME.clean))}% | Настроение: ${formatNumber(Math.round(GAME.happy))}%`,
      source: 'Станция Заботы о Питомце',
      tip: 'Кормите, мойте и щекочите питомца, либо включите авто-уход.'
    });
  }

  // 4. Священный Синергизм Заводов
  const synergyTalent = TALENTS.find(t => t.id === 'golden_synergy');
  if (synergyTalent && synergyTalent.level > 0) {
    let totalFactories = 0;
    FACTORIES.forEach(fac => { totalFactories += (fac.count || 0); });
    const factoryBlocks = Math.floor(totalFactories / 10);
    if (factoryBlocks > 0) {
      const bonusPct = Math.round(factoryBlocks * (synergyTalent.level * 3));
      buffs.push({
        id: 'golden_synergy',
        icon: '🏭',
        name: 'Священный Синергизм Заводов',
        short: `+${formatNumber(bonusPct)}%`,
        bonusText: `+${formatNumber(bonusPct)}% к силе клика`,
        badgeColor: 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
        desc: 'За каждые 10 купленных заводов сила клика растёт на +3% за уровень таланта.',
        progress: `Куплено заводов: ${formatNumber(totalFactories)} (активных десятков: ${formatNumber(factoryBlocks)}). Уровень таланта: ${formatNumber(synergyTalent.level)}.`,
        source: 'Таланты Смыва (Тир 3)',
        tip: 'Покупайте больше недорогих заводов в панели заводов, чтобы увеличивать количество десятков.'
      });
    }
  }

  // 5. Сытость Питомца
  const hungerVal = Math.max(0, GAME.hunger ?? 100);
  if (hungerVal > 20) {
    const hungerPct = Math.round((hungerVal / 100) * 25);
    buffs.push({
      id: 'pet_hunger',
      icon: '🍗',
      name: 'Сытость Питомца',
      short: `+${formatNumber(hungerPct)}%`,
      bonusText: `+${formatNumber(hungerPct)}% к силе клика`,
      badgeColor: 'bg-orange-950/80 border-orange-500/50 text-orange-200',
      desc: 'Сытость даёт до +25% к силе ручного клика.',
      progress: `Текущая сытость: ${formatNumber(Math.round(hungerVal))}% из 100%`,
      source: 'Станция Заботы (Сытость)',
      tip: 'Регулярно жмите "Покормить 🍗" или активируйте авто-кормление.'
    });
  }

  // 6. Чистота Питомца (бонус к пассивному доходу заводов)
  const cleanVal = Math.max(0, GAME.clean || 0);
  if (cleanVal > 20) {
    const cleanPct = Math.round((cleanVal / 100) * 25);
    buffs.push({
      id: 'pet_clean',
      icon: '🧼',
      name: 'Чистота и Гигиена',
      short: `+${formatNumber(cleanPct)}%`,
      bonusText: `+${formatNumber(cleanPct)}% к пассивному доходу`,
      badgeColor: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200',
      desc: 'Чистота даёт до +25% к пассивному доходу заводов.',
      progress: `Текущая чистота: ${formatNumber(Math.round(cleanVal))}% из 100%`,
      source: 'Станция Заботы (Чистота)',
      tip: 'Регулярно жмите "Помыть 🧼" чтобы не давать фабрикам замедляться.'
    });
  }

  // 7. Экипированный Нож
  const knife = getEquippedKnife();
  if (knife) {
    const knifeStar = getKnifeStar(knife.id);
    const knifeClickMult = getKnifeClickMult(knife);
    buffs.push({
      id: 'equipped_knife',
      icon: '🔪',
      name: `Оружие: ${knife.name}`,
      short: `x${formatNumber(knifeClickMult)}`,
      bonusText: `x${formatNumber(knifeClickMult)} к клику`,
      badgeColor: 'bg-stone-900 border-amber-400 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.2)]',
      desc: `Боевой нож из контейнера. Умножает базовую силу клика пропорционально редкости и уровню заточки.`,
      progress: `Качество: ${knife.rarity || 'Армейское'} | Заточка: ${knifeStar}★ (${knife.knifeType || 'Нож'})`,
      source: 'Инвентарь персонажа',
      tip: 'Затачивайте нож в Инвентаре за Блестяшки или выбивайте ножи более высокой редкости из кейсов.'
    });
  }

  // 8. Астральный Прорыв (Вантузы)
  const plungerCount = Math.max(0, GAME.transcendPlungers || 0);
  if (plungerCount > 0 || (GAME.totalTranscend || 0) > 0) {
    const plungersMult = getPlungersIncomeMult();
    buffs.push({
      id: 'astral_plungers',
      icon: '🪠',
      name: 'Сила Астральных Вантузов',
      short: `x${formatNumber(plungersMult)}`,
      bonusText: `x${formatNumber(plungersMult)} ко всему доходу и клику`,
      badgeColor: 'bg-indigo-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
      desc: 'Священная космическая валюта 2-го престижа фундаментально умножает все показатели игры.',
      progress: `Баланс: ${formatNumber(plungerCount)} 🪠 | Совершено Прорывов: ${formatNumber(GAME.totalTranscend || 0)}`,
      source: 'Астральный Прорыв',
      tip: 'Совершайте новые Прорывы и покупайте реликвию "Мульти-Омниверс" в ветке Прорыва.'
    });
  }

  // 9. Смыв Судьбы (Втулки)
  if ((GAME.totalPrestiges || 0) > 0) {
    const rollsMult = getRollsIncomeMult();
    const totalRolls = Math.max(GAME.allTimePrestigeRolls || 0, GAME.prestigeRolls || 0);
    buffs.push({
      id: 'prestige_rolls',
      icon: '🌀',
      name: 'Мудрость Смыва Судьбы',
      short: `x${formatNumber(rollsMult)}`,
      bonusText: `x${formatNumber(rollsMult)} ко всему доходу`,
      badgeColor: 'bg-purple-950/90 border-yellow-400 text-yellow-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
      desc: 'Пока пара эпох открыта, первый смыв даёт x2, повторы ползут к x3. Прорыв ставит всей паре x3 и это не режется. Смыв после этого даёт втулки, а вантуз — только с чётной эпохи открытой пары.',
      progress: `Смывов совершено: ${formatNumber(GAME.totalPrestiges)} | Втулок в кошельке: ${formatNumber(totalRolls)} 🧻`,
      source: 'Смыв Судьбы',
      tip: 'Совершайте регулярные Смывы при достижении высоких наград Втулок.'
    });
  }

  return buffs;
}
