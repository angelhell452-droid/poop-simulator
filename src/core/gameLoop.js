import { GAME } from './state.js?v=5.0.65';
import { getPassiveIncome } from '../economy/production.js?v=5.0.65';
import { processBatchedClicks, addPendingClicks } from '../systems/clickService.js?v=5.0.65';
import { decayNeeds, runAutoCare } from '../systems/petCareService.js';
import { syncEvolutionToBiomass } from '../progression/evolutionService.js?v=5.0.65';
import { checkAchievements } from '../systems/achievementsService.js?v=5.0.65';
import { renderAchievements } from '../ui/achievementsView.js';
import { saveLocal } from '../save/saveManager.js?v=5.0.65';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.65';
import { FACTORIES } from '../data/factories.data.js?v=5.0.65';
import { buyFactory } from '../systems/factoryService.js?v=5.0.65';
import { getAffordableFactoryInfo } from '../economy/costs.js?v=5.0.65';
import { triggerPetSquash } from '../ui/petCanvasView.js?v=5.0.65';
import { getAutoclickCps } from '../systems/autoclickService.js?v=5.0.65';
import { events } from './events.js';
import { gainBio, mul } from '../utils/big.js?v=5.0.65';

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
  const passiveGained = mul(passivePerSec, dt);
  GAME.biomass = gainBio(GAME.biomass, passiveGained);
  GAME.allTimeBiomass = gainBio(GAME.allTimeBiomass, passiveGained);
  GAME.cycleBiomass = gainBio(GAME.cycleBiomass, passiveGained);

  // 2. High-Speed Autoclicker Engine
  // Uses a fractional accumulator so we add exactly 1 click at a time,
  // matching the behaviour of a manual click. This prevents the batch-crit
  // explosion where 100 clicks/tick × 20× crit = absurd mass at level 0.
  if (GAME.autoclickerActive) {
    const cps = getAutoclickCps();
    // But each click is processed INDIVIDUALLY via the fractional accumulator,
    // not as one giant batch. This keeps crits identical to manual clicks.
    autoClickAccumulator += cps * dt;
    const clicksThisTick = Math.floor(autoClickAccumulator);
    autoClickAccumulator -= clicksThisTick;
    if (clicksThisTick > 0) {
      for (let i = 0; i < clicksThisTick; i++) {
        addPendingClicks(1);
        processBatchedClicks();
      }
      triggerPetSquash(1.12, 0.9);
    }
  } else {
    processBatchedClicks();
  }

  // Forms follow biomass earned this run. The relic only speeds that up.
  autoEvoTimer += dt;
  if (autoEvoTimer >= 0.4) {
    autoEvoTimer = 0;
    syncEvolutionToBiomass();
  }

  // 3.5 Transcendence Artifact: Auto-Buyer (every 1.2s)
  autoBuyerTimer += dt;
  if (autoBuyerTimer >= 1.2) {
    autoBuyerTimer = 0;
    if (GAME.transcendUpgrades?.autoBuyer && GAME.autoBuyerEnabled !== false) {
      const unlocked = FACTORIES.filter(fac => fac.reqStage === undefined || GAME.evoStage >= fac.reqStage);
      if (GAME.autoBuyerMode === 'smart') {
        let best = null;
        let bestScore = -1;
        for (const fac of unlocked) {
          const info = getAffordableFactoryInfo(fac);
          if (!info.canBuy || info.singleCost <= 0) continue;
          const score = fac.baseCps / info.singleCost;
          if (score > bestScore) {
            bestScore = score;
            best = fac;
          }
        }
        if (best) buyFactory(best.id);
      } else {
        for (let i = unlocked.length - 1; i >= 0; i--) {
          if (buyFactory(unlocked[i].id)) break;
        }
      }
    }
  }

  // 4. Transcendence Artifact: Passive Toilet Rolls
  if (GAME.transcendUpgrades?.passiveRolls > 0) {
    passiveRollAccumulator += dt;
    if (passiveRollAccumulator >= 180) {
      passiveRollAccumulator = 0;
      const pRolls = Math.min(4, GAME.transcendUpgrades.passiveRolls || 0);
      GAME.prestigeRolls += pRolls;
      GAME.allTimePrestigeRolls = (GAME.allTimePrestigeRolls || 0) + pRolls;
    }
  }

  // 5. Combo Heat & Turbo Rush
  const timeSinceLastClick = Date.now() - (GAME.lastClickTimestamp || 0);
  const isActivelyClicking = timeSinceLastClick < 800 || (liveCps > 0);

  if ((GAME.turboStarMultTime || 0) > 0) {
    GAME.turboStarMultTime = Math.max(0, GAME.turboStarMultTime - dt);
  }

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
    const trophies = document.getElementById('panelTrophies');
    if (trophies && !trophies.classList.contains('hidden')) renderAchievements();
    saveLocal();
  }

  events.emit('tick', { dt, liveCps, passivePerSec });
}

export function startGameLoop() {
  lastTickTime = performance.now();
  setInterval(gameEngineTick, 100);
}
