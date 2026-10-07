import { GAME } from '../core/state.js?v=5.0.63';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.63';
import { getStoredAccount, socialRequest } from '../save/cloudSync.js?v=5.0.63';
import { GUILD_MAX_LEVEL, guildBonusPct, guildLevelProgress } from '../data/bosses.data.js?v=5.0.63';
import { KNIVES } from '../data/knives.data.js?v=5.0.63';
import { getPhaseForForm } from '../progression/phases.data.js?v=5.0.63';
import { setGuildPresence } from '../guild/guildPresence.js?v=5.0.63';
import { updateAccountHeaderUI } from './authModalView.js?v=5.0.63';
import { getClickCapCps } from '../systems/autoclickService.js?v=5.0.63';

const AUTO_KEY = 'PoopSim_BossAuto';

let state = null;
let directory = [];
let directoryError = '';
let page = 'mine';
let strikeClicks = 0;
let strikeTimer = 0;
let autoTimer = 0;
let autoAcc = 0;
let strikeBusy = false;
let strikeQueued = false;
let striking = false;
let toldAt = 0;
let autoFight = false;

try {
  autoFight = localStorage.getItem(AUTO_KEY) === '1';
} catch (_) {
  autoFight = false;
}

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

function myEpoch() {
  const form = Math.max((GAME.evoStage || 0) + 1, Number(GAME.peakForm) || 1);
  return getPhaseForForm(form).id;
}

function knifeName(id) {
  if (!id) return '';
  return KNIVES.find((knife) => knife.id === id)?.name || '';
}

function clock(ms) {
  const left = Math.max(0, ms - Date.now());
  const total = Math.ceil(left / 1000);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${formatNumber(hours)}ч ${formatNumber(mins)}м`;
  if (mins > 0) return `${formatNumber(mins)}м ${formatNumber(secs)}с`;
  return `${formatNumber(secs)}с`;
}

function setText(id, text) {
  const node = document.getElementById(id);
  if (node && node.textContent !== text) node.textContent = text;
}

function applyPresence(data) {
  setGuildPresence(data?.presence || { level: 0, tag: '' });
  updateAccountHeaderUI();
}

function canManageGuild(guild = state?.guild) {
  return !!(guild && (guild.canLead || guild.canInvite || guild.role === 'officer' || guild.role === 'leader'));
}

function showPage(next) {
  let want = next === 'fight' || next === 'search' || next === 'journal' || next === 'settings' ? next : 'mine';
  if (want === 'settings' && !canManageGuild()) want = 'mine';
  page = want;
  document.getElementById('guildPageMine')?.classList.toggle('hidden', page !== 'mine');
  document.getElementById('guildPageFight')?.classList.toggle('hidden', page !== 'fight');
  document.getElementById('guildPageJournal')?.classList.toggle('hidden', page !== 'journal');
  document.getElementById('guildPageSettings')?.classList.toggle('hidden', page !== 'settings');
  document.getElementById('guildPageSearch')?.classList.toggle('hidden', page !== 'search');
  document.querySelectorAll('#guildTabs [data-guild-page]').forEach((button) => {
    button.classList.toggle('accent', button.dataset.guildPage === page);
  });
  document.getElementById('guildSearchForm')?.classList.toggle('hidden', !signedIn() || page !== 'search');
  if (page === 'fight') paintFight();
  if (page === 'journal') renderJournal();
  if (page === 'settings') renderSettings();
}

async function loadDirectory(query, level, announce) {
  if (!signedIn()) {
    directory = [];
    directoryError = '';
    renderSearch();
    return;
  }
  const data = await socialRequest('guild_list', {
    query: `q=${encodeURIComponent(query || '')}&level=${encodeURIComponent(level || '')}`
  });
  if (!data.success) {
    directory = [];
    directoryError = data.error || 'Список гильдий не ответил';
    if (announce) toast(directoryError);
    renderSearch();
    return;
  }
  directoryError = '';
  directory = data.guilds || [];
  renderSearch();
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

function renderSearch() {
  const box = document.getElementById('guildSearchBody');
  if (!box) return;
  if (!signedIn()) {
    box.innerHTML = '';
    return;
  }
  const note = state?.guild
    ? '<div class="garden-muted mb-3">В гильдии можно состоять только в одной. Здесь её ищут, отсюда не переходят.</div>'
    : '';
  if (directoryError) {
    box.innerHTML = `${note}<div class="garden-empty">${esc(directoryError)}</div>`;
    return;
  }
  if (!directory.length) {
    const query = (document.getElementById('guildSearchInput')?.value || '').trim();
    const level = (document.getElementById('guildLevelInput')?.value || '').trim();
    const empty = query || level ? 'Ничего не нашлось.' : 'Гильдий пока нет.';
    box.innerHTML = `${note}<div class="garden-empty">${empty}</div>`;
    return;
  }
  const mine = state?.guild?.id;
  const free = !state?.guild;
  const epoch = myEpoch();
  const rows = directory.map((row) => {
    let action = '';
    if (mine === row.id) action = '<span class="garden-pill shrink-0">Ваша</span>';
    else if (!free) action = '';
    else if (row.applied) action = `<button type="button" class="garden-pill jelly-btn shrink-0" data-guild-action="cancel" data-guild="${row.id}">Отозвать</button>`;
    else if (row.members >= row.cap) action = '<span class="garden-pill shrink-0">Мест нет</span>';
    else if ((row.reqEpoch || 1) > epoch) action = `<span class="garden-pill shrink-0">Нужна эпоха ${formatNumber(row.reqEpoch || 1)}</span>`;
    else action = `<button type="button" class="garden-pill accent jelly-btn shrink-0" data-guild-action="apply" data-guild="${row.id}">Подать заявку</button>`;
    return `
      <div class="garden-card flex items-center justify-between gap-2">
        <div class="min-w-0">
          <div class="truncate">[${esc(row.tag)}] ${esc(row.name)}</div>
          <div class="garden-muted">Уровень ${formatNumber(row.level)} · ${formatNumber(row.members)}/${formatNumber(row.cap)} · с эпохи ${formatNumber(row.reqEpoch || 1)}</div>
        </div>
        ${action}
      </div>
    `;
  }).join('');
  box.innerHTML = `${note}<div class="grid gap-2">${rows}</div>`;
}

function renderMine() {
  const box = document.getElementById('guildMine');
  const form = document.getElementById('guildCreateForm');
  const tabs = document.getElementById('guildTabs');
  const search = document.getElementById('guildSearchForm');
  if (!box) return;
  const guest = !signedIn();
  const settingsTab = document.getElementById('guildTabSettings');
  if (tabs) tabs.classList.toggle('hidden', guest);
  if (search) search.classList.toggle('hidden', guest || page !== 'search');
  if (guest) {
    if (form) form.classList.add('hidden');
    if (settingsTab) settingsTab.classList.add('hidden');
    box.innerHTML = '<div class="garden-empty">Гильдия открывается с аккаунта.</div>';
    return;
  }
  const guild = state?.guild;
  if (!guild) {
    if (form) form.classList.remove('hidden');
    if (settingsTab) settingsTab.classList.add('hidden');
    if (page === 'settings') showPage('mine');
    const invites = state?.invites || [];
    const inviteBlock = invites.length ? `<div class="garden-muted mb-2">Приглашения</div><div class="grid gap-2">${invites.map((invite) => `
      <div class="garden-card flex items-center justify-between gap-2">
        <span class="truncate">[${esc(invite.tag)}] ${esc(invite.name)} · от ${esc(invite.fromName)}</span>
        <span class="flex gap-1.5 shrink-0">
          <button type="button" class="garden-pill accent jelly-btn" data-guild-action="accept" data-guild="${invite.guildId}">Принять</button>
          <button type="button" class="garden-pill jelly-btn" data-guild-action="decline" data-guild="${invite.guildId}">Отклонить</button>
        </span>
      </div>
    `).join('')}</div>` : '<div class="garden-empty">Своей гильдии нет. Создайте её здесь или откройте вкладку «Поиск».</div>';
    box.innerHTML = inviteBlock;
    return;
  }
  if (form) form.classList.add('hidden');
  if (settingsTab) settingsTab.classList.toggle('hidden', !canManageGuild(guild));
  if (page === 'settings' && !canManageGuild(guild)) showPage('mine');
  const progress = guildLevelProgress(guild.points);
  const bonus = guildBonusPct(progress.level);
  const members = guild.members || [];
  const barLabel = progress.maxed
    ? `${formatNumber(progress.points)} очков · максимум`
    : `${formatNumber(progress.points)} / ${formatNumber(progress.next)} очков`;
  const bonusRows = Array.from({ length: GUILD_MAX_LEVEL }, (_, i) => {
    const level = i + 1;
    const pct = guildBonusPct(level);
    const state = level < progress.level ? 'done' : level === progress.level ? 'current' : 'locked';
    return `
      <div class="guild-bonus-row ${state}">
        <span>Ур. ${formatNumber(level)}</span>
        <span>+${formatNumber(pct)}% к клику и заводам</span>
      </div>
    `;
  }).join('');
  box.innerHTML = `
    <div class="garden-card">
      <div class="font-game text-lg">[${esc(guild.tag)}] ${esc(guild.name)}</div>
      <div class="garden-muted mt-1">${roleName(guild.role)} · +${formatNumber(bonus)}% к клику и заводам · вход с эпохи ${formatNumber(guild.reqEpoch || 1)}</div>
      <div class="guild-level mt-3">
        <div class="guild-level-head">
          <span class="font-game">Уровень ${formatNumber(progress.level)}</span>
          <span class="garden-pill">${barLabel}</span>
        </div>
        <div class="guild-level-bar" role="progressbar" aria-valuenow="${progress.pct}" aria-valuemin="0" aria-valuemax="100">
          <div style="width:${progress.pct}%"></div>
        </div>
        ${progress.maxed ? '' : `<div class="garden-muted mt-1">До ур. ${formatNumber(progress.level + 1)} ещё ${formatNumber(Math.max(0, progress.next - progress.points))} очков</div>`}
      </div>
    </div>
    <div class="guild-bonuses mt-3">
      <div class="guild-roster-head">
        <span class="font-game">Бонусы</span>
        <span class="garden-pill">сейчас +${formatNumber(bonus)}%</span>
      </div>
      <div class="garden-muted mb-2">Каждый уровень гильдии даёт +2% к клику и заводам всем участникам.</div>
      <div class="grid gap-1.5">${bonusRows}</div>
    </div>
    <div class="guild-roster mt-3">
      <div class="guild-roster-head">
        <span class="font-game">Состав</span>
        <span class="garden-pill">${formatNumber(members.length)} / 20</span>
      </div>
      <div class="grid gap-2">
        ${members.map((person) => `
          <div class="guild-member-row flex items-center justify-between gap-2">
            <span class="truncate">${esc(person.username)} · ${roleName(person.role)}</span>
            <span class="flex gap-1.5 shrink-0">${memberButtons(person, guild)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="flex gap-2 mt-3">
      <button type="button" class="garden-pill jelly-btn" data-guild-action="leave">Выйти</button>
    </div>
  `;
}

function renderSettings() {
  const box = document.getElementById('guildSettings');
  if (!box) return;
  if (!signedIn()) {
    box.innerHTML = '<div class="garden-empty">Настройки открываются с аккаунта.</div>';
    return;
  }
  const guild = state?.guild;
  if (!guild) {
    box.innerHTML = '<div class="garden-empty">Сначала вступите в гильдию.</div>';
    return;
  }
  if (!canManageGuild(guild)) {
    box.innerHTML = '<div class="garden-empty">Настройки видят глава и офицеры.</div>';
    return;
  }
  const gate = guild.canLead
    ? `<form id="guildGateForm" class="flex gap-2 mt-2">
        <input id="guildEpochInput" class="garden-input" inputmode="numeric" maxlength="3" placeholder="Эпоха для входа" value="${Number(guild.reqEpoch) || 1}">
        <button type="submit" class="garden-pill accent jelly-btn shrink-0">Поставить</button>
      </form>
      <div class="garden-muted mt-2">С аккаунта ниже этой эпохи в гильдию не пускают.</div>`
    : `<div class="garden-muted mt-2">Порог эпохи ставит только глава. Сейчас эпоха ${formatNumber(guild.reqEpoch || 1)}.</div>`;
  const apps = guild.applications || [];
  const applications = guild.canInvite
    ? (apps.length
      ? `<div class="grid gap-2">${apps.map((row) => `
          <div class="garden-card flex items-center justify-between gap-2">
            <span class="truncate">${esc(row.username)}</span>
            <span class="flex gap-1.5 shrink-0">
              <button type="button" class="garden-pill accent jelly-btn" data-guild-action="applyAccept" data-user="${attr(row.username)}">Принять</button>
              <button type="button" class="garden-pill jelly-btn" data-guild-action="applyDecline" data-user="${attr(row.username)}">Отклонить</button>
            </span>
          </div>
        `).join('')}</div>`
      : '<div class="garden-empty">Заявок пока нет.</div>')
    : '';
  box.innerHTML = `
    <div class="garden-card">
      <div class="font-game">Порог входа</div>
      ${gate}
    </div>
    ${guild.canInvite ? `<div class="garden-muted mt-3 mb-2">Заявки · ${formatNumber(apps.length)}</div>${applications}` : ''}
    ${guild.canLead ? `
      <div class="garden-card mt-3">
        <div class="font-game">Опасная зона</div>
        <div class="garden-muted mt-1 mb-2">Роспуск удаляет гильдию у всех участников.</div>
        <button type="button" class="garden-pill jelly-btn" data-guild-action="disband">Распустить гильдию</button>
      </div>
    ` : ''}
  `;
}

function livePhase(boss) {
  const now = Date.now();
  if ((boss?.windowUntilMs || 0) > now) return 'hitting';
  if (boss?.phase === 'hitting') return 'hitting';
  if (boss?.phase === 'cooldown' || boss?.phase === 'ready') return boss.phase;
  if ((boss?.cdUntilMs || 0) > now) return 'cooldown';
  return 'ready';
}

function phaseLabel(boss) {
  const phase = livePhase(boss);
  if (phase === 'hitting') {
    const left = Math.max(0, Math.ceil(((boss.windowUntilMs || 0) - Date.now()) / 1000));
    return autoFight
      ? `Автобой · осталось ${formatNumber(left)}с`
      : `Бой идёт · осталось ${formatNumber(left)}с`;
  }
  if (phase === 'cooldown') return `Перерыв · следующий бой через ${clock(boss.cdUntilMs)}`;
  return 'Готов к бою · 15 секунд удара, потом 3 часа';
}

function liveClicks(boss) {
  const server = Number(boss?.blow?.clicks) || 0;
  return striking ? Math.max(strikeClicks, server) : server;
}

function liveDamage(boss) {
  const blow = boss?.blow || {};
  const per = Number(blow.perClick) || 0;
  const serverDealt = Number(blow.myDamage) || 0;
  const serverClicks = Number(blow.clicks) || 0;
  const clicks = liveClicks(boss);
  if (striking && per > 0 && clicks > serverClicks) {
    return serverDealt + (clicks - serverClicks) * per;
  }
  if (striking && per > 0 && !serverDealt) return clicks * per;
  return serverDealt;
}

function damageLine(boss) {
  const clicks = liveClicks(boss);
  const dealt = liveDamage(boss);
  if (!dealt && !clicks) return 'Урон: 0 · Клики: 0';
  return `Урон: ${formatNumber(dealt)} · Клики: ${formatNumber(clicks)}`;
}

function whyLine(blow) {
  const cap = Number(blow?.cap) || getClickCapCps();
  if (!blow?.perClick) {
    return `Как считается урон за клик: √формы × (1 + сила ножа). Звёзды ножа чуть усиливают. Точная цифра придёт с первым ударом. Потолок ${formatNumber(cap)} клик/сек.`;
  }
  const name = knifeName(blow.knifeId);
  const gear = name
    ? `форма ${formatNumber(blow.form || 1)}, нож «${name}», ★${formatNumber(blow.stars || 1)}`
    : `форма ${formatNumber(blow.form || 1)}, без ножа`;
  return `Урон за клик: ${formatNumber(blow.perClick)} (${gear}). Считается как √формы × (1 + сила ножа). Потолок ${formatNumber(cap)} клик/сек.`;
}

function fightShell(boss) {
  return `
    <div class="boss-fight">
      <div id="bossFigure" class="boss-sprite">
        <img src="assets/poop/bosses/${esc(boss.id)}.png" alt="" onerror="this.remove()">
        <span class="boss-fallback">${esc(boss.icon)}</span>
        <div id="bossHint" class="boss-hint">Нажми, чтобы начать бой</div>
      </div>
      <div id="bossTitle" class="font-game text-lg"></div>
      <div class="boss-hp"><div id="bossHpFill"></div></div>
      <div id="bossHpText" class="garden-muted"></div>
      <div id="bossPhase" class="garden-pill"></div>
      <div class="garden-card boss-live">
        <div id="bossDamage" class="font-game text-base"></div>
      </div>
      <div id="bossWhy" class="garden-muted boss-why"></div>
      <label class="garden-pill boss-auto" for="bossAutoFight">
        <input id="bossAutoFight" type="checkbox"${autoFight ? ' checked' : ''}>
        <span>Автобой на потолке кликов</span>
      </label>
      <button type="button" id="btnBossHit" class="garden-pill accent jelly-btn">Начать бой</button>
    </div>
  `;
}

function paintFight() {
  const box = document.getElementById('guildFight');
  const guild = state?.guild;
  if (!box) return;
  if (!signedIn()) {
    box.innerHTML = '<div class="garden-empty">Бой открывается с аккаунта.</div>';
    box.dataset.key = '';
    return;
  }
  if (!guild) {
    box.innerHTML = '<div class="garden-empty">Сначала вступите в гильдию.</div>';
    box.dataset.key = '';
    return;
  }
  const boss = guild.boss;
  if (!boss) {
    box.dataset.key = '';
    if (!guild.canSummon) {
      box.innerHTML = '<div class="garden-empty">Босса вызывает глава или офицер.</div>';
      return;
    }
    const rows = (guild.roster || []).map((row) => `
      <div class="garden-card flex items-center justify-between gap-2">
        <span class="truncate">${esc(row.icon)} ${esc(row.name)} · круг ${formatNumber(row.circle)} · ${formatNumber(row.points)} очков · ${formatNumber(row.plungers)} вантузов</span>
        ${row.unlocked
          ? `<button type="button" class="garden-pill accent jelly-btn shrink-0" data-guild-action="summon" data-boss="${row.index}">Вызвать</button>`
          : '<span class="garden-pill">Закрыт</span>'}
      </div>
    `).join('');
    box.innerHTML = `<div class="garden-muted mb-2">Кого вызвать</div><div class="grid gap-2">${rows}</div>`;
    return;
  }
  const key = `${boss.index}:${boss.deadlineMs}`;
  if (box.dataset.key !== key) {
    box.dataset.key = key;
    box.innerHTML = fightShell(boss);
  }
  const hp = Math.max(0, Number(boss.hp) || 0);
  const max = Math.max(1, Number(boss.maxHp) || 1);
  const fill = document.getElementById('bossHpFill');
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, (hp / max) * 100))}%`;
  const phase = livePhase(boss);
  setText('bossTitle', `${boss.name} · круг ${formatNumber(boss.circle)}`);
  setText('bossHpText', `Здоровье ${formatNumber(hp)} / ${formatNumber(max)} · попытка ${clock(boss.deadlineMs)}`);
  setText('bossPhase', phaseLabel(boss));
  setText('bossDamage', damageLine(boss));
  setText('bossWhy', whyLine(boss.blow));
  const hint = document.getElementById('bossHint');
  if (hint) hint.classList.toggle('hidden', phase !== 'ready');
  const autoBox = document.getElementById('bossAutoFight');
  if (autoBox) autoBox.checked = autoFight;
  const button = document.getElementById('btnBossHit');
  if (button) {
    button.disabled = phase === 'cooldown';
    const label = phase === 'hitting'
      ? (autoFight ? 'Автобой' : 'Бьёте')
      : phase === 'cooldown'
        ? 'Ждите'
        : (autoFight ? 'Начать автобой' : 'Начать бой');
    if (button.textContent !== label) button.textContent = label;
  }
}

function whenText(ms) {
  const at = Number(ms) || 0;
  if (!at) return '';
  try {
    return new Date(at).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return '';
  }
}

function renderJournal() {
  const box = document.getElementById('guildJournal');
  if (!box) return;
  if (!signedIn()) {
    box.innerHTML = '<div class="garden-empty">Журнал открывается с аккаунта.</div>';
    return;
  }
  const guild = state?.guild;
  if (!guild) {
    box.innerHTML = '<div class="garden-empty">Сначала вступите в гильдию.</div>';
    return;
  }
  const live = guild.boss
    ? `<div class="garden-pill accent mb-3">Сейчас бой: ${esc(guild.boss.icon)} ${esc(guild.boss.name)} · круг ${formatNumber(guild.boss.circle)}</div>`
    : '<div class="garden-muted mb-3">Сейчас босса нет. Журнал можно смотреть в любой момент.</div>';
  const book = (guild.roster || []).map((row) => {
    const status = row.unlocked
      ? `открыт · побед ${formatNumber(row.clears || 0)} · след. круг ${formatNumber(row.circle)}`
      : 'ещё закрыт';
    const prize = row.unlocked
      ? ` · награда круга: ${formatNumber(row.points)} очков, ${formatNumber(row.plungers)} вантузов`
      : '';
    return `
      <div class="garden-card flex items-center gap-2">
        <span class="text-2xl shrink-0">${esc(row.icon)}</span>
        <div class="min-w-0 text-left">
          <div class="truncate font-game">${esc(row.name)}</div>
          <div class="garden-muted">${status}${prize}</div>
        </div>
      </div>
    `;
  }).join('');
  const log = guild.journal || [];
  const history = log.length
    ? log.map((row) => {
      const mark = row.win ? 'Победа' : 'Проигрыш';
      const reward = row.win
        ? ` · +${formatNumber(row.points)} очков · ${formatNumber(row.plungers)} вантузов бойцу`
        : '';
      return `
        <div class="garden-card flex items-center gap-2">
          <span class="text-2xl shrink-0">${esc(row.icon)}</span>
          <div class="min-w-0 text-left">
            <div class="truncate">${esc(mark)} · ${esc(row.name)} · круг ${formatNumber(row.circle)}</div>
            <div class="garden-muted">${whenText(row.endedMs)} · урон ${formatNumber(row.damage)} · били ${formatNumber(row.hitters)}${reward}</div>
          </div>
        </div>
      `;
    }).join('')
    : '<div class="garden-empty">Пока пусто. Записи появятся после победы или проигрыша.</div>';
  box.innerHTML = `
    ${live}
    <div class="garden-muted mb-2">Книга боссов</div>
    <div class="grid gap-2 mb-4">${book}</div>
    <div class="garden-muted mb-2">Недавние бои</div>
    <div class="grid gap-2">${history}</div>
  `;
}

function render() {
  renderMine();
  renderSearch();
  renderJournal();
  renderSettings();
  paintFight();
  showPage(page);
}

function mergeFight(fight) {
  if (!state?.guild || !fight) return;
  state.guild.boss = {
    ...(state.guild.boss || {}),
    ...fight,
    blow: { ...(state.guild.boss?.blow || {}), ...(fight.blow || {}) }
  };
  paintFight();
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
  } else if (action === 'apply' || action === 'cancel') {
    data = await socialRequest(action === 'apply' ? 'guild_apply' : 'guild_apply_cancel', {
      method: 'POST',
      body: { guildId: Number(button.dataset.guild) }
    });
  } else if (action === 'applyAccept' || action === 'applyDecline') {
    data = await socialRequest(action === 'applyAccept' ? 'guild_apply_accept' : 'guild_apply_decline', {
      method: 'POST',
      body: { username }
    });
  } else if (action === 'leave') {
    data = await socialRequest('guild_leave', { method: 'POST', body: {} });
  } else if (action === 'disband') {
    data = await socialRequest('guild_disband', { method: 'POST', body: {} });
  } else if (action === 'gate') {
    data = await socialRequest('guild_gate', {
      method: 'POST',
      body: { epoch: document.getElementById('guildEpochInput')?.value || '' }
    });
  }
  if (!data?.success) {
    toast(data?.error || 'Не вышло');
    return;
  }
  if (action === 'apply') toast('Заявка отправлена');
  if (action === 'cancel') toast('Заявка отозвана');
  if (action === 'gate') toast('Порог эпохи поставлен');
  if (data.guild !== undefined || data.presence) {
    state = data;
    applyPresence(data);
  }
  await loadGuild();
  if (page === 'search' || action === 'apply' || action === 'cancel') {
    await loadDirectory(
      document.getElementById('guildSearchInput')?.value || '',
      document.getElementById('guildLevelInput')?.value || ''
    );
  }
}

function stopAutoTick() {
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = 0;
  autoAcc = 0;
}

function runAutoFight(dt) {
  if (!striking || !autoFight) return;
  const cap = Math.max(1, Number(state?.guild?.boss?.blow?.cap) || getClickCapCps());
  autoAcc += cap * dt;
  const add = Math.floor(autoAcc);
  if (add <= 0) return;
  autoAcc -= add;
  strikeClicks += add;
  const figure = document.getElementById('bossFigure');
  if (figure && Math.random() < 0.35) {
    figure.classList.remove('hit');
    void figure.offsetWidth;
    figure.classList.add('hit');
  }
}

function stopStrike() {
  striking = false;
  strikeClicks = 0;
  strikeQueued = false;
  if (strikeTimer) clearInterval(strikeTimer);
  strikeTimer = 0;
  stopAutoTick();
  paintFight();
}

async function pushStrike() {
  if (!striking) return;
  if (strikeBusy) {
    strikeQueued = true;
    return;
  }
  strikeBusy = true;
  const sent = strikeClicks;
  let data = null;
  try {
    data = await socialRequest('guild_strike', { method: 'POST', body: { clicks: sent } });
  } finally {
    strikeBusy = false;
  }
  if (!data?.success) {
    toast(data?.error || 'Удар не прошёл');
    stopStrike();
    return;
  }
  if (data.fight) mergeFight(data.fight);
  else if (data.guild !== undefined) {
    state = data;
    applyPresence(data);
    paintFight();
  }
  const phase = livePhase(state?.guild?.boss);
  if (data.fight?.ended || phase === 'cooldown') {
    stopStrike();
    if (data.fight?.ended) await loadGuild();
    return;
  }
  if (strikeQueued && striking) {
    strikeQueued = false;
    pushStrike();
  }
}

function startStrike() {
  if (striking) return;
  striking = true;
  autoAcc = 0;
  const boss = state?.guild?.boss;
  if (boss && livePhase(boss) === 'ready') {
    boss.phase = 'hitting';
    boss.windowUntilMs = Date.now() + 15000;
    boss.cdUntilMs = 0;
  }
  strikeTimer = setInterval(() => {
    const current = state?.guild?.boss;
    if (!current || livePhase(current) !== 'hitting') {
      stopStrike();
      return;
    }
    pushStrike();
  }, 500);
  stopAutoTick();
  autoTimer = setInterval(() => {
    if (!striking || livePhase(state?.guild?.boss) !== 'hitting') {
      stopStrike();
      return;
    }
    runAutoFight(0.1);
    paintFight();
  }, 100);
  pushStrike();
  paintFight();
}

function pokeBoss() {
  const boss = state?.guild?.boss;
  if (!boss) return;
  const phase = livePhase(boss);
  if (phase === 'cooldown') {
    if (Date.now() - toldAt > 1500) {
      toldAt = Date.now();
      toast('Сейчас бить нельзя');
    }
    paintFight();
    return;
  }
  const figure = document.getElementById('bossFigure');
  if (figure) {
    figure.classList.remove('hit');
    void figure.offsetWidth;
    figure.classList.add('hit');
  }
  if (!striking) {
    strikeClicks = 1;
    startStrike();
  } else {
    strikeClicks += 1;
  }
  paintFight();
}

export async function sendGuildInvite(username) {
  return socialRequest('guild_invite', { method: 'POST', body: { username } });
}

export function initGuildView() {
  const modal = document.getElementById('guildModal');
  document.getElementById('btnGuildModal')?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
    showPage('mine');
    loadGuild();
    loadDirectory('', '');
  });
  document.getElementById('guildSearchForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    loadDirectory(
      document.getElementById('guildSearchInput')?.value || '',
      document.getElementById('guildLevelInput')?.value || '',
      true
    );
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
  modal?.addEventListener('submit', (event) => {
    if (event.target?.id !== 'guildGateForm') return;
    event.preventDefault();
    act('gate');
  });
  modal?.addEventListener('change', (event) => {
    if (event.target?.id !== 'bossAutoFight') return;
    autoFight = !!event.target.checked;
    try {
      localStorage.setItem(AUTO_KEY, autoFight ? '1' : '0');
    } catch (_) { /* ignore */ }
    paintFight();
  });
  modal?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-guild-page]');
    if (tab) {
      showPage(tab.dataset.guildPage);
      return;
    }
    if (event.target.closest('#bossAutoFight') || event.target.closest('label.boss-auto')) return;
    if (event.target.closest('#btnBossHit, #bossFigure, #bossHint')) {
      pokeBoss();
      return;
    }
    const button = event.target.closest('[data-guild-action]');
    if (!button) return;
    act(button.dataset.guildAction, button);
  });
  setInterval(() => {
    if (modal?.classList.contains('hidden')) return;
    if (page === 'fight' && state?.guild?.boss) paintFight();
  }, 250);
  if (signedIn()) loadGuild();
}
