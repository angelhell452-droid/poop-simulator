import { GAME } from '../core/state.js?v=5.0.29';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.29';
import { CLOUD_SAVE_ENDPOINT, LEGACY_SAVE_ENDPOINT, getStoredAccount, syncToCloudDatabase } from '../save/cloudSync.js?v=5.0.29';
import { saveLocal } from '../save/saveManager.js?v=5.0.29';
import { updateHUD } from './hudView.js?v=5.0.29';

let cachedLeaderboard = null;
let cachedYou = null;
let cachedTotal = 0;
let boardOffline = false;
let lastFetchTime = 0;

export async function fetchLeaderboardFromDb(force = false) {
  const now = Date.now();
  if (!force && cachedLeaderboard && (now - lastFetchTime < 15000)) {
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

  if (!leaderboard || leaderboard.length === 0) {
    const note = boardOffline
      ? 'Нет связи с сервером. Рейтинг один на всех и появится, когда база ответит.'
      : (!getStoredAccount()?.username
        ? 'Зал славы только для аккаунтов. Гости в топ не попадают.'
        : 'В Зале Славы пока нет записей. Сыграй и сохранись в облако.');
    containerEl.innerHTML = `<div class="text-stone-400 text-center py-4 text-xs font-game">${note}</div>`;
    return;
  }

  const currentPlayerId = GAME.playerId || '';

  containerEl.innerHTML = leaderboard.map((player) => {
    const rank = Number(player.rank) || 0;
    const isCurrent = currentPlayerId && player.playerId === currentPlayerId;

    let rankBadge = `#${formatNumber(rank)}`;
    let rankClass = 'text-stone-400 font-bold';
    let cardBorder = isCurrent ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/70 via-stone-900 to-stone-950 shadow-md' : 'border-stone-800 bg-stone-950/90';

    if (rank === 1) {
      rankBadge = '🥇';
      rankClass = 'text-2xl filter drop-shadow';
      if (!isCurrent) cardBorder = 'border-yellow-500/50 bg-stone-900/90';
    } else if (rank === 2) {
      rankBadge = '🥈';
      rankClass = 'text-xl filter drop-shadow';
      if (!isCurrent) cardBorder = 'border-slate-400/40 bg-stone-900/90';
    } else if (rank === 3) {
      rankBadge = '🥉';
      rankClass = 'text-xl filter drop-shadow';
      if (!isCurrent) cardBorder = 'border-amber-700/50 bg-stone-900/90';
    }

    const safeName = String(player.playerName || 'Анонимный Какашич')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const formattedScore = formatNumber(player.score || 0);
    const formattedBio = formatNumber(player.biomass || 0);

    return `
      <div class="flex items-center justify-between p-2.5 rounded-2xl border ${cardBorder} transition hover:border-amber-500/50">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="font-game shrink-0 ${rankClass} min-w-[28px] text-center">${rankBadge}</span>
          <div class="truncate">
            <div class="flex items-center gap-1.5 truncate">
              <span class="font-bold text-xs ${isCurrent ? 'text-yellow-300' : 'text-stone-200'} truncate">${safeName}</span>
              ${player.vipLevel > 0 ? `<span class="vip-badge shrink-0">VIP ${formatNumber(player.vipLevel)}</span>` : ''}
              ${isCurrent ? '<span class="text-[9px] bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 px-1.5 py-0.2 rounded font-black uppercase tracking-wider shrink-0 shadow">ВЫ</span>' : ''}
            </div>
            <div class="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
              <span>🧬 Форма #${formatNumber(player.stage || 1)}</span>
              <span class="text-stone-600">•</span>
              <span class="text-purple-300 font-mono">🧻 ${formatNumber(player.prestiges || 0)} см</span>
              ${player.transcends ? `<span class="text-stone-600">•</span><span class="text-cyan-300 font-mono">🌌 ${formatNumber(player.transcends)} пр</span>` : ''}
            </div>
          </div>
        </div>
        <div class="text-right shrink-0 ml-2">
          <div class="text-yellow-400 font-game font-bold text-xs flex items-center justify-end gap-1">
            <span>🏆</span> <span>${formattedScore}</span>
          </div>
          <div class="text-[9px] text-stone-500 font-mono">+${formattedBio} 💨</div>
        </div>
      </div>
    `;
  }).join('') + (cachedYou && Number(cachedYou.rank) > leaderboard.length ? `
      <div class="text-center text-[10px] text-amber-200/80 py-2 font-game">
        Ваше место на сервере: #${formatNumber(cachedYou.rank)} из ${formatNumber(cachedTotal)} · очки ${formatNumber(cachedYou.score || 0)}
      </div>` : '');
}

function updateDailyRewardCard(leaderboard) {
  const card = document.getElementById('leaderboardDailyRewardCard');
  if (!card) return;

  const btnClaim = document.getElementById('btnClaimDailyTop10');
  const infoEl = document.getElementById('leaderboardDailyRewardInfo');
  const badgeEl = document.getElementById('playerRankBadge');

  const playerRank = boardOffline ? 0 : Number(cachedYou?.rank || 0);
  const localGuest = !getStoredAccount()?.username;
  const viewerIsUnlistedGuest = !boardOffline && !playerRank && (cachedYou?.guest || localGuest);
  if (badgeEl) {
    if (boardOffline) badgeEl.textContent = 'НЕТ СВЯЗИ';
    else if (viewerIsUnlistedGuest) badgeEl.textContent = 'ГОСТЬ';
    else if (playerRank > 0) badgeEl.textContent = `#${formatNumber(playerRank)} В РЕЙТИНГЕ`;
    else badgeEl.textContent = 'ЕЩЁ НЕ В БАЗЕ';
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
    if (infoEl) infoEl.textContent = `⏳ Награда получена! Следующая будет доступна через ${hours}ч ${mins}м.`;
    if (btnClaim) {
      btnClaim.disabled = true;
      btnClaim.textContent = `⏳ Через ${hours}ч ${mins}м`;
      btnClaim.className = 'w-full sm:w-auto shrink-0 bg-stone-800 text-stone-500 font-game font-bold text-xs px-3.5 py-2 rounded-xl cursor-not-allowed';
    }
  } else if (playerRank <= 10 && rewardAmount > 0) {
    if (infoEl) infoEl.innerHTML = `<span class="text-emerald-300 font-bold">🎉 Вы в Топ-${playerRank}!</span> Ваша награда: <strong class="text-yellow-300">+${formatNumber(rewardAmount)} ✨ Блестяшек</strong>`;
    if (btnClaim) {
      btnClaim.disabled = false;
      btnClaim.innerHTML = `🎁 Забрать +${formatNumber(rewardAmount)} ✨`;
      btnClaim.className = 'w-full sm:w-auto shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-stone-950 font-game font-bold text-xs px-3.5 py-2 rounded-xl transition shadow jelly-btn';
      btnClaim.onclick = () => {
        GAME.sparkles = (Number(GAME.sparkles) || 0) + rewardAmount;
        GAME.lastDailyTop10Claim = Date.now();
        saveLocal();
        updateHUD();
        updateDailyRewardCard(cachedLeaderboard);

        // Flash message
        const notif = document.createElement('div');
        notif.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-emerald-500 to-yellow-500 text-stone-950 font-game font-bold text-xs px-4 py-2 rounded-2xl shadow-2xl border-2 border-yellow-200 animate-bounce flex items-center gap-2';
        notif.innerHTML = `<span>👑 Получена ежедневная награда Топ-${playerRank}: +${formatNumber(rewardAmount)} ✨ Блестяшек!</span>`;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3500);
      };
    }
  } else {
    if (infoEl) {
      infoEl.textContent = boardOffline
        ? 'Награда считается только по месту с сервера. Сейчас базы нет, забрать нельзя.'
        : (viewerIsUnlistedGuest
          ? 'Зал славы только для аккаунтов. Гости в топ не попадают.'
          : (playerRank > 0
          ? `Вы на #${formatNumber(playerRank)} месте. Поднимитесь в Топ-10 по Очкам Славы, чтобы получать до ${formatNumber(50000)} ✨ в день!`
          : `Сначала появись в облачном сохранении. Топ-10 получает до ${formatNumber(50000)} ✨ в день.`));
    }
    if (btnClaim) {
      btnClaim.disabled = true;
      btnClaim.textContent = '🔒 Нужен Топ-10';
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
      <span class="text-xs font-game">Расчет Очков Славы и связь с БД...</span>
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
}
