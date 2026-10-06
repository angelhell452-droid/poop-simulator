import { GAME, feedCount, washCount, polishCount, flushCount, setFeedCount, setWashCount, setPolishCount, setFlushCount } from '../core/state.js?v=5.0.41';
import { FACTORIES } from '../data/factories.data.js?v=5.0.41';
import { TALENTS } from '../data/talents.data.js';
import { ACHIEVEMENTS } from '../data/achievements.data.js?v=5.0.41';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.41';
import { KNIVES } from '../data/knives.data.js?v=5.0.41';
import { BODY_SKINS, SKIN_FITTING } from '../data/skins.data.js?v=5.0.41';
import { EVOLUTIONS } from '../data/evolutions.data.js?v=5.0.41';
import { migrateSaveData } from './migrations.js?v=5.0.41';
import { clampAutoclickerState } from '../systems/autoclickService.js?v=5.0.41';
import { notePeakForm } from '../progression/unlocks.js';
import { maxUnlockedStage } from '../progression/phases.data.js?v=5.0.41';
import { events } from '../core/events.js';
import { isBig, rehydrateBig } from '../utils/big.js?v=5.0.41';

function keepBio(value) {
  const n = rehydrateBig(value);
  if (isBig(n)) return n;
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export const STORAGE_KEY = 'PoopSim_Pro_Save';
export const BACKUP_KEY = 'PoopSim_Pro_Backup';

export function buildSavePayload() {
  return {
    saveVersion: GAME.saveVersion || 5,
    saveTimestamp: Date.now(),
    adminSeq: Number(GAME.cloudAdminSeq) || 0,
    worldReset: Number(GAME.worldReset) || 0,
    game: { ...GAME, lastActiveTime: Date.now() },
    feedCount,
    washCount,
    polishCount,
    flushCount,
    factories: FACTORIES.map(s => ({ id: s.id, count: s.count || 0 })),
    talents: TALENTS.map(t => ({ id: t.id, level: t.level || 0 })),
    achievements: ACHIEVEMENTS.map(a => ({ id: a.id, done: !!a.done })),
    purchasedItems: SHOP_ITEMS.filter(item => item.owned).map(i => i.id),
    knifeStats: KNIVES.map(k => ({ id: k.id, statTrak: k.statTrak || 0 })),
    knifeStars: GAME.knifeStars || {},
    hatLevels: GAME.hatLevels || {}
  };
}

export function saveLocal() {
  try {
    GAME.biomass = keepBio(GAME.biomass);
    GAME.cycleBiomass = keepBio(GAME.cycleBiomass);
    GAME.allTimeBiomass = keepBio(GAME.allTimeBiomass);
    
    const payload = buildSavePayload();
    const json = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.setItem(BACKUP_KEY, json);
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

function readStoredAccount() {
  try {
    const raw = localStorage.getItem('PoopSim_User_Account');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function loggedInUsername() {
  const name = readStoredAccount()?.username;
  if (typeof name !== 'string') return '';
  const clean = name.trim();
  if (clean.length < 3 || clean === 'Игрок') return '';
  return clean.slice(0, 32);
}

function wipeRuntimeCatalogs() {
  FACTORIES.forEach((row) => { row.count = 0; });
  TALENTS.forEach((row) => { row.level = 0; });
  ACHIEVEMENTS.forEach((row) => { row.done = false; });
  SHOP_ITEMS.forEach((row) => { row.owned = false; });
  KNIVES.forEach((row) => {
    row.statTrak = 0;
    row.owned = false;
  });
  GAME.unlockedKnives = [];
  GAME.knifeStars = {};
  GAME.hatLevels = {};
  GAME.boutiqueLevels = {};
  GAME.equippedHat = null;
  GAME.equippedKnife = null;
  GAME.equippedSkin = null;
  GAME.ownedSkins = [];
  GAME.peakForm = 1;
  GAME.meteorsCaught = 0;
  GAME.turboCount = 0;
  GAME.casesOpened = 0;
  GAME.totalClicks = 0;
  GAME.phaseEcho = {};
  GAME.biomass = 0;
  GAME.cycleBiomass = 0;
  GAME.allTimeBiomass = 0;
  GAME.sparkles = 20;
  GAME.prestigeRolls = 0;
  GAME.allTimePrestigeRolls = 0;
  GAME.transcendCycleRolls = 0;
  GAME.totalPrestiges = 0;
  GAME.transcendPlungers = 0;
  GAME.totalTranscend = 0;
  GAME.flushesThisCycle = 0;
  GAME.horizonSparks = 0;
  GAME.horizonUpgrades = { pace: 0, seal: 0 };
  GAME.evoStage = 0;
  GAME.hunger = 100;
  GAME.clean = 100;
  GAME.happy = 100;
  GAME.comboHeat = 0;
  GAME.autoclickerActive = false;
  setFeedCount(0);
  setWashCount(0);
  setPolishCount(0);
  setFlushCount(0);
  GAME.transcendUpgrades = {
    cosmicSynergy: 0,
    autoCare: false,
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
  };
}

export function applySaveDataSafely(rawData) {
  if (!rawData) return;
  const data = migrateSaveData(rawData);
  if (!data) return;

  if (data.resetProgress) wipeRuntimeCatalogs();

  if (data.game) {
    for (const k in data.game) {
      if (data.game[k] !== undefined && data.game[k] !== null) {
        GAME[k] = data.game[k];
      }
    }
    if (!GAME.gameMode) GAME.gameMode = GAME.girlyMode ? 'girls' : 'boys';
    if (!GAME.archetype) GAME.archetype = 'balanced';
    if (data.game.transcendUpgrades) {
      GAME.transcendUpgrades = { ...GAME.transcendUpgrades, ...data.game.transcendUpgrades };
    }
    if (data.game.boutiqueLevels) {
      GAME.boutiqueLevels = { ...GAME.boutiqueLevels, ...data.game.boutiqueLevels };
    }
  }

  // Safety sanitisers
  GAME.biomass = keepBio(GAME.biomass);
  GAME.allTimeBiomass = keepBio(GAME.allTimeBiomass);
  GAME.cycleBiomass = keepBio(GAME.cycleBiomass);
  GAME.horizonSparks = Math.max(0, Math.floor(Number(GAME.horizonSparks) || 0));
  if (!GAME.horizonUpgrades || typeof GAME.horizonUpgrades !== 'object') GAME.horizonUpgrades = { pace: 0, seal: 0 };
  GAME.horizonUpgrades.pace = Math.max(0, Math.min(5, Math.floor(Number(GAME.horizonUpgrades.pace) || 0)));
  GAME.horizonUpgrades.seal = GAME.horizonUpgrades.seal ? 1 : 0;
  if (!isFinite(GAME.prestigeRolls) || GAME.prestigeRolls < 0 || GAME.prestigeRolls > 1e308) GAME.prestigeRolls = 0;
  if (!Number.isFinite(GAME.transcendCycleRolls) || GAME.transcendCycleRolls < 0 || GAME.transcendCycleRolls > 1e308) {
    GAME.transcendCycleRolls = GAME.prestigeRolls || 0;
  }
  if (GAME.transcendCycleRolls === 0 && (GAME.prestigeRolls || 0) > 0) {
    GAME.transcendCycleRolls = GAME.prestigeRolls;
  }
  if (!isFinite(GAME.transcendPlungers) || GAME.transcendPlungers < 0 || GAME.transcendPlungers > 1e308) GAME.transcendPlungers = 0;
  if (!isFinite(GAME.evoStage) || GAME.evoStage < 0) GAME.evoStage = 0;
  if (GAME.evoStage >= EVOLUTIONS.length) GAME.evoStage = EVOLUTIONS.length - 1;
  if (!GAME.phaseEcho || typeof GAME.phaseEcho !== 'object') GAME.phaseEcho = {};
  if (!Number.isFinite(GAME.flushesThisCycle) || GAME.flushesThisCycle < 0) GAME.flushesThisCycle = 0;
  if (!Number.isFinite(GAME.pairPlungersFromFlushes) || GAME.pairPlungersFromFlushes < 0) GAME.pairPlungersFromFlushes = 0;
  const phaseCap = maxUnlockedStage(GAME.totalTranscend || 0);
  if (GAME.evoStage > phaseCap) GAME.evoStage = phaseCap;

  if (typeof data.feedCount === 'number') setFeedCount(data.feedCount);
  if (typeof data.washCount === 'number') setWashCount(data.washCount);
  if (typeof data.polishCount === 'number') setPolishCount(data.polishCount);
  if (typeof data.flushCount === 'number') setFlushCount(data.flushCount);

  const savedFactories = data.factories || data.sponsors;
  if (Array.isArray(savedFactories)) {
    savedFactories.forEach(savedFac => {
      const fac = FACTORIES.find(s => s.id === savedFac.id);
      if (fac) fac.count = savedFac.count || 0;
    });
  }

  if (Array.isArray(data.talents)) {
    data.talents.forEach(savedTl => {
      const tl = TALENTS.find(t => t.id === savedTl.id);
      if (tl) tl.level = savedTl.level || 0;
    });
  }

  if (Array.isArray(data.achievements)) {
    data.achievements.forEach(savedAch => {
      const ach = ACHIEVEMENTS.find(a => a.id === savedAch.id);
      if (ach) ach.done = savedAch.done;
    });
  }

  if (Array.isArray(data.purchasedItems)) {
    data.purchasedItems.forEach(id => {
      const it = SHOP_ITEMS.find(i => i.id === id);
      if (it) it.owned = true;
    });
  }

  if (Array.isArray(data.knifeStats)) {
    data.knifeStats.forEach(ks => {
      const kn = KNIVES.find(k => k.id === ks.id);
      if (kn && typeof ks.statTrak === 'number') kn.statTrak = ks.statTrak;
    });
  }

  if (data.knifeStars && typeof data.knifeStars === 'object') {
    GAME.knifeStars = { ...data.knifeStars };
  }

  if (data.hatLevels && typeof data.hatLevels === 'object') {
    GAME.hatLevels = { ...data.hatLevels };
  } else if (!GAME.hatLevels) {
    GAME.hatLevels = {};
  }

  const knownSkins = new Set(BODY_SKINS.map((skin) => skin.id));
  if (!Array.isArray(GAME.ownedSkins)) GAME.ownedSkins = [];
  GAME.ownedSkins = GAME.ownedSkins.filter((id) => knownSkins.has(id));
  if (!knownSkins.has(GAME.equippedSkin) || (!GAME.ownedSkins.includes(GAME.equippedSkin) && !SKIN_FITTING)) {
    GAME.equippedSkin = null;
  }

  TALENTS.forEach((row) => {
    if ((row.level || 0) > row.max) row.level = row.max;
  });
  if (GAME.transcendUpgrades && (Number(GAME.transcendUpgrades.passiveRolls) || 0) > 4) {
    GAME.transcendUpgrades.passiveRolls = 4;
  }
  if (data.resetProgress) wipeRuntimeCatalogs();

  const login = loggedInUsername();
  if (login) {
    GAME.playerName = login;
    const acc = readStoredAccount();
    if (acc?.playerId) GAME.playerId = acc.playerId;
  }
  if (GAME.autoBuyerMode === 'all') GAME.autoBuyerMode = 'smart';
  delete GAME.vipLevel;

  clampAutoclickerState();
  notePeakForm();

  events.emit('save:loaded');
}

export function readLocalSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_KEY);
    if (raw) {
      applySaveDataSafely(JSON.parse(raw));
      return true;
    }
  } catch (e) {
    console.warn('LocalStorage load error:', e);
  }
  return false;
}
