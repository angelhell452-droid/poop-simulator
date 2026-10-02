import { GAME } from '../core/state.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { FACTORIES } from '../data/factories.data.js';
import { TALENTS } from '../data/talents.data.js';
import { KNIVES } from '../data/knives.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getIdealMult, getOmniRelicMult, getPlungersIncomeMult, getRiftMult, getRollsIncomeMult, isIdealPet } from './metaMultipliers.js';

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

function talentLevel(id) {
  return TALENTS.find(t => t.id === id)?.level || 0;
}

function softCap(raw, knee, power) {
  return raw > knee ? (knee + Math.pow(raw - knee, power)) : raw;
}

export function getClickPower() {
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

  const turboBase = GAME.archetype === 'combo' ? 6 : 4;
  const turboBonus = 1 + talentLevel('combo_master') * 0.15;
  const turboMult = GAME.turboRushTime > 0 ? (turboBase * turboBonus) : 1;

  const knife = getEquippedKnife();
  const knifeStar = knife ? getKnifeStar(knife.id) : 1;
  const knifeForgeBoost = 1 + (GAME.transcendUpgrades?.knifeForge || 0) * 0.08;
  const diamondLvl = Math.min(20, GAME.boutiqueLevels?.diamond_sharpening || 0);
  const diamondBoost = 1 + diamondLvl * 0.05;
  const starForgeMult = 1 + talentLevel('star_forge_master') * 0.05;
  const rawKnifeClick = knife ? knife.clickMult : 1;
  const effectiveKnifeClick = softCap(rawKnifeClick, 50, 0.65);
  const knifeClickMult = knife
    ? (effectiveKnifeClick * (1 + (knifeStar - 1) * 0.35) * knifeForgeBoost * diamondBoost * starForgeMult)
    : 1;

  const katanaBonus = knife && knife.style === 'katana'
    ? (1 + Math.floor(GAME.evoStage / 50) * 0.15)
    : 1;

  const hungerBuff = 1 + Math.max(0, (GAME.hunger || 0) / 100) * 0.25;

  let archMult = 1;
  if (GAME.archetype === 'clicker') archMult = 1.5;
  else if (GAME.archetype === 'balanced') archMult = 1.15;

  const evoBlessingMult = 1 + (GAME.transcendUpgrades?.evoBlessing || 0) * 0.08;

  const equippedHatItem = GAME.equippedHat ? SHOP_ITEMS.find(i => i.id === GAME.equippedHat) : null;
  const hatLvl = equippedHatItem ? Math.min(15, getHatLevel(equippedHatItem.id)) : 1;
  const rawHat = equippedHatItem ? ((equippedHatItem.clickBoost || 1) * (1 + (hatLvl - 1) * 0.08)) : 1;
  const hatClickBoost = softCap(rawHat, 8, 0.55);

  const omniWealthMult = SHOP_ITEMS.find(i => i.id === 'upg_omniversal_wealth')?.owned ? 1.2 : 1;
  const sparkLvl = Math.min(12, GAME.boutiqueLevels?.singularity_spark || 0);
  const sparkMult = 1 + sparkLvl * 0.04;
  const cosmicSynergyMult = 1 + (GAME.transcendUpgrades?.cosmicSynergy || 0) * 0.06;
  const riftMult = getRiftMult();
  const idealMult = getIdealMult();

  let basePower = (1 + GAME.evoStage * 0.5) * evo.mult * rollsMult * softRollsMult * cosmicMult * synergyMult * hyperMult * plungersMult * omniRelicMult * turboMult * knifeClickMult * katanaBonus * hungerBuff * archMult * evoBlessingMult * hatClickBoost * omniWealthMult * sparkMult * cosmicSynergyMult * riftMult * idealMult;

  const syncRate = talentLevel('quantum_mastery') * 0.004 + (SHOP_ITEMS.find(i => i.id === 'upg_quantum_click')?.owned ? 0.02 : 0);
  if (syncRate > 0) {
    basePower += getPassiveIncome() * syncRate;
  }

  return Math.max(1, Math.round(basePower));
}

export function getPassiveIncome() {
  let base = 0;
  const turboMult = 1 + talentLevel('turbo_pipe') * 0.06;
  const goldRushMult = SHOP_ITEMS.find(i => i.id === 'upg_goldrush')?.owned ? 1.25 : 1;
  const overclockMult = SHOP_ITEMS.find(i => i.id === 'upg_factory_overclock')?.owned ? 1.25 : 1;
  const qReplMult = 1 + talentLevel('quantum_replication') * 0.08;
  const softRollsMult = 1 + talentLevel('soft_rolls') * 0.04;

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
    if (fac.count >= 100) facMilestoneMult *= 1.5;
    if (fac.count >= 200) facMilestoneMult *= 1.5;
    if (fac.count >= 500) facMilestoneMult *= 1.5;
    if (fac.count >= 1000) {
      facMilestoneMult *= 2;
      const extraThousands = Math.floor((fac.count - 1000) / 1000);
      if (extraThousands > 0) {
        facMilestoneMult *= Math.pow(1.5, extraThousands);
      }
    }

    let tierKnifeMult = 1.0;
    if (idx < 5) tierKnifeMult = earlyBladeBonus;
    else if (idx >= 5 && idx < 12) tierKnifeMult = heavyBladeBonus;

    const tierQuantumMult = idx >= 10 ? qReplMult : 1.0;

    // Singularity Core Boutique Perk: x3 to cosmic and singularity tier factories
    const singularityCoreActive = SHOP_ITEMS.find(i => i.id === 'upg_singularity_core')?.owned;
    const highTier = fac.tier === 'late' || fac.tier === 'endgame' || fac.tier === 'singularity';
    const singularityCoreMult = (singularityCoreActive && highTier) ? 1.5 : 1;

    base += (fac.count || 0) * fac.baseCps * facMilestoneMult * tierKnifeMult * tierQuantumMult * singularityCoreMult;
  });

  base *= turboMult * goldRushMult * overclockMult * butterflyBladeBonus;

  const evo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];
  const rollsMult = getRollsIncomeMult();
  const cosmicMult = Math.pow(1.08, Math.floor(talentLevel('cosmic_resonance') / 2));
  const plungersMult = getPlungersIncomeMult();
  const facOverdriveMult = 1 + (GAME.transcendUpgrades?.factoryOverdrive || 0) * 0.12;
  const cleanBuff = 1 + Math.max(0, (GAME.clean || 0) / 100) * 0.25;

  const knifeStar = knife ? getKnifeStar(knife.id) : 1;
  const knifeForgeBoost = 1 + (GAME.transcendUpgrades?.knifeForge || 0) * 0.08;
  const diamondLvl = Math.min(20, GAME.boutiqueLevels?.diamond_sharpening || 0);
  const diamondBoost = 1 + diamondLvl * 0.05;
  const starForgeMult = 1 + talentLevel('star_forge_master') * 0.05;
  const rawKnifePass = knife ? knife.passiveMult : 1;
  const effectiveKnifePass = softCap(rawKnifePass, 30, 0.65);
  const knifePassiveMult = knife
    ? (effectiveKnifePass * (1 + (knifeStar - 1) * 0.25) * knifeForgeBoost * diamondBoost * starForgeMult)
    : 1;

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

  const finalGPS = Math.max(0, Math.round(base * crystalMult * evo.mult * rollsMult * softRollsMult * cosmicMult * plungersMult * omniRelicMult * facOverdriveMult * cleanBuff * knifePassiveMult * archMult * evoBlessingMult * omniWealthMult * sparkMult * cosmicSynergyMult * timeWarpMult * riftMult * idealMult));
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
    const turboBase = GAME.archetype === 'combo' ? 6 : 4;
    const turboTalent = TALENTS.find(t => t.id === 'combo_master');
    const turboBonus = 1 + (turboTalent ? turboTalent.level * 0.15 : 0);
    const mult = Math.round(turboBase * turboBonus);
    buffs.push({
      id: 'turbo_rush',
      icon: '⚡',
      name: 'Турбо-Ярость (Frenzy Rush)',
      short: `x${formatNumber(mult)} (${Math.ceil(GAME.turboRushTime)}с)`,
      bonusText: `x${formatNumber(mult)} к силе клика`,
      badgeColor: 'bg-red-950/90 border-red-500/80 text-red-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]',
      desc: 'Временный ураганный режим! Сила клика колоссально умножается во время ярости.',
      progress: `Осталось действия: ${Math.ceil(GAME.turboRushTime)} сек. Базовый множитель: x${formatNumber(turboBase)}.`,
      source: 'Быстрые клики (Комбо) / Золотой метеорит',
      tip: 'Кликайте чаще чтобы продлить ярость, или ловите золотые метеориты!'
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

  // 6. Чистота Питомца (Бонус к пассивному CPS)
  const cleanVal = Math.max(0, GAME.clean || 0);
  if (cleanVal > 20) {
    const cleanPct = Math.round((cleanVal / 100) * 25);
    buffs.push({
      id: 'pet_clean',
      icon: '🧼',
      name: 'Чистота и Гигиена',
      short: `+${formatNumber(cleanPct)}% CPS`,
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
    const knifeForgeBoost = 1 + (GAME.transcendUpgrades?.knifeForge || 0) * 0.08;
    const diamondLvl = Math.min(20, GAME.boutiqueLevels?.diamond_sharpening || 0);
    const diamondBoost = 1 + diamondLvl * 0.05;
    const starForgeMult = 1 + talentLevel('star_forge_master') * 0.05;
    const rawKnifeClick = knife.clickMult || 1;
    const effectiveKnifeClick = softCap(rawKnifeClick, 50, 0.65);
    const knifeClickMult = effectiveKnifeClick * (1 + (knifeStar - 1) * 0.35) * knifeForgeBoost * diamondBoost * starForgeMult;
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
    const totalRolls = Math.max(GAME.allTimePrestigeRolls || 0, GAME.prestigeRolls || 0);
    const boostPct = Math.round((getRollsIncomeMult() - 1) * 100);
    buffs.push({
      id: 'prestige_rolls',
      icon: '🌀',
      name: 'Мудрость Смыва Судьбы',
      short: `+${formatNumber(boostPct)}%`,
      bonusText: `+${formatNumber(boostPct)}% ко всему доходу`,
      badgeColor: 'bg-purple-950/90 border-yellow-400 text-yellow-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
      desc: 'Постоянный множитель от всех завершенных циклов Смыва и накопленных Втулок Судьбы.',
      progress: `Смывов совершено: ${formatNumber(GAME.totalPrestiges)} | Втулок: ${formatNumber(totalRolls)} 🧻`,
      source: 'Смыв Судьбы',
      tip: 'Совершайте регулярные Смывы при достижении высоких наград Втулок.'
    });
  }

  return buffs;
}
