import { PATCH_NOTES } from '../data/patchNotes.data.js';

export function openPatchNotesModal() {
  const modal = document.getElementById('patchNotesModal');
  if (!modal) return;
  renderPatchNotes();
  modal.classList.remove('hidden');
}

export function renderPatchNotes() {
  const container = document.getElementById('patchNotesList');
  if (!container) return;

  container.innerHTML = PATCH_NOTES.map((pn, idx) => {
    const isLatest = idx === 0;
    return `
      <div class="p-3.5 rounded-2xl bg-stone-900/90 border-2 ${isLatest ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'border-stone-700'} space-y-2">
        <div class="flex items-center justify-between flex-wrap gap-1">
          <div class="flex items-center gap-2">
            <span class="font-game text-sm sm:text-base text-yellow-300">${pn.version}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full border font-bold ${pn.badgeClass}">${pn.badge}</span>
          </div>
          <span class="text-[10px] text-stone-400 font-mono">${pn.date}</span>
        </div>
        <div class="font-bold text-xs text-stone-200">${pn.title}</div>
        <div class="space-y-1.5 pt-1 text-[11px] text-stone-300">
          ${pn.changes.map(ch => `
            <div class="flex items-start gap-2">
              <span class="shrink-0 text-sm">${ch.icon}</span>
              <span class="leading-snug">${ch.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

export function initPatchNotesListeners() {
  document.getElementById('btnPatchNotesModal')?.addEventListener('click', openPatchNotesModal);
  const vTag = document.getElementById('versionTag');
  if (vTag) {
    vTag.style.cursor = 'pointer';
    vTag.title = 'Нажмите, чтобы открыть журнал обновлений (Патч-ноуты)';
    vTag.addEventListener('click', openPatchNotesModal);
  }
}
