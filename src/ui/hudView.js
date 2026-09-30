import { GAME } from '../core/state.js';
import { EVOLUTIONS } from '../data/evolutions.data.js';
import { formatNumber } from '../utils/numberFormatter.js';
import { getPassiveIncome, getClickPower } from '../economy/production.js';
import { getAffordableEvoInfo } from '../economy/costs.js';
import { getNextMilestoneGoal } from '../progression/milestoneService.js';
import { liveCps } from '../core/gameLoop.js';

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

  // Buff texts
  const buffH = document.getElementById('buffHungerText');
  if (buffH) buffH.textContent = `Сытость: ${Math.round(GAME.hunger)}% (+${Math.round((GAME.hunger / 100) * 50)}% Клик)`;
  const buffC = document.getElementById('buffCleanText');
  if (buffC) buffC.textContent = `Чистота: ${Math.round(GAME.clean)}% (+${Math.round((GAME.clean / 100) * 40)}% Заводы)`;
  const buffHp = document.getElementById('buffHappyText');
  if (buffHp) buffHp.textContent = `Счастье: ${Math.round(GAME.happy)}% (x2 Комбо ${GAME.happy >= 70 ? '🔥' : ''})`;

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

  const now = Date.now();
  const flushCooldownLeft = Math.max(0, FLUSH_COOLDOWN - (now - (GAME.lastFlushTime || 0)));
  const flushReady = flushCooldownLeft === 0 && GAME.clean < 70;
  const btnQuickFlush = document.getElementById('btnQuickFlush');
  if (btnQuickFlush) btnQuickFlush.disabled = !flushReady;
  const lblFlush = document.getElementById('flushCooldownLabel');
  if (lblFlush) {
    lblFlush.textContent = flushCooldownLeft > 0 
      ? `${Math.ceil(flushCooldownLeft / 1000)}с` 
      : (GAME.clean >= 70 ? 'Слишком чисто' : 'Готов');
  }

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
  if (footClick) footClick.textContent = formatNumber(getClickPower());
  const footCps = document.getElementById('footCpsRate');
  if (footCps) {
    if (liveCps > 0) {
      footCps.textContent = `(${formatNumber(liveCps)} CPS ⚡)`;
      footCps.classList.remove('hidden');
    } else {
      footCps.classList.add('hidden');
    }
  }

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
}
