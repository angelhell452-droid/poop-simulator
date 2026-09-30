export const ARCHETYPES = {
  balanced: {
    id: 'balanced',
    name: '⚖️ Универсал',
    desc: '+15% ко всему доходу и силе клика',
    badge: '⚖️ Универсал',
    clickMult: 1.15,
    passiveMult: 1.15
  },
  clicker: {
    id: 'clicker',
    name: '🗡️ Кликер',
    desc: '+50% к силе ручного клика и критам',
    badge: '🗡️ Кликер (+50%)',
    clickMult: 1.50,
    passiveMult: 1.00
  },
  tycoon: {
    id: 'tycoon',
    name: '🏭 Магнат',
    desc: '+50% к пассивному доходу, -10% скидка на заводы',
    badge: '🏭 Магнат (+50%)',
    clickMult: 1.00,
    passiveMult: 1.50
  },
  gambler: {
    id: 'gambler',
    name: '🎲 Фортуна',
    desc: 'x2 шанс на выпадение Блестяшек ✨ из кликов',
    badge: '🎲 Фортуна (x2 ✨)',
    clickMult: 1.00,
    passiveMult: 1.00
  },
  combo: {
    id: 'combo',
    name: '🔥 Комбо',
    desc: 'x15 к Турбо-Режиму ярости вместо x10',
    badge: '🔥 Комбо (x15 Турбо)',
    clickMult: 1.00,
    passiveMult: 1.00
  }
};
