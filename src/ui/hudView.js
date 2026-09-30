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
import { updateSmartAssistant } from './smartAssistantView.js';
import { ARCHETYPES } from '../progression/archetypes.js';

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

  const lvlPrestigeTxt = `Ур. ${formatNumber(GAME.totalPrestiges || 0)}`;
  const headerPrestige = document.getElementById('headerPrestigeLvl');
  if (headerPrestige) headerPrestige.textContent = lvlPrestigeTxt;
  const masterPrestige = document.getElementById('masterPrestigeLvl');
  if (masterPrestige) masterPrestige.textContent = lvlPrestigeTxt;

  const lvlTranscendTxt = `Ур. ${formatNumber(GAME.totalTranscend || 0)}`;
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
  if (buffH) buffH.textContent = `+${Math.round((GAME.hunger / 100) * 50)}% Клик`;
  const buffC = document.getElementById('buffCleanText');
  if (buffC) buffC.textContent = `+${Math.round((GAME.clean / 100) * 40)}% Заводы`;
  const buffHp = document.getElementById('buffHappyText');
  if (buffHp) buffHp.textContent = `x2 Криты${GAME.happy >= 70 ? ' 🔥' : ''}`;

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
    if (rushTimerEl) {
      rushTimerEl.textContent = `🔥 x10 (${Math.ceil(GAME.turboRushTime)}с)`;
      rushTimerEl.classList.remove('opacity-0', 'pointer-events-none');
      rushTimerEl.classList.add('opacity-100');
    }
    if (comboLbl) comboLbl.textContent = '🔥 ТУРБО x10!';
    if (comboIcon) comboIcon.textContent = '🔥';
  } else {
    if (rushTimerEl) {
      rushTimerEl.classList.remove('opacity-100');
      rushTimerEl.classList.add('opacity-0', 'pointer-events-none');
    }
    if (comboLbl) comboLbl.textContent = `ЯРОСТЬ: ${Math.round(GAME.comboHeat || 0)}%`;
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
  const arch = ARCHETYPES[GAME.archetype] || ARCHETYPES.balanced;
  const mBadge = document.getElementById('archetypeBadge');
  if (mBadge) {
    mBadge.textContent = arch.badge;
    mBadge.title = `Активная специализация: ${arch.name} (${arch.desc}). Кликните для выбора при Смыве.`;
    mBadge.style.cursor = 'pointer';
  }


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
  updateAutomationTogglesUI();
  updateSmartAssistant();
}

export function updateAutocareUI() {
  const hasAutoCare = !!GAME.transcendUpgrades?.autoCare;

  const updatePill = (btnId, ledId, txtId, isOn, colorClass, ledColor) => {
    const btn = document.getElementById(btnId);
    const led = document.getElementById(ledId);
    const txt = document.getElementById(txtId);
    if (!btn || !led || !txt) return;

    if (!hasAutoCare) {
      btn.className = 'px-2 py-1 rounded-xl border text-[10px] font-game flex items-center justify-center gap-1 transition shadow jelly-btn bg-stone-900/90 text-stone-500 border-stone-800 hover:border-cyan-500/50 hover:text-cyan-400 cursor-pointer';
      led.className = 'w-1.5 h-1.5 rounded-full bg-stone-600';
      txt.textContent = '🔒 Авто';
      btn.title = 'Астральный Авто-Уход (Тир I Прорыва: 25 Вантузов). Нажмите, чтобы открыть Прорыв!';
    } else {
      if (isOn) {
        btn.className = `px-2 py-1 rounded-xl border text-[10px] font-game flex items-center justify-center gap-1 transition shadow jelly-btn ${colorClass} cursor-pointer`;
        led.className = `w-2 h-2 rounded-full ${ledColor} animate-pulse`;
        txt.textContent = 'Авто: ВКЛ';
        btn.title = 'Авто-действие ВКЛЮЧЕНО (нажмите для выключения)';
      } else {
        btn.className = 'px-2 py-1 rounded-xl border text-[10px] font-game flex items-center justify-center gap-1 transition shadow jelly-btn bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200 cursor-pointer';
        led.className = 'w-2 h-2 rounded-full bg-stone-500';
        txt.textContent = 'Авто: ВЫКЛ';
        btn.title = 'Авто-действие ВЫКЛЮЧЕНО (нажмите для включения)';
      }
    }
  };

  updatePill('btnAutoFeed', 'autoFeedLed', 'autoFeedText', !!GAME.autoFeed, 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.35)]', 'bg-emerald-400 shadow-[0_0_6px_#34d399]');
  updatePill('btnAutoWash', 'autoWashLed', 'autoWashText', !!GAME.autoWash, 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.35)]', 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]');
  updatePill('btnAutoTickle', 'autoTickleLed', 'autoTickleText', !!GAME.autoTickle, 'bg-pink-950 border-pink-500 text-pink-200 shadow-[0_0_8px_rgba(236,72,153,0.35)]', 'bg-pink-400 shadow-[0_0_6px_#f472b6]');
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
}

export function updateAutomationTogglesUI() {
  const hasAutoBuyer = !!GAME.transcendUpgrades?.autoBuyer;
  const hasAutoEvo = !!GAME.transcendUpgrades?.autoEvolution;
  const hasAnyAuto = hasAutoBuyer || hasAutoEvo;

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
    if (isOn) {
      buyerBtn.className = 'px-2.5 py-0.5 rounded-lg border text-[11px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-emerald-950 border-emerald-500 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.35)]';
      buyerLed.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse';
      buyerLbl.textContent = 'Заводы: ВКЛ';
    } else {
      buyerBtn.className = 'px-2.5 py-0.5 rounded-lg border text-[11px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 text-stone-400 border-stone-700';
      buyerLed.className = 'w-2 h-2 rounded-full bg-stone-500';
      buyerLbl.textContent = 'Заводы: ВЫКЛ';
    }
  }

  const evoBtn = document.getElementById('btnToggleAutoEvolution');
  const evoLed = document.getElementById('autoEvolutionLed');
  const evoLbl = document.getElementById('autoEvolutionLabel');
  if (evoBtn && evoLed && evoLbl) {
    evoBtn.classList.toggle('hidden', !hasAutoEvo);
    const isOn = GAME.autoEvolutionEnabled !== false;
    if (isOn) {
      evoBtn.className = 'px-2.5 py-0.5 rounded-lg border text-[11px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-indigo-950 border-indigo-400 text-cyan-200 shadow-[0_0_8px_rgba(99,102,241,0.35)]';
      evoLed.className = 'w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse';
      evoLbl.textContent = 'Мутации: ВКЛ';
    } else {
      evoBtn.className = 'px-2.5 py-0.5 rounded-lg border text-[11px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 text-stone-400 border-stone-700';
      evoLed.className = 'w-2 h-2 rounded-full bg-stone-500';
      evoLbl.textContent = 'Мутации: ВЫКЛ';
    }
  }
}

export function initAutomationToggleListeners() {
  document.getElementById('btnToggleAutoBuyer')?.addEventListener('click', () => {
    GAME.autoBuyerEnabled = !(GAME.autoBuyerEnabled !== false);
    updateAutomationTogglesUI();
    saveLocal();
  });
  document.getElementById('btnToggleAutoEvolution')?.addEventListener('click', () => {
    GAME.autoEvolutionEnabled = !(GAME.autoEvolutionEnabled !== false);
    updateAutomationTogglesUI();
    saveLocal();
  });
  document.getElementById('btnTranscendAutoInfo')?.addEventListener('click', () => {
    document.getElementById('btnTranscendModal')?.click();
  });
  document.getElementById('archetypeBadge')?.addEventListener('click', () => {
    document.getElementById('btnPrestigeModal')?.click();
  });
}

