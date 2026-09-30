// Unified Reactive Game State

export function getDefaultGameState() {
  let playerId = (typeof localStorage !== 'undefined') ? localStorage.getItem('PoopSim_PlayerId') : null;
  if (!playerId) {
    playerId = 'poop_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem('PoopSim_PlayerId', playerId); } catch (e) {}
    }
  }
  let playerName = (typeof localStorage !== 'undefined' ? localStorage.getItem('PoopSim_PlayerName') : null) || ('Игрок #' + playerId.substring(playerId.length - 4));

  return {
    saveVersion: 2,
    playerId: playerId,
    playerName: playerName,
    
    biomass: 0,
    cycleBiomass: 0,
    allTimeBiomass: 0,
    sparkles: 20,
    prestigeRolls: 0,
    allTimePrestigeRolls: 0,
    totalPrestiges: 0,
    transcendPlungers: 0,
    totalTranscend: 0,
    
    evoStage: 0,
    archetype: 'balanced', // 'balanced' | 'clicker' | 'tycoon' | 'gambler' | 'combo'
    
    hunger: 100,
    clean: 100,
    happy: 100,
    autoFeed: false,
    autoWash: false,
    autoTickle: false,
    
    totalClicks: 0,
    lastFlushTime: 0,
    equippedHat: null,
    
    autoclickerActive: false,
    autoclickerSpeed: 1000,
    
    gameMode: 'boys', // 'boys' | 'girls'
    girlyMode: false,
    buyMultiplier: 1, // 1 | 10 | 100 | 'max'
    
    equippedKnife: null,
    unlockedKnives: [],
    knifeStars: {},
    casesOpened: 0,
    
    comboHeat: 0,
    turboRushTime: 0,
    turboCount: 0,
    meteorsCaught: 0,
    currentRunPeakGPS: 0,
    boutiqueLevels: {},
    
    lastSaveTime: Date.now(),
    lastActiveTime: Date.now(),
    
    autoBuyerEnabled: true,
    autoEvolutionEnabled: true,
    
    transcendUpgrades: {
      cosmicSynergy: 0,
      autoBuyer: false,
      passiveRolls: 0,
      omniMult: 0,
      afkCap: 0,
      knifeForge: 0,
      factoryOverdrive: 0,
      plungerIncubator: 0,
      meteorStorm: 0,
      evoBlessing: 0,
      autoEvolution: false,
      singularityRift: false
    }
  };
}

export const GAME = getDefaultGameState();

export let feedCount = 0;
export let washCount = 0;
export let polishCount = 0;
export let flushCount = 0;

export function setFeedCount(v) { feedCount = v; }
export function setWashCount(v) { washCount = v; }
export function setPolishCount(v) { polishCount = v; }
export function setFlushCount(v) { flushCount = v; }
export function incFeedCount() { feedCount++; }
export function incWashCount() { washCount++; }
export function incPolishCount() { polishCount++; }
export function incFlushCount() { flushCount++; }
