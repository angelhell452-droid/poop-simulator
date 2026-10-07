import { GAME } from '../core/state.js?v=5.0.75';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.75';
import { getStoredAccount, socialRequest } from '../save/cloudSync.js?v=5.0.75';
import { saveLocal } from '../save/saveManager.js?v=5.0.75';
import { updateHUD } from './hudView.js?v=5.0.75';
import { registerSocialPulse } from './socialPulse.js?v=5.0.75';

let lettersCache = [];
let mailBusy = false;

function esc(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toast(text) {
  const node = document.createElement('div');
  node.className = 'garden-toast';
  node.textContent = text;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2800);
}

function signedIn() {
  return !!getStoredAccount()?.username;
}

export function mailOpen() {
  const modal = document.getElementById('mailModal');
  return !!(modal && !modal.classList.contains('hidden'));
}

export function setMailBadge(count) {
  const badge = document.getElementById('mailRewardBadge');
  if (!badge) return;
  const n = Math.max(0, Number(count) || 0);
  badge.textContent = formatNumber(n);
  badge.classList.toggle('hidden', n <= 0);
}

function render(letters) {
  const box = document.getElementById('mailBody');
  if (!box) return;
  if (!signedIn()) {
    setMailBadge(0);
    box.innerHTML = `<div class="garden-empty">Почта открывается с аккаунта.</div>`;
    return;
  }
  if (!letters.length) {
    box.innerHTML = `<div class="garden-empty">Пока тихо. Писем нет.</div>`;
    return;
  }
  box.innerHTML = `<div class="grid gap-2">${letters.map((letter) => `
    <div class="garden-card">
      <div class="flex items-center justify-between gap-2">
        <span>${esc(letter.title)}</span>
        ${letter.plungers > 0 && !letter.claimed
          ? `<button type="button" class="garden-pill accent jelly-btn" data-mail-id="${letter.id}">Забрать ${formatNumber(letter.plungers)}</button>`
          : ''}
      </div>
      <div class="garden-muted mt-1">${esc(letter.body)}</div>
    </div>
  `).join('')}</div>`;
}

export async function loadMail(forceRender = false) {
  if (!signedIn()) {
    lettersCache = [];
    render([]);
    return;
  }
  if (mailBusy) return;
  mailBusy = true;
  try {
    const data = await socialRequest('mail');
    if (!data.success) {
      if (mailOpen()) toast(data.error || 'Почта не открылась');
      return;
    }
    lettersCache = Array.isArray(data.letters) ? data.letters : [];
    setMailBadge(data.rewardCount);
    if (forceRender || mailOpen()) render(lettersCache);
  } finally {
    mailBusy = false;
  }
}

/** Immediate refresh after boss mail — not a background poll. */
export function pulseMail(forceRender = false) {
  return loadMail(forceRender || mailOpen());
}

async function claim(id) {
  const data = await socialRequest('mail_claim', { method: 'POST', body: { id: Number(id) } });
  if (!data.success) {
    toast(data.error || 'Награда не забрана');
    return;
  }
  if (Number.isFinite(Number(data.plungers))) {
    GAME.transcendPlungers = Number(data.plungers);
    GAME.cloudAdminSeq = Number(data.adminSeq) || GAME.cloudAdminSeq;
    saveLocal();
    updateHUD();
    toast(`+${formatNumber(data.gained || 0)} вантузов`);
  }
  await loadMail(true);
}

export function initMailView() {
  document.getElementById('btnMailModal')?.addEventListener('click', () => {
    document.getElementById('mailModal')?.classList.remove('hidden');
    loadMail(true);
  });
  document.getElementById('mailBody')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mail-id]');
    if (!button) return;
    claim(button.dataset.mailId);
  });
  registerSocialPulse({
    mailOpen,
    setMailBadge,
    refreshMail: loadMail
  });
}
