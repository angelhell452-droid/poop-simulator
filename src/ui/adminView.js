import { applySaveDataSafely, saveLocal } from '../save/saveManager.js';
import { adminRequest, fetchAdminSession, getStoredAccount } from '../save/cloudSync.js';
import { updateHUD } from './hudView.js';
import { renderFactories } from './factoryView.js';
import { renderTalents } from './talentView.js';
import { renderShop } from './shopView.js';
import { renderCharacterInventory } from './characterInventoryView.js';

let adminRole = null;
let adminPlayerId = '';

function numOrEmpty(id) {
  const raw = document.getElementById(id)?.value;
  if (raw === undefined || String(raw).trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function textOrEmpty(id) {
  const raw = document.getElementById(id)?.value;
  const text = String(raw || '').trim();
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
  const roleLabel = document.getElementById('adminRoleLabel');
  if (roleLabel) roleLabel.textContent = adminRole === 'creator' ? 'Создатель' : 'Админ';
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

  document.getElementById('adminGrantForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const grant = {
      biomass: numOrEmpty('adminBiomass'),
      sparkles: numOrEmpty('adminSparkles'),
      rolls: numOrEmpty('adminRolls'),
      plungers: numOrEmpty('adminPlungers'),
      form: numOrEmpty('adminForm'),
      flushes: numOrEmpty('adminFlushes'),
      transcends: numOrEmpty('adminTranscends'),
      factoryId: textOrEmpty('adminFactoryId'),
      factoryCount: numOrEmpty('adminFactoryCount'),
      talentId: textOrEmpty('adminTalentId'),
      talentLevel: numOrEmpty('adminTalentLevel'),
      knifeId: textOrEmpty('adminKnifeId'),
      equipKnife: document.getElementById('adminEquipKnife')?.checked,
      itemId: textOrEmpty('adminItemId'),
      equipHat: document.getElementById('adminEquipHat')?.checked,
      boutiqueId: textOrEmpty('adminBoutiqueId'),
      boutiqueLevel: numOrEmpty('adminBoutiqueLevel'),
      relicKey: textOrEmpty('adminRelicKey'),
      relicLevel: numOrEmpty('adminRelicLevel'),
      relicOn: document.getElementById('adminRelicOn')?.checked
    };
    const result = await adminRequest('admin_grant', {
      method: 'POST',
      body: { targetPlayerId: textOrEmpty('adminTarget'), grant }
    });
    if (result.success) {
      applyLocalGrant(result.saveData);
      const bits = (result.notes || []).join(', ');
      setAdminStatus(`Выдано ${result.username}: ${bits}.`, true);
      loadAudit();
    } else {
      setAdminStatus(result.error || 'Выдача не прошла', false);
    }
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

  document.getElementById('adminTarget')?.addEventListener('input', async (event) => {
    const q = event.target.value.trim();
    const list = document.getElementById('adminSuggest');
    if (!list) return;
    if (q.length < 2) {
      list.innerHTML = '';
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
