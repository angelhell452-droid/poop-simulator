import { GAME } from '../core/state.js?v=5.4.11';
import { formatNumber } from '../utils/numberFormatter.js?v=5.4.11';
import { t, onLocaleChange } from '../i18n/t.js';
import { events } from '../core/events.js';

export function renderProfileStats() {
  const count = Number(GAME.stats?.totalMeteorsCaught) || 0;
  const formattedCount = formatNumber(count);

  const valEl = document.getElementById('profileTotalMeteorsVal');
  if (valEl) {
    valEl.textContent = formattedCount;
  }

  const labelEl = document.getElementById('profileTotalMeteorsLabel');
  if (labelEl) {
    labelEl.textContent = t('profile.totalMeteorsCaughtLabel');
  }

  const titleEl = document.getElementById('profileStatsTitle');
  if (titleEl) {
    titleEl.textContent = t('profile.statsTitle');
  }

  const fullRowEl = document.getElementById('profileTotalMeteorsRow');
  if (fullRowEl) {
    fullRowEl.setAttribute('title', t('profile.totalMeteorsCaught', { count: formattedCount }));
  }

  const vipMeteorsVal = document.getElementById('vipTotalMeteorsVal');
  if (vipMeteorsVal) {
    vipMeteorsVal.textContent = formattedCount;
  }
}

export function initProfileView() {
  renderProfileStats();
  onLocaleChange(() => renderProfileStats());
  events.on('save:loaded', () => renderProfileStats());
  events.on('stats:meteorCaught', () => renderProfileStats());
}
