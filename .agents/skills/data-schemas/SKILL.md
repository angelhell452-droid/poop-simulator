---
name: data-schemas
description: Справочник структур данных и шаблонов для добавления ножей, кейсов, фабрик, талантов и ачивок без чтения больших файлов.
---

# Справочник схем данных (Data Schemas)

Используйте эти шаблоны при добавлении новых игровых сущностей. **НЕ читайте целиком файлы `knives.data.js` (88 КБ) или `factories.data.js` (18 КБ)**.

---

## 1. Ножи (`src/data/knives.data.js`)
```javascript
{
  id: "knife_m9_doppler",
  name: "★ M9 Bayonet | Волны (Doppler)",
  rarity: "covert", // 'common' | 'uncommon' | 'rare' | 'classified' | 'covert' | 'contraband'
  rarityName: "Тайное",
  clickMult: 45,
  passiveMult: 8,
  icon: "🌊",
  bladeColor: "#3b82f6",
  handleColor: "#1e1b4b",
  style: "m9", // 'navaja' | 'gut' | 'falchion' | 'flip' | 'shadow' | 'survival' | 'ursus' | 'bowie' | 'huntsman' | 'stiletto' | 'classic' | 'paracord' | 'skeleton' | 'talon' | 'nomad' | 'daggers' | 'm9' | 'karambit' | 'butterfly'
  desc: "Описание ножа и его раскраски."
}
```

---

## 2. Фабрики (`src/data/factories.data.js`)
```javascript
{
  id: 'quantum_reactor',
  name: 'Квантовый Реактор Организма',
  cost: 1e9,
  baseCps: 1.2e7,
  count: 0,
  icon: '⚛️',
  tier: 'mid', // 'early' | 'mid' | 'late' | 'endgame'
  tierNumber: 2,
  tierTitle: '⚡ Тир 2: Био-Индустрия',
  reqStage: 90
}
```

---

## 3. Оружейные кейсы (`src/data/cases.data.js`)
```javascript
{
  id: "case_cyber",
  name: "Кибер-Контейнер",
  icon: "📦",
  currency: "rolls", // 'rolls' | 'plungers'
  cost: 50,
  costPlungers: 0,
  reqEpoch: 5,
  reqForm: 100,
  currencySymbol: "🧻",
  borderClass: "border-cyan-500/70",
  bgClass: "from-cyan-950 via-stone-900 to-stone-950",
  desc: "Описание кейса и топового дропа.",
  fixedChances: {
    "knife_rare_id": 0.01 // 1% фиксированный редкий нож
  },
  pool: [
    "knife_id_1",
    "knife_id_2"
  ]
}
```

---

## 4. Таланты (`src/data/talents.data.js`)
```javascript
{
  id: "click_power_tier1",
  name: "Титановый Клик",
  desc: "+25% к силе каждого клика",
  category: "click", // 'click' | 'idle' | 'prestige' | 'utility'
  icon: "👆",
  maxLevel: 50,
  baseCost: 100,
  costMult: 1.15,
  effectPerLevel: 0.25,
  type: "mult"
}
```

---

## 5. Достижения (`src/data/achievements.data.js`)
```javascript
{
  id: "ach_billionaire",
  name: "Миллиардер",
  desc: "Накопите 1 миллиард биомассы",
  icon: "💰",
  rewardSparkles: 500,
  reqType: "biomass", // 'biomass' | 'clicks' | 'forms' | 'rolls' | 'plungers' | 'knives'
  reqValue: 1e9
}
```
