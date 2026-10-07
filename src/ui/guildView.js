import { formatNumber } from '../utils/numberFormatter.js?v=5.0.44';
import { getStoredAccount, socialRequest } from '../save/cloudSync.js?v=5.0.44';
import { guildBonusMult } from '../data/bosses.data.js?v=5.0.44';
import { setGuildPresence } from '../guild/guildPresence.js?v=5.0.44';
import { updateAccountHeaderUI } from './authModalView.js?v=5.0.44';

let state = null;
let strikeClicks = 0;
let strikeTimer = 0;
let striking = false;

function esc(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function attr(value) {
  return encodeURIComponent(String(value || ''));
}

function signedIn() {
  return !!getStoredAccount()?.username;
}

function toast(text) {
  const node = document.createElement('div');
  node.className = 'garden-toast';
  node.textContent = text;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2800);
}

function roleName(role) {
  if (role === 'leader') return 'Глава';
  if (role === 'officer') return 'Офицер';
  return 'Участник';
}

function clock(ms) {
  const left = Math.max(0, ms - Date.now());
  const total = Math.ceil(left / 1000);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${formatNumber(hours)}ч ${formatNumber(mins)}м`;
  return `${formatNumber(mins)}:${String(secs).padStart(2, '0')}`;
}

function applyPresence(data) {
  setGuildPresence(data?.presence || { level: 0, tag: '' });
  updateAccountHeaderUI();
}

async function loadGuild() {
  if (!signedIn()) {
    state = null;
    render();
    return;
  }
  const data = await socialRequest('guild');
  if (!data.success) {
    toast(data.error || 'Гильдия не ответила');
    render();
    return;
  }
  state = data;
  applyPresence(data);
  render();
}

function memberButtons(person, guild) {
  if (person.username === getStoredAccount()?.username) return '';
  const buttons = [];
  if (guild.canLead && person.role !== 'leader') {
    buttons.push(`<button type="button" class="garden-pill jelly-btn" data-guild-action="role" data-role="leader" data-user="${attr(person.username)}">Глава</button>`);
    buttons.push(`<button type="button" class="garden-pill jelly-btn" data-guild-action="role" data-role="${person.role === 'officer' ? 'member' : 'officer'}" data-user="${attr(person.username)}">${person.role === 'officer' ? 'В участники' : 'Офицер'}</button>`);
  }
  if ((guild.canLead || guild.role === 'officer') && person.role === 'member') {
    buttons.push(`<button type="button" class="garden-pill jelly-btn" data-guild-action="kick" data-user="${attr(person.username)}">Выгнать</button>`);
  }
  if (guild.canLead && person.role === 'officer') {
    buttons.push(`<button type="button" class="garden-pill jelly-btn" data-guild-action="kick" data-user="${attr(person.username)}">Выгнать</button>`);
  }
  return buttons.join('');
}

function bossBlock(guild) {
  const boss = guild.boss;
  if (!boss) {
    if (!guild.canSummon) return `<div class="garden-empty mt-3">Босса вызывает глава или офицер.</div>`;
    const rows = (guild.roster || []).map((row) => `
      <div class="garden-card flex items-center justify-between gap-2">
        <span class="truncate">${esc(row.icon)} ${esc(row.name)} · круг ${formatNumber(row.circle)} · ${formatNumber(row.points)} очков · ${formatNumber(row.plungers)} вантузов</span>
        ${row.unlocked
          ? `<button type="button" class="garden-pill accent jelly-btn shrink-0" data-guild-action="summon" data-boss="${row.index}">Вызвать</button>`
          : `<span class="garden-pill">Закрыт</span>`}
      </div>
    `).join('');
    return `<div class="garden-muted mt-3 mb-2">Кого вызвать</div><div class="grid gap-2">${rows}</div>`;
  }
  const cd = boss.cdUntilMs > Date.now();
  return `
    <button type="button" id="btnBossHit" class="boss-sprite garden-card w-full mt-3">
      <img src="assets/poop/bosses/${esc(boss.id)}.png" alt="" onerror="this.remove()">
      <span class="boss-fallback">${esc(boss.icon)}</span>
      <div>${esc(boss.name)} · круг ${formatNumber(boss.circle)}</div>
      <div class="garden-muted">Здоровье ${formatNumber(boss.hp)} / ${formatNumber(boss.maxHp)} · попытка ${clock(boss.deadlineMs)}</div>
      <div class="garden-muted">${cd ? `Ваш удар через ${clock(boss.cdUntilMs)}` : 'Жмите, чтобы бить 15 секунд'}</div>
    </button>
  `;
}

function render() {
  const box = document.getElementById('guildBody');
  const form = document.getElementById('guildCreateForm');
  if (!box) return;
  if (!signedIn()) {
    if (form) form.classList.add('hidden');
    box.innerHTML = `<div class="garden-empty">Гильдия открывается с аккаунта.</div>`;
    return;
  }
  const guild = state?.guild;
  if (!guild) {
    if (form) form.classList.remove('hidden');
    const invites = state?.invites || [];
    box.innerHTML = invites.length ? `<div class="garden-muted mb-2">Приглашения</div><div class="grid gap-2">${invites.map((invite) => `
      <div class="garden-card flex items-center justify-between gap-2">
        <span class="truncate">[${esc(invite.tag)}] ${esc(invite.name)} · от ${esc(invite.fromName)}</span>
        <span class="flex gap-1.5 shrink-0">
          <button type="button" class="garden-pill accent jelly-btn" data-guild-action="accept" data-guild="${invite.guildId}">Принять</button>
          <button type="button" class="garden-pill jelly-btn" data-guild-action="decline" data-guild="${invite.guildId}">Отклонить</button>
        </span>
      </div>
    `).join('')}</div>` : `<div class="garden-empty">Приглашений нет. Создайте гильдию или дождитесь зову.</div>`;
    return;
  }
  if (form) form.classList.add('hidden');
  const bonus = Math.round((guildBonusMult(guild.level) - 1) * 100);
  box.innerHTML = `
    <div class="garden-card mb-3">
      <div class="font-game text-lg">[${esc(guild.tag)}] ${esc(guild.name)}</div>
      <div class="garden-muted mt-1">${roleName(guild.role)} · уровень ${formatNumber(guild.level)} · ${formatNumber(guild.points)} очков · +${formatNumber(bonus)}% к клику и заводам</div>
    </div>
    ${bossBlock(guild)}
    <div class="garden-muted mt-3 mb-2">Состав · ${formatNumber((guild.members || []).length)}</div>
    <div class="grid gap-2">
      ${(guild.members || []).map((person) => `
        <div class="garden-card flex items-center justify-between gap-2">
          <span class="truncate">${esc(person.username)} · ${roleName(person.role)}</span>
          <span class="flex gap-1.5 shrink-0">${memberButtons(person, guild)}</span>
        </div>
      `).join('')}
    </div>
    <div class="flex gap-2 mt-3">
      <button type="button" class="garden-pill jelly-btn" data-guild-action="leave">Выйти</button>
      ${guild.canLead ? `<button type="button" class="garden-pill jelly-btn" data-guild-action="disband">Распустить</button>` : ''}
    </div>
  `;
}

async function act(action, button) {
  const username = decodeURIComponent(button?.dataset.user || '');
  let data = null;
  if (action === 'accept' || action === 'decline') {
    data = await socialRequest(action === 'accept' ? 'guild_accept' : 'guild_decline', {
      method: 'POST',
      body: { guildId: Number(button.dataset.guild) }
    });
  } else if (action === 'kick') {
    data = await socialRequest('guild_kick', { method: 'POST', body: { username } });
  } else if (action === 'role') {
    data = await socialRequest('guild_role', { method: 'POST', body: { username, role: button.dataset.role } });
  } else if (action === 'summon') {
    data = await socialRequest('guild_summon', { method: 'POST', body: { bossIndex: Number(button.dataset.boss) } });
  } else if (action === 'leave') {
    data = await socialRequest('guild_leave', { method: 'POST', body: {} });
  } else if (action === 'disband') {
    data = await socialRequest('guild_disband', { method: 'POST', body: {} });
  }
  if (!data?.success) {
    toast(data?.error || 'Не вышло');
    return;
  }
  if (data.guild !== undefined || data.presence) {
    state = data;
    applyPresence(data);
  }
  await loadGuild();
}

function stopStrike() {
  striking = false;
  strikeClicks = 0;
  if (strikeTimer) clearInterval(strikeTimer);
  strikeTimer = 0;
}

async function pushStrike() {
  const data = await socialRequest('guild_strike', { method: 'POST', body: { clicks: strikeClicks } });
  if (!data.success) {
    toast(data.error || 'Удар не прошёл');
    stopStrike();
    return;
  }
  state = data;
  applyPresence(data);
  render();
  if (!data.guild?.boss || data.waiting) stopStrike();
}

function startStrike() {
  if (striking) return;
  striking = true;
  strikeClicks = 0;
  const started = Date.now();
  strikeTimer = setInterval(() => {
    if (Date.now() - started > 16000) {
      stopStrike();
      return;
    }
    pushStrike();
  }, 400);
  pushStrike();
}

export async function sendGuildInvite(username) {
  return socialRequest('guild_invite', { method: 'POST', body: { username } });
}

export function initGuildView() {
  const modal = document.getElementById('guildModal');
  document.getElementById('btnGuildModal')?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
    loadGuild();
  });
  document.getElementById('guildCreateForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = await socialRequest('guild_create', {
      method: 'POST',
      body: {
        name: document.getElementById('guildNameInput')?.value || '',
        tag: document.getElementById('guildTagInput')?.value || ''
      }
    });
    if (!data.success) {
      toast(data.error || 'Гильдия не создана');
      return;
    }
    state = data;
    applyPresence(data);
    render();
  });
  document.getElementById('guildBody')?.addEventListener('click', (event) => {
    const hit = event.target.closest('#btnBossHit');
    if (hit) {
      hit.classList.remove('hit');
      void hit.offsetWidth;
      hit.classList.add('hit');
      strikeClicks += 1;
      startStrike();
      return;
    }
    const button = event.target.closest('[data-guild-action]');
    if (!button) return;
    act(button.dataset.guildAction, button);
  });
  if (signedIn()) loadGuild();
}
