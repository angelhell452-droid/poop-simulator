import { GAME } from '../core/state.js?v=5.4.10';
import { formatNumber } from '../utils/numberFormatter.js?v=5.4.10';
import { CLOUD_SAVE_ENDPOINT, LEGACY_SAVE_ENDPOINT, getStoredAccount, syncToCloudDatabase } from '../save/cloudSync.js?v=5.4.10';
import { formatTaggedName } from '../guild/guildPresence.js?v=5.4.10';
import { saveLocal } from '../save/saveManager.js?v=5.4.10';
import { updateHUD } from './hudView.js?v=5.4.10';
import { t, onLocaleChange } from '../i18n/t.js';
import { gainBio } from '../utils/big.js?v=5.4.10';

let cachedLeaderboard = null;
let cachedYou = null;
let cachedTotal = 0;
let boardOffline = false;
let lastFetchTime = 0;

export async function fetchLeaderboardFromDb(force = false) {
  const now = Date.now();
  if (!force && cachedLeaderboard && (now - lastFetchTime < 4000)) {
    return cachedLeaderboard;
  }

  try {
    await syncToCloudDatabase();
  } catch (err) {
    /* board still reads the last server snapshot */
  }

  try {
    const viewer = encodeURIComponent(GAME.playerId || '');
    let res = await fetch(`${CLOUD_SAVE_ENDPOINT}?action=leaderboard&playerId=${viewer}`);
    if (!res.ok && res.status === 404) {
      res = await fetch(`${LEGACY_SAVE_ENDPOINT}?action=leaderboard&playerId=${viewer}`);
    }
    if (!res.ok) throw new Error('leaderboard_http');
    const json = await res.json();
    cachedLeaderboard = Array.isArray(json.leaderboard) ? json.leaderboard : [];
    cachedYou = json.you || null;
    cachedTotal = Number(json.total) || cachedLeaderboard.length;
    boardOffline = false;
    lastFetchTime = now;
    return cachedLeaderboard;
  } catch (err) {
    boardOffline = true;
    cachedLeaderboard = cachedLeaderboard || [];
    cachedYou = null;
    lastFetchTime = now;
    return cachedLeaderboard;
  }
}

export function renderLeaderboardRows(containerEl, leaderboard) {
  if (!containerEl) return;

  if (!leaderboard || !Array.isArray(leaderboard) || leaderboard.length === 0) {
    containerEl.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-dashed border-amber-500/30 bg-stone-900/50 my-3">
        <span class="text-3xl mb-2 animate-bounce">🏆</span>
        <div class="text-sm font-game font-black text-amber-300 mb-1">Стань первым в новом сезоне!</div>
        <div class="text-xs text-stone-300 font-game">Соверши Прорыв, чтобы занять Топ-1!</div>
      </div>
    `;
    return;
  }

  const currentPlayerId = GAME.playerId || '';

  containerEl.innerHTML = leaderboard.map((player) => {
    if (!player) return '';
    const rank = Number(player.rank) || 0;
    const isCurrent = currentPlayerId && player.playerId === currentPlayerId;

    let rankBadge = `#${formatNumber(rank)}`;
    let rankClass = 'text-stone-400 font-bold text-sm';
    let cardBorder = isCurrent ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/70 via-stone-900 to-stone-950 shadow-md' : 'border-stone-800 bg-stone-950/90';

    if (rank === 1) {
      rankBadge = '👑';
      rankClass = 'text-2xl filter drop-shadow';
      if (!isCurrent) cardBorder = 'border-yellow-500/60 bg-stone-900/90 shadow-[0_0_15px_rgba(234,179,8,0.15)]';
    } else if (rank === 2) {
      rankBadge = '🥈';
      rankClass = 'text-xl filter drop-shadow';
      if (!isCurrent) cardBorder = 'border-slate-400/50 bg-stone-900/90';
    } else if (rank === 3) {
      rankBadge = '🥉';
      rankClass = 'text-xl filter drop-shadow';
      if (!isCurrent) cardBorder = 'border-amber-700/60 bg-stone-900/90';
    }

    const rawName = player.playerName || player.accountName || t('lb.anon');
    const safeName = formatTaggedName(rawName, player.guildTag)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const isVip = Boolean(player.hasVipPass || player.vipPass || Number(player.vipLevel) > 0);

    const breakthroughsVal = player.breakthroughCount ?? player.transcends ?? player.score ?? 0;
    const stageVal = player.peakForm ?? player.stage ?? 1;
    const prestigesVal = player.prestiges ?? player.flushes ?? player.flushCount ?? 0;

    const breakthroughs = formatNumber(breakthroughsVal);
    const stage = formatNumber(stageVal);
    const prestiges = formatNumber(prestigesVal);
    const formattedBio = formatNumber(player.biomass || 0);

    return `
      <div class="p-2.5 rounded-2xl border ${cardBorder} transition hover:border-amber-500/50 flex flex-col gap-2">
        <!-- Top Row: Rank, Player Name, Badges, Biomass -->
        <div class="flex items-center justify-between gap-2 min-w-0">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="font-game shrink-0 ${rankClass} w-7 text-center leading-none">${rankBadge}</span>
            <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span class="font-bold text-xs sm:text-sm ${isCurrent ? 'text-yellow-300' : 'text-stone-100'} truncate max-w-[130px] sm:max-w-[190px]">${safeName}</span>
              ${isVip ? '<span class="vip-badge text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">★ VIP</span>' : ''}
              ${isCurrent ? '<span class="text-[9px] bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 shadow">' + t('lb.you') + '</span>' : ''}
            </div>
          </div>
          <div class="shrink-0 text-right">
            <div class="text-[10px] text-stone-400 font-mono">🧬 +${formattedBio}</div>
          </div>
        </div>

        <!-- Bottom Grid: Fixed 3 Columns - Breakthroughs, Form, Flushes -->
        <div class="grid grid-cols-3 gap-1.5 text-center font-game pt-1 border-t border-stone-800/80">
          <div class="bg-stone-900/80 border border-stone-800 rounded-xl px-1.5 py-1 flex flex-col items-center">
            <span class="text-[9.5px] text-stone-400 block font-normal">Прорывы</span>
            <span class="text-cyan-300 font-bold text-xs leading-tight">${breakthroughs}</span>
          </div>
          <div class="bg-stone-900/80 border border-stone-800 rounded-xl px-1.5 py-1 flex flex-col items-center">
            <span class="text-[9.5px] text-stone-400 block font-normal">Форма</span>
            <span class="text-emerald-300 font-bold text-xs leading-tight">${stage}</span>
          </div>
          <div class="bg-stone-900/80 border border-stone-800 rounded-xl px-1.5 py-1 flex flex-col items-center">
            <span class="text-[9.5px] text-stone-400 block font-normal">Смывы</span>
            <span class="text-purple-300 font-bold text-xs leading-tight">${prestiges}</span>
          </div>
        </div>
      </div>
    `;
  }).join('') + (cachedYou && Number(cachedYou.rank) > leaderboard.length ? `
      <div class="text-center text-[10px] text-amber-200/80 py-2 font-game">
        ${t('lb.yourPlace', { rank: formatNumber(cachedYou.rank), total: formatNumber(cachedTotal), score: formatNumber(cachedYou.score || 0) })}
      </div>` : '');
}

function updateDailyRewardCard(leaderboard) {
  const card = document.getElementById('leaderboardDailyRewardCard');
  if (!card) return;

  const btnClaim = document.getElementById('btnClaimDailyTop10');
  const infoEl = document.getElementById('leaderboardDailyRewardInfo');
  const badgeEl = document.getElementById('playerRankBadge');

  const playerRank = boardOffline ? 0 : Number(cachedYou?.rank || 0);
  if (badgeEl) {
    if (boardOffline) badgeEl.textContent = t('lb.badgeOffline');
    else if (playerRank > 0) badgeEl.textContent = t('lb.badgeRanked', { rank: formatNumber(playerRank) });
    else badgeEl.textContent = t('lb.badgeNotInDb');
    badgeEl.className = playerRank > 0 && playerRank <= 10
      ? 'text-[9px] bg-emerald-500 text-stone-950 px-1.5 py-0.5 rounded font-black'
      : 'text-[9px] bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded font-black';
  }

  const now = Date.now();
  const lastClaim = GAME.lastDailyTop10Claim || 0;
  const cooldownMs = 24 * 60 * 60 * 1000;
  const elapsed = now - lastClaim;
  const isCooldown = elapsed < cooldownMs;

  let rewardAmount = 0;
  if (playerRank === 1) rewardAmount = 50000;
  else if (playerRank === 2) rewardAmount = 35000;
  else if (playerRank === 3) rewardAmount = 25000;
  else if (playerRank >= 4 && playerRank <= 10) rewardAmount = 15000;

  if (isCooldown) {
    const remainingMs = cooldownMs - elapsed;
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    if (infoEl) infoEl.textContent = t('lb.claimedInfo', { h: hours, m: mins });
    if (btnClaim) {
      btnClaim.disabled = true;
      btnClaim.textContent = t('lb.claimIn', { h: hours, m: mins });
      btnClaim.className = 'w-full sm:w-auto shrink-0 bg-stone-800 text-stone-500 font-game font-bold text-xs px-3.5 py-2 rounded-xl cursor-not-allowed';
    }
  } else if (playerRank <= 10 && rewardAmount > 0) {
    if (infoEl) infoEl.innerHTML = `<span class="text-emerald-300 font-bold">${t('lb.inTop', { rank: formatNumber(playerRank) })}</span> ${t('lb.yourReward')} <strong class="text-yellow-300">+${formatNumber(rewardAmount)} ✨ ${t('lb.sparklesWord')}</strong>`;
    if (btnClaim) {
      btnClaim.disabled = false;
      btnClaim.innerHTML = t('lb.claimBtn', { n: formatNumber(rewardAmount) });
      btnClaim.className = 'w-full sm:w-auto shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-game font-bold text-xs px-3.5 py-2 rounded-xl transition shadow jelly-btn';
      btnClaim.onclick = () => {
        GAME.sparkles = gainBio(GAME.sparkles, rewardAmount);
        GAME.lastDailyTop10Claim = Date.now();
        saveLocal();
        updateHUD();
        updateDailyRewardCard(cachedLeaderboard);

        // Flash message
        const notif = document.createElement('div');
        notif.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-emerald-500 to-yellow-500 text-stone-950 font-game font-bold text-xs px-4 py-2 rounded-2xl shadow-2xl border-2 border-yellow-200 animate-bounce flex items-center gap-2';
        notif.innerHTML = `<span>${t('lb.toastClaimed', { rank: formatNumber(playerRank), n: formatNumber(rewardAmount) })}</span>`;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3500);
      };
    }
  } else {
    if (infoEl) {
      infoEl.textContent = boardOffline
        ? t('lb.rewardOffline')
        : (playerRank > 0
          ? t('lb.climb', { rank: formatNumber(playerRank), n: formatNumber(50000) })
          : t('lb.needCloud', { n: formatNumber(50000) }));
    }
    if (btnClaim) {
      btnClaim.disabled = true;
      btnClaim.textContent = t('lb.needTop10');
      btnClaim.className = 'w-full sm:w-auto shrink-0 bg-stone-800 text-stone-500 font-game font-bold text-xs px-3.5 py-2 rounded-xl cursor-not-allowed';
    }
  }
}

export async function refreshAndRenderAllLeaderboards(force = false) {
  const modalList = document.getElementById('leaderboardFullList');
  const accountList = document.getElementById('leaderboardList');

  const loadingPlaceholder = `
    <div class="flex flex-col items-center justify-center py-6 text-stone-400 gap-2">
      <span class="text-2xl animate-spin">🌀</span>
      <span class="text-xs font-game">${t('lb.loading')}</span>
    </div>
  `;

  if (modalList) modalList.innerHTML = loadingPlaceholder;
  if (accountList) accountList.innerHTML = loadingPlaceholder;

  const data = await fetchLeaderboardFromDb(force);

  if (modalList) renderLeaderboardRows(modalList, data);
  if (accountList) renderLeaderboardRows(accountList, data);
  updateDailyRewardCard(data);
}

export function initLeaderboardView() {
  const btnOpen = document.getElementById('btnLeaderboardModal');
  const modal = document.getElementById('leaderboardModal');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      modal.classList.remove('hidden');
      refreshAndRenderAllLeaderboards(false);
    });
  }

  const btnRefreshModal = document.getElementById('btnRefreshLeaderboardModal');
  if (btnRefreshModal) {
    btnRefreshModal.addEventListener('click', () => {
      refreshAndRenderAllLeaderboards(true);
    });
  }

  const btnRefreshAccount = document.getElementById('btnRefreshLeaderboard');
  if (btnRefreshAccount) {
    btnRefreshAccount.addEventListener('click', () => {
      refreshAndRenderAllLeaderboards(true);
    });
  }

  onLocaleChange(() => {
    if (!cachedLeaderboard) return;
    const modalList = document.getElementById('leaderboardFullList');
    const accountList = document.getElementById('leaderboardList');
    if (modalList) renderLeaderboardRows(modalList, cachedLeaderboard);
    if (accountList) renderLeaderboardRows(accountList, cachedLeaderboard);
    updateDailyRewardCard(cachedLeaderboard);
  });
}
