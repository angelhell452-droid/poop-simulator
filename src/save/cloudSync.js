import { GAME } from '../core/state.js';
import { buildSavePayload, saveLocal, applySaveDataSafely, loadLocal } from './saveManager.js';

export const CLOUD_SAVE_ENDPOINT = '/api/cloud-save';
export const LEGACY_SAVE_ENDPOINT = '/.netlify/functions/cloud-save';
let cloudSyncDebounceTimer = null;

export function requestCloudSync(delayMs = 2500) {
  if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
  cloudSyncDebounceTimer = setTimeout(() => {
    syncToCloudDatabase();
  }, delayMs);
}

export async function syncToCloudDatabase() {
  saveLocal();

  const statusIndicator = document.getElementById('cloudStatusText');
  if (statusIndicator) statusIndicator.textContent = "D1: Сохранение...";

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
      if (statusIndicator) statusIndicator.textContent = "D1: Синхр ✓";
    } else {
      if (statusIndicator) statusIndicator.textContent = "D1: Локально";
    }
  } catch (err) {
    if (statusIndicator) statusIndicator.textContent = "D1: Локально";
  }
}

export async function loadFromCloudDatabaseOrLocal() {
  loadLocal();

  if (!GAME.playerId) return;

  try {
    let res = await fetch(`${CLOUD_SAVE_ENDPOINT}?playerId=${encodeURIComponent(GAME.playerId)}`);
    if (!res.ok && res.status === 404) {
      res = await fetch(`${LEGACY_SAVE_ENDPOINT}?playerId=${encodeURIComponent(GAME.playerId)}`);
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.save_data) {
        const cloudPayload = typeof data.save_data === 'string' ? JSON.parse(data.save_data) : data.save_data;
        applySaveDataSafely(cloudPayload);
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
  localStorage.clear();
  location.reload();
}
