import { getConfirmedVip } from '../economy/pace.js';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.78';
import { t, onLocaleChange } from '../i18n/t.js';

const VIP_OFFERS = [
  { level: 1, mult: 2 },
  { level: 2, mult: 2.5 },
  { level: 3, mult: 3 },
  { level: 4, mult: 4 },
  { level: 5, mult: 5 }
];

function renderVipShop() {
  const list = document.getElementById('vipShopList');
  if (!list) return;
  const current = getConfirmedVip();
  list.innerHTML = VIP_OFFERS.map((offer) => {
    const owned = current === offer.level;
    return `
      <div class="vip-offer${owned ? ' is-current' : ''}">
        <div class="vip-offer-crown" aria-hidden="true">👑</div>
        <div>
          <div class="vip-offer-name">VIP ${formatNumber(offer.level)}</div>
          <div class="vip-offer-mult">${t('vip.income')} x${formatNumber(offer.mult)}</div>
        </div>
        <button type="button" class="vip-offer-buy" disabled>${owned ? t('vip.yours') : t('vip.soon')}</button>
      </div>
    `;
  }).join('');
}

export function initVipShop() {
  const modal = document.getElementById('vipShopModal');
  document.getElementById('btnVipShop')?.addEventListener('click', () => {
    renderVipShop();
    modal?.classList.remove('hidden');
  });
  onLocaleChange(() => {
    if (modal && !modal.classList.contains('hidden')) renderVipShop();
  });
}
