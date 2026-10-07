import { dataText, getLocale, t } from './t.js';

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

export { t, dataText };
