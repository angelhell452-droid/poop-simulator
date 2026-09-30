import { GAME } from './state.js';
import { getPassiveIncome } from '../economy/production.js';
import { processBatchedClicks, addPendingClicks } from '../systems/clickService.js';
import { decayNeeds, runAutoCare } from '../systems/petCareService.js';
import { performEvolution } from '../progression/evolutionService.js';
import { checkAchievements } from '../systems/achievementsService.js';
import { saveLocal } from '../save/saveManager.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { triggerPetSquash } from '../ui/petCanvasView.js';
import { events } from './events.js';

let lastTickTime = performance.now();
let autoEvoTimer = 0;
let autoCareTimer = 0;
let autoSaveTimer = 0;
let passiveRollAccumulator = 0;
let lastSecondClicks = 0;
export let liveCps = 0;

export function gameEngineTick() {
  const now = performance.now();
  let dt = (now - lastTickTime) / 1000;
  lastTickTime = now;

  // Safeguards against tab freeze / sleep jumps
  if (dt <= 0 || isNaN(dt)) dt = 0.1;
  if (dt > 5.0) dt = 5.0;

  // 1. Passive Income with Delta-Time (dt)
  const passivePerSec = getPassiveIncome();
  const passiveGained = passivePerSec * dt;
  GAME.biomass += passiveGained;
  GAME.allTimeBiomass += passiveGained;
  GAME.cycleBiomass += passiveGained;

  // 2. High-Speed Autoclicker Engine & Perk
  let targetCps = 0;
  if (GAME.autoclickerActive) {
    targetCps += (GAME.autoclickerSpeed || 1000);
  }
  if (SHOP_ITEMS.find(i => i.id === 'upg_autoclick')?.owned) {
    targetCps += 20;
  }
  if (targetCps > 0) {
    addPendingClicks(targetCps * dt);
    triggerPetSquash(1.12, 0.9);
  }
  processBatchedClicks();

  // 3. Transcendence Artifact: Auto-Evolution (every 1.0s)
  autoEvoTimer += dt;
  if (autoEvoTimer >= 1.0) {
    autoEvoTimer = 0;
    if (GAME.transcendUpgrades?.autoEvolution && GAME.evoStage < EVOLUTIONS.length - 1) {
      performEvolution();
    }
  }

  // 4. Transcendence Artifact: Passive Toilet Rolls
  if (GAME.transcendUpgrades?.passiveRolls > 0) {
    passiveRollAccumulator += dt;
    if (passiveRollAccumulator >= 5.0) {
      passiveRollAccumulator = 0;
      GAME.prestigeRolls += GAME.transcendUpgrades.passiveRolls;
    }
  }

  // 5. Combo Heat & Turbo Rush
  if (GAME.turboRushTime > 0) {
    GAME.turboRushTime = Math.max(0, GAME.turboRushTime - dt);
    GAME.comboHeat = 100;
  } else {
    GAME.comboHeat = Math.max(0, (GAME.comboHeat || 0) - (3.5 * dt));
  }

  // 6. Natural Pet Needs Decay
  decayNeeds(dt);

  // 7. Auto-Care Engine (every 1.0s)
  autoCareTimer += dt;
  if (autoCareTimer >= 1.0) {
    autoCareTimer = 0;
    runAutoCare();
    checkAchievements();
  }

  // 8. CPS Tracking
  const currentTotalClicks = GAME.totalClicks;
  liveCps = currentTotalClicks - lastSecondClicks;

  // 9. Auto-save (every 1.0s)
  autoSaveTimer += dt;
  if (autoSaveTimer >= 1.0) {
    autoSaveTimer = 0;
    lastSecondClicks = currentTotalClicks;
    GAME.lastActiveTime = Date.now();
    saveLocal();
  }

  events.emit('tick', { dt, liveCps, passivePerSec });
}

export function startGameLoop() {
  lastTickTime = performance.now();
  setInterval(gameEngineTick, 100);
}
