/**
 * Конфигурация баланса и множителей ножей.
 *
 * Позволяет разработчику гибко регулировать силу ножей:
 * - globalMultiplier: Общий множитель для всех ножей (по умолчанию 1.0).
 *   Установите 1.2 (+20%), 1.5 (+50%) или 0.8 (-20%), чтобы мгновенно изменить силу всех ножей в игре.
 * - clickMultiplier: Дополнительный множитель силы клика от ножей (по умолчанию 1.0).
 * - passiveMultiplier: Дополнительный множитель пассивного дохода CPS от ножей (по умолчанию 1.0).
 * - softCapEnabled: Мягкое ограничение сверхвысоких множителей (false - отключено для полной силы).
 */
export const KNIFE_BALANCE_CONFIG = {
  // Главный глобальный регулятор силы ножей:
  globalMultiplier: 1.0,

  // Раздельная калибровка направлений:
  clickMultiplier: 1.0,
  passiveMultiplier: 1.0,

  // Защитный мягкий кап (false = игроки получают 100% заявленной силы ножа):
  softCapEnabled: false,
  clickKnee: 1000000,
  passiveKnee: 1000000
};

/**
 * Возвращает фактический базовый множитель клика ножа с учётом глобального баланса.
 */
export function getKnifeEffectiveClickMult(knife) {
  if (!knife) return 1;
  return (knife.clickMult || 1) * KNIFE_BALANCE_CONFIG.globalMultiplier * KNIFE_BALANCE_CONFIG.clickMultiplier;
}

/**
 * Возвращает фактический базовый пассивный множитель ножа с учётом глобального баланса.
 */
export function getKnifeEffectivePassiveMult(knife) {
  if (!knife) return 1;
  return (knife.passiveMult || 1) * KNIFE_BALANCE_CONFIG.globalMultiplier * KNIFE_BALANCE_CONFIG.passiveMultiplier;
}
