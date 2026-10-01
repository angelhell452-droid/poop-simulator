import { GAME } from '../core/state.js';
import { ARCHETYPES } from './archetypes.js';
import { formatNumber } from '../utils/numberFormatter.js';

export const MILESTONES = [
  { form: 5, icon: '🏭', title: 'Форма 5: Мушиная Ферма', reward: 'Разблокировка фабрик' },
  { form: 10, icon: '📦', title: 'Форма 10: Первый Контейнер', reward: 'Доступ к кейсам и скинам' },
  { form: 15, icon: '🌀', title: 'Форма 15: Великий Смыв', reward: 'Престиж 1-го уровня (🧻)' },
  { form: 25, icon: '📜', title: 'Форма 25: Ветви Талантов', reward: 'Древо мета-улучшений' },
  { form: 50, icon: '⚔️', title: 'Форма 50: Мастерство Клинка', reward: 'Бонус Катаны +15% к клику' },
  { form: 100, icon: '🪠', title: 'Форма 100: Астральный Прорыв', reward: 'Трансценденция (🪠)' },
  { form: 250, icon: '🌌', title: 'Форма 250: Квантовый Реактор', reward: 'Космические фабрики' },
  { form: 500, icon: '⚛️', title: 'Форма 500: Сингулярность', reward: 'Артефакты мутации' },
  { form: 1000, icon: '👑', title: 'Форма 1,000: Демиург', reward: 'Сверх-ранг Эпохи' },
  { form: 2500, icon: '🔮', title: 'Форма 2,500: Омега-Разум', reward: 'Разрыв пространства' },
  { form: 5000, icon: '🪐', title: 'Форма 5,000: Повелитель Миров', reward: 'Священный статус' },
  { form: 10000, icon: '✨', title: 'Форма 10,000: Высшая Сущность', reward: 'Вечный титул' },
  { form: 20000, icon: '🏆', title: 'Форма 20,000: Финал Эволюции', reward: 'Абсолют Вселенной' }
];

export function getNextMilestoneGoal() {
  const currentStage = (GAME.evoStage || 0) + 1;
  let nextM = MILESTONES.find(m => currentStage < m.form);
  if (!nextM) {
    nextM = { form: 20000, icon: '🏆', title: 'Вершина Эволюции (20,000 / 20,000)', reward: 'Максимальный Ранг!' };
  }
  const pct = Math.min(100, Math.max(0, (currentStage / nextM.form) * 100));
  const arch = ARCHETYPES[GAME.archetype] || ARCHETYPES.balanced;

  return {
    currentStage,
    targetStage: nextM.form,
    title: nextM.title,
    icon: nextM.icon,
    reward: nextM.reward,
    percent: pct,
    progressText: `${formatNumber(currentStage)} / ${formatNumber(nextM.form)}`,
    archetypeBadge: arch.badge
  };
}
