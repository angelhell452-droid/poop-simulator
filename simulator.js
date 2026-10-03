/**
 * Isolated ideal-player balance sim for Poop Simulator.
 * Does not change game formulas. Run: node simulator.js
 *
 * This game has no enemy HP. "DPS" is biomass per second
 * (factory income + clicks at the character cap). "Zone" is the form and epoch.
 * The bot buys the unlocked purchase with the best income-gain / cost.
 * A flush or transcend happens only when the next form is locked and the ritual is open.
 */

import { GAME } from './src/core/state.js';
import { FACTORIES } from './src/data/factories.data.js';
import { TALENTS } from './src/data/talents.data.js';
import { getPassiveIncome, getClickPower } from './src/economy/production.js';
import { getAffordableEvoInfo, getAffordableFactoryInfo } from './src/economy/costs.js';
import { getClickCapCps } from './src/systems/autoclickService.js';
import { performEvolution } from './src/progression/evolutionService.js';
import { buyFactory } from './src/systems/factoryService.js';
import { getPrestigeRequirement, executePrestige } from './src/prestige/prestigeService.js';
import { getTranscendRequirement, executeTranscend } from './src/prestige/transcendService.js';
import { getPhaseForStage, phaseLabel } from './src/progression/phases.data.js';
import { formatNumber } from './src/utils/numberFormatter.js';

const HORIZON = Number(process.env.SIM_SECONDS) > 0 ? Number(process.env.SIM_SECONDS) : 24 * 60 * 60;
const MARKS = [
  { t: 60, title: '1 минута' },
  { t: 5 * 60, title: '5 минут' },
  { t: 15 * 60, title: '15 минут' },
  { t: 30 * 60, title: '30 минут' },
  { t: 60 * 60, title: '1 час' },
  { t: 3 * 60 * 60, title: '3 часа' },
  { t: 6 * 60 * 60, title: '6 часов' },
  { t: 12 * 60 * 60, title: '12 часов' },
  { t: 24 * 60 * 60, title: '24 часа' }
];

function resetRun() {
  GAME.biomass = 0;
  GAME.cycleBiomass = 0;
  GAME.allTimeBiomass = 0;
  GAME.sparkles = 0;
  GAME.prestigeRolls = 0;
  GAME.allTimePrestigeRolls = 0;
  GAME.transcendCycleRolls = 0;
  GAME.totalPrestiges = 0;
  GAME.transcendPlungers = 0;
  GAME.totalTranscend = 0;
  GAME.evoStage = 0;
  GAME.archetype = 'balanced';
  GAME.hunger = 100;
  GAME.clean = 100;
  GAME.happy = 100;
  GAME.buyMultiplier = 1;
  GAME.equippedKnife = null;
  GAME.phaseEcho = {};
  GAME.flushesThisCycle = 0;
  GAME.turboRushTime = 0;
  GAME.currentRunPeakGPS = 0;
  GAME.transcendUpgrades = {
    cosmicSynergy: 0,
    autoBuyer: false,
    passiveRolls: 0,
    omniMult: 0,
    afkCap: 0,
    knifeForge: 0,
    factoryOverdrive: 0,
    plungerIncubator: 0,
    meteorStorm: 0,
    evoBlessing: 0,
    autoEvolution: false,
    autoCare: false,
    singularityRift: false
  };
  TALENTS.forEach(t => { t.level = 0; });
  FACTORIES.forEach(f => { f.count = 0; });
}

function incomePerSec() {
  const passive = getPassiveIncome();
  const clicks = getClickPower() * getClickCapCps();
  const total = passive + clicks;
  return Number.isFinite(total) ? total : 0;
}

function topFactory() {
  let best = null;
  for (const fac of FACTORIES) {
    const count = fac.count || 0;
    if (!best || count > best.count) best = { name: fac.name, count, id: fac.id };
  }
  return best || { name: 'нет', count: 0, id: '' };
}

function probeFactory(fac) {
  if (fac.reqStage !== undefined && GAME.evoStage < fac.reqStage) return null;
  const info = getAffordableFactoryInfo(fac);
  const cost = info.singleCost;
  if (!Number.isFinite(cost) || cost <= 0) return null;
  const before = incomePerSec();
  fac.count = (fac.count || 0) + 1;
  const after = incomePerSec();
  fac.count -= 1;
  const gain = after - before;
  if (!(gain > 0)) return null;
  return { kind: 'factory', id: fac.id, name: fac.name, cost, gain, ratio: gain / cost, canBuy: GAME.biomass >= cost };
}

function probeEvolution() {
  const info = getAffordableEvoInfo();
  if (info.phaseLocked || info.maxReached) return { locked: true, info };
  const cost = info.totalCost;
  if (!Number.isFinite(cost) || cost <= 0) return null;
  const before = incomePerSec();
  GAME.evoStage += 1;
  const after = incomePerSec();
  GAME.evoStage -= 1;
  const gain = after - before;
  return {
    kind: 'form',
    id: 'form',
    name: `форма ${formatNumber(GAME.evoStage + 2)}`,
    cost,
    gain,
    ratio: gain > 0 ? gain / cost : 0,
    canBuy: info.canBuy
  };
}

function bestPurchase() {
  const options = [];
  for (const fac of FACTORIES) {
    const probe = probeFactory(fac);
    if (probe) options.push(probe);
  }
  const evo = probeEvolution();
  if (evo && !evo.locked && evo.gain > 0) options.push(evo);
  options.sort((a, b) => b.ratio - a.ratio);
  return { options, evo };
}

function buyBest(option) {
  if (option.kind === 'factory') return buyFactory(option.id);
  if (option.kind === 'form') return performEvolution();
  return false;
}

function formatGap(seconds) {
  if (!Number.isFinite(seconds)) return 'недоступно';
  if (seconds < 60) return `${formatNumber(Math.ceil(seconds))}с`;
  if (seconds < 3600) return `${formatNumber(Math.ceil(seconds / 60))} мин`;
  if (seconds < 86400) return `${formatNumber(Number((seconds / 3600).toFixed(1)))} ч`;
  return `${formatNumber(Number((seconds / 86400).toFixed(1)))} дн`;
}

function snapshot(second, note) {
  const phase = getPhaseForStage(GAME.evoStage);
  const owned = FACTORIES.filter(fac => (fac.count || 0) > 0)
    .map(fac => `${fac.name} x${formatNumber(fac.count)}`)
    .join(', ') || 'нет';
  const income = incomePerSec();
  const { options, evo } = bestPurchase();
  const next = options[0];
  let wait = Infinity;
  if (next && income > 0 && GAME.biomass < next.cost) wait = (next.cost - GAME.biomass) / income;
  else if (next && GAME.biomass >= next.cost) wait = 0;
  const locked = !!(evo && evo.locked);
  const grind = wait >= 3600 ? '  << ГРИНД' : '';
  const lockNote = locked ? '  [следующая форма закрыта ключом Прорыва]' : '';
  const dip = evo && !evo.locked && !(evo.gain > 0)
    ? `  [следующая форма режет доход на ${formatNumber(Math.abs(evo.gain))}/сек, цена ${formatNumber(evo.cost)}]`
    : '';
  console.log(
    `${note}: доход/сек = ${formatNumber(income)}, форма ${formatNumber(GAME.evoStage + 1)} (${phaseLabel(phase)}), ` +
    `заводы: ${owned}, биомасса = ${formatNumber(GAME.biomass)}, ` +
    `смывов ${formatNumber(GAME.totalPrestiges || 0)}, прорывов ${formatNumber(GAME.totalTranscend || 0)}, ` +
    `до лучшей покупки ${formatGap(wait)}${grind}${lockNote}${dip}`
  );
}

function resetStateForRitual(kind) {
  const phase = getPhaseForStage(GAME.evoStage);
  if (kind === 'transcend') {
    const reward = executeTranscend();
    if (!reward) return false;
    GAME.archetype = 'tycoon';
    console.log(`  >> Прорыв на ${phaseLabel(phase)}: +ключ, вантузы теперь ${formatNumber(GAME.transcendPlungers || 0)}. Забег сброшен.`);
    return true;
  }
  const form = GAME.evoStage + 1;
  const reward = executePrestige('tycoon');
  if (!reward) return false;
  console.log(`  >> Смыв на ${phaseLabel(phase)}, форма ${formatNumber(form)}: эхо эпохи, втулок ${formatNumber(GAME.prestigeRolls || 0)}. Забег сброшен, архетип Магнат.`);
  return true;
}

function ritualReady() {
  const info = getAffordableEvoInfo();
  if (!info.phaseLocked && !info.maxReached) return false;
  return getTranscendRequirement().isMet || getPrestigeRequirement().isMet;
}

function tryRitual() {
  if (!ritualReady()) return false;
  if (getTranscendRequirement().isMet) return resetStateForRitual('transcend');
  if (getPrestigeRequirement().isMet) return resetStateForRitual('flush');
  return false;
}

function buyGateForm() {
  const evo = probeEvolution();
  if (!evo || evo.locked || evo.gain > 0 || !evo.canBuy) return false;
  const before = incomePerSec();
  if (!performEvolution()) return false;
  const after = incomePerSec();
  console.log(`  >> форма-ключ: доход/сек ${formatNumber(before)} -> ${formatNumber(after)} (форма ${formatNumber(GAME.evoStage + 1)})`);
  return true;
}

function simulate(mode) {
  resetRun();
  const title = mode === 'gates'
    ? 'Прогон B. Тот же бот, но форму новой эпохи покупает даже с просадкой дохода.'
    : mode === 'pace'
      ? 'Прогон pace. Первый Смыв берётся сразу. Потом лучшая покупка по доходу на цену.'
      : 'Прогон A. Только покупки с положительным приростом дохода на единицу цены.';
  console.log(title);
  console.log('');
  let flushNoted = false;

  let second = 0;
  let markIndex = 0;
  let seenPhase = 0;
  let lastBuyAt = 0;
  let longestGap = 0;
  let purchases = 0;
  const phaseTimes = [];

  while (second < HORIZON && markIndex < MARKS.length) {
    const income = incomePerSec();
    if (!(income > 0)) {
      console.log(`Секунда ${formatNumber(second)}: доход 0, симуляция остановлена.`);
      break;
    }

    const { options, evo } = bestPurchase();
    const gate = mode === 'gates' && evo && !evo.locked && !(evo.gain > 0) ? evo : null;
    const unaffordable = options.filter(item => !item.canBuy);
    const soonest = unaffordable.reduce((best, item) => (!best || item.cost < best.cost ? item : best), null);
    const freshFactory = options.find(item => item.kind === 'factory' && !(FACTORIES.find(fac => fac.id === item.id)?.count));
    const bestDeal = mode === 'pace' && freshFactory ? freshFactory : options[0];
    const bestWait = bestDeal && income > 0 && GAME.biomass < bestDeal.cost
      ? (bestDeal.cost - GAME.biomass) / income
      : 0;
    const saveForBest = mode === 'pace' && freshFactory && !freshFactory.canBuy && bestWait > 0 && bestWait <= 90;
    let step = 1;
    const somethingToBuy = !saveForBest && (options.some(item => item.canBuy) || (gate && gate.canBuy) || ritualReady());
    if (saveForBest) {
      const untilMark = MARKS[markIndex].t - second;
      step = Math.max(1, Math.min(Math.ceil(bestWait), untilMark, HORIZON - second));
    } else if (!somethingToBuy) {
      const waits = [];
      if (soonest && income > 0 && GAME.biomass < soonest.cost) waits.push(Math.ceil((soonest.cost - GAME.biomass) / income));
      if (gate && income > 0 && GAME.biomass < gate.cost) waits.push(Math.ceil((gate.cost - GAME.biomass) / income));
      if (waits.length) {
        const untilMark = MARKS[markIndex].t - second;
        step = Math.max(1, Math.min(...waits, untilMark, HORIZON - second));
      }
    }

    GAME.biomass += income * step;
    GAME.cycleBiomass += income * step;
    GAME.allTimeBiomass += income * step;
    second += step;
    const idle = second - lastBuyAt;
    if (idle > longestGap) longestGap = idle;

    let guard = 0;
    while (guard++ < 8000) {
      const priced = bestPurchase();
      const fresh = priced.options.filter(item => item.canBuy);
      if (mode === 'pace') {
        const firstFactory = fresh.find(item => item.kind === 'factory' && !(FACTORIES.find(fac => fac.id === item.id)?.count));
        if (firstFactory) {
          if (!buyBest(firstFactory)) break;
          purchases += 1;
          lastBuyAt = second;
          continue;
        }
      }
      if (fresh.length) {
        if (!buyBest(fresh[0])) break;
        purchases += 1;
        lastBuyAt = second;
        continue;
      }
      if (mode === 'gates' && buyGateForm()) {
        purchases += 1;
        lastBuyAt = second;
        continue;
      }
      break;
    }
    if (mode === 'pace' && (GAME.totalPrestiges || 0) === 0 && getPrestigeRequirement().isMet) {
      if (resetStateForRitual('flush')) lastBuyAt = second;
    } else if (tryRitual()) lastBuyAt = second;
    if (!flushNoted && getPrestigeRequirement().isMet) {
      flushNoted = true;
      console.log(`  >> ${formatGap(second)}: Смыв уже доступен, бот его не берёт, пока следующая форма не закрыта ключом.`);
    }

    const phaseNow = getPhaseForStage(GAME.evoStage).id;
    if (phaseNow !== seenPhase) {
      seenPhase = phaseNow;
      const label = phaseLabel(getPhaseForStage(GAME.evoStage));
      phaseTimes.push({ second, phase: label, form: GAME.evoStage + 1 });
      console.log(`  >> ${formatGap(second)}: вход в ${label} (форма ${formatNumber(GAME.evoStage + 1)}), доход/сек ${formatNumber(incomePerSec())}, заработано ${formatNumber(GAME.allTimeBiomass)}`);
    }

    while (markIndex < MARKS.length && second >= MARKS[markIndex].t) {
      snapshot(MARKS[markIndex].t, MARKS[markIndex].title);
      markIndex += 1;
    }
  }

  console.log('');
  console.log('Сводка');
  console.log(`Покупок: ${formatNumber(purchases)}. Самая длинная пауза без покупки: ${formatGap(longestGap)}.`);
  if (!phaseTimes.length) console.log('Ни одна эпоха не открыта.');
  else phaseTimes.forEach(row => console.log(`Эпоха открыта на ${formatGap(row.second)}: ${row.phase}, форма ${formatNumber(row.form)}`));
}

console.log('Симулятор идеального игрока. Формулы читаются из текущей игры, файлы игры не меняются.');
console.log('Доход/сек = заводы + клики на потолке CPS. Сытость и чистота держатся на 100. Ножа нет.');
console.log('Прогон pace: первый Смыв берётся, как только мост открыт. Дальше бот покупает лучший завод и форму.');
console.log('Другие прогоны: node simulator.js strict | node simulator.js gates');
console.log('');
const mode = process.argv[2] === 'strict' || process.argv[2] === 'gates' ? process.argv[2] : 'pace';
simulate(mode);
