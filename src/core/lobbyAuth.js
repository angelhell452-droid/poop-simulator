/**
 * Lobby & Single-Device Authentication Controller
 *
 * Implements lobby screen, background asset preloading,
 * one-account-one-device (KV session check), 401 modal reconnect without reload,
 * and Server Authority on login.
 */

import { pauseGameLoop, resumeGameLoop } from './gameLoop.js?v=5.4.25';
import { hashPassword, saveStoredAccount, getStoredAccount, loadFromCloudDatabaseOrLocal, CLOUD_SAVE_ENDPOINT } from '../save/cloudSync.js?v=5.4.25';
import { GAME } from './state.js?v=5.4.25';
import { saveLocal } from '../save/saveManager.js?v=5.4.25';
import { CURRENT_CLIENT_PATCH_VERSION } from './serverAuthority.js?v=5.4.25';

// In-memory credentials cache for instant reconnect without page reload
let cachedCredentials = null;
let isGameInitialized = false;

export function getCachedCredentials() {
  return cachedCredentials;
}

export function setCachedCredentials(creds) {
  cachedCredentials = creds;
}

// Background preloading of verified assets while player is in the lobby
export function startAssetPreloading() {
  const assets = [
    'assets/backgrounds/epoch-01.png',
    'assets/icons/plunger.svg'
  ];

  assets.forEach((url) => {
    try {
      if (url.endsWith('.png') || url.endsWith('.svg') || url.endsWith('.webp')) {
        const img = new Image();
        img.src = url;
      }
    } catch (_) {}
  });
}

// Lobby Visibility Controls
export function showLobby() {
  const lobby = document.getElementById('lobby');
  if (lobby) lobby.style.display = 'flex';
  const bootVeil = document.getElementById('bootVeil');
  if (bootVeil) bootVeil.style.display = 'none';
}

export function hideLobby() {
  const lobby = document.getElementById('lobby');
  if (lobby) lobby.style.display = 'none';
  const bootVeil = document.getElementById('bootVeil');
  if (bootVeil) bootVeil.style.display = 'none';
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('resize'));
  }
}

// 401 Session Interrupted Handler
export function handleSessionInterrupted() {
  pauseGameLoop();
  const modal = document.getElementById('sessionModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

export function dismissSessionModal() {
  const modal = document.getElementById('sessionModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Check if user has an existing active session on page load
export async function checkAutoLogin(onGameReady) {
  const stored = getStoredAccount();
  if (!stored?.username || !stored?.passwordHash) {
    showLobby();
    return false;
  }

  try {
    const res = await fetch(`${CLOUD_SAVE_ENDPOINT}?action=session`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.sessionToken || ''}`,
        'X-User-Id': stored.playerId || ''
      }
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.online === true && (!data.playerId || data.playerId === stored.playerId)) {
      // Active session is valid!
      cachedCredentials = { username: stored.username, passwordHash: stored.passwordHash };
      GAME.playerId = stored.playerId;
      GAME.playerName = stored.username;
      hideLobby();

      // Server Authority: load save from server first
      await loadFromCloudDatabaseOrLocal();

      if (!isGameInitialized) {
        isGameInitialized = true;
        if (typeof onGameReady === 'function') {
          await onGameReady();
        }
      } else {
        resumeGameLoop();
      }
      return true;
    }
  } catch (_) {}

  // If session is expired or superseded, display lobby
  showLobby();
  return false;
}

// Initialize Lobby listeners
export function initLobbyAuth(onGameReady) {
  startAssetPreloading();

  const verTag = document.getElementById('lobbyVersionTag');
  if (verTag) {
    verTag.textContent = `v${CURRENT_CLIENT_PATCH_VERSION} PRO`;
  }

  const btnLogin = document.getElementById('btnLobbyLogin');
  const btnRegister = document.getElementById('btnLobbyRegister');
  const errorBox = document.getElementById('lobbyAuthError');
  const inputUsername = document.getElementById('lobbyUsername');
  const inputPassword = document.getElementById('lobbyPassword');
  const btnReconnect = document.getElementById('btnSessionReconnect');

  const welcomeCard = document.getElementById('lobbyWelcomeCard');
  const authForm = document.getElementById('lobbyAuthForm');
  const savedUserLabel = document.getElementById('lobbySavedUsername');
  const btnContinue = document.getElementById('btnLobbyContinue');
  const btnSwitchAccount = document.getElementById('btnLobbySwitchAccount');
  const backToWelcomeWrap = document.getElementById('lobbyBackToWelcomeWrap');
  const btnBackToWelcome = document.getElementById('btnLobbyBackToWelcome');

  const stored = getStoredAccount();
  if (stored?.username && inputUsername) {
    inputUsername.value = stored.username;
  }

  // Toggle Welcome Card vs Login Form
  const showWelcomeCard = (username) => {
    if (welcomeCard && authForm) {
      if (savedUserLabel) savedUserLabel.textContent = username;
      welcomeCard.classList.remove('hidden');
      welcomeCard.classList.add('flex');
      authForm.classList.add('hidden');
      if (backToWelcomeWrap) backToWelcomeWrap.classList.remove('hidden');
    }
  };

  const showLoginForm = () => {
    if (welcomeCard && authForm) {
      welcomeCard.classList.add('hidden');
      welcomeCard.classList.remove('flex');
      authForm.classList.remove('hidden');
    }
  };

  if (stored?.username && stored?.passwordHash) {
    showWelcomeCard(stored.username);
  } else {
    showLoginForm();
  }

  btnSwitchAccount?.addEventListener('click', () => {
    showLoginForm();
    if (inputPassword) inputPassword.value = '';
    if (inputUsername) inputUsername.focus();
  });

  btnBackToWelcome?.addEventListener('click', () => {
    if (stored?.username) {
      showWelcomeCard(stored.username);
    }
  });

  const showError = (msg) => {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.remove('hidden');
    }
  };

  const clearError = () => {
    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.add('hidden');
    }
  };

  // Continue with saved account (1-click entry)
  btnContinue?.addEventListener('click', async () => {
    const current = getStoredAccount();
    if (!current?.username || !current?.passwordHash) {
      showLoginForm();
      return;
    }

    if (btnContinue) {
      btnContinue.disabled = true;
      btnContinue.innerHTML = '<span>⏳</span><span>Вход в игру...</span>';
    }

    try {
      // Fast login with saved password hash
      const res = await fetch(`${CLOUD_SAVE_ENDPOINT}?action=login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: current.username,
          passwordHash: current.passwordHash
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        showLoginForm();
        showError(data?.error || 'Требуется повторный ввод пароля');
        return;
      }

      cachedCredentials = { username: data.username, passwordHash: current.passwordHash };
      saveStoredAccount({
        username: data.username,
        playerId: data.playerId,
        passwordHash: current.passwordHash,
        sessionToken: data.sessionToken || ''
      });

      GAME.playerId = data.playerId;
      GAME.playerName = data.username;

      hideLobby();

      // Load save and start game
      await loadFromCloudDatabaseOrLocal();

      if (!isGameInitialized) {
        isGameInitialized = true;
        if (typeof onGameReady === 'function') {
          await onGameReady();
        }
      } else {
        resumeGameLoop();
      }
    } catch (err) {
      showLoginForm();
      showError('Ошибка связи с сервером');
    } finally {
      if (btnContinue) {
        btnContinue.disabled = false;
        btnContinue.innerHTML = '<span>🎮</span><span>Войти в игру</span>';
      }
    }
  });

  const submitAuth = async (action) => {
    clearError();
    const username = (inputUsername?.value || '').trim();
    const password = (inputPassword?.value || '').trim();

    if (!username || username.length < 3) {
      showError('Логин должен содержать от 3 символов');
      return;
    }
    if (!password || password.length < 4) {
      showError('Пароль должен содержать от 4 символов');
      return;
    }

    if (btnLogin) btnLogin.disabled = true;
    if (btnRegister) btnRegister.disabled = true;

    try {
      const passwordHash = await hashPassword(password);
      const res = await fetch(`${CLOUD_SAVE_ENDPOINT}?action=${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, username, passwordHash })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        showError(data?.error || 'Ошибка входа');
        if (btnLogin) btnLogin.disabled = false;
        if (btnRegister) btnRegister.disabled = false;
        return;
      }

      // Successful auth!
      cachedCredentials = { username, passwordHash };
      saveStoredAccount({
        username: data.username,
        playerId: data.playerId,
        passwordHash,
        sessionToken: data.sessionToken || ''
      });

      GAME.playerId = data.playerId;
      GAME.playerName = data.username;

      hideLobby();

      // SERVER AUTHORITY: Request current save from server FIRST and overwrite local state!
      await loadFromCloudDatabaseOrLocal();

      if (!isGameInitialized) {
        isGameInitialized = true;
        if (typeof onGameReady === 'function') {
          await onGameReady();
        }
      } else {
        resumeGameLoop();
      }
    } catch (err) {
      showError('Ошибка связи с сервером');
    } finally {
      if (btnLogin) btnLogin.disabled = false;
      if (btnRegister) btnRegister.disabled = false;
    }
  };

  btnLogin?.addEventListener('click', () => submitAuth('login'));
  btnRegister?.addEventListener('click', () => submitAuth('register'));

  // 401 Reconnect button: re-authenticates and resumes game without page reload
  btnReconnect?.addEventListener('click', async () => {
    if (btnReconnect) {
      btnReconnect.disabled = true;
      btnReconnect.textContent = 'Подключение...';
    }

    const currentAccount = getStoredAccount();
    const username = cachedCredentials?.username || currentAccount?.username;
    const passwordHash = cachedCredentials?.passwordHash || currentAccount?.passwordHash;

    if (!username || !passwordHash) {
      dismissSessionModal();
      showLobby();
      if (btnReconnect) {
        btnReconnect.disabled = false;
        btnReconnect.textContent = 'Переподключиться';
      }
      return;
    }

    try {
      const res = await fetch(`${CLOUD_SAVE_ENDPOINT}?action=login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, passwordHash })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        saveStoredAccount({
          username: data.username,
          playerId: data.playerId,
          passwordHash,
          sessionToken: data.sessionToken || ''
        });

        dismissSessionModal();
        // Server Authority: download latest save from server
        await loadFromCloudDatabaseOrLocal();
        resumeGameLoop();
      } else {
        dismissSessionModal();
        showLobby();
      }
    } catch (_) {
      dismissSessionModal();
      showLobby();
    } finally {
      if (btnReconnect) {
        btnReconnect.disabled = false;
        btnReconnect.textContent = 'Переподключиться';
      }
    }
  });
}
