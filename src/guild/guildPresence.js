import { GUILD_MAX_LEVEL, guildBonusMult } from '../data/bosses.data.js?v=5.0.77';

let level = 0;
let tag = '';

export function setGuildPresence(next) {
  level = Math.max(0, Math.min(GUILD_MAX_LEVEL, Math.floor(Number(next?.level) || 0)));
  tag = String(next?.tag || '').trim().slice(0, 5);
  const header = document.getElementById('headerAccountName');
  const stored = header?.dataset.accountName;
  if (header && stored) header.textContent = formatTaggedName(stored, tag);
}

export function guildPresenceMult() {
  return guildBonusMult(level);
}

export function currentGuildTag() {
  return tag;
}

export function formatTaggedName(name, guildTag) {
  const clean = String(name || '');
  const mark = String(guildTag || '').trim();
  if (!mark) return clean;
  return `[${mark}] ${clean}`;
}
