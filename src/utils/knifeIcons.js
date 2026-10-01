/**
 * knifeIcons.js
 * Централизованный маппинг и векторные рендеры ножей.
 * Поддерживает полноразмерные векторные SVG-модели ножей со скинами
 * и текстовые эмодзи-иконки для компактных списков.
 */

import { getKnifeVectorSvg } from './knifeVectorRenderer.js';

// Базовые иконки по типу ножа (style)
export const KNIFE_STYLE_ICONS = {
  karambit: '🦅',
  butterfly: '🦋',
  m9: '🔱',
  bayonet: '⚔️',
  flip: '🌀',
  gut: '🪝',
  falchion: '🌙',
  huntsman: '🏹',
  bowie: '🗡️',
  stiletto: '💉',
  daggers: '✝️',
  navaja: '🪒',
  ursus: '🐻',
  talon: '🦞',
  skeleton: '💀',
  paracord: '🧵',
  survival: '🏕️',
  nomad: '🗺️',
  classic: '🎯',
  katana: '⛩️',
  scythe: '☠️',
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
 * Возвращает векторный SVG нож со скином для интерфейса (рулетка, инвентарь, атлас).
 * @param {Object} knife - объект ножа
 * @param {number} size - размер в px
 * @param {string} extraClass - доп. классы
 * @returns {string} HTML-строка
 */
export function getKnifeImageHtml(knife, size = 48, extraClass = '') {
  if (!knife) return `<span class="text-2xl">🗡️</span>`;
  return getKnifeVectorSvg(knife, size, extraClass);
}

/**
 * Текстовая иконка-эмодзи ножа.
 * @param {Object} knife - объект ножа из KNIVES
 * @returns {string} - эмодзи иконка
 */
export function getKnifeIcon(knife) {
  if (!knife) return '🗡️';
  return KNIFE_STYLE_ICONS[knife.style] || knife.icon || '🗡️';
}

/**
 * Возвращает CSS-класс цвета для иконки по редкости.
 * @param {string} rarity
 * @returns {string}
 */
export function getKnifeRarityClass(rarity) {
  return KNIFE_RARITY_GLOW_CLASS[rarity] || 'knife-rarity-common';
}
