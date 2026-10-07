import { GAME } from '../core/state.js?v=5.0.79';
import { events } from '../core/events.js';
import { getStoredAccount, registerAccount, loginAccount, logoutAccount, syncToCloudDatabase, probeCloudServers } from '../save/cloudSync.js?v=5.0.79';
import { updateHUD } from './hudView.js?v=5.0.79';
import { renderFactories } from './factoryView.js?v=5.0.79';
import { renderTalents } from './talentView.js?v=5.0.79';
import { renderShop } from './shopView.js';
import { renderAchievements } from './achievementsView.js';
import { renderEvoChronicles } from './evoChroniclesView.js';
import { renderCasesSystem } from './casesView.js?v=5.0.79';
import { refreshAdminAccess } from './adminView.js?v=5.0.79';
import { currentGuildTag, formatTaggedName } from '../guild/guildPresence.js?v=5.0.79';
import { t, setLocale, getLocale, listLocales, onLocaleChange, applyDomI18n } from '../i18n/t.js';

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
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  switchAuthTab(defaultTab);
  clearAuthStatus();
}

export function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

export function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tabAuthLogin');
  const tabRegister = document.getElementById('tabAuthRegister');
  const formLogin = document.getElementById('formAuthLogin');
  const formRegister = document.getElementById('formAuthRegister');

  clearAuthStatus();

  if (tab === 'login') {
    tabLogin?.classList.add('bg-amber-600', 'text-white', 'shadow');
    tabLogin?.classList.remove('text-stone-400');
    tabRegister?.classList.remove('bg-amber-600', 'text-white', 'shadow');
    tabRegister?.classList.add('text-stone-400');

    formLogin?.classList.remove('hidden');
    formRegister?.classList.add('hidden');
  } else {
    tabRegister?.classList.add('bg-amber-600', 'text-white', 'shadow');
    tabRegister?.classList.remove('text-stone-400');
    tabLogin?.classList.remove('bg-amber-600', 'text-white', 'shadow');
    tabLogin?.classList.add('text-stone-400');

    formRegister?.classList.remove('hidden');
    formLogin?.classList.add('hidden');
  }
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
    if (headerName) headerName.textContent = t('common.guest');
    if (accountStatusBadge) {
      accountStatusBadge.textContent = t('auth.guestLocal');
    }
    if (btnAuthAction) {
      btnAuthAction.textContent = t('auth.loginCreate');
      btnAuthAction.className = 'w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-stone-950 font-game text-xs font-bold border border-yellow-300 shadow jelly-btn transition';
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
  document.getElementById('tabAuthRegister')?.addEventListener('click', () => switchAuthTab('register'));

  // Close & Guest buttons
  document.getElementById('btnAuthClose')?.addEventListener('click', () => {
    sessionStorage.setItem('poop_auth_dismissed', '1');
    closeAuthModal();
  });

  document.getElementById('btnPlayAsGuest')?.addEventListener('click', () => {
    sessionStorage.setItem('poop_auth_dismissed', '1');
    closeAuthModal();
  });

  // Login form submit
  document.getElementById('formAuthLogin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthStatus();

    const username = document.getElementById('loginUsername')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const btnSubmit = document.getElementById('btnSubmitLogin');

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = t('auth.loggingIn');
    }

    const res = await loginAccount(username, password);

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = t('auth.loginTab');
    }

    if (res.success) {
      showAuthStatus(t('auth.welcome', { name: res.username }), true);
      refreshAllGameUI();
      setTimeout(() => {
        closeAuthModal();
      }, 700);
    } else {
      showAuthStatus(res.error || t('auth.loginError'));
    }
  });

  // Register form submit
  document.getElementById('formAuthRegister')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthStatus();

    const username = document.getElementById('registerUsername')?.value;
    const password = document.getElementById('registerPassword')?.value;
    const btnSubmit = document.getElementById('btnSubmitRegister');

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = t('auth.creating');
    }

    const res = await registerAccount(username, password);

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = t('auth.createAccount');
    }

    if (res.success) {
      showAuthStatus(t('auth.createdOk', { name: res.username }), true);
      refreshAllGameUI();
      setTimeout(() => {
        closeAuthModal();
      }, 800);
    } else {
      showAuthStatus(res.error || t('auth.registerError'));
    }
  });

  // Account modal action button (Logout or Login)
  document.getElementById('btnAuthAction')?.addEventListener('click', () => {
    const stored = getStoredAccount();
    if (stored) {
      if (confirm(t('auth.logoutConfirm'))) {
        logoutAccount();
        updateAccountHeaderUI();
        refreshAdminAccess();
        openAuthModal('login');
      }
    } else {
      document.getElementById('accountModal')?.classList.add('hidden');
      openAuthModal('login');
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
    openAuthModal('login');
    const nameInput = document.getElementById('loginUsername');
    const known = getStoredAccount()?.username;
    if (nameInput && known && !nameInput.value) nameInput.value = known;
    showAuthStatus(t('auth.sessionDead'), false);
    const box = document.getElementById('authStatusBox');
    if (box) box.className = 'mt-3 text-[11px] text-center p-2 rounded-xl font-medium bg-amber-950/80 border border-amber-500 text-amber-200';
  });

  // Startup check: if no stored account and not dismissed in session, open auth modal
  const stored = getStoredAccount();
  const dismissed = sessionStorage.getItem('poop_auth_dismissed');
  if (!stored && !dismissed) {
    // Show after slight delay for smooth page animation
    setTimeout(() => {
      openAuthModal('login');
    }, 400);
  }
}
