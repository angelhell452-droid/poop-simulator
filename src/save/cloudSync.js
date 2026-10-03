import { GAME } from '../core/state.js';
import { events } from '../core/events.js';
import { buildSavePayload, saveLocal, applySaveDataSafely, loadLocal } from './saveManager.js';

export const CLOUD_SAVE_ENDPOINT = '/api/cloud-save';
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

export function requestCloudSync(delayMs = 2500) {
  if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
  cloudSyncDebounceTimer = setTimeout(() => {
    syncToCloudDatabase();
  }, delayMs);
}

export async function syncToCloudDatabase() {
  saveLocal();

  const statusIndicator = document.getElementById('cloudStatusText');
  const stored = getStoredAccount();
  if (stored?.username && !stored.sessionToken) {
    if (statusIndicator) statusIndicator.textContent = "D1: Войдите";
    askRelogin();
    return;
  }
  if (statusIndicator) statusIndicator.textContent = "D1: Сохр...";

  const payload = buildSavePayload();
  const bodyStr = JSON.stringify({
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

  try {
    const res = await cloudFetch(CLOUD_SAVE_ENDPOINT, { method: 'POST', body: bodyStr });

    if (res.status === 401) {
      dropDeadSession();
      if (statusIndicator) statusIndicator.textContent = "D1: Войдите";
      return;
    }

    if (res.status === 409) {
      const data = await res.json().catch(() => null);
      if (data?.saveData && !sameSeasonBlank(data.saveData)) {
        applySaveDataSafely(data.saveData);
        saveLocal();
      }
      if (statusIndicator) statusIndicator.textContent = "D1: Выдача";
      return;
    }

    if (res.ok) {
      if (statusIndicator) statusIndicator.textContent = "D1: OK";
    } else {
      if (statusIndicator) statusIndicator.textContent = "D1: Локально";
    }
  } catch (err) {
    if (statusIndicator) statusIndicator.textContent = "D1: Офлайн";
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
        if (statusIndicator) statusIndicator.textContent = "D1: Локально";
      } else if (data && cloudPayload) {
        const parsed = typeof cloudPayload === 'string' ? JSON.parse(cloudPayload) : cloudPayload;
        if (sameSeasonBlank(parsed)) {
          requestCloudSync(800);
        } else {
          applySaveDataSafely(parsed);
          saveLocal();
        }
      }
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
