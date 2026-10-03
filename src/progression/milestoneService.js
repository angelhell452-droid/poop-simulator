import { GAME } from '../core/state.js';
import { ARCHETYPES } from './archetypes.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { formatNumber } from '../utils/numberFormatter.js';

export const MILESTONES = [
  { form: 5, icon: '🏭', title: 'Форма 5: Мушиная Ферма', reward: 'Разблокировка фабрик' },
  { form: 10, icon: '📦', title: 'Форма 10: Первый Контейнер', reward: 'Доступ к кейсам и скинам' },
  { form: 15, icon: '🏭', title: 'Форма 15: Первые заводы', reward: 'Доход начинает держаться сам' },
  { form: 25, icon: '📜', title: 'Форма 25: Ветви Талантов', reward: 'Древо мета-улучшений' },
  { form: 50, icon: '⚔️', title: 'Форма 50: Мастерство Клинка', reward: 'Бонус Катаны +15% к клику' },
  { form: 80, icon: '🌀', title: 'Форма 80: Мост эпохи', reward: 'Первый Смыв оставляет эхо x2' },
  { form: 100, icon: '🌀', title: 'Форма 100: После моста', reward: 'Эхо уже можно усиливать' },
  { form: 250, icon: '🌌', title: 'Форма 250: Квантовый Реактор', reward: 'Космические фабрики' },
  { form: 350, icon: '🏭', title: 'Форма 350: Венец эпохи', reward: 'Третий завод закрывает эпоху' },
  { form: 500, icon: '⚛️', title: 'Форма 500: Сингулярность', reward: 'Артефакты мутации' },
  { form: 1000, icon: '👑', title: 'Форма 1,000: Демиург', reward: 'Сверх-ранг Эпохи' },
  { form: 2500, icon: '🔮', title: 'Форма 2,500: Омега-Разум', reward: 'Разрыв пространства' },
  { form: 5000, icon: '🪐', title: 'Форма 5,000: Повелитель Миров', reward: 'Священный статус' },
  { form: 10000, icon: '✨', title: 'Форма 10k: Высшая Сущность', reward: 'Вечный титул' }
];

export function getNextMilestoneGoal() {
  const currentStage = (GAME.evoStage || 0) + 1;
  const lastForm = EVOLUTIONS.length;
  let nextM = MILESTONES.find(m => currentStage < m.form);
  let hideTarget = false;

  if (!nextM && currentStage >= lastForm) {
    nextM = { form: currentStage, icon: '🌫️', title: 'Горизонт закрыт', reward: 'Эпоха без подписи' };
    hideTarget = true;
  } else if (!nextM) {
    const step = currentStage < 12000 ? 150 : 250;
    const horizon = Math.ceil((currentStage + step) / 50) * 50;
    if (horizon >= lastForm) {
      nextM = { form: currentStage, icon: '🌫️', title: 'Дальше без карты', reward: 'Эпоха не подписана' };
      hideTarget = true;
    } else {
      nextM = { form: horizon, icon: '🌫️', title: 'Ближний горизонт', reward: 'Эпоха не подписана' };
    }
  }

  const pct = hideTarget
    ? 88
    : Math.min(100, Math.max(0, (currentStage / nextM.form) * 100));
  const arch = ARCHETYPES[GAME.archetype] || ARCHETYPES.balanced;

  return {
    currentStage,
    targetStage: hideTarget ? currentStage : nextM.form,
    title: nextM.title,
    icon: nextM.icon,
    reward: nextM.reward,
    percent: pct,
    progressText: hideTarget
      ? `${formatNumber(currentStage)} • без карты`
      : `${formatNumber(currentStage)} / ${formatNumber(nextM.form)}`,
    archetypeBadge: arch.badge
  };
}
