/**
 * English translations for Patch Notes & helper functions for bilingual journal view.
 */

const RU_MONTHS = {
  'января': 'January',
  'февраля': 'February',
  'марта': 'March',
  'апреля': 'April',
  'мая': 'May',
  'июня': 'June',
  'июля': 'July',
  'августа': 'August',
  'сентября': 'September',
  'октября': 'October',
  'ноября': 'November',
  'декабря': 'December'
};

export function translateDateToEn(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  let out = dateStr;
  for (const [ruMonth, enMonth] of Object.entries(RU_MONTHS)) {
    const reg = new RegExp(ruMonth, 'i');
    if (reg.test(out)) {
      const match = out.match(/^(\d{1,2})\s+([а-яА-ЯёЁ]+)\s+(\d{4})$/);
      if (match) {
        return `${enMonth} ${match[1]}, ${match[3]}`;
      }
      return out.replace(reg, enMonth);
    }
  }
  return out;
}

export function translateBadgeToEn(badgeStr) {
  if (!badgeStr || typeof badgeStr !== 'string') return badgeStr;
  return badgeStr
    .replace(/^Патч\s*/i, 'Patch ')
    .replace(/^Хотфикс\s*/i, 'Hotfix ')
    .replace(/^Релиз\s*/i, 'Release ');
}

export const PATCH_NOTES_EN = {
  'v5.0.82 PRO': {
    date: 'October 8, 2026',
    title: 'Full Patch Notes Localization & Default English',
    badge: 'Patch 5.0',
    changes: [
      'Update log and news now fully translate to English when English language is chosen.',
      'English is now the standard default game language for players.',
      'Eliminated language leaks on switch: strictly the chosen language is displayed with no mixing.'
    ]
  },
  'v5.0.81 PRO': {
    date: 'October 8, 2026',
    title: 'Project Optimization & Token Savings',
    badge: 'Patch 5.0',
    changes: [
      'Patch notes archive moved to patchNotesArchive: active file size reduced from 165 KB to 9 KB (95% token savings on patches).',
      'Heavy backup files removed (index.backup.html 409 KB), .gitignore updated to protect context.',
      'AGENTS.md project rules compressed and optimized without losing instructions, saving thousands of tokens per AI query.'
    ]
  },
  'v5.0.80 PRO': {
    date: 'October 8, 2026',
    title: 'Outdated Achievement & Bug Report Fix',
    badge: 'Patch 5.0',
    changes: [
      'Bug reports go to Discord again via Pages Function /api/bug-report. Removed broken avatar_url that caused Discord to reject webhooks.',
      "'Billionaires Club' achievement (Multiverse Crown) removed — the hat has long been retired and is no longer sold."
    ]
  },
  'v5.0.79 PRO': {
    date: 'October 7, 2026',
    title: 'English Extended to the Entire UI Shell',
    badge: 'Patch 5.0',
    changes: [
      'English covers the remaining UI shell: guide, flush/breakthrough, knife index, guild, admin panel, bug report, smart advisor, canvas, and dynamic form/milestone labels.',
      'Static HTML is now on data-i18n — after changing language in profile, the header, pet care, tabs, and modals do not stay in Russian.'
    ]
  },
  'v5.0.78 PRO': {
    date: 'October 7, 2026',
    title: 'Full English Game Content',
    badge: 'Patch 5.0',
    changes: [
      'English covers the shell and game data: knives, cases, factories, talents, hats, skins, bosses, epochs, relics. Names and descriptions come from dictionary.',
      'HUD, boutique, cases, talents, and inventory switch seamlessly with the language selected in profile.'
    ]
  },
  'v5.0.77 PRO': {
    date: 'October 7, 2026',
    title: 'Interface Languages: Russian & English',
    badge: 'Patch 5.0',
    changes: [
      'Language switcher added to profile. Russian and English supported across header, friends, guild, mail, server status, and client notices.',
      'New languages can be added via locale registry without touching calls throughout the game.'
    ]
  },
  'v5.0.76 PRO': {
    date: 'October 7, 2026',
    title: 'Fixed Boss Rewards Across Cycles',
    badge: 'Patch 5.0',
    changes: [
      'Plungers and boss points no longer scale with cycle. Reward is fixed by boss number: #1 grants 1 plunger, #26 grants 26. Cycle only affects HP scaling.'
    ]
  },
  'v5.0.75 PRO': {
    date: 'October 7, 2026',
    title: '26 Guild Bosses with Custom Artwork',
    badge: 'Patch 5.0',
    changes: [
      'New ladder of 26 guild bosses: 13 themes, each with a Junior and Senior boss, custom art, rewards, and boss book with portraits.',
      'Boss HP rebalanced for the extended ladder so endgame HP does not explode into billions from old n² formula.',
      'Boss summons and battle log display theme, portrait, and rank (Junior/Senior).'
    ]
  },
  'v5.0.74 PRO': {
    date: 'October 7, 2026',
    title: 'Friends List Layout Fix',
    badge: 'Patch 5.0',
    changes: [
      'In friends list, form and epoch are on separate lines, with buttons below. Removed oversized epoch badge that was causing text truncation.'
    ]
  },
  'v5.0.73 PRO': {
    date: 'October 7, 2026',
    title: "Fix 'Cloud Overloaded' in Social Features",
    badge: 'Patch 5.0',
    changes: [
      '500 error in social features was caused by CPU limits from table creation on every request. DDL removed from hot path; main server handles fallbacks.'
    ]
  },
  'v5.0.72 PRO': {
    date: 'October 7, 2026',
    title: 'Instant Friends & Guild Modals',
    badge: 'Patch 5.0',
    changes: [
      'Friends and guild windows instantly display cache or loading state while server responds in background. Guild search fetches only on Search tab.',
      'Guild roster action buttons (Leader / Officer / Kick) wrap neatly to a new line without clipping.'
    ]
  },
  'v5.0.71 PRO': {
    date: 'October 7, 2026',
    title: 'Social Services Worker via Service Binding',
    badge: 'Patch 5.0',
    changes: [
      'Main server proxies /api/social to secondary Worker via service binding without requiring custom domain or routes.'
    ]
  },
  'v5.0.70 PRO': {
    date: 'October 7, 2026',
    title: 'Dedicated Social Microservice',
    badge: 'Patch 5.0',
    changes: [
      'Friends, mail, and guild now route to /api/social, ready for dedicated Worker deployment with shared D1 database.'
    ]
  },
  'v5.0.69 PRO': {
    date: 'October 7, 2026',
    title: 'Instant Optimistic Friend Requests',
    badge: 'Patch 5.0',
    changes: [
      'Friend requests sent optimistically: input clears instantly, outgoing request appears right away, server syncs in background.'
    ]
  },
  'v5.0.68 PRO': {
    date: 'October 7, 2026',
    title: 'Server Health Status in Profile',
    badge: 'Patch 5.0',
    changes: [
      'Profile menu now includes Server Status panel: cloud saves, social backend, and session with Check button.',
      'Replaced confusing error message with friendly cloud notice. Network failures auto-retry once.'
    ]
  },
  'v5.0.67 PRO': {
    date: 'October 7, 2026',
    title: 'Reduced Server Request Frequency',
    badge: 'Patch 5.0',
    changes: [
      'Mail, friends, and guild poll less aggressively: badges every 20s, open windows every 10s.'
    ]
  },
  'v5.0.66 PRO': {
    date: 'October 7, 2026',
    title: 'Clearer Guild Name Presentation',
    badge: 'Patch 5.0',
    changes: [
      'Guild name prominently displayed with title banner for clear identification.'
    ]
  },
  'v5.0.65 PRO': {
    date: 'October 7, 2026',
    title: 'Multipliers, Battle Log & Live Social Hub',
    badge: 'Patch 5.0',
    changes: [
      'Combat results and multipliers tuned for exciting guild boss encounters.'
    ]
  }
};

export function localizePatchNote(pn, idx, locale) {
  if (locale !== 'en') {
    return {
      version: pn.version,
      date: pn.date,
      title: pn.title,
      badge: pn.badge,
      badgeClass: pn.badgeClass,
      changes: (pn.changes || []).map(ch => ({ icon: ch.icon, text: ch.text }))
    };
  }

  const enData = PATCH_NOTES_EN[pn.version];
  const title = pn.titleEn || enData?.title || pn.title;
  const date = pn.dateEn || enData?.date || translateDateToEn(pn.date);
  const badge = pn.badgeEn || enData?.badge || translateBadgeToEn(pn.badge);
  const changes = (pn.changes || []).map((ch, cIdx) => {
    const textEn = ch.textEn || enData?.changes?.[cIdx] || ch.text;
    return {
      icon: ch.icon,
      text: textEn
    };
  });

  return {
    version: pn.version,
    date,
    title,
    badge,
    badgeClass: pn.badgeClass,
    changes
  };
}
