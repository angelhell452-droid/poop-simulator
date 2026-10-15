import { GAME } from '../core/state.js?v=5.4.24';
import { events } from '../core/events.js';
import { getStoredAccount, registerAccount, loginAccount, logoutAccount, syncToCloudDatabase, probeCloudServers } from '../save/cloudSync.js?v=5.4.24';
import { updateHUD } from './hudView.js?v=5.4.24';
import { renderFactories } from './factoryView.js?v=5.4.24';
import { renderTalents } from './talentView.js?v=5.4.24';
import { renderShop } from './shopView.js';
import { renderAchievements } from './achievementsView.js';
import { renderEvoChronicles } from './evoChroniclesView.js';
import { renderCasesSystem } from './casesView.js?v=5.4.24';
import { refreshAdminAccess } from './adminView.js?v=5.4.24';
import { currentGuildTag, formatTaggedName } from '../guild/guildPresence.js?v=5.4.24';
import { t, setLocale, getLocale, listLocales, onLocaleChange, applyDomI18n } from '../i18n/t.js';
import { showLobby, handleSessionInterrupted } from '../core/lobbyAuth.js?v=5.4.24';

function paintServerLine(id, row) {
  const node = document.getElementById(id);
  if (!node || !row) return;
  node.textContent = row.detail || '—';
  node.className = row.ok
    ? 'text-[11px] text-emerald-300 font-bold text-right'
    : 'text-[11px] text-amber-300 font-bold text-right';
}

function syncLocaleSelect() {
  const sel = document.getElementById('localeSelect');
  if (!sel) return;
  sel.innerHTML = listLocales()
    .map((row) => `<option value="${row.code}">${t(row.labelKey)}</option>`)
    .join('');
  sel.value = getLocale();
}

export async function refreshServerStatus() {
  const hint = document.getElementById('serverStatusHint');
  const btn = document.getElementById('btnProbeServers');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '…';
  }
  paintServerLine('serverStatusCloud', { ok: false, detail: t('cloud.checking') });
  paintServerLine('serverStatusSocial', { ok: false, detail: t('cloud.checking') });
  paintServerLine('serverStatusSession', { ok: false, detail: t('cloud.checking') });
  if (hint) hint.textContent = t('auth.probeHit');
  try {
    const probe = await probeCloudServers();
    paintServerLine('serverStatusCloud', probe.cloud);
    paintServerLine('serverStatusSocial', probe.social);
    paintServerLine('serverStatusSession', probe.session);
    if (hint) {
      if (probe.cloud.ok && probe.social.ok && (probe.session.ok || !getStoredAccount()?.sessionToken)) {
        hint.textContent = t('auth.probeAllOk');
      } else if (!probe.cloud.ok && !probe.social.ok) {
        hint.textContent = t('auth.probeCloudDown');
      } else if (getStoredAccount()?.sessionToken && !probe.session.ok) {
        hint.textContent = t('auth.probeSessionDead');
      } else {
        hint.textContent = t('auth.probePartial');
      }
    }
  } catch (_) {
    paintServerLine('serverStatusCloud', { ok: false, detail: t('cloud.probeFail') });
    paintServerLine('serverStatusSocial', { ok: false, detail: t('cloud.probeFail') });
    paintServerLine('serverStatusSession', { ok: false, detail: t('cloud.probeFail') });
    if (hint) hint.textContent = t('auth.probeFailed');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('common.check');
    }
  }
}

export function openAuthModal(defaultTab = 'login') {
  showLobby();
}

export function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

export function switchAuthTab(tab) {
  showLobby();
}

function showAuthStatus(msg, isSuccess = false) {
  const box = document.getElementById('authStatusBox');
  if (!box) return;
  box.textContent = msg;
  box.classList.remove('hidden');
  if (isSuccess) {
    box.className = 'mt-3 text-[11px] text-center p-2 rounded-xl font-medium bg-emerald-950/80 border border-emerald-500 text-emerald-300';
  } else {
    box.className = 'mt-3 text-[11px] text-center p-2 rounded-xl font-medium bg-red-950/80 border border-red-500 text-red-300';
  }
}

function clearAuthStatus() {
  const box = document.getElementById('authStatusBox');
  if (box) {
    box.textContent = '';
    box.classList.add('hidden');
  }
}

export function updateAccountHeaderUI() {
  const stored = getStoredAccount();
  const headerName = document.getElementById('headerAccountName');
  const accountStatusBadge = document.getElementById('accountStatusBadge');
  const btnAuthAction = document.getElementById('btnAuthAction');

  if (stored && stored.username) {
    if (headerName) {
      headerName.dataset.accountName = stored.username;
      headerName.textContent = formatTaggedName(stored.username, currentGuildTag());
    }
    if (accountStatusBadge) {
      accountStatusBadge.textContent = t('auth.cloudUser', { name: stored.username });
    }
    if (btnAuthAction) {
      btnAuthAction.textContent = t('auth.logout');
      btnAuthAction.className = 'w-full py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-600 transition';
    }
  } else {
    if (headerName) headerName.textContent = GAME.playerName || 'Игрок';
    if (accountStatusBadge) {
      accountStatusBadge.textContent = '🟢 Облачный аккаунт';
    }
    if (btnAuthAction) {
      btnAuthAction.textContent = t('auth.logout');
      btnAuthAction.className = 'w-full py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-600 transition';
    }
  }

  const inpPlayerId = document.getElementById('inpPlayerId');
  if (inpPlayerId) inpPlayerId.value = GAME.playerId || '';
  const inpPlayerName = document.getElementById('inpPlayerName');
  if (inpPlayerName) {
    inpPlayerName.value = (stored && stored.username) || GAME.playerName || '';
    inpPlayerName.readOnly = !!(stored && stored.username);
  }
}

function refreshAllGameUI() {
  updateAccountHeaderUI();
  refreshAdminAccess();
  updateHUD();
  renderFactories();
  renderTalents();
  renderShop();
  renderAchievements();
  renderEvoChronicles();
  renderCasesSystem();
}

export function initAuthModal() {
  // Tabs
  document.getElementById('tabAuthLogin')?.addEventListener('click', () => switchAuthTab('login'));
  // Account modal action button (Logout)
  document.getElementById('btnAuthAction')?.addEventListener('click', () => {
    if (confirm(t('auth.logoutConfirm'))) {
      document.getElementById('accountModal')?.classList.add('hidden');
      logoutAccount();
      updateAccountHeaderUI();
      refreshAdminAccess();
      showLobby();
    }
  });

  // Force cloud save / load
  document.getElementById('btnForceCloudSave')?.addEventListener('click', async () => {
    await syncToCloudDatabase();
    alert(t('auth.savedOk'));
  });

  document.getElementById('btnProbeServers')?.addEventListener('click', () => {
    refreshServerStatus();
  });

  document.getElementById('localeSelect')?.addEventListener('change', (event) => {
    setLocale(event.target.value);
  });

  syncLocaleSelect();
  onLocaleChange(() => {
    applyDomI18n(document);
    syncLocaleSelect();
    updateAccountHeaderUI();
  });

  // Initialize UI
  updateAccountHeaderUI();

  events.on('auth:relogin', () => {
    // Session expired/invalid → return to lobby (not the superseded modal)
    showLobby();
  });
}
