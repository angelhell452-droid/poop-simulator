import { GAME } from './state.js';
import { getPassiveIncome } from '../economy/production.js';
import { processBatchedClicks, addPendingClicks } from '../systems/clickService.js';
import { decayNeeds, runAutoCare } from '../systems/petCareService.js';
import { performEvolution } from '../progression/evolutionService.js';
import { checkAchievements } from '../systems/achievementsService.js';
import { saveLocal } from '../save/saveManager.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { FACTORIES } from '../data/factories.data.js';
import { buyFactory } from '../systems/factoryService.js';
import { triggerPetSquash } from '../ui/petCanvasView.js';
import { events } from './events.js';

let lastTickTime = performance.now();
let autoEvoTimer = 0;
let autoBuyerTimer = 0;
let autoCareTimer = 0;
let autoSaveTimer = 0;
let passiveRollAccumulator = 0;
let lastSecondClicks = 0;
export let liveCps = 0;
// Autoclicker fractional accumulator — prevents bulk batching of 100+ clicks per tick
let autoClickAccumulator = 0;

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

  // 2. High-Speed Autoclicker Engine
  // Uses a fractional accumulator so we add exactly 1 click at a time,
  // matching the behaviour of a manual click. This prevents the batch-crit
  // explosion where 100 clicks/tick × 20× crit = absurd mass at level 0.
  if (GAME.autoclickerActive) {
    const cps = GAME.autoclickerSpeed || 10; // No cap — 1000 CPS is intentional game design!
    // But each click is processed INDIVIDUALLY via the fractional accumulator,
    // not as one giant batch. This keeps crits identical to manual clicks.
    autoClickAccumulator += cps * dt;
    const clicksThisTick = Math.floor(autoClickAccumulator);
    autoClickAccumulator -= clicksThisTick;
    if (clicksThisTick > 0) {
      // Process each click individually (same path as manual click) to keep crits fair
      for (let i = 0; i < clicksThisTick; i++) {
        addPendingClicks(1);
        processBatchedClicks();
      }
      triggerPetSquash(1.12, 0.9);
    }
  } else {
    processBatchedClicks();
  }

  // 3. Transcendence Artifact: Auto-Evolution (every 1.0s)
  autoEvoTimer += dt;
  if (autoEvoTimer >= 1.0) {
    autoEvoTimer = 0;
    if (GAME.transcendUpgrades?.autoEvolution && GAME.autoEvolutionEnabled !== false && GAME.evoStage < EVOLUTIONS.length - 1) {
      performEvolution();
    }
  }

  // 3.5 Transcendence Artifact: Auto-Buyer (every 1.2s)
  autoBuyerTimer += dt;
  if (autoBuyerTimer >= 1.2) {
    autoBuyerTimer = 0;
    if (GAME.transcendUpgrades?.autoBuyer && GAME.autoBuyerEnabled !== false) {
      for (let i = FACTORIES.length - 1; i >= 0; i--) {
        const fac = FACTORIES[i];
        if (fac.reqStage === undefined || GAME.evoStage >= fac.reqStage) {
          if (buyFactory(fac.id)) break;
        }
      }
    }
  }

  // 4. Transcendence Artifact: Passive Toilet Rolls
  if (GAME.transcendUpgrades?.passiveRolls > 0) {
    passiveRollAccumulator += dt;
    if (passiveRollAccumulator >= 5.0) {
      passiveRollAccumulator = 0;
      const pRolls = GAME.transcendUpgrades.passiveRolls;
      GAME.prestigeRolls += pRolls;
      GAME.allTimePrestigeRolls = (GAME.allTimePrestigeRolls || 0) + pRolls;
      GAME.transcendCycleRolls = (GAME.transcendCycleRolls || 0) + pRolls;
    }
  }

  // 5. Combo Heat & Turbo Rush
  const timeSinceLastClick = Date.now() - (GAME.lastClickTimestamp || 0);
  const isActivelyClicking = timeSinceLastClick < 800 || (liveCps > 0);

  if (GAME.turboRushTime > 0) {
    if (!isActivelyClicking) {
      GAME.turboRushTime = Math.max(0, GAME.turboRushTime - dt);
    }
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
