import { GAME } from '../core/state.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getPassiveIncome, getClickPower, getActiveBuffsList } from '../economy/production.js';
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
import { getPhaseForStage, phaseLabel } from '../progression/phases.data.js';
import { getPrestigeRewardBreakdown, executePrestige } from '../prestige/prestigeService.js';
import { getTranscendRewardBreakdown, executeTranscend } from '../prestige/transcendService.js';
import { renderEvoChronicles } from './evoChroniclesView.js';
import { updatePrestigeModalRealtime, updateTranscendModalRealtime, openPrestigeModal } from './modalManager.js';
import { showKnifeToast } from './characterInventoryView.js';

const FLUSH_COOLDOWN = 35000;
let lastEvoRenderStage = -1;


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
  if (buffH) buffH.textContent = `+${formatNumber(Math.round((GAME.hunger / 100) * 25))}% Клик`;
  const buffC = document.getElementById('buffCleanText');
  if (buffC) buffC.textContent = `+${formatNumber(Math.round((GAME.clean / 100) * 25))}% Заводы`;
  const buffHp = document.getElementById('buffHappyText');
  if (buffHp) buffHp.textContent = `+${formatNumber(Math.round((GAME.happy / 100) * 20))}% Крит`;

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
  const phase = getPhaseForStage(GAME.evoStage);
  const topStTitle = document.getElementById('topStageTitle');
  if (topStTitle) topStTitle.textContent = `Форма #${formatNumber(currEvo.id + 1)} · ${phaseLabel(phase)}`;

  const topArchBadge = document.getElementById('topArchetypeBadge');
  if (topArchBadge) {
    const arch = ARCHETYPES[GAME.archetype] || ARCHETYPES.balanced;
    topArchBadge.classList.remove('hidden');
    topArchBadge.textContent = arch.badge;
    topArchBadge.title = `Специализация Смыва: ${arch.name} (${arch.desc}). Нажмите для настройки.`;
  }
  const badgeEvo = document.getElementById('evoProgressBadge');
  if (badgeEvo) badgeEvo.textContent = `Форма ${formatNumber(currEvo.id + 1)}`;
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
    } else if (evoInfo.phaseLocked) {
      evoCostLabel.textContent = 'Дальше откроет Прорыв';
      btnEvolve.textContent = 'Эпоха закрыта';
      btnEvolve.disabled = true;
    } else {
      const buyMultiplier = GAME.buyMultiplier || 1;
      const countTxt = buyMultiplier === 'max'
        ? `+${formatNumber(evoInfo.count)} (МАКС)`
        : (buyMultiplier > 1 ? `+${formatNumber(evoInfo.count)}` : `След`);
      evoCostLabel.textContent = `${countTxt}: ${formatNumber(evoInfo.totalCost)} 💨`;
      btnEvolve.textContent = evoInfo.count > 1 ? `Мутировать x${formatNumber(evoInfo.count)}! 🧬` : `Мутировать! 🧬`;
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
      footClick.innerHTML = `${formatNumber(pwr)} <span class="text-[10px] text-yellow-300 font-normal animate-pulse">(🔥 ТУРБО x${formatNumber(GAME.archetype === 'combo' ? 6 : 4)})</span>`;
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
      rushTimerEl.textContent = `🔥 x${formatNumber(GAME.archetype === 'combo' ? 6 : 4)} (${Math.ceil(GAME.turboRushTime)}с)`;
      rushTimerEl.classList.remove('opacity-0', 'pointer-events-none');
      rushTimerEl.classList.add('opacity-100');
    }
    if (comboLbl) comboLbl.textContent = `🔥 ТУРБО x${formatNumber(GAME.archetype === 'combo' ? 6 : 4)}!`;
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
      if (skinInfo.nextAt >= 20000) {
        skinHintEl.textContent = `Форма #${formatNumber(GAME.evoStage + 1)} • облик за горизонтом`;
      } else {
        skinHintEl.textContent = `Форма #${formatNumber(GAME.evoStage + 1)} • след. облик на форме #${formatNumber(skinInfo.nextAt)}`;
      }
    }
  }

  // Quick Prestige Button Check
  const pBreakdown = getPrestigeRewardBreakdown();
  const btnQuick = document.getElementById('btnQuickPrestige');
  const btnQuickText = document.getElementById('btnQuickPrestigeText');
  if (btnQuick) {
    if (pBreakdown.isMet) {
      btnQuick.classList.remove('hidden');
      const newText = `Смыв (+${formatNumber(pBreakdown.totalGain)} 🧻)`;
      if (btnQuickText && btnQuickText.textContent !== newText) {
        btnQuickText.textContent = newText;
      }
    } else {
      btnQuick.classList.add('hidden');
    }
  }

  // Quick Transcend Button Check
  const tBreakdown = getTranscendRewardBreakdown();
  const btnQuickTrans = document.getElementById('btnQuickTranscend');
  const btnQuickTransText = document.getElementById('btnQuickTranscendText');
  if (btnQuickTrans) {
    if (tBreakdown.isMet) {
      btnQuickTrans.classList.remove('hidden');
      const newTransText = `Прорыв (+${formatNumber(tBreakdown.totalGain)} 🪠)`;
      if (btnQuickTransText && btnQuickTransText.textContent !== newTransText) {
        btnQuickTransText.textContent = newTransText;
      }
    } else {
      btnQuickTrans.classList.add('hidden');
    }
  }

  // Real-time update of Forms Panel (Task 6)
  const panelEvo = document.getElementById('panelEvo');
  if (panelEvo && !panelEvo.classList.contains('hidden')) {
    if (lastEvoRenderStage !== GAME.evoStage) {
      lastEvoRenderStage = GAME.evoStage;
      renderEvoChronicles();
    }
  }

  // Real-time update of open Prestige / Transcend Modals (Task 8)
  updatePrestigeModalRealtime();
  updateTranscendModalRealtime();

  updateActiveBuffsUI();
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

  const btnQuick = document.getElementById('btnQuickPrestige');
  if (btnQuick) {
    let lastQuickPrestigeTime = 0;
    const triggerQuickPrestige = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const now = Date.now();
      if (now - lastQuickPrestigeTime < 500) return;
      lastQuickPrestigeTime = now;

      const pBreakdown = getPrestigeRewardBreakdown();
      if (!pBreakdown.isMet) return;

      const arch = GAME.archetype || 'balanced';
      const rollsBefore = GAME.prestigeRolls || 0;
      if (executePrestige(arch)) {
        const gained = (GAME.prestigeRolls || 0) - rollsBefore;
        saveLocal();
        updateHUD();

        const overlay = document.getElementById('waterFlushOverlay');
        if (overlay) {
          overlay.style.opacity = '0.9';
          overlay.style.transition = 'opacity 0.2s ease';
          setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.6s ease';
          }, 400);
        }
        showWelcomeGreeting(`⚡ Быстрый Смыв выполнен! +${formatNumber(gained)} 🧻 Втулок Судьбы!`);
      }
    };

    btnQuick.addEventListener('pointerdown', triggerQuickPrestige);
    btnQuick.addEventListener('click', triggerQuickPrestige);
  }

  // Top Archetype Badge click to open Prestige Modal
  document.getElementById('topArchetypeBadge')?.addEventListener('click', () => {
    openPrestigeModal();
  });

  // 1-Click Fast Transcend Button listener
  const btnQuickTrans = document.getElementById('btnQuickTranscend');
  if (btnQuickTrans) {
    let lastQuickTranscendTime = 0;
    const triggerQuickTranscend = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const now = Date.now();
      if (now - lastQuickTranscendTime < 500) return;
      lastQuickTranscendTime = now;

      const tBreakdown = getTranscendRewardBreakdown();
      if (!tBreakdown.isMet) return;

      const plungersBefore = GAME.transcendPlungers || 0;
      if (executeTranscend()) {
        const gained = (GAME.transcendPlungers || 0) - plungersBefore;
        saveLocal();
        updateHUD();

        const flash = document.getElementById('rouletteFlashOverlay');
        if (flash) {
          flash.style.opacity = '0.9';
          flash.style.transition = 'opacity 0.2s ease';
          setTimeout(() => {
            flash.style.opacity = '0';
            flash.style.transition = 'opacity 0.5s ease';
          }, 350);
        }
        showWelcomeGreeting(`🌌 Быстрый Прорыв совершен! Получено: +${formatNumber(gained)} 🪠 Вантузов!`);
      }
    };

    btnQuickTrans.addEventListener('pointerdown', triggerQuickTranscend);
    btnQuickTrans.addEventListener('click', triggerQuickTranscend);
  }
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
    buffsListEl.innerHTML = `<span class="text-[10px] text-stone-500 italic">Нет активных баффов</span>`;
    return;
  }

  buffsListEl.innerHTML = buffs.map(b => `
    <button class="buff-pill px-2 py-0.5 rounded-lg border text-[10px] font-game font-bold flex items-center gap-1 transition shadow-sm jelly-btn cursor-pointer whitespace-nowrap shrink-0 ${b.badgeColor}" data-buff="${b.id}" title="Нажмите, чтобы просмотреть действие баффа">
      <span>${b.icon}</span>
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

  if (iconEl) iconEl.textContent = buff.icon;
  if (titleEl) titleEl.textContent = buff.name;
  if (badgeEl) {
    badgeEl.textContent = buff.bonusText || buff.short;
    badgeEl.className = `text-[10px] font-bold px-2 py-0.5 rounded-full border ${buff.badgeColor || 'border-yellow-400 text-yellow-300'}`;
  }
  if (descEl) descEl.textContent = buff.desc || '';
  if (progressEl) progressEl.textContent = buff.progress || 'Активен';
  if (sourceEl) sourceEl.textContent = buff.source || 'Игровой процесс';
  if (tipEl) tipEl.innerHTML = `💡 <b>Совет:</b> ${buff.tip || 'Развивайте эту механику для усиления множителя.'}`;

  modal.classList.remove('hidden');
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
    const modeLabel = GAME.autoBuyerMode === 'all' ? 'все' : 'последний';
    if (isOn) {
      buyerBtn.className = 'px-2.5 py-0.5 rounded-lg border text-[11px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-emerald-950 border-emerald-500 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.35)]';
      buyerLed.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse';
      buyerLbl.textContent = `Заводы: ВКЛ · ${modeLabel}`;
    } else {
      buyerBtn.className = 'px-2.5 py-0.5 rounded-lg border text-[11px] font-game flex items-center gap-1.5 transition shadow jelly-btn bg-stone-800 text-stone-400 border-stone-700';
      buyerLed.className = 'w-2 h-2 rounded-full bg-stone-500';
      buyerLbl.textContent = 'Заводы: ВЫКЛ';
    }
  }

  const gearBtn = document.getElementById('btnAutoBuyerGear');
  if (gearBtn) gearBtn.classList.toggle('hidden', !hasAutoBuyer);
  document.querySelectorAll('.auto-buyer-mode-btn').forEach(btn => {
    const selected = btn.dataset.buyerMode === (GAME.autoBuyerMode === 'all' ? 'all' : 'latest');
    btn.className = selected
      ? 'auto-buyer-mode-btn w-full text-left px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-cyan-900/70 text-cyan-100 border border-cyan-400/50'
      : 'auto-buyer-mode-btn w-full text-left px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-stone-200 hover:bg-stone-800 border border-transparent';
  });

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
  document.getElementById('btnAutoBuyerGear')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('autoBuyerModeMenu')?.classList.toggle('hidden');
  });
  document.querySelectorAll('.auto-buyer-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      GAME.autoBuyerMode = btn.dataset.buyerMode === 'all' ? 'all' : 'latest';
      document.getElementById('autoBuyerModeMenu')?.classList.add('hidden');
      updateAutomationTogglesUI();
      saveLocal();
    });
  });
  document.addEventListener('click', () => {
    document.getElementById('autoBuyerModeMenu')?.classList.add('hidden');
  });
  document.getElementById('btnTranscendAutoInfo')?.addEventListener('click', () => {
    document.getElementById('btnTranscendModal')?.click();
  });
}

export function showWelcomeGreeting(customText = null) {
  const name = GAME.playerName || 'Игрок';
  const text = customText || `Привет, какашечка ${name}! 💩✨`;

  const existing = document.getElementById('welcomeGreetingToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'welcomeGreetingToast';
  toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 font-game font-black text-xs sm:text-sm px-5 py-2.5 rounded-3xl shadow-[0_10px_35px_rgba(245,158,11,0.5)] border-2 border-yellow-200 flex items-center gap-2 animate-bounce select-none pointer-events-none transition-all duration-500';
  toast.innerHTML = `<span class="text-2xl">💩</span><span>${text}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -20px) scale(0.95)';
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}


