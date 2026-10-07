// Save Data Migration Layer (Ensures 100% Backward Compatibility)

import { TALENTS } from '../data/talents.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.78';
import { FACTORIES } from '../data/factories.data.js?v=5.0.78';
import { getPhaseForForm } from '../progression/phases.data.js?v=5.0.78';

export function migrateSaveData(rawSave) {
  if (!rawSave) return null;

  // Check if save is v1 or flat object
  if (!rawSave.saveVersion || rawSave.saveVersion < 2) {
    const legacy = rawSave.game || rawSave;
    return applyBridgeV6(applyFactoryV5(applyPhaseV4(applyEconomyV3({
      saveVersion: 2,
      saveTimestamp: Date.now(),
      game: {
        ...legacy,
        saveVersion: 2,
        biomass: Number.isFinite(legacy.biomass) && legacy.biomass >= 0 ? legacy.biomass : 0,
        cycleBiomass: Number.isFinite(legacy.cycleBiomass) && legacy.cycleBiomass >= 0 ? legacy.cycleBiomass : 0,
        allTimeBiomass: Number.isFinite(legacy.allTimeBiomass) && legacy.allTimeBiomass >= 0 ? legacy.allTimeBiomass : 0,
        sparkles: Number.isFinite(legacy.sparkles) ? legacy.sparkles : 20,
        prestigeRolls: Number.isFinite(legacy.prestigeRolls) ? legacy.prestigeRolls : 0,
        allTimePrestigeRolls: Number.isFinite(legacy.allTimePrestigeRolls) ? legacy.allTimePrestigeRolls : (legacy.prestigeRolls || 0),
        transcendCycleRolls: Number.isFinite(legacy.transcendCycleRolls) && legacy.transcendCycleRolls >= 0
          ? legacy.transcendCycleRolls
          : (Number.isFinite(legacy.prestigeRolls) && legacy.prestigeRolls >= 0 ? legacy.prestigeRolls : 0),
        totalPrestiges: legacy.totalPrestiges || 0,
        transcendPlungers: legacy.transcendPlungers || 0,
        totalTranscend: legacy.totalTranscend || 0,
        evoStage: Math.min(99999, Math.max(0, legacy.evoStage || 0)),
        archetype: legacy.archetype || 'balanced',
        hunger: legacy.hunger ?? 100,
        clean: legacy.clean ?? 100,
        happy: legacy.happy ?? 100,
        autoFeed: !!legacy.autoFeed,
        autoWash: !!legacy.autoWash,
        autoTickle: !!legacy.autoTickle,
        totalClicks: legacy.totalClicks || 0,
        lastFlushTime: legacy.lastFlushTime || 0,
        equippedHat: legacy.equippedHat || null,
        autoclickerActive: !!legacy.autoclickerActive,
        autoclickerSpeed: legacy.autoclickerSpeed || 1000,
        gameMode: legacy.girlyMode ? 'girls' : (legacy.gameMode || 'boys'),
        buyMultiplier: legacy.buyMultiplier || 1,
        equippedKnife: legacy.equippedKnife || null,
        unlockedKnives: Array.isArray(legacy.unlockedKnives) ? legacy.unlockedKnives : [],
        knifeStars: legacy.knifeStars || {},
        casesOpened: legacy.casesOpened || 0,
        comboHeat: legacy.comboHeat || 0,
        turboRushTime: legacy.turboRushTime || 0,
        turboCount: legacy.turboCount || 0,
        meteorsCaught: legacy.meteorsCaught || 0,
        lastActiveTime: legacy.lastActiveTime || Date.now(),
        transcendUpgrades: legacy.transcendUpgrades || {
          autoBuyer: false, passiveRolls: 0, omniMult: 0, afkCap: 0, knifeForge: 0,
          factoryOverdrive: 0, plungerIncubator: 0, meteorStorm: 0, evoBlessing: 0, autoEvolution: false
        }
      },
      feedCount: rawSave.feedCount || 0,
      washCount: rawSave.washCount || 0,
      polishCount: rawSave.polishCount || 0,
      flushCount: rawSave.flushCount || 0,
      factories: rawSave.factories || rawSave.sponsors || [],
      talents: rawSave.talents || [],
      achievements: rawSave.achievements || [],
      purchasedItems: rawSave.purchasedItems || [],
      knifeStats: rawSave.knifeStats || [],
      knifeStars: rawSave.knifeStars || {}
    }))));
  }

  if (rawSave && rawSave.game) {
    if (!Number.isFinite(rawSave.game.transcendCycleRolls) || rawSave.game.transcendCycleRolls <= 0) {
      rawSave.game.transcendCycleRolls = Number.isFinite(rawSave.game.prestigeRolls) && rawSave.game.prestigeRolls > 0
        ? rawSave.game.prestigeRolls
        : 0;
    }
  }

  return applyBridgeV6(applyFactoryV5(applyPhaseV4(applyEconomyV3(rawSave))));
}

function saveVersionOf(save) {
  if (!save) return 0;
  return Math.max(save.saveVersion || 0, save.game?.saveVersion || 0);
}

const REMOVED_TALENTS = {
  hyperspeed_flush: { cost: 20000, costMult: 1.32 },
  omni_mastery: { cost: 2000000, costMult: 1.45 }
};

const OLD_TRANSCEND = {
  cosmicSynergy: { cost: 50, costStep: 25, max: 15 },
  passiveRolls: { cost: 100, costStep: 50, max: 12 },
  afkCap: { cost: 150, costStep: 75, max: 8 },
  plungerIncubator: { cost: 250, costStep: 100, max: 12 },
  knifeForge: { cost: 7500, costStep: 2500, max: 12 },
  meteorStorm: { cost: 10000, costStep: 3000, max: 8 },
  factoryOverdrive: { cost: 50000, costStep: 15000, max: 15 },
  evoBlessing: { cost: 75000, costStep: 20000, max: 12 },
  omniMult: { cost: 250000, costStep: 100000, max: 20 }
};

const OLD_BOUTIQUE = {
  diamond_sharpening: { baseCost: 20000, costMult: 1.25, max: 20 },
  crystal_factory: { baseCost: 50000, costMult: 1.25, max: 20 },
  golden_luck: { baseCost: 100000, costMult: 1.30, max: 20 },
  singularity_spark: { baseCost: 500000, costMult: 1.35, max: 12 }
};

function talentLevelCost(cost, costMult, lvl) {
  return Math.floor(cost * Math.pow(costMult || 1.12, lvl)) + lvl;
}

function sumLevelCosts(cost, costMult, from, toExclusive) {
  let spent = 0;
  for (let lvl = from; lvl < toExclusive; lvl++) {
    spent += talentLevelCost(cost, costMult, lvl);
  }
  return spent;
}

function applyEconomyV3(save) {
  if (!save || saveVersionOf(save) >= 3) return save;
  const game = save.game || {};
  let rollsRefund = 0;
  let plungerRefund = 0;
  let sparkleRefund = 0;

  if (Array.isArray(save.talents)) {
    const kept = [];
    for (const row of save.talents) {
      const removed = REMOVED_TALENTS[row.id];
      const oldLevel = row.level || 0;
      if (removed) {
        rollsRefund += sumLevelCosts(removed.cost, removed.costMult, 0, oldLevel);
        continue;
      }
      const def = TALENTS.find(t => t.id === row.id);
      if (def && oldLevel > def.max) {
        rollsRefund += Math.floor(sumLevelCosts(def.cost, def.costMult, def.max, oldLevel) * 0.6);
        row.level = def.max;
      }
      kept.push(row);
    }
    save.talents = kept;
  }

  game.prestigeRolls = (game.prestigeRolls || 0) + rollsRefund;

  const ups = game.transcendUpgrades || {};
  for (const key of Object.keys(OLD_TRANSCEND)) {
    const def = OLD_TRANSCEND[key];
    const oldLevel = typeof ups[key] === 'number' ? ups[key] : 0;
    if (oldLevel > def.max) {
      for (let lvl = def.max; lvl < oldLevel; lvl++) {
        plungerRefund += def.cost + lvl * def.costStep;
      }
      ups[key] = def.max;
    }
  }
  game.transcendUpgrades = ups;
  game.transcendPlungers = (game.transcendPlungers || 0) + Math.floor(plungerRefund * 0.6);

  const boutique = game.boutiqueLevels || {};
  for (const id of Object.keys(OLD_BOUTIQUE)) {
    const def = OLD_BOUTIQUE[id];
    const oldLevel = boutique[id] || 0;
    if (oldLevel > def.max) {
      for (let lvl = def.max; lvl < oldLevel; lvl++) {
        sparkleRefund += Math.round(def.baseCost * Math.pow(def.costMult, lvl));
      }
      boutique[id] = def.max;
    }
  }
  game.boutiqueLevels = boutique;

  const hats = game.hatLevels || save.hatLevels || {};
  for (const hatId of Object.keys(hats)) {
    const oldLevel = hats[hatId] || 1;
    if (oldLevel > 15) {
      const hat = SHOP_ITEMS.find(i => i.id === hatId);
      const baseCost = Math.max(1500, Math.floor(((hat && hat.cost) || 5000) * 0.35));
      for (let lvl = 15; lvl < oldLevel; lvl++) {
        sparkleRefund += Math.floor(baseCost * Math.pow(1.75, lvl - 1));
      }
      hats[hatId] = 15;
    }
  }
  game.hatLevels = hats;
  save.hatLevels = hats;
  game.sparkles = (game.sparkles || 0) + Math.floor(sparkleRefund * 0.6);

  if ((game.totalPrestiges || 0) < 1) {
    game.autoclickerActive = false;
    game.autoclickerSpeed = 1;
  } else {
    game.autoclickerSpeed = Math.max(1, Math.min(8, game.autoclickerSpeed || 1));
  }

  game.saveVersion = 3;
  save.game = game;
  save.saveVersion = 3;
  return save;
}

function applyPhaseV4(save) {
  if (!save || saveVersionOf(save) >= 4) return save;
  const game = save.game || {};
  const formPhase = getPhaseForForm((game.evoStage || 0) + 1).id;
  const fromOldTranscend = Math.min(4, Math.max(0, game.totalTranscend || 0) * 2);
  const phaseId = Math.max(1, formPhase, fromOldTranscend);
  const keys = Math.ceil(phaseId / 2) - 1;
  game.totalTranscend = keys;

  const echoes = {};
  const flushes = Math.max(0, game.totalPrestiges || 0);
  if (flushes > 0) {
    const each = Math.floor(flushes / phaseId);
    let rem = flushes % phaseId;
    for (let id = 1; id <= phaseId; id++) {
      echoes[id] = each + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
    }
  }
  game.phaseEcho = echoes;
  game.flushesThisCycle = 0;

  const rollCap = 80 + phaseId * 15;
  game.prestigeRolls = Math.min(game.prestigeRolls || 0, rollCap);
  game.allTimePrestigeRolls = Math.min(game.allTimePrestigeRolls || 0, rollCap);
  game.transcendCycleRolls = game.prestigeRolls;
  game.transcendPlungers = Math.min(game.transcendPlungers || 0, keys * 2);

  if (Array.isArray(save.factories)) {
    save.factories.forEach(row => {
      if (!row) return;
      const known = FACTORIES.some(fac => fac.id === row.id);
      if (!known) return;
      row.count = Math.min(80, Math.max(0, row.count || 0));
    });
  }

  game.saveVersion = 4;
  save.game = game;
  save.saveVersion = 4;
  return save;
}

function applyFactoryV5(save) {
  if (!save || saveVersionOf(save) >= 5) return save;
  const game = save.game || {};
  if (Array.isArray(save.factories)) {
    save.factories.forEach(row => {
      if (!row) return;
      const known = FACTORIES.some(fac => fac.id === row.id);
      if (!known) return;
      row.count = Math.min(25, Math.max(0, row.count || 0));
    });
  }
  game.saveVersion = 5;
  save.game = game;
  save.saveVersion = 5;
  return save;
}

function applyBridgeV6(save) {
  if (!save || saveVersionOf(save) >= 6) return save;
  const game = save.game || {};
  game.flushesThisCycle = 0;
  game.saveVersion = 6;
  save.game = game;
  save.saveVersion = 6;
  return save;
}
