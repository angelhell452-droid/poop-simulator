import { t } from '../i18n/t.js';

export function formatTimeSeconds(seconds) {
  if (seconds < 60) return `${Math.ceil(seconds)}с`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins < 60) return `${mins}м ${secs}с`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}ч ${remMins}м`;
}

export function formatDurationAway(seconds) {
  if (seconds >= 3600) {
    const hours = (seconds / 3600).toFixed(1);
    return t('common.durHours', { n: hours });
  }
  const mins = Math.floor(seconds / 60);
  return t('common.durMins', { n: mins });
}
