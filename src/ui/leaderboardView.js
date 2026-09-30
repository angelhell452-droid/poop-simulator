import { GAME } from '../core/state.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { CLOUD_SAVE_ENDPOINT, LEGACY_SAVE_ENDPOINT } from '../save/cloudSync.js';

let cachedLeaderboard = null;
let lastFetchTime = 0;

// Curated top rivals to ensure Hall of Fame is always alive even offline
const DEFAULT_RIVALS = [
  { playerId: 'bot_alpha_1', playerName: 'Король Унитаза', stage: 1450, biomass: 1.8e24, rolls: 850000 },
  { playerId: 'bot_alpha_2', playerName: 'Шмяк-Мастер 3000', stage: 1120, biomass: 6.5e21, rolls: 420000 },
  { playerId: 'bot_alpha_3', playerName: 'Астральный Сантехник', stage: 950, biomass: 9.2e18, rolls: 180000 },
  { playerId: 'bot_alpha_4', playerName: 'Galaxy Flush 99', stage: 720, biomass: 3.4e16, rolls: 95000 },
  { playerId: 'bot_alpha_5', playerName: 'Повелитель Втулок', stage: 540, biomass: 8.5e14, rolls: 45000 },
  { playerId: 'bot_alpha_6', playerName: 'Turbo_Clicker_KZ', stage: 380, biomass: 1.2e13, rolls: 18000 },
  { playerId: 'bot_alpha_7', playerName: 'Шеф Биомассы', stage: 250, biomass: 5.0e11, rolls: 8500 },
  { playerId: 'bot_alpha_8', playerName: 'Вантуз Судьбы', stage: 160, biomass: 2.4e10, rolls: 3200 },
  { playerId: 'bot_alpha_9', playerName: 'Какашич-Профи', stage: 95, biomass: 8.5e8, rolls: 1100 },
  { playerId: 'bot_alpha_10', playerName: 'Новичок Канализации', stage: 45, biomass: 3.5e7, rolls: 350 }
];

export async function fetchLeaderboardFromDb(force = false) {
  const now = Date.now();
  if (!force && cachedLeaderboard && (now - lastFetchTime < 15000)) {
    return cachedLeaderboard;
  }

  try {
    let res = await fetch(`${CLOUD_SAVE_ENDPOINT}?action=leaderboard`);
    if (!res.ok && res.status === 404) {
      res = await fetch(`${LEGACY_SAVE_ENDPOINT}?action=leaderboard`);
    }

    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.leaderboard) && json.leaderboard.length > 0) {
        cachedLeaderboard = json.leaderboard;
        lastFetchTime = now;
        return cachedLeaderboard;
      }
    }
  } catch (err) {
    console.warn('Leaderboard fetch note (offline/local fallback):', err.message);
  }

  // Graceful fallback with player's dynamic rank inserted
  const merged = [...DEFAULT_RIVALS];
  const currPlayerBio = GAME.allTimeBiomass || GAME.biomass || 100;
  const currPlayerStage = (GAME.evoStage || 0) + 1;
  const playerEntry = {
    playerId: GAME.playerId || 'current_local_player',
    playerName: GAME.playerName || 'Вы (Герой)',
    stage: currPlayerStage,
    biomass: currPlayerBio,
    rolls: GAME.allTimePrestigeRolls || GAME.prestigeRolls || 0,
    isCurrent: true
  };

  merged.push(playerEntry);
  merged.sort((a, b) => (b.biomass || 0) - (a.biomass || 0));

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
            </div>
          </div>
        </div>
        <div class="text-right shrink-0 ml-2">
          <div class="text-emerald-400 font-game font-bold text-xs">+${formattedBio} 💨</div>
          <div class="text-[9px] text-purple-300 font-mono">${formatNumber(player.rolls || player.prestigeCurrency || 0)} 🧻</div>
        </div>
      </div>
    `;
  }).join('');
}

export async function refreshAndRenderAllLeaderboards(force = false) {
  const modalList = document.getElementById('leaderboardFullList');
  const accountList = document.getElementById('leaderboardList');

  const loadingPlaceholder = `
    <div class="flex flex-col items-center justify-center py-6 text-stone-400 gap-2">
      <span class="text-2xl animate-spin">🌀</span>
      <span class="text-xs font-game">Связь с базой данных D1...</span>
    </div>
  `;

  if (modalList) modalList.innerHTML = loadingPlaceholder;
  if (accountList) accountList.innerHTML = loadingPlaceholder;

  const data = await fetchLeaderboardFromDb(force);

  if (modalList) renderLeaderboardRows(modalList, data);
  if (accountList) renderLeaderboardRows(accountList, data);
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
