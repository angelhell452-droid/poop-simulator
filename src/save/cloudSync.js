import { GAME } from '../core/state.js?v=5.4.0';
import { events } from '../core/events.js';
import { buildSavePayload, saveLocal, applySaveDataSafely, loadLocal, readLocalSave } from './saveManager.js?v=5.4.0';
import { setConfirmedVip } from '../economy/pace.js';
import { setGuildPresence } from '../guild/guildPresence.js?v=5.4.0';
import { cmp, isBig } from '../utils/big.js?v=5.4.0';
import { t } from '../i18n/t.js';
import { canSaveCloud, triggerUpdateNotice, CURRENT_CLIENT_PATCH_VERSION } from '../core/serverAuthority.js?v=5.4.0';
import { handleSessionInterrupted, showLobby } from '../core/lobbyAuth.js?v=5.4.0';
import { pauseGameLoop } from '../core/gameLoop.js?v=5.4.0';

function cmpBio(a, b) {
  return cmp(a && typeof a === 'object' ? a : (Number(a) || 0), b && typeof b === 'object' ? b : (Number(b) || 0));
}

export const CLOUD_SAVE_ENDPOINT = '/api/cloud-save';
export const SOCIAL_ENDPOINT = '/api/social';
export const LEGACY_SAVE_ENDPOINT = '/.netlify/functions/cloud-save';
export const AUTH_STORAGE_KEY = 'PoopSim_User_Account';

let cloudSyncDebounceTimer = null;
let sessionPrompted = false;

function sameSeasonBlank(parsed) {
  if (!parsed?.resetProgress) return false;
  const localParsed = readLocalSave();
  if (breakthroughCount(localParsed) > 0 || (Number(localParsed?.game?.flushCount ?? localParsed?.flushCount) || 0) > 0) {
    return true;
  }
  const season = Number(parsed.worldReset ?? parsed.game?.worldReset) || 0;
  const localSeason = Number(GAME.worldReset) || 0;
  if (!(season > 0 && localSeason === season)) return false;
  const incomingSeq = Number(parsed.adminSeq ?? parsed.game?.cloudAdminSeq) || 0;
  const localSeq = Number(GAME.cloudAdminSeq) || 0;
  return incomingSeq <= localSeq;
}

function askRelogin() {
  const acc = getStoredAccount();
  if (!acc?.username) return;
  if (acc.sessionToken) {
    delete acc.sessionToken;
    saveStoredAccount(acc);
  }
  if (sessionPrompted) return;
  sessionPrompted = true;
  events.emit('auth:relogin');
}

function dropDeadSession() {
  askRelogin();
}

export function markSessionLive() {
  sessionPrompted = false;
}

export async function confirmLiveSession() {
  const stored = getStoredAccount();
  if (!stored?.username) return true;
  if (!stored.sessionToken) {
    askRelogin();
    return false;
  }
  try {
    const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=session`);
    if (res.status === 401) {
      askRelogin();
      return false;
    }
    if (!res.ok) return true;
    const data = await res.json().catch(() => null);
    if (!data || data.online !== true) {
      // Session is invalid → go to lobby login screen, not the superseded modal
      const { showLobby: goLobby } = await import('../core/lobbyAuth.js?v=5.4.0');
      goLobby();
      return false;
    }
    if (data.playerId && stored.playerId && data.playerId !== stored.playerId) {
      askRelogin();
      return false;
    }
    if (data.vipLevel != null) setConfirmedVip(data.vipLevel);
    if (data.guild) setGuildPresence(data.guild);
    return true;
  } catch (err) {
    return true;
  }
}

export async function hashPassword(password) {
  const enc = new TextEncoder().encode("poop_salt_2026_" + password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function authHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const stored = getStoredAccount();
  const token = stored?.sessionToken;
  if (token) headers.Authorization = `Bearer ${token}`;
  const uid = stored?.playerId || GAME.playerId;
  if (uid) headers['X-User-Id'] = uid;
  return headers;
}

export async function cloudFetch(path, options = {}) {
  const opts = {
    credentials: 'include',
    ...options,
    headers: authHeaders(options.headers || {})
  };
  let res = await fetch(path, opts);
  if (!res.ok && res.status === 404 && path.startsWith(CLOUD_SAVE_ENDPOINT)) {
    res = await fetch(path.replace(CLOUD_SAVE_ENDPOINT, LEGACY_SAVE_ENDPOINT), opts);
  }
  if (res.status === 401 && !path.includes('action=login') && !path.includes('action=register')) {
    try {
      const clone = res.clone();
      const data = await clone.json().catch(() => null);
      if (data?.error === 'session_superseded') {
        handleSessionInterrupted();
      }
    } catch (_) {}
  }
  return res;
}

export function getStoredAccount() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredAccount(acc) {
  try {
    if (!acc) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      const existing = getStoredAccount() || {};
      const merged = { ...existing, ...acc };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(merged));
    }
  } catch (e) { }
}

function cloudBody() {
  const payload = buildSavePayload();
  const plungersStr = isBig(GAME.transcendPlungers)
    ? `${GAME.transcendPlungers.m}e${GAME.transcendPlungers.e}`
    : String(GAME.transcendPlungers ?? 0);
  const currentStage = Math.max(1, Math.floor(Number(GAME.peakForm ?? (GAME.evoStage !== undefined ? GAME.evoStage + 1 : 1)) || 1));
  const currentFlushes = Math.max(0, Math.floor(Number(GAME.flushCount ?? GAME.totalPrestiges ?? 0) || 0));
  const currentBreakthroughs = Math.max(0, Math.floor(Number(GAME.breakthroughCount ?? GAME.totalTranscend ?? 0) || 0));

  const stored = getStoredAccount();

  return JSON.stringify({
    playerId: GAME.playerId,
    playerName: GAME.playerName,
    stage: currentStage,
    peakForm: currentStage,
    breakthroughCount: currentBreakthroughs,
    flushCount: currentFlushes,
    totalPrestiges: currentFlushes,
    biomass: GAME.biomass,
    sparkles: GAME.sparkles,
    prestige_currency: GAME.prestigeRolls,
    transcendPlungers: plungersStr,
    adminSeq: Number(GAME.cloudAdminSeq) || 0,
    clientWorldReset: Number(GAME.worldReset) || 0,
    clientPatchVersion: String(GAME.patchVersion || CURRENT_CLIENT_PATCH_VERSION),
    worldReset: Number(GAME.worldReset) || 0,
    patchVersion: String(GAME.patchVersion || CURRENT_CLIENT_PATCH_VERSION),
    passwordHash: stored?.passwordHash || '',
    last_updated: Date.now(),
    saveData: payload
  });
}

function saveStamp(parsed) {
  return Number(parsed?.saveTimestamp ?? parsed?.game?.saveTimestamp ?? parsed?.game?.lastActiveTime) || 0;
}

function saveSeq(parsed) {
  return Number(parsed?.adminSeq ?? parsed?.game?.cloudAdminSeq) || 0;
}

function factoryCopies(parsed) {
  if (!Array.isArray(parsed?.factories)) return 0;
  return parsed.factories.reduce((sum, row) => sum + (Number(row?.count) || 0), 0);
}

function relicCount(parsed) {
  const relics = parsed?.relics || parsed?.game?.relics;
  if (!relics || typeof relics !== 'object') return 0;
  return Object.values(relics).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function breakthroughCount(parsed) {
  return Number(parsed?.game?.breakthroughCount ?? parsed?.breakthroughCount ?? parsed?.game?.totalTranscend ?? parsed?.totalTranscend) || 0;
}

function localIsAhead(localParsed, cloudParsed) {
  if (!cloudParsed) return true;
  if (!localParsed) return false;

  const localGame = localParsed?.game || {};
  const cloudGame = cloudParsed?.game || {};

  // 1. Breakthroughs
  const localBT = breakthroughCount(localParsed);
  const cloudBT = breakthroughCount(cloudParsed);
  if (localBT !== cloudBT) return localBT > cloudBT;

  // 2. Relic levels: if local has bought relics, local must never be overwritten by stale cloud save
  const localRelics = relicCount(localParsed);
  const cloudRelics = relicCount(cloudParsed);
  if (localRelics !== cloudRelics) return localRelics > cloudRelics;

  // 3. Stage & Peak Form
  const localStage = Math.max(Number(localGame.peakForm) || 0, Number(localGame.evoStage) || 0);
  const cloudStage = Math.max(Number(cloudGame.peakForm) || 0, Number(cloudGame.evoStage) || 0);
  if (localStage !== cloudStage) return localStage > cloudStage;

  // 4. Factory copies
  const localCopies = factoryCopies(localParsed);
  const cloudCopies = factoryCopies(cloudParsed);
  if (localCopies !== cloudCopies) return localCopies > cloudCopies;

  // 5. All-time biomass
  const cmpBioRes = cmpBio(localGame.allTimeBiomass, cloudGame.allTimeBiomass);
  if (cmpBioRes !== 0) return cmpBioRes > 0;

  // 6. Tie-breaker: timestamps only if progression is completely identical
  const localStamp = saveStamp(localParsed);
  const cloudStamp = saveStamp(cloudParsed);
  if (localStamp && cloudStamp && localStamp !== cloudStamp) {
    return localStamp > cloudStamp;
  }
  if (localStamp && !cloudStamp) return true;

  return false;
}

export function flushCloudSave() {
  if (!canSaveCloud()) return;
  saveLocal();
  const stored = getStoredAccount();
  if (!stored?.sessionToken || !GAME.playerId) return;
  try {
    const body = cloudBody();
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(CLOUD_SAVE_ENDPOINT, blob);
      } catch (_) {}
    }
    fetch(CLOUD_SAVE_ENDPOINT, {
      method: 'POST',
      headers: authHeaders(),
      body: body,
      keepalive: true
    }).catch(() => {});
  } catch (err) { }
}

export function requestCloudSync(delayMs = 2500) {
  if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
  cloudSyncDebounceTimer = setTimeout(() => {
    syncToCloudDatabase();
  }, delayMs);
}

function setCloudStatus(text, mode) {
  const statusIndicator = document.getElementById('cloudStatusText');
  const box = document.getElementById('cloudIndicator');
  if (statusIndicator) statusIndicator.textContent = text;
  if (box) {
    box.dataset.mode = mode;
    box.title = text;
  }
}

export async function syncToCloudDatabase() {
  if (!canSaveCloud()) return;
  saveLocal();

  const stored = getStoredAccount();
  if (stored?.username && stored?.passwordHash && !stored?.sessionToken) {
    try {
      const loginRes = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=login`, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', username: stored.username, passwordHash: stored.passwordHash })
      });
      const loginData = await loginRes.json().catch(() => null);
      if (loginData?.success && loginData?.sessionToken) {
        stored.sessionToken = loginData.sessionToken;
        saveStoredAccount(stored);
        markSessionLive();
      }
    } catch (_) {}
  }

  setCloudStatus(t('cloud.saving'), 'save');

  const bodyStr = cloudBody();

  try {
    const res = await cloudFetch(CLOUD_SAVE_ENDPOINT, { method: 'POST', body: bodyStr });

    if (res.status === 401) {
      const data = await res.json().catch(() => null);
      if (data?.error === 'session_superseded') {
        handleSessionInterrupted();
        setCloudStatus('⚠️ Сессия приостановлена', 'wait');
      }
      return;
    }

    if (res.status === 409) {
      const data = await res.json().catch(() => null);
      if (data?.error === 'world_reset_mismatch') {
        console.warn('🛑 [CloudSync] 409 Conflict: Server worldReset mismatch. Engaging wipe lock.');
        triggerUpdateNotice('wipe', {
          worldReset: Number(data.serverWorldReset) || 0,
          patchVersion: String(data.serverPatchVersion || CURRENT_CLIENT_PATCH_VERSION)
        });
        setCloudStatus('⚠️ Вайп сервера', 'wait');
        return;
      }
      if (data?.error === 'conflict_outdated' || data?.serverSave) {
        console.warn('⚠️ [CloudSync] 409 Conflict: Incoming save timestamp is older than server save. Overwriting local state with server save.');
        if (data.serverSave) {
          applySaveDataSafely(data.serverSave);
          saveLocal();
        }
        setCloudStatus('Синхронизировано с сервером', 'ok');
        return;
      }
      if (data?.adminSeq) {
        GAME.cloudAdminSeq = Math.max(Number(GAME.cloudAdminSeq) || 0, Number(data.adminSeq));
      }
      const cloudReset = Number(data?.saveData?.worldReset ?? data?.saveData?.game?.worldReset) || 0;
      if (cloudReset > 0) {
        GAME.worldReset = Math.max(Number(GAME.worldReset) || 0, cloudReset);
      }
      if (data?.saveData && !sameSeasonBlank(data.saveData)) {
        const localParsed = readLocalSave();
        if (!localIsAhead(localParsed, data.saveData)) {
          applySaveDataSafely(data.saveData);
          saveLocal();
        }
      }
      setCloudStatus(t('cloud.updating'), 'save');
      return;
    }

    if (res.status === 426) {
      const data = await res.json().catch(() => null);
      console.warn('🚀 [CloudSync] 426 Upgrade Required: Outdated patch version.');
      triggerUpdateNotice('patch', {
        worldReset: Number(data?.serverWorldReset) || Number(GAME.worldReset) || 0,
        patchVersion: String(data?.serverPatchVersion || CURRENT_CLIENT_PATCH_VERSION)
      });
      setCloudStatus('🚀 Обновление', 'save');
      return;
    }

    if (res.ok) {
      setCloudStatus(t('cloud.saved'), 'ok');
    } else {
      setCloudStatus(t('cloud.local'), 'local');
    }
  } catch (err) {
    setCloudStatus(t('cloud.offline'), 'wait');
  }
}

export async function registerAccount(username, password) {
  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: t('auth.userShort') };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: t('auth.passShort') };
  }

  try {
    const passwordHash = await hashPassword(cleanPass);
    const payload = buildSavePayload();

    const bodyObj = {
      action: 'register',
      username: cleanUser,
      passwordHash,
      playerId: GAME.playerId,
      saveData: payload
    };

    const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=register`, {
      method: 'POST',
      body: JSON.stringify(bodyObj)
    });

    const data = await res.json();
    if (data.success) {
      GAME.playerId = data.playerId;
      GAME.playerName = data.username;
      saveStoredAccount({
        username: data.username,
        playerId: data.playerId,
        passwordHash,
        sessionToken: data.sessionToken || ''
      });
      markSessionLive();
      saveLocal();
      return { success: true, username: data.username, playerId: data.playerId };
    } else {
      return { success: false, error: data.error || t('auth.createFail') };
    }
  } catch (err) {
    return { success: false, error: t('auth.netError') };
  }
}

export async function loginAccount(username, password) {
  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, error: t('auth.fillLogin') };
  }

  try {
    const passwordHash = await hashPassword(cleanPass);
    const bodyObj = {
      action: 'login',
      username: cleanUser,
      passwordHash
    };

    const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=login`, {
      method: 'POST',
      body: JSON.stringify(bodyObj)
    });

    const data = await res.json();
    if (data.success) {
      saveStoredAccount({
        username: data.username,
        playerId: data.playerId,
        passwordHash,
        sessionToken: data.sessionToken || ''
      });
      markSessionLive();
      GAME.playerId = data.playerId;
      GAME.playerName = data.username;

      if (data.saveData && !sameSeasonBlank(data.saveData)) {
        const localParsed = readLocalSave();
        if (localIsAhead(localParsed, data.saveData)) {
          requestCloudSync(300);
        } else {
          applySaveDataSafely(data.saveData);
        }
      } else {
        requestCloudSync(300);
      }
      if (data.vipLevel != null) setConfirmedVip(data.vipLevel);
      saveLocal();

      return { success: true, username: data.username, playerId: data.playerId };
    } else {
      return { success: false, error: data.error || t('auth.badLogin') };
    }
  } catch (err) {
    return { success: false, error: t('auth.netError') };
  }
}

export function logoutAccount() {
  saveStoredAccount(null);
  GAME.playerId = '';
  GAME.playerName = '';
  if (typeof window !== 'undefined') {
    pauseGameLoop();
    showLobby();
  }
}

export async function loadFromCloudDatabaseOrLocal() {
  loadLocal();

  // If a stored account exists, ensure GAME holds its credentials
  const stored = getStoredAccount();
  if (stored && stored.playerId) {
    GAME.playerId = stored.playerId;
    if (stored.username) GAME.playerName = stored.username;
  }

  if (!GAME.playerId) return;

  try {
    const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?playerId=${encodeURIComponent(GAME.playerId)}`);

    if (res.ok) {
      const data = await res.json();
      const cloudPayload = data.data || data.save_data;
      if (data?.parseError) {
        setCloudStatus(t('cloud.local'), 'local');
      } else if (data && cloudPayload) {
        const parsed = typeof cloudPayload === 'string' ? JSON.parse(cloudPayload) : cloudPayload;
        const localParsed = readLocalSave();
        const cloudSeq = saveSeq(parsed);
        const localSeq = saveSeq(localParsed);
        const cloudReset = Number(parsed?.worldReset ?? parsed?.game?.worldReset) || 0;
        if (cloudReset > 0) GAME.worldReset = Math.max(Number(GAME.worldReset) || 0, cloudReset);
        if (cloudSeq > 0) GAME.cloudAdminSeq = Math.max(Number(GAME.cloudAdminSeq) || 0, cloudSeq);

        if (sameSeasonBlank(parsed)) {
          requestCloudSync(800);
        } else if (parsed?.resetProgress && localIsAhead(localParsed, parsed)) {
          requestCloudSync(300);
        } else if (cloudSeq > localSeq && !localIsAhead(localParsed, parsed)) {
          applySaveDataSafely(parsed);
          saveLocal();
        } else if (localIsAhead(localParsed, parsed)) {
          requestCloudSync(300);
        } else {
          applySaveDataSafely(parsed);
          saveLocal();
        }
      }
      if (data?.vipLevel != null) setConfirmedVip(data.vipLevel);
    }
  } catch (e) {
    console.warn('Cloud load error:', e);
  }
}

export async function fetchAdminSession() {
  const token = getStoredAccount()?.sessionToken;
  if (!token) return { role: null };
  try {
    const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=admin_session`);
    if (!res.ok) return { role: null };
    return await res.json();
  } catch (err) {
    return { role: null };
  }
}

export async function adminRequest(action, options = {}) {
  const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=${encodeURIComponent(action)}${options.query || ''}`, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({ success: false, error: t('cloud.emptyServer') }));
  if (!res.ok && !data.error) data.error = t('cloud.rejected');
  return data;
}

function socialFail(detail) {
  return {
    success: false,
    offline: true,
    error: detail || t('cloud.failGeneric')
  };
}

async function socialFetch(path, options = {}) {
  const opts = { ...options, headers: authHeaders(options.headers || {}) };
  let res = await fetch(path, opts);
  // Older main builds without /api/social → retry on cloud-save (same actions).
  if (res.status === 404 && path.startsWith(SOCIAL_ENDPOINT)) {
    const cloudPath = path.replace(SOCIAL_ENDPOINT, CLOUD_SAVE_ENDPOINT);
    res = await fetch(cloudPath, opts);
    if (res.status === 404) {
      res = await fetch(cloudPath.replace(CLOUD_SAVE_ENDPOINT, LEGACY_SAVE_ENDPOINT), opts);
    }
  }
  return res;
}

async function socialRequestOnce(action, options = {}) {
  const query = options.query ? `&${options.query}` : '';
  const res = await socialFetch(`${SOCIAL_ENDPOINT}?action=${encodeURIComponent(action)}${query}`, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch (err) { data = null; }
  // 401 on social is normal for unauthenticated users - do NOT trigger session modal
  if (!data || typeof data !== 'object') {
    return socialFail(res.status >= 500
      ? t('cloud.fail500', { code: res.status })
      : t('cloud.failEmpty', { code: res.status || '—' }));
  }
  if (!res.ok) data.success = false;
  if (!res.ok && !data.error) data.error = t('cloud.failRejected', { code: res.status });
  data.offline = false;
  return data;
}

export async function socialRequest(action, options = {}) {
  try {
    return await socialRequestOnce(action, options);
  } catch (err) {
    // One quiet retry — transient Worker/D1 blips are common.
    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return await socialRequestOnce(action, options);
    } catch (err2) {
      return socialFail(t('cloud.failNetwork'));
    }
  }
}

/** Live probe: save/session on main Worker; friends/mail/guild prefer /api/social. */
export async function probeCloudServers() {
  const out = {
    cloud: { ok: false, ms: 0, label: t('cloud.labelSave'), detail: '…' },
    social: { ok: false, ms: 0, label: t('cloud.labelSocial'), detail: '…' },
    session: { ok: false, ms: 0, label: t('cloud.labelSession'), detail: '…' }
  };

  const timed = async (fn) => {
    const t0 = performance.now();
    try {
      const value = await fn();
      return { ok: true, ms: Math.round(performance.now() - t0), value };
    } catch (err) {
      return { ok: false, ms: Math.round(performance.now() - t0), value: null, err };
    }
  };

  const cloud = await timed(() => cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=session`));
  out.cloud.ms = cloud.ms;
  out.session.ms = cloud.ms;
  if (!cloud.ok) {
    out.cloud.detail = t('cloud.noReply');
    out.session.detail = t('cloud.noReply');
  } else {
    const res = cloud.value;
    out.cloud.ok = res.ok || res.status === 401;
    out.cloud.detail = out.cloud.ok
      ? (res.status === 401 ? t('cloud.okMsNeedLogin', { ms: cloud.ms }) : t('cloud.okMs', { ms: cloud.ms }))
      : t('cloud.errMs', { code: res.status, ms: cloud.ms });
    if (res.status === 401) {
      out.session.ok = false;
      out.session.detail = t('cloud.sessionClosed');
    } else if (res.ok) {
      out.session.ok = true;
      out.session.detail = t('cloud.onlineMs', { ms: cloud.ms });
    } else {
      out.session.detail = t('cloud.codeMs', { code: res.status });
    }
  }

  const social = await timed(() => socialRequestOnce('mail'));
  out.social.ms = social.ms;
  if (!social.ok) {
    out.social.detail = t('cloud.noNetMs', { ms: social.ms });
  } else if (social.value?.success) {
    out.social.ok = true;
    out.social.detail = t('cloud.okMs', { ms: social.ms });
  } else if (social.value?.offline) {
    out.social.detail = social.value.error || t('cloud.noAnswerMs', { ms: social.ms });
  } else {
    // 401 on mail still means the Worker answered.
    out.social.ok = true;
    out.social.detail = social.value?.error
      ? t('cloud.detailMs', { detail: social.value.error, ms: social.ms })
      : t('cloud.replyMs', { ms: social.ms });
  }

  out.anyOk = !!(out.cloud.ok || out.social.ok);
  out.allOk = !!(out.cloud.ok && out.social.ok && (out.session.ok || !getStoredAccount()?.sessionToken));
  return out;
}

export async function wipeCloudPlayer(playerId) {
  const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=wipe&playerId=${encodeURIComponent(playerId)}`, { method: 'POST' });
  const data = await res.json().catch(() => ({ success: false, error: t('cloud.emptyServer') }));
  if (!res.ok && !data.error) data.error = t('cloud.wipeRejected');
  return data;
}

export async function wipeAllCloudSaves() {
  const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=wipe_all`, { method: 'POST' });
  const data = await res.json().catch(() => ({ success: false, error: t('cloud.emptyServer') }));
  if (!res.ok && !data.error) data.error = t('cloud.wipeRejected');
  return data;
}

export async function wipePlayerData() {
  try {
    const { hardReset } = await import('./saveManager.js?v=5.4.0');
    await hardReset();
  } catch (e) {
    try {
      if (GAME.playerId) {
        await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=wipe&playerId=${encodeURIComponent(GAME.playerId)}`, { method: 'POST' });
      }
    } catch (_) { }
    saveStoredAccount(null);
    localStorage.clear();
    location.reload();
  }
}
