import { PATCH_NOTES } from '../data/patchNotes.data.js?v=5.0.72';
import { NEWS } from '../data/news.data.js?v=5.0.72';

function escapeText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function openPatchNotesModal() {
  const modal = document.getElementById('patchNotesModal');
  if (!modal) return;
  renderPatchNotes();
  renderNews();
  showJournalTab('news');
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
            <span class="font-game text-sm sm:text-base text-yellow-300">${escapeText(pn.version)}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full border font-bold ${pn.badgeClass}">${escapeText(pn.badge)}</span>
          </div>
          <span class="text-[10px] text-stone-400 font-mono">${escapeText(pn.date)}</span>
        </div>
        <div class="font-bold text-xs text-stone-200">${escapeText(pn.title)}</div>
        <div class="space-y-1.5 pt-1 text-[11px] text-stone-300">
          ${pn.changes.map(ch => `
            <div class="flex items-start gap-2">
              <span class="shrink-0 text-sm">${ch.icon}</span>
              <span class="leading-snug">${escapeText(ch.text)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

export function renderNews() {
  const container = document.getElementById('newsList');
  if (!container) return;

  if (!NEWS.length) {
    container.innerHTML = '<div class="text-stone-400 text-center text-xs py-6">Новостей пока нет.</div>';
    return;
  }

  container.innerHTML = NEWS.map((item) => {
    const image = typeof item.image === 'string' && item.image.startsWith('assets/news/')
      ? `<img src="${escapeText(item.image)}" alt="" class="w-full rounded-xl border border-amber-500/40 object-cover max-h-52">`
      : '';
    return `
      <article class="p-3.5 rounded-2xl bg-stone-900/90 border-2 border-amber-500/40 space-y-2">
        ${image}
        <div class="flex items-center justify-between flex-wrap gap-1">
          <span class="text-[10px] px-2 py-0.5 rounded-full border font-bold bg-amber-500/20 text-amber-200 border-amber-400/40">${escapeText(item.tag || 'Новость')}</span>
          <span class="text-[10px] text-stone-400 font-mono">${escapeText(item.date)}</span>
        </div>
        <div class="font-bold text-xs text-stone-100">${escapeText(item.title)}</div>
        <p class="text-[11px] text-stone-300 leading-snug">${escapeText(item.text)}</p>
      </article>
    `;
  }).join('');
}

function showJournalTab(tab) {
  const patches = document.getElementById('patchNotesList');
  const news = document.getElementById('newsList');
  const btnPatches = document.getElementById('btnJournalPatches');
  const btnNews = document.getElementById('btnJournalNews');
  const showNews = tab === 'news';
  patches?.classList.toggle('hidden', showNews);
  news?.classList.toggle('hidden', !showNews);
  btnPatches?.classList.toggle('border-yellow-400', !showNews);
  btnPatches?.classList.toggle('bg-yellow-500/20', !showNews);
  btnPatches?.classList.toggle('text-yellow-200', !showNews);
  btnPatches?.classList.toggle('border-stone-600', showNews);
  btnPatches?.classList.toggle('bg-stone-800', showNews);
  btnPatches?.classList.toggle('text-stone-300', showNews);
  btnNews?.classList.toggle('border-yellow-400', showNews);
  btnNews?.classList.toggle('bg-yellow-500/20', showNews);
  btnNews?.classList.toggle('text-yellow-200', showNews);
  btnNews?.classList.toggle('border-stone-600', !showNews);
  btnNews?.classList.toggle('bg-stone-800', !showNews);
  btnNews?.classList.toggle('text-stone-300', !showNews);
}

export function initPatchNotesListeners() {
  document.getElementById('btnPatchNotesModal')?.addEventListener('click', openPatchNotesModal);
  const vTag = document.getElementById('versionTag');
  if (vTag) {
    vTag.style.cursor = 'pointer';
    vTag.title = 'Нажмите, чтобы открыть журнал обновлений';
    vTag.addEventListener('click', openPatchNotesModal);
  }
  document.getElementById('btnJournalPatches')?.addEventListener('click', () => showJournalTab('patches'));
  document.getElementById('btnJournalNews')?.addEventListener('click', () => {
    renderNews();
    showJournalTab('news');
  });
}
