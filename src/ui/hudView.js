import { GAME } from '../core/state.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getPassiveIncome, getClickPower } from '../economy/production.js';
import { getAffordableEvoInfo } from '../economy/costs.js';
import { getNextMilestoneGoal } from '../progression/milestoneService.js';
import { liveCps } from '../core/gameLoop.js';
import { saveLocal } from '../save/saveManager.js';
import { updateFactoryButtons } from './factoryView.js';
import { updateTalentButtons } from './talentView.js';
import { updateShopButtons } from './shopView.js';
import { updateCasesButtons } from './casesView.js';
import { getPoopSkinInfo } from '../progression/evolutionService.js';

const FLUSH_COOLDOWN = 35000;

export function updateHUD() {
  const topBio = document.getElementById('topBiomass');
  if (topBio) topBio.textContent = formatNumber(GAME.biomass);

  const topSp = document.getElementById('topSparkles');
  if (topSp) topSp.textContent = formatNumber(GAME.sparkles);

  const topPr = document.getElementById('topPrestige');
  if (topPr) topPr.textContent = formatNumber(GAME.prestigeRolls);

  const topPl = document.getElementById('topPlungers');
  if (topPl) topPl.textContent = formatNumber(GAME.transcendPlungers || 0);

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
  if (buffH) buffH.textContent = `Сытость: ${Math.round(GAME.hunger)}% (+${Math.round((GAME.hunger / 100) * 50)}%)`;
  const buffC = document.getElementById('buffCleanText');
  if (buffC) buffC.textContent = `Чистота: ${Math.round(GAME.clean)}% (+${Math.round((GAME.clean / 100) * 40)}%)`;
  const buffHp = document.getElementById('buffHappyText');
  if (buffHp) buffHp.textContent = `Счастье: ${Math.round(GAME.happy)}% (x2${GAME.happy >= 70 ? '🔥' : ''})`;

  const buffIdeal = document.getElementById('buffIdealPill');
  if (buffIdeal) {
    const isIdeal = (GAME.hunger >= 90 && GAME.clean >= 90 && GAME.happy >= 90);
    buffIdeal.classList.toggle('hidden', !isIdeal);
  }

  // Buttons state validation
  const btnFeed = document.getElementById('btnFeed');
  if (btnFeed) btnFeed.disabled = GAME.hunger >= 90;
  const btnWash = document.getElementById('btnWash');
  if (btnWash) btnWash.disabled = GAME.clean >= 85;
  const btnPolish = document.getElementById('btnPolish');
  if (btnPolish) btnPolish.disabled = GAME.clean < 70;

  // Evolution Info
  const currEvo = EVOLUTIONS[GAME.evoStage] || EVOLUTIONS[0];
  const topStTitle = document.getElementById('topStageTitle');
  if (topStTitle) topStTitle.textContent = `Форма ${(currEvo.id + 1).toLocaleString()}: ${currEvo.name}`;
  const badgeEvo = document.getElementById('evoProgressBadge');
  if (badgeEvo) badgeEvo.textContent = `${(currEvo.id + 1).toLocaleString()} / 20,000`;
  const nameEvo = document.getElementById('evoStageName');
  if (nameEvo) nameEvo.textContent = currEvo.name;
  const descEvo = document.getElementById('evoStageDesc');
  if (descEvo) descEvo.textContent = currEvo.desc;

  const evoInfo = getAffordableEvoInfo();
  const btnEvolve = document.getElementById('btnEvolve');
  const evoCostLabel = document.getElementById('evoCostLabel');
  if (btnEvolve && evoCostLabel) {
    if (evoInfo.maxReached) {
      evoCostLabel.textContent = 'ВЫСШИЙ ВЛАДЫКА ОМНИВЕРСА';
      btnEvolve.textContent = 'МАКС 🏆';
      btnEvolve.disabled = true;
    } else {
      const buyMultiplier = GAME.buyMultiplier || 1;
      const countTxt = buyMultiplier === 'max'
        ? `+${evoInfo.count} (МАКС)`
        : (buyMultiplier > 1 ? `+${evoInfo.count}` : `След`);
      evoCostLabel.textContent = `${countTxt}: ${formatNumber(evoInfo.totalCost)} 💨`;
      btnEvolve.textContent = evoInfo.count > 1 ? `Мутировать x${evoInfo.count}! 🧬` : `Мутировать! 🧬`;
      btnEvolve.disabled = !evoInfo.canBuy;
    }
  }

  // Rates in footer
  const footPassive = document.getElementById('footPassiveRate');
  if (footPassive) footPassive.textContent = `+${formatNumber(getPassiveIncome())} /сек`;
  const footClick = document.getElementById('footClickPower');
  if (footClick) {
    const pwr = getClickPower();
    if (GAME.turboRushTime > 0) {
      footClick.innerHTML = `${formatNumber(pwr)} <span class="text-[10px] text-yellow-300 font-normal animate-pulse">(🔥 ТУРБО x10)</span>`;
    } else {
      footClick.textContent = formatNumber(pwr);
    }
  }
  const footCps = document.getElementById('footCpsRate');
  if (footCps) {
    if (liveCps > 0) {
      footCps.textContent = `(${formatNumber(liveCps)} CPS ⚡)`;
      footCps.classList.remove('hidden');
    } else {
      footCps.classList.add('hidden');
    }
  }

  // Combo Heat & Turbo Frenzy UI
  const rushTimerEl = document.getElementById('turboRushTimer');
  const comboLbl = document.getElementById('comboLabel');
  const comboBarEl = document.getElementById('comboBar');
  const comboIcon = document.getElementById('comboFlameIcon');

  if (GAME.turboRushTime > 0) {
    if (rushTimerEl) {
      rushTimerEl.textContent = `🔥 ТУРБО x10! (${Math.ceil(GAME.turboRushTime)}с)`;
      rushTimerEl.classList.remove('hidden');
    }
    if (comboLbl) comboLbl.textContent = '🔥 ТУРБО-РЕЖИМ x10! 🔥';
    if (comboIcon) comboIcon.textContent = '🔥';
  } else {
    if (rushTimerEl) rushTimerEl.classList.add('hidden');
    if (comboLbl) comboLbl.textContent = `ЯРОСТЬ КЛИКОВ: ${Math.round(GAME.comboHeat || 0)}%`;
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
  if (mReward) mReward.textContent = `Награда: ${mGoal.reward}`;
  const mBar = document.getElementById('milestoneProgressBar');
  if (mBar) mBar.style.width = `${mGoal.percent.toFixed(1)}%`;
  const mText = document.getElementById('milestoneProgressText');
  if (mText) mText.textContent = mGoal.progressText;
  const mBadge = document.getElementById('archetypeBadge');
  if (mBadge) mBadge.textContent = mGoal.archetypeBadge;

  // Auto-care UI state update
  updateAutocareUI();

  // Dynamic real-time buy multiplier & price responsiveness
  updateFactoryButtons();
  updateTalentButtons();
  updateShopButtons();
  updateCasesButtons();

  // Dynamic Poop Skin Badge (Ensures accurate form & tier without tab dependency)
  const skinInfo = getPoopSkinInfo(GAME.evoStage, GAME.girlyMode);
  if (skinInfo) {
    const skinIconEl = document.getElementById('poopSkinIcon');
    if (skinIconEl) skinIconEl.textContent = skinInfo.icon;
    const skinNameEl = document.getElementById('poopSkinName');
    if (skinNameEl) skinNameEl.textContent = skinInfo.name;
    const skinTierEl = document.getElementById('poopSkinTierBadge');
    if (skinTierEl) skinTierEl.textContent = `Тир ${skinInfo.tier}`;
    const skinHintEl = document.getElementById('poopSkinProgressHint');
    if (skinHintEl) {
      if (skinInfo.nextAt < 20000) {
        skinHintEl.textContent = `Форма #${GAME.evoStage + 1} • След. скин на Форме #${skinInfo.nextAt}`;
      } else {
        skinHintEl.textContent = `Форма #${GAME.evoStage + 1} • ВЫСШАЯ ФОРМА ОМНИВЕРСА!`;
      }
    }
  }
}

export function updateAutocareUI() {
  const feedBtn = document.getElementById('btnAutoFeed');
  const feedLed = document.getElementById('autoFeedLed');
  if (feedBtn && feedLed) {
    if (GAME.autoFeed) {
      feedBtn.className = 'px-2.5 py-1 rounded-xl border text-[10px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-emerald-950 border-emerald-500 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.35)]';
      feedLed.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse';
    } else {
      feedBtn.className = 'px-2.5 py-1 rounded-xl border text-[10px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 text-stone-300 border-stone-700';
      feedLed.className = 'w-2 h-2 rounded-full bg-stone-500';
    }
  }

  const washBtn = document.getElementById('btnAutoWash');
  const washLed = document.getElementById('autoWashLed');
  if (washBtn && washLed) {
    if (GAME.autoWash) {
      washBtn.className = 'px-2.5 py-1 rounded-xl border text-[10px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-cyan-950 border-cyan-500 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.35)]';
      washLed.className = 'w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse';
    } else {
      washBtn.className = 'px-2.5 py-1 rounded-xl border text-[10px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 text-stone-300 border-stone-700';
      washLed.className = 'w-2 h-2 rounded-full bg-stone-500';
    }
  }

  const tickleBtn = document.getElementById('btnAutoTickle');
  const tickleLed = document.getElementById('autoTickleLed');
  if (tickleBtn && tickleLed) {
    if (GAME.autoTickle) {
      tickleBtn.className = 'px-2.5 py-1 rounded-xl border text-[10px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-pink-950 border-pink-500 text-pink-200 shadow-[0_0_8px_rgba(236,72,153,0.35)]';
      tickleLed.className = 'w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_6px_#f472b6] animate-pulse';
    } else {
      tickleBtn.className = 'px-2.5 py-1 rounded-xl border text-[10px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 text-stone-300 border-stone-700';
      tickleLed.className = 'w-2 h-2 rounded-full bg-stone-500';
    }
  }

  const allBtn = document.getElementById('btnAutoCareAll');
  if (allBtn) {
    const allOn = GAME.autoFeed && GAME.autoWash && GAME.autoTickle;
    allBtn.textContent = allOn ? '⚡ Все ВЫКЛ' : '⚡ Все ВКЛ';
    allBtn.className = allOn
      ? 'px-2.5 py-1 rounded-xl border text-[10px] font-game bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-emerald-400 transition shadow jelly-btn shadow-[0_0_8px_rgba(16,185,129,0.4)]'
      : 'px-2.5 py-1 rounded-xl border text-[10px] font-game bg-amber-900/60 hover:bg-amber-800 text-amber-200 border-amber-600 transition shadow jelly-btn';
  }
}

export function initAutocareListeners() {
  document.getElementById('btnAutoFeed')?.addEventListener('click', () => {
    GAME.autoFeed = !GAME.autoFeed;
    updateAutocareUI();
    saveLocal();
  });
  document.getElementById('btnAutoWash')?.addEventListener('click', () => {
    GAME.autoWash = !GAME.autoWash;
    updateAutocareUI();
    saveLocal();
  });
  document.getElementById('btnAutoTickle')?.addEventListener('click', () => {
    GAME.autoTickle = !GAME.autoTickle;
    updateAutocareUI();
    saveLocal();
  });
  document.getElementById('btnAutoCareAll')?.addEventListener('click', () => {
    const allOn = GAME.autoFeed && GAME.autoWash && GAME.autoTickle;
    GAME.autoFeed = !allOn;
    GAME.autoWash = !allOn;
    GAME.autoTickle = !allOn;
    updateAutocareUI();
    saveLocal();
  });
}
