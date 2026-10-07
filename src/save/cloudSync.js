import { GAME } from '../core/state.js?v=5.0.73';
import { events } from '../core/events.js';
import { buildSavePayload, saveLocal, applySaveDataSafely, loadLocal, readLocalSave } from './saveManager.js?v=5.0.73';
import { setConfirmedVip } from '../economy/pace.js';
import { setGuildPresence } from '../guild/guildPresence.js?v=5.0.73';
import { cmp } from '../utils/big.js?v=5.0.73';

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
      askRelogin();
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
  const token = getStoredAccount()?.sessionToken;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function cloudFetch(path, options = {}) {
  const opts = { ...options, headers: authHeaders(options.headers || {}) };
  let res = await fetch(path, opts);
  if (!res.ok && res.status === 404 && path.startsWith(CLOUD_SAVE_ENDPOINT)) {
    res = await fetch(path.replace(CLOUD_SAVE_ENDPOINT, LEGACY_SAVE_ENDPOINT), opts);
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
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(acc));
    }
  } catch (e) { }
}

function cloudBody() {
  const payload = buildSavePayload();
  return JSON.stringify({
    playerId: GAME.playerId,
    playerName: GAME.playerName,
    stage: GAME.evoStage + 1,
    biomass: GAME.biomass,
    sparkles: GAME.sparkles,
    prestige_currency: GAME.prestigeRolls,
    adminSeq: Number(GAME.cloudAdminSeq) || 0,
    worldReset: Number(GAME.worldReset) || 0,
    saveData: payload
  });
}

function saveStamp(parsed) {
  return Number(parsed?.saveTimestamp) || 0;
}

function saveSeq(parsed) {
  return Number(parsed?.adminSeq ?? parsed?.game?.cloudAdminSeq) || 0;
}

function factoryCopies(parsed) {
  if (!Array.isArray(parsed?.factories)) return 0;
  return parsed.factories.reduce((sum, row) => sum + (Number(row?.count) || 0), 0);
}

function localIsAhead(localParsed, cloudParsed) {
  const localStamp = saveStamp(localParsed);
  const cloudStamp = saveStamp(cloudParsed);
  if (localStamp && cloudStamp && localStamp !== cloudStamp) return localStamp > cloudStamp;
  const localGame = localParsed?.game || {};
  const cloudGame = cloudParsed?.game || {};
  const localStage = Number(localGame.evoStage) || 0;
  const cloudStage = Number(cloudGame.evoStage) || 0;
  if (localStage !== cloudStage) return localStage > cloudStage;
  const localCopies = factoryCopies(localParsed);
  const cloudCopies = factoryCopies(cloudParsed);
  if (localCopies !== cloudCopies) return localCopies > cloudCopies;
  return cmpBio(localGame.allTimeBiomass, cloudGame.allTimeBiomass) > 0;
}

export function flushCloudSave() {
  saveLocal();
  const stored = getStoredAccount();
  if (!stored?.sessionToken || !GAME.playerId) return;
  try {
    fetch(CLOUD_SAVE_ENDPOINT, {
      method: 'POST',
      headers: authHeaders(),
      body: cloudBody(),
      keepalive: true
    });
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
  saveLocal();

  const stored = getStoredAccount();
  if (!stored?.sessionToken) {
    if (stored?.username) {
      setCloudStatus('Войдите', 'wait');
      askRelogin();
    } else {
      setCloudStatus('На устройстве', 'local');
    }
    return;
  }
  setCloudStatus('Сохранение…', 'save');

  const bodyStr = cloudBody();

  try {
    const res = await cloudFetch(CLOUD_SAVE_ENDPOINT, { method: 'POST', body: bodyStr });

    if (res.status === 401) {
      dropDeadSession();
      setCloudStatus('Войдите', 'wait');
      return;
    }

    if (res.status === 409) {
      const data = await res.json().catch(() => null);
      if (data?.saveData && !sameSeasonBlank(data.saveData)) {
        applySaveDataSafely(data.saveData);
        saveLocal();
      }
      setCloudStatus('Обновление…', 'save');
      return;
    }

    if (res.ok) {
      setCloudStatus('Сохранено', 'ok');
    } else {
      setCloudStatus('На устройстве', 'local');
    }
  } catch (err) {
    setCloudStatus('Нет сети', 'wait');
  }
}

export async function registerAccount(username, password) {
  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: 'Логин должен содержать минимум 3 символа!' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'Пароль должен содержать минимум 4 символа!' };
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
      return { success: false, error: data.error || 'Ошибка при создании аккаунта' };
    }
  } catch (err) {
    return { success: false, error: 'Сетевая ошибка при связи с Cloudflare D1' };
  }
}

export async function loginAccount(username, password) {
  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, error: 'Заполните все поля для входа!' };
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
        applySaveDataSafely(data.saveData);
      }
      if (data.vipLevel != null) setConfirmedVip(data.vipLevel);
      saveLocal();

      return { success: true, username: data.username, playerId: data.playerId };
    } else {
      return { success: false, error: data.error || 'Неверный логин или пароль' };
    }
  } catch (err) {
    return { success: false, error: 'Сетевая ошибка при связи с Cloudflare D1' };
  }
}

export function logoutAccount() {
  saveStoredAccount(null);
  // Reset playerId to a new guest id so they don't overwrite previous account
  GAME.playerId = 'guest_' + Math.random().toString(36).substring(2, 10);
  GAME.playerName = 'Гость #' + GAME.playerId.substring(GAME.playerId.length - 4);
  saveLocal();
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
        setCloudStatus('На устройстве', 'local');
      } else if (data && cloudPayload) {
        const parsed = typeof cloudPayload === 'string' ? JSON.parse(cloudPayload) : cloudPayload;
        const localParsed = readLocalSave();
        const cloudSeq = saveSeq(parsed);
        const localSeq = saveSeq(localParsed);
        if (sameSeasonBlank(parsed)) {
          requestCloudSync(800);
        } else if (cloudSeq > localSeq || !localIsAhead(localParsed, parsed)) {
          applySaveDataSafely(parsed);
          saveLocal();
        } else {
          requestCloudSync(300);
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
  const data = await res.json().catch(() => ({ success: false, error: 'Пустой ответ сервера' }));
  if (!res.ok && !data.error) data.error = 'Запрос отклонён';
  return data;
}

function socialFail(detail) {
  return {
    success: false,
    offline: true,
    error: detail || 'Облако временно не отвечает. Откройте профиль → статус серверов.'
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
  if (res.status === 401) askRelogin();
  if (!data || typeof data !== 'object') {
    return socialFail(res.status >= 500
      ? `Сервер друзей споткнулся (код ${res.status}). Подождите пару секунд и нажмите «Проверить».`
      : `Облако вернуло пустой ответ (код ${res.status || '—'}).`);
  }
  if (!res.ok) data.success = false;
  if (!res.ok && !data.error) data.error = `Запрос отклонён (код ${res.status})`;
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
      return socialFail('Нет сети или облако недоступно. Проверьте интернет и статус в профиле.');
    }
  }
}

/** Live probe: save/session on main Worker; friends/mail/guild prefer /api/social. */
export async function probeCloudServers() {
  const out = {
    cloud: { ok: false, ms: 0, label: 'Сохранение', detail: '…' },
    social: { ok: false, ms: 0, label: 'Друзья / почта / гильдия', detail: '…' },
    session: { ok: false, ms: 0, label: 'Сессия', detail: '…' }
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
    out.cloud.detail = 'нет ответа';
    out.session.detail = 'нет ответа';
  } else {
    const res = cloud.value;
    out.cloud.ok = res.ok || res.status === 401;
    out.cloud.detail = out.cloud.ok
      ? (res.status === 401 ? `ок · ${cloud.ms} мс · нужен вход` : `ок · ${cloud.ms} мс`)
      : `ошибка · код ${res.status} · ${cloud.ms} мс`;
    if (res.status === 401) {
      out.session.ok = false;
      out.session.detail = 'сессия закрыта — войдите снова';
    } else if (res.ok) {
      out.session.ok = true;
      out.session.detail = `в сети · ${cloud.ms} мс`;
    } else {
      out.session.detail = `код ${res.status}`;
    }
  }

  const social = await timed(() => socialRequestOnce('mail'));
  out.social.ms = social.ms;
  if (!social.ok) {
    out.social.detail = `нет сети · ${social.ms} мс`;
  } else if (social.value?.success) {
    out.social.ok = true;
    out.social.detail = `ок · ${social.ms} мс`;
  } else if (social.value?.offline) {
    out.social.detail = social.value.error || `нет ответа · ${social.ms} мс`;
  } else {
    // 401 on mail still means the Worker answered.
    out.social.ok = true;
    out.social.detail = social.value?.error
      ? `${social.value.error} · ${social.ms} мс`
      : `ответ есть · ${social.ms} мс`;
  }

  out.anyOk = !!(out.cloud.ok || out.social.ok);
  out.allOk = !!(out.cloud.ok && out.social.ok && (out.session.ok || !getStoredAccount()?.sessionToken));
  return out;
}

export async function wipeCloudPlayer(playerId) {
  const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=wipe&playerId=${encodeURIComponent(playerId)}`, { method: 'POST' });
  const data = await res.json().catch(() => ({ success: false, error: 'Пустой ответ сервера' }));
  if (!res.ok && !data.error) data.error = 'Сброс отклонён';
  return data;
}

export async function wipeAllCloudSaves() {
  const res = await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=wipe_all`, { method: 'POST' });
  const data = await res.json().catch(() => ({ success: false, error: 'Пустой ответ сервера' }));
  if (!res.ok && !data.error) data.error = 'Сброс отклонён';
  return data;
}

export async function wipePlayerData() {
  try {
    if (GAME.playerId) {
      await cloudFetch(`${CLOUD_SAVE_ENDPOINT}?action=wipe&playerId=${encodeURIComponent(GAME.playerId)}`, { method: 'POST' });
    }
  } catch (e) { }
  saveStoredAccount(null);
  localStorage.clear();
  location.reload();
}
