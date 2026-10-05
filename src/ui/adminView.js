import { applySaveDataSafely, saveLocal } from '../save/saveManager.js?v=5.0.30';
import { AUTH_STORAGE_KEY, adminRequest, fetchAdminSession, getStoredAccount, wipeAllCloudSaves, wipeCloudPlayer } from '../save/cloudSync.js?v=5.0.30';
import { STORAGE_KEY, BACKUP_KEY } from '../save/saveManager.js?v=5.0.30';
import { updateHUD } from './hudView.js?v=5.0.30';
import { renderFactories } from './factoryView.js?v=5.0.30';
import { renderTalents } from './talentView.js?v=5.0.30';
import { renderShop } from './shopView.js';
import { renderCharacterInventory } from './characterInventoryView.js?v=5.0.30';
import { formatNumber, parseShorthand } from '../utils/numberFormatter.js?v=5.0.30';
import { SHOP_ITEMS, BOUTIQUE_REPEATABLES } from '../data/shop.data.js?v=5.0.30';
import { TALENTS } from '../data/talents.data.js';
import { FACTORIES } from '../data/factories.data.js?v=5.0.30';
import { KNIVES } from '../data/knives.data.js';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js?v=5.0.30';
import { setConfirmedVip } from '../economy/pace.js';

let adminRole = null;
let adminPlayerId = '';

const CURRENCIES = [
  ['biomass', '💨 Биомасса'],
  ['sparkles', '✨ Блестяшки'],
  ['rolls', '🧻 Втулки'],
  ['plungers', '🪠 Вантузы'],
  ['form', '🧬 Форма'],
  ['flushes', '🌀 Смывы'],
  ['transcends', '👑 Прорывы']
];

const KINDS = [
  { id: 'hat', label: 'Шапки', needsAmount: false, equip: true },
  { id: 'perk', label: 'Перки', needsAmount: false, equip: false },
  { id: 'talent', label: 'Таланты', needsAmount: true, equip: false, amountHint: 'уровень, например 10' },
  { id: 'factory', label: 'Заводы', needsAmount: true, equip: false, amountHint: 'сколько штук: 10 или 10k' },
  { id: 'knife', label: 'Ножи', needsAmount: false, equip: true },
  { id: 'boutique', label: 'Бутик', needsAmount: true, equip: false, amountHint: 'уровень, до 20' },
  { id: 'relic', label: 'Реликвии прорыва', needsAmount: true, equip: false, amountHint: 'уровень' }
];

function catalog(kind) {
  if (kind === 'hat') return SHOP_ITEMS.filter((row) => row.type === 'hat').map((row) => ({ id: row.id, label: `${row.icon} ${row.name}` }));
  if (kind === 'perk') return SHOP_ITEMS.filter((row) => row.type === 'perk').map((row) => ({ id: row.id, label: `${row.icon} ${row.name}` }));
  if (kind === 'talent') return TALENTS.map((row) => ({ id: row.id, label: `${row.icon} ${row.name}` }));
  if (kind === 'factory') return FACTORIES.map((row) => ({ id: row.id, label: `${row.icon} ${row.name}` }));
  if (kind === 'knife') return KNIVES.map((row) => ({ id: row.id, label: `${row.icon || '🔪'} ${row.name}` }));
  if (kind === 'boutique') return BOUTIQUE_REPEATABLES.map((row) => ({ id: row.id, label: `${row.icon} ${row.name}` }));
  return TRANSCEND_UPGRADES.map((row) => ({ id: row.key, label: row.name, flag: row.max === 1 }));
}

function currentKind() {
  return KINDS.find((row) => row.id === document.getElementById('adminKind')?.value) || KINDS[0];
}

function textOrEmpty(id) {
  const text = String(document.getElementById(id)?.value || '').trim();
  return text || undefined;
}

function setAdminStatus(message, ok) {
  const box = document.getElementById('adminStatus');
  if (!box) return;
  box.textContent = message;
  box.className = ok
    ? 'text-[11px] p-2 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200'
    : 'text-[11px] p-2 rounded-xl bg-red-950/80 border border-red-500 text-red-200';
}

function paintRole() {
  const button = document.getElementById('btnAdminPanel');
  if (button) button.classList.toggle('hidden', !adminRole);
  const creatorBox = document.getElementById('adminCreatorBox');
  if (creatorBox) creatorBox.classList.toggle('hidden', adminRole !== 'creator');
  const vipBox = document.getElementById('adminVipBox');
  if (vipBox) vipBox.classList.toggle('hidden', adminRole !== 'creator' && adminRole !== 'admin');
  const roleLabel = document.getElementById('adminRoleLabel');
  if (roleLabel) roleLabel.textContent = adminRole === 'creator' ? 'Создатель' : 'Админ';
}

function showPane(name) {
  document.getElementById('adminPaneCurrency')?.classList.toggle('hidden', name !== 'currency');
  document.getElementById('adminPaneItem')?.classList.toggle('hidden', name !== 'item');
  const currency = document.getElementById('adminTabCurrency');
  const item = document.getElementById('adminTabItem');
  currency?.classList.toggle('bg-rose-600', name === 'currency');
  currency?.classList.toggle('text-white', name === 'currency');
  currency?.classList.toggle('bg-stone-800', name !== 'currency');
  item?.classList.toggle('bg-rose-600', name === 'item');
  item?.classList.toggle('text-white', name === 'item');
  item?.classList.toggle('bg-stone-800', name !== 'item');
  item?.classList.toggle('border', name !== 'item');
  item?.classList.toggle('border-stone-600', name !== 'item');
}

function paintAmountPreview(input, preview) {
  if (!preview) return;
  const raw = String(input?.value || '').trim();
  if (!raw) {
    preview.textContent = '';
    return;
  }
  const n = parseShorthand(raw);
  preview.textContent = n === null ? 'Не разобрал сумму' : `= ${formatNumber(n)}`;
}

function fillKindSelect() {
  const select = document.getElementById('adminKind');
  if (!select || select.options.length) return;
  KINDS.forEach((kind) => {
    const option = document.createElement('option');
    option.value = kind.id;
    option.textContent = kind.label;
    select.appendChild(option);
  });
}

function fillPickList() {
  const kind = currentKind();
  const query = String(document.getElementById('adminPickSearch')?.value || '').trim().toLowerCase();
  const select = document.getElementById('adminPick');
  if (!select) return;
  const rows = catalog(kind.id).filter((row) => !query || row.label.toLowerCase().includes(query));
  select.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Ничего не нашлось';
    select.appendChild(empty);
    return;
  }
  rows.slice(0, 250).forEach((row) => {
    const option = document.createElement('option');
    option.value = row.id;
    option.textContent = row.label;
    option.dataset.flag = row.flag ? '1' : '';
    select.appendChild(option);
  });
  if (select.options.length) select.selectedIndex = 0;
  const amountRow = document.getElementById('adminAmountRow');
  const selected = select.selectedOptions[0];
  const flag = selected?.dataset.flag === '1';
  if (amountRow) amountRow.classList.toggle('hidden', !kind.needsAmount || flag);
  const amount = document.getElementById('adminAmount');
  if (amount) amount.placeholder = kind.amountHint || 'сколько';
  document.getElementById('adminEquipRow')?.classList.toggle('hidden', !kind.equip);
}

function buildCurrencyFields() {
  const box = document.getElementById('adminCurrencyFields');
  if (!box || box.childElementCount) return;
  CURRENCIES.forEach(([key, label]) => {
    const wrap = document.createElement('label');
    wrap.className = 'block';
    wrap.append(document.createTextNode(label));
    const input = document.createElement('input');
    input.id = `adminCur_${key}`;
    input.className = 'mt-1 w-full bg-stone-950 border border-stone-700 rounded-xl px-2 py-1.5';
    input.placeholder = key === 'form' ? 'номер 1–100000' : '10M';
    input.autocomplete = 'off';
    const preview = document.createElement('div');
    preview.className = 'text-amber-200 min-h-[1rem]';
    input.addEventListener('input', () => paintAmountPreview(input, preview));
    wrap.append(input, preview);
    box.appendChild(wrap);
  });
}

function currencyGrant() {
  const grant = {};
  CURRENCIES.forEach(([key]) => {
    const raw = document.getElementById(`adminCur_${key}`)?.value;
    if (String(raw || '').trim() === '') return;
    const n = parseShorthand(raw);
    if (n !== null) grant[key] = n;
  });
  return grant;
}

function itemGrant() {
  const kind = currentKind();
  const pick = document.getElementById('adminPick');
  const id = pick?.value;
  if (!id) return { error: 'Выберите предмет из списка.' };
  const selected = pick.selectedOptions[0];
  const label = selected?.textContent || id;
  const equip = !!document.getElementById('adminEquip')?.checked;
  const flag = selected?.dataset.flag === '1';
  if (kind.id === 'hat') return { grant: { itemId: id, equipHat: equip }, label };
  if (kind.id === 'perk') return { grant: { itemId: id }, label };
  if (kind.id === 'knife') return { grant: { knifeId: id, equipKnife: equip }, label };
  if (flag) return { grant: { relicKey: id, relicOn: true }, label };
  const amount = parseShorthand(document.getElementById('adminAmount')?.value);
  if (amount === null) return { error: 'Напишите количество: 10 или 10M.' };
  if (kind.id === 'talent') return { grant: { talentId: id, talentLevel: amount }, label };
  if (kind.id === 'factory') return { grant: { factoryId: id, factoryCount: amount }, label };
  if (kind.id === 'boutique') return { grant: { boutiqueId: id, boutiqueLevel: amount }, label };
  return { grant: { relicKey: id, relicLevel: amount }, label };
}

async function sendGrant(grant, label) {
  const target = textOrEmpty('adminTarget');
  if (!target) {
    setAdminStatus('Сначала выберите игрока.', false);
    return;
  }
  const result = await adminRequest('admin_grant', {
    method: 'POST',
    body: { targetPlayerId: target, grant }
  });
  if (result.success) {
    applyLocalGrant(result.saveData);
    setAdminStatus(`Выдано ${result.username}: ${label}.`, true);
    loadAudit();
  } else {
    setAdminStatus(result.error || 'Выдача не прошла', false);
  }
}

export async function refreshAdminAccess() {
  const session = await fetchAdminSession();
  adminRole = session?.role || null;
  adminPlayerId = session?.playerId || '';
  const ownId = document.getElementById('adminOwnId');
  if (ownId) ownId.textContent = adminPlayerId || 'войдите заново';
  paintRole();
  if (adminRole === 'creator') loadAdminList();
  if (adminRole) loadAudit();
}

function applyLocalGrant(saveData) {
  if (!saveData) return;
  applySaveDataSafely(saveData);
  saveLocal();
  updateHUD();
  renderFactories();
  renderTalents();
  renderShop();
  renderCharacterInventory();
}

async function loadAdminList() {
  const data = await adminRequest('admin_list');
  const box = document.getElementById('adminList');
  if (!box) return;
  box.replaceChildren();
  const admins = data.admins || [];
  if (!admins.length) {
    const empty = document.createElement('div');
    empty.className = 'text-stone-500';
    empty.textContent = 'Админов пока нет. Вставьте Cloud ID существующего аккаунта.';
    box.appendChild(empty);
    return;
  }
  admins.forEach((row) => {
    const line = document.createElement('div');
    line.className = 'flex items-center justify-between gap-2 py-1';
    const name = document.createElement('span');
    name.className = 'text-amber-100';
    const level = Number(row.level) === 1 ? 1 : 2;
    name.textContent = `ур.${level} · ${row.username}${row.playerId ? ` · ${row.playerId}` : ''}`;
    line.append(name);
    if (level === 2) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'text-[10px] px-2 py-1 rounded-lg bg-stone-800 border border-stone-600 text-stone-300';
      btn.textContent = 'Снять';
      btn.addEventListener('click', async () => {
        const result = await adminRequest('admin_remove', { method: 'POST', body: { playerId: row.playerId || row.username } });
        setAdminStatus(result.success ? `${row.username} больше не админ.` : (result.error || 'Не снялось'), !!result.success);
        if (result.success) loadAdminList();
      });
      line.append(btn);
    }
    box.appendChild(line);
  });
}

async function loadAudit() {
  const data = await adminRequest('admin_audit');
  const box = document.getElementById('adminAudit');
  if (!box) return;
  const rows = data.audit || [];
  box.replaceChildren();
  if (!rows.length) {
    box.textContent = 'Журнал пуст.';
    return;
  }
  rows.forEach((row) => {
    const line = document.createElement('div');
    line.className = 'truncate';
    line.textContent = `${row.createdAt || ''} · ${row.actor} → ${row.target} · ${row.action}`;
    box.appendChild(line);
  });
}

export function initAdminPanel() {
  buildCurrencyFields();
  fillKindSelect();
  fillPickList();

  document.getElementById('btnAdminPanel')?.addEventListener('click', () => {
    document.getElementById('adminModal')?.classList.remove('hidden');
    const self = adminPlayerId || getStoredAccount()?.playerId || '';
    const target = document.getElementById('adminTarget');
    if (target && !target.value) target.value = self;
    if (adminRole === 'creator') loadAdminList();
    loadAudit();
  });
  document.getElementById('btnAdminClose')?.addEventListener('click', () => {
    document.getElementById('adminModal')?.classList.add('hidden');
  });
  document.getElementById('btnAdminSelf')?.addEventListener('click', () => {
    const target = document.getElementById('adminTarget');
    const self = adminPlayerId || getStoredAccount()?.playerId || '';
    if (target) target.value = self;
  });
  document.getElementById('adminTabCurrency')?.addEventListener('click', () => showPane('currency'));
  document.getElementById('adminTabItem')?.addEventListener('click', () => showPane('item'));
  document.getElementById('adminKind')?.addEventListener('change', () => {
    const search = document.getElementById('adminPickSearch');
    if (search) search.value = '';
    fillPickList();
  });
  document.getElementById('adminPickSearch')?.addEventListener('input', fillPickList);
  document.getElementById('adminPick')?.addEventListener('change', () => {
    const kind = currentKind();
    const selected = document.getElementById('adminPick')?.selectedOptions[0];
    const flag = selected?.dataset.flag === '1';
    document.getElementById('adminAmountRow')?.classList.toggle('hidden', !kind.needsAmount || flag);
  });
  document.getElementById('adminAmount')?.addEventListener('input', (event) => {
    paintAmountPreview(event.target, document.getElementById('adminAmountPreview'));
  });

  document.getElementById('btnAdminGiveCurrency')?.addEventListener('click', async () => {
    const grant = currencyGrant();
    const keys = Object.keys(grant);
    if (!keys.length) {
      setAdminStatus('Заполните хотя бы одну валюту.', false);
      return;
    }
    const broken = CURRENCIES.some(([key]) => {
      const raw = String(document.getElementById(`adminCur_${key}`)?.value || '').trim();
      return raw && parseShorthand(raw) === null;
    });
    if (broken) {
      setAdminStatus('Есть сумма, которую не разобрать. Пример: 10M или 1e12.', false);
      return;
    }
    const label = keys.map((key) => {
      const title = CURRENCIES.find((row) => row[0] === key)?.[1] || key;
      return `${title} +${formatNumber(grant[key])}`;
    }).join(', ');
    await sendGrant(grant, label);
  });

  document.getElementById('btnAdminGiveItem')?.addEventListener('click', async () => {
    const built = itemGrant();
    if (built.error) {
      setAdminStatus(built.error, false);
      return;
    }
    await sendGrant(built.grant, built.label);
  });

  document.getElementById('btnAdminAdd')?.addEventListener('click', async () => {
    const playerId = textOrEmpty('adminNewName');
    const result = await adminRequest('admin_add', { method: 'POST', body: { playerId } });
    setAdminStatus(result.success ? `${result.username} теперь админ.` : (result.error || 'Не добавилось'), !!result.success);
    if (result.success) {
      const input = document.getElementById('adminNewName');
      if (input) input.value = '';
      loadAdminList();
      loadAudit();
    }
  });

  document.getElementById('btnAdminSetVip')?.addEventListener('click', async () => {
    const target = textOrEmpty('adminTarget');
    if (!target) {
      setAdminStatus('Сначала выберите игрока сверху.', false);
      return;
    }
    const level = Math.max(0, Math.min(5, Math.floor(Number(document.getElementById('adminVipLevel')?.value) || 0)));
    const result = await adminRequest('admin_set_vip', { method: 'POST', body: { targetPlayerId: target, level } });
    if (!result.success) {
      setAdminStatus(result.error || 'VIP не выдался', false);
      return;
    }
    if (result.playerId && result.playerId === (adminPlayerId || getStoredAccount()?.playerId)) {
      setConfirmedVip(result.vipLevel);
      updateHUD();
    }
    const label = level > 0 ? `VIP ${level}` : 'без VIP';
    setAdminStatus(`${result.username}: ${label}.`, true);
    loadAudit();
  });

  document.getElementById('btnWipePlayer')?.addEventListener('click', async () => {
    const playerId = textOrEmpty('adminTarget');
    if (!playerId) {
      setAdminStatus('Сначала выберите игрока сверху.', false);
      return;
    }
    if (!window.confirm('Сбросить прогресс этого игрока? Аккаунт останется.')) return;
    const result = await wipeCloudPlayer(playerId);
    if (!result.success) {
      setAdminStatus(result.error || 'Не сбросилось', false);
      return;
    }
    if (playerId === (adminPlayerId || getStoredAccount()?.playerId) || result.wiped === (adminPlayerId || getStoredAccount()?.playerId)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      location.reload();
      return;
    }
    setAdminStatus('Прогресс игрока сброшен. При входе он начнёт заново.', true);
    loadAudit();
  });

  document.getElementById('btnWipeAll')?.addEventListener('click', async () => {
    const word = String(document.getElementById('adminWipeWord')?.value || '').trim().toUpperCase();
    if (word !== 'ВАЙП') {
      setAdminStatus('Чтобы сбросить всех, впишите ВАЙП.', false);
      return;
    }
    if (!window.confirm('Сбросить прогресс всех игроков? Аккаунты останутся.')) return;
    const result = await wipeAllCloudSaves();
    if (!result.success) {
      setAdminStatus(result.error || 'Не сбросилось', false);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    const account = getStoredAccount();
    if (account?.sessionToken) {
      delete account.sessionToken;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account));
    }
    location.reload();
  });

  document.getElementById('adminTarget')?.addEventListener('input', async (event) => {
    const q = event.target.value.trim();
    const list = document.getElementById('adminSuggest');
    if (!list) return;
    if (q.length < 2) {
      list.replaceChildren();
      return;
    }
    const data = await adminRequest('admin_find', { query: `&q=${encodeURIComponent(q)}` });
    list.replaceChildren();
    (data.users || []).forEach((entry) => {
      const playerId = typeof entry === 'string' ? entry : entry.playerId;
      const username = typeof entry === 'string' ? entry : entry.username;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'block w-full text-left px-2 py-1 hover:bg-stone-800 rounded-lg';
      btn.textContent = `${username} · ${playerId}`;
      btn.addEventListener('click', () => {
        event.target.value = playerId;
        list.replaceChildren();
      });
      list.appendChild(btn);
    });
  });
}
