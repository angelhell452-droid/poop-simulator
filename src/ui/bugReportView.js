import { GAME } from '../core/state.js?v=5.0.80';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';
import { t } from '../i18n/t.js';

const GAME_VERSION = 'v5.0.80 PRO';

const DISCORD_CATEGORY_LABELS = {
  visual: 'Visual bug',
  crash: 'Crash / freeze',
  balance: 'Balance / economy',
  sound: 'Sound',
  other: 'Other'
};

const CATEGORY_COLORS = {
  visual: 0x6366f1,
  crash: 0xef4444,
  balance: 0xf59e0b,
  sound: 0x06b6d4,
  other: 0x6b7280
};

// Cooldown: один репорт в 60 секунд чтобы не флудили
let lastReportTime = 0;
const REPORT_COOLDOWN_MS = 60_000;

export function initBugReportListeners() {
  const btnOpen = document.getElementById('btnBugReport');
  const modal = document.getElementById('bugReportModal');
  const btnClose = document.getElementById('btnCloseBugReport');
  const btnSend = document.getElementById('btnSendBugReport');
  const textarea = document.getElementById('bugReportText');
  const categoryBtns = document.querySelectorAll('.bug-category-btn');
  const statusEl = document.getElementById('bugReportStatus');

  if (!btnOpen || !modal) return;

  // Открыть модалку
  btnOpen.addEventListener('click', () => {
    modal.classList.remove('hidden');
    if (textarea) textarea.value = '';
    if (statusEl) statusEl.textContent = '';
    // Сброс выбранной категории
    categoryBtns.forEach(b => b.classList.remove('bg-red-600', 'text-white', 'border-red-400'));
    if (categoryBtns[0]) categoryBtns[0].classList.add('bg-red-600', 'text-white', 'border-red-400');
  });

  // Закрыть
  if (btnClose) {
    btnClose.addEventListener('click', () => modal.classList.add('hidden'));
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // Выбор категории
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('bg-red-600', 'text-white', 'border-red-400'));
      btn.classList.add('bg-red-600', 'text-white', 'border-red-400');
    });
  });

  // Отправить
  if (btnSend) {
    btnSend.addEventListener('click', async () => {
      await sendBugReport(textarea, categoryBtns, statusEl, btnSend);
    });
  }
}

async function sendBugReport(textarea, categoryBtns, statusEl, btnSend) {
  const now = Date.now();
  const text = (textarea?.value || '').trim();

  // Валидация
  if (!text || text.length < 10) {
    showStatus(statusEl, t('bug.tooShort', { n: formatNumber(10) }), 'error');
    return;
  }
  if (text.length > 1000) {
    showStatus(statusEl, t('bug.tooLong', { n: formatNumber(1000) }), 'error');
    return;
  }

  // Cooldown
  if (now - lastReportTime < REPORT_COOLDOWN_MS) {
    const secLeft = Math.ceil((REPORT_COOLDOWN_MS - (now - lastReportTime)) / 1000);
    showStatus(statusEl, t('bug.cooldown', { n: secLeft }), 'error');
    return;
  }

  // Получаем выбранную категорию
  const activeCategory = [...categoryBtns].find(b => b.classList.contains('bg-red-600'));
  const categoryId = activeCategory?.dataset.category || 'other';
  const categoryLabel = DISCORD_CATEGORY_LABELS[categoryId] || DISCORD_CATEGORY_LABELS.other;
  const embedColor = CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.other;

  // Сбор данных об игроке
  const playerName = GAME.playerName || GAME.cloudPlayerName || t('common.guest');
  const stage = GAME.evoStage || 0;
  const biomass = formatNumber(GAME.biomass || 0);
  const sparkles = formatNumber(GAME.sparkles || 0);
  const prestigeLvl = GAME.totalPrestiges || 0;
  const transcendLvl = GAME.totalTranscend || 0;
  const knivesCount = (GAME.unlockedKnives || []).length;

  const timestamp = new Date().toISOString();

  const payload = {
    username: '🐛 Poop Simulator Bug Report',
    embeds: [
      {
        title: `🐛 New Bug Report | ${GAME_VERSION}`,
        description: `\`\`\`\n${text}\n\`\`\``,
        color: embedColor,
        fields: [
          {
            name: '📂 Category',
            value: categoryLabel,
            inline: true
          },
          {
            name: '👤 Player',
            value: playerName,
            inline: true
          },
          {
            name: '🎮 Version',
            value: GAME_VERSION,
            inline: true
          },
          {
            name: '🧬 Form',
            value: `#${stage}`,
            inline: true
          },
          {
            name: '💨 Biomass',
            value: biomass,
            inline: true
          },
          {
            name: '✨ Sparkles',
            value: sparkles,
            inline: true
          },
          {
            name: '🔄 Flush / Breakthrough',
            value: `Lv.${prestigeLvl} / Lv.${transcendLvl}`,
            inline: true
          },
          {
            name: '🗡️ Knives',
            value: `${knivesCount}/200`,
            inline: true
          },
          {
            name: '🌐 Browser',
            value: navigator.userAgent.substring(0, 80),
            inline: false
          }
        ],
        footer: {
          text: `Poop Simulator Bug Tracker • ${new Date().toLocaleString('en-US')}`
        },
        timestamp
      }
    ]
  };

  // UI: отправляем
  btnSend.disabled = true;
  btnSend.textContent = t('bug.sendingBtn');
  showStatus(statusEl, t('bug.sending'), 'info');

  try {
    const res = await fetch('/api/bug-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 503) {
      showStatus(statusEl, t('bug.notConnected'), 'error');
    } else if (res.ok) {
      lastReportTime = Date.now();
      showStatus(statusEl, t('bug.sent'), 'success');
      if (textarea) textarea.value = '';
      // Закрыть модалку через 2 секунды
      setTimeout(() => {
        document.getElementById('bugReportModal')?.classList.add('hidden');
      }, 2000);
    } else {
      showStatus(statusEl, t('bug.sendFail', { code: res.status }), 'error');
    }
  } catch (err) {
    showStatus(statusEl, t('bug.noConnection'), 'error');
  } finally {
    btnSend.disabled = false;
    btnSend.textContent = t('bug.sendBtn');
  }
}

function showStatus(el, msg, type) {
  if (!el) return;
  const colors = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    info: 'text-yellow-400'
  };
  el.className = `text-xs font-bold mt-1 ${colors[type] || 'text-stone-300'}`;
  el.textContent = msg;
}
