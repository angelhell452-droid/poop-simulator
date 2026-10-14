import { openCharacterInventoryModal } from './characterInventoryView.js?v=5.4.15';
import { openPrestigeModal, openTranscendModal } from './modalManager.js?v=5.4.15';
import { events } from '../core/events.js';

/**
 * Universal helper to close any currently active modal dialogs.
 * Returns true if at least one modal was closed.
 */
export function closeAllActiveModals() {
  let closedAny = false;
  document.querySelectorAll('.fixed.inset-0:not(.hidden)').forEach(modal => {
    if (modal.id === 'bootVeil' || modal.id === 'tutorialSpotlightOverlay' || modal.id === 'offlineModal') return;
    modal.classList.add('hidden');
    if (modal.id === 'patchNotesModal') events.emit('journal:closed');
    closedAny = true;
  });
  return closedAny;
}

/**
 * Checks whether user is typing inside an input, textarea, select, or contenteditable area.
 */
function isTypingContext() {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (active.isContentEditable) return true;
  return false;
}

/**
 * Initialize game navigation hotkeys.
 * - 'I' -> Toggle Inventory modal
 * - 'T' -> Open Flush (Prestige) modal
 * - 'B' -> Open Breakthrough (Transcend) modal
 * - 'F' -> Switch to Factories tab
 * - 'S' -> Switch to Boutique/Shop tab
 * - 'Escape' -> Close any open modal dialog
 */
export function initHotkeys() {
  window.addEventListener('keydown', (e) => {
    // If typing in input/chat/search, ignore letters, but let Escape blur or close
    if (isTypingContext()) {
      if (e.key === 'Escape' || e.code === 'Escape') {
        document.activeElement.blur();
        closeAllActiveModals();
      }
      return;
    }

    // Do not interfere with browser system shortcuts (Ctrl+R, Ctrl+Shift+I, Alt+Tab, etc.)
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const code = e.code;
    const key = (e.key || '').toLowerCase();

    // Escape -> Instant close of any active modal
    if (code === 'Escape' || key === 'escape') {
      e.preventDefault();
      closeAllActiveModals();
      return;
    }

    // 'I' -> Toggle Character Inventory
    if (code === 'KeyI' || key === 'i' || key === 'ш') {
      e.preventDefault();
      const invModal = document.getElementById('characterInventoryModal');
      const isInvOpen = invModal && !invModal.classList.contains('hidden');
      if (isInvOpen) {
        invModal.classList.add('hidden');
      } else {
        closeAllActiveModals();
        openCharacterInventoryModal('knives');
      }
      return;
    }

    // 'T' -> Open Flush (Prestige) Modal
    if (code === 'KeyT' || key === 't' || key === 'е') {
      e.preventDefault();
      closeAllActiveModals();
      openPrestigeModal();
      return;
    }

    // 'B' -> Open Breakthrough (Transcend) Modal
    if (code === 'KeyB' || key === 'b' || key === 'и') {
      e.preventDefault();
      closeAllActiveModals();
      openTranscendModal();
      return;
    }

    // 'F' -> Switch to Factories tab
    if (code === 'KeyF' || key === 'f' || key === 'а') {
      e.preventDefault();
      closeAllActiveModals();
      const factoryTab = document.querySelector('.dash-tab[data-target="panelFactories"]');
      if (factoryTab) factoryTab.click();
      return;
    }

    // 'S' -> Switch to Shop / Boutique tab
    if (code === 'KeyS' || key === 's' || key === 'ы') {
      e.preventDefault();
      closeAllActiveModals();
      const shopTab = document.querySelector('.dash-tab[data-target="panelShop"]');
      if (shopTab) shopTab.click();
      return;
    }
  });
}
