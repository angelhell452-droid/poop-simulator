import { formatNumber } from '../utils/numberFormatter.js?v=5.0.72';
import { getStoredAccount, socialRequest } from '../save/cloudSync.js?v=5.0.72';
import { getPhaseForForm, phaseLabel } from '../progression/phases.data.js?v=5.0.72';
import { KNIVES } from '../data/knives.data.js?v=5.0.72';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.72';
import { findBodySkin } from '../data/skins.data.js?v=5.0.72';
import { formatTaggedName } from '../guild/guildPresence.js?v=5.0.72';
import { sendGuildInvite } from './guildView.js?v=5.0.72';
import { registerSocialPulse } from './socialPulse.js?v=5.0.72';

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
  if (person.online) return 'в игре';
  const ts = Date.parse(String(person.updatedAt || '').replace(' ', 'T') + 'Z');
  if (!Number.isFinite(ts)) return 'ещё не сохранялся';
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return 'только что';
  if (mins < 60) return `${formatNumber(mins)} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${formatNumber(hours)} ч назад`;
  return `${formatNumber(Math.floor(hours / 24))} д назад`;
}

function progressLine(person) {
  const form = Math.max(1, Number(person.stage) || 1);
  const peak = Math.max(form, Number(person.peakForm) || 1);
  const epoch = phaseLabel(getPhaseForForm(peak));
  const peakBit = peak > form ? ` · пик ${formatNumber(peak)}` : '';
  return `Форма ${formatNumber(form)}${peakBit} · ${epoch}`;
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
  return `<div class="garden-empty">Друзья открываются с аккаунта. Гость не может отправить заявку.</div>`;
}

function slotLine(label, value) {
  const body = value
    ? `<span>${esc(value)}</span>`
    : `<span class="garden-pill">Пусто</span>`;
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
    <button type="button" id="btnFriendsBack" class="garden-pill jelly-btn mb-3">К списку</button>
    <div class="garden-card mb-3">
      <div class="font-game text-lg">${esc(formatTaggedName(profile.username, profile.guildTag))}</div>
      ${roster.canInvite ? `<button type="button" class="garden-pill accent jelly-btn mt-2" data-friend-action="guild" data-user="${attr(profile.username)}">В гильдию</button>` : ''}
      <div class="garden-muted mt-1">${esc(progressLine(profile))}</div>
      <div class="garden-muted mt-1">${profile.online ? 'в игре' : esc(seenLabel(profile))}</div>
    </div>
    <div class="grid gap-2 mb-3">
      <div class="garden-card flex items-center justify-between gap-2"><span class="garden-muted">Смывы</span><span>${formatNumber(profile.prestiges || 0)}</span></div>
      <div class="garden-card flex items-center justify-between gap-2"><span class="garden-muted">Прорывы</span><span>${formatNumber(profile.transcends || 0)}</span></div>
      <div class="garden-card flex items-center justify-between gap-2"><span class="garden-muted">Очки славы</span><span>${formatNumber(profile.score || 0)}</span></div>
    </div>
    <div class="garden-muted mb-2">Слоты</div>
    <div class="grid gap-2">
      ${slotLine('Нож', knifeLabel(profile.knife))}
      ${slotLine('Шапка', hatLabel(profile.hat))}
      ${slotLine('Скин', skinLabel(profile.skin))}
    </div>
  `;
  document.getElementById('btnFriendsBack')?.addEventListener('click', () => renderRoster());
}

function peopleBlock(title, rows, buttons) {
  if (!rows.length) return '';
  const items = rows.map((row) => `
    <div class="garden-card flex items-center justify-between gap-2 flex-wrap">
      <span class="truncate min-w-0">${esc(row.username)}</span>
      <span class="flex items-center gap-1.5 flex-wrap justify-end">
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
    box.innerHTML = '<div class="garden-empty">Загружаем друзей…</div>';
    return;
  }
  const friendRows = friends.length
    ? friends.map((person) => {
      const removing = confirmRemove === person.username;
      return `
        <div class="garden-card flex items-center justify-between gap-2 flex-wrap">
          <button type="button" class="min-w-0 text-left flex-1" data-friend-action="profile" data-user="${attr(person.username)}">
            <div class="truncate">${person.online ? '<span class="friend-online"></span>' : ''}${esc(formatTaggedName(person.username, person.guildTag))}</div>
            <div class="garden-muted truncate">${esc(progressLine(person))} · ${esc(seenLabel(person))}</div>
          </button>
          <span class="flex items-center gap-1.5 flex-wrap justify-end">
            ${roster.canInvite ? `<button type="button" class="garden-pill accent jelly-btn" data-friend-action="guild" data-user="${attr(person.username)}">В гильдию</button>` : ''}
            <button type="button" class="garden-pill jelly-btn" data-friend-action="${removing ? 'remove' : 'ask-remove'}" data-user="${attr(person.username)}">${removing ? 'Точно' : 'Удалить'}</button>
          </span>
        </div>
      `;
    }).join('')
    : `<div class="garden-empty mt-2">Пока тихо. Друзей ещё нет.</div>`;

  box.innerHTML = `
    ${peopleBlock('Входящие', incoming, [{ action: 'accept', label: 'Принять' }, { action: 'decline', label: 'Отклонить' }])}
    ${peopleBlock('Исходящие', outgoing, [{ action: 'cancel', label: 'Отменить' }])}
    <div class="garden-muted mb-2 mt-3">Друзья · ${formatNumber(friends.length)}</div>
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
      toast(data.error || 'Список не загрузился');
      renderRoster();
    }
  } finally {
    friendsBusy = false;
  }
}

async function openProfile(username) {
  toast('Открываем профиль…');
  const data = await socialRequest('friend_profile', { query: `username=${encodeURIComponent(username)}` });
  if (!data.success || !data.profile) {
    toast(data.error || 'Профиль закрыт');
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
    toast('Приглашение уходит…');
    sendGuildInvite(username).then((data) => {
      if (!data.success) toast(data.error || 'Приглашение не ушло');
      else toast(`Приглашение для ${data.username || username} отправлено`);
    }).finally(() => pendingActions.delete(key));
    return;
  }

  if (action === 'accept') {
    optimisticAccept(username);
    toast('Принимаем…');
  } else if (action === 'decline') {
    optimisticDropPending(username, 'incoming');
    toast('Отклоняем…');
  } else if (action === 'cancel') {
    optimisticDropPending(username, 'outgoing');
    toast('Отменяем…');
  } else if (action === 'remove') {
    optimisticRemove(username);
    toast('Удаляем…');
  }

  socialRequest(action === 'remove' ? 'friend_remove' : `friend_${action}`, {
    method: 'POST',
    body: { username }
  }).then(async (data) => {
    if (!data.success) {
      toast(data.error || 'Не вышло');
      await loadRoster(true);
      return;
    }
    if (action === 'accept') toast(`${username} теперь в друзьях`);
    if (action === 'remove') toast(`${username} убран из друзей`);
    if (action === 'decline' || action === 'cancel') toast('Готово');
    if (!applyRosterData(data, true)) await loadRoster(true);
  }).finally(() => pendingActions.delete(key));
}

export function sendFriendRequest(username) {
  const name = String(username || '').trim();
  if (!signedIn()) {
    toast('Сначала войдите в аккаунт');
    return Promise.resolve({ success: false });
  }
  if (name.length < 3) {
    toast('Введите логин от 3 символов');
    return Promise.resolve({ success: false });
  }

  const key = actionKey('request', name);
  if (pendingActions.has(key)) {
    toast('Эта заявка уже уходит…');
    return Promise.resolve({ success: false, pending: true });
  }
  pendingActions.add(key);

  // UI first: clear field, show outgoing, think in background.
  optimisticOutgoing(name);
  toast(`Заявка для ${name} уходит…`);

  return socialRequest('friend_request', { method: 'POST', body: { username: name } })
    .then(async (data) => {
      if (!data.success) {
        dropOptimisticOutgoing(name);
        toast(data.error || 'Заявка не ушла');
        return data;
      }
      toast(data.pending
        ? `Заявка для ${data.username || name} отправлена`
        : `${data.username || name} теперь в друзьях`);
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
}
