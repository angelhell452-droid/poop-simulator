import { GAME, feedCount, washCount, polishCount, flushCount } from '../core/state.js?v=5.0.40';
import { ACHIEVEMENTS } from '../data/achievements.data.js?v=5.0.40';
import { FACTORIES } from '../data/factories.data.js?v=5.0.40';
import { SHOP_ITEMS } from '../data/shop.data.js?v=5.0.40';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.40';
import { drawPlunger } from '../utils/icons.js?v=5.0.40';

export function renderAchievements() {
  const container = document.getElementById('achievementsContainer');
  if (!container) return;
  container.innerHTML = '';

  ACHIEVEMENTS.forEach(ach => {
    let current = 0;
    if (ach.type === 'clicks') current = GAME.totalClicks;
    else if (ach.type === 'evo') current = GAME.evoStage;
    else if (ach.type === 'allBiomass') current = GAME.allTimeBiomass;
    else if (ach.type === 'feed') current = feedCount;
    else if (ach.type === 'wash') current = washCount;
    else if (ach.type === 'polish') current = polishCount;
    else if (ach.type === 'flush') current = flushCount;
    else if (ach.type === 'prestige') current = GAME.totalPrestiges;
    else if (ach.type === 'hat') current = GAME.equippedHat ? 1 : 0;
    else if (ach.type === 'billionaire') current = SHOP_ITEMS.find(i => i.id === 'hat_multiverse')?.owned ? 1 : 0;
    else if (ach.type === 'secret') current = ach.done ? 1 : 0;
    else if (ach.type === 'factories') {
      let tf = 0;
      FACTORIES.forEach(f => { tf += (f.count || 0); });
      current = tf;
    } else if (ach.type === 'meteor') {
      current = GAME.meteorsCaught || 0;
    } else if (ach.type === 'turbo') {
      current = GAME.turboCount || 0;
    } else if (ach.type === 'transcend') {
      current = GAME.totalTranscend || 0;
    } else if (ach.type === 'knives') {
      current = (GAME.unlockedKnives || []).length;
    } else if (ach.type === 'ideal') {
      current = ((GAME.hunger >= 90 || GAME.petHunger >= 90) && (GAME.clean >= 90 || GAME.petClean >= 90) && (GAME.happy >= 90 || GAME.petHappy >= 90)) ? 1 : 0;
    } else if (ach.type === 'sharpen') {
      current = Object.values(GAME.knifeStars || {}).reduce((mx, cur) => Math.max(mx, cur), 0);
    }

    let progressHtml = '';
    if (!ach.done) {
      let disp = Math.min(ach.target, current);
      let pct = Math.min(100, Math.max(0, Math.round((disp / ach.target) * 100)));
      progressHtml = `
        <div class="mt-1 w-full max-w-[210px]">
          <div class="flex justify-between text-[9px] text-stone-400 mb-0.5">
            <span>Прогресс: ${ach.concealTarget ? `${formatNumber(disp)} • без карты` : `${formatNumber(disp)} / ${formatNumber(ach.target)}`}</span>
            <span class="text-amber-400 font-bold">${pct}%</span>
          </div>
          <div class="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }

    const rewards = [];
    if (ach.reward) {
      rewards.push(`<span class="text-yellow-400 font-bold">+${formatNumber(ach.reward)} ✨</span>`);
    }
    if (ach.rewardRolls) {
      rewards.push(`<span class="text-purple-300 font-bold inline-flex items-center gap-0.5">+${formatNumber(ach.rewardRolls)} <span class="roll-icon"></span></span>`);
    }
    if (ach.rewardPlungers) {
      rewards.push(`<span class="text-cyan-300 font-bold inline-flex items-center gap-0.5">+${formatNumber(ach.rewardPlungers)} <span class="plunger-icon"></span></span>`);
    }

    const row = document.createElement('div');
    row.className = `p-2.5 rounded-2xl border flex items-center justify-between gap-2 shadow-sm transition ${ach.done ? 'bg-emerald-950/40 border-emerald-600/70' : 'bg-stone-950/90 border-stone-800'}`;
    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        <span class="text-2xl shrink-0">${drawPlunger(ach.icon)}</span>
        <div class="min-w-0 flex-1">
          <div class="font-bold text-xs ${ach.done ? 'text-emerald-300' : 'text-stone-200'}">${ach.title} ${ach.done ? '✓' : ''}</div>
          <div class="text-[10px] text-stone-400 leading-snug mt-0.5">${ach.desc}</div>
          ${progressHtml}
        </div>
      </div>
      <div class="flex flex-col items-end shrink-0 gap-0.5 text-xs">
        ${rewards.join('')}
      </div>
    `;
    container.appendChild(row);
  });

  const doneCount = ACHIEVEMENTS.filter(a => a.done).length;
  const countText = document.getElementById('achievementsCountText');
  if (countText) countText.textContent = `${doneCount} / ${ACHIEVEMENTS.length}`;
}
