import { GAME } from '../core/state.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { FACTORIES } from '../data/factories.data.js';
import { TALENTS } from '../data/talents.data.js';
import { KNIVES } from '../data/knives.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';

export function getEquippedKnife() {
  if (!GAME.equippedKnife) return null;
  return KNIVES.find(k => k.id === GAME.equippedKnife) || null;
}

export function getKnifeStar(knifeId) {
  if (!GAME.knifeStars) GAME.knifeStars = {};
  return GAME.knifeStars[knifeId] || 1;
}

export function getClickPower() {
  const evo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];

  // Permanent prestige passive boost based on all rolls earned (power-law curve: no runaway snowball)
  const totalRolls = Math.max(GAME.allTimePrestigeRolls || 0, GAME.prestigeRolls || 0);
  const prestigePassiveBoost = 1 + Math.pow(Math.max(0, totalRolls), 0.45) * 0.25;
  const totalPrestigesBoost = 1 + (GAME.totalPrestiges * 0.35);
  const rollsMult = prestigePassiveBoost * totalPrestigesBoost;

  // Direct Talent Multipliers (strictly increase power)
  const softRolls = TALENTS.find(t => t.id === 'soft_rolls');
  const softRollsMult = 1 + (softRolls ? softRolls.level * 0.25 : 0);

  const omniMastery = TALENTS.find(t => t.id === 'omni_mastery');
  const omniMasteryMult = 1 + (omniMastery ? omniMastery.level * 0.30 : 0);

  const cosmicRes = TALENTS.find(t => t.id === 'cosmic_resonance');
  const cosmicMult = cosmicRes ? Math.pow(1.5, Math.floor(cosmicRes.level / 2)) : 1;

  let totalFactories = 0;
  FACTORIES.forEach(fac => { totalFactories += (fac.count || 0); });
  const synergyTalent = TALENTS.find(t => t.id === 'golden_synergy');
  const synergyMult = 1 + (synergyTalent ? Math.floor(totalFactories / 10) * (synergyTalent.level * 1.5) : 0);

  const hyperTalent = TALENTS.find(t => t.id === 'hyper_click');
  const hyperMult = 1 + (hyperTalent ? Math.floor(GAME.totalClicks / 500) * (hyperTalent.level * 0.05) : 0);

  // Astral Plungers Tier 2 Breakthrough power-law scaling (safe against big number overflow)
  const omniLvl = GAME.transcendUpgrades?.omniMult || 0;
  const plungerCount = Math.max(0, GAME.transcendPlungers || 0);
  const plungersMult = Math.pow(1 + plungerCount * (1 + omniLvl * 0.25), 1.25);

  // Turbo Frenzy Rush (Combo Master archetype: x15 base instead of x10)
  const isComboArch = GAME.archetype === 'combo';
  const turboBase = isComboArch ? 15.0 : 10.0;
  const turboTalent = TALENTS.find(t => t.id === 'combo_master');
  const turboBonus = 1 + (turboTalent ? turboTalent.level * 0.50 : 0);
  const turboMult = GAME.turboRushTime > 0 ? (turboBase * turboBonus) : 1.0;

  // Equipped Knife Multiplier + Stars + Forge Artifact + Boutique Diamond Sharpening
  const knife = getEquippedKnife();
  const knifeStar = knife ? getKnifeStar(knife.id) : 1;
  const knifeForgeBoost = 1 + (GAME.transcendUpgrades?.knifeForge || 0) * 0.30;
  const diamondLvl = GAME.boutiqueLevels?.diamond_sharpening || 0;
  const diamondBoost = 1 + diamondLvl * 0.15;
  
  // Soft-cap high knife multipliers to prevent early game destruction
  let rawKnifeClick = knife ? knife.clickMult : 1.0;
  let effectiveKnifeClick = rawKnifeClick > 50 ? (50 + Math.pow(rawKnifeClick - 50, 0.65)) : rawKnifeClick;
  const knifeClickMult = knife ? (effectiveKnifeClick * (1 + (knifeStar - 1) * 0.35) * knifeForgeBoost * diamondBoost) : 1.0;

  // Knife Synergy: Katana boosts Click Power by +15% per 50 evolution forms
  const knifeStyle = knife ? knife.style : '';
  const katanaBonus = knifeStyle === 'katana' ? (1 + Math.floor(GAME.evoStage / 50) * 0.15) : 1.0;

  // Meaningful Pet Hunger Buff (+0% to +50% Click Power based on hunger)
  const hungerBuff = 1 + Math.max(0, (GAME.hunger || 100) / 100) * 0.50;

  // Archetype specialization multiplier (+50% Click for 'clicker', +15% for 'balanced')
  let archMult = 1.0;
  if (GAME.archetype === 'clicker') archMult = 1.50;
  else if (GAME.archetype === 'balanced') archMult = 1.15;

  const evoBlessingMult = 1 + (GAME.transcendUpgrades?.evoBlessing || 0) * 0.50;

  // Hat click boost from Boutique
  const equippedHatItem = GAME.equippedHat ? SHOP_ITEMS.find(i => i.id === GAME.equippedHat) : null;
  const hatClickBoost = equippedHatItem ? (equippedHatItem.clickBoost || 1.0) : 1.0;

  // Boutique Perk: Omniversal Wealth (+100% all income)
  const omniWealthActive = SHOP_ITEMS.find(i => i.id === 'upg_omniversal_wealth')?.owned;
  const omniWealthMult = omniWealthActive ? 2.0 : 1.0;

  // Boutique Repeatable: Singularity Spark (+25% all income per level)
  const sparkLvl = GAME.boutiqueLevels?.singularity_spark || 0;
  // Transcendence Artifact: Cosmic Synergy (+50% per level)
  const cosmicSynergyLvl = GAME.transcendUpgrades?.cosmicSynergy || 0;
  const cosmicSynergyMult = 1 + cosmicSynergyLvl * 0.50;

  let basePower = (1 + GAME.evoStage * 0.5) * evo.mult * rollsMult * softRollsMult * omniMasteryMult * cosmicMult * synergyMult * hyperMult * plungersMult * turboMult * knifeClickMult * katanaBonus * hungerBuff * archMult * evoBlessingMult * hatClickBoost * omniWealthMult * sparkMult * cosmicSynergyMult;

  // Quantum Mastery talent + Quantum Click upgrade: direct transfer of passive GPS to click
  const qMastery = TALENTS.find(t => t.id === 'quantum_mastery');
  const qClickActive = SHOP_ITEMS.find(i => i.id === 'upg_quantum_click')?.owned;
  const syncRate = (qMastery ? qMastery.level * 0.01 : 0) + (qClickActive ? 0.02 : 0);
  if (syncRate > 0) {
    basePower += getPassiveIncome() * syncRate;
  }

  return Math.max(1, Math.round(basePower));
}

export function getPassiveIncome() {
  let base = 0;
  const turbo = TALENTS.find(t => t.id === 'turbo_pipe');
  const turboMult = 1 + (turbo ? turbo.level * 0.35 : 0);
  const goldRushActive = SHOP_ITEMS.find(i => i.id === 'upg_goldrush')?.owned;
  const goldRushMult = goldRushActive ? 2.0 : 1.0;
  const overclockActive = SHOP_ITEMS.find(i => i.id === 'upg_factory_overclock')?.owned;
  const overclockMult = overclockActive ? 2.0 : 1.0;

  const qRepl = TALENTS.find(t => t.id === 'quantum_replication');
  const qReplMult = 1 + (qRepl ? qRepl.level * 0.50 : 0);

  const softRolls = TALENTS.find(t => t.id === 'soft_rolls');
  const softRollsMult = 1 + (softRolls ? softRolls.level * 0.25 : 0);

  const omniMastery = TALENTS.find(t => t.id === 'omni_mastery');
  const omniMasteryMult = 1 + (omniMastery ? omniMastery.level * 0.30 : 0);

  const knife = getEquippedKnife();
  const knifeStyle = knife ? knife.style : '';

  // Knife Tactical Synergies on specific factory brackets
  const earlyBladeBonus = ['daggers', 'navaja', 'stiletto'].includes(knifeStyle) ? 1.50 : 1.0;
  const heavyBladeBonus = ['bayonet', 'm9', 'bowie', 'huntsman'].includes(knifeStyle) ? 1.40 : 1.0;
  const butterflyBladeBonus = knifeStyle === 'butterfly' ? 1.20 : 1.0;

  FACTORIES.forEach((fac, idx) => {
    let facMilestoneMult = 1;
    if (fac.count >= 25) facMilestoneMult *= 2;
    if (fac.count >= 50) facMilestoneMult *= 2;
    if (fac.count >= 100) facMilestoneMult *= 4;
    if (fac.count >= 200) facMilestoneMult *= 4;
    if (fac.count >= 500) facMilestoneMult *= 8;
    if (fac.count >= 1000) {
      facMilestoneMult *= 16;
      const extraThousands = Math.floor((fac.count - 1000) / 1000);
      if (extraThousands > 0) {
        facMilestoneMult *= Math.pow(10, extraThousands);
      }
    }

    let tierKnifeMult = 1.0;
    if (idx < 5) tierKnifeMult = earlyBladeBonus;
    else if (idx >= 5 && idx < 12) tierKnifeMult = heavyBladeBonus;

    const tierQuantumMult = idx >= 10 ? qReplMult : 1.0;

    // Singularity Core Boutique Perk: x3 to cosmic and singularity tier factories
    const singularityCoreActive = SHOP_ITEMS.find(i => i.id === 'upg_singularity_core')?.owned;
    const singularityCoreMult = (singularityCoreActive && (fac.tier === 'cosmic' || fac.tier === 'singularity' || fac.tier === 'endgame')) ? 3.0 : 1.0;

    base += (fac.count || 0) * fac.baseCps * facMilestoneMult * tierKnifeMult * tierQuantumMult * singularityCoreMult;
  });

  base *= turboMult * goldRushMult * overclockMult * butterflyBladeBonus;

  // Evolution Stage multiplier
  const evo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];

  // Permanent prestige passive boost based on all rolls earned (power-law curve: no runaway snowball)
  const totalRolls = Math.max(GAME.allTimePrestigeRolls || 0, GAME.prestigeRolls || 0);
  const prestigePassiveBoost = 1 + Math.pow(Math.max(0, totalRolls), 0.45) * 0.25;
  const totalPrestigesBoost = 1 + (GAME.totalPrestiges * 0.35);
  const rollsMult = prestigePassiveBoost * totalPrestigesBoost;

  const cosmicRes = TALENTS.find(t => t.id === 'cosmic_resonance');
  const cosmicMult = cosmicRes ? Math.pow(1.5, Math.floor(cosmicRes.level / 2)) : 1;

  // Astral Plungers Tier 2 Breakthrough power-law scaling (safe against big number overflow)
  const omniLvl = GAME.transcendUpgrades?.omniMult || 0;
  const plungerCount = Math.max(0, GAME.transcendPlungers || 0);
  const plungersMult = Math.pow(1 + plungerCount * (1 + omniLvl * 0.25), 1.25);

  // Transcendence Artifact: Factory Overdrive
  const facOverdriveMult = 1 + (GAME.transcendUpgrades?.factoryOverdrive || 0) * 1.0;

  // Pet Clean Buff (+0% to +40% passive income based on clean meter)
  const cleanBuff = 1 + Math.max(0, (GAME.clean || 100) / 100) * 0.40;

  // Equipped Knife Multiplier + Stars + Forge Artifact + Boutique Diamond Sharpening
  const knifeStar = knife ? getKnifeStar(knife.id) : 1;
  const knifeForgeBoost = 1 + (GAME.transcendUpgrades?.knifeForge || 0) * 0.30;
  const diamondLvl = GAME.boutiqueLevels?.diamond_sharpening || 0;
  const diamondBoost = 1 + diamondLvl * 0.15;
  let rawKnifePass = knife ? knife.passiveMult : 1.0;
  let effectiveKnifePass = rawKnifePass > 30 ? (30 + Math.pow(rawKnifePass - 30, 0.65)) : rawKnifePass;
  const knifePassiveMult = knife ? (effectiveKnifePass * (1 + (knifeStar - 1) * 0.25) * knifeForgeBoost * diamondBoost) : 1.0;

  // Archetype specialization multiplier (+50% passive for 'tycoon', +15% for 'balanced')
  let archMult = 1.0;
  if (GAME.archetype === 'tycoon') archMult = 1.50;
  else if (GAME.archetype === 'balanced') archMult = 1.15;

  // Evolution Chapter Synergy: +2% passive per 100 stages unlocked
  const chapterSynergy = 1 + Math.floor(GAME.evoStage / 100) * 0.02;

  const evoBlessingMult = 1 + (GAME.transcendUpgrades?.evoBlessing || 0) * 0.50;

  // Omniversal Wealth Boutique Perk: x2 to all passive income
  const omniWealthActive = SHOP_ITEMS.find(i => i.id === 'upg_omniversal_wealth')?.owned;
  const omniWealthMult = omniWealthActive ? 2.0 : 1.0;

  // Boutique Repeatables: Crystal Factory & Singularity Spark
  const crystalLvl = GAME.boutiqueLevels?.crystal_factory || 0;
  const crystalMult = 1 + crystalLvl * 0.20;
  const sparkLvl = GAME.boutiqueLevels?.singularity_spark || 0;
  const sparkMult = 1 + sparkLvl * 0.25;

  // Transcendence Artifact: Cosmic Synergy (+50% per level)
  const cosmicSynergyLvl = GAME.transcendUpgrades?.cosmicSynergy || 0;
  const cosmicSynergyMult = 1 + cosmicSynergyLvl * 0.50;

  const finalGPS = Math.max(0, Math.round(base * crystalMult * evo.mult * rollsMult * softRollsMult * omniMasteryMult * cosmicMult * plungersMult * facOverdriveMult * cleanBuff * knifePassiveMult * archMult * chapterSynergy * evoBlessingMult * omniWealthMult * sparkMult * cosmicSynergyMult));
  if (finalGPS > (GAME.currentRunPeakGPS || 0)) {
    GAME.currentRunPeakGPS = finalGPS;
  }
  return finalGPS;
}
