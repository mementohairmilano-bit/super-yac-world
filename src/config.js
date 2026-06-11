export const PAL = {
  yellow:  0xF2C53D,
  gold:    0xC9A227,
  peach:   0xF2994A,
  rose:    0xC97B84,
  magenta: 0xD96BA0,
  steel:   0x4a5b66,
};

export const CHARACTERS = {
  memento: {
    name: 'Memento', role: 'Equilibrato', power: 'Spara', pdesc: 'raffica di colpi',
    hint: 'Memento · Z (da GRANDE): SPARA una raffica di colpi che eliminano i nemici',
    card: '#E14B3A',
    body: 0x1b1b1f, accent: PAL.yellow, jumps: 1, speed: 188, jump: 650, special: 'shoot',
  },
  yuri: {
    name: 'Yuri', role: 'Creativo', power: 'Invincibile', pdesc: 'invincibile per qualche secondo', passive: 'Doppio salto',
    hint: 'Yuri · Z (da GRANDE): diventa INVINCIBILE per qualche secondo · Doppio salto: premi SALTA due volte',
    card: '#3BB36A',
    body: 0x232027, accent: PAL.peach, jumps: 2, speed: 202, jump: 632, special: 'invince',
  },
  carmine: {
    name: 'Carmine', role: 'Business', power: 'Ground Pound', pdesc: 'schianto a terra',
    hint: "Carmine · Z (da GRANDE): Ground Pound — schianto a terra con onda d'urto (anche da fermo)",
    card: '#3B82E6',
    body: 0x141118, accent: PAL.rose, jumps: 1, speed: 175, jump: 642, special: 'pound',
  },
  andrea: {
    name: 'Andrea', role: 'Regista', power: 'Regia', pdesc: 'ferma il tempo',
    hint: 'Andrea · Z (da GRANDE): Regia — rallenta/ferma il tempo per qualche secondo',
    card: '#EC6AAE',
    body: 0xF2C53D, accent: PAL.magenta, jumps: 1, speed: 188, jump: 650, special: 'slowmo',
  },
  riccardo: {
    name: 'Riccardo', role: 'Tenace', power: 'Deambulatore', pdesc: 'rallenta i nemici con il suo deambulatore rosso',
    hint: 'Riccardo · Z (da GRANDE): Deambulatore — tutti i nemici in schermo rallentano per 6 secondi',
    card: '#CC2222',
    body: 0x1a0505, accent: 0xcc2222, jumps: 2, speed: 195, jump: 650, special: 'walker', heroScale: 1.12,
  },
};
