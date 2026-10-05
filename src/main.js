import { GAME } from './core/state.js?v=5.0.30';
import { startGameLoop } from './core/gameLoop.js?v=5.0.30';
import { loadFromCloudDatabaseOrLocal, syncToCloudDatabase, flushCloudSave, wipePlayerData, requestCloudSync, getStoredAccount, confirmLiveSession } from './save/cloudSync.js?v=5.0.30';
import { saveLocal } from './save/saveManager.js?v=5.0.30';
import { updateHUD, initAutocareListeners, initAutomationToggleListeners, showWelcomeGreeting } from './ui/hudView.js?v=5.0.30';
import { renderFactories, initFactoryListeners } from './ui/factoryView.js?v=5.0.30';
import { renderTalents, initTalentsListeners } from './ui/talentView.js?v=5.0.30';
import { renderShop } from './ui/shopView.js';
import { renderAchievements } from './ui/achievementsView.js';
import { renderCasesSystem, initCasesListeners } from './ui/casesView.js?v=5.0.30';
import { initKnivesIndexListeners } from './ui/knivesIndexView.js?v=5.0.30';
import { initPetCanvas, warmSceneArt, triggerPetSquash, addVisualParticle, checkMeteorClick } from './ui/petCanvasView.js?v=5.0.30';
import { initModals } from './ui/modalManager.js?v=5.0.30';
import { initAuthModal } from './ui/authModalView.js?v=5.0.30';
import { initAdminPanel, refreshAdminAccess } from './ui/adminView.js?v=5.0.30';
import { initLeaderboardView } from './ui/leaderboardView.js';
import { initPatchNotesListeners, openPatchNotesModal } from './ui/patchNotesView.js?v=5.0.30';
import { initVipShop } from './ui/vipShopView.js';
import { initSmartAssistantListeners } from './ui/smartAssistantView.js?v=5.0.30';
import { initBugReportListeners } from './ui/bugReportView.js?v=5.0.30';
import { renderCharacterInventory, initCharacterInventoryListeners } from './ui/characterInventoryView.js?v=5.0.30';
import { feedPet, washPet, polishPet, ticklePet } from './systems/petCareService.js';
import { addPendingClicks, processBatchedClicks } from './systems/clickService.js?v=5.0.30';
import { checkAchievements } from './systems/achievementsService.js?v=5.0.30';
import { getPassiveIncome } from './economy/production.js?v=5.0.30';
import { TALENTS } from './data/talents.data.js';
import { ACHIEVEMENTS } from './data/achievements.data.js?v=5.0.30';
import { SHOP_ITEMS } from './data/shop.data.js?v=5.0.30';
import { formatNumber } from './utils/numberFormatter.js?v=5.0.30';
import { gainBio, isBig, mul } from './utils/big.js?v=5.0.30';
import { formatDurationAway } from './utils/timeUtils.js';
import { clampAutoclickerState, getAutoclickCap, getClickCapCps, isAutoclickUnlocked, syncAutoclickSpeedToCap } from './systems/autoclickService.js?v=5.0.30';
import { events } from './core/events.js';

export function toggleAutoclicker() {
  if (!isAutoclickUnlocked()) return;
  GAME.autoclickerActive = !GAME.autoclickerActive;
  updateAutoclickerUI();
  saveLocal();
}

export function updateAutoclickerUI() {
  const btn = document.getElementById('btnToggleAutoclicker');
  const led = document.getElementById('autoclickLed');
  const label = document.getElementById('autoclickLabel');
  if (!btn || !led || !label) return;

  const unlocked = isAutoclickUnlocked();
  const cap = getAutoclickCap();
  const spd = Math.max(1, Math.round(Math.min(GAME.autoclickerSpeed || 1, cap || 1)));

  if (!unlocked) {
    btn.disabled = true;
    btn.className = 'font-game px-3 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 border-stone-600 text-stone-500';
    led.className = 'w-2.5 h-2.5 rounded-full bg-stone-600';
    label.textContent = 'АВТОКЛИКЕР: ПОСЛЕ 1 СМЫВА';
  } else if (GAME.autoclickerActive) {
    btn.disabled = false;
    btn.className = 'font-game px-3 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition shadow jelly-btn bg-amber-600 hover:bg-amber-500 border-yellow-400 text-white shadow-[0_0_10px_#f59e0b]';
    led.className = 'w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#facc15] animate-ping';
    label.textContent = `АВТОКЛИКЕР: ВКЛ (${formatNumber(spd)} CPS)`;
  } else {
    btn.disabled = false;
    btn.className = 'font-game px-3 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 hover:bg-stone-700 border-stone-600 text-stone-300';
    led.className = 'w-2.5 h-2.5 rounded-full bg-stone-500';
    label.textContent = `АВТОКЛИКЕР: ВЫКЛ · ${formatNumber(cap)} CPS`;
  }

  document.querySelectorAll('.autoclick-spd-btn').forEach(b => {
    const raw = b.dataset.cps;
    const liveCap = getClickCapCps();
    if (raw === 'max') b.textContent = `MAX ${formatNumber(liveCap)}`;
    const selected = unlocked && (raw === 'max' ? spd >= (cap || liveCap) : parseInt(raw, 10) === spd);
    b.disabled = !unlocked;
    if (selected) {
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
  initAdminPanel();
  initLeaderboardView();
  initPatchNotesListeners();
  initVipShop();
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

  events.on('prestige:completed', () => {
    clampAutoclickerState();
    updateAutoclickerUI();
  });
  events.on('save:loaded', () => updateAutoclickerUI());

  let shownClickCap = -1;
  events.on('tick', () => {
    const cap = getClickCapCps();
    if (cap === shownClickCap) return;
    shownClickCap = cap;
    syncAutoclickSpeedToCap();
    updateAutoclickerUI();
    const cpsEl = document.getElementById('invTotalCps');
    if (cpsEl) cpsEl.textContent = `${formatNumber(cap)} CPS`;
  });

  // 2. Load Save (Local + Cloud D1)
  await loadFromCloudDatabaseOrLocal();
  await confirmLiveSession();
  await refreshAdminAccess();

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
      const raw = btn.dataset.cps;
      if (!isAutoclickUnlocked()) return;
      const cap = getClickCapCps();
      const cps = raw === 'max' ? cap : parseInt(raw, 10);
      if (!cps) return;
      GAME.autoclickerSpeed = Math.max(1, Math.min(cap, cps));
      updateAutoclickerUI();
      saveLocal();
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
      if (!processBatchedClicks(e.clientX, e.clientY)) return;
      triggerPetSquash(1.25, 0.8);
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
      return;
    }
    if (Math.round(GAME.clean) >= 100) return;
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
      ['panelFactories', 'panelShop', 'panelTalents', 'panelCases', 'panelTrophies'].forEach(id => {
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
      else if (target === 'panelTrophies') renderAchievements();
    });
  });

  // Account Modal & Wipe Button
  document.getElementById('btnAccountModal')?.addEventListener('click', () => {
    const inpId = document.getElementById('inpPlayerId');
    if (inpId) inpId.value = GAME.playerId;
    const inpName = document.getElementById('inpPlayerName');
    if (inpName) inpName.value = getStoredAccount()?.username || GAME.playerName;
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
  renderCasesSystem();
  renderCharacterInventory();
  updateHUD();

  // 9. Event Listener for tick UI sync
  events.on('tick', () => {
    updateHUD();
  });

  // 10. Start High-Resolution Game Loop (100ms)
  startGameLoop();

  // 11. Auto-sync to Cloudflare D1 every 10s
  setInterval(() => {
    syncToCloudDatabase();
  }, 10000);

  // 12. Page leave listener
  window.addEventListener('beforeunload', () => flushCloudSave());
  window.addEventListener('pagehide', () => flushCloudSave());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushCloudSave();
  });

  await warmSceneArt();
  showWelcomeGreeting();
  setTimeout(() => {
    openPatchNotesModal();
  }, 350);

  events.on('journal:closed', () => {
    document.getElementById('journalWelcome')?.classList.add('hidden');
    if (!pendingOfflineModal) return;
    pendingOfflineModal = false;
    document.getElementById('offlineModal')?.classList.remove('hidden');
  });

  console.log('✅ Poop Simulator initialized successfully.');
}

let pendingOfflineModal = false;

function checkOfflineProgress() {
  const now = Date.now();
  if (GAME.lastActiveTime && now - GAME.lastActiveTime > 45000) {
    const awaySeconds = Math.floor((now - GAME.lastActiveTime) / 1000);
    const slumberTalent = TALENTS.find(t => t.id === 'afk_slumber');
    const sovereignTalent = TALENTS.find(t => t.id === 'time_sovereign');
    const godArtifact = GAME.transcendUpgrades?.afkCap || 0;
    const maxHours = 4 + (slumberTalent ? slumberTalent.level * 2 : 0) + godArtifact * 12;
    const maxSeconds = maxHours * 3600;
    const effectiveSeconds = Math.min(awaySeconds, maxSeconds);

    const boosterActive = SHOP_ITEMS.find(i => i.id === 'upg_afk_booster')?.owned;
    const efficiency = boosterActive ? 1.0 : Math.min(1, 0.35 + (slumberTalent ? slumberTalent.level * 0.15 : 0) + (sovereignTalent ? sovereignTalent.level * 0.08 : 0));
    const basePassive = getPassiveIncome();
    const offlineRaw = mul(mul(basePassive, effectiveSeconds), efficiency);
    const offlineBiomass = isBig(offlineRaw) ? offlineRaw : Math.round(offlineRaw);
    const offlineSparkles = Math.min(500, Math.floor(effectiveSeconds / 180));

    if (offlineBiomass > 0 || isBig(offlineBiomass) || offlineSparkles > 0) {
      GAME.biomass = gainBio(GAME.biomass, offlineBiomass);
      GAME.allTimeBiomass = gainBio(GAME.allTimeBiomass, offlineBiomass);
      GAME.cycleBiomass = gainBio(GAME.cycleBiomass, offlineBiomass);
      GAME.sparkles += offlineSparkles;

      const offTimeEl = document.getElementById('offlineTimeText');
      if (offTimeEl) offTimeEl.textContent = `Вы отсутствовали ${formatDurationAway(effectiveSeconds)} (эффективность ${Math.round(efficiency * 100)}%)`;
      const bioEl = document.getElementById('offlineBioGain');
      if (bioEl) bioEl.textContent = `+${formatNumber(offlineBiomass)} 💨`;
      const spEl = document.getElementById('offlineSparkleGain');
      if (spEl) spEl.textContent = `+${formatNumber(offlineSparkles)} ✨`;

      if (awaySeconds >= 300) pendingOfflineModal = true;
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

