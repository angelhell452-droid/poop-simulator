import { GAME } from '../core/state.js?v=5.0.78';
import { EVOLUTIONS } from '../data/evolutions.data.js?v=5.0.78';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.78';
import { t, td, onLocaleChange } from '../i18n/t.js';
import { epochName } from '../i18n/localize.js';

export function renderEvoChronicles() {
  const container = document.getElementById('evoListContainer');
  if (!container) return;
  container.innerHTML = '';

  const minStage = Math.max(0, GAME.evoStage - 2);
  const maxStage = Math.min(EVOLUTIONS.length - 1, GAME.evoStage + 8);

  for (let i = minStage; i <= maxStage; i++) {
    const ev = EVOLUTIONS[i];
    if (!ev) continue;
    const unlocked = GAME.evoStage >= ev.id;
    const isCurrent = GAME.evoStage === ev.id;

    const row = document.createElement('div');
    row.className = `p-2 rounded-xl border flex items-center justify-between ${isCurrent ? 'bg-amber-950/80 border-yellow-400 ring-1 ring-yellow-400' : (unlocked ? 'bg-stone-950 border-stone-800' : 'bg-stone-950/40 border-stone-900 opacity-50')}`;
    row.innerHTML = `
      <div>
        <div class="font-bold text-xs ${isCurrent ? 'text-yellow-300 font-game' : 'text-stone-300'}">${t('hud.formName', { n: formatNumber(ev.id + 1), name: td(`evo.${ev.id}.name`, ev.name) })}</div>
        <div class="text-[9px] text-stone-500">${epochName(ev.id, ev.epoch)} | ${t('evo.power', { n: formatNumber(ev.mult) })}</div>
      </div>
      <span class="text-[10px] font-bold ${unlocked ? 'text-emerald-400' : 'text-stone-400'}">${unlocked ? t('evo.unlocked') : `${formatNumber(ev.cost)} 💨`}</span>
    `;
    container.appendChild(row);
  }
}

onLocaleChange(() => {
  renderEvoChronicles();
});
