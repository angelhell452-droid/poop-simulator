export const BODY_SKINS = [
  {
    id: 'skin_robe',
    name: 'Халат',
    clickMult: 2.5,
    price: 25000,
    form: 1,
    boy: 'assets/poop/skins/robe-boy.png',
    girl: 'assets/poop/skins/robe-girl.png'
  },
  {
    id: 'skin_hoodie',
    name: 'Худи стримера',
    clickMult: 4,
    price: 180000,
    form: 100,
    boy: 'assets/poop/skins/hoodie-boy.png',
    girl: 'assets/poop/skins/hoodie-girl.png'
  },
  {
    id: 'skin_tunic',
    name: 'Туника',
    clickMult: 7,
    price: 1500000,
    form: 500,
    boy: 'assets/poop/skins/tunic-boy.png',
    girl: 'assets/poop/skins/tunic-girl.png'
  },
  {
    id: 'skin_tuxedo',
    name: 'Золотой смокинг',
    clickMult: 12,
    price: 12000000,
    form: 2000,
    boy: 'assets/poop/skins/tuxedo-boy.png',
    girl: 'assets/poop/skins/tuxedo-girl.png'
  }
];

export const SKIN_FITTING = false;

export function findBodySkin(id) {
  return BODY_SKINS.find((skin) => skin.id === id) || null;
}
