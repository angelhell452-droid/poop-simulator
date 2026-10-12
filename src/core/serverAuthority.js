/**
 * Strict Server Authority (SSA) & Soft Reload Subsystem
 *
 * Enforces two-phase version validation (worldReset & patchVersion)
 * to prevent database overwrites after wipes and handle graceful patch updates.
 */

import { GAME, getDefaultGameState } from './state.js?v=5.0.80';
import { wipeRuntimeCatalogs } from '../save/saveManager.js?v=5.0.80';

export const CURRENT_CLIENT_PATCH_VERSION = '5.4.0';
export const LOCAL_WORLD_RESET_KEY = 'PoopSim_WorldReset';
export const LOCAL_PATCH_VERSION_KEY = 'PoopSim_PatchVersion';

export function compareSemver(a, b) {
  const pa = String(a || '0').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

const VERSION_ENDPOINT = '/api/version';
const FALLBACK_VERSION_ENDPOINT = '/api/cloud-save?action=version';

let serverWorldReset = 0;
let serverPatchVersion = CURRENT_CLIENT_PATCH_VERSION;
let localWorldReset = 0;
let localPatchVersion = CURRENT_CLIENT_PATCH_VERSION;

let isWipePending = false;
let isPatchPending = false;
let isNoticeActive = false;
let countdownInterval = null;
let watcherInterval = null;
let isHandshakeComplete = false;
let onReloadLocalSave = null;

export function registerLocalSaveCallback(fn) {
  onReloadLocalSave = fn;
}

export function canSaveLocal() {
  // If a global server wipe is detected, all local saves are immediately frozen!
  return !isWipePending;
}

export function canSaveCloud() {
  // If a wipe OR patch is pending, cloud network saves are frozen to prevent 409/426 errors.
  return !isWipePending && !isPatchPending;
}

export function getAuthorityVersions() {
  return {
    serverWorldReset,
    serverPatchVersion,
    localWorldReset,
    localPatchVersion,
    isWipePending,
    isPatchPending
  };
}

/**
 * Fetch current version configuration from server.
 * Never throws — returns parsed object or null on failure.
 */
export async function fetchServerVersions(timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const tryFetch = async (url) => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      if (data && typeof data === 'object' && (data.worldReset !== undefined || data.patchVersion !== undefined)) {
        return {
          worldReset: Number(data.worldReset) || 0,
          patchVersion: String(data.patchVersion || CURRENT_CLIENT_PATCH_VERSION).trim()
        };
      }
      return null;
    } catch (_) {
      return null;
    }
  };

  try {
    let result = await tryFetch(VERSION_ENDPOINT);
    if (!result) {
      result = await tryFetch(FALLBACK_VERSION_ENDPOINT);
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Blocking handshake executed BEFORE big.js mechanics and reading LocalStorage.
 * Halts boot if server cannot be reached, and handles initial wipe vs patch branching.
 */
export async function performBlockingHandshake() {
  return new Promise((resolve) => {
    async function attempt() {
      // 1. Read existing local versions from localStorage
      let hasStoredReset = false;
      try {
        const storedReset = localStorage.getItem(LOCAL_WORLD_RESET_KEY);
        hasStoredReset = storedReset !== null;
        localWorldReset = hasStoredReset ? (Number(storedReset) || 0) : 0;
        const storedPatch = localStorage.getItem(LOCAL_PATCH_VERSION_KEY);
        localPatchVersion = storedPatch ? String(storedPatch).trim() : CURRENT_CLIENT_PATCH_VERSION;
      } catch (_) {
        localWorldReset = 0;
        localPatchVersion = CURRENT_CLIENT_PATCH_VERSION;
      }

      // If client code version is newer than stored localPatchVersion, update stored version immediately
      if (compareSemver(CURRENT_CLIENT_PATCH_VERSION, localPatchVersion) > 0) {
        localPatchVersion = CURRENT_CLIENT_PATCH_VERSION;
        try {
          localStorage.setItem(LOCAL_PATCH_VERSION_KEY, CURRENT_CLIENT_PATCH_VERSION);
        } catch (_) {}
      }

      // 2. Fetch server versions
      const remote = await fetchServerVersions(6000);

      if (!remote) {
        console.warn('⚠️ [StrictAuthority] Server handshake unreachable. Blocking game launch.');
        renderHandshakeErrorScreen(() => {
          showHandshakeRetrying();
          attempt();
        });
        return;
      }

      serverWorldReset = Number(remote.worldReset) || 0;
      serverPatchVersion = String(remote.patchVersion || CURRENT_CLIENT_PATCH_VERSION);

      // 3. Evaluate Wipe vs Patch vs First-Time Adoption
      if (!hasStoredReset) {
        // First run on new client version: adoption, NOT a wipe!
        console.log(`🔒 [StrictAuthority] Initialized tracking: worldReset=${serverWorldReset}, patch=${serverPatchVersion}`);
        try {
          localStorage.setItem(LOCAL_WORLD_RESET_KEY, String(serverWorldReset));
          localStorage.setItem(LOCAL_PATCH_VERSION_KEY, String(serverPatchVersion));
        } catch (_) {}
        localWorldReset = serverWorldReset;
        localPatchVersion = serverPatchVersion;
        GAME.worldReset = serverWorldReset;
        GAME.patchVersion = serverPatchVersion;
      } else if (serverWorldReset > localWorldReset) {
        // Real server-side world reset triggered!
        console.warn(`🚨 [StrictAuthority] Server world wipe detected! Server: ${serverWorldReset}, Local: ${localWorldReset}.`);
        try {
          localStorage.removeItem('PoopSim_Save'); // ONLY wipe game progress, preserve PoopSim_User_Account and settings!
          localStorage.setItem(LOCAL_WORLD_RESET_KEY, String(serverWorldReset));
          localStorage.setItem(LOCAL_PATCH_VERSION_KEY, String(serverPatchVersion));
        } catch (_) {}

        wipeRuntimeCatalogs();
        const fresh = getDefaultGameState();
        fresh.worldReset = serverWorldReset;
        fresh.patchVersion = serverPatchVersion;
        if (GAME.playerId) fresh.playerId = GAME.playerId;
        if (GAME.playerName) fresh.playerName = GAME.playerName;
        Object.assign(GAME, fresh);

        localWorldReset = serverWorldReset;
        localPatchVersion = serverPatchVersion;
      } else {
        // worldReset matches
        // Only trigger patch if server is strictly newer than local version!
        if (compareSemver(serverPatchVersion, localPatchVersion) > 0) {
          console.log(`✨ [StrictAuthority] Patch update detected: ${localPatchVersion} -> ${serverPatchVersion}`);
          try {
            localStorage.setItem(LOCAL_PATCH_VERSION_KEY, String(serverPatchVersion));
          } catch (_) {}
          localPatchVersion = serverPatchVersion;
        } else {
          // Local client is already equal or newer than server
          serverPatchVersion = localPatchVersion;
        }

        try {
          localStorage.setItem(LOCAL_WORLD_RESET_KEY, String(serverWorldReset));
          localStorage.setItem(LOCAL_PATCH_VERSION_KEY, String(localPatchVersion));
        } catch (_) {}

        GAME.worldReset = serverWorldReset;
        GAME.patchVersion = localPatchVersion;
      }

      isHandshakeComplete = true;
      dismissHandshakeErrorScreen();
      resolve({ worldReset: serverWorldReset, patchVersion: serverPatchVersion });
    }

    attempt();
  });
}

/**
 * Display full blocking veil if handshake cannot reach server
 */
function renderHandshakeErrorScreen(onRetry) {
  let veil = document.getElementById('bootVeil');
  if (!veil) {
    veil = document.createElement('div');
    veil.id = 'bootVeil';
    veil.className = 'boot-veil';
    document.body.prepend(veil);
  }

  veil.removeAttribute('hidden');
  veil.style.display = 'flex';
  veil.style.position = 'fixed';
  veil.style.inset = '0';
  veil.style.zIndex = '9999';
  veil.style.background = '#121816';
  veil.style.alignItems = 'center';
  veil.style.justifyContent = 'center';

  veil.innerHTML = `
    <div class="flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto space-y-4 font-sans text-stone-100 selection:bg-amber-400">
      <div class="text-5xl animate-bounce">📡</div>
      <h2 class="text-lg font-extrabold text-amber-300 tracking-wide uppercase">Связь с сервером не установлена</h2>
      <p class="text-xs text-stone-300 leading-relaxed font-semibold">
        Для защиты сохранности данных и проверки актуальности игры требуется подтверждение от сервера. Проверьте интернет-соединение.
      </p>
      <div id="handshakeStatusMsg" class="text-[11px] text-stone-400 font-mono">Ожидание подключения...</div>
      <button id="btnRetryHandshake" type="button" class="jelly-btn px-6 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg border border-yellow-300/40 cursor-pointer transition transform active:scale-95">
        Повторить попытку
      </button>
    </div>
  `;

  document.getElementById('btnRetryHandshake')?.addEventListener('click', onRetry);
}

function showHandshakeRetrying() {
  const statusEl = document.getElementById('handshakeStatusMsg');
  const btn = document.getElementById('btnRetryHandshake');
  if (statusEl) statusEl.textContent = 'Подключение к серверу...';
  if (btn) {
    btn.setAttribute('disabled', 'true');
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

function dismissHandshakeErrorScreen() {
  const veil = document.getElementById('bootVeil');
  if (veil) {
    veil.innerHTML = '<span data-i18n="common.loading">Загрузка</span>';
  }
}

/**
 * 60-second periodic background authority polling & visibilitychange listener
 */
export function startAuthorityWatcher() {
  if (watcherInterval) clearInterval(watcherInterval);

  const check = async () => {
    if (!isHandshakeComplete || isNoticeActive) return;
    try {
      const remote = await fetchServerVersions(5000);
      if (!remote) return;

      if (Number(remote.worldReset) > Number(localWorldReset)) {
        triggerUpdateNotice('wipe', remote);
      } else if (compareSemver(remote.patchVersion, localPatchVersion) > 0) {
        triggerUpdateNotice('patch', remote);
      }
    } catch (err) {
      console.warn('[StrictAuthority] Watcher check warning:', err);
    }
  };

  watcherInterval = setInterval(check, 60000);

  // Requirement 5: Check immediately when tab becomes visible BEFORE autosaves
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      check();
    }
  });
}

/**
 * Trigger 5-minute soft countdown notification banner
 */
export function triggerUpdateNotice(type, remote) {
  if (isNoticeActive) return;
  isNoticeActive = true;

  if (type === 'wipe') {
    isWipePending = true;
    console.warn('🛑 [StrictAuthority] WIPE DETECTED! All local and cloud saves disabled.');
  } else {
    isPatchPending = true;
    console.warn('🚀 [StrictAuthority] PATCH DETECTED! Cloud saves disabled, local saves remain active.');
  }

  serverWorldReset = remote.worldReset;
  serverPatchVersion = remote.patchVersion;

  createCountdownBanner(type);
}

function createCountdownBanner(type) {
  const isWipe = type === 'wipe';
  let secondsLeft = 300; // 5 minutes

  const banner = document.createElement('div');
  banner.id = 'authorityUpdateBanner';
  banner.className = 'fixed top-3 left-1/2 transform -translate-x-1/2 z-[950] w-[95%] max-w-lg p-3 rounded-2xl border shadow-2xl backdrop-blur-md transition-all font-sans';
  
  if (isWipe) {
    banner.className += ' bg-red-950/95 border-red-500/80 text-red-100 shadow-[0_0_25px_rgba(239,68,68,0.4)]';
  } else {
    banner.className += ' bg-indigo-950/95 border-cyan-400/80 text-cyan-50 shadow-[0_0_25px_rgba(6,182,212,0.4)]';
  }

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const renderContent = () => {
    banner.innerHTML = `
      <div class="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl select-none animate-pulse">${isWipe ? '⚠️' : '🚀'}</span>
          <div class="text-left space-y-0.5">
            <div class="text-xs font-extrabold uppercase tracking-wide ${isWipe ? 'text-red-300' : 'text-cyan-300'}">
              ${isWipe ? 'Глобальный вайп сервера' : 'Доступно обновление игры!'}
            </div>
            <div class="text-[11px] text-stone-200">
              Перезагрузка через <b id="authorityTimerVal" class="font-mono text-white text-xs">${formatTime(secondsLeft)}</b>
            </div>
          </div>
        </div>
        <button id="btnReloadNowAuthority" type="button" class="jelly-btn shrink-0 px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase cursor-pointer border shadow transition ${
          isWipe
            ? 'bg-red-600 hover:bg-red-500 text-white border-red-300'
            : 'bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 text-stone-950 border-cyan-200 font-extrabold'
        }">
          ${isWipe ? 'Начать заново' : 'Обновить сейчас'}
        </button>
      </div>
    `;
  };

  renderContent();
  document.body.appendChild(banner);

  const doReload = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    try {
      localStorage.setItem(LOCAL_PATCH_VERSION_KEY, String(serverPatchVersion));
      localStorage.setItem(LOCAL_WORLD_RESET_KEY, String(serverWorldReset));
    } catch (_) {}
    if (!isWipe && typeof onReloadLocalSave === 'function') {
      try {
        onReloadLocalSave();
      } catch (_) {}
    }
    window.location.reload(true);
  };

  document.getElementById('btnReloadNowAuthority')?.addEventListener('click', doReload);

  countdownInterval = setInterval(() => {
    secondsLeft--;
    const timerVal = document.getElementById('authorityTimerVal');
    if (timerVal) {
      timerVal.textContent = formatTime(secondsLeft);
    }
    if (secondsLeft <= 0) {
      doReload();
    }
  }, 1000);
}
