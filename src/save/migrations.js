// Save Data Migration Layer (Ensures 100% Backward Compatibility)

export function migrateSaveData(rawSave) {
  if (!rawSave) return null;

  // Check if save is v1 or flat object
  if (!rawSave.saveVersion || rawSave.saveVersion < 2) {
    const legacy = rawSave.game || rawSave;
    return {
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
        evoStage: Math.min(19999, Math.max(0, legacy.evoStage || 0)),
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
    };
  }

  if (rawSave && rawSave.game) {
    if (!Number.isFinite(rawSave.game.transcendCycleRolls) || rawSave.game.transcendCycleRolls <= 0) {
      rawSave.game.transcendCycleRolls = Number.isFinite(rawSave.game.prestigeRolls) && rawSave.game.prestigeRolls > 0
        ? rawSave.game.prestigeRolls
        : 0;
    }
  }

  return rawSave;
}
