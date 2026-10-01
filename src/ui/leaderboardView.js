import { GAME } from '../core/state.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { CLOUD_SAVE_ENDPOINT, LEGACY_SAVE_ENDPOINT } from '../save/cloudSync.js';
import { saveLocal } from '../save/saveManager.js';
import { updateHUD } from './hudView.js';

let cachedLeaderboard = null;
let lastFetchTime = 0;

// Curated top rivals to ensure Hall of Fame is always competitive and alive
const DEFAULT_RIVALS = [
  { playerId: 'bot_alpha_1', playerName: 'Король Унитаза 👑', stage: 1450, biomass: 1.8e24, rolls: 850000, transcends: 12, prestiges: 145, plungers: 1250 },
  { playerId: 'bot_alpha_2', playerName: 'Шмяк-Мастер 3000 ⚡', stage: 1120, biomass: 6.5e21, rolls: 420000, transcends: 9, prestiges: 110, plungers: 680 },
  { playerId: 'bot_alpha_3', playerName: 'Астральный Сантехник 🔮', stage: 950, biomass: 9.2e18, rolls: 180000, transcends: 7, prestiges: 85, plungers: 340 },
  { playerId: 'bot_alpha_4', playerName: 'Galaxy Flush 99 🌌', stage: 720, biomass: 3.4e16, rolls: 95000, transcends: 5, prestiges: 62, plungers: 190 },
  { playerId: 'bot_alpha_5', playerName: 'Повелитель Втулок 🧻', stage: 540, biomass: 8.5e14, rolls: 45000, transcends: 3, prestiges: 44, plungers: 85 },
  { playerId: 'bot_alpha_6', playerName: 'Turbo_Clicker_KZ 🔥', stage: 380, biomass: 1.2e13, rolls: 18000, transcends: 2, prestiges: 28, plungers: 35 },
  { playerId: 'bot_alpha_7', playerName: 'Шеф Биомассы 👨‍🍳', stage: 250, biomass: 5.0e11, rolls: 8500, transcends: 1, prestiges: 18, plungers: 10 },
  { playerId: 'bot_alpha_8', playerName: 'Вантуз Судьбы 🪠', stage: 160, biomass: 2.4e10, rolls: 3200, transcends: 0, prestiges: 12, plungers: 0 },
  { playerId: 'bot_alpha_9', playerName: 'Какашич-Профи 💩', stage: 95, biomass: 8.5e8, rolls: 1100, transcends: 0, prestiges: 6, plungers: 0 },
  { playerId: 'bot_alpha_10', playerName: 'Новичок Канализации 🌱', stage: 45, biomass: 3.5e7, rolls: 350, transcends: 0, prestiges: 2, plungers: 0 }
];

export function calculatePlayerPowerScore(player) {
  const transcends = Number(player.totalTranscend || player.transcends || 0);
  const plungers = Number(player.transcendPlungers || player.plungers || 0);
  const prestiges = Number(player.totalPrestiges || player.prestiges || 0);
  const rolls = Number(player.allTimePrestigeRolls || player.rolls || 0);
  const stage = Number(player.stage || player.evoStage || 1);
  const bio = Number(player.allTimeBiomass || player.biomass || 10);
  const logBio = bio > 1 ? Math.floor(Math.log10(Math.max(1, bio)) * 150) : 0;

  return Math.floor(
    (transcends * 25000) +
    (plungers * 100) +
    (prestiges * 500) +
    Math.min(rolls * 0.1, 50000) +
    (stage * 100) +
    logBio
  );
}

export async function fetchLeaderboardFromDb(force = false) {
  const now = Date.now();
  if (!force && cachedLeaderboard && (now - lastFetchTime < 15000)) {
    return cachedLeaderboard;
  }

  let remoteData = null;
  try {
    let res = await fetch(`${CLOUD_SAVE_ENDPOINT}?action=leaderboard`);
    if (!res.ok && res.status === 404) {
      res = await fetch(`${LEGACY_SAVE_ENDPOINT}?action=leaderboard`);
    }

    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.leaderboard) && json.leaderboard.length > 0) {
        remoteData = json.leaderboard;
      }
    }
  } catch (err) {
    console.warn('Leaderboard fetch note (offline/local fallback):', err.message);
  }

  // Graceful fallback with player's dynamic rank inserted
  const merged = remoteData ? [...remoteData] : [...DEFAULT_RIVALS];
  const playerEntry = {
    playerId: GAME.playerId || 'current_local_player',
    playerName: GAME.playerName || 'Вы (Герой)',
    stage: (GAME.evoStage || 0) + 1,
    biomass: GAME.allTimeBiomass || GAME.biomass || 100,
    rolls: GAME.allTimePrestigeRolls || GAME.prestigeRolls || 0,
    transcends: GAME.totalTranscend || 0,
    prestiges: GAME.totalPrestiges || 0,
    plungers: GAME.transcendPlungers || 0,
    isCurrent: true
  };

  // Remove existing current player if duplicate
  const existingIndex = merged.findIndex(p => p.playerId === playerEntry.playerId || p.isCurrent);
  if (existingIndex !== -1) {
    merged.splice(existingIndex, 1);
  }
  merged.push(playerEntry);

  // Score every contestant
  merged.forEach(entry => {
    entry.score = calculatePlayerPowerScore(entry);
  });

  // Sort strictly by power score
  merged.sort((a, b) => (b.score || 0) - (a.score || 0));

  cachedLeaderboard = merged.slice(0, 20);
  lastFetchTime = now;
  return cachedLeaderboard;
}

export function renderLeaderboardRows(containerEl, leaderboard) {
  if (!containerEl) return;

  if (!leaderboard || leaderboard.length === 0) {
    containerEl.innerHTML = '<div class="text-stone-400 text-center py-4 text-xs font-game">В Зале Славы пока нет записей</div>';
    return;
  }

  const currentPlayerId = GAME.playerId || '';
  const currentPlayerName = GAME.playerName || '';

  containerEl.innerHTML = leaderboard.map((player, idx) => {
    const isCurrent = player.isCurrent || (currentPlayerId && player.playerId === currentPlayerId) || (player.playerName === currentPlayerName);
    
    let rankBadge = `#${idx + 1}`;
    let rankClass = 'text-stone-400 font-bold';
    let cardBorder = isCurrent ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/70 via-stone-900 to-stone-950 shadow-md' : 'border-stone-800 bg-stone-950/90';

    if (idx === 0) {
      rankBadge = '🥇';
      rankClass = 'text-2xl filter drop-shadow';
      if (!isCurrent) cardBorder = 'border-yellow-500/50 bg-stone-900/90';
    } else if (idx === 1) {
      rankBadge = '🥈';
      rankClass = 'text-xl filter drop-shadow';
      if (!isCurrent) cardBorder = 'border-slate-400/40 bg-stone-900/90';
    } else if (idx === 2) {
      rankBadge = '🥉';
      rankClass = 'text-xl filter drop-shadow';
      if (!isCurrent) cardBorder = 'border-amber-700/50 bg-stone-900/90';
    }

    const safeName = String(player.playerName || 'Анонимный Какашич')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const formattedScore = formatNumber(player.score || calculatePlayerPowerScore(player));
    const formattedBio = formatNumber(player.biomass || 0);

    return `
      <div class="flex items-center justify-between p-2.5 rounded-2xl border ${cardBorder} transition hover:border-amber-500/50">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="font-game shrink-0 ${rankClass} min-w-[28px] text-center">${rankBadge}</span>
          <div class="truncate">
            <div class="flex items-center gap-1.5 truncate">
              <span class="font-bold text-xs ${isCurrent ? 'text-yellow-300' : 'text-stone-200'} truncate">${safeName}</span>
              ${isCurrent ? '<span class="text-[9px] bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 px-1.5 py-0.2 rounded font-black uppercase tracking-wider shrink-0 shadow">ВЫ</span>' : ''}
            </div>
            <div class="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
              <span>🧬 Форма ${player.stage || 1}</span>
              <span class="text-stone-600">•</span>
              <span class="text-purple-300 font-mono">🧻 ${player.prestiges || 0} см</span>
              ${player.transcends ? `<span class="text-stone-600">•</span><span class="text-cyan-300 font-mono">🌌 ${player.transcends} пр</span>` : ''}
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
  }).join('');
}

function updateDailyRewardCard(leaderboard) {
  const card = document.getElementById('leaderboardDailyRewardCard');
  if (!card) return;

  const btnClaim = document.getElementById('btnClaimDailyTop10');
  const infoEl = document.getElementById('leaderboardDailyRewardInfo');
  const badgeEl = document.getElementById('playerRankBadge');

  const currentPlayerId = GAME.playerId || '';
  const currentPlayerName = GAME.playerName || '';

  const playerIndex = (leaderboard || []).findIndex(p => 
    p.isCurrent || (currentPlayerId && p.playerId === currentPlayerId) || (p.playerName === currentPlayerName)
  );

  const playerRank = playerIndex !== -1 ? playerIndex + 1 : 999;
  if (badgeEl) {
    badgeEl.textContent = playerRank <= 20 ? `#${playerRank} В РЕЙТИНГЕ` : '#20+ В РЕЙТИНГЕ';
    badgeEl.className = playerRank <= 10 ? 'text-[9px] bg-emerald-500 text-stone-950 px-1.5 py-0.5 rounded font-black' : 'text-[9px] bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded font-black';
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
  else if (playerRank <= 10) rewardAmount = 15000;

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
    if (infoEl) infoEl.innerHTML = `<span class="text-emerald-300 font-bold">🎉 Вы в Топ-${playerRank}!</span> Ваша награда: <strong class="text-yellow-300">+${rewardAmount.toLocaleString('ru-RU')} ✨ Блестяшек</strong>`;
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
        notif.innerHTML = `<span>👑 Получена ежедневная награда Топ-${playerRank}: +${rewardAmount.toLocaleString('ru-RU')} ✨ Блестяшек!</span>`;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3500);
      };
    }
  } else {
    if (infoEl) infoEl.textContent = `Вы на #${playerRank} месте. Поднимитесь в Топ-10 по Очкам Славы, чтобы получать до 50,000 ✨ в день!`;
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
