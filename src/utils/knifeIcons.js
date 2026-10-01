/**
 * knifeIcons.js
 * Централизованный маппинг иконок ножей.
 * Каждый тип ножа (style) имеет базовую SVG-иконку в виде эмодзи.
 * Редкость определяет цветовой класс CSS для обёртки иконки.
 */

// Базовые иконки по типу ножа (style)
export const KNIFE_STYLE_ICONS = {
  karambit: '🦅', // коготь/серп — характерный изогнутый клинок
  butterfly: '🦋', // бабочка
  m9: '🔱', // широкий клинок M9
  bayonet: '⚔️', // штыковой нож
  flip: '🌀', // складной
  gut: '🪝', // крюкообразный
  falchion: '🌙', // изогнутый клинок
  huntsman: '🏹', // охотничий
  bowie: '🗡️', // боуи — классический
  stiletto: '💉', // тонкое лезвие
  daggers: '✝️', // пара кинжалов
  navaja: '🪒', // navaja — испанский складной
  ursus: '🐻', // ursus — медведь
  talon: '🦞', // talon — коготь
  skeleton: '💀', // skeleton
  paracord: '🧵', // paracord
  survival: '🏕️', // survival
  nomad: '🗺️', // nomad
  classic: '🎯', // classic
  katana: '⛩️', // katana
  scythe: '☠️', // коса
};

// Цветовые CSS-классы для рамки/свечения по редкости
export const KNIFE_RARITY_GLOW_CLASS = {
  common: 'knife-rarity-common',
  'mil-spec': 'knife-rarity-milspec',
  rare: 'knife-rarity-rare',
  very_rare: 'knife-rarity-very-rare',
  restricted: 'knife-rarity-very-rare',
  epic: 'knife-rarity-epic',
  classified: 'knife-rarity-classified',
  covert: 'knife-rarity-covert',
  rainbow: 'knife-rarity-rainbow',
  celestial: 'knife-rarity-celestial',
  titanium: 'knife-rarity-titanium',
  special: 'knife-rarity-special',
  godly: 'knife-rarity-godly',
};

/**
 * Возвращает правильную иконку ножа по его данным.
 * Приоритет: если нож уже имеет явную иконку (не дефолтный эмодзи), используем стиль.
 * @param {Object} knife - объект ножа из KNIVES
 * @returns {string} - эмодзи иконка
 */
export function getKnifeIcon(knife) {
  if (!knife) return '🗡️';
  return KNIFE_STYLE_ICONS[knife.style] || '🗡️';
}

/**
 * Возвращает CSS-класс цвета для иконки по редкости.
 * @param {string} rarity
 * @returns {string}
 */
export function getKnifeRarityClass(rarity) {
  return KNIFE_RARITY_GLOW_CLASS[rarity] || 'knife-rarity-common';
}
