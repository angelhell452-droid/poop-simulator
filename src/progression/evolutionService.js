import { GAME } from '../core/state.js?v=5.0.50';
import { EVOLUTIONS, calcEvolutionCost } from '../data/evolutions.data.js?v=5.0.50';
import { TALENTS } from '../data/talents.data.js';
import { getAsymptoticDiscountFactor } from '../economy/costs.js?v=5.0.50';
import { events } from '../core/events.js';
import { notePeakForm } from './unlocks.js';
import { maxUnlockedStage } from './phases.data.js?v=5.0.50';
import { gte, isBig, mulFloor } from '../utils/big.js?v=5.0.50';

export function effectiveFormCost(stage) {
  const omegaTalent = TALENTS.find(t => t.id === 'omega_destiny');
  const unbreakEvo = TALENTS.find(t => t.id === 'unbreakable_evo');
  const omegaDisc = omegaTalent ? (1 - Math.pow(0.98, omegaTalent.level || 0)) : 0;
  const unbreakRaw = (unbreakEvo && unbreakEvo.level > 0) ? (1 - Math.pow(0.985, unbreakEvo.level)) : 0;
  const discs = [];
  if (stage >= 3999 && omegaDisc > 0) discs.push(omegaDisc);
  if (stage >= 5000 && unbreakRaw > 0) discs.push(unbreakRaw);
  return mulFloor(calcEvolutionCost(stage), getAsymptoticDiscountFactor(discs, 0.90));
}

function stageForEarnedBiomass(earned, cap) {
  let lo = 0;
  let hi = cap;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (gte(earned, effectiveFormCost(mid))) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function formBiomassCredit() {
  const earned = GAME.cycleBiomass || 0;
  if (isBig(earned)) return earned;
  return Math.max(0, earned);
}

export function syncEvolutionToBiomass() {
  const cap = Math.min(EVOLUTIONS.length - 1, maxUnlockedStage(GAME.totalTranscend || 0));
  const next = stageForEarnedBiomass(formBiomassCredit(), cap);
  if (next === (GAME.evoStage || 0)) return false;
  const before = GAME.evoStage || 0;
  GAME.evoStage = next;
  notePeakForm();
  if (next > before) {
    const target = EVOLUTIONS[next] || EVOLUTIONS[EVOLUTIONS.length - 1];
    events.emit('evolution:success', {
      count: next - before,
      targetName: target.name,
      evoStage: next
    });
  }
  return next > before;
}

export function performEvolution() {
  return syncEvolutionToBiomass();
}

export function getPoopSkinInfo(stage, isGirly) {
  let tier = 1;
  if (stage >= 18000) tier = 10;
  else if (stage >= 14500) tier = 9;
  else if (stage >= 11000) tier = 8;
  else if (stage >= 7500) tier = 7;
  else if (stage >= 4500) tier = 6;
  else if (stage >= 2500) tier = 5;
  else if (stage >= 1200) tier = 4;
  else if (stage >= 500) tier = 3;
  else if (stage >= 150) tier = 2;
  else tier = 1;

  if (isGirly) {
    const girlyTiers = [
      { id: 'girl_strawberry', name: 'Клубничная Кавайка', tier: 1, rank: 'Новичок', icon: '🍓', desc: 'Розовый клубничный завиток с милым бантиком', nextAt: 150 },
      { id: 'girl_cupcake', name: 'Сахарный Капкейк', tier: 2, rank: 'Сладость', icon: '🧁', desc: 'Воздушный крем, карамельная посыпка и вишенка', nextAt: 500 },
      { id: 'girl_fairy', name: 'Цветочная Фея', tier: 3, rank: 'Фея', icon: '🧚‍♀️', desc: 'Сияющие крылышки феи и корона из бутонов роз', nextAt: 1200 },
      { id: 'girl_magical', name: 'Аниме Махо-Сёдзё', tier: 4, rank: 'Волшебница', icon: '🪄', desc: 'Звездная палочка, золотое сердце и сияющие глазки', nextAt: 2500 },
      { id: 'girl_mermaid', name: 'Морская Русалочка', tier: 5, rank: 'Сирена', icon: '🧜‍♀️', desc: 'Перламутровый блеск жемчужин и тиара из ракушек', nextAt: 4500 },
      { id: 'girl_cyber_idol', name: 'Кибер-Айдол Каваи', tier: 6, rank: 'Звезда Сети', icon: '🎧', desc: 'Неоновые кроличьи наушники и голографический визор', nextAt: 7500 },
      { id: 'girl_valkyrie', name: 'Священная Валькирия', tier: 7, rank: 'Валькирия', icon: '🪽', desc: 'Четыре пастельных ангельских крыла и нимб', nextAt: 11000 },
      { id: 'girl_empress', name: 'Звездная Императрица', tier: 8, rank: 'Императрица', icon: '👑', desc: 'Галактический шлейф и орбитальные планеты', nextAt: 14500 },
      { id: 'girl_love_goddess', name: 'Богиня Вселенской Любви', tier: 9, rank: 'Богиня', icon: '💖', desc: 'Радужные крылья бабочки и бесконечные сердца', nextAt: 18000 },
      { id: 'girl_omega_queen', name: 'Омега-Королева Омниверса', tier: 10, rank: 'Абсолют', icon: '🌟', desc: 'Священная корона бесконечности и сверхсветовая аура', nextAt: 100000 }
    ];
    return girlyTiers[tier - 1];
  } else {
    const boysTiers = [
      { id: 'boy_rookie', name: 'Какашич-Новичок', tier: 1, rank: 'Новичок', icon: '💩', desc: 'Глянцевый классический завиток с выразительными глазами', nextAt: 150 },
      { id: 'boy_gamer_pro', name: 'Геймер-Профи', tier: 2, rank: 'Стример', icon: '🎮', desc: 'Синяя бандана, игровые наушники с микрофоном', nextAt: 500 },
      { id: 'boy_gladiator', name: 'Спартанский Гладиатор', tier: 3, rank: 'Воин', icon: '🛡️', desc: 'Золотой шлем с красным гребнем и боевой шрам', nextAt: 1200 },
      { id: 'boy_cyber_shinobi', name: 'Кибер-Синоби', tier: 4, rank: 'Ниндзя', icon: '🥷', desc: 'Маска скрытности, протектор Конохи и вихрь сюрикенов', nextAt: 2500 },
      { id: 'boy_mecha_terminator', name: 'Меха-Терминатор Т-8000', tier: 5, rank: 'Киборг', icon: '🤖', desc: 'Титановый экзоскелет, красный глаз-лазер и пушка', nextAt: 4500 },
      { id: 'boy_molten_demon', name: 'Повелитель Лавы', tier: 6, rank: 'Демон Вулькана', icon: '🔥', desc: 'Изогнутые рога обсидиана и огненные трещины магмы', nextAt: 7500 },
      { id: 'boy_shadow_monarch', name: 'Теневой Владыка Бездны', tier: 7, rank: 'Монарх Тьмы', icon: '🔮', desc: 'Фиолетовая теневая аура и горящие аметистовые очи', nextAt: 11000 },
      { id: 'boy_dragon_sovereign', name: 'Галактический Дракон', tier: 8, rank: 'Повелитель Драконов', icon: '🐉', desc: 'Драконьи рога, энергетическое ядро и пламя звезд', nextAt: 14500 },
      { id: 'boy_thunder_god', name: 'Титан Грома и Бури', tier: 9, rank: 'Бог Молний', icon: '⚡', desc: 'Корона из молний, электрические искры и синий разряд', nextAt: 18000 },
      { id: 'boy_omega_god', name: 'Абсолютный Бог Омниверса', tier: 10, rank: 'Создатель Миров', icon: '🌌', desc: 'Вращающийся золотой нимб, 6 крыльев и вихрь творения', nextAt: 100000 }
    ];
    return boysTiers[tier - 1];
  }
}
