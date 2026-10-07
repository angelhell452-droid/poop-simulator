import { formatNumber } from '../utils/numberFormatter.js?v=5.0.78';
import { getStoredAccount, socialRequest } from '../save/cloudSync.js?v=5.0.78';
import { getPhaseForForm } from '../progression/phases.data.js?v=5.0.78';
import { KNIVES } from '../data/knives.data.js?v=5.0.78';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.78';
import { findBodySkin } from '../data/skins.data.js?v=5.0.78';
import { formatTaggedName } from '../guild/guildPresence.js?v=5.0.78';
import { sendGuildInvite } from './guildView.js?v=5.0.78';
import { registerSocialPulse } from './socialPulse.js?v=5.0.78';
import { t, onLocaleChange } from '../i18n/t.js';

let roster = { friends: [], incoming: [], outgoing: [], canInvite: false };
let confirmRemove = '';
let friendsBusy = false;
let friendsLoaded = false;
const pendingActions = new Set();

function actionKey(action, username) {
  return `${action}:${String(username || '').toLowerCase()}`;
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attr(value) {
  return encodeURIComponent(String(value || ''));
}

function signedIn() {
  return !!getStoredAccount()?.username;
}

function seenLabel(person) {
  if (person.online) return t('friends.inGame');
  const ts = Date.parse(String(person.updatedAt || '').replace(' ', 'T') + 'Z');
  if (!Number.isFinite(ts)) return t('friends.neverSaved');
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return t('friends.justNow');
  if (mins < 60) return t('friends.minAgo', { n: formatNumber(mins) });
  const hours = Math.floor(mins / 60);
  if (hours < 48) return t('friends.hrAgo', { n: formatNumber(hours) });
  return t('friends.dayAgo', { n: formatNumber(Math.floor(hours / 24)) });
}

function progressLine(person) {
  const form = Math.max(1, Number(person.stage) || 1);
  const peak = Math.max(form, Number(person.peakForm) || 1);
  // List/profile rows only need the epoch id — full phaseLabel can dump a huge band ceiling.
  const epoch = getPhaseForForm(peak).id;
  const peakBit = peak > form ? t('friends.peakBit', { peak: formatNumber(peak) }) : '';
  return t('friends.formLine', {
    form: formatNumber(form),
    peak: peakBit,
    epoch: formatNumber(epoch)
  });
}

function toast(text) {
  const node = document.createElement('div');
  node.className = 'garden-toast';
  node.textContent = text;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2800);
}

export function setFriendsBadge(count) {
  const badge = document.getElementById('friendsIncomingBadge');
  if (!badge) return;
  const n = Math.max(0, Number(count) || 0);
  badge.textContent = formatNumber(n);
  badge.classList.toggle('hidden', n <= 0);
}

function setBadge(count) {
  setFriendsBadge(count);
}

function guestWall() {
  return `<div class="garden-empty">${esc(t('friends.guest'))}</div>`;
}

function slotLine(label, value) {
  const body = value
    ? `<span>${esc(value)}</span>`
    : `<span class="garden-pill">${esc(t('friends.emptySlot'))}</span>`;
  return `<div class="garden-card flex items-center justify-between gap-2"><span class="garden-muted">${esc(label)}</span>${body}</div>`;
}

function knifeLabel(knife) {
  if (!knife?.id) return '';
  const found = KNIVES.find((item) => item.id === knife.id);
  const name = found?.name || knife.id;
  return `${name} · звёзды ${formatNumber(knife.stars || 0)}`;
}

function hatLabel(hat) {
  if (!hat?.id) return '';
  const found = SHOP_ITEMS.find((item) => item.id === hat.id);
  const name = found?.name || hat.id;
  return `${name} · Lv.${formatNumber(hat.level || 1)}`;
}

function skinLabel(skin) {
  if (!skin?.id) return '';
  return findBodySkin(skin.id)?.name || skin.id;
}

function renderProfile(profile) {
  const box = document.getElementById('friendsBody');
  if (!box || !profile) return;
  box.innerHTML = `
    <button type="button" id="btnFriendsBack" class="garden-pill jelly-btn mb-3">${esc(t('friends.back'))}</button>
    <div class="garden-card mb-3">
      <div class="font-game text-lg">${esc(formatTaggedName(profile.username, profile.guildTag))}</div>
      ${roster.canInvite ? `<button type="button" class="garden-pill accent jelly-btn mt-2" data-friend-action="guild" data-user="${attr(profile.username)}">${esc(t('friends.toGuild'))}</button>` : ''}
      <div class="garden-muted mt-1">${esc(progressLine(profile))}</div>
      <div class="garden-muted mt-1">${profile.online ? esc(t('friends.inGame')) : esc(seenLabel(profile))}</div>
    </div>
    <div class="grid gap-2 mb-3">
      <div class="garden-card flex items-center justify-between gap-2"><span class="garden-muted">${esc(t('friends.prestiges'))}</span><span>${formatNumber(profile.prestiges || 0)}</span></div>
      <div class="garden-card flex items-center justify-between gap-2"><span class="garden-muted">${esc(t('friends.transcends'))}</span><span>${formatNumber(profile.transcends || 0)}</span></div>
      <div class="garden-card flex items-center justify-between gap-2"><span class="garden-muted">${esc(t('friends.score'))}</span><span>${formatNumber(profile.score || 0)}</span></div>
    </div>
    <div class="garden-muted mb-2">${esc(t('friends.slots'))}</div>
    <div class="grid gap-2">
      ${slotLine(t('friends.slotKnife'), knifeLabel(profile.knife))}
      ${slotLine(t('friends.slotHat'), hatLabel(profile.hat))}
      ${slotLine(t('friends.slotSkin'), skinLabel(profile.skin))}
    </div>
  `;
  document.getElementById('btnFriendsBack')?.addEventListener('click', () => renderRoster());
}

function peopleBlock(title, rows, buttons) {
  if (!rows.length) return '';
  const items = rows.map((row) => `
    <div class="garden-card friend-row">
      <span class="friend-row-name">${esc(row.username)}</span>
      <span class="friend-row-actions">
        ${buttons.map((button) => `<button type="button" class="garden-pill jelly-btn" data-friend-action="${button.action}" data-user="${attr(row.username)}">${esc(button.label)}</button>`).join('')}
      </span>
    </div>
  `).join('');
  return `<div class="garden-muted mb-2 mt-3">${esc(title)}</div><div class="grid gap-2">${items}</div>`;
}

function renderRoster() {
  const box = document.getElementById('friendsBody');
  const form = document.getElementById('friendsAddForm');
  if (form) form.classList.toggle('hidden', !signedIn());
  if (!box) return;
  if (!signedIn()) {
    setBadge(0);
    box.innerHTML = guestWall();
    return;
  }
  const friends = roster.friends || [];
  const incoming = roster.incoming || [];
  const outgoing = roster.outgoing || [];
  setBadge(incoming.length);
  if (!friendsLoaded && !friends.length && !incoming.length && !outgoing.length) {
    box.innerHTML = `<div class="garden-empty">${esc(t('friends.loading'))}</div>`;
    return;
  }
  const friendRows = friends.length
    ? friends.map((person) => {
      const removing = confirmRemove === person.username;
      return `
        <div class="garden-card friend-row">
          <button type="button" class="friend-row-main" data-friend-action="profile" data-user="${attr(person.username)}">
            <div class="friend-row-name">${person.online ? '<span class="friend-online"></span>' : ''}${esc(formatTaggedName(person.username, person.guildTag))}</div>
            <div class="garden-muted friend-row-meta">${esc(progressLine(person))}</div>
            <div class="garden-muted friend-row-meta">${esc(seenLabel(person))}</div>
          </button>
          <span class="friend-row-actions">
            ${roster.canInvite ? `<button type="button" class="garden-pill accent jelly-btn" data-friend-action="guild" data-user="${attr(person.username)}">${esc(t('friends.toGuild'))}</button>` : ''}
            <button type="button" class="garden-pill jelly-btn" data-friend-action="${removing ? 'remove' : 'ask-remove'}" data-user="${attr(person.username)}">${esc(removing ? t('friends.confirmRemove') : t('friends.remove'))}</button>
          </span>
        </div>
      `;
    }).join('')
    : `<div class="garden-empty mt-2">${esc(t('friends.empty'))}</div>`;

  box.innerHTML = `
    ${peopleBlock(t('friends.incoming'), incoming, [{ action: 'accept', label: t('friends.accept') }, { action: 'decline', label: t('friends.decline') }])}
    ${peopleBlock(t('friends.outgoing'), outgoing, [{ action: 'cancel', label: t('friends.cancel') }])}
    <div class="garden-muted mb-2 mt-3">${esc(t('friends.list', { n: formatNumber(friends.length) }))}</div>
    <div class="grid gap-2">${friendRows}</div>
  `;
}

export function friendsOpen() {
  const modal = document.getElementById('friendsModal');
  return !!(modal && !modal.classList.contains('hidden'));
}

function applyRosterData(data, resetConfirm = false) {
  if (!data?.success) return false;
  friendsLoaded = true;
  roster = {
    friends: Array.isArray(data.friends) ? data.friends : roster.friends,
    incoming: Array.isArray(data.incoming) ? data.incoming : roster.incoming,
    outgoing: Array.isArray(data.outgoing) ? data.outgoing : roster.outgoing,
    canInvite: data.canInvite !== undefined ? !!data.canInvite : roster.canInvite
  };
  if (resetConfirm) confirmRemove = '';
  setBadge((roster.incoming || []).length);
  if (friendsOpen()) renderRoster();
  return true;
}

export async function loadRoster(quiet = false) {
  if (!signedIn()) {
    roster = { friends: [], incoming: [], outgoing: [], canInvite: false };
    setBadge(0);
    if (friendsOpen()) renderRoster();
    return;
  }
  if (friendsBusy) return;
  friendsBusy = true;
  try {
    const data = await socialRequest('friends');
    if (!applyRosterData(data, true) && friendsOpen() && !quiet) {
      toast(data.error || t('friends.loadFail'));
      renderRoster();
    }
  } finally {
    friendsBusy = false;
  }
}

async function openProfile(username) {
  toast(t('friends.profileOpen'));
  const data = await socialRequest('friend_profile', { query: `username=${encodeURIComponent(username)}` });
  if (!data.success || !data.profile) {
    toast(data.error || t('friends.profileClosed'));
    return;
  }
  renderProfile(data.profile);
}

function optimisticOutgoing(username) {
  const name = String(username || '').trim();
  if (!name) return;
  const list = Array.isArray(roster.outgoing) ? roster.outgoing.slice() : [];
  if (!list.some((row) => String(row.username).toLowerCase() === name.toLowerCase())) {
    list.unshift({ username: name, createdAt: null, pending: true });
    roster = { ...roster, outgoing: list };
  }
  if (friendsOpen()) renderRoster();
}

function dropOptimisticOutgoing(username) {
  const name = String(username || '').trim().toLowerCase();
  roster = {
    ...roster,
    outgoing: (roster.outgoing || []).filter((row) => String(row.username).toLowerCase() !== name)
  };
  if (friendsOpen()) renderRoster();
}

function optimisticAccept(username) {
  const name = String(username || '').trim();
  const low = name.toLowerCase();
  roster = {
    ...roster,
    incoming: (roster.incoming || []).filter((row) => String(row.username).toLowerCase() !== low),
    friends: [
      { username: name, online: false, stage: 1, peakForm: 1, guildTag: '' },
      ...(roster.friends || []).filter((row) => String(row.username).toLowerCase() !== low)
    ]
  };
  setBadge((roster.incoming || []).length);
  if (friendsOpen()) renderRoster();
}

function optimisticDropPending(username, from) {
  const low = String(username || '').trim().toLowerCase();
  if (from === 'incoming') {
    roster = {
      ...roster,
      incoming: (roster.incoming || []).filter((row) => String(row.username).toLowerCase() !== low)
    };
  } else {
    roster = {
      ...roster,
      outgoing: (roster.outgoing || []).filter((row) => String(row.username).toLowerCase() !== low)
    };
  }
  setBadge((roster.incoming || []).length);
  if (friendsOpen()) renderRoster();
}

function optimisticRemove(username) {
  const low = String(username || '').trim().toLowerCase();
  roster = {
    ...roster,
    friends: (roster.friends || []).filter((row) => String(row.username).toLowerCase() !== low)
  };
  confirmRemove = '';
  if (friendsOpen()) renderRoster();
}

async function runAction(action, username) {
  if (action === 'profile') return openProfile(username);
  if (action === 'ask-remove') {
    confirmRemove = username;
    renderRoster();
    return;
  }

  const key = actionKey(action, username);
  if (pendingActions.has(key)) return;
  pendingActions.add(key);

  if (action === 'guild') {
    toast(t('friends.inviteSending'));
    sendGuildInvite(username).then((data) => {
      if (!data.success) toast(data.error || t('friends.inviteFail'));
      else toast(t('friends.inviteSent', { name: data.username || username }));
    }).finally(() => pendingActions.delete(key));
    return;
  }

  if (action === 'accept') {
    optimisticAccept(username);
    toast(t('friends.accepting'));
  } else if (action === 'decline') {
    optimisticDropPending(username, 'incoming');
    toast(t('friends.declining'));
  } else if (action === 'cancel') {
    optimisticDropPending(username, 'outgoing');
    toast(t('friends.canceling'));
  } else if (action === 'remove') {
    optimisticRemove(username);
    toast(t('friends.removing'));
  }

  socialRequest(action === 'remove' ? 'friend_remove' : `friend_${action}`, {
    method: 'POST',
    body: { username }
  }).then(async (data) => {
    if (!data.success) {
      toast(data.error || t('friends.fail'));
      await loadRoster(true);
      return;
    }
    if (action === 'accept') toast(t('friends.nowFriends', { name: username }));
    if (action === 'remove') toast(t('friends.removed', { name: username }));
    if (action === 'decline' || action === 'cancel') toast(t('friends.done'));
    if (!applyRosterData(data, true)) await loadRoster(true);
  }).finally(() => pendingActions.delete(key));
}

export function sendFriendRequest(username) {
  const name = String(username || '').trim();
  if (!signedIn()) {
    toast(t('friends.needLogin'));
    return Promise.resolve({ success: false });
  }
  if (name.length < 3) {
    toast(t('friends.loginShort'));
    return Promise.resolve({ success: false });
  }

  const key = actionKey('request', name);
  if (pendingActions.has(key)) {
    toast(t('friends.requestBusy'));
    return Promise.resolve({ success: false, pending: true });
  }
  pendingActions.add(key);

  // UI first: clear field, show outgoing, think in background.
  optimisticOutgoing(name);
  toast(t('friends.requestSending', { name }));

  return socialRequest('friend_request', { method: 'POST', body: { username: name } })
    .then(async (data) => {
      if (!data.success) {
        dropOptimisticOutgoing(name);
        toast(data.error || t('friends.requestFail'));
        return data;
      }
      toast(data.pending
        ? t('friends.requestSent', { name: data.username || name })
        : t('friends.nowFriends', { name: data.username || name }));
      if (!applyRosterData(data, true)) await loadRoster(true);
      return data;
    })
    .finally(() => pendingActions.delete(key));
}

export function initFriendsView() {
  const openBtn = document.getElementById('btnFriendsModal');
  const modal = document.getElementById('friendsModal');
  const form = document.getElementById('friendsAddForm');
  const body = document.getElementById('friendsBody');

  openBtn?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
    // Paint cache (or «Загружаем…») instantly — network refresh stays in background.
    renderRoster();
    loadRoster(true);
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('friendsNameInput');
    const username = (input?.value || '').trim();
    if (!username) return;
    if (input) input.value = '';
    // Don't await — background send keeps the window snappy.
    sendFriendRequest(username);
  });

  body?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-friend-action]');
    if (!button) return;
    const username = decodeURIComponent(button.dataset.user || '');
    if (!username) return;
    runAction(button.dataset.friendAction, username);
  });

  registerSocialPulse({
    friendsOpen,
    setFriendsBadge,
    warmFriends: (data) => applyRosterData(data, false),
    refreshFriends: () => loadRoster(true)
  });

  onLocaleChange(() => {
    if (friendsOpen()) renderRoster();
  });
}
