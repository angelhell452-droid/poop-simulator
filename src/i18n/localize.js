import { dataText, getLocale, t, td } from './t.js';
import { ENTITIES } from '../data/evolutions.data.js?v=5.0.80';
import { PHASE_COUNT, PHASE_FORMS } from '../progression/phases.data.js?v=5.0.80';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.80';

export function knifeName(item) {
  return dataText('knife', item?.id, 'name', item?.name || '');
}

export function knifeDesc(item) {
  return dataText('knife', item?.id, 'desc', item?.desc || '');
}

export function knifeRarity(item) {
  return dataText('knife', item?.id, 'rarity', item?.rarityName || '');
}

export function shopName(item) {
  return dataText('shop', item?.id, 'name', item?.name || '');
}

export function shopDesc(item) {
  return dataText('shop', item?.id, 'desc', item?.desc || '');
}

export function factoryName(item) {
  return dataText('factory', item?.id, 'name', item?.name || '');
}

export function factoryTier(item) {
  return dataText('factory', item?.id, 'tier', item?.tierTitle || '');
}

export function talentName(item) {
  return dataText('talent', item?.id, 'name', item?.name || '');
}

export function talentDesc(item) {
  return dataText('talent', item?.id, 'desc', item?.desc || '');
}

export function caseName(item) {
  return dataText('case', item?.id, 'name', item?.name || '');
}

export function caseDesc(item) {
  return dataText('case', item?.id, 'desc', item?.desc || '');
}

export function skinName(item) {
  return dataText('skin', item?.id, 'name', item?.name || '');
}

export function skinDesc(item) {
  return dataText('skin', item?.id, 'desc', item?.desc || '');
}

export function transcendName(item) {
  return dataText('transcend', item?.id, 'name', item?.name || '');
}

export function transcendDesc(item) {
  return dataText('transcend', item?.id, 'desc', item?.desc || '');
}

export function bossName(item) {
  return dataText('boss', item?.id, 'name', item?.name || '');
}

export function epochName(index, fallback) {
  return dataText('epoch', String(index), 'name', fallback || '');
}

export function newsTitle(index, fallback) {
  return dataText('news', String(index), 'title', fallback || '');
}

export function newsBody(index, fallback) {
  return dataText('news', String(index), 'body', fallback || '');
}

export function isEnglish() {
  return getLocale() === 'en';
}

export function archetypeName(arch) {
  return dataText('archetype', arch?.id, 'name', arch?.name || '');
}

export function archetypeDesc(arch) {
  return dataText('archetype', arch?.id, 'desc', arch?.desc || '');
}

export function archetypeBadge(arch) {
  return dataText('archetype', arch?.id, 'badge', arch?.badge || '');
}

export function evolutionDisplayName(evo) {
  if (!evo || evo.id == null) return '';
  const i = evo.id;
  const last = PHASE_COUNT * PHASE_FORMS;
  const entIdx = (i * 3 + Math.floor(i / 7)) % ENTITIES.length;
  const ent = ENTITIES[entIdx];
  const tier = (i % 100) + 1;
  if (i === last - 1) return t('evo.procedural.omega');
  if (i % 500 === 0) return t('evo.procedural.overlord');
  const entity = td(`evo.entity.${entIdx}`, ent);
  return t('evo.procedural.entityTier', { entity, tier: formatNumber(tier) });
}

export function evolutionDisplayDesc(evo) {
  if (!evo) return '';
  return t('evo.formDesc', { n: formatNumber(evo.id + 1), name: evolutionDisplayName(evo) });
}

export function poopSkinName(info) {
  return dataText('poopSkin', info?.id, 'name', info?.name || '');
}

export function poopSkinRank(info) {
  return dataText('poopSkin', info?.id, 'rank', info?.rank || '');
}

export function poopSkinDesc(info) {
  return dataText('poopSkin', info?.id, 'desc', info?.desc || '');
}

export function milestoneTitle(entry) {
  if (entry?.key) return td(`milestone.dynamic.${entry.key}.title`, entry.title || '');
  if (entry?.form != null) return td(`milestone.${entry.form}.title`, entry.title || '');
  return entry?.title || '';
}

export function milestoneRewardText(entry) {
  if (entry?.key) return td(`milestone.dynamic.${entry.key}.reward`, entry.reward || '');
  if (entry?.form != null) return td(`milestone.${entry.form}.reward`, entry.reward || '');
  return entry?.reward || '';
}

export { t, dataText, td };
