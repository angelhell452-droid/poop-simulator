/**
 * knifeIcons.js
 * Централизованный маппинг и векторные рендеры ножей.
 * Поддерживает полноразмерные векторные SVG-модели ножей со скинами
 * и текстовые эмодзи-иконки для компактных списков.
 */

import { getKnifeVectorSvg } from './knifeVectorRenderer.js';
import { knifeArtHtml } from '../ui/artIcon.js?v=5.4.27';

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
  common: 'rarity-common',
  uncommon: 'rarity-uncommon',
  rare: 'rarity-rare',
  mythical: 'rarity-mythical',
  epic: 'rarity-epic',
  legendary: 'rarity-legendary',
  covert: 'rarity-covert',
  rainbow: 'rarity-rainbow',
  godly: 'rarity-godly',
  titanium: 'rarity-titanium',
  cosmic: 'rarity-cosmic',
  quantum: 'rarity-quantum',
  impossible: 'rarity-impossible',
  absolute: 'rarity-absolute',
  // legacy aliases for backwards compatibility
  'mil-spec': 'rarity-common',
  very_rare: 'rarity-mythical',
  restricted: 'rarity-mythical',
  classified: 'rarity-epic',
  celestial: 'rarity-cosmic',
  special: 'rarity-godly',
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
  return knifeArtHtml(knife, size, getKnifeVectorSvg(knife, size, extraClass));
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
