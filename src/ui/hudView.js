import { GAME } from '../core/state.js?v=5.0.79';
import { EVOLUTIONS } from '../data/evolutions.data.js?v=5.0.79';
import { formatNumber } from '../utils/numberFormatter.js?v=5.0.79';
import { drawPlunger } from '../utils/icons.js?v=5.0.79';
import { getPassiveIncome, getClickPower, getClickBreakdown, getPassiveBreakdown, getActiveBuffsList, getTurboClickMult } from '../economy/production.js?v=5.0.79';
import { getAffordableEvoInfo } from '../economy/costs.js?v=5.0.79';
import { effectiveFormCost, formBiomassCredit } from '../progression/evolutionService.js?v=5.0.79';
import { getNextMilestoneGoal } from '../progression/milestoneService.js';
import { liveCps } from '../core/gameLoop.js?v=5.0.79';
import { saveLocal } from '../save/saveManager.js?v=5.0.79';
import { updateFactoryButtons } from './factoryView.js?v=5.0.79';
import { updateTalentButtons } from './talentView.js?v=5.0.79';
import { updateShopButtons } from './shopView.js';
import { updateCasesButtons } from './casesView.js?v=5.0.79';
import { updateSmartAssistant } from './smartAssistantView.js?v=5.0.79';
import { ARCHETYPES } from '../progression/archetypes.js';
import { getPhaseForStage, phaseLabel } from '../progression/phases.data.js?v=5.0.79';
import { isBoutiqueUnlocked, isCasesUnlocked, isRelicSectionUnlocked, notePeakForm, peakForm } from '../progression/unlocks.js';
import { updatePrestigeModalRealtime, updateTranscendModalRealtime, openPrestigeModal, openTranscendModal } from './modalManager.js?v=5.0.79';
import { getPrestigeRewardBreakdown } from '../prestige/prestigeService.js?v=5.0.79';
import { getTranscendRewardBreakdown } from '../prestige/transcendService.js?v=5.0.79';
import { showKnifeToast } from './characterInventoryView.js?v=5.0.79';
import { getConfirmedVip } from '../economy/pace.js';
import { t, onLocaleChange } from '../i18n/t.js';
import { archetypeBadge, archetypeDesc, archetypeName, evolutionDisplayDesc, evolutionDisplayName } from '../i18n/localize.js';

const FLUSH_COOLDOWN = 35000;

function escRate(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function openRateBreakdown(sheet) {
  const modal = document.getElementById('rateBreakdownModal');
  if (!modal || !sheet) return;
  const title = document.getElementById('rateBreakdownTitle');
  const rows = document.getElementById('rateBreakdownRows');
  const total = document.getElementById('rateBreakdownTotal');
  if (title) title.textContent = sheet.title || '';
  if (rows) {
    rows.innerHTML = (sheet.rows || []).map((row) => {
      if (row.kind === 'head') {
        return `<div class="pt-2 text-[10px] uppercase tracking-wide text-stone-500">${escRate(row.name)}</div>`;
      }
      const tone = row.detail ? 'text-stone-500' : 'text-stone-200';
      return `<div class="flex justify-between gap-3 ${tone}"><span>${escRate(row.name)}</span><b class="tabular-nums text-emerald-300 shrink-0">${escRate(row.text)}</b></div>`;
    }).join('');
  }
  if (total) total.textContent = sheet.total || '';
  modal.classList.remove('hidden');
}

function bindRateClicks() {
  const passiveBtn = document.getElementById('btnFootPassive');
  if (passiveBtn && !passiveBtn.dataset.bound) {
    passiveBtn.dataset.bound = '1';
    passiveBtn.addEventListener('click', () => openRateBreakdown(getPassiveBreakdown()));
  }
  const clickBtn = document.getElementById('btnFootClick');
  if (clickBtn && !clickBtn.dataset.bound) {
    clickBtn.dataset.bound = '1';
    clickBtn.addEventListener('click', () => openRateBreakdown(getClickBreakdown()));
  }
}


export function updateHUD() {
  const vipBadge = document.getElementById('headerVipBadge');
  if (vipBadge) {
    const vip = getConfirmedVip();
    vipBadge.textContent = vip > 0 ? `VIP ${formatNumber(vip)}` : '';
    vipBadge.classList.toggle('hidden', vip <= 0);
  }

  const topBio = document.getElementById('topBiomass');
  if (topBio) topBio.textContent = formatNumber(GAME.biomass);

  const topSp = document.getElementById('topSparkles');
  if (topSp) topSp.textContent = formatNumber(GAME.sparkles);
  const invSp = document.getElementById('invSparkles');
  if (invSp) invSp.textContent = `${formatNumber(GAME.sparkles)} ✨`;

  const topPr = document.getElementById('topPrestige');
  if (topPr) topPr.textContent = formatNumber(GAME.prestigeRolls);

  const topPl = document.getElementById('topPlungers');
  if (topPl) topPl.textContent = formatNumber(GAME.transcendPlungers || 0);

  const lvlPrestigeTxt = t('hud.lvl', { n: formatNumber(GAME.totalPrestiges || 0) });
  const headerPrestige = document.getElementById('headerPrestigeLvl');
  if (headerPrestige) headerPrestige.textContent = lvlPrestigeTxt;
  const masterPrestige = document.getElementById('masterPrestigeLvl');
  if (masterPrestige) masterPrestige.textContent = lvlPrestigeTxt;

  const lvlTranscendTxt = t('hud.lvl', { n: formatNumber(GAME.totalTranscend || 0) });
  const headerTranscend = document.getElementById('headerTranscendLvl');
  if (headerTranscend) headerTranscend.textContent = lvlTranscendTxt;
  const masterTranscend = document.getElementById('masterTranscendLvl');
  if (masterTranscend) masterTranscend.textContent = lvlTranscendTxt;


  // Needs bars & numbers
  const txtH = document.getElementById('txtHunger');
  if (txtH) txtH.textContent = Math.round(GAME.hunger) + '%';
  const barH = document.getElementById('barHunger');
  if (barH) barH.style.width = GAME.hunger + '%';

  const txtC = document.getElementById('txtClean');
  if (txtC) txtC.textContent = Math.round(GAME.clean) + '%';
  const barC = document.getElementById('barClean');
  if (barC) barC.style.width = GAME.clean + '%';

  const txtHp = document.getElementById('txtHappy');
  if (txtHp) txtHp.textContent = Math.round(GAME.happy) + '%';
  const barHp = document.getElementById('barHappy');
  if (barHp) barHp.style.width = GAME.happy + '%';

  // Buff texts (Concise & zero jitter)
  const buffH = document.getElementById('buffHungerText');
  if (buffH) buffH.textContent = `+${formatNumber(Math.round((GAME.hunger / 100) * 25))}${t('hud.buffClick')}`;
  const buffC = document.getElementById('buffCleanText');
  if (buffC) buffC.textContent = `+${formatNumber(Math.round((GAME.clean / 100) * 25))}${t('hud.buffFactories')}`;
  const buffHp = document.getElementById('buffHappyText');
  if (buffHp) buffHp.textContent = `+${formatNumber(Math.round((GAME.happy / 100) * 20))}${t('hud.buffCrit')}`;

  const buffIdeal = document.getElementById('buffIdealPill');
  if (buffIdeal) {
    const isIdeal = (GAME.hunger >= 90 && GAME.clean >= 90 && GAME.happy >= 90);
    buffIdeal.classList.toggle('hidden', !isIdeal);
  }

  // Buttons state validation
  const meterFull = (value) => Math.round(value) >= 100;
  const btnFeed = document.getElementById('btnFeed');
  if (btnFeed) btnFeed.disabled = meterFull(GAME.hunger);
  const btnWash = document.getElementById('btnWash');
  if (btnWash) btnWash.disabled = meterFull(GAME.clean);
  const btnTickle = document.getElementById('btnTickle');
  if (btnTickle) btnTickle.disabled = meterFull(GAME.happy);

  // Evolution Info
  const currEvo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];
  const phase = getPhaseForStage(GAME.evoStage);
  const topStTitle = document.getElementById('topStageTitle');
  if (topStTitle) {
    topStTitle.textContent = t('hud.formTitle', {
      n: formatNumber(currEvo.id + 1),
      phase: phaseLabel(phase)
    });
  }

  const topArchBadge = document.getElementById('topArchetypeBadge');
  if (topArchBadge) {
    const arch = ARCHETYPES[GAME.archetype] || ARCHETYPES.balanced;
    topArchBadge.classList.remove('hidden');
    topArchBadge.textContent = archetypeBadge(arch);
    topArchBadge.title = t('hud.archTitle', { name: archetypeName(arch), desc: archetypeDesc(arch) });
  }
  const nameEvo = document.getElementById('evoStageName');
  if (nameEvo) {
    nameEvo.textContent = t('hud.formName', {
      n: formatNumber(currEvo.id + 1),
      name: evolutionDisplayName(currEvo)
    });
  }
  const descEvo = document.getElementById('evoStageDesc');
  if (descEvo) descEvo.textContent = evolutionDisplayDesc(currEvo);

  const evoInfo = getAffordableEvoInfo();
  const evoFill = document.getElementById('evoXpFill');
  const evoLabel = document.getElementById('evoXpLabel');
  const evoLeft = document.getElementById('evoXpLeft');
  if (evoFill && evoLabel) {
    const stage = GAME.evoStage || 0;
    const earned = formBiomassCredit();
    const needsBreak = evoInfo.phaseLocked === true;
    evoLabel.classList.toggle('evo-xp-gate', needsBreak);
    if (evoInfo.maxReached) {
      evoFill.style.width = '100%';
      evoLabel.textContent = t('hud.evoMax');
      if (evoLeft) evoLeft.textContent = '';
    } else if (needsBreak) {
      evoFill.style.width = '100%';
      evoLabel.textContent = t('hud.evoNeedTranscend');
      if (evoLeft) evoLeft.textContent = '';
    } else {
      const floorCost = stage <= 0 ? 0 : effectiveFormCost(stage);
      const nextCost = effectiveFormCost(stage + 1);
      const span = Math.max(1, nextCost - floorCost);
      const into = Math.max(0, Math.min(span, earned - floorCost));
      const left = Math.max(0, span - into);
      const pct = Math.max(0, Math.min(100, (into / span) * 100));
      evoFill.style.width = `${pct}%`;
      evoLabel.textContent = `${formatNumber(into)} / ${formatNumber(span)}`;
      if (evoLeft) evoLeft.textContent = t('hud.evoLeft', { n: formatNumber(left) });
    }
  }

  bindRateClicks();

  // Rates in footer
  const footPassive = document.getElementById('footPassiveRate');
  if (footPassive) footPassive.textContent = t('hud.perSec', { n: formatNumber(getPassiveIncome()) });
  const footClick = document.getElementById('footClickPower');
  if (footClick) footClick.textContent = formatNumber(getClickPower());
  const footCps = document.getElementById('footCpsRate');
  if (footCps) {
    if (liveCps > 0) {
      footCps.textContent = `(${formatNumber(liveCps)} CPS ⚡)`;
      footCps.classList.remove('opacity-0');
      footCps.classList.add('opacity-100');
    } else {
      footCps.classList.remove('opacity-100');
      footCps.classList.add('opacity-0');
    }
  }

  // Combo Heat & Turbo Frenzy UI (Zero-jitter layout)
  const rushTimerEl = document.getElementById('turboRushTimer');
  const comboLbl = document.getElementById('comboLabel');
  const comboBarEl = document.getElementById('comboBar');
  const comboIcon = document.getElementById('comboFlameIcon');

  if (GAME.turboRushTime > 0) {
    const turboShown = getTurboClickMult();
    const starLeft = GAME.turboStarMultTime || 0;
    const starNote = starLeft > 0
      ? t('hud.starSec', { n: formatNumber(Math.ceil(starLeft)) })
      : t('hud.turboSec', { n: formatNumber(Math.ceil(GAME.turboRushTime)) });
    if (rushTimerEl) {
      rushTimerEl.textContent = `🔥 x${formatNumber(turboShown)}${starNote}`;
      rushTimerEl.classList.remove('opacity-0', 'pointer-events-none');
      rushTimerEl.classList.add('opacity-100');
    }
    if (comboLbl) comboLbl.textContent = t('hud.turbo', { n: formatNumber(turboShown) });
    if (comboIcon) comboIcon.textContent = starLeft > 0 ? '⭐' : '🔥';
  } else {
    if (rushTimerEl) {
      rushTimerEl.classList.remove('opacity-100');
      rushTimerEl.classList.add('opacity-0', 'pointer-events-none');
    }
    if (comboLbl) comboLbl.textContent = t('hud.rage', { n: Math.round(GAME.comboHeat || 0) });
    if (comboIcon) comboIcon.textContent = (GAME.comboHeat > 50) ? '⚡' : '💤';
  }
  if (comboBarEl) comboBarEl.style.width = `${Math.min(100, Math.round(GAME.comboHeat || 0))}%`;

  // Milestone Tracker Bar
  const mGoal = getNextMilestoneGoal();
  const mTitle = document.getElementById('milestoneTitle');
  if (mTitle) mTitle.textContent = mGoal.title;
  const mIcon = document.getElementById('milestoneIcon');
  if (mIcon) mIcon.textContent = mGoal.icon;
  const mReward = document.getElementById('milestoneRewardText');
  if (mReward) mReward.textContent = t('hud.reward', { n: mGoal.reward });
  const mBar = document.getElementById('milestoneProgressBar');
  if (mBar) mBar.style.width = `${mGoal.percent.toFixed(1)}%`;
  const mText = document.getElementById('milestoneProgressText');
  if (mText) mText.textContent = mGoal.progressText;


  // Auto-care UI state update
  updateAutocareUI();

  // Dynamic real-time buy multiplier & price responsiveness
  updateFactoryButtons();
  updateTalentButtons();
  updateShopButtons();
  updateCasesButtons();

  // Dynamic Poop Skin Badge (Ensures accurate form & tier without tab dependency)
  const epoch = getPhaseForStage(GAME.evoStage || 0);
  const epochForm = (GAME.evoStage || 0) + 1;
  const epochSpan = Math.max(1, epoch.formEnd - epoch.formStart + 1);
  const epochLeft = Math.max(0, epoch.formEnd - epochForm);
  const epochNameEl = document.getElementById('poopSkinName');
  if (epochNameEl) epochNameEl.textContent = t('hud.epoch', { n: formatNumber(epoch.id) });
  const epochFillEl = document.getElementById('epochScaleFill');
  if (epochFillEl) {
    const pct = Math.max(0, Math.min(100, ((epochForm - epoch.formStart) / epochSpan) * 100));
    epochFillEl.style.width = pct <= 0 ? '0%' : `max(4px, ${pct}%)`;
  }
  const epochHintEl = document.getElementById('poopSkinProgressHint');
  if (epochHintEl) {
    if (epoch.id >= 200) epochHintEl.textContent = t('hud.epochLast');
    else if (epochLeft <= 0) epochHintEl.textContent = t('hud.epochNext', { n: formatNumber(epoch.id + 1) });
    else epochHintEl.textContent = t('hud.epochIn', { n: formatNumber(epochLeft) });
  }

  // Real-time update of open Prestige / Transcend Modals (Task 8)
  updatePrestigeModalRealtime();
  updateTranscendModalRealtime();
  paintActionGlow();

  notePeakForm();
  paintProgressTabs();
  updateActiveBuffsUI();
  updateAutomationTogglesUI();
  updateSmartAssistant();
}

export function updateAutocareUI() {
  const hasAutoCare = !!GAME.transcendUpgrades?.autoCare;

  const updatePill = (btnId, ledId, txtId, isOn) => {
    const btn = document.getElementById(btnId);
    const led = document.getElementById(ledId);
    const txt = document.getElementById(txtId);
    if (!btn || !led || !txt) return;

    btn.className = 'jelly-btn need-auto';
    led.className = 'need-led';
    if (!hasAutoCare) {
      btn.classList.add('is-locked');
      txt.textContent = '🔒';
      btn.title = t('hud.astralCareTitle');
    } else if (isOn) {
      btn.classList.add('is-on');
      led.classList.add('is-on');
      txt.textContent = t('hud.autoOn');
      btn.title = t('hud.autoOnTitle');
    } else {
      txt.textContent = t('hud.autoOff');
      btn.title = t('hud.autoOffTitle');
    }
  };

  updatePill('btnAutoFeed', 'autoFeedLed', 'autoFeedText', !!GAME.autoFeed);
  updatePill('btnAutoWash', 'autoWashLed', 'autoWashText', !!GAME.autoWash);
  updatePill('btnAutoTickle', 'autoTickleLed', 'autoTickleText', !!GAME.autoTickle);
}

export function initAutocareListeners() {
  const handleAutoClick = (propName) => {
    if (!GAME.transcendUpgrades?.autoCare) {
      document.getElementById('transcendModal')?.classList.remove('hidden');
      return;
    }
    GAME[propName] = !GAME[propName];
    updateAutocareUI();
    saveLocal();
  };

  document.getElementById('btnAutoFeed')?.addEventListener('click', () => handleAutoClick('autoFeed'));
  document.getElementById('btnAutoWash')?.addEventListener('click', () => handleAutoClick('autoWash'));
  document.getElementById('btnAutoTickle')?.addEventListener('click', () => handleAutoClick('autoTickle'));

  document.getElementById('topArchetypeBadge')?.addEventListener('click', () => {
    openPrestigeModal();
  });
}

let lastBuffsSignature = '';

export function updateActiveBuffsUI() {
  const buffsListEl = document.getElementById('activeBuffsList');
  if (!buffsListEl) return;

  const buffs = getActiveBuffsList();
  const sig = buffs.map(b => `${b.id}:${b.short}`).join('|');
  if (sig === lastBuffsSignature) return;
  lastBuffsSignature = sig;

  if (buffs.length === 0) {
    buffsListEl.innerHTML = `<span class="buff-pill px-2 py-0.5 rounded-full border border-stone-600/50 text-[10px] font-bold text-stone-400">${t('hud.quiet')}</span>`;
    return;
  }

  buffsListEl.innerHTML = buffs.map(b => `
    <button class="buff-pill px-2 py-0.5 rounded-lg border text-[10px] font-game font-bold flex items-center gap-1 transition shadow-sm jelly-btn cursor-pointer whitespace-nowrap shrink-0 ${b.badgeColor}" data-buff="${b.id}" title="${t('hud.buffTipTitle')}">
      <span>${drawPlunger(b.icon)}</span>
      <span>${b.short}</span>
    </button>
  `).join('');

  buffsListEl.querySelectorAll('.buff-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const buffId = btn.dataset.buff;
      const bObj = getActiveBuffsList().find(x => x.id === buffId);
      if (bObj) showBuffDetailsModal(bObj);
    });
  });
}

export function showBuffDetailsModal(buff) {
  const modal = document.getElementById('buffDetailsModal');
  if (!modal) return;

  const iconEl = document.getElementById('buffModalIcon');
  const titleEl = document.getElementById('buffModalTitle');
  const badgeEl = document.getElementById('buffModalBadge');
  const descEl = document.getElementById('buffModalDesc');
  const progressEl = document.getElementById('buffModalProgress');
  const sourceEl = document.getElementById('buffModalSource');
  const tipEl = document.getElementById('buffModalTip');

  if (iconEl) iconEl.innerHTML = drawPlunger(buff.icon);
  if (titleEl) titleEl.textContent = buff.name;
  if (badgeEl) {
    badgeEl.textContent = buff.bonusText || buff.short;
    badgeEl.className = `text-[10px] font-bold px-2 py-0.5 rounded-full border ${buff.badgeColor || 'border-yellow-400 text-yellow-300'}`;
  }
  if (descEl) descEl.textContent = buff.desc || '';
  if (progressEl) progressEl.innerHTML = drawPlunger(buff.progress || t('hud.buffActive'));
  if (sourceEl) sourceEl.textContent = buff.source || t('hud.buffSource');
  if (tipEl) tipEl.textContent = t('hud.tip', { tip: buff.tip || t('hud.buffTip') });

  modal.classList.remove('hidden');
}

function paintProgressTabs() {
  const casesBtn = document.querySelector('.dash-tab[data-target="panelCases"]');
  const shopBtn = document.querySelector('.dash-tab[data-target="panelShop"]');
  const relicBtn = document.getElementById('tabTalentsTranscend');
  if (casesBtn) {
    casesBtn.classList.toggle('opacity-45', !isCasesUnlocked());
    casesBtn.title = isCasesUnlocked() ? t('hud.cases') : t('hud.casesLocked');
  }
  if (shopBtn) {
    shopBtn.classList.toggle('opacity-45', !isBoutiqueUnlocked());
    shopBtn.title = isBoutiqueUnlocked()
      ? t('hud.boutique')
      : t('hud.boutiqueLocked', { n: formatNumber(100), peak: formatNumber(peakForm()) });
  }
  if (relicBtn) {
    const open = isRelicSectionUnlocked();
    relicBtn.classList.remove('hidden');
    relicBtn.classList.toggle('opacity-60', !open);
    relicBtn.title = open ? t('hud.relics') : t('hud.relicsLocked');
    const label = document.getElementById('relicTabLabel');
    if (label) label.textContent = open ? t('hud.relics') : t('hud.relicsLockedLabel');
  }
}

export function updateAutomationTogglesUI() {
  const hasAutoBuyer = !!GAME.transcendUpgrades?.autoBuyer;
  const hasAnyAuto = hasAutoBuyer;

  const lockedNotice = document.getElementById('transcendAutoLockedNotice');
  const controls = document.getElementById('transcendAutoControls');
  if (lockedNotice) lockedNotice.classList.toggle('hidden', hasAnyAuto);
  if (controls) controls.classList.toggle('hidden', !hasAnyAuto);

  const buyerBtn = document.getElementById('btnToggleAutoBuyer');
  const buyerLed = document.getElementById('autoBuyerLed');
  const buyerLbl = document.getElementById('autoBuyerLabel');
  if (buyerBtn && buyerLed && buyerLbl) {
    buyerBtn.classList.toggle('hidden', !hasAutoBuyer);
    const isOn = GAME.autoBuyerEnabled !== false;
    const modeLabel = GAME.autoBuyerMode === 'smart' ? t('hud.buyerSmart') : t('hud.buyerLatest');
    if (isOn) {
      buyerBtn.className = 'px-2.5 py-0.5 rounded-lg border text-[11px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-emerald-950 border-emerald-500 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.35)]';
      buyerLed.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse';
      buyerLbl.textContent = t('hud.buyerOn', { mode: modeLabel });
    } else {
      buyerBtn.className = 'px-2.5 py-0.5 rounded-lg border text-[11px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 text-stone-400 border-stone-700';
      buyerLed.className = 'w-2 h-2 rounded-full bg-stone-500';
      buyerLbl.textContent = t('hud.buyerOff');
    }
  }

  const gearBtn = document.getElementById('btnAutoBuyerGear');
  if (gearBtn) gearBtn.classList.toggle('hidden', !hasAutoBuyer);
  document.querySelectorAll('.auto-buyer-mode-btn').forEach(btn => {
    const selected = btn.dataset.buyerMode === (GAME.autoBuyerMode === 'smart' ? 'smart' : 'latest');
    btn.className = selected
      ? 'auto-buyer-mode-btn w-full text-left px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-cyan-900/70 text-cyan-100 border border-cyan-400/50'
      : 'auto-buyer-mode-btn w-full text-left px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-stone-200 hover:bg-stone-800 border border-transparent';
  });

}

function paintReady(button, kind) {
  if (!button) return;
  button.classList.toggle('glow-gold', kind === 'gold');
  button.classList.toggle('glow-green', kind === 'green');
}

function paintActionGlow() {
  const flush = getPrestigeRewardBreakdown();
  const flushReady = !!(flush.isMet && flush.totalGain > 0);
  const flushForBridge = flushReady && flush.countsForBridge && !flush.pairSealed;
  paintReady(document.getElementById('btnCanvasPrestige'), flushForBridge ? 'green' : (flushReady ? 'gold' : ''));
  paintReady(document.getElementById('btnExecutePrestige'), flushForBridge ? 'green' : (flushReady ? 'gold' : ''));

  const bridge = getTranscendRewardBreakdown();
  const bridgeReady = !!bridge.isMet;
  paintReady(document.getElementById('btnCanvasTranscend'), bridgeReady ? 'gold' : '');
  paintReady(document.getElementById('btnExecuteTranscend'), bridgeReady ? 'gold' : '');
}

export function initAutomationToggleListeners() {
  document.getElementById('btnToggleAutoBuyer')?.addEventListener('click', () => {
    GAME.autoBuyerEnabled = !(GAME.autoBuyerEnabled !== false);
    updateAutomationTogglesUI();
    saveLocal();
  });
  document.getElementById('btnAutoBuyerGear')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('autoBuyerModeMenu')?.classList.toggle('hidden');
  });
  document.querySelectorAll('.auto-buyer-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      GAME.autoBuyerMode = btn.dataset.buyerMode === 'smart' ? 'smart' : 'latest';
      document.getElementById('autoBuyerModeMenu')?.classList.add('hidden');
      updateAutomationTogglesUI();
      saveLocal();
    });
  });
  document.addEventListener('click', () => {
    document.getElementById('autoBuyerModeMenu')?.classList.add('hidden');
  });
  document.getElementById('transcendAutoLockedNotice')?.addEventListener('click', () => {
    openTranscendModal();
  });
}

export function showWelcomeGreeting(customText = null) {
  const name = GAME.playerName || t('hud.player');
  const text = customText || t('hud.hello', { name });
  const slot = document.getElementById('journalWelcome');
  if (!slot) return;
  slot.textContent = text;
  slot.classList.remove('hidden');
}

let hudLocaleHooked = false;
export function initHudI18n() {
  if (hudLocaleHooked) return;
  hudLocaleHooked = true;
  onLocaleChange(() => {
    lastBuffsSignature = '';
    updateHUD();
  });
}


