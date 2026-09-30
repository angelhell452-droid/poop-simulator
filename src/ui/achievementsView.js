import { GAME, feedCount, washCount, polishCount, flushCount } from '../core/state.js';
import { ACHIEVEMENTS } from '../data/achievements.data.js';
import { FACTORIES } from '../data/factories.data.js';
import { SHOP_ITEMS } from '../data/shop.data.js';
import { formatNumber } from '../utils/numberFormatter.js';

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
    }

    let progressHtml = '';
    if (!ach.done) {
      let disp = Math.min(ach.target, current);
      let pct = Math.min(100, Math.max(0, Math.round((disp / ach.target) * 100)));
      progressHtml = `
        <div class="mt-1 w-full max-w-[210px]">
          <div class="flex justify-between text-[9px] text-stone-400 mb-0.5">
            <span>Прогресс: ${formatNumber(disp)} / ${formatNumber(ach.target)}</span>
            <span class="text-amber-400 font-bold">${pct}%</span>
          </div>
          <div class="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }

    const row = document.createElement('div');
    row.className = `p-2 rounded-xl border flex items-center justify-between ${ach.done ? 'bg-emerald-950/40 border-emerald-600' : 'bg-stone-950 border-stone-800'}`;
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xl">${ach.icon}</span>
        <div>
          <div class="font-bold text-xs ${ach.done ? 'text-emerald-300' : 'text-stone-300'}">${ach.title} ${ach.done ? '✓' : ''}</div>
          <div class="text-[10px] text-stone-500">${ach.desc}</div>
          ${progressHtml}
        </div>
      </div>
      <span class="text-xs font-bold text-yellow-400 shrink-0 ml-2">+${formatNumber(ach.reward)} ✨</span>
    `;
    container.appendChild(row);
  });

  const doneCount = ACHIEVEMENTS.filter(a => a.done).length;
  const countText = document.getElementById('achievementsCountText');
  if (countText) countText.textContent = `${doneCount} / ${ACHIEVEMENTS.length}`;
}
