import { GAME } from './core/state.js';
import { startGameLoop } from './core/gameLoop.js';
import { loadFromCloudDatabaseOrLocal, syncToCloudDatabase, wipePlayerData, requestCloudSync } from './save/cloudSync.js';
import { saveLocal } from './save/saveManager.js';
import { updateHUD, initAutocareListeners, initAutomationToggleListeners, showWelcomeGreeting } from './ui/hudView.js';
import { renderFactories, initFactoryListeners } from './ui/factoryView.js';
import { renderTalents, initTalentsListeners } from './ui/talentView.js';
import { renderShop } from './ui/shopView.js';
import { renderAchievements } from './ui/achievementsView.js';
import { renderEvoChronicles } from './ui/evoChroniclesView.js';
import { renderCasesSystem, initCasesListeners } from './ui/casesView.js';
import { initKnivesIndexListeners } from './ui/knivesIndexView.js';
import { initPetCanvas, triggerPetSquash, addVisualParticle, checkMeteorClick } from './ui/petCanvasView.js';
import { initModals } from './ui/modalManager.js';
import { initAuthModal } from './ui/authModalView.js';
import { initLeaderboardView } from './ui/leaderboardView.js';
import { initPatchNotesListeners, openPatchNotesModal } from './ui/patchNotesView.js';
import { initSmartAssistantListeners } from './ui/smartAssistantView.js';
import { initBugReportListeners } from './ui/bugReportView.js';
import { renderCharacterInventory, initCharacterInventoryListeners } from './ui/characterInventoryView.js';
import { feedPet, washPet, polishPet, ticklePet } from './systems/petCareService.js';
import { addPendingClicks, processBatchedClicks } from './systems/clickService.js';
import { performEvolution } from './progression/evolutionService.js';
import { checkAchievements } from './systems/achievementsService.js';
import { getPassiveIncome } from './economy/production.js';
import { TALENTS } from './data/talents.data.js';
import { ACHIEVEMENTS } from './data/achievements.data.js';
import { SHOP_ITEMS } from './data/shop.data.js';
import { formatNumber } from './utils/numberFormatter.js';
import { formatDurationAway } from './utils/timeUtils.js';
import { events } from './core/events.js';

export function toggleAutoclicker() {
  GAME.autoclickerActive = !GAME.autoclickerActive;
  updateAutoclickerUI();
  saveLocal();
}

export function updateAutoclickerUI() {
  const btn = document.getElementById('btnToggleAutoclicker');
  const led = document.getElementById('autoclickLed');
  const label = document.getElementById('autoclickLabel');
  if (!btn || !led || !label) return;

  // Clamp legacy saves that had 50/200/1000 CPS (the bug source) to max 20
  const rawSpd = GAME.autoclickerSpeed || 10;
  const spd = Math.min(rawSpd, 20);
  if (rawSpd !== spd) GAME.autoclickerSpeed = spd;

  if (GAME.autoclickerActive) {
    btn.className = 'font-game px-3 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition shadow jelly-btn bg-amber-600 hover:bg-amber-500 border-yellow-400 text-white shadow-[0_0_10px_#f59e0b]';
    led.className = 'w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#facc15] animate-ping';
    label.textContent = `АВТОКЛИКЕР: ВКЛ (${spd} CPS ⚡)`;
  } else {
    btn.className = 'font-game px-3 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 hover:bg-stone-700 border-stone-600 text-stone-300';
    led.className = 'w-2.5 h-2.5 rounded-full bg-stone-500';
    label.textContent = 'АВТОКЛИКЕР: ВЫКЛ';
  }

  document.querySelectorAll('.autoclick-spd-btn').forEach(b => {
    const cps = parseInt(b.dataset.cps);
    if (cps === spd) {
      b.className = 'autoclick-spd-btn px-2 py-0.5 rounded bg-amber-600 text-white font-bold border border-yellow-400 shadow';
    } else {
      b.className = 'autoclick-spd-btn px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700';
    }
  });
}


export function setGameMode(mode) {
  GAME.gameMode = mode;
  GAME.girlyMode = (mode === 'girls');
  applyGameModeUI();
  updateHUD();
  renderCasesSystem();
  saveLocal();
}

export function applyGameModeUI() {
  const btnBoys = document.getElementById('btnModeBoys');
  const btnGirls = document.getElementById('btnModeGirls');

  if (GAME.girlyMode || GAME.gameMode === 'girls') {
    document.body.classList.remove('boys-mode');
    document.body.classList.add('girly-mode');
    if (btnBoys) {
      btnBoys.className = 'font-game text-[11px] px-2.5 py-1 rounded-xl transition flex items-center gap-1 text-stone-400 hover:text-white jelly-btn';
    }
    if (btnGirls) {
      btnGirls.className = 'font-game text-[11px] px-2.5 py-1 rounded-xl transition flex items-center gap-1 shadow jelly-btn bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 text-white border border-pink-300 font-bold shadow-[0_0_12px_rgba(244,114,182,0.5)]';
    }
  } else {
    document.body.classList.remove('girly-mode');
    document.body.classList.add('boys-mode');
    if (btnBoys) {
      btnBoys.className = 'font-game text-[11px] px-2.5 py-1 rounded-xl transition flex items-center gap-1 shadow jelly-btn bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white border border-cyan-400 font-bold shadow-[0_0_12px_rgba(56,189,248,0.5)]';
    }
    if (btnGirls) {
      btnGirls.className = 'font-game text-[11px] px-2.5 py-1 rounded-xl transition flex items-center gap-1 text-stone-400 hover:text-pink-300 jelly-btn';
    }
  }
}

export async function bootstrap() {
  console.log('🚀 Bootstrapping Poop Simulator (Modular Architecture v2)...');

  // 1. Initialize UI Canvas, Modals, Cases, Knives & Autocare Listeners
  initPetCanvas();
  initModals();
  initCasesListeners();
  initKnivesIndexListeners();
  initTalentsListeners();
  initFactoryListeners();
  initAutocareListeners();
  initAutomationToggleListeners();
  initAuthModal();
  initLeaderboardView();
  initPatchNotesListeners();
  initSmartAssistantListeners();
  initBugReportListeners();
  initCharacterInventoryListeners();

  // Secret Click Trophy on Logo
  document.getElementById('logoSecretClick')?.addEventListener('click', () => {
    const ach = ACHIEVEMENTS.find(a => a.id === 'ach_secret');
    if (ach && !ach.done) {
      ach.done = true;
      GAME.sparkles += ach.reward;
      addVisualParticle('🤫 Секрет найден! +25✨', '#facc15', 1.5);
      checkAchievements();
      updateHUD();
      renderAchievements();
      saveLocal();
    }
  });

  // 2. Load Save (Local + Cloud D1)
  await loadFromCloudDatabaseOrLocal();

  // 3. Apply Saved Game Mode
  applyGameModeUI();
  updateAutoclickerUI();

  // 4. Setup Hotkeys (Space / KeyA for Autoclicker)
  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'KeyA') && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      toggleAutoclicker();
    }
  });

  // Autoclicker toggle button & speed buttons
  document.getElementById('btnToggleAutoclicker')?.addEventListener('click', toggleAutoclicker);
  document.querySelectorAll('.autoclick-spd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cps = parseInt(btn.dataset.cps);
      if (cps) {
        GAME.autoclickerSpeed = cps;
        updateAutoclickerUI();
        saveLocal();
      }
    });
  });

  // Game Mode Listeners
  document.getElementById('btnModeBoys')?.addEventListener('click', () => setGameMode('boys'));
  document.getElementById('btnModeGirls')?.addEventListener('click', () => setGameMode('girls'));

  // 5. Pointer Click on Canvas (Meteor or Click)
  const canvasBox = document.getElementById('canvasBox');
  if (canvasBox) {
    canvasBox.addEventListener('pointerdown', (e) => {
      if (checkMeteorClick(e.clientX, e.clientY)) {
        return;
      }
      addPendingClicks(1);
      triggerPetSquash(1.25, 0.8);
      processBatchedClicks(e.clientX, e.clientY);
    });
  }

  // 6. Pet Care Buttons
  document.getElementById('btnFeed')?.addEventListener('click', () => {
    if (feedPet()) {
      addVisualParticle('🍔 Покушал! +50% к Клику! (+1✨)', '#f97316', 1.25);
      checkAchievements();
      updateHUD();
      saveLocal();
    }
  });

  document.getElementById('btnWash')?.addEventListener('click', () => {
    if (washPet()) {
      addVisualParticle('🧼 Отмылся! +40% к Заводам! (+1✨)', '#38bdf8', 1.25);
      checkAchievements();
      updateHUD();
      saveLocal();
    }
  });

  document.getElementById('btnPolish')?.addEventListener('click', () => {
    if (polishPet()) {
      addVisualParticle('✨ Идеальный блеск! +4 ✨', '#facc15', 1.35);
      checkAchievements();
      updateHUD();
      saveLocal();
    }
  });

  document.getElementById('btnTickle')?.addEventListener('click', () => {
    if (ticklePet()) {
      addVisualParticle('🪶 Щекотно! Комбо растет!', '#ec4899', 1.25);
      updateHUD();
    }
  });


  // Evolution button
  document.getElementById('btnEvolve')?.addEventListener('click', () => {
    if (performEvolution()) {
      triggerPetSquash(1.4, 1.4);
      addVisualParticle('🧬 Мутация!', '#facc15', 1.5);
      checkAchievements();
      renderEvoChronicles();
      updateHUD();
      saveLocal();
      requestCloudSync(1500);
    }
  });

  // Multiplier switcher buttons (x1, x10, x100, xMAX)
  document.querySelectorAll('.buy-mult-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.mult === 'max' ? 'max' : parseInt(btn.dataset.mult);
      GAME.buyMultiplier = m;
      updateMultiplierUI();
      renderFactories();
      renderTalents();
      updateHUD();
      saveLocal();
    });
  });

  // Tab Navigation (6 panels)
  document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      ['panelEvo', 'panelFactories', 'panelShop', 'panelTalents', 'panelCases', 'panelTrophies'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
      document.getElementById(target)?.classList.remove('hidden');

      document.querySelectorAll('.dash-tab').forEach(t => {
        t.className = 'dash-tab py-2.5 text-center text-stone-400 hover:text-white';
      });
      tab.className = 'dash-tab py-2.5 text-center bg-amber-700 text-white';

      // Trigger panel-specific rendering
      if (target === 'panelFactories') renderFactories();
      else if (target === 'panelTalents') renderTalents();
      else if (target === 'panelShop') renderShop();
      else if (target === 'panelCases') renderCasesSystem();
      else if (target === 'panelEvo') renderEvoChronicles();
      else if (target === 'panelTrophies') renderAchievements();
    });
  });

  // Account Modal & Wipe Button
  document.getElementById('btnAccountModal')?.addEventListener('click', () => {
    const inpId = document.getElementById('inpPlayerId');
    if (inpId) inpId.value = GAME.playerId;
    const inpName = document.getElementById('inpPlayerName');
    if (inpName) inpName.value = GAME.playerName;
    document.getElementById('accountModal')?.classList.remove('hidden');
  });

  document.getElementById('btnResetData')?.addEventListener('click', async () => {
    if (confirm('ВНИМАНИЕ! Это полностью сотрет весь прогресс и перерождения как на устройстве, так и на сервере. Продолжить?')) {
      await wipePlayerData();
    }
  });

  // 7. Check AFK Offline Progress
  checkOfflineProgress();

  // 8. Initial UI Render across all active components
  updateMultiplierUI();
  renderFactories();
  renderTalents();
  renderShop();
  renderAchievements();
  renderEvoChronicles();
  renderCasesSystem();
  renderCharacterInventory();
  updateHUD();

  // 9. Event Listener for tick UI sync
  events.on('tick', () => {
    updateHUD();
  });

  // 10. Start High-Resolution Game Loop (100ms)
  startGameLoop();

  // Dynamic live chronicles update on any evolution
  events.on('evolution:success', () => {
    const panelEvo = document.getElementById('panelEvo');
    if (panelEvo && !panelEvo.classList.contains('hidden')) {
      renderEvoChronicles();
    }
  });

  // 11. Auto-sync to Cloudflare D1 every 10s
  setInterval(() => {
    syncToCloudDatabase();
  }, 10000);

  // 12. Page leave listener
  window.addEventListener('beforeunload', () => saveLocal());
  window.addEventListener('pagehide', () => saveLocal());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveLocal();
  });

  // Expose global helpers for debugging / console
  window.GAME = GAME;
  window.wipePlayerData = wipePlayerData;
  window.syncToCloudDatabase = syncToCloudDatabase;

  // 13. Show welcome greeting & auto pop-up patch notes on launch
  showWelcomeGreeting();
  setTimeout(() => {
    openPatchNotesModal();
  }, 350);

  console.log('✅ Poop Simulator initialized successfully.');
}

function checkOfflineProgress() {
  const now = Date.now();
  if (GAME.lastActiveTime && now - GAME.lastActiveTime > 45000) {
    const awaySeconds = Math.floor((now - GAME.lastActiveTime) / 1000);
    const slumberTalent = TALENTS.find(t => t.id === 'afk_slumber');
    const godArtifact = GAME.transcendUpgrades?.afkCap || 0;
    const maxHours = 4 + (slumberTalent ? slumberTalent.level * 3 : 0) + godArtifact * 12;
    const maxSeconds = maxHours * 3600;
    const effectiveSeconds = Math.min(awaySeconds, maxSeconds);

    const boosterActive = SHOP_ITEMS.find(i => i.id === 'upg_afk_booster')?.owned;
    const efficiency = boosterActive ? 1.0 : (0.35 + (slumberTalent ? slumberTalent.level * 0.05 : 0));
    const basePassive = getPassiveIncome();
    const offlineBiomass = Math.round(basePassive * effectiveSeconds * efficiency);
    const offlineSparkles = Math.min(500, Math.floor(effectiveSeconds / 180));

    if (offlineBiomass > 0 || offlineSparkles > 0) {
      GAME.biomass += offlineBiomass;
      GAME.allTimeBiomass += offlineBiomass;
      GAME.cycleBiomass += offlineBiomass;
      GAME.sparkles += offlineSparkles;

      const offTimeEl = document.getElementById('offlineTimeText');
      if (offTimeEl) offTimeEl.textContent = `Вы отсутствовали ${formatDurationAway(effectiveSeconds)} (эффективность ${Math.round(efficiency * 100)}%)`;
      const bioEl = document.getElementById('offlineBioGain');
      if (bioEl) bioEl.textContent = `+${formatNumber(offlineBiomass)} 💨`;
      const spEl = document.getElementById('offlineSparkleGain');
      if (spEl) spEl.textContent = `+${formatNumber(offlineSparkles)} ✨`;

      document.getElementById('offlineModal')?.classList.remove('hidden');
    }
  }
  GAME.lastActiveTime = now;
}

export function updateMultiplierUI() {
  const m = GAME.buyMultiplier;
  document.querySelectorAll('.buy-mult-btn').forEach(b => {
    const mv = b.dataset.mult === 'max' ? 'max' : parseInt(b.dataset.mult);
    const isActive = (m === 'max' && mv === 'max') || (parseInt(m) === mv);
    b.className = isActive
      ? 'buy-mult-btn px-2.5 py-0.5 rounded-lg font-game text-[11px] bg-amber-600 text-white font-bold border border-yellow-400 shadow jelly-btn'
      : 'buy-mult-btn px-2.5 py-0.5 rounded-lg font-game text-[11px] bg-stone-800 text-stone-300 border border-stone-700 hover:text-white jelly-btn';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

