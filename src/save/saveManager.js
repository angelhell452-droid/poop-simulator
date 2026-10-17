import { GAME, feedCount, washCount, polishCount, flushCount, setFeedCount, setWashCount, setPolishCount, setFlushCount } from '../core/state.js?v=5.4.31';
import { FACTORIES } from '../data/factories.data.js?v=5.4.31';
import { TALENTS } from '../data/talents.data.js';
import { ACHIEVEMENTS } from '../data/achievements.data.js?v=5.4.31';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.4.31';
import { PERMANENT_PERKS } from '../data/perks.data.js';
import { KNIVES } from '../data/knives.data.js?v=5.4.31';
import { BODY_SKINS, SKIN_FITTING } from '../data/skins.data.js?v=5.4.31';
import { EVOLUTIONS } from '../data/evolutions.data.js?v=5.4.31';
import { migrateSaveData } from './migrations.js?v=5.4.31';
import { clampAutoclickerState } from '../systems/autoclickService.js?v=5.4.31';
import { notePeakForm } from '../progression/unlocks.js';
import { maxUnlockedStage } from '../progression/phases.data.js?v=5.4.31';
import { events } from '../core/events.js';
import { gt, isBig, rehydrateBig } from '../utils/big.js?v=5.4.31';
import { RELICS } from '../data/relics.data.js';
import { canSaveLocal, registerLocalSaveCallback, CURRENT_CLIENT_PATCH_VERSION, LOCAL_PATCH_VERSION_KEY, compareSemver } from '../core/serverAuthority.js?v=5.4.31';

function keepBio(value) {
  const n = rehydrateBig(value);
  if (isBig(n)) return n;
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function serializeCurrency(value) {
  const n = keepBio(value);
  if (isBig(n)) return `${n.m}e${n.e}`;
  return n;
}

export function getIsolatedStorageKey(userId = null) {
  const uid = userId || GAME.playerId || 'local';
  return `saveGame_${uid}`;
}

export const STORAGE_KEY = 'PoopSim_Pro_Save';
export const BACKUP_KEY = 'PoopSim_Pro_Backup';

export function buildSavePayload() {
  const plungersStr = isBig(GAME.transcendPlungers)
    ? `${GAME.transcendPlungers.m}e${GAME.transcendPlungers.e}`
    : String(GAME.transcendPlungers ?? 0);

  const cleanRelics = {};
  if (GAME.relics && typeof GAME.relics === 'object') {
    for (const k in GAME.relics) {
      const v = Number(GAME.relics[k]);
      if (Number.isFinite(v) && v > 0) {
        cleanRelics[k] = v;
      }
    }
  }

  const cleanTranscendUpgrades = {};
  if (GAME.transcendUpgrades && typeof GAME.transcendUpgrades === 'object') {
    for (const k in GAME.transcendUpgrades) {
      const v = Number(GAME.transcendUpgrades[k]);
      if (Number.isFinite(v) && v > 0) {
        cleanTranscendUpgrades[k] = v;
      }
    }
  }

  const cleanStats = {
    totalMeteorsCaught: Math.max(0, Math.floor(Number(GAME.stats?.totalMeteorsCaught ?? GAME.meteorsCaught ?? 0)) || 0)
  };
  const currentFlushes = Math.max(0, Math.floor(Number(GAME.flushCount ?? GAME.totalPrestiges ?? flushCount) || 0));
  const currentBreakthroughs = Math.max(0, Math.floor(Number(GAME.breakthroughCount ?? GAME.totalTranscend ?? 0) || 0));
  const currentStage = Math.max(1, Math.floor(Number(GAME.peakForm ?? (GAME.evoStage !== undefined ? GAME.evoStage + 1 : 1)) || 1));

  const worldResetVal = Number(GAME.worldReset) || 0;
  const effectivePatch = (!GAME.patchVersion || compareSemver(CURRENT_CLIENT_PATCH_VERSION, GAME.patchVersion) > 0)
    ? CURRENT_CLIENT_PATCH_VERSION
    : String(GAME.patchVersion);
  GAME.patchVersion = effectivePatch;
  const patchVersionVal = effectivePatch;

  return {
    saveVersion: GAME.saveVersion || 6,
    saveTimestamp: Date.now(),
    adminSeq: Number(GAME.cloudAdminSeq) || 0,
    clientWorldReset: worldResetVal,
    clientPatchVersion: patchVersionVal,
    worldReset: worldResetVal,
    patchVersion: patchVersionVal,
    stage: currentStage,
    peakForm: currentStage,
    evoStage: GAME.evoStage ?? 0,
    breakthroughCount: currentBreakthroughs,
    totalTranscend: currentBreakthroughs,
    flushCount: currentFlushes,
    totalPrestiges: currentFlushes,
    biomass: serializeCurrency(GAME.biomass),
    allTimeBiomass: serializeCurrency(GAME.allTimeBiomass),
    sparkles: serializeCurrency(GAME.sparkles),
    prestigeRolls: serializeCurrency(GAME.prestigeRolls),
    game: {
      ...GAME,
      clientWorldReset: worldResetVal,
      clientPatchVersion: patchVersionVal,
      worldReset: worldResetVal,
      patchVersion: patchVersionVal,
      stage: currentStage,
      peakForm: currentStage,
      breakthroughCount: currentBreakthroughs,
      totalTranscend: currentBreakthroughs,
      flushCount: currentFlushes,
      totalPrestiges: currentFlushes,
      stats: cleanStats,
      transcendPlungers: plungersStr,
      relics: cleanRelics,
      transcendUpgrades: cleanTranscendUpgrades,
      lastActiveTime: Date.now()
    },
    stats: cleanStats,
    transcendPlungers: plungersStr,
    autoFlushActive: Boolean(GAME.autoFlushActive),
    autoBreakthroughActive: Boolean(GAME.autoBreakthroughActive),
    relics: cleanRelics,
    transcendUpgrades: cleanTranscendUpgrades,
    feedCount,
    washCount,
    polishCount,
    flushCount: currentFlushes,
    factories: FACTORIES.map(s => ({ id: s.id, count: s.count || 0 })),
    talents: TALENTS.map(t => ({ id: t.id, level: t.level || 0 })),
    achievements: ACHIEVEMENTS.map(a => ({ id: a.id, done: !!a.done })),
    purchasedItems: SHOP_ITEMS.filter(item => item.owned).map(i => i.id),
    ownedPerks: PERMANENT_PERKS.filter(p => p.owned || (GAME.ownedPerks && GAME.ownedPerks[p.id])).map(p => p.id),
    currentQuestId: GAME.currentQuestId || ((GAME.tutorialStepIndex || 0) + 1),
    tutorialStepIndex: GAME.tutorialStepIndex || 0,
    tutorialCompleted: !!GAME.tutorialCompleted,
    tutorialStarted: !!GAME.tutorialStarted,
    tutorialQuestOrderV2: !!GAME.tutorialQuestOrderV2,
    caseFirstBuyDiscountUsed: GAME.caseFirstBuyDiscountUsed || {},
    firstCaseDiscountUsed: !!GAME.firstCaseDiscountUsed,
    knifeStats: KNIVES.map(k => ({ id: k.id, statTrak: k.statTrak || 0 })),
    knifeStars: GAME.knifeStars || {},
    hatLevels: GAME.hatLevels || {}
  };
}

export function saveLocal() {
  if (!canSaveLocal()) {
    console.warn('[SaveManager] Local save prevented: Wipe is in effect.');
    return;
  }
  try {
    GAME.biomass = keepBio(GAME.biomass);
    GAME.cycleBiomass = keepBio(GAME.cycleBiomass);
    GAME.allTimeBiomass = keepBio(GAME.allTimeBiomass);
    GAME.transcendPlungers = keepBio(GAME.transcendPlungers);
    GAME.sparkles = keepBio(GAME.sparkles);
    GAME.prestigeRolls = keepBio(GAME.prestigeRolls);
    GAME.allTimePrestigeRolls = keepBio(GAME.allTimePrestigeRolls);
    GAME.transcendCycleRolls = keepBio(GAME.transcendCycleRolls);
    GAME.vipCollectedSparkles = keepBio(GAME.vipCollectedSparkles);
    
    const payload = buildSavePayload();
    const json = JSON.stringify(payload);
    const isolatedKey = getIsolatedStorageKey();
    localStorage.setItem(isolatedKey, json);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.setItem(BACKUP_KEY, json);
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export const saveGame = saveLocal;

registerLocalSaveCallback(saveLocal);

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

export function wipeRuntimeCatalogs() {
  FACTORIES.forEach((row) => { row.count = 0; });
  TALENTS.forEach((row) => { row.level = 0; });
  ACHIEVEMENTS.forEach((row) => { row.done = false; });
  SHOP_ITEMS.forEach((row) => { row.owned = false; });
  PERMANENT_PERKS.forEach((row) => { row.owned = false; });
  GAME.ownedPerks = {};
  GAME.relics = {};
  RELICS.forEach((r) => {
    GAME.relics[r.id] = 0;
    if (r.legacyKey && GAME.transcendUpgrades) GAME.transcendUpgrades[r.legacyKey] = 0;
  });
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
  GAME.stats = {
    totalMeteorsCaught: 0
  };
  GAME.turboCount = 0;
  GAME.casesOpened = 0;
  GAME.firstCaseDiscountUsed = false;
  GAME.caseFirstBuyDiscountUsed = {};
  GAME.firstCaseNotified = false;
  GAME.totalClicks = 0;
  GAME.tutorialStepIndex = 0;
  GAME.currentQuestId = 1;
  GAME.tutorialCompleted = false;
  GAME.tutorialStarted = false;
  GAME.tutorialQuestOrderV2 = true;
  GAME.tutorialCritBonus = 0;
  GAME.tutorialClickBonus = 0;
  GAME.tutorialIncomeMult = 1;
  GAME.tutorialTempBoostUntil = 0;
  GAME.tutorialCareDone = { wash: false, feed: false, tickle: false };
  GAME.tutorialRewardClaimed = false;
  GAME.guildTicketsContributed = 0;
  GAME.guildTickets = 0;
  GAME.clicksTowardsTicket = 0;
  GAME.phaseEcho = {};
  GAME.biomass = 0;
  GAME.cycleBiomass = 0;
  GAME.allTimeBiomass = 0;
  GAME.lifetimeBiomassInCurrentCycle = 0;
  GAME.breakthroughProgress = 0;
  GAME.biomassExpLevel = 0;
  GAME.sparkles = 20;
  GAME.prestigeRolls = 0;
  GAME.allTimePrestigeRolls = 0;
  GAME.transcendCycleRolls = 0;
  GAME.totalPrestiges = 0;
  GAME.flushCount = 0;
  GAME.transcendPlungers = 0;
  GAME.totalTranscend = 0;
  GAME.breakthroughCount = 0;
  GAME.flushesThisCycle = 0;
  GAME.pairPlungersFromFlushes = 0;
  GAME.horizonSparks = 0;
  GAME.horizonUpgrades = { pace: 0, seal: 0 };
  GAME.evoStage = 0;
  GAME.hunger = 100;
  GAME.clean = 100;
  GAME.happy = 100;
  GAME.comboHeat = 0;
  GAME.turboRushTime = 0;
  GAME.turboStarMultTime = 0;
  GAME.autoclickerActive = false;
  GAME.autoclickerSpeed = 1;
  GAME.vipPass = false;
  GAME.vipPassExpires = 0;
  GAME.autoFlushActive = false;
  GAME.autoBreakthroughActive = false;
  GAME.tickleCount = 0;
  GAME.currentRunPeakGPS = 0;
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

export async function hardReset() {
  // 1. Wipe runtime catalogs, stats, and progression in memory
  wipeRuntimeCatalogs();

  // 2. Overwrite local storage with pure zero state
  saveLocal();

  // 3. Purge cloud save from server
  try {
    const targetId = GAME.playerId || ((typeof localStorage !== 'undefined') ? localStorage.getItem('PoopSim_PlayerId') : null);
    if (targetId) {
      await fetch(`/api/cloud-save?action=wipe&playerId=${encodeURIComponent(targetId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'wipe', playerId: targetId })
      }).catch(() => null);
    }
  } catch (err) {
    console.warn('Cloud wipe error during hardReset:', err);
  }

  // 4. Remove all local persistent storage keys
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem('PoopSim_User_Account');
  } catch (_) {}

  // 5. Reload to start from clean slate
  if (typeof window !== 'undefined' && window.location) {
    window.location.reload();
  }
}

export function applySaveDataSafely(rawData) {
  if (!rawData) return;
  const data = migrateSaveData(rawData);
  if (!data) return;

  if (data.resetProgress) wipeRuntimeCatalogs();

  const incomingWorldReset = Number(data.worldReset ?? data.game?.worldReset) || 0;
  if (incomingWorldReset > 0) {
    GAME.worldReset = incomingWorldReset;
  }
  const incomingSeq = Number(data.adminSeq ?? data.game?.cloudAdminSeq) || 0;
  if (incomingSeq > (Number(GAME.cloudAdminSeq) || 0)) {
    GAME.cloudAdminSeq = incomingSeq;
  }

  if (data.game) {
    for (const k in data.game) {
      if (data.game[k] !== undefined && data.game[k] !== null) {
        GAME[k] = data.game[k];
      }
    }
    if (!GAME.patchVersion || compareSemver(CURRENT_CLIENT_PATCH_VERSION, GAME.patchVersion) > 0) {
      GAME.patchVersion = CURRENT_CLIENT_PATCH_VERSION;
    }
    if (!GAME.gameMode) GAME.gameMode = GAME.girlyMode ? 'girls' : 'boys';
    if (!GAME.archetype) GAME.archetype = 'balanced';
    if (data.game.transcendUpgrades) {
      GAME.transcendUpgrades = { ...GAME.transcendUpgrades, ...data.game.transcendUpgrades };
    }
    if (data.game.relics) {
      GAME.relics = { ...GAME.relics, ...data.game.relics };
    }
    if (data.relics) {
      GAME.relics = { ...GAME.relics, ...data.relics };
    }
    if (data.transcendUpgrades) {
      GAME.transcendUpgrades = { ...GAME.transcendUpgrades, ...data.transcendUpgrades };
    }
    if (data.game.boutiqueLevels) {
      GAME.boutiqueLevels = { ...GAME.boutiqueLevels, ...data.game.boutiqueLevels };
    }
  }

  let incomingRelics = {};
  if (data.relics && typeof data.relics === 'object') {
    incomingRelics = { ...incomingRelics, ...data.relics };
  }
  if (data.game?.relics && typeof data.game.relics === 'object') {
    incomingRelics = { ...incomingRelics, ...data.game.relics };
  }
  if (data.transcendUpgrades && typeof data.transcendUpgrades === 'object') {
    incomingRelics = { ...incomingRelics, ...data.transcendUpgrades };
  }
  if (data.game?.transcendUpgrades && typeof data.game.transcendUpgrades === 'object') {
    incomingRelics = { ...incomingRelics, ...data.game.transcendUpgrades };
  }

  if (!GAME.relics || typeof GAME.relics !== 'object') GAME.relics = {};
  if (!GAME.transcendUpgrades || typeof GAME.transcendUpgrades !== 'object') GAME.transcendUpgrades = {};

  for (const k in incomingRelics) {
    const v = Number(incomingRelics[k]);
    if (Number.isFinite(v) && v >= 0) {
      GAME.relics[k] = v;
      GAME.transcendUpgrades[k] = v;
    }
  }

  RELICS.forEach((relic) => {
    let lvl = Number(
      GAME.relics[relic.id] ??
      GAME.relics[relic.key] ??
      (relic.legacyKey ? GAME.relics[relic.legacyKey] : undefined) ??
      (relic.legacyKey ? GAME.transcendUpgrades[relic.legacyKey] : undefined) ??
      GAME.transcendUpgrades[relic.id] ?? 0
    );
    const maxVal = relic.max ?? relic.maxLevel ?? 999;
    lvl = Math.max(0, Math.min(maxVal, Math.floor(lvl) || 0));
    GAME.relics[relic.id] = lvl;
    GAME.relics[relic.key] = lvl;
    GAME.transcendUpgrades[relic.id] = lvl;
    if (relic.legacyKey) {
      const flagVal = relic.max === 1 ? (lvl > 0) : lvl;
      GAME.relics[relic.legacyKey] = flagVal;
      GAME.transcendUpgrades[relic.legacyKey] = flagVal;
    }
  });

  console.log("Loaded Relics from cloud:", GAME.relics);

  // Safety sanitisers
  GAME.biomass = keepBio(GAME.biomass);
  GAME.lifetimeBiomassInCurrentCycle = keepBio(GAME.lifetimeBiomassInCurrentCycle ?? GAME.breakthroughProgress ?? GAME.cycleBiomass ?? 0);
  GAME.breakthroughProgress = GAME.lifetimeBiomassInCurrentCycle;
  GAME.allTimeBiomass = keepBio(GAME.allTimeBiomass);
  GAME.cycleBiomass = keepBio(GAME.cycleBiomass);
  GAME.sparkles = keepBio(data.sparkles ?? data.game?.sparkles ?? GAME.sparkles ?? 0);
  GAME.vipCollectedSparkles = keepBio(GAME.vipCollectedSparkles);
  GAME.breakthroughCount = Math.max(0, Math.floor(Number(GAME.breakthroughCount ?? GAME.totalTranscend ?? 0) || 0));
  GAME.totalTranscend = GAME.breakthroughCount;
  GAME.flushCount = Math.max(0, Math.floor(Number(GAME.flushCount ?? GAME.totalPrestiges ?? 0) || 0));
  GAME.totalPrestiges = GAME.flushCount;
  GAME.guildTickets = Math.max(0, Math.min(5, Math.floor(Number(GAME.guildTickets) || 0)));
  GAME.clicksTowardsTicket = Math.max(0, Math.floor(Number(GAME.clicksTowardsTicket) || 0));
  const isVipInSave = Boolean(data.vipPass ?? data.game?.vipPass ?? data.hasVipPass ?? data.game?.hasVipPass ?? false);
  GAME.vipPass = isVipInSave;
  GAME.hasVipPass = isVipInSave;
  delete GAME.vipLevel;
  GAME.vipPassExpires = Math.max(0, Math.floor(Number(GAME.vipPassExpires) || 0));
  GAME.autoFlushActive = isVipInSave && Boolean(data.autoFlushActive ?? data.game?.autoFlushActive ?? false);
  GAME.autoBreakthroughActive = isVipInSave && Boolean(data.autoBreakthroughActive ?? data.game?.autoBreakthroughActive ?? false);
  if (!GAME.stats || typeof GAME.stats !== 'object') {
    GAME.stats = { totalMeteorsCaught: 0 };
  }
  const rawStats = data.stats || data.game?.stats || {};
  const loadedMeteors = Math.max(
    0,
    Math.floor(Number(rawStats.totalMeteorsCaught ?? data.meteorsCaught ?? data.game?.meteorsCaught ?? GAME.stats.totalMeteorsCaught ?? GAME.meteorsCaught ?? 0)) || 0
  );
  GAME.stats.totalMeteorsCaught = loadedMeteors;
  GAME.meteorsCaught = loadedMeteors;
  GAME.horizonSparks = Math.max(0, Math.floor(Number(GAME.horizonSparks) || 0));
  if (!GAME.horizonUpgrades || typeof GAME.horizonUpgrades !== 'object') GAME.horizonUpgrades = { pace: 0, seal: 0 };
  GAME.horizonUpgrades.pace = Math.max(0, Math.min(5, Math.floor(Number(GAME.horizonUpgrades.pace) || 0)));
  GAME.horizonUpgrades.seal = GAME.horizonUpgrades.seal ? 1 : 0;
  GAME.prestigeRolls = keepBio(data.prestigeRolls ?? data.game?.prestigeRolls ?? GAME.prestigeRolls ?? 0);
  GAME.allTimePrestigeRolls = keepBio(GAME.allTimePrestigeRolls);
  GAME.transcendCycleRolls = keepBio(GAME.transcendCycleRolls ?? GAME.prestigeRolls ?? 0);
  if (!gt(GAME.transcendCycleRolls, 0) && gt(GAME.prestigeRolls, 0)) {
    GAME.transcendCycleRolls = GAME.prestigeRolls;
  }
  const rawPlungers = data.transcendPlungers ?? data.game?.transcendPlungers ?? GAME.transcendPlungers ?? 0;
  console.log("Loaded Plungers from cloud:", rawPlungers);
  GAME.transcendPlungers = keepBio(rawPlungers);
  if (!isBig(GAME.transcendPlungers) && (!Number.isFinite(GAME.transcendPlungers) || GAME.transcendPlungers < 0)) {
    GAME.transcendPlungers = 0;
  }
  if (!isFinite(GAME.evoStage) || GAME.evoStage < 0) GAME.evoStage = 0;
  if (!GAME.phaseEcho || typeof GAME.phaseEcho !== 'object') GAME.phaseEcho = {};
  if (!Number.isFinite(GAME.flushesThisCycle) || GAME.flushesThisCycle < 0) GAME.flushesThisCycle = 0;
  if (!Number.isFinite(GAME.pairPlungersFromFlushes) || GAME.pairPlungersFromFlushes < 0) GAME.pairPlungersFromFlushes = 0;
  const phaseCap = maxUnlockedStage(GAME.breakthroughCount ?? GAME.totalTranscend ?? 0);
  if (GAME.evoStage > phaseCap) GAME.evoStage = phaseCap;

  const stepIdx = Math.max(0, Math.min(18, Math.floor(Number(GAME.tutorialStepIndex ?? ((Number(GAME.currentQuestId) || 1) - 1)) || 0)));
  GAME.tutorialStepIndex = stepIdx;
  GAME.currentQuestId = Math.max(1, Math.min(19, Math.floor(Number(GAME.currentQuestId ?? (stepIdx + 1)) || 1)));
  GAME.tutorialCompleted = Boolean(GAME.tutorialCompleted || stepIdx >= 18);
  GAME.tutorialStarted = Boolean(GAME.tutorialStarted || GAME.tutorialCompleted || stepIdx > 0);
  GAME.tutorialQuestOrderV2 = Boolean(GAME.tutorialQuestOrderV2);
  if (!GAME.caseFirstBuyDiscountUsed || typeof GAME.caseFirstBuyDiscountUsed !== 'object') {
    GAME.caseFirstBuyDiscountUsed = {};
  }
  if (GAME.firstCaseDiscountUsed) GAME.caseFirstBuyDiscountUsed.case_classic = true;
  GAME.tutorialCritBonus = Math.max(0, Number(GAME.tutorialCritBonus) || 0);
  GAME.tutorialClickBonus = Math.max(0, Number(GAME.tutorialClickBonus) || 0);
  GAME.tutorialIncomeMult = Math.max(1, Number(GAME.tutorialIncomeMult) || 1);
  GAME.tutorialTempBoostUntil = Math.max(0, Math.floor(Number(GAME.tutorialTempBoostUntil) || 0));
  if (!GAME.tutorialCareDone || typeof GAME.tutorialCareDone !== 'object') {
    GAME.tutorialCareDone = { wash: false, feed: false, tickle: false };
  } else {
    GAME.tutorialCareDone = {
      wash: Boolean(GAME.tutorialCareDone.wash),
      feed: Boolean(GAME.tutorialCareDone.feed),
      tickle: Boolean(GAME.tutorialCareDone.tickle)
    };
  }
  GAME.guildTicketsContributed = Math.max(0, Math.floor(Number(GAME.guildTicketsContributed) || 0));

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
      const perk = PERMANENT_PERKS.find(p => p.id === id || p.legacyId === id);
      if (perk) {
        perk.owned = true;
        if (!GAME.ownedPerks) GAME.ownedPerks = {};
        GAME.ownedPerks[perk.id] = true;
      }
    });
  }

  if (!GAME.ownedPerks) GAME.ownedPerks = {};
  if (data.game?.ownedPerks && typeof data.game.ownedPerks === 'object') {
    GAME.ownedPerks = { ...GAME.ownedPerks, ...data.game.ownedPerks };
  }
  if (Array.isArray(data.ownedPerks)) {
    data.ownedPerks.forEach(id => {
      GAME.ownedPerks[id] = true;
      const perk = PERMANENT_PERKS.find(p => p.id === id || p.legacyId === id);
      if (perk) perk.owned = true;
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

  if (!GAME.patchVersion || compareSemver(CURRENT_CLIENT_PATCH_VERSION, GAME.patchVersion) > 0) {
    GAME.patchVersion = CURRENT_CLIENT_PATCH_VERSION;
  }
  try {
    localStorage.setItem(LOCAL_PATCH_VERSION_KEY, CURRENT_CLIENT_PATCH_VERSION);
  } catch (_) {}

  events.emit('save:loaded');
}

export function readLocalSave() {
  try {
    const isolatedKey = getIsolatedStorageKey();
    const raw = localStorage.getItem(isolatedKey) || localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function loadLocal() {
  try {
    const isolatedKey = getIsolatedStorageKey();
    const raw = localStorage.getItem(isolatedKey) || localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_KEY);
    if (raw) {
      applySaveDataSafely(JSON.parse(raw));
      return true;
    }
  } catch (e) {
    console.warn('LocalStorage load error:', e);
  }
  return false;
}
