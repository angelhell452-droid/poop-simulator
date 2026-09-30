import { GAME } from '../core/state.js';
import { buildSavePayload, saveLocal, applySaveDataSafely, loadLocal } from './saveManager.js';

export const CLOUD_SAVE_ENDPOINT = '/api/cloud-save';
export const LEGACY_SAVE_ENDPOINT = '/.netlify/functions/cloud-save';
export const AUTH_STORAGE_KEY = 'PoopSim_User_Account';

let cloudSyncDebounceTimer = null;

export async function hashPassword(password) {
  const enc = new TextEncoder().encode("poop_salt_2026_" + password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b => b.toString(16).padStart(2, "0")).join("");
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
  if (statusIndicator) statusIndicator.textContent = "D1: Сохр...";

  const payload = buildSavePayload();
  const bodyStr = JSON.stringify({
    playerId: GAME.playerId,
    playerName: GAME.playerName,
    stage: GAME.evoStage + 1,
    biomass: GAME.biomass,
    sparkles: GAME.sparkles,
    prestige_currency: GAME.prestigeRolls,
    saveData: payload
  });

  try {
    let res = await fetch(CLOUD_SAVE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr
    });

    if (!res.ok && res.status === 404) {
      res = await fetch(LEGACY_SAVE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      });
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

    let res = await fetch(`${CLOUD_SAVE_ENDPOINT}?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj)
    });

    if (!res.ok && res.status === 404) {
      res = await fetch(`${LEGACY_SAVE_ENDPOINT}?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
      });
    }

    const data = await res.json();
    if (data.success) {
      GAME.playerId = data.playerId;
      GAME.playerName = data.username;
      saveStoredAccount({
        username: data.username,
        playerId: data.playerId,
        passwordHash
      });
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

    let res = await fetch(`${CLOUD_SAVE_ENDPOINT}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj)
    });

    if (!res.ok && res.status === 404) {
      res = await fetch(`${LEGACY_SAVE_ENDPOINT}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
      });
    }

    const data = await res.json();
    if (data.success) {
      GAME.playerId = data.playerId;
      GAME.playerName = data.username;

      if (data.saveData) {
        applySaveDataSafely(data.saveData);
      }

      saveStoredAccount({
        username: data.username,
        playerId: data.playerId,
        passwordHash
      });
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
    let res = await fetch(`${CLOUD_SAVE_ENDPOINT}?playerId=${encodeURIComponent(GAME.playerId)}`);
    if (!res.ok && res.status === 404) {
      res = await fetch(`${LEGACY_SAVE_ENDPOINT}?playerId=${encodeURIComponent(GAME.playerId)}`);
    }

    if (res.ok) {
      const data = await res.json();
      const cloudPayload = data.data || data.save_data;
      if (data && cloudPayload) {
        const parsed = typeof cloudPayload === 'string' ? JSON.parse(cloudPayload) : cloudPayload;
        applySaveDataSafely(parsed);
        saveLocal();
      }
    }
  } catch (e) {
    console.warn('Cloud load error:', e);
  }
}

export async function wipePlayerData() {
  try {
    if (GAME.playerId) {
      await fetch(`${CLOUD_SAVE_ENDPOINT}?action=wipe&playerId=${encodeURIComponent(GAME.playerId)}`, { method: 'POST' });
    }
  } catch (e) { }
  saveStoredAccount(null);
  localStorage.clear();
  location.reload();
}
