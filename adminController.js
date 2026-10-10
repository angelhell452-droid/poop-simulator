// adminController.js - Unified Admin and Database Wipe Controller
// Handles Player Wipe, Global Wipe, and Leaderboard Cleansing for Cloudflare D1/KV

import {
  wipePlayerProgress as wipePlayerInWorkerAdmin,
  wipeWorldProgress as wipeWorldInWorkerAdmin,
  blankProgressSave,
  currentWorldReset,
  ensureAdminSchema,
  isCreator,
  sessionUser
} from './workerAdmin.js';

/**
 * Hard wipe a single player's progress in the database.
 * Resets breakthroughCount, flushCount, exp odometer, 25 talents, 24 relics, inventory, and currencies to 0.
 */
export async function wipePlayerProgress(db, playerId) {
  return await wipePlayerInWorkerAdmin(db, playerId);
}

/**
 * Global Wipe: Clears the entire database of all accounts and records.
 * Purges the player_saves table, auth_sessions, and bumps world_reset flag,
 * ensuring the Leaderboard (Top Ladder) starts from a completely clean slate with 0 phantom records.
 */
export async function wipeWorldProgress(db) {
  return await wipeWorldInWorkerAdmin(db);
}

/**
 * Handler for admin wipe actions invoked via API requests.
 */
export async function handleAdminWipeAction(action, targetId, db, actor, isCreatorCheck) {
  if (action === 'wipe' || action === 'delete') {
    if (!targetId) {
      return { status: 400, error: 'Target player ID is required' };
    }
    const wipedSave = await wipePlayerProgress(db, targetId);
    return { status: 200, success: true, wiped: targetId, save: wipedSave };
  }

  if (action === 'wipe_all') {
    if (!isCreatorCheck) {
      return { status: 403, error: 'Only the creator can perform a global wipe' };
    }
    const season = await wipeWorldProgress(db);
    return { status: 200, success: true, season };
  }

  return { status: 400, error: 'Unknown action' };
}

export {
  blankProgressSave,
  currentWorldReset,
  ensureAdminSchema,
  isCreator,
  sessionUser
};
