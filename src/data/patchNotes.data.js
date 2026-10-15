import { PATCH_NOTES_ARCHIVE } from './patchNotesArchive.data.js?v=5.4.27';

export const PATCH_NOTES = [
  {
    version: 'v5.4.27 PRO',
    date: '16 Октября 2026',
    dateEn: 'October 16, 2026',
    title: 'Патч 5.4.27: Обучение и скидки кейсов',
    titleEn: 'Patch 5.4.27: Training & Case Discounts',
    badge: 'Патч 5.4.27',
    badgeEn: 'Patch 5.4.27',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🎒',
        text: 'Свежий игрок видит по центру «Начать обучение!»; квест на метеорит перед первым кейсом (метеор вызывается при фокусе); скидка −90% на 1-ю покупку кейса #1 и −10% на первую покупку #2/#3. Рулетка кейсов не перекрывает виджет квеста.',
        textEn: 'New players get a centered “Start Training!” CTA; meteor quest now comes before the first case (forced spawn on focus); −90% off case #1 first buy and −10% off cases #2/#3 first buy. Case roulette no longer covers the quest widget.'
      }
    ]
  },
  {
    version: 'v5.4.26 PRO',
    date: '15 Октября 2026',
    dateEn: 'October 15, 2026',
    title: 'Патч 5.4.26: Превью без клипа',
    titleEn: 'Patch 5.4.26: Preview Without Clip',
    badge: 'Патч 5.4.26',
    badgeEn: 'Patch 5.4.26',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'ui',
        icon: '✨',
        text: 'Строки добычи в превью кейса: только внутреннее свечение, без filter/внешнего ореола у радужных — обрезка по краю скролла убрана.',
        textEn: 'Case preview loot rows: inset glow only; rainbow filter/outer bloom disabled so the scroll edge no longer clips light.'
      }
    ]
  },
  {
    version: 'v5.4.25 PRO',
    date: '15 Октября 2026',
    dateEn: 'October 15, 2026',
    title: 'Патч 5.4.25: Свечение без обрезки',
    titleEn: 'Patch 5.4.25: Glow Without Clipping',
    badge: 'Патч 5.4.25',
    badgeEn: 'Patch 5.4.25',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'ui',
        icon: '✨',
        text: 'Превью кейса шире; у строк добычи свечение внутри карточки (inset), без внешнего ореола — больше не режется скролл-рамкой.',
        textEn: 'Case preview is wider; loot rows use inset glow only — no outer bloom clipped by the scroll edge.'
      }
    ]
  },
  {
    version: 'v5.4.24 PRO',
    date: '15 Октября 2026',
    dateEn: 'October 15, 2026',
    title: 'Патч 5.4.24: Джекпот-праздник',
    titleEn: 'Patch 5.4.24: Jackpot Celebration',
    badge: 'Патч 5.4.24',
    badgeEn: 'Patch 5.4.24',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'ui',
        icon: '🔥',
        text: 'При выпадении джекпота кейса (1%) — отдельный фанфар, усиленное конфетти и крупная надпись «ДЖЕКПОТ». В превью кейса свечение редкости больше не обрезается рамкой списка.',
        textEn: 'Case jackpot (1%) now plays a special fanfare, stronger confetti, and a big “JACKPOT” title. Case preview rarity glow no longer clips against the list edge.'
      }
    ]
  },
  {
    version: 'v5.4.23 PRO',
    date: '15 Октября 2026',
    dateEn: 'October 15, 2026',
    title: 'Патч 5.4.23: Заточка без вайпа',
    titleEn: 'Patch 5.4.23: Sharpen Without Wipe',
    badge: 'Патч 5.4.23',
    badgeEn: 'Patch 5.4.23',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '⭐',
        text: 'Фейл заточки больше не сбрасывает на ★1 — только −1★ (с защитой ★ сохраняется). Таланты по-прежнему могут дать до 100% на низких ★, но с ★11+ шанс падает, к ★20–25 рулетка снова жёстче (пол 45%).',
        textEn: 'Sharpen fail no longer resets to ★1 — only −1★ (with protection ★ stays). Talents can still reach 100% on low ★, but from ★11+ chance drops and ★20–25 is harder again (45% floor).'
      }
    ]
  },
  {
    version: 'v5.4.22 PRO',
    date: '15 Октября 2026',
    dateEn: 'October 15, 2026',
    title: 'Патч 5.4.22: Блестяшки от ножа',
    titleEn: 'Patch 5.4.22: Sparkles From Knife',
    badge: 'Патч 5.4.22',
    badgeEn: 'Patch 5.4.22',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '✨',
        text: 'Доход ✨ с критов и метеоритов больше не растёт от эпохи/прорыва/CPS формы — только от экипированного ножа (+звёзды). Свой кейс фармится легче следующего. Золотой метеор ≈ 8–15 критов того же ножа (для всех; VIP лишь автосбор).',
        textEn: 'Crit/meteor ✨ no longer scale with epoch/breakthrough/form CPS — only equipped knife (+stars). Your case farms easier than the next. Golden meteor ≈ 8–15 crits of the same knife (everyone; VIP only auto-collects).'
      }
    ]
  },
  {
    version: 'v5.4.21 PRO',
    date: '15 Октября 2026',
    dateEn: 'October 15, 2026',
    title: 'Патч 5.4.21: КПС ножа ≠ клик/с',
    titleEn: 'Patch 5.4.21: Knife Income ≠ Click/s',
    badge: 'Фикс 5.4.21',
    badgeEn: 'Fix 5.4.21',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'fix',
        icon: '🖱️',
        text: 'Развели пассив к заводам и бонус к потолку кликов: больше никаких «+4B CPS» на карточке. Потолок клик/с остаётся 300; в UI отдельно % заводов и +N клик/с.',
        textEn: 'Split factory passive from click-cap bonus: no more fake “+4B CPS” on knife cards. Click/s hard cap stays 300; UI shows factory % and +N click/s separately.'
      }
    ]
  },
  {
    version: 'v5.4.20 PRO',
    date: '15 Октября 2026',
    dateEn: 'October 15, 2026',
    title: 'Патч 5.4.20: Форма × нож окна',
    titleEn: 'Patch 5.4.20: Form Cost × Window Knife',
    badge: 'Патч 5.4.20',
    badgeEn: 'Patch 5.4.20',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🗡️',
        text: 'Цена формы масштабируется джекпотом кейса текущего прорыва: слабый нож тормозит рост форм, джекпот ≈ нормальный темп, звёзды/заточка всё ещё дают преимущество.',
        textEn: 'Form cost scales with the current breakthrough case jackpot: a weak knife slows form climb, jackpot ≈ designed pace, stars/sharpen still help.'
      }
    ]
  },
  {
    version: 'v5.4.19 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.19: Золото и темп после прорыва',
    titleEn: 'Patch 5.4.19: Golden Glow & Post-BT Pace',
    badge: 'Патч 5.4.19',
    badgeEn: 'Patch 5.4.19',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'ui',
        icon: '✨',
        text: 'Вернули мягкое золотое свечение «Идеал» (тонкий rim). Автоклик-turbo по-прежнему без засветки.',
        textEn: 'Restored soft Ideal golden glow (thin rim). Autoclick turbo still does not wash the sprite.'
      },
      {
        type: 'balance',
        icon: '📈',
        text: 'Цена формы теперь учитывает множитель формы (evo.mult) — как и доход. Окно 2k→3k после прорыва больше не пролетает за секунды.',
        textEn: 'Form cost now scales with form multiplier (evo.mult), matching income. The 2k→3k post-breakthrough window no longer melts in seconds.'
      }
    ]
  },
  {
    version: 'v5.4.17 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.17: Какашка не мигает',
    titleEn: 'Patch 5.4.17: Pet No Longer Fades',
    badge: 'Фикс 5.4.17',
    badgeEn: 'Fix 5.4.17',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'fix',
        icon: '✨',
        text: 'Искры автоклика больше не оставляют прозрачность на какашке — globalAlpha сбрасывается каждый кадр.',
        textEn: 'Autoclick sparks no longer leave the pet transparent — globalAlpha resets every frame.'
      }
    ]
  },
  {
    version: 'v5.4.16 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.16: Без жёлтого Идеала',
    titleEn: 'Patch 5.4.16: No Ideal Yellow Wash',
    badge: 'Фикс 5.4.16',
    badgeEn: 'Fix 5.4.16',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'ui',
        icon: '💩',
        text: 'Аура «Идеал» отключена (авто-уход держал её всегда и желтил спрайт). Короткий glow только у звёздного турбо с метеора.',
        textEn: 'Ideal aura disabled (auto-care kept it forever and yellow-washed the sprite). Brief glow only for meteor star turbo.'
      }
    ]
  },
  {
    version: 'v5.4.15 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.15: Аура без засветки',
    titleEn: 'Patch 5.4.15: Aura Without Washout',
    badge: 'Фикс 5.4.15',
    badgeEn: 'Fix 5.4.15',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'ui',
        icon: '💡',
        text: 'Жёлтая аура больше не заливает какашку при автоклике: turbo rush отключён от glow, остался тонкий rim для Идеала / звёздного турбо.',
        textEn: 'Yellow aura no longer washes out the pet under autoclick: turbo rush unlinked from glow; soft rim only for Ideal / star turbo.'
      }
    ]
  },
  {
    version: 'v5.4.14 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.14: Без взрыва блестяшек',
    titleEn: 'Patch 5.4.14: No Sparkle Explosion',
    badge: 'Фикс 5.4.14',
    badgeEn: 'Fix 5.4.14',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'fix',
        icon: '✨',
        text: 'Криты/метеоры больше не считают ✨ от полного пассива (турбо×стаки×смывы). Только model CPS формы — не будет скачка в миллионы около формы 500.',
        textEn: 'Crits/meteors no longer scale ✨ from full passive (turbo×stacks×flushes). Only form model CPS — no multi-million spike around form 500.'
      },
      {
        type: 'fix',
        icon: '☄️',
        text: 'Метеорный purse берёт текущую эпоху формы, а не maxUnlockedForm после прорыва.',
        textEn: 'Meteor purse uses the current form epoch, not maxUnlockedForm after breakthrough.'
      }
    ]
  },
  {
    version: 'v5.4.13 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.13: Смывы / ножи T2',
    titleEn: 'Patch 5.4.13: Flushes / T2 Knives',
    badge: 'Баланс 5.4.13',
    badgeEn: 'Balance 5.4.13',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🧻',
        text: 'Требование смывов к прорыву снижено вдвое (1-й прорыв: 5, дальше ceil(legacy/2) — было 25 → 13).',
        textEn: 'Breakthrough flush requirement halved (1st: 5, then ceil(legacy/2) — was 25 → 13).'
      },
      {
        type: 'balance',
        icon: '🗡️',
        text: 'Ножи кейсов: убран общий early-floor, из‑за которого T1=T2. Теперь джекпот T2 (pass 8) строго выше T1 (pass 5).',
        textEn: 'Case knives: removed shared early floor that made T1=T2. T2 jackpot (pass 8) is now strictly above T1 (pass 5).'
      }
    ]
  },
  {
    version: 'v5.4.12 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.12: Формы vs автозаводы',
    titleEn: 'Patch 5.4.12: Forms vs Auto-Factories',
    badge: 'Баланс 5.4.12',
    badgeEn: 'Balance 5.4.12',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🏭',
        text: 'Авто-MAX заводов больше не пролетает формы: formBuySeconds 25→90, softcap копий (knee 8), порог формы масштабируется BreakthroughBoost. Штраф ножа не трогали.',
        textEn: 'Auto-MAX factories no longer skip forms: formBuySeconds 25→90, copy softcap (knee 8), form thresholds scale with BreakthroughBoost. Knife penalty unchanged.'
      }
    ]
  },
  {
    version: 'v5.4.11 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.11: Цены кейсов от стека ✨',
    titleEn: 'Patch 5.4.11: Case Prices from Sparkle Stack',
    badge: 'Баланс 5.4.11',
    badgeEn: 'Balance 5.4.11',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🧮',
        text: 'Цена кейса = 72% ожидаемого стека блестяшек к этому прорыву. Якорь: ~40k к форме 1000 → кейс #2 ≈ 28.8k (остаток на перки). Рост по BT из epoch × CPS^0.55 × нож.',
        textEn: 'Case cost = 72% of expected sparkle stack at that breakthrough. Anchor: ~40k at form 1000 → case #2 ≈ 28.8k (room for perks). Per-BT growth from epoch × CPS^0.55 × knife.'
      }
    ]
  },
  {
    version: 'v5.4.10 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.10: Кейсы строго по прорывам',
    titleEn: 'Patch 5.4.10: Cases Strictly by Breakthrough',
    badge: 'Баланс 5.4.10',
    badgeEn: 'Balance 5.4.10',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '📦',
        text: 'Строго 1 кейс = 1 прорыв: кейс #1 при BT 0, кейс #2 при BT 1 / форма 1001, и так далее. Больше нет трёх кейсов на Прорыв 0.',
        textEn: 'Strictly 1 case = 1 breakthrough: case #1 at BT 0, case #2 at BT 1 / form 1001, and so on. No more three cases at Breakthrough 0.'
      },
      {
        type: 'balance',
        icon: '💎',
        text: 'Цены кейсов подняты (база 3200 ✨): один early-метеор больше не покупает кейс. Промо первого открытия = −50% от реальной цены.',
        textEn: 'Case prices raised (base 3200 ✨): one early meteor no longer buys a case. First-open promo = −50% of the real price.'
      }
    ]
  },
  {
    version: 'v5.4.9 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.9: Кейсы = прорывы',
    titleEn: 'Patch 5.4.9: Cases = Breakthroughs',
    badge: 'Баланс 5.4.9',
    badgeEn: 'Balance 5.4.9',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '📦',
        text: 'Кейсы: 3 онбординг, дальше строго 1 кейс на 1 прорыв (форма +1000). Цена из economy.config, без 2.76^tier.',
        textEn: 'Cases: 3 onboarding, then strictly 1 case per breakthrough (+1000 forms). Costs from economy.config, no more 2.76^tier.'
      },
      {
        type: 'balance',
        icon: '🗡️',
        text: 'Сила ножей из пула кейса синхронизируется с тиром (K^0.25) — джекпот не обгоняет завод того же индекса.',
        textEn: 'Case-pool knife power syncs to tier (K^0.25) — jackpot no longer outruns the paired factory.'
      },
      {
        type: 'balance',
        icon: '✨',
        text: 'Блестяшки: CPS-exponent 0.55 и epochBase 1.35 — late-game приток ближе к биомассе, не наравне с ней.',
        textEn: 'Sparkles: CPS exponent 0.55 and epochBase 1.35 — late-game inflow no longer matches biomass.'
      },
      {
        type: 'balance',
        icon: '🪐',
        text: 'Нерф реликвий: Эссенция x1.15 (max 10), Резонатор +0.03, Капитал/Шторм/Инкубатор/Оффлайн/Омни/Архивариус ослаблены.',
        textEn: 'Relic nerfs: Infinity Essence x1.15 (max 10), Resonator +0.03, Capital/Storm/Incubator/Offline/Omni/Archivist toned down.'
      },
      {
        type: 'ui',
        icon: '👑',
        text: 'Аура «Идеал» только при уходе/турбо; шапка больше не прыгает на кадре моргания.',
        textEn: 'Ideal aura only with care/turbo; hat no longer jumps on the blink frame.'
      }
    ]
  },
  {
    version: 'v5.4.8 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.8: Метеоры без краша',
    titleEn: 'Patch 5.4.8: Meteors Without Crash',
    badge: 'Фикс 5.4.8',
    badgeEn: 'Fix 5.4.8',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'fix',
        icon: '☄️',
        text: 'Вернули импорт gte в petCanvasView — ловля золотых метеоров больше не сыпет ReferenceError в консоль каждый тик.',
        textEn: 'Restored gte import in petCanvasView — catching golden meteors no longer spams ReferenceError every tick.'
      },
      {
        type: 'ui',
        icon: '✨',
        text: 'Автоклик: попапы дохода реже мигают — throttle и обновление текста на месте.',
        textEn: 'Autoclick earn popups blink less — longer throttle and in-place text refresh.'
      }
    ]
  },
  {
    version: 'v5.4.7 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.7: Криты без +0',
    titleEn: 'Patch 5.4.7: Crits Without +0',
    badge: 'Фикс 5.4.7',
    badgeEn: 'Fix 5.4.7',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'fix',
        icon: '💥',
        text: 'Попапы крита и блестяшек: сравнение/накопление через big.js (gt/add) — больше нет «КРИТ! +0» на late-game Big-числах.',
        textEn: 'Crit and sparkle popups use big.js gt/add — no more “CRIT! +0” when gains are Big objects.'
      }
    ]
  },
  {
    version: 'v5.4.6 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.6: Большие числа везде',
    titleEn: 'Patch 5.4.6: Big Numbers Everywhere',
    badge: 'Фикс 5.4.6',
    badgeEn: 'Fix 5.4.6',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'fix',
        icon: '♾️',
        text: 'Infinity больше не схлопывается в 0: rehydrateBig/promote, смыв 1.18^N через bigPow — буст и доход снова видны на тысячах смывов.',
        textEn: 'Infinity no longer collapses to 0: rehydrateBig promote + flush 1.18^N via bigPow — boost and income stay visible at thousands of flushes.'
      },
      {
        type: 'fix',
        icon: '✨',
        text: 'Блестяшки и метеоры считают CPS^0.8 через Big pow10; кошелёк/трата через gainBio/spendBio.',
        textEn: 'Sparkles and meteors scale CPS^0.8 via Big pow10; wallet add/spend uses gainBio/spendBio.'
      },
      {
        type: 'fix',
        icon: '💾',
        text: 'Сейв хранит sparkles/rolls/biomass как scientific Big; загрузка больше не обнуляет втулки из‑за isFinite(Big).',
        textEn: 'Saves store sparkles/rolls/biomass as scientific Big; load no longer wipes rolls via isFinite(Big).'
      }
    ]
  },
  {
    version: 'v5.4.5 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.5: Прорыв без пролёта форм',
    titleEn: 'Patch 5.4.5: Breakthrough Without Form Skip',
    badge: 'Фикс 5.4.5',
    badgeEn: 'Fix 5.4.5',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'fix',
        icon: '🔒',
        text: 'На Прорыве излишек cycleBiomass кэпится до порога текущей формы — больше нет мгновенного пролёта сотен уровней.',
        textEn: 'On Breakthrough, excess cycleBiomass is capped to the current form threshold — no more instant skip of hundreds of forms.'
      },
      {
        type: 'ui',
        icon: '📊',
        text: 'Полоска формы считает span через big.js — больше нет NaN и ложного «0» на прогрессе.',
        textEn: 'Form XP bar uses big.js for span — no more NaN or false “0” on the progress label.'
      },
      {
        type: 'fix',
        icon: '🛡️',
        text: 'calcEvolutionCost защищён от Infinity/NaN (flushMult через bigPow), чтобы цена не схлопывалась в 1.',
        textEn: 'calcEvolutionCost guards against Infinity/NaN (flushMult via bigPow) so form cost cannot collapse to 1.'
      }
    ]
  },
  {
    version: 'v5.4.4 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.4: Полная цена формы',
    titleEn: 'Patch 5.4.4: Full Form Cost',
    badge: 'Баланс 5.4.4',
    badgeEn: 'Balance 5.4.4',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '⚖️',
        text: 'Цена формы снова полный пакет ~formBuySeconds CPS: порог — сумма уровней, K=3.8 масштабирует сложность вперёд, а не микродельту соседних форм.',
        textEn: 'Form cost is again a full ~formBuySeconds CPS pack: threshold is the sum of levels; K=3.8 scales difficulty ahead, not tiny neighbor deltas.'
      }
    ]
  },
  {
    version: 'v5.4.3 PRO',
    date: '14 Октября 2026',
    dateEn: 'October 14, 2026',
    title: 'Патч 5.4.3: Идеальная Гармония',
    titleEn: 'Patch 5.4.3: Ideal Harmony',
    badge: 'Баланс 5.4.3',
    badgeEn: 'Balance 5.4.3',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '⚖️',
        text: 'Единая ось в economy.config.js: заводы и формы на K=3.8, смывы на flushPowerBase^N, блестяшки ∝ CPS^0.8.',
        textEn: 'One axis in economy.config.js: factories and forms use K=3.8, flushes use flushPowerBase^N, sparkles scale with CPS^0.8.'
      },
      {
        type: 'fix',
        icon: '🔒',
        text: 'Кейс нельзя открыть раньше своей формы: peakForm() строго >= reqForm.',
        textEn: 'Cases cannot open early: peakForm() must be >= reqForm.'
      },
      {
        type: 'ui',
        icon: '📦',
        text: 'На кейсе показывается форма и прорыв по оси гармонии (шаг ~1100 форм после онбординга).',
        textEn: 'Case cards show harmony form and breakthrough (~1100 form steps after onboarding).'
      }
    ]
  },
  {
    version: 'v5.4.2 PRO',
    date: '13 Октября 2026',
    dateEn: 'October 13, 2026',
    title: 'Патч 5.4.2: Ручки блестяшек и форма на кейсах',
    titleEn: 'Patch 5.4.2: Sparkle Knobs and Case Form Labels',
    badge: 'Баланс 5.4.2',
    badgeEn: 'Balance 5.4.2',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '✨',
        text: 'Множитель блестяшек за эпоху снижен до x1.5. Ручки крита и метеорита собраны в economy.config.js.',
        textEn: 'Sparkle growth per epoch is now x1.5. Crit and meteor knobs live in economy.config.js.'
      },
      {
        type: 'ui',
        icon: '📦',
        text: 'На каждом кейсе видна целевая форма и прорыв: Форма 1.9k · Прорыв 2.',
        textEn: 'Every case shows its target form and breakthrough, e.g. Form 1.9k · Breakthrough 2.'
      }
    ]
  },
  {
    version: 'v5.4.1 PRO',
    date: '13 Октября 2026',
    dateEn: 'October 13, 2026',
    title: 'Патч 5.4.1: Блестяшки по эпохам и лестница ножей',
    titleEn: 'Patch 5.4.1: Epoch Sparkles and the Knife Ladder',
    badge: 'Баланс 5.4.1',
    badgeEn: 'Balance 5.4.1',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '✨',
        text: 'Блестяшки с критов и метеоритов растут в x1.74 за эпоху. Кейс покупается около формы, на которой открылся, а не на тысячи форм позже.',
        textEn: 'Crit and meteor sparkles now grow by x1.74 per epoch, so a case is affordable near the form that unlocks it.'
      },
      {
        type: 'balance',
        icon: '🔪',
        text: 'Ножи с «Феникса» по «Гамму 1» выстроены лестницей: обычный нож нового кейса сильнее джекпота предыдущего, джекпот внутри кейса около x4.',
        textEn: 'Knives from Phoenix through Gamma 1 are a ladder: the common drop beats the previous jackpot, and a jackpot is about x4 its own common knife.'
      },
      {
        type: 'ui',
        icon: '🔢',
        text: 'Числа от 10k показывают десятую: 191.5k больше не выглядит как уже взятые 192k.',
        textEn: 'Numbers from 10k keep one decimal, so 191.5k no longer looks like the 192k goal is already reached.'
      }
    ]
  },
  {
    version: 'v5.4.0 PRO',
    date: '12 Октября 2026',
    dateEn: 'October 12, 2026',
    title: 'Патч 5.4.0: 🔐 Полноэкранное Лобби, Single-Device KV и Защита Сейвов',
    titleEn: 'Patch 5.4.0: Fullscreen Lobby, Single-Device KV Sessions & Anti-Wipe Authority',
    badge: '🔐 SINGLE DEVICE & LOBBY',
    badgeEn: 'SINGLE DEVICE & LOBBY',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🚪',
        text: 'Полноэкранное Лобби: Полностью удалён гостевой режим. Вход и регистрация теперь встречают игрока на стильном стартовом экране с фоновой предзагрузкой ассетов.',
        textEn: 'Fullscreen Lobby: Guest mode fully eliminated. Clean lobby handles authentication while preloading assets in the background.'
      },
      {
        type: 'feature',
        icon: '📱',
        text: 'Один аккаунт — одно устройство: Cloudflare KV хранит активную сессию (UUIDv4 HttpOnly Cookie). Вход со второго устройства безопасно приостанавливает сессию на первом.',
        textEn: 'One Account — One Device: Cloudflare KV tracks active UUIDv4 sessions. Concurrent logins pause stale devices with instant reconnect support.'
      },
      {
        type: 'feature',
        icon: '⚠️',
        text: 'Модальное окно 401 Interrupted: При входе с другого устройства игра мягко ставится на паузу с возможностью мгновенного переподключения без перезагрузки (F5).',
        textEn: '401 Interrupted Modal: Graceful blur modal allowing seamless one-click reconnect without page reload.'
      },
      {
        type: 'fix',
        icon: '🛡️',
        text: 'Абсолютная защита сейвов: Ключи LocalStorage изолированы по ID игрока (saveGame_${user_id}). Клиент загружает облачный сейв первым и защищён от перезаписи через last_updated 409 Conflict.',
        textEn: 'Ironclad Save Protection: User-isolated LocalStorage keys, server-first save authority, and timestamp-based 409 Conflict protection.'
      }
    ]
  },
  {
    version: 'v5.3.7 PRO',
    date: '12 Октября 2026',
    dateEn: 'October 12, 2026',
    title: 'Патч 5.3.7: 🛡️ Strict Server Authority, Защита от Вайп-Рассинхрона и Мягкая Перезагрузка',
    titleEn: 'Patch 5.3.7: Strict Server Authority, Anti-Wipe Desync & Soft Reload Countdown',
    badge: '🛡️ STRICT AUTHORITY',
    badgeEn: 'STRICT AUTHORITY',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🛡️',
        text: 'Strict Server Authority: Внедрена двухфазная валидация версий (worldReset и patchVersion). Полные вайпы базы и штатные патчи теперь изолированы друг от друга.',
        textEn: 'Strict Server Authority: Two-phase version enforcement (worldReset & patchVersion) isolating global wipes from standard patches.'
      },
      {
        type: 'feature',
        icon: '📡',
        text: 'Блокирующий Хэндшейк: Клиент опрашивает сервер ДО инициализации механик и чтения LocalStorage. При обнаружении вайпа старый локальный сейв немедленно очищается без шанса перезаписать базу данных.',
        textEn: 'Blocking Handshake: Client validates authority prior to save reading. Server wipes trigger instant clean resets without resurrecting stale data.'
      },
      {
        type: 'feature',
        icon: '⏱️',
        text: 'Мягкая Перезагрузка (5 минут): Фоновый опрос каждые 60с и при выходе из сна (visibilitychange) выводит плашку обратного отсчёта до обновления. При патче локальный прогресс надёжно сохраняется.',
        textEn: 'Soft Reload (5 Minutes): Background 60s & visibility watcher alerts players with a countdown. Local progress remains safe during patches.'
      },
      {
        type: 'fix',
        icon: '🪠',
        text: 'Исправление Буста Прорывов: Синхронизирована бесконечная формула дохода в движке и модальном окне с полным учётом реликвии "Космический Резонатор" и таланта "Экспоненциальный Взлом".',
        textEn: 'Breakthrough Boost Sync: Unified formula calculation between engine and modal including Cosmic Resonator relic and Exponential Hack talent.'
      }
    ]
  },
  {
    version: 'v5.3.6 PRO',
    date: '12 Октября 2026',
    dateEn: 'October 12, 2026',
    title: 'Патч 5.3.6: 🗡️ Глобальная Система Редкостей, Джекпот 1% и Карусель x3',
    titleEn: 'Patch 5.3.6: Global Weapon Rarity Overhaul, 1% Jackpot & Multi-Open Carousel',
    badge: '🗡️ ГЛОБАЛЬНЫЕ РЕДКОСТИ',
    badgeEn: 'GLOBAL RARITY',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🌌',
        text: '14 Глобальных Редкостей: Ножи классифицируются по абсолютной силе (Обычный → Необычный → Редкий → Мифический → Эпический → Легендарный → Тайный → Радужный → Божественный → Титановый → Космический → Квантовый → Невозможный → Абсолютный) с уникальными CSS-анимациями (золотое пламя, глитч, кислотная пульсация, неоновое ядро, жидкий металл).',
        textEn: '14 Global Rarities: All 225 knives are now ranked by absolute power across 14 tiers with rich custom shader effects.'
      },
      {
        type: 'ui',
        icon: '🔥',
        text: 'Пульсирующий Джекпот (1%): Дроп 1% в каждом кейсе получил статус Джекпота с динамическим внешним свечением под цвет редкости и яркой плашкой "🔥 ДЖЕКПОТ (1%)".',
        textEn: 'Pulsing 1% Jackpot: The 1% drop in every case is now marked as Jackpot with dynamic pulsing aura and glowing badge.'
      },
      {
        type: 'ui',
        icon: '🎠',
        text: 'Карусель наград при Мульти-открытии (x3): Окно победы при открытии 3 кейсов получило удобный слайдер с кнопками ◀/▶ и точками навигации для детального просмотра и экипировки любого из полученных ножей.',
        textEn: 'Multi-Open Carousel (x3): Victory modal now features interactive carousel arrows and dots to inspect all 3 won blades.'
      },
      {
        type: 'balance',
        icon: '✨',
        text: 'Буст множителей и гладкий CPS: Множители блестяшек и клика увеличены в среднем на +50% начиная со 2-го Тира кейсов. Правило перекрытия статов (50% дроп n-го кейса превосходит 13% дроп предыдущего) соблюдено на 100%.',
        textEn: 'Stat Rebalance & Overlap Guarantee: Sparkle and click multipliers boosted by +50% from Tier 2 up, with strict 50% >= 13% stat handoffs.'
      },
      {
        type: 'fix',
        icon: '🐛',
        text: 'Устранение плато 99.9k: Исправлено искусственное плато клик-бонуса — теперь сила клика плавно и бесконечно масштабируется через Big.js без ограничений.',
        textEn: '99.9k Click Cap Fixed: Knife click multipliers scale infinitely via Big.js without hardcoded caps.'
      }
    ]
  },
  {
    version: 'v5.3.5 PRO',
    date: '12 Октября 2026',
    dateEn: 'October 12, 2026',
    title: 'Патч 5.3.5: 👑 Прогрессивный Буст Блестяшек и Визуализация VIP-Автосбора',
    titleEn: 'Patch 5.3.5: Progressive Sparkle Scaling & VIP Auto-Collection Visuals',
    badge: '👑 VIP & БЛЕСТЯШКИ',
    badgeEn: 'VIP & SPARKLES',
    badgeClass: 'bg-amber-500/20 text-yellow-300 border-yellow-400/40',
    changes: [
      {
        type: 'balance',
        icon: '⚔️',
        text: 'Прогрессивные Блестяшки с Критов: Дроп Блестяшек за критический клик теперь динамически масштабируется от Прорывов (+25% за Прорыв), текущей Эпохи (+10% за Эпоху) и Звезд заточки ножа (+5% за уровень). Больше никаких 2-4 блестяшек на высоких формах — клики дают достойные десятки и сотни ✨!',
        textEn: 'Progressive Crit Sparkle Scaling: Sparkle gains per critical strike now dynamically scale with Breakthroughs (+25% per breakthrough), current Epoch (+10% per epoch), and knife sharpen stars (+5% per star).'
      },
      {
        type: 'balance',
        icon: '🌟',
        text: '100% Гарантированный Дроп с Метеоритов: Все без исключения Звездные метеориты теперь гарантированно выдают Блестяшки ✨ в дополнение к своим супер-бонусам (Турбо-х4, Взрыв биомассы, Рулоны престижа или джекпот x2).',
        textEn: '100% Guaranteed Meteor Sparkles: Every Golden Meteor is now guaranteed to shower the player in Sparkles ✨ alongside its secondary super-bonus.'
      },
      {
        type: 'ui',
        icon: '👑',
        text: 'Визуализация VIP-Автосбора: При автоматическом поглощении метеоритов VIP-Пассом на экране появляется яркая плашка "👑 VIP АВТОСБОР (+XX.Xk ✨)" и расходится золотая ударная волна поглощения, которую больше не затирает поток автокликера.',
        textEn: 'VIP Auto-Collection Visuals: Automatic meteor harvesting via VIP Pass now displays a dedicated glowing capsule banner and expanding golden shockwave, immune to autoclicker flood.'
      }
    ]
  },
  {
    version: 'v5.3.4 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.3.4: 🌟 Перебалансировка Дерева Талантов и 3x Буст Блестяшек',
    titleEn: 'Patch 5.3.4: Talent Tree Rebalance & 3x Sparkle Drop Boost',
    badge: '🌟 РЕБАЛАНС ТАЛАНТОВ',
    badgeEn: 'TALENT REBALANCE',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🧬',
        text: 'Перевод Тира 1 на Проценты: Таланты Тира 1 больше не дают плоских прибавок. "Генетический Клик" теперь дает +5% к итоговой силе ручного клика за уровень. "Промышленный Сплав" дает +8% к глобальной силе абсолютно всех Авто-заводов за уровень. "Тяжелый Метеорит" усилен до +5% Блестяшек ✨ с каждого метеорита за уровень.',
        textEn: 'Tier 1 Percentage Overhaul: Removed flat base bonuses. "Genetic Click" now grants +5% to final manual click power per level. "Industrial Alloy" grants +8% to global power of all Auto-factories per level. "Heavy Meteor" boosted to +5% Sparkles ✨ from meteors per level.'
      },
      {
        type: 'balance',
        icon: '🛡️',
        text: 'Защита Экономики и Апгрейд Тира 2: Талант "Остаточная биомасса" получил жесткий кап 10 уровней (0/10) и дает +1.5% возврата за уровень (макс. 15%), полностью устраняя уязвимость бесплатных заводов. Талант "Гардероб силы" усилен до +10% к пассивным множителям Шапок и Одежды за уровень.',
        textEn: 'Economy Safety & Tier 2 Upgrade: "Residual Biomass" capped at 10 levels (0/10) with +1.5% refund per level (max 15%), completely eliminating the free factory exploit. "Wardrobe of Might" boosted to +10% to passive multipliers of Hats and Outfits per level.'
      },
      {
        type: 'balance',
        icon: '✨',
        text: 'Глобальный 3x Буст Блестяшек ✨: Базовый объем Блестяшек со всех метеоритов навсегда увеличен ровно в 3 раза по всей игре для окупаемости кейсов и VIP-автосборщика.',
        textEn: 'Global 3x Sparkle Drop Boost: Base Sparkle volume from all meteors is permanently tripled across the entire game, optimizing case costs and VIP auto-collection.'
      }
    ]
  },
  {
    version: 'v5.3.3 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.3.3: ⚡ Устранение Ошибки Синхронизации (ReferenceError isBig) и Полная Починка Ладдера',
    titleEn: 'Patch 5.3.3: Sync ReferenceError Fix & Ladder Data Pipeline Restoration',
    badge: '⚡ ФИКС СИНХРОНИЗАЦИИ',
    badgeEn: 'SYNC FIX',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
    changes: [
      {
        type: 'fix',
        icon: '⚡',
        text: 'Починка Консольной Ошибки (F12): Устранена критическая ошибка "ReferenceError: isBig is not defined" в cloudSync.js, которая полностью блокировала отправку прогресса в облако каждые 2.5 секунды.',
        textEn: 'Console Error Resolved: Fixed "ReferenceError: isBig is not defined" in cloudSync.js that completely blocked cloud sync payloads from dispatching.'
      },
      {
        type: 'fix',
        icon: '🔄',
        text: 'Мгновенный Синхрон Смывов: Реальные Смывы, Прорывы и Формы теперь бесперебойно улетают на сервер и моментально отражаются в Топе.',
        textEn: 'Instant Flush Sync: Real Flush count, Breakthroughs, and Forms now upload seamlessly and update the Hall of Fame in real time.'
      }
    ]
  },
  {
    version: 'v5.3.2 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.3.2: 🏆 Глобальный Фикс Топ-Ладдера и Разблокировка Облачной Синхронизации',
    titleEn: 'Patch 5.3.2: Global Hall of Fame Fix & Cloud Sync Unblocking',
    badge: '🏆 ФИКС ЛАДДЕРА',
    badgeEn: 'LADDER FIX',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    changes: [
      {
        type: 'fix',
        icon: '🏆',
        text: 'Починка Зала Славы: Исправлена вычитка Прорывов, Смывов, Формы (Пик) и Биомассы из базы данных Cloudflare D1. Статистика реальных игроков теперь корректно отображается вместо нулей.',
        textEn: 'Hall of Fame Data Fix: Resolved breakthrough count, flush count, form (peak), and biomass reading from Cloudflare D1. Real player statistics now properly display instead of zeroes.'
      },
      {
        type: 'fix',
        icon: '☁️',
        text: 'Разблокировка Облачного Сохранения: Устранена серверная ошибка 409 stale_save после вайпа сезона, блокировавшая загрузку прогресса активных игроков в облако.',
        textEn: 'Cloud Save Unblocked: Resolved server-side 409 stale_save loop following season wipe that blocked active player progress uploads.'
      },
      {
        type: 'ui',
        icon: '📊',
        text: 'Умная Сортировка Ладдера: Таблица лидеров теперь строго ранжирует игроков по Прорывам, затем по Форме, затем по Смывам и опыту биомассы.',
        textEn: 'Smart Leaderboard Sorting: Ranking prioritizes Breakthroughs first, then highest Form, then Flushes and Biomass exp.'
      }
    ]
  },
  {
    version: 'v5.3.1 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.3.1: ⚠️ ВАЙП Прогрессии, Колесо Фортуны Заточки, Умная Экипировка Ножей и Новый Зал Славы',
    titleEn: 'Patch 5.3.1: Progression Wipe, Knife Sharpening Wheel of Fortune, Smart Knife Auto-Equip & Hall of Fame Grid',
    badge: '⚠️ ВАЙП & ОБНОВЛЕНИЕ',
    badgeEn: 'WIPE & UPDATE',
    badgeClass: 'bg-amber-500/20 text-yellow-300 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '⚠️',
        text: 'ВАЙП и Проверка Обновленной Прогрессии: Все скрытые счетчики сброшены. Мы полностью переработали 5 Тиров игры, усложнили требования Смывов для Прорыва и ввели суровую синергию Ножей и Заводов. Ворвись в игру с чистого листа и проверь хардкорный баланс прямо сейчас!',
        textEn: 'Progression Wipe & Rebalance: Hidden counters reset. Reworked 5 game tiers, heightened flush requirements for breakthrough, and introduced severe knife-factory synergies.'
      },
      {
        type: 'ui',
        icon: '🏆',
        text: 'Глобальная Починка Зала Славы: Полный редизайн карточек таблицы лидеров на строгой Grid-сетке. Чистые независимые колонки «Прорывы», «Форма», «Смывы», коронки топ-3, плашка ★ VIP и защита от пустой базы.',
        textEn: 'Hall of Fame Grid Overhaul: Restructured leaderboard layout on a strict 3-column CSS Grid. Distinct stat blocks for Breakthroughs, Form, and Flushes with full null-safety and crowns.'
      },
      {
        type: 'feature',
        icon: '🎰',
        text: 'Колесо Фортуны при Заточке Ножей: Азартная анимация кругового колеса с шансами на успех (зеленый) и провал (красный). Плавное вращение с замедлением и сочный вердикт.',
        textEn: 'Wheel of Fortune Knife Sharpening: Interactive fortune wheel modal with exact chance sectors, ease-out spin animation, and animated outcome reveals.'
      },
      {
        type: 'feature',
        icon: '⚔️',
        text: 'Умный Алгоритм «Одеть лучший нож»: Кнопка рассчитывает реальный клик-урон каждого разблокированного клинка на big.js с учетом уровня заточки звёзд и автоматически надевает сильнейший.',
        textEn: 'Smart Equip Best Knife: Computes real battle click power taking sharpening star levels and big.js multipliers into account, equipping the optimal blade.'
      }
    ]
  },
  {
    version: 'v5.3.0 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.3.0: Реалтайм-счетчик Прорыва и Формы, Изоляция Т5, Квантовые Варпы для Всех, Всеядный VIP-Автосбор и Авто-Смыв',
    titleEn: 'Patch 5.3.0: Realtime Breakthrough Form Meter, Tier 5 Isolation, F2P Quantum Warps, Omnivorous Meteor Collector & VIP Auto-Flush',
    badge: 'Патч 5.3.0',
    badgeEn: 'Patch 5.3.0',
    badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    changes: [
      {
        type: 'ui',
        icon: '🌌',
        text: 'Реалтайм-счетчик Прорыва и Терминология Формы: Полностью переписана логика рендера окна Прорыва — переменные currentLevel и reqLevel считываются в реальном времени напрямую из стейта без зависаний и округлений. Термин «Опыт биомассы» везде заменён на «Форма» (Evo Stage).',
        textEn: 'Realtime Breakthrough Form Meter & Terminology: The Breakthrough modal now reads currentLevel and reqLevel dynamically from state in realtime without stale caching or JS rounding. Biomass Exp is replaced everywhere with Form (Evo Stage).'
      },
      {
        type: 'feature',
        icon: '🪐',
        text: 'Великое Переселение Тира 5: Квантовые таланты (Блок 5) и Божественные эндгейм-реликвии (80+ Прорывов) полностью изолированы из Тира 4 и перенесены в свои собственные интерактивные вкладки [🪐 Тир 5].',
        textEn: 'Tier 5 Migration: Quantum talents and Divine endgame relics (80+ Breakthroughs) have been cleanly isolated from Tier 4 into dedicated [🪐 Tier 5] shop tabs.'
      },
      {
        type: 'balance',
        icon: '🌠',
        text: 'Квантовые Варпы для Всех Игроков: Устранено ограничение, блокировавшее получение бесплатных 2-часовых варпов реликвии «relic_quantum_meteor» для игроков без VIP. Шанс прока ребалансирован: шаг шанса снижен до +0.5% за уровень (строго 4% на 8-м ур).',
        textEn: 'Universal Quantum Warps & Rebalance: Removed the VIP lock on free 2-hour Time Warps from the Quantum Meteor relic, making them freely available to all players. Proc chance rebalanced to +0.5% per level (strictly 4% at max level 8).'
      },
      {
        type: 'feature',
        icon: '🌟',
        text: 'Всеядный VIP-Автосборщик Метеоров: Автосборщик VIP-Пасса теперь непрерывно и безотказно захватывает любые летающие небесные тела — как стандартные Метеориты, так и мелкие/ивентовые звезды звездного дождя.',
        textEn: 'Omnivorous VIP Meteor Auto-Collector: The VIP auto-collector now sweeps all celestial bodies on screen, catching standard Golden Meteors as well as small and event shower stars.'
      },
      {
        type: 'feature',
        icon: '🌊',
        text: 'Эксклюзивный Авто-Смыв для VIP: В окно Смыва добавлен интерактивный тумблер Авто-Смыва с аппаратной блокировкой для игроков без VIP. При активации игра каждую секунду проверяет готовность Смыва и автоматически перезапускает цикл.',
        textEn: 'Exclusive VIP Auto-Flush: Added an interactive toggle in the Flush modal with hardware locking for non-VIP accounts. When enabled, the game checks requirements every second and executes automatic Flushes.'
      }
    ]
  },
  {
    version: 'v5.2.9 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.2.9: Ультимативная Защита Реликвий, Десериализация Вантузов и Exit-Save',
    titleEn: 'Patch 5.2.9: Ultimate Relic Persistence, Plunger Deserialization & Exit-Save Protection',
    badge: 'Патч 5.2.9',
    badgeEn: 'Patch 5.2.9',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'save',
        icon: '🛡️',
        text: 'Ультимативная Защита Сохранений при Выходе: Внедрены глобальные обработчики beforeunload, pagehide и visibilitychange. Игра мгновенно и безотказно фиксирует стейт в LocalStorage и отправляет финальный слепок в Cloudflare через keepalive/sendBeacon.',
        textEn: 'Bulletproof Exit-Save System: Global listeners for beforeunload, pagehide, and visibilitychange guarantee immediate persistence to LocalStorage and keepalive/sendBeacon push to Cloudflare Workers upon tab close or reload.'
      },
      {
        type: 'fix',
        icon: '🔧',
        text: 'Исправление Десериализации Реликвий и Вантузов: Устранена критическая ошибка сброса уровней в NaN при чтении maxLevel вместо max. Реликвии сохраняются и читаются как чистый ассоциативный объект, а баланс Вантузов конвертируется в Big.js без потерь.',
        textEn: 'Fixed Relic & Plunger Deserialization: Fixed critical NaN reset bug when clamping relic levels against max property. Relics now deserialize as clean associative dictionaries, and Plungers reliably rehydrate from Big.js strings.'
      },
      {
        type: 'save',
        icon: '☁️',
        text: 'Защита от Устаревших Облачных Данных: Алгоритм localIsAhead теперь учитывает общее число прокачанных реликвий и прорывов. Старое облачное сохранение больше никогда не затирает свежекупленные реликвии игрока.',
        textEn: 'Stale Cloud Overwrite Protection: The localIsAhead algorithm now factors in total relic levels and breakthrough count, permanently preventing stale cloud saves from overwriting newly purchased relics.'
      }
    ]
  },
  {
    version: 'v5.2.8 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.2.8: Иммунитет 0-го Прорыва, Вкладки Тиров Кейсов и Надежное Сохранение Вантузов',
    titleEn: 'Patch 5.2.8: Breakthrough 0 Immunity, Case Tier Tabs & Reliable Plunger Persistence',
    badge: 'Патч 5.2.8',
    badgeEn: 'Patch 5.2.8',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'fix',
        icon: '🛡️',
        text: 'Абсолютный Иммунитет 0-го Прорыва: На новых аккаунтах и до совершения 1-го Прорыва (а также до формы 3 500) штраф ножа гарантированно отключен (x1.00 мощности), исключая ложные красные плашки в начале игры.',
        textEn: 'Absolute Breakthrough 0 Immunity: Starter accounts with 0 Breakthroughs or below form 3,500 now strictly enjoy 100% factory efficiency with zero false-alarm warnings.'
      },
      {
        type: 'ui',
        icon: '🧰',
        text: 'Горизонтальные Вкладки Тиров в Кейсах: Магазин кейсов получил систему переключателей тиров [⭐ Тир 1] [⚡ Тир 2] [🔮 Тир 3] [🌌 Тир 4] [🪐 Тир 5] [🔒 Тир 6-8] [✨ Все], распределяющую 45 кейсов по порционному плану.',
        textEn: 'Horizontal Tier Filters for Cases: Weapon Cases tab now features a sleek tier filter bar ([⭐ Tier 1] to [🪐 Tier 5]) cleanly categorizing all 45 crates according to progression stages.'
      },
      {
        type: 'save',
        icon: '💾',
        text: 'Надежное Сохранение Вантузов: Принудительное автосохранение теперь вызывается мгновенно при покупке и прокачке реликвий, а баланс Вантузов сериализуется через безопасный строковый формат Big.js, защищая от откатов.',
        textEn: 'Bulletproof Plunger Persistence: Auto-save triggers immediately upon purchasing or upgrading relics, and Plungers balance serializes safely via Big.js string representation to eliminate rollback risks.'
      }
    ]
  },
  {
    version: 'v5.2.7 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.2.7: Спасение Баланса Формы 3500, SOS-Подсказки и Антикризисный Буст',
    titleEn: 'Patch 5.2.7: Form 3500 Balance Salvation, SOS Guidance & Crisis Boost',
    badge: 'Патч 5.2.7',
    badgeEn: 'Patch 5.2.7',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🛡️',
        text: 'Иммунитет Тира 1 до Формы 3 500: Штраф ножа переписан и привязан строго к форме питомца (GAME.evoStage), а не к покупке заводов. До формы 3 500 стартовые ножи дают полные 100% мощности заводов (x1.00), исключая любые мертвые зоны.',
        textEn: 'Tier 1 Immunity up to Form 3,500: Knife penalty is now tied strictly to pet form (GAME.evoStage), not factory unlocks. Starter weapons provide 100% factory efficiency (x1.00) until form 3,500, completely removing deadlock zones.'
      },
      {
        type: 'ui',
        icon: '🚨',
        text: 'SOS-Индикатор в Кейсах и Заводах: При включении штрафа ножа вверху вкладок Кейсов и Заводов отображается крупная SOS-плашка с четким решением: перейти в Тир 2 и открыть кейс «Операция Браво» за 1.5k Блестяшек.',
        textEn: 'SOS Warning in Cases & Factories: When a knife penalty activates, a prominent banner appears at the top of Cases and Factories explaining the situation and guiding directly to Tier 2 Operation Bravo case.'
      },
      {
        type: 'feature',
        icon: '⚡',
        text: 'Антикризисный Буст Ручных Кликов: При активном штрафе ножа каждый критический удар от ручного клика гарантированно дает +5 Блестяшек ✨, а метеориты прилетают каждые 45 секунд для быстрого накопления 1.5k на новый нож.',
        textEn: 'Crisis Click & Meteor Boost: When the knife penalty is active, every manual critical hit grants +5 guaranteed Sparkles ✨, and meteor spawn cooldown is capped at 45 seconds for swift progression.'
      }
    ]
  },
  {
    version: 'v5.2.6 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.2.6: Ускорение 1-го Прорыва и Чистый Рендер Кейсов',
    titleEn: 'Patch 5.2.6: Accelerated 1st Breakthrough & Pristine Case Display',
    badge: 'Патч 5.2.6',
    badgeEn: 'Patch 5.2.6',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🌌',
        text: 'Ускорение 1-го Прорыва: Снижен порог входа в эндгейм для новичков. Для 1-го Прорыва требуется строго 10 Смывов (вместо 20) и 500 уровней опыта биомассы (вместо 1000). Последующие Прорывы сохраняют хардкорную прогрессию.',
        textEn: 'Accelerated 1st Breakthrough: Lowered entry barrier for newcomers. 1st Breakthrough requires strictly 10 Flushes (down from 20) and 500 biomass exp levels (down from 1000). Subsequent Breakthroughs maintain standard endgame scaling.'
      },
      {
        type: 'fix',
        icon: '🗡️',
        text: 'Чистый Рендер Ножей в Кейсах: В интерфейсе магазина кейсов и рулетке все ножи отображаются строго в девственном виде (0 звезд и базовые характеристики), исключая наложение уровней заточки из инвентаря.',
        textEn: 'Pristine Knife Showcase in Cases: In cases shop and roulette, knives now strictly render in pristine base form (0 stars & base bonuses), without showing sharpening levels from inventory.'
      },
      {
        type: 'ui',
        icon: '🏃',
        text: 'Синхронизация Квеста №16: Условие квеста «Марафонец Смывов» снижено с 20 до 10 смывов, полностью синхронизируясь со смягченным 1-м Прорывом.',
        textEn: 'Quest #16 Synchronization: "Flush Marathoner" quest prerequisite adjusted from 20 to 10 flushes to align with the first Breakthrough.'
      }
    ]
  },
  {
    version: 'v5.2.5 PRO',
    date: '11 Октября 2026',
    dateEn: 'October 11, 2026',
    title: 'Патч 5.2.5: Задачи Квестов, Скидка Заточки, Горячие Клавиши и Единый VIP',
    titleEn: 'Patch 5.2.5: Quest Tasks, Sharpen Discount, Hotkeys & Unified VIP',
    badge: 'Патч 5.2.5',
    badgeEn: 'Patch 5.2.5',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🎯',
        text: 'Понятные Задачи Квестов: В плашке обучения теперь выводится четкая цель задания («🎯 Задача: ...») для всех 18 квестов лесенки.',
        textEn: 'Clear Quest Objectives: Quest banner now displays dynamic task descriptions ("🎯 Objective: ...") across all 18 ladder quests.'
      },
      {
        type: 'balance',
        icon: '⭐',
        text: 'Скидка на Квест №7 и Удешевление Заточки Тира 1: Во время активного Квеста №7 первая заточка (+1 звезда) любого ножа принудительно стоит ровно 100 Блестяшек ✨. Базовая стоимость заточки ножей из первых 3 стартовых кейсов навсегда снижена в 3 раза.',
        textEn: 'Quest #7 Sharpen Promo & 3x Cheaper Tier 1: While Quest #7 is active, the first sharpen (+1 star) on any knife costs strictly 100 Sparkles ✨. Base sharpening cost for all knives from the first 3 cases is permanently reduced by 3x.'
      },
      {
        type: 'feature',
        icon: '⌨️',
        text: 'Горячие Клавиши Навигации: Навигация по интерфейсу клавишами: [I] - Инвентарь, [T] - Смыв, [B] - Прорыв, [F] - Заводы, [S] - Бутик, [Esc] - закрытие любого открытого окна. Встроена надежная защита от ввода в чате/полях и подсказки на кнопках.',
        textEn: 'Navigation Hotkeys: Interface navigation via keyboard: [I] - Inventory, [T] - Flush, [B] - Transcend, [F] - Factories, [S] - Boutique, [Esc] - close modal. Protected against typing in input/chat fields.'
      },
      {
        type: 'ui',
        icon: '★',
        text: 'Единый VIP-Пасс Вселенной: Полностью вырезаны старые уровни VIP 1-5. В Топ-Ладдере и профилях теперь отображается стильный премиальный бейдж «★ VIP» без рангов.',
        textEn: 'Unified Cosmic VIP Pass: Legacy VIP 1-5 tiers purged in favor of a single premium status badge "★ VIP" across leaderboard and profiles.'
      }
    ]
  },
  {
    version: 'v5.2.4 PRO',
    date: '10 Октября 2026',
    dateEn: 'October 10, 2026',
    title: 'Патч 5.2.4: Ребаланс Стартовых Кейсов и Рейдовые Боссы 10s',
    titleEn: 'Patch 5.2.4: Early Cases Rebalance & 10s Raid Bosses Rework',
    badge: 'Патч 5.2.4',
    badgeEn: 'Patch 5.2.4',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'balance',
        icon: '📦',
        text: 'Ребаланс Кейсов Тира 1: Базовые цены первых пяти кейсов в Блестяшках исправлены (Кейс 1: 20 ✨, Кейс 2: 1 500 ✨, Кейс 3: 8 000 ✨, Кейс 4: 35 000 ✨, Кейс 5: 150 000 ✨) для устранения перефарма на 0-м прорыве.',
        textEn: 'Tier 1 Cases Rebalance: Sparkle costs for the first five cases updated (Case 1: 20 ✨, Case 2: 1,500 ✨, Case 3: 8,000 ✨, Case 4: 35,000 ✨, Case 5: 150,000 ✨) to fix early game pacing.'
      },
      {
        type: 'balance',
        icon: '⏱️',
        text: 'Рейдовый Таймер 10 Секунд: Длительность сессии боя с рейдовыми боссами зажата с 15 до 10 секунд. Формула урона Билетов вклада и реликвии кровотечения синхронизированы на сервере и клиенте под 10-секундный таймер.',
        textEn: '10-Second Raid Timer: Raid boss combat session shortened from 15s to 10s. Ticket damage and bleed relic calculations updated synchronously on server and client.'
      },
      {
        type: 'balance',
        icon: '🪠',
        text: 'Новая Матрица 25 Боссов: Экспоненциальное здоровье от 10^8 (Босс 1) до 10^1000 (Босс 25) и награды от 2 до 150 Вантузов 🪠, сбалансированные под гильдейскую кооперацию.',
        textEn: 'New 25 Bosses Matrix: Exponential boss HP scaling from 10^8 (Boss 1) to 10^1000 (Boss 25) with rewards scaling from 2 to 150 Plungers 🪠, balanced around guild teamwork.'
      },
      {
        type: 'fix',
        icon: '🧹',
        text: 'Абсолютный Вайп в Чистый Ноль: Полная переработка функции hardReset() в профиле игрока, админ-сброса и глобального вайпа. Жестко обнуляются все эндгейм-переменные big.js (Уровни Прорыва и Смыва, одометр опыта, все 25 талантов и 24 реликвии, инвентарь ножей, шапок и скинов). База данных и Топ-Ладдер гарантированно очищаются от фантомных рекордов, питомец стартует со 100% сытости, чистоты и настроения.',
        textEn: 'Absolute Pure Zero Wipe: Total overhaul of hardReset(), admin account wipe, and global wipe. All big.js endgame variables (Breakthrough & Flush levels, exp odometer, all 25 talents, 24 relics, knife & skin inventory) are strictly zeroed out. Leaderboard and database are guaranteed purged of ghost records, starting pet care gauges at 100%.'
      }
    ]
  },
  {
    version: 'v5.2.3 PRO',
    date: '10 Октября 2026',
    dateEn: 'October 10, 2026',
    title: 'Патч 5.2.3: Бесконечные Заводы, 45 Тиров и Синхронизация с Кейсами 500+ Прорывов',
    titleEn: 'Patch 5.2.3: Infinite Factories, 45 Tiers & 500+ Breakthrough Case Sync',
    badge: 'Патч 5.2.3',
    badgeEn: 'Patch 5.2.3',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🏭',
        text: 'Бесконечное Масштабирование Заводов: Линейка заводов расширена до 45 тиров (по 1 тиру на каждый оружейный кейс). Стоимость финального завода достигает ~1e1050 биомассы, а базовый доход — ~1e900 биомассы/сек, создавая идеальный паритет с ножом Апекса (1e1000).',
        textEn: 'Infinite Factory Scaling: Factories expanded to 45 tiers matching all 45 weapon cases. Final factory cost scales to ~1e1050 biomass and base CPS to ~1e900 biomass/sec, creating perfect parity with the apex knife (1e1000).'
      },
      {
        type: 'feature',
        icon: '📦',
        text: 'Независимое Открытие Кейсов: Полностью удалено требование обязательного ножа из предыдущего кейса. Кейсы открываются пачками по 2-3 штуки строго по рубежам Прорывов (0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 75, 150, 225, 300+).',
        textEn: 'Independent Case Unlocks: Removed requirement for knives from previous cases. Cases unlock in clusters of 2-3 strictly based on Breakthrough milestones (0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 75, 150, 225, 300+).'
      },
      {
        type: 'balance',
        icon: '🪠',
        text: 'Двойная Валюта Эндгейм-Кейсов (Тир 5): Кейсы №36–45 требуют одновременно Блестяшки ✨ и Вантузы 🪠 (от 15 до 25 000 🪠) со списанием и кэшбэком обеих валют.',
        textEn: 'Dual Currency Endgame Cases (Tier 5): Cases #36-45 require both Sparkles ✨ and Plungers 🪠 simultaneously (15 to 25,000 🪠) with full dual deduction and refund support.'
      },
      {
        type: 'balance',
        icon: '🗡️',
        text: 'Синхронизированная Синергия Ножей: Штраф -90% теперь рассчитывается по прямой разнице тиров ножа и заводов (штраф применяется, если тир ножа отстает более чем на 2 тира от максимального открытого завода).',
        textEn: 'Synchronized Knife Synergy: The -90% penalty is now calculated directly based on the tier gap between knife and factory (penalty triggers if knife lags by >2 tiers behind highest factory).'
      },
      {
        type: 'ui',
        icon: '🪐',
        text: 'Обновление Фильтров Заводов: Вкладки Тир 1–5 и «Все» позволяют удобно просматривать и покупать все 45 тиров био-заводов с четкими бейджами тиров и требований.',
        textEn: 'Factory Filter Update: Tiers 1-5 and "All" buttons provide seamless navigation across all 45 bio-factory tiers with clear tier badges and requirements.'
      }
    ]
  },
  {
    version: 'v5.2.2 PRO',
    date: '10 Октября 2026',
    dateEn: 'October 10, 2026',
    title: 'Патч 5.2.2: Бесконечные Прорывы, Динамический Опыт и Экспонента Смывов',
    titleEn: 'Patch 5.2.2: Infinite Breakthroughs, Dynamic Exp & Exponential Flush Wall',
    badge: 'Патч 5.2.2',
    badgeEn: 'Patch 5.2.2',
    badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🌀',
        text: 'Суровая Эндгейм-Стена Смывов: Формула требований Смывов переведена на экспоненциально-степенную прогрессию: ReqFlushes = 20 + ⌊B × 4⌋ + ⌊B^1.3⌋ (10-й Прорыв: 79 смывов, 50-й: 381, 100-й: 818, 336-й: 3288 смывов).',
        textEn: 'Hardcore Endgame Flush Wall: Flush requirement formula upgraded to exponential-power scaling: ReqFlushes = 20 + ⌊B × 4⌋ + ⌊B^1.3⌋ (10th Breakthrough: 79 flushes, 50th: 381, 100th: 818, 336th: 3288 flushes).'
      },
      {
        type: 'balance',
        icon: '🌌',
        text: 'Динамический Рост Порога Опыта: Требование опыта биомассы масштабируется на +1000 за каждый совершенный Прорыв: TargetBreakthroughExperience = 1000 × (1 + B). На 336-м Прорыве цель составляет 336k ур.',
        textEn: 'Dynamic Exp Threshold Scaling: Biomass experience requirement now scales by +1000 per Breakthrough: TargetBreakthroughExperience = 1000 × (1 + B). Reaching Breakthrough #336 now requires 336k levels.'
      },
      {
        type: 'feature',
        icon: '💾',
        text: 'Сохранение Излишков Опыта: При совершении Прорыва накопленный опыт больше не сгорает в 0, а точно вычитает требуемый порог, сберегая весь избыточный прогресс игрока для следующего Прорыва.',
        textEn: 'Excess Experience Preservation: Performing a Breakthrough no longer wipes experience to 0. It subtracts the required target, fully preserving accumulated surplus for the next Breakthrough.'
      },
      {
        type: 'balance',
        icon: '📈',
        text: 'Сбалансированная Формула Дохода: Множитель дохода обновлен до (1.5 + 0.1 × B)^B на big.js, обеспечивая честную бесконечную прогрессию без поломки экономики авто-заводов.',
        textEn: 'Balanced Income Multiplier: Income boost reworked to (1.5 + 0.1 × B)^B on big.js, delivering genuine infinite scaling without breaking factory economy.'
      },
      {
        type: 'ui',
        icon: '🪠',
        text: 'Обновление UI Прорыва: Прогресс-бар, динамические цели и подсказки на кнопке Прорыва отображают точные актуальные значения требований опыта и смывов.',
        textEn: 'Breakthrough UI Refresh: Progress bar, dynamic goals, and button status display exact real-time requirements for both experience and flushes.'
      }
    ]
  },
  {
    version: 'v5.2.1 PRO',
    date: '10 Октября 2026',
    dateEn: 'October 10, 2026',
    title: 'Патч 5.2.1: Полная Переработка Обучения — 18 Квестов, Spotlight и Акции',
    titleEn: 'Patch 5.2.1: Beginner Guide Overhaul — 18 Quests, Spotlight & Dynamic Deals',
    badge: 'Патч 5.2.1',
    badgeEn: 'Patch 5.2.1',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '📜',
        text: 'Новая Кампания из 18 Интерактивных Квестов: Старое окошко эпох заменено на динамическую постоянную плашку квестов с полосой прогресса, иконками, счетчиками и быстрыми наградами.',
        textEn: 'New 18-Quest Interactive Campaign: Replaced old epoch text pill with dynamic persistent quest widget featuring progress bar, icons, counters, and instant rewards.'
      },
      {
        type: 'ui',
        icon: '🔦',
        text: 'Система UI Spotlight и Затемнения: Интерактивный оверлей (black 0.6) затемняет экран и подсвечивает строго целевую кнопку, зону или вкладку квеста с блокировкой случайных кликов.',
        textEn: 'UI Spotlight & Dimming System: Interactive overlay (black 0.6) dims the entire screen and highlights the exact target button, tab, or pet needed with pointer-block safeguards.'
      },
      {
        type: 'balance',
        icon: '🏷️',
        text: 'Акционная Скидка на Квесте №9: Во время квеста «Новая кожа» цена первого скина в гардеробе снижается с 25 000 до 1 000 Блестяшек ✨ с возвратом стандартной стоимости после прохождения.',
        textEn: 'Dynamic Discount on Quest #9: During "New Skin" quest, first body skin price is temporarily reduced from 25,000 to 1,000 Sparkles ✨, restoring standard cost upon completion.'
      },
      {
        type: 'feature',
        icon: '⚡',
        text: 'Ретроактивная Валидация Сохранений: Движок автоматически проверяет текущее состояние игры и моментально засчитывает ранее выполненные действия без застреваний на старых аккаунтах.',
        textEn: 'Retroactive State Validation: Engine automatically validates state and instantly claims rewards for milestones already completed on existing saves.'
      }
    ]
  },
  {
    version: 'v5.2.0 PRO',
    date: '10 Октября 2026',
    dateEn: 'October 10, 2026',
    title: 'Патч 5.2.0: Реликвии Бесконечности, 5 Тиров Вантузов и Эндгейм-Сингулярность',
    titleEn: 'Patch 5.2.0: Infinite Relics, 5 Plunger Tiers & Endgame Singularity',
    badge: 'Патч 5.2.0',
    badgeEn: 'Patch 5.2.0',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🪠',
        text: 'Полная Переработка Реликвий: Удалены все плоские дублирующие проценты. Развернута система из 24 уникальных реликвий в 5 Тирах, заблокированных по уровням Прорыва (1, 10, 30, 50, 80 Прорывов).',
        textEn: 'Complete Relics Overhaul: Removed all flat duplicate percentage bonuses. Deployed 24 unique relics across 5 Tiers locked behind Breakthrough milestones (1, 10, 30, 50, 80 Breakthroughs).'
      },
      {
        type: 'ui',
        icon: '🔒',
        text: 'Интерфейс 5 Тиров и Замки Прорыва: Заблокированные Тиры закрыты стильными полупрозрачными плашками «🔒 Требуется X Прорыв». Удобные табы фильтрации по Тирам 1–5.',
        textEn: '5-Tier UI & Breakthrough Locks: Locked tiers display styled translucent "🔒 Requires Breakthrough X" overlay panels with tabs for Tiers 1–5.'
      },
      {
        type: 'feature',
        icon: '⚔️',
        text: 'Боссы и Рейдовые Механики: «Гипер-Ускоритель Заводов» переносит пассивный доход в пулемет по боссам, «Ядовитое Лезвие» накладывает кровотечение, «Врата Вечности» удваивают урон по финальному боссу, а «Благословение Демиурга» дает шанс удвоить награду вантузами.',
        textEn: 'Boss Combat & Raid Mechanics: "Factory Hyper-Accelerator" converts passive factory CPS to boss damage, "Poison Blade" inflicts bleed, "Gate of Eternity" doubles damage vs final boss, and "Demiurge\'s Blessing" can double plunger loot.'
      },
      {
        type: 'feature',
        icon: '☄️',
        text: 'Метеоритные Сингулярности: «Вулканический Спавн» призывает метеоры парами, «Звездный Дождь» превращает их в Квантовые с 2-часовым Варпом времени, а «Галактический Шторм» дает +100 уровней опыта Прорыва.',
        textEn: 'Meteor Singularities: "Volcanic Spawn" spawns meteors in pairs, "Star Shower" turns meteors into Quantum with 2h Time Warp, and "Galactic Storm" grants +100 Breakthrough exp levels.'
      },
      {
        type: 'balance',
        icon: '♾️',
        text: 'Эссенция Бесконечности и Вантузный Капитал: Глобальный мультипликатор x2.0 за уровень ко всему доходу, кликам и урону («Эссенция Бесконечности»), а также мультипликатор биомассы от вантузов банка гильдии («Вантузный Капитал»).',
        textEn: 'Essence of Infinity & Plunger Capital: Global x2.0 multiplier per level to all income, clicks and boss damage ("Essence of Infinity"), plus biomass bonus scaling with guild bank plungers ("Plunger Capital").'
      },
      {
        type: 'feature',
        icon: '🤖',
        text: 'Автоматизация и Комфорт: «Астральный Авто-Уход» держит шкалы ухода на 100%, «Авто-Покупка Заводов» покупает фабрики по MAX, кнопка «Ленивый Босс» позволяет мгновенно слить билеты в босса из шапки игры.',
        textEn: 'Automation & Comfort: "Astral Auto-Care" locks care bars at 100%, "Auto-Buy Factories" auto-purchases factories via MAX, and "Lazy Boss" button allows instant ticket dumping from the top header.'
      }
    ]
  },
  {
    version: 'v5.1.1 PRO',
    date: '10 Октября 2026',
    dateEn: 'October 10, 2026',
    title: 'Патч 5.1.1: Симметричные Таланты Смыва 5x5, 20 Перков Прорыва и Сквозная Бесконечная Экономика',
    titleEn: 'Patch 5.1.1: Symmetrical 5x5 Flush Talents, 20 Breakthrough Perks & Infinite Meta Multipliers',
    badge: 'Патч 5.1.1',
    badgeEn: 'Patch 5.1.1',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🌳',
        text: 'Симметричное Дерево Талантов 5x5: Ровно 5 прогресс-тиров по 5 уникальных талантов на Big.js (всего 25). Тиры жестко заблокированы по уровням Смыва (0, 20, 50, 100, 500 Смывов) с удобными вкладками и индикацией требований.',
        textEn: 'Symmetrical 5x5 Talent Tree: Strictly 5 progress tiers with 5 unique talents each on Big.js (25 total). Tiers are hard-locked behind Flush counts (0, 20, 50, 100, 500 Flushes) with 5 tabs and lock status badges.'
      },
      {
        type: 'perf',
        icon: '⚡',
        text: 'Логарифмический «Купить MAX»: Кнопка моментальной покупки всех бесконечных талантов переведена на аналитическую формулу суммы геометрической прогрессии O(1) без лагов.',
        textEn: 'Logarithmic Buy MAX: Instant purchase button for infinite talents solved analytically using geometric progression sum in O(1) time without lag.'
      },
      {
        type: 'feature',
        icon: '🔮',
        text: '20 Постоянных Перков Прорыва: Полная замена магазина — убраны повторяемые улучшения, внедрены 20 уникальных разовых перков за Блестяшки от 0 до 100 Прорывов с подробными карточками и блокировками.',
        textEn: '20 Permanent Breakthrough Perks: Complete shop overhaul — removed repeatable upgrades, added 20 unique permanent perks for Sparkles scaling up to 100 Breakthroughs.'
      },
      {
        type: 'balance',
        icon: '♾️',
        text: 'Сквозная Цепочка Мультипликаторов (metaMultipliers.js): Доход = (База * Таланты * Буст Смывов) * Нож * Буст Прорывов * Реликвии * Шапки/Одежда * Баффы Ухода * Перки. Все эффекты перемножаются мультипликативно!',
        textEn: 'Infinite Multiplier Chain (metaMultipliers.js): Income = (Base * Talents * Flush Boost) * Knife * Breakthrough Boost * Relics * Hats/Skins * Care Buffs * Perks. All effects scale multiplicatively!'
      },
      {
        type: 'balance',
        icon: '⚖️',
        text: 'Ребаланс Смывов и Кейсов: Требование биомассы для 1-го Смыва увеличено до 50k с экспонентой 2.5 (Req = 50,000 * 2.5^L), исключая ранний перефарм. 1-й Прорыв строго на 20 Смывах. Кейсы теперь требуют Прорыв + открытие ножа из прошлого кейса.',
        textEn: 'Flush & Cases Rebalance: 1st Flush biomass requirement increased to 50k with 2.5 exponent (Req = 50,000 * 2.5^L), preventing early rush. 1st Breakthrough locked at 20 Flushes. Cases require Breakthrough levels + knife from previous case.'
      },
      {
        type: 'balance',
        icon: '🛡️',
        text: 'Механики Эндгейма: Перк «Алхимическая Мутация» снижает множитель цен заводов с 1.4 до 1.37; «Благословение Кузнеца» спасает нож от сброса в 0 при неудачной заточке; «Фабрика Билетов» пассивно дает рейдовые билеты.',
        textEn: 'Endgame Mechanics: "Alchemical Mutation" reduces factory cost ratio from 1.4 to 1.37; "Blacksmith\'s Blessing" protects knives from zero reset on failure; "Ticket Factory" generates raid tickets offline.'
      }
    ]
  },
  {
    version: 'v5.1.0 PRO',
    date: '10 Октября 2026',
    dateEn: 'October 10, 2026',
    title: 'Патч 5.1: Великое Восхождение, 12 шагов онбординга и ребаланс ядра Infinite Idle',
    titleEn: 'Patch 5.1: The Infinite Ascension, 12-Step Onboarding & Infinite Idle Rebalance',
    badge: 'Патч 5.1',
    badgeEn: 'Patch 5.1',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🗺️',
        text: '12-ступенчатая Квестовая Лесенка (Onboarding): Полноценная стартовая кампания от первого клика до рейдов в Гильдии с прогресс-баром, сочными наградами и торжественным триумфом!',
        textEn: '12-Step Onboarding Questline: Complete starting campaign from first click to Guild raids with dynamic progress bars, juicy rewards, and triumph modal celebration!'
      },
      {
        type: 'balance',
        icon: '🧼',
        text: 'Синергия Ухода: Баффы Чистоты (доход), Сытости (клики) и Настроения (криты) теперь сквозным образом перемножаются со всеми множителями big.js и усиливают рейдовый урон по боссам!',
        textEn: 'Pet Care Synergy: Cleanliness (income), Hunger (clicks), and Happiness (crit chance) buffs now multiply through the full big.js chain and empower raid boss strikes!'
      },
      {
        type: 'perf',
        icon: '♾️',
        text: 'Бесконечная математика: Устранено демпфирование Прорывов при расчете ножей; расчеты кнопки MAX на коэффициенте r=1.4 полностью защищены от переполнения.',
        textEn: 'Infinite Math: Removed Breakthrough dampening on knives; MAX button purchases with ratio r=1.4 fully protected from overflow.'
      },
      {
        type: 'ui',
        icon: '🏆',
        text: 'Модальное окно триумфа: Завершение обучающей кампании награждается торжественным окном «Вы полностью готовы к бесконечности!» и скрытием плашки.',
        textEn: 'Triumph Modal: Finishing the onboarding campaign rewards players with a celebration modal "You are ready for infinity!" and cleanly hides the tutorial bar.'
      }
    ]
  },
  {
    version: 'v5.0.87 PRO',
    date: '9 Октября 2026',
    dateEn: 'October 9, 2026',
    title: 'Roblox-модель: 41 кейс за Блестяшки ✨, множители блестяшек на ножах и быстрое открытие',
    titleEn: 'Roblox Simulator Model: 41 Cases for Sparkles ✨, Knife Multipliers & Fast Open',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
    changes: [
      {
        type: 'feature',
        icon: '📦',
        text: '41 Тематический Кейс: Все 205 ножей в игре распределены строго по 5 уникальных клинков на каждый кейс (50% Common, 32% Rare, 13% Epic, 4% Covert, 1% Secret Jackpot). Кейсы плавно открываются от Формы 1 до Формы 200,000.',
        textEn: '41 Themed Cases: All 205 knives in the game are strictly divided into 5 unique blades per case (50% Common, 32% Rare, 13% Epic, 4% Covert, 1% Secret Jackpot), smoothly unlocking from Form 1 up to Form 200,000.'
      },
      {
        type: 'balance',
        icon: '✨',
        text: 'Все кейсы за Блестяшки: Кейсы больше не требуют втулок и смывов. Первый кейс доступен сразу со старта за 20 ✨ (10 ✨ со скидкой 50%), а дубликаты возвращают 40% стоимости в Блестяшках.',
        textEn: 'All Cases Cost Sparkles: Cases no longer require flushes or plungers. Case #1 is available immediately at launch for 20 ✨ (10 ✨ with 50% discount), and duplicates refund 40% in Sparkles.'
      },
      {
        type: 'feature',
        icon: '🗡️',
        text: 'Множитель Блестяшек у ножей: Каждый клинок теперь обладает бонусом sparkleMult (от x1.15 до x937.5), масштабирующим доход блестяшек от каждого клика и падения золотых метеоров.',
        textEn: 'Knife Sparkle Multiplier: Every knife now features a sparkleMult stat (from x1.15 up to x937.5), scaling sparkle earnings from clicks and golden meteor drops.'
      },
      {
        type: 'feature',
        icon: '⚡',
        text: 'Тумблер «Быстрое открытие»: Включите режим «⚡ Быстро» в панели кейсов для моментального открытия без ожидания анимации рулетки.',
        textEn: 'Fast Open Toggle: Enable "⚡ Fast" in the cases panel for instant openings skipping roulette spinning delays.'
      },
      {
        type: 'ui',
        icon: '👀',
        text: 'Наглядная витрина шансов: На каждой карточке кейса отображаются все 5 ножей с процентной вероятностью выпадения в стиле симуляторов Roblox.',
        textEn: 'Roblox-Style Drop Preview: Every case card showcases its 5 knives with their exact drop chances.'
      }
    ]
  },
  {
    version: 'v5.0.86 PRO',
    date: '9 Октября 2026',
    dateEn: 'October 9, 2026',
    title: 'Ускорение старта, усиление базовых ножей и система «Первые шаги»',
    titleEn: 'Early-Game Acceleration, Starter Knife Buff & First Steps Onboarding',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🎒',
        text: 'Интерактивная система «Первые шаги»: пошаговый маршрут из 9 ознакомительных заданий (уход за какашечкой, первая шапка, смыв, кейс, экипировка и заточка ножа, таланты) со световыми маячками и финальной наградой +100 ✨ и +5 🧻.',
        textEn: 'Interactive "First Steps" Roadmap: 9 step-by-step onboarding quests (pet care, rookie cap, flush, case opening, knife equip & sharpening, talents) with pulsing visual beacons and a +100 ✨ / +5 🧻 completion reward.'
      },
      {
        type: 'balance',
        icon: '⚔️',
        text: 'Усиление базовых ножей Контейнера #1: минимальная планка пассивного дохода повышена до +100% (множитель x2.0) и клика до x6.0. Даже самый обычный нож сразу дает мощный ощутимый скачок дохода!',
        textEn: 'Case #1 Knife Floor Buffed: Minimum factory passive boost raised to +100% (x2.0 mult) and clicks to x6.0. Even the most common drop immediately gives a punchy power spike!'
      },
      {
        type: 'balance',
        icon: '🏭',
        text: 'Смягчение темпа ранних эпох: убран штраф демпфирования на эпохах 1–3, благодаря чему заводы на формах 500–1000 производят почти в 3 раза больше биомассы без утомительного гринда.',
        textEn: 'Early Epoch Pacing Smoothed: Removed harsh factory dampening on epochs 1–3, granting ~3x higher factory output at forms 500–1000 to eliminate sluggish walls.'
      },
      {
        type: 'balance',
        icon: '🧢',
        text: 'Доступная «Кепка Новичка»: стоимость снижена с 5,000 до 50 ✨ Блестяшек и открыта с 1-й формы без ожидания 100-й формы, давая мгновенный множитель клика x4.',
        textEn: 'Accessible Rookie Cap: Cost lowered from 5,000 to 50 ✨ Sparkles and available from Form 1 without waiting for Form 100, providing an instant early x4 click power boost.'
      },
      {
        type: 'balance',
        icon: '📦',
        text: 'Кейс «Хрома 3» теперь открывается на Эпохе 2 (Форма 501): цена снижена до 75 втулок, вантузы не требуются. Игрок получает доступ ко второму кейсу сразу после первого смыва.',
        textEn: 'Chroma 3 Case Unlocks at Epoch 2 (Form 501): Price lowered to 75 rolls with 0 plungers needed. Immediate access to Case 2 right after first flush.'
      }
    ]
  },
  {
    version: 'v5.0.85 PRO',
    date: '9 Октября 2026',
    dateEn: 'October 9, 2026',
    title: 'Большой ребаланс прогрессии: сетка кейсов, тупики эпох и сила талантов',
    titleEn: 'Progression Overhaul: Case Spacing, Epoch Walls & Powered Talents',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'balance',
        icon: '📦',
        text: 'Новая сетка кейсов: 12 кейсов равномерно распределены с 1-й по 100-ю эпоху (с выходом в Горизонт), делая каждый кейс долгожданной и ценной целью.',
        textEn: 'New Case Spacing: 12 weapon cases are now distributed from Epoch 1 to 100 (extending into Horizon), making every case a meaningful long-term milestone.'
      },
      {
        type: 'balance',
        icon: '⚔️',
        text: 'Калибровка ножей: разброс силы ножей внутри кейса оптимизирован до 4x–5x. Ножи из ранних кейсов больше не ломают баланс далеких эпох, а лучшие ножи остаются желанными трофеями.',
        textEn: 'Knife Spread Calibration: Intra-case knife power gap adjusted to 4x–5x. Early drops no longer break future epochs, while top blades remain thrilling rewards.'
      },
      {
        type: 'balance',
        icon: '🏭',
        text: 'Заводы и тупики эпох: фабрика «Венец» теперь ускоряет середину эпохи без перегрева, создавая естественное испытание на формах 350–500, требующее кликов и прокачки.',
        textEn: 'Factory Curves & Epoch Walls: Apex factories now smoothly support mid-epoch forms without instantly blowing past forms 350–500.'
      },
      {
        type: 'feature',
        icon: '🌟',
        text: 'Усиление Талантов Смыва: Мягкость 4-х слоев (+12%/ур), Разгон заводов (+15%/ур), Ультра-Шмяк (+1.2% крит, +35% урон/ур), Синергизм (+8%/ур) стали мощным двигателем прохождения.',
        textEn: 'Strengthened Flush Talents: 4-Ply Softness (+12%/lvl), Pipeline Boost (+15%/lvl), Ultra-Splat (+1.2% crit, +35% dmg/lvl) and Synergy now provide game-changing progression boosts.'
      },
      {
        type: 'feature',
        icon: '🪠',
        text: 'Усиление Реликвий Прорыва: Космический Резонатор (+12%/ур), Кузница Ножей (+18%/ур), Гипер-Ускоритель (+20%/ур) и Омни-Множитель (+8%/ур) делают вантузы незаменимыми.',
        textEn: 'Empowered Astral Relics: Cosmic Resonator (+12%/lvl), Knife Forge (+18%/lvl), Factory Overdrive (+20%/lvl) and Omni Multiplier (+8%/lvl) make plungers essential.'
      }
    ]
  },
  {
    version: 'v5.0.84 PRO',
    date: '9 Октября 2026',
    dateEn: 'October 9, 2026',
    title: 'Ребаланс цен кейсов, скидка на первый кейс и уведомления',
    titleEn: 'Case Economy Rebalance, First Case Discount & Notifications',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🎁',
        text: 'Скидка на 1-ю покупку: первый кейс доступен со скидкой 73% (всего 12 🧻 вместо 45 🧻), позволяя открыть кейс сразу после 1-го Смыва!',
        textEn: 'First Purchase Discount: The first case is available with a 73% discount (only 12 🧻 instead of 45 🧻), allowing an open right after the 1st Flush!'
      },
      {
        type: 'balance',
        icon: '⚖️',
        text: 'Ребаланс цен кейсов: повышены требования к втулкам и вантузам на поздних кейсах, сбалансировав возросшую силу ножей и вантузы из рейдов гильдий.',
        textEn: 'Case Pricing Rebalance: Scaled roll and plunger requirements for late-tier cases to match increased knife power and guild raid rewards.'
      },
      {
        type: 'ui',
        icon: '🔔',
        text: 'Интерактивное уведомление и пульсирующий бейдж на вкладке «Кейсы», когда доступен первый кейс со скидкой.',
        textEn: 'Interactive toast notification and pulsing badge on the Cases tab whenever the discounted first case is ready to buy.'
      },
      {
        type: 'ui',
        icon: '🤖',
        text: 'Умный советник теперь сразу подсказывает открыть первый кейс со скидкой после совершения Смыва.',
        textEn: 'Smart Assistant now immediately suggests claiming your discounted first case right after flushing.'
      },
      {
        type: 'balance',
        icon: '🛡️',
        text: 'Защита прогрессии форм: активирован мягкий кап на пассивный бонус ножей к заводам. Ножи сохраняют 100% сокрушительной силы клика, а заводы больше не перегреваются до бесконечного пропуска уровней.',
        textEn: 'Form Progression Guard: Activated soft-cap on knife passive factory multiplier. Knives retain 100% click power, while factories no longer skip dozens of forms uncontrollably.'
      }
    ]
  },
  {
    version: 'v5.0.83 PRO',
    date: '8 Октября 2026',
    dateEn: 'October 8, 2026',
    title: 'Глобальный ребаланс кейсов и усиление ножей',
    titleEn: 'Global Weapon Cases Rebalance & Massive Knife Buff',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'balance',
        icon: '🗡️',
        text: 'Ножи в каждом кейсе теперь дают в 15 раз больше разницы в силе — выбивать редкие клинки стало в разы выгоднее!',
        textEn: 'Knives inside each case now have a 15x power spread — dropping rare blades is significantly more rewarding!'
      },
      {
        type: 'feature',
        icon: '📦',
        text: 'Все 12 оружейных кейсов теперь содержат ровно по 18 ножей, а 1% джекпот даёт топовый нож следующего кейса.',
        textEn: 'All 12 weapon cases now contain exactly 18 knives, and the 1% jackpot awards the top blade of the next case tier.'
      },
      {
        type: 'balance',
        icon: '🐉',
        text: 'Множитель легендарного Karambit Dragon Lore вырос до x500,000, а скрытое ограничение софт-капа полностью снято.',
        textEn: 'Legendary Karambit Dragon Lore multiplier increased to x500,000, and the legacy knife soft-cap has been removed.'
      },
      {
        type: 'feature',
        icon: '⚙️',
        text: 'Внедрён глобальный конфиг масштабирования множителей ножей KNIFE_BALANCE_CONFIG для гибкой регулировки силы.',
        textEn: 'Added global knife balance configuration KNIFE_BALANCE_CONFIG for instant multiplier series scaling.'
      },
      {
        type: 'ui',
        icon: '📰',
        text: 'Добавлена иллюстрированная игровая новость в Журнал об улучшении системы ножей.',
        textEn: 'Added an illustrated in-game news announcement in the Journal about the knife system upgrade.'
      }
    ]
  },
  {
    version: 'v5.0.82 PRO',
    date: '8 Октября 2026',
    dateEn: 'October 8, 2026',
    title: 'Полная локализация патч-ноутов и дефолтный English',
    titleEn: 'Full Patch Notes Localization & Default English',
    badge: 'Патч 5.0',
    badgeEn: 'Patch 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      {
        type: 'feature',
        icon: '🌐',
        text: 'Журнал обновлений и новости теперь полностью переводятся на английский при выборе языка English.',
        textEn: 'Update log and news now fully translate to English when English language is chosen.'
      },
      {
        type: 'balance',
        icon: '🌍',
        text: 'Английский язык теперь является стандартным языком игры по умолчанию.',
        textEn: 'English is now the standard default game language.'
      },
      {
        type: 'ui',
        icon: '🎯',
        text: 'Устранена утечка языков при переключении: отображается строго выбранный язык без смешивания.',
        textEn: 'Eliminated language leaks on switch: strictly the chosen language is displayed with no mixing.'
      }
    ]
  },
  {
    version: 'v5.0.81 PRO',
    date: '8 Октября 2026',
    title: 'Оптимизация проекта и расхода токенов',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'perf', icon: '⚡', text: 'Архив патч-ноутов вынесен в patchNotesArchive: размер активного файла уменьшен со 165 КБ до 9 КБ (экономия 95% токенов при патчах).' },
      { type: 'perf', icon: '🧹', text: 'Удалены тяжелые бэкап-файлы (index.backup.html 409 КБ), обновлен .gitignore для защиты контекста.' },
      { type: 'ui', icon: '📜', text: 'Правила проекта AGENTS.md уплотнены и оптимизированы без потери инструкций, экономит тысячи токенов на каждый запрос к ИИ.' }
    ]
  },
  {
    version: 'v5.0.80 PRO',
    date: '8 Октября 2026',
    title: 'Устаревшая ачивка и баг-репорт',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'fix', icon: '🐛', text: 'Баг-репорт снова ходит в Discord через Pages Function /api/bug-report. Убран битый avatar_url, из‑за которого Discord мог отклонять вебхук.' },
      { type: 'ui', icon: '💎', text: 'Ачивка «Клуб Миллиардеров» (Корона Мультиверса) убрана — шапка давно retired и больше не продаётся.' }
    ]
  },
  {
    version: 'v5.0.79 PRO',
    date: '7 Октября 2026',
    title: 'English доведён до всей оболочки',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '🌐', text: 'English закрывает оставшуюся оболочку: гид, смыв/прорыв, индекс ножей, гильдия, админка, баг-репорт, умный советник, холст и динамические подписи форм/вех.' },
      { type: 'ui', icon: '🧩', text: 'Статичный HTML тоже на data-i18n — после смены языка в профиле шапка, уход, вкладки и модалки не остаются на русском. Патч-ноуты по-прежнему на русском.' }
    ]
  },
  {
    version: 'v5.0.78 PRO',
    date: '7 Октября 2026',
    title: 'Полный English для игры',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '🌐', text: 'English покрывает оболочку и данные: ножи, кейсы, заводы, таланты, шапки, скины, боссы, эпохи, реликвии. Имена и описания берутся из словаря, русский остаётся базой в data.' },
      { type: 'ui', icon: '🧩', text: 'HUD, бутик, кейсы, таланты и инвентарь переключаются вместе с языком в профиле. История патч-ноутов пока на русском.' }
    ]
  },
  {
    version: 'v5.0.77 PRO',
    date: '7 Октября 2026',
    title: 'Язык интерфейса: русский и English',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '🌐', text: 'В профиле появился переключатель языка. База — русский, первый второй язык — English. Переводится оболочка: шапка, друзья, гильдия, почта, статус серверов и короткие клиентские ошибки.' },
      { type: 'ui', icon: '🧩', text: 'Новые языки добавляются одним файлом в реестр локалей — без переделки вызовов по всей игре. Патч-ноуты и имена ножей пока остаются на русском.' }
    ]
  },
  {
    version: 'v5.0.76 PRO',
    date: '7 Октября 2026',
    title: 'Награда босса без бонуса за круг',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'balance', icon: '🪠', text: 'Вантузы и очки за босса больше не растут с кругом. Награда фиксирована по номеру босса: 1-й даёт 1 вантуз, 26-й — 26. Круг остаётся только для попытки и сложности HP.' }
    ]
  },
  {
    version: 'v5.0.75 PRO',
    date: '7 Октября 2026',
    title: '26 гильдейских боссов с артом',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '🚽', text: 'В гильдии новая лестница из 26 боссов: 13 тем, у каждой младший и старший. Свои картинки, награды и книга боссов с портретами.' },
      { type: 'balance', icon: '❤️', text: 'HP боссов пересчитаны под длинную лестницу, чтобы финал не был в миллиардах от старой формулы n².' },
      { type: 'ui', icon: '📖', text: 'Вызов босса и журнал показывают тему, портрет и кто младший / старший.' }
    ]
  },
  {
    version: 'v5.0.74 PRO',
    date: '7 Октября 2026',
    title: 'Текст в друзьях больше не обрезается',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'ui', icon: '🧩', text: 'В списке друзей форма и эпоха на отдельных строках, кнопки снизу. Убрана огромная «полоса» эпохи, из‑за которой строка уезжала в многоточие.' }
    ]
  },
  {
    version: 'v5.0.73 PRO',
    date: '7 Октября 2026',
    title: 'Починка «облако перегружено» у друзей',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'fix', icon: '🛠️', text: 'Ошибка 500 у друзей/почты/гильдии была не от игроков, а от лимита CPU: social Worker каждый раз гонял создание таблиц. DDL убран с этого пути, при сбое отвечает основной сервер.' }
    ]
  },
  {
    version: 'v5.0.72 PRO',
    date: '7 Октября 2026',
    title: 'Друзья и гильдия открываются сразу',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'ui', icon: '⚡', text: 'Окна друзей и гильдии сразу показывают кэш или «Загружаем…», а сервер догружается в фоне. Список поиска гильдий тянется только на вкладке «Поиск».' },
      { type: 'ui', icon: '🧩', text: 'В составе гильдии кнопки Глава / Офицер / Выгнать переносятся на новую строку и больше не обрезаются.' }
    ]
  },
  {
    version: 'v5.0.71 PRO',
    date: '7 Октября 2026',
    title: 'Друзья на отдельном Worker без своего домена',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '📡', text: 'Основной сервер пересылает /api/social во второй Worker через service binding — свой домен и Route в Dashboard не нужны. Если social ещё не подключён, отвечает сам основной.' }
    ]
  },
  {
    version: 'v5.0.70 PRO',
    date: '7 Октября 2026',
    title: 'Отдельный сервер для друзей и гильдий',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'feature', icon: '📡', text: 'Друзья, почта и гильдия ходят на /api/social. Можно вынести на отдельный Worker с той же базой; пока маршрут не повешен, отвечает основной сервер.' }
    ]
  },
  {
    version: 'v5.0.69 PRO',
    date: '7 Октября 2026',
    title: 'Заявки в друзья без ожидания',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'ui', icon: '🤝', text: 'Вписал логин и отправил — поле сразу чистое, заявка появляется в исходящих, сервер отвечает в фоне. Принять / отклонить / отменить тоже без зависания окна.' }
    ]
  },
  {
    version: 'v5.0.68 PRO',
    date: '7 Октября 2026',
    title: 'Статус серверов в профиле',
    badge: 'Патч 5.0',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    changes: [
      { type: 'ui', icon: '📡', text: 'В меню профиля блок «Статус серверов»: сохранение, друзья/почта/гильдия и сессия с кнопкой «Проверить».' },
      { type: 'ui', icon: '🛠️', text: 'Ошибка «сервер друзей» заменена на понятный текст про облако. При сбое сети запрос повторяется один раз.' }
    ]
  },
  ...PATCH_NOTES_ARCHIVE
];
