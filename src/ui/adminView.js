import { applySaveDataSafely, saveLocal } from '../save/saveManager.js?v=5.0.79';
import { AUTH_STORAGE_KEY, adminRequest, fetchAdminSession, getStoredAccount, wipeAllCloudSaves, wipeCloudPlayer } from '../save/cloudSync.js?v=5.0.79';
import { STORAGE_KEY, BACKUP_KEY } from '../save/saveManager.js?v=5.0.79';
import { updateHUD } from './hudView.js?v=5.0.79';
import { renderFactories } from './factoryView.js?v=5.0.79';
import { renderTalents } from './talentView.js?v=5.0.79';
import { renderShop } from './shopView.js';
import { renderCharacterInventory } from './characterInventoryView.js?v=5.0.79';
import { formatNumber, parseShorthand } from '../utils/numberFormatter.js?v=5.0.79';
import { SHOP_ITEMS, BOUTIQUE_REPEATABLES } from '../data/shop.data.js?v=5.0.79';
import { TALENTS } from '../data/talents.data.js';
import { FACTORIES } from '../data/factories.data.js?v=5.0.79';
import { KNIVES } from '../data/knives.data.js?v=5.0.79';
import { TRANSCEND_UPGRADES } from '../data/transcend.data.js?v=5.0.79';
import { setConfirmedVip } from '../economy/pace.js';
import { t, onLocaleChange } from '../i18n/t.js';

let adminRole = null;
let adminPlayerId = '';

const CURRENCIES = [
  ['biomass', 'admin.curr.biomass'],
  ['sparkles', 'admin.curr.sparkles'],
  ['rolls', 'admin.curr.rolls'],
  ['plungers', 'admin.curr.plungers'],
  ['form', 'admin.curr.form'],
  ['flushes', 'admin.curr.flushes'],
  ['transcends', 'admin.curr.transcends']
];

const KINDS = [
  { id: 'hat', labelKey: 'admin.kind.hat', needsAmount: false, equip: true },
  { id: 'perk', labelKey: 'admin.kind.perk', needsAmount: false, equip: false },
  { id: 'talent', labelKey: 'admin.kind.talent', needsAmount: true, equip: false, amountHintKey: 'admin.hint.level' },
  { id: 'factory', labelKey: 'admin.kind.factory', needsAmount: true, equip: false, amountHintKey: 'admin.hint.factoryCount' },
  { id: 'knife', labelKey: 'admin.kind.knife', needsAmount: false, equip: true },
  { id: 'boutique', labelKey: 'admin.kind.boutique', needsAmount: true, equip: false, amountHintKey: 'admin.hint.boutiqueLevel' },
  { id: 'relic', labelKey: 'admin.kind.relic', needsAmount: true, equip: false, amountHintKey: 'admin.hint.relicLevel' }
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

function paintCurrencyHint() {
  const el = document.getElementById('adminCurrencyHint');
  if (el) el.textContent = t('admin.currencyHint', { a: '10M', b: '1.5B', c: '1e12' });
}

function paintRole() {
  const button = document.getElementById('btnAdminPanel');
  if (button) button.classList.toggle('hidden', !adminRole);
  const creatorBox = document.getElementById('adminCreatorBox');
  if (creatorBox) creatorBox.classList.toggle('hidden', adminRole !== 'creator');
  const vipBox = document.getElementById('adminVipBox');
  if (vipBox) vipBox.classList.toggle('hidden', adminRole !== 'creator' && adminRole !== 'admin');
  const roleLabel = document.getElementById('adminRoleLabel');
  if (roleLabel) {
    roleLabel.textContent = adminRole === 'creator' ? t('admin.role.creator') : t('admin.role.admin');
  }
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
  preview.textContent = n === null ? t('admin.preview.unparsed') : t('admin.preview.eq', { n: formatNumber(n) });
}

function fillKindSelect() {
  const select = document.getElementById('adminKind');
  if (!select) return;
  const prev = select.value;
  select.replaceChildren();
  KINDS.forEach((kind) => {
    const option = document.createElement('option');
    option.value = kind.id;
    option.textContent = t(kind.labelKey);
    select.appendChild(option);
  });
  if (prev && [...select.options].some((o) => o.value === prev)) select.value = prev;
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
    empty.textContent = t('admin.pickEmpty');
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
  if (amount) amount.placeholder = kind.amountHintKey ? t(kind.amountHintKey) : t('admin.ph.amountShort');
  document.getElementById('adminEquipRow')?.classList.toggle('hidden', !kind.equip);
}

function buildCurrencyFields() {
  const box = document.getElementById('adminCurrencyFields');
  if (!box || box.childElementCount) return;
  CURRENCIES.forEach(([key, labelKey]) => {
    const wrap = document.createElement('label');
    wrap.className = 'block';
    wrap.dataset.adminCurLabel = labelKey;
    wrap.append(document.createTextNode(t(labelKey)));
    const input = document.createElement('input');
    input.id = `adminCur_${key}`;
    input.className = 'mt-1 w-full bg-stone-950 border border-stone-700 rounded-xl px-2 py-1.5';
    input.placeholder = key === 'form' ? t('admin.ph.form') : t('admin.ph.amount');
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
  if (!id) return { error: t('admin.selectItem') };
  const selected = pick.selectedOptions[0];
  const label = selected?.textContent || id;
  const equip = !!document.getElementById('adminEquip')?.checked;
  const flag = selected?.dataset.flag === '1';
  if (kind.id === 'hat') return { grant: { itemId: id, equipHat: equip }, label };
  if (kind.id === 'perk') return { grant: { itemId: id }, label };
  if (kind.id === 'knife') return { grant: { knifeId: id, equipKnife: equip }, label };
  if (flag) return { grant: { relicKey: id, relicOn: true }, label };
  const amount = parseShorthand(document.getElementById('adminAmount')?.value);
  if (amount === null) return { error: t('admin.amountInvalid') };
  if (kind.id === 'talent') return { grant: { talentId: id, talentLevel: amount }, label };
  if (kind.id === 'factory') return { grant: { factoryId: id, factoryCount: amount }, label };
  if (kind.id === 'boutique') return { grant: { boutiqueId: id, boutiqueLevel: amount }, label };
  return { grant: { relicKey: id, relicLevel: amount }, label };
}

async function sendGrant(grant, label) {
  const target = textOrEmpty('adminTarget');
  if (!target) {
    setAdminStatus(t('admin.pickPlayerFirst'), false);
    return;
  }
  const result = await adminRequest('admin_grant', {
    method: 'POST',
    body: { targetPlayerId: target, grant }
  });
  if (result.success) {
    applyLocalGrant(result.saveData);
    setAdminStatus(t('admin.granted', { user: result.username, label }), true);
    loadAudit();
  } else {
    setAdminStatus(result.error || t('admin.grantFailed'), false);
  }
}

export async function refreshAdminAccess() {
  const session = await fetchAdminSession();
  adminRole = session?.role || null;
  adminPlayerId = session?.playerId || '';
  const ownId = document.getElementById('adminOwnId');
  if (ownId) ownId.textContent = adminPlayerId || t('admin.relogin');
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
    empty.textContent = t('admin.adminsEmpty');
    box.appendChild(empty);
    return;
  }
  admins.forEach((row) => {
    const line = document.createElement('div');
    line.className = 'flex items-center justify-between gap-2 py-1';
    const name = document.createElement('span');
    name.className = 'text-amber-100';
    const level = Number(row.level) === 1 ? 1 : 2;
    name.textContent = t('admin.levelLine', {
      level,
      name: row.username,
      id: row.playerId ? ` · ${row.playerId}` : ''
    });
    line.append(name);
    if (level === 2) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'text-[10px] px-2 py-1 rounded-lg bg-stone-800 border border-stone-600 text-stone-300';
      btn.textContent = t('admin.removeBtn');
      btn.addEventListener('click', async () => {
        const result = await adminRequest('admin_remove', { method: 'POST', body: { playerId: row.playerId || row.username } });
        setAdminStatus(
          result.success ? t('admin.removedOk', { user: row.username }) : (result.error || t('admin.removedFail')),
          !!result.success
        );
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
    box.textContent = t('admin.auditEmpty');
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
  paintCurrencyHint();
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
      setAdminStatus(t('admin.fillCurrency'), false);
      return;
    }
    const broken = CURRENCIES.some(([key]) => {
      const raw = String(document.getElementById(`adminCur_${key}`)?.value || '').trim();
      return raw && parseShorthand(raw) === null;
    });
    if (broken) {
      setAdminStatus(t('admin.parseError'), false);
      return;
    }
    const label = keys.map((key) => {
      const labelKey = CURRENCIES.find((row) => row[0] === key)?.[1];
      const title = labelKey ? t(labelKey) : key;
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
    setAdminStatus(
      result.success ? t('admin.addOk', { user: result.username }) : (result.error || t('admin.addFail')),
      !!result.success
    );
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
      setAdminStatus(t('admin.pickPlayerTop'), false);
      return;
    }
    const level = Math.max(0, Math.min(5, Math.floor(Number(document.getElementById('adminVipLevel')?.value) || 0)));
    const result = await adminRequest('admin_set_vip', { method: 'POST', body: { targetPlayerId: target, level } });
    if (!result.success) {
      setAdminStatus(result.error || t('admin.vipFail'), false);
      return;
    }
    if (result.playerId && result.playerId === (adminPlayerId || getStoredAccount()?.playerId)) {
      setConfirmedVip(result.vipLevel);
      updateHUD();
    }
    const label = level > 0 ? `VIP ${formatNumber(level)}` : t('admin.vip.none');
    setAdminStatus(t('admin.vipSet', { user: result.username, label }), true);
    loadAudit();
  });

  document.getElementById('btnWipePlayer')?.addEventListener('click', async () => {
    const playerId = textOrEmpty('adminTarget');
    if (!playerId) {
      setAdminStatus(t('admin.pickPlayerTop'), false);
      return;
    }
    if (!window.confirm(t('admin.wipePlayerConfirm'))) return;
    const result = await wipeCloudPlayer(playerId);
    if (!result.success) {
      setAdminStatus(result.error || t('admin.wipeFail'), false);
      return;
    }
    if (playerId === (adminPlayerId || getStoredAccount()?.playerId) || result.wiped === (adminPlayerId || getStoredAccount()?.playerId)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      location.reload();
      return;
    }
    setAdminStatus(t('admin.wipePlayerOk'), true);
    loadAudit();
  });

  document.getElementById('btnWipeAll')?.addEventListener('click', async () => {
    const word = String(document.getElementById('adminWipeWord')?.value || '').trim().toUpperCase();
    if (word !== t('admin.wipeWordToken').toUpperCase()) {
      setAdminStatus(t('admin.wipeWordRequired'), false);
      return;
    }
    if (!window.confirm(t('admin.wipeAllConfirm'))) return;
    const result = await wipeAllCloudSaves();
    if (!result.success) {
      setAdminStatus(result.error || t('admin.wipeFail'), false);
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

  onLocaleChange(() => {
    paintCurrencyHint();
    paintRole();
    fillKindSelect();
    fillPickList();
    document.querySelectorAll('#adminCurrencyFields label[data-admin-cur-label]').forEach((wrap) => {
      const key = wrap.dataset.adminCurLabel;
      if (wrap.firstChild?.nodeType === Node.TEXT_NODE && key) wrap.firstChild.textContent = t(key);
      const keyId = wrap.querySelector('input')?.id?.replace('adminCur_', '');
      const input = wrap.querySelector('input');
      if (input && keyId) input.placeholder = keyId === 'form' ? t('admin.ph.form') : t('admin.ph.amount');
    });
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
