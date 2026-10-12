/**
 * knifeRarities.config.js
 * Единая конфигурация 14 глобальных редкостей ножей.
 * Редкость привязана к абсолютной мощи ножа.
 */

export const KNIFE_RARITIES = [
  {
    id: 'common',
    name: 'Обычный',
    nameEn: 'Common',
    color: '#a8a29e',
    order: 1,
    tierGroup: 1,
    borderClass: 'border-stone-500',
    bgClass: 'bg-stone-900/90',
    badgeClass: 'bg-stone-800 text-stone-300 border border-stone-600',
    shadowClass: 'shadow-none',
    cssClass: 'rarity-common'
  },
  {
    id: 'uncommon',
    name: 'Необычный',
    nameEn: 'Uncommon',
    color: '#4ade80',
    order: 2,
    tierGroup: 1,
    borderClass: 'border-emerald-500',
    bgClass: 'bg-gradient-to-b from-emerald-950/60 to-stone-950',
    badgeClass: 'bg-emerald-950 text-emerald-300 border border-emerald-500/60',
    shadowClass: 'shadow-[0_0_8px_rgba(74,222,128,0.25)]',
    cssClass: 'rarity-uncommon'
  },
  {
    id: 'rare',
    name: 'Редкий',
    nameEn: 'Rare',
    color: '#38bdf8',
    order: 3,
    tierGroup: 1,
    borderClass: 'border-sky-500',
    bgClass: 'bg-gradient-to-b from-sky-950/60 to-stone-950',
    badgeClass: 'bg-sky-950 text-sky-300 border border-sky-500/60',
    shadowClass: 'shadow-[0_0_10px_rgba(56,189,248,0.3)]',
    cssClass: 'rarity-rare'
  },
  {
    id: 'mythical',
    name: 'Мифический',
    nameEn: 'Mythical',
    color: '#a855f7',
    order: 4,
    tierGroup: 1,
    borderClass: 'border-purple-500',
    bgClass: 'bg-gradient-to-b from-purple-950/60 to-stone-950',
    badgeClass: 'bg-purple-950 text-purple-300 border border-purple-500/60',
    shadowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    cssClass: 'rarity-mythical'
  },
  {
    id: 'epic',
    name: 'Эпический',
    nameEn: 'Epic',
    color: '#ec4899',
    order: 5,
    tierGroup: 2,
    borderClass: 'border-pink-500',
    bgClass: 'bg-gradient-to-b from-pink-950/60 to-stone-950',
    badgeClass: 'bg-pink-950 text-pink-300 border border-pink-500/60',
    shadowClass: 'shadow-[0_0_14px_rgba(236,72,153,0.4)]',
    cssClass: 'rarity-epic'
  },
  {
    id: 'legendary',
    name: 'Легендарный',
    nameEn: 'Legendary',
    color: '#f59e0b',
    order: 6,
    tierGroup: 2,
    borderClass: 'border-amber-400',
    bgClass: 'bg-gradient-to-b from-amber-950/70 to-stone-950',
    badgeClass: 'bg-amber-500/25 text-amber-300 border border-amber-400 font-bold shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    shadowClass: 'shadow-[0_0_16px_rgba(245,158,11,0.45)]',
    cssClass: 'rarity-legendary'
  },
  {
    id: 'covert',
    name: 'Тайный',
    nameEn: 'Covert',
    color: '#ef4444',
    order: 7,
    tierGroup: 2,
    borderClass: 'border-red-500',
    bgClass: 'bg-gradient-to-b from-red-950/70 to-stone-950',
    badgeClass: 'bg-red-600 text-white font-black border border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]',
    shadowClass: 'shadow-[0_0_18px_rgba(239,68,68,0.55)]',
    cssClass: 'rarity-covert'
  },
  {
    id: 'rainbow',
    name: 'Радужный',
    nameEn: 'Rainbow',
    color: '#f43f5e',
    order: 8,
    tierGroup: 3,
    borderClass: 'border-pink-400',
    bgClass: 'bg-gradient-to-b from-red-950/50 via-purple-950/50 to-blue-950/50',
    badgeClass: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white font-black border border-white/60 shadow-[0_0_14px_rgba(244,63,94,0.6)]',
    shadowClass: 'shadow-[0_0_20px_rgba(244,63,94,0.55)]',
    cssClass: 'rarity-rainbow'
  },
  {
    id: 'godly',
    name: 'Божественный',
    nameEn: 'Godly',
    color: '#06b6d4',
    order: 9,
    tierGroup: 3,
    borderClass: 'border-cyan-300',
    bgClass: 'bg-gradient-to-b from-cyan-950/70 to-indigo-950/80',
    badgeClass: 'bg-cyan-300 text-stone-950 font-black border border-white shadow-[0_0_14px_#06b6d4]',
    shadowClass: 'shadow-[0_0_22px_rgba(6,182,212,0.7),inset_0_0_10px_rgba(255,255,255,0.4)]',
    cssClass: 'rarity-godly'
  },
  {
    id: 'titanium',
    name: 'Титановый',
    nameEn: 'Titanium',
    color: '#cbd5e1',
    order: 10,
    tierGroup: 4,
    borderClass: 'border-slate-300',
    bgClass: 'bg-gradient-to-b from-slate-800/80 via-slate-900 to-stone-950',
    badgeClass: 'bg-slate-200 text-slate-950 font-black border border-white shadow-[0_0_14px_rgba(255,255,255,0.8)]',
    shadowClass: 'shadow-[0_0_22px_rgba(203,213,225,0.65)]',
    cssClass: 'rarity-titanium'
  },
  {
    id: 'cosmic',
    name: 'Космический',
    nameEn: 'Cosmic',
    color: '#818cf8',
    order: 11,
    tierGroup: 4,
    borderClass: 'border-indigo-400',
    bgClass: 'bg-gradient-to-b from-indigo-950/80 via-purple-950/80 to-stone-950',
    badgeClass: 'bg-indigo-600 text-cyan-200 font-black border border-indigo-300 shadow-[0_0_16px_rgba(99,102,241,0.8)]',
    shadowClass: 'shadow-[0_0_24px_rgba(99,102,241,0.65)]',
    cssClass: 'rarity-cosmic'
  },
  {
    id: 'quantum',
    name: 'Квантовый',
    nameEn: 'Quantum',
    color: '#84cc16',
    order: 12,
    tierGroup: 5,
    borderClass: 'border-lime-400',
    bgClass: 'bg-gradient-to-b from-lime-950/80 via-emerald-950/80 to-stone-950',
    badgeClass: 'bg-lime-400 text-stone-950 font-black border border-lime-200 shadow-[0_0_16px_#84cc16]',
    shadowClass: 'shadow-[0_0_26px_rgba(132,204,22,0.75)]',
    cssClass: 'rarity-quantum'
  },
  {
    id: 'impossible',
    name: 'Невозможный',
    nameEn: 'Impossible',
    color: '#c026d3',
    order: 13,
    tierGroup: 5,
    borderClass: 'border-fuchsia-500',
    bgClass: 'bg-gradient-to-b from-fuchsia-950/80 via-rose-950/80 to-stone-950',
    badgeClass: 'bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-black border border-fuchsia-300 shadow-[0_0_18px_#c026d3]',
    shadowClass: 'shadow-[0_0_28px_rgba(192,38,211,0.8)]',
    cssClass: 'rarity-impossible'
  },
  {
    id: 'absolute',
    name: 'Абсолютный',
    nameEn: 'Absolute',
    color: '#facc15',
    order: 14,
    tierGroup: 5,
    borderClass: 'border-yellow-300',
    bgClass: 'bg-gradient-to-b from-yellow-950/90 via-amber-950/90 to-stone-950',
    badgeClass: 'bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 text-stone-950 font-black border border-white shadow-[0_0_20px_#facc15]',
    shadowClass: 'shadow-[0_0_32px_rgba(250,204,21,0.9),inset_0_0_15px_rgba(245,158,11,0.6)]',
    cssClass: 'rarity-absolute'
  }
];

export const RARITY_BY_ID = new Map(KNIFE_RARITIES.map(r => [r.id, r]));

export function getRarityMeta(rarityId) {
  return RARITY_BY_ID.get(rarityId) || KNIFE_RARITIES[0];
}
