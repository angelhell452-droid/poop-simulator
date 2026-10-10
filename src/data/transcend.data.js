import { RELICS, RELIC_TIERS, getRelicLevel, hasRelic } from './relics.data.js?v=5.0.80';

// TRANSCEND_UPGRADES re-exports RELICS with compatible property mapping for any legacy readers
export const TRANSCEND_UPGRADES = RELICS.map(r => ({
  ...r,
  reqTranscend: r.reqBreakthrough
}));

export { RELICS, RELIC_TIERS, getRelicLevel, hasRelic };
