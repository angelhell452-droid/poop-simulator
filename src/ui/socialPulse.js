import { getStoredAccount, socialRequest } from '../save/cloudSync.js?v=5.0.73';

/**
 * One slow heartbeat for header badges. Open modals refresh themselves
 * on a longer cadence — never all three social feeds at once.
 */
const BADGE_MS = 20000;
const OPEN_MS = 10000;

let badgeTimer = 0;
let openTimer = 0;
let badgeBusy = false;

const hooks = {
  mailOpen: null,
  friendsOpen: null,
  guildOpen: null,
  setMailBadge: null,
  setFriendsBadge: null,
  warmFriends: null,
  refreshMail: null,
  refreshFriends: null,
  refreshGuild: null
};

function signedIn() {
  return !!getStoredAccount()?.username;
}

function isOpen(fn) {
  try { return !!fn?.(); } catch (_) { return false; }
}

async function pulseBadges() {
  if (!signedIn() || document.visibilityState === 'hidden' || badgeBusy) return;
  badgeBusy = true;
  try {
    const [mail, friends] = await Promise.all([
      socialRequest('mail'),
      socialRequest('friends')
    ]);
    // Quiet on offline blips — account modal shows the real status.
    if (mail?.success) hooks.setMailBadge?.(mail.rewardCount);
    if (friends?.success) {
      hooks.setFriendsBadge?.((friends.incoming || []).length);
      // Keep a warm roster so Friends opens without a blank 2–3s wait.
      hooks.warmFriends?.(friends);
    }
  } catch (_) {
    /* ignore background probe failures */
  } finally {
    badgeBusy = false;
  }
}

async function pulseOpenModal() {
  if (!signedIn() || document.visibilityState === 'hidden') return;
  if (isOpen(hooks.mailOpen)) {
    await hooks.refreshMail?.(true);
    return;
  }
  if (isOpen(hooks.friendsOpen)) {
    await hooks.refreshFriends?.(true);
    return;
  }
  if (isOpen(hooks.guildOpen)) {
    await hooks.refreshGuild?.();
  }
}

export function registerSocialPulse(part) {
  Object.assign(hooks, part || {});
}

export function startSocialPulse() {
  if (badgeTimer) clearInterval(badgeTimer);
  if (openTimer) clearInterval(openTimer);
  badgeTimer = setInterval(pulseBadges, BADGE_MS);
  openTimer = setInterval(pulseOpenModal, OPEN_MS);
  if (signedIn()) {
    setTimeout(pulseBadges, 800);
  }
}

export function nudgeSocialBadges() {
  pulseBadges();
}
