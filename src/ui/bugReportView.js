import { GAME } from '../core/state.js?v=5.0.65';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.65';

const GAME_VERSION = 'v5.0.65 PRO';

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
    showStatus(statusEl, '❌ Описание слишком короткое (минимум 10 символов)', 'error');
    return;
  }
  if (text.length > 1000) {
    showStatus(statusEl, '❌ Описание слишком длинное (максимум 1000 символов)', 'error');
    return;
  }

  // Cooldown
  if (now - lastReportTime < REPORT_COOLDOWN_MS) {
    const secLeft = Math.ceil((REPORT_COOLDOWN_MS - (now - lastReportTime)) / 1000);
    showStatus(statusEl, `⏳ Подождите ещё ${secLeft} сек перед следующим репортом`, 'error');
    return;
  }

  // Получаем выбранную категорию
  const activeCategory = [...categoryBtns].find(b => b.classList.contains('bg-red-600'));
  const category = activeCategory ? activeCategory.dataset.category : 'Не указана';

  // Сбор данных об игроке
  const playerName = GAME.playerName || GAME.cloudPlayerName || 'Гость';
  const stage = GAME.evoStage || 0;
  const biomass = formatNumber(GAME.biomass || 0);
  const sparkles = formatNumber(GAME.sparkles || 0);
  const prestigeLvl = GAME.totalPrestiges || 0;
  const transcendLvl = GAME.totalTranscend || 0;
  const knivesCount = (GAME.unlockedKnives || []).length;

  // Цвет embed по категории
  const categoryColors = {
    'Визуальный баг': 0x6366f1,
    'Краш / зависание': 0xef4444,
    'Баланс / экономика': 0xf59e0b,
    'Звук': 0x06b6d4,
    'Другое': 0x6b7280
  };
  const embedColor = categoryColors[category] || 0xef4444;

  const timestamp = new Date().toISOString();

  const payload = {
    username: '🐛 Poop Simulator Bug Report',
    avatar_url: 'https://cdn.discordapp.com/attachments/0/0/poop.png',
    embeds: [
      {
        title: `🐛 Новый Баг-Репорт | ${GAME_VERSION}`,
        description: `\`\`\`\n${text}\n\`\`\``,
        color: embedColor,
        fields: [
          {
            name: '📂 Категория',
            value: category,
            inline: true
          },
          {
            name: '👤 Игрок',
            value: playerName,
            inline: true
          },
          {
            name: '🎮 Версия',
            value: GAME_VERSION,
            inline: true
          },
          {
            name: '🧬 Форма',
            value: `#${stage}`,
            inline: true
          },
          {
            name: '💨 Биомасса',
            value: biomass,
            inline: true
          },
          {
            name: '✨ Блестяшки',
            value: sparkles,
            inline: true
          },
          {
            name: '🔄 Смыв / Прорыв',
            value: `Ур.${prestigeLvl} / Ур.${transcendLvl}`,
            inline: true
          },
          {
            name: '🗡️ Ножей',
            value: `${knivesCount}/200`,
            inline: true
          },
          {
            name: '🌐 Браузер',
            value: navigator.userAgent.substring(0, 80),
            inline: false
          }
        ],
        footer: {
          text: `Poop Simulator Bug Tracker • ${new Date().toLocaleString('ru-RU')}`
        },
        timestamp
      }
    ]
  };

  // UI: отправляем
  btnSend.disabled = true;
  btnSend.textContent = '📡 Отправка...';
  showStatus(statusEl, '📡 Отправляем репорт в Discord...', 'info');

  try {
    const res = await fetch('/api/bug-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 503) {
      showStatus(statusEl, 'Репорты сейчас не подключены на сервере.', 'error');
    } else if (res.ok) {
      lastReportTime = Date.now();
      showStatus(statusEl, '✅ Репорт отправлен! Спасибо, мы разберёмся!', 'success');
      if (textarea) textarea.value = '';
      // Закрыть модалку через 2 секунды
      setTimeout(() => {
        document.getElementById('bugReportModal')?.classList.add('hidden');
      }, 2000);
    } else {
      showStatus(statusEl, `❌ Ошибка отправки (${res.status}). Попробуйте позже.`, 'error');
    }
  } catch (err) {
    showStatus(statusEl, '❌ Нет соединения. Проверьте интернет.', 'error');
  } finally {
    btnSend.disabled = false;
    btnSend.textContent = '🚀 Отправить репорт';
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
