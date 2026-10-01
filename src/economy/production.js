import { GAME } from '../core/state.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { FACTORIES } from '../data/factories.data.js';
import { TALENTS } from '../data/talents.data.js';
import { KNIVES } from '../data/knives.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { formatNumber } from '../utils/numberFormatter.js';

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

export function getClickPower() {
  const evo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];

  // Permanent prestige passive boost based on all rolls earned (power-law curve: no runaway snowball)
  const totalRolls = Math.max(GAME.allTimePrestigeRolls || 0, GAME.prestigeRolls || 0);
  const rollPower = (GAME.totalPrestiges >= 25) ? 0.50 : 0.25; // Смыв #25: Втулочная Империя (удвоенный бонус)
  const prestigePassiveBoost = 1 + Math.pow(Math.max(0, totalRolls), 0.45) * rollPower;
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
  const maxHyperStacks = 50;
  const hyperStacks = Math.min(maxHyperStacks, Math.floor((GAME.totalClicks || 0) / 500));
  const hyperMult = 1 + (hyperTalent ? hyperStacks * (hyperTalent.level * 0.05) : 0);

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

  // Hat click boost from Boutique (enhanced with Gem Inlaying)
  const equippedHatItem = GAME.equippedHat ? SHOP_ITEMS.find(i => i.id === GAME.equippedHat) : null;
  const hatLvl = equippedHatItem ? getHatLevel(equippedHatItem.id) : 1;
  const hatClickBoost = equippedHatItem ? ((equippedHatItem.clickBoost || 1.0) * (1 + (hatLvl - 1) * 0.35)) : 1.0;

  // Boutique Perk: Omniversal Wealth (+100% all income)
  const omniWealthActive = SHOP_ITEMS.find(i => i.id === 'upg_omniversal_wealth')?.owned;
  const omniWealthMult = omniWealthActive ? 2.0 : 1.0;

  // Boutique Repeatable: Singularity Spark (+25% all income per level)
  const sparkLvl = GAME.boutiqueLevels?.singularity_spark || 0;
  const sparkMult = 1 + sparkLvl * 0.25;
  // Transcendence Artifact: Cosmic Synergy (+50% per level)
  const cosmicSynergyLvl = GAME.transcendUpgrades?.cosmicSynergy || 0;
  const cosmicSynergyMult = 1 + cosmicSynergyLvl * 0.50;
  // Transcendence Artifact: Singularity Rift (x2 all income)
  const riftMult = GAME.transcendUpgrades?.singularityRift ? 2.0 : 1.0;

  let basePower = (1 + GAME.evoStage * 0.5) * evo.mult * rollsMult * softRollsMult * omniMasteryMult * cosmicMult * synergyMult * hyperMult * plungersMult * turboMult * knifeClickMult * katanaBonus * hungerBuff * archMult * evoBlessingMult * hatClickBoost * omniWealthMult * sparkMult * cosmicSynergyMult * riftMult;

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
  const rollPower = (GAME.totalPrestiges >= 25) ? 0.50 : 0.25; // Смыв #25: Втулочная Империя (удвоенный бонус)
  const prestigePassiveBoost = 1 + Math.pow(Math.max(0, totalRolls), 0.45) * rollPower;
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
  // Transcendence Milestone #5: Time Warp (+25% factory speed)
  const timeWarpMult = (GAME.totalTranscend >= 5) ? 1.25 : 1.0;
  // Transcendence Artifact: Singularity Rift (x2 all income)
  const riftMult = GAME.transcendUpgrades?.singularityRift ? 2.0 : 1.0;

  const finalGPS = Math.max(0, Math.round(base * crystalMult * evo.mult * rollsMult * softRollsMult * omniMasteryMult * cosmicMult * plungersMult * facOverdriveMult * cleanBuff * knifePassiveMult * archMult * chapterSynergy * evoBlessingMult * omniWealthMult * sparkMult * cosmicSynergyMult * timeWarpMult * riftMult));
  if (finalGPS > (GAME.currentRunPeakGPS || 0)) {
    GAME.currentRunPeakGPS = finalGPS;
  }
  return finalGPS;
}

export function getActiveBuffsList() {
  const buffs = [];

  // 1. Гипер-Кликер
  const hyperTalent = TALENTS.find(t => t.id === 'hyper_click');
  if (hyperTalent && hyperTalent.level > 0) {
    const maxHyperStacks = 50;
    const hyperStacks = Math.min(maxHyperStacks, Math.floor((GAME.totalClicks || 0) / 500));
    if (hyperStacks > 0) {
      const bonusPct = Math.round(hyperStacks * (hyperTalent.level * 5));
      buffs.push({
        id: 'hyper_click',
        icon: '👆',
        name: 'Гипер-Клик (Овердрайв)',
        short: `+${bonusPct}%`,
        bonusText: `+${bonusPct}% к силе клика`,
        badgeColor: 'bg-amber-950/90 border-yellow-400/80 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.25)]',
        desc: 'Талант Смыва 2-го Тира: увеличивает силу каждого клика на +5% за каждые 500 сделанных кликов.',
        progress: `Накоплено: ${hyperStacks} из ${maxHyperStacks} стаков (всего кликов: ${formatNumber(GAME.totalClicks || 0)}). Уровень таланта: ${hyperTalent.level}.`,
        source: 'Таланты Смыва (Тир 2)',
        tip: 'Делайте больше кликов мышкой или развивайте уровень таланта в Древе Втулок.'
      });
    }
  }

  // 2. Турбо-Ярость (Frenzy)
  if ((GAME.turboRushTime || 0) > 0) {
    const isComboArch = GAME.archetype === 'combo';
    const turboBase = isComboArch ? 15.0 : 10.0;
    const turboTalent = TALENTS.find(t => t.id === 'combo_master');
    const turboBonus = 1 + (turboTalent ? turboTalent.level * 0.50 : 0);
    const mult = Math.round(turboBase * turboBonus);
    buffs.push({
      id: 'turbo_rush',
      icon: '⚡',
      name: 'Турбо-Ярость (Frenzy Rush)',
      short: `x${mult} (${Math.ceil(GAME.turboRushTime)}с)`,
      bonusText: `x${mult} к силе клика`,
      badgeColor: 'bg-red-950/90 border-red-500/80 text-red-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]',
      desc: 'Временный ураганный режим! Сила клика колоссально умножается во время ярости.',
      progress: `Осталось действия: ${Math.ceil(GAME.turboRushTime)} сек. Базовый множитель: x${turboBase}.`,
      source: 'Быстрые клики (Комбо) / Золотой метеорит',
      tip: 'Кликайте чаще чтобы продлить ярость, или ловите золотые метеориты!'
    });
  }

  // 3. Статус «Идеал x2»
  if ((GAME.hunger || 0) >= 90 && (GAME.cleanliness || 0) >= 90 && (GAME.happiness || 0) >= 90) {
    buffs.push({
      id: 'ideal_status',
      icon: '👑',
      name: 'Статус «Идеал x2»',
      short: 'x2 Доход',
      bonusText: 'x2 ко всему доходу и критам',
      badgeColor: 'bg-gradient-to-r from-yellow-950 to-amber-900 border-yellow-300 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]',
      desc: 'Все 3 потребности питомца (Сытость, Чистота, Настроение) выше 90%! Питомец полностью счастлив и благодарит вас удвоенным производством.',
      progress: `Сытость: ${Math.round(GAME.hunger)}% | Чистота: ${Math.round(GAME.cleanliness)}% | Настроение: ${Math.round(GAME.happiness)}%`,
      source: 'Станция Заботы о Питомце',
      tip: 'Используйте кнопки ухода (Покормить, Помыть, Пощекотать) или включите Авто-Уход Прорыва.'
    });
  }

  // 4. Священный Синергизм Заводов
  const synergyTalent = TALENTS.find(t => t.id === 'golden_synergy');
  if (synergyTalent && synergyTalent.level > 0) {
    let totalFactories = 0;
    FACTORIES.forEach(fac => { totalFactories += (fac.count || 0); });
    const factoryBlocks = Math.floor(totalFactories / 10);
    if (factoryBlocks > 0) {
      const bonusPct = Math.round(factoryBlocks * (synergyTalent.level * 150));
      buffs.push({
        id: 'golden_synergy',
        icon: '🏭',
        name: 'Священный Синергизм Заводов',
        short: `+${bonusPct}%`,
        bonusText: `+${bonusPct}% к силе клика`,
        badgeColor: 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
        desc: 'Талант Смыва 3-го Тира: за каждые 10 суммарно купленных заводов сила клика возрастает на +150% за уровень.',
        progress: `Куплено заводов: ${formatNumber(totalFactories)} (активных десятков: ${formatNumber(factoryBlocks)}). Уровень таланта: ${synergyTalent.level}.`,
        source: 'Таланты Смыва (Тир 3)',
        tip: 'Покупайте больше недорогих заводов в панели заводов, чтобы увеличивать количество десятков.'
      });
    }
  }

  // 5. Сытость Питомца
  const hungerVal = Math.max(0, GAME.hunger || 100);
  if (hungerVal > 20) {
    const hungerPct = Math.round((hungerVal / 100) * 50);
    buffs.push({
      id: 'pet_hunger',
      icon: '🍗',
      name: 'Сытость Питомца',
      short: `+${hungerPct}%`,
      bonusText: `+${hungerPct}% к силе клика`,
      badgeColor: 'bg-orange-950/80 border-orange-500/50 text-orange-200',
      desc: 'Качественное органическое питание наполняет какашечку энергией, давая до +50% к силе ручного клика.',
      progress: `Текущая сытость: ${Math.round(hungerVal)}% из 100%`,
      source: 'Станция Заботы (Сытость)',
      tip: 'Регулярно жмите "Покормить 🍗" или активируйте авто-кормление.'
    });
  }

  // 6. Чистота Питомца (Бонус к пассивному CPS)
  const cleanVal = Math.max(0, GAME.cleanliness || 100);
  if (cleanVal > 20) {
    const cleanPct = Math.round((cleanVal / 100) * 50);
    buffs.push({
      id: 'pet_clean',
      icon: '🧼',
      name: 'Чистота и Гигиена',
      short: `+${cleanPct}% CPS`,
      bonusText: `+${cleanPct}% к пассивному доходу`,
      badgeColor: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200',
      desc: 'Чистота стимулирует непрерывную работу всех био-перерабатывающих фабрик (до +50% к пассивному доходу).',
      progress: `Текущая чистота: ${Math.round(cleanVal)}% из 100%`,
      source: 'Станция Заботы (Чистота)',
      tip: 'Регулярно жмите "Помыть 🧼" чтобы не давать фабрикам замедляться.'
    });
  }

  // 7. Экипированный Нож
  const knife = getEquippedKnife();
  if (knife) {
    const knifeStar = getKnifeStar(knife.id);
    const knifeForgeBoost = 1 + (GAME.transcendUpgrades?.knifeForge || 0) * 0.30;
    const diamondLvl = GAME.boutiqueLevels?.diamond_sharpening || 0;
    const diamondBoost = 1 + diamondLvl * 0.15;
    let rawKnifeClick = knife.clickMult || 1.0;
    let effectiveKnifeClick = rawKnifeClick > 50 ? (50 + Math.pow(rawKnifeClick - 50, 0.65)) : rawKnifeClick;
    const knifeClickMult = (effectiveKnifeClick * (1 + (knifeStar - 1) * 0.35) * knifeForgeBoost * diamondBoost).toFixed(1);
    buffs.push({
      id: 'equipped_knife',
      icon: '🔪',
      name: `Оружие: ${knife.name}`,
      short: `x${knifeClickMult}`,
      bonusText: `x${knifeClickMult} к клику`,
      badgeColor: 'bg-stone-900 border-amber-400 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.2)]',
      desc: `Боевой нож из кейса CS:GO. Умножает базовую силу клика пропорционально редкости и уровню заточки.`,
      progress: `Качество: ${knife.rarity || 'Армейское'} | Заточка: ${knifeStar}★ (${knife.knifeType || 'Нож'})`,
      source: 'Инвентарь персонажа',
      tip: 'Затачивайте нож в Инвентаре за Блестяшки или выбивайте ножи более высокой редкости из кейсов.'
    });
  }

  // 8. Астральный Прорыв (Вантузы)
  const plungerCount = Math.max(0, GAME.transcendPlungers || 0);
  if (plungerCount > 0 || (GAME.totalTranscend || 0) > 0) {
    const omniLvl = GAME.transcendUpgrades?.omniMult || 0;
    const plungersMult = Math.pow(1 + plungerCount * (1 + omniLvl * 0.25), 1.25).toFixed(1);
    buffs.push({
      id: 'astral_plungers',
      icon: '🪠',
      name: 'Сила Астральных Вантузов',
      short: `x${plungersMult}`,
      bonusText: `x${plungersMult} ко всему доходу и клику`,
      badgeColor: 'bg-indigo-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
      desc: 'Священная космическая валюта 2-го престижа фундаментально умножает все показатели игры.',
      progress: `Баланс: ${formatNumber(plungerCount)} 🪠 | Совершено Прорывов: ${formatNumber(GAME.totalTranscend || 0)}`,
      source: 'Астральный Прорыв',
      tip: 'Совершайте новые Прорывы и покупайте реликвию "Мульти-Омниверс" в ветке Прорыва.'
    });
  }

  // 9. Смыв Судьбы (Втулки)
  if ((GAME.totalPrestiges || 0) > 0) {
    const totalRolls = Math.max(GAME.allTimePrestigeRolls || 0, GAME.prestigeRolls || 0);
    const rollPower = (GAME.totalPrestiges >= 25) ? 0.50 : 0.25;
    const boostPct = Math.round((Math.pow(Math.max(0, totalRolls), 0.45) * rollPower + (GAME.totalPrestiges * 0.35)) * 100);
    buffs.push({
      id: 'prestige_rolls',
      icon: '🌀',
      name: 'Мудрость Смыва Судьбы',
      short: `+${boostPct}%`,
      bonusText: `+${boostPct}% ко всему доходу`,
      badgeColor: 'bg-purple-950/90 border-yellow-400 text-yellow-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
      desc: 'Постоянный множитель от всех завершенных циклов Смыва и накопленных Втулок Судьбы.',
      progress: `Смывов совершено: ${formatNumber(GAME.totalPrestiges)} | Втулок: ${formatNumber(totalRolls)} 🧻`,
      source: 'Смыв Судьбы',
      tip: 'Совершайте регулярные Смывы при достижении высоких наград Втулок.'
    });
  }

  return buffs;
}
