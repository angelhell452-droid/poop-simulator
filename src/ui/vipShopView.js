import { GAME } from '../core/state.js?v=5.0.80';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { getPassiveIncome } from '../economy/production.js?v=5.0.80';
import { mul, gainBio } from '../utils/big.js?v=5.0.80';
import { showKnifeToast } from './characterInventoryView.js?v=5.0.80';
import { onLocaleChange } from '../i18n/t.js';
import { TALENTS } from '../data/talents.data.js';

export function getWarpTalentMult() {
  const warpLvl = TALENTS.find(t => t.id === 'talent_warp_buff')?.level || 0;
  return 1 + warpLvl * 0.05;
}

export function getSparklePackYield(base) {
  const b = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;
  const scale = Math.pow(1 + b, 1.5);
  return Math.round(base * scale);
}

export function executeTimeWarp(hours) {
  const h = Number(hours) || 2;
  const rate = getPassiveIncome();
  const warpTalentMult = getWarpTalentMult();
  const payout = mul(mul(rate, h * 3600), warpTalentMult);

  GAME.biomass = gainBio(GAME.biomass, payout);
  GAME.lifetimeBiomassInCurrentCycle = gainBio(GAME.lifetimeBiomassInCurrentCycle, payout);
  GAME.allTimeBiomass = gainBio(GAME.allTimeBiomass, payout);
  GAME.cycleBiomass = gainBio(GAME.cycleBiomass, payout);

  showKnifeToast(`⏳ Тайм-Варп на ${h}ч: +${formatNumber(payout)} биомассы!`);
  renderVipShop();
}

export function buySparklePack(base) {
  const yieldAmt = getSparklePackYield(base);
  GAME.sparkles = (GAME.sparkles || 0) + yieldAmt;
  showKnifeToast(`✨ Получено +${formatNumber(yieldAmt)} Блестяшек!`);
  renderVipShop();
}

export function activateVipPass() {
  if (GAME.vipPass) {
    showKnifeToast('👑 VIP-Пасс уже активен на вашем аккаунте!');
    return;
  }
  GAME.vipPass = true;
  showKnifeToast('👑 Поздравляем! VIP-Пасс активирован! Автосбор метеоритов и х2 ресурсы включены!');
  renderVipShop();
}

function renderVipShop() {
  const list = document.getElementById('vipShopList');
  if (!list) return;

  const b = GAME.breakthroughCount ?? GAME.totalTranscend ?? 0;
  const isVip = Boolean(GAME.vipPass);
  const incomeRate = getPassiveIncome();
  const warpMult = getWarpTalentMult();

  const warp2Yield = mul(mul(incomeRate, 7200), warpMult);
  const warp6Yield = mul(mul(incomeRate, 21600), warpMult);
  const warp12Yield = mul(mul(incomeRate, 43200), warpMult);

  const packSmall = getSparklePackYield(500);
  const packMedium = getSparklePackYield(2500);
  const packLarge = getSparklePackYield(15000);

  list.innerHTML = `
    <!-- CATEGORY 1: VIP PASS -->
    <div class="garden-card p-4 rounded-3xl border-2 ${isVip ? 'border-yellow-400 bg-gradient-to-br from-yellow-950/40 via-stone-900 to-amber-950/40' : 'border-yellow-500/50 bg-stone-950/80'} shadow-lg space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-3xl">👑</span>
          <div>
            <div class="font-game text-base text-yellow-300 font-bold">VIP-Пасс Вселенной</div>
            <div class="text-[10px] text-stone-300">Абсолютный комфорт и удвоение наград</div>
          </div>
        </div>
        ${isVip ? '<span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">АКТИВЕН ✓</span>' : '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">VIP</span>'}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
        <div class="p-2 rounded-2xl bg-stone-900/90 border border-stone-800">
          <div class="text-xl mb-0.5">🌠</div>
          <div class="font-bold text-yellow-200 text-[11px]">Автосборщик</div>
          <div class="text-[9px] text-stone-400">Золотые звезды ловятся мгновенно</div>
        </div>
        <div class="p-2 rounded-2xl bg-stone-900/90 border border-stone-800">
          <div class="text-xl mb-0.5">🧻</div>
          <div class="font-bold text-yellow-200 text-[11px]">x2 Втулки</div>
          <div class="text-[9px] text-stone-400">Удвоение Втулок за каждый Смыв</div>
        </div>
        <div class="p-2 rounded-2xl bg-stone-900/90 border border-stone-800">
          <div class="text-xl mb-0.5">🪠</div>
          <div class="font-bold text-yellow-200 text-[11px]">x2 Вантузы</div>
          <div class="text-[9px] text-stone-400">Удвоение Вантузов за Прорыв</div>
        </div>
      </div>

      <div>
        <button type="button" id="btnActivateVipPass" class="w-full jelly-btn py-2.5 rounded-2xl font-game text-xs font-bold transition flex items-center justify-center gap-2 shadow ${isVip ? 'bg-stone-800 text-yellow-400 border border-yellow-500/30' : 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-stone-950 hover:brightness-110 border border-yellow-300'}">
          ${isVip ? '👑 VIP-Пасс уже активен' : '✨ Активировать VIP-Пасс'}
        </button>
      </div>
    </div>

    <!-- CATEGORY 2: TIME WARPS -->
    <div class="garden-card p-4 rounded-3xl border border-cyan-500/30 bg-stone-950/80 shadow-lg space-y-2.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">⏳</span>
          <div>
            <div class="font-game text-sm text-cyan-300 font-bold">Хроно-Варпы Времени</div>
            <div class="text-[10px] text-stone-400">Мгновенная выплата дохода заводов за часы</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <!-- 2H WARP -->
        <div class="p-2.5 rounded-2xl bg-stone-900 border border-cyan-500/20 flex flex-col justify-between text-center gap-1">
          <div class="text-xs font-game font-bold text-cyan-200">⚡ Варп 2 Часа</div>
          <div class="text-[11px] text-emerald-300 font-bold font-game">+${formatNumber(warp2Yield)}</div>
          <button type="button" class="btn-time-warp garden-pill accent text-[11px] py-1 mt-1 font-bold" data-hours="2">Варп 2ч</button>
        </div>

        <!-- 6H WARP -->
        <div class="p-2.5 rounded-2xl bg-stone-900 border border-cyan-500/20 flex flex-col justify-between text-center gap-1">
          <div class="text-xs font-game font-bold text-cyan-200">⚡ Варп 6 Часов</div>
          <div class="text-[11px] text-emerald-300 font-bold font-game">+${formatNumber(warp6Yield)}</div>
          <button type="button" class="btn-time-warp garden-pill accent text-[11px] py-1 mt-1 font-bold" data-hours="6">Варп 6ч</button>
        </div>

        <!-- 12H WARP -->
        <div class="p-2.5 rounded-2xl bg-stone-900 border border-cyan-500/20 flex flex-col justify-between text-center gap-1">
          <div class="text-xs font-game font-bold text-cyan-200">⚡ Варп 12 Часов</div>
          <div class="text-[11px] text-emerald-300 font-bold font-game">+${formatNumber(warp12Yield)}</div>
          <button type="button" class="btn-time-warp garden-pill accent text-[11px] py-1 mt-1 font-bold" data-hours="12">Варп 12ч</button>
        </div>
      </div>
    </div>

    <!-- CATEGORY 3: SCALING SPARKLE PACKS -->
    <div class="garden-card p-4 rounded-3xl border border-pink-500/30 bg-stone-950/80 shadow-lg space-y-2.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">✨</span>
          <div>
            <div class="font-game text-sm text-pink-300 font-bold">Наборы Блестяшек</div>
            <div class="text-[10px] text-stone-400">Растут со степенным множителем (1 + Прорывы)<sup>1.5</sup></div>
          </div>
        </div>
        <span class="text-[10px] text-yellow-300 font-bold">Ур. Прорыва: ${formatNumber(b)}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <!-- SMALL -->
        <div class="p-2.5 rounded-2xl bg-stone-900 border border-pink-500/20 flex flex-col justify-between text-center gap-1">
          <div class="text-xl">🎒</div>
          <div class="text-xs font-game font-bold text-pink-200">Мешочек Искр</div>
          <div class="text-[11px] text-yellow-300 font-bold font-game">+${formatNumber(packSmall)} ✨</div>
          <button type="button" class="btn-sparkle-pack garden-pill accent text-[11px] py-1 mt-1 font-bold" data-base="500">Забрать ✨</button>
        </div>

        <!-- MEDIUM -->
        <div class="p-2.5 rounded-2xl bg-stone-900 border border-pink-500/20 flex flex-col justify-between text-center gap-1">
          <div class="text-xl">💼</div>
          <div class="text-xs font-game font-bold text-pink-200">Сундук Блеска</div>
          <div class="text-[11px] text-yellow-300 font-bold font-game">+${formatNumber(packMedium)} ✨</div>
          <button type="button" class="btn-sparkle-pack garden-pill accent text-[11px] py-1 mt-1 font-bold" data-base="2500">Забрать ✨</button>
        </div>

        <!-- LARGE -->
        <div class="p-2.5 rounded-2xl bg-stone-900 border border-pink-500/20 flex flex-col justify-between text-center gap-1">
          <div class="text-xl">👑</div>
          <div class="text-xs font-game font-bold text-pink-200">Сокровищница</div>
          <div class="text-[11px] text-yellow-300 font-bold font-game">+${formatNumber(packLarge)} ✨</div>
          <button type="button" class="btn-sparkle-pack garden-pill accent text-[11px] py-1 mt-1 font-bold" data-base="15000">Забрать ✨</button>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  document.getElementById('btnActivateVipPass')?.addEventListener('click', () => {
    activateVipPass();
  });

  list.querySelectorAll('.btn-time-warp').forEach((btn) => {
    btn.addEventListener('click', () => {
      executeTimeWarp(Number(btn.dataset.hours) || 2);
    });
  });

  list.querySelectorAll('.btn-sparkle-pack').forEach((btn) => {
    btn.addEventListener('click', () => {
      buySparklePack(Number(btn.dataset.base) || 500);
    });
  });
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
