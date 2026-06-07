// Definizione dei MONDI di Super Yac World.
// Ogni mondo è puro DATO: la GameScene legge questo oggetto e costruisce il livello.
// Aggiungere un mondo = aggiungere una voce qui (+ eventuali meccaniche nuove nel motore).
//
// Convenzioni coordinate: l'altezza di gioco è 506px (H). I valori Y sono già assoluti.
// I percorsi asset seguono lo stesso schema di preload() esistente ('./assets/...').

const A = './assets/';

// Set di sprite di default (Mondo 1). I mondi successivi sovrascrivono solo ciò che cambia.
const SPRITES_DEFAULT = {
  enemy:      A + 'soldato.webp',      // nemico base (goomba)
  koopa:      A + 'koopa.webp',        // nemico a guscio (koopa)
  shell:      A + 'gusciokoopa.webp',  // guscio dopo lo stomp
  brick:      A + 'blocco.webp',       // mattone/solido
  qblock:     A + 'puntodomanda.webp', // blocco "?"
  blockempty: A + 'block_empty.webp',  // blocco "?" esaurito
  mush:       A + 'yes.webp',          // Boccetta YAC (power-up)
  coin:       A + 'coin_goccia.webp',  // Goccia d'Oro
  pipe:       A + 'pipe.webp',         // tubo entrabile
  flagpole:   A + 'flagpole.webp',     // pennone di fine livello
};

// ====================== MONDO 1 — La Catena di Montaggio ======================
const MONDO1 = {
  id: 1,
  name: 'MONDO 1',
  letter: { id: 0, char: 'F', x: 3135, y: 165 },   // lettera nascosta FREEDOM — sopra l'arco alto
  sub: 'La Catena di Montaggio',
  width: 8000,
  next: 2,

  bg: { surface: A + 'sfondomondo1.webp', under: A + 'sotterraneo_dim.webp' },
  // immagine del sotterraneo: posizione/visibilità
  bgUnder: { x: 7400, showAfterX: 6900, w: 1100, h: 536 },

  music: { surface: 'mondo1_loop', under: 'underground_loop', boss: 'boss_loop' },

  sprites: SPRITES_DEFAULT,

  // terreno principale: [centerX, larghezza]
  ground: [
    [550, 1100], [1735, 930], [3035, 1330], [4685, 1630], [5900, 800], [6540, 520],
  ],

  // geometria del sotterraneo (rettangoli solidi) {cx, cy, w, h, tint}
  underground: [
    { cx: 7400, cy: 490, w: 800, h: 40, tint: 0x2a1d24 },   // pavimento (H-16)
    { cx: 7400, cy: 200, w: 800, h: 30, tint: 0x241821 },   // soffitto
    { cx: 7000, cy: 306, w: 30, h: 420, tint: 0x241821 },   // parete sx (H-200)
    { cx: 7800, cy: 306, w: 30, h: 420, tint: 0x241821 },   // parete dx
  ],

  // blocchi: gruppi-riga {x, topY, kinds:[...], gift?} (gift applicato ai "q" della riga)
  blocks: [
    { x: 560,  topY: 380, kinds: ['solid', 'q', 'solid'] },
    { x: 520,  topY: 300, kinds: ['q'], gift: 'mush' },
    { x: 4500, topY: 300, kinds: ['q'], gift: 'mush' },
    { x: 720,  topY: 300, kinds: ['solid', 'solid'] },
    { x: 680,  topY: 210, kinds: ['brick', 'q', 'brick'] },
    { x: 1750, topY: 380, kinds: ['solid', 'q', 'solid'] },
    { x: 1910, topY: 300, kinds: ['solid', 'solid', 'q'] },
    { x: 2520, topY: 380, kinds: ['solid', 'solid'] },
    { x: 2740, topY: 380, kinds: ['q', 'solid', 'q', 'solid'] },
    { x: 2940, topY: 300, kinds: ['solid', 'solid'] },
    { x: 3120, topY: 255, kinds: ['solid', 'q', 'solid'] },
    { x: 3000, topY: 210, kinds: ['brick', 'brick'] },
    { x: 3930, topY: 380, kinds: ['solid', 'solid'] },
    { x: 4140, topY: 320, kinds: ['solid', 'q', 'solid'] },
    { x: 4360, topY: 250, kinds: ['solid', 'solid'] },
    { x: 4860, topY: 360, kinds: ['q', 'solid', 'q'] },
    { x: 5080, topY: 290, kinds: ['solid', 'solid'] },
    // blocchi del sotterraneo
    { x: 2800, topY: 300, kinds: ['brick'], gift: 'oneup' },   // VITA EXTRA (1-UP)
    { x: 7090, topY: 380, kinds: ['solid', 'solid'] },
    { x: 7300, topY: 360, kinds: ['solid', 'solid', 'solid'] },
    { x: 7300, topY: 250, kinds: ['q', 'q', 'q'] },
    { x: 7560, topY: 380, kinds: ['solid', 'solid'] },
    { x: 7630, topY: 300, kinds: ['solid'] },
  ],

  // gradinata stile SMB prima della bandiera {x0, steps}
  staircase: { x0: 6080, steps: 5 },

  // monete: gruppi {x, y, n?, dx?} (n=1, dx=34 default)
  coins: [
    { x: 575, y: 350, n: 4 }, { x: 735, y: 270, n: 3 }, { x: 1765, y: 350, n: 4 },
    { x: 2745, y: 350, n: 4 }, { x: 2955, y: 270, n: 3 }, { x: 3135, y: 200, n: 3 },
    { x: 4155, y: 290, n: 3 }, { x: 4375, y: 220, n: 3 }, { x: 5095, y: 260, n: 3 },
    { x: 7095, y: 345, n: 2 }, { x: 7305, y: 330, n: 3 }, { x: 7150, y: 420, n: 4 },
    { x: 7560, y: 345, n: 2 },
    { x: 7250, y: 300 }, { x: 7470, y: 300 }, { x: 7645, y: 278 },
  ],

  // nemici: {x, y, minX, maxX, kind?} (kind 'goomba' default)
  enemies: [
    { x: 820,  y: 448, minX: 200,  maxX: 1050 },
    { x: 1850, y: 448, minX: 1320, maxX: 2150 },
    { x: 2810, y: 362, minX: 2750, maxX: 2860 },
    { x: 3300, y: 448, minX: 2420, maxX: 3650, kind: 'koopa' },
    { x: 4600, y: 448, minX: 3950, maxX: 5430 },
    { x: 5000, y: 448, minX: 4700, maxX: 5430, kind: 'koopa' },
    { x: 6050, y: 448, minX: 5520, maxX: 6240 },
  ],

  // tubi: {x, target:{x,y}}
  pipes: [
    { x: 1500, target: { x: 7200, y: 390 } },
    { x: 7720, target: { x: 1560, y: 390 } },
  ],

  checkpoint: { x: 3300 },

  boss: {
    type: 'megagloss', label: 'MEGAGLOSS',
    sprite: A + 'boss.webp', shot: A + 'boss_shot.webp',
    hp: 3, scaleH: 80,
    arena: { minX: 5860, maxX: 6005, spawnX: 5935 },
    gate: { x: 6030, h: 330 },
    trigger: { x: 5560 },
  },

  flagpole: { x: 6300 },

  salone: {
    x: 6620, corp: A + 'salon_corp.webp', yac: A + 'salon_yac.webp', label: 'SALONE YAC',
  },

  win: {
    title: 'Salone liberato — adesso è uno YAC Salon! 🎉',
    tag: 'Hai cacciato la multinazionale: prodotto vero batte produzione di massa. Mondo 1 completato.',
  },
};

// ====================== MONDO 2-1 — Zona di Carico (superficie) ======================
// Meccaniche nuove: nastri trasportatori, molla pallet, casse che si sgretolano, Tubetto Alato.
// Livello intermedio: niente boss/salone (il boss BoxKing è nella torre 2-3).
const MONDO2 = {
  id: 2,
  name: 'MONDO 2-1',
  sub: 'Zona di Carico',
  width: 6900,
  next: 3,

  bg: { surface: A + 'sfondomondo2.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo2_loop', under: 'underground_loop', boss: 'mondo2_boss_loop' },

  sprites: {
    ...SPRITES_DEFAULT,
    enemy: A + 'enemy_scatolotto.webp',     // Scatolotto (cassa-goomba)
    koopa: A + 'enemy_tubetto_alato.webp',  // Tubetto Alato (volante)
    koopawalk: A + 'enemy_tubetto_walk.webp', // Tubetto senza ali (a terra dopo lo stomp)
    shell: A + 'enemy_tubetto_shell.webp',    // guscio tubo (Mondo 2)
  },

  ground: [
    [550, 1100], [1735, 930], [3035, 1330], [4685, 1630], [5900, 800], [6540, 520],
  ],

  underground: [],

  // MECCANICA NUOVA: nastri trasportatori. Spingono il player (e i nemici a terra)
  // mentre cammina sul tratto. topY = quota del pavimento su cui poggia il nastro.
  // {x1, x2, topY, dir(+1 destra / -1 sinistra), speed}
  conveyors: [
    { x1: 250,  x2: 700,  topY: 470, dir: 1,  speed: 80 },   // aiuta (impari la meccanica)
    { x1: 1360, x2: 1700, topY: 470, dir: 1,  speed: 115 },  // ti lancia verso il salto
    { x1: 2760, x2: 3160, topY: 470, dir: -1, speed: 100 },  // resiste (tensione)
    { x1: 4120, x2: 4620, topY: 470, dir: 1,  speed: 115 },
  ],

  // MECCANICA NUOVA: molla pallet. Rimbalzo alto verso una scorta di Gocce.
  // {x, topY, power}
  springs: [
    { x: 2280, topY: 470, power: 840 },
  ],

  blocks: [
    { x: 560,  topY: 380, kinds: ['solid', 'q', 'solid'] },
    { x: 520,  topY: 300, kinds: ['q'], gift: 'mush' },
    { x: 4500, topY: 300, kinds: ['q'], gift: 'mush' },
    { x: 720,  topY: 300, kinds: ['solid', 'solid'] },
    { x: 680,  topY: 210, kinds: ['brick', 'q', 'brick'] },
    { x: 1750, topY: 380, kinds: ['solid', 'q', 'solid'] },
    { x: 1910, topY: 300, kinds: ['solid', 'solid', 'q'] },
    { x: 2520, topY: 380, kinds: ['solid', 'solid'] },
    { x: 2740, topY: 380, kinds: ['q', 'solid', 'q', 'solid'] },
    { x: 2940, topY: 300, kinds: ['solid', 'solid'] },
    { x: 3120, topY: 255, kinds: ['solid', 'q', 'solid'] },
    { x: 3000, topY: 210, kinds: ['brick', 'brick'] },
    { x: 3930, topY: 380, kinds: ['solid', 'solid'] },
    { x: 4140, topY: 320, kinds: ['solid', 'q', 'solid'] },
    { x: 4360, topY: 250, kinds: ['solid', 'solid'] },
    // MECCANICA NUOVA: casse che si sgretolano (rimani sopra troppo a lungo → crollano)
    { x: 3500, topY: 300, kinds: ['brick'], gift: 'oneup' },   // VITA EXTRA (1-UP)
    { x: 4860, topY: 350, kinds: ['crumble', 'crumble', 'crumble'] },
    { x: 5080, topY: 290, kinds: ['solid', 'solid'] },
  ],

  staircase: { x0: 6080, steps: 5 },

  coins: [
    { x: 575, y: 350, n: 4 }, { x: 735, y: 270, n: 3 }, { x: 1765, y: 350, n: 4 },
    { x: 2745, y: 350, n: 4 }, { x: 2955, y: 270, n: 3 }, { x: 3135, y: 200, n: 3 },
    { x: 4155, y: 290, n: 3 }, { x: 4375, y: 220, n: 3 },
    // ricompensa molla pallet (arco alto sopra x~2280)
    { x: 2240, y: 230, n: 3 }, { x: 2250, y: 170, n: 2, dx: 40 },
    // ricompensa casse fragili
    { x: 4875, y: 300, n: 3, dx: 32 },
  ],

  enemies: [
    { x: 820,  y: 448, minX: 200,  maxX: 1050 },
    { x: 1850, y: 448, minX: 1320, maxX: 2150 },
    { x: 2500, y: 300, minX: 2280, maxX: 2900, kind: 'flyer' },  // Tubetto Alato
    { x: 3400, y: 448, minX: 2900, maxX: 3650 },
    { x: 4700, y: 448, minX: 3950, maxX: 5430 },
    { x: 5100, y: 300, minX: 4700, maxX: 5430, kind: 'flyer' },  // Tubetto Alato
    { x: 6050, y: 448, minX: 5520, maxX: 6240 },
  ],

  pipes: [],

  checkpoint: { x: 3300 },

  boss: null,    // livello intermedio: nessun boss
  flagpole: { x: 6300 },
  salone: null,  // niente liberazione qui (avverrà nel livello finale del mondo)

  win: {
    cta: 'Prossimo settore →',
    title: 'Zona di Carico completata! 🎉',
    tag: 'Hai attraversato i nastri della baia di carico. Ora si scende nel sottomagazzino allagato…',
  },
};

// ====================== MONDO 2-2 — Sottomagazzino allagato (acqua) ======================
// Meccanica nuova: NUOTO (salto = bracciata, gravità ridotta). Hazard: correnti di scarico
// che trascinano giù. Nemici: Flacone galleggiante (traversa) e Spugnotto (insegue).
const MONDO2_2 = {
  id: 3,
  name: 'MONDO 2-2',
  letter: { id: 1, char: 'R', x: 2060, y: 95 },   // lettera nascosta FREEDOM — salto alto sopra le monete a y130
  sub: 'Sottomagazzino allagato',
  width: 5200,
  next: 4,                 // 2-3 (torre) ancora da costruire → tasto "prossimo" nascosto finché manca
  water: true,
  spawn: { x: 110, y: 150 },   // si parte nuotando a mezz'acqua

  bg: { surface: A + 'bg_m2_water.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo2_water_loop', under: 'mondo2_water_loop', boss: 'mondo2_boss_loop' },

  sprites: {
    ...SPRITES_DEFAULT,
    flacone: A + 'enemy_flacone_float.webp',     // Flacone galleggiante (cheep-cheep)
    spugnotto: A + 'enemy_spugnotto.webp',       // Spugnotto inseguitore (blooper)
  },

  // pavimento continuo (fondale): si può toccare, non uccide. Morte solo sotto il mondo.
  ground: [[2600, 5300]],
  underground: [],

  // ostacoli sommersi (scaffali/casse) da aggirare nuotando, a varie quote
  blocks: [
    { x: 900,  topY: 250, kinds: ['solid', 'solid'] },
    { x: 1500, topY: 380, kinds: ['solid', 'solid', 'solid'] },
    { x: 2050, topY: 180, kinds: ['solid', 'solid'] },
    { x: 2600, topY: 330, kinds: ['solid', 'solid'] },
    { x: 3250, topY: 200, kinds: ['solid', 'solid'] },
    { x: 2900, topY: 220, kinds: ['brick'], gift: 'oneup' },   // VITA EXTRA (1-UP), si colpisce nuotando
    { x: 3800, topY: 360, kinds: ['solid', 'solid', 'solid'] },
    { x: 4350, topY: 240, kinds: ['solid', 'solid'] },
  ],

  // correnti di scarico (3, fedele all'originale): trascinano giù mentre le attraversi
  currents: [
    { x1: 1180, x2: 1340, y1: 60, y2: 470, force: 16 },
    { x1: 2380, x2: 2560, y1: 60, y2: 470, force: 18 },
    { x1: 3520, x2: 3700, y1: 60, y2: 470, force: 18 },
  ],

  // tante Gocce d'Oro (feeling sotterraneo-bonus)
  coins: [
    { x: 360, y: 200, n: 4 }, { x: 700, y: 300, n: 3 },
    { x: 920, y: 210, n: 2 }, { x: 1500, y: 330, n: 3 },
    { x: 1760, y: 160, n: 4 }, { x: 2060, y: 130, n: 2 },
    { x: 2300, y: 300, n: 3 }, { x: 2900, y: 220, n: 3 },
    { x: 3260, y: 150, n: 2 }, { x: 3500, y: 320, n: 3 },
    { x: 4000, y: 200, n: 4 }, { x: 4400, y: 300, n: 3 },
    { x: 4750, y: 200, n: 3 },
  ],

  // tanti Flacone a varie quote: alcuni passano BASSI (camminare sul fondo non basta a evitarli)
  enemies: [
    { x: 700,  y: 180, minX: 400,  maxX: 1200, kind: 'floater' },  // alto
    { x: 1000, y: 425, minX: 600,  maxX: 1400, kind: 'floater' },  // BASSO
    { x: 1700, y: 300, minX: 1450, maxX: 2150, kind: 'floater' },  // medio
    { x: 2000, y: 440, minX: 1700, maxX: 2400, kind: 'floater' },  // BASSO
    { x: 2200, y: 250, minX: 1900, maxX: 2700, kind: 'chaser' },
    { x: 2650, y: 190, minX: 2350, maxX: 3050, kind: 'floater' },  // alto
    { x: 3050, y: 420, minX: 2750, maxX: 3500, kind: 'floater' },  // BASSO
    { x: 3700, y: 285, minX: 3400, maxX: 4250, kind: 'floater' },  // medio
    { x: 3900, y: 240, minX: 3600, maxX: 4300, kind: 'chaser' },
    { x: 4350, y: 435, minX: 4050, maxX: 4850, kind: 'floater' },  // BASSO
  ],

  pipes: [],

  checkpoint: { x: 2600 },
  staircase: null,
  boss: null,
  flagpole: { x: 5000 },
  salone: null,

  win: {
    cta: 'Prossimo settore →',
    title: 'Sottomagazzino superato! 🤿',
    tag: 'Hai nuotato tra correnti e flaconi. Prossima tappa: la Torre degli Scaffali (in arrivo).',
  },
};

// ====================== MONDO 2-3 — Torre degli Scaffali → boss BoxKing ======================
// Meccaniche nuove: platforming verticale, piattaforme-muletto mobili, casse che piovono,
// bracci di gru rotanti. Livello FINALE del mondo: boss BoxKing + liberazione salone.
const MONDO2_3 = {
  id: 4,
  name: 'MONDO 2-3',
  sub: 'La Torre degli Scaffali',
  width: 5500,
  next: 5,   // → Mondo 3 dopo la liberazione

  bg: { surface: A + 'bg_m2_tower.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo2_tower_loop', under: 'mondo2_tower_loop', boss: 'mondo2_boss_loop' },

  sprites: {
    ...SPRITES_DEFAULT,
    enemy: A + 'enemy_scatolotto.webp',
    koopa: A + 'enemy_tubetto_alato.webp',
    koopawalk: A + 'enemy_tubetto_walk.webp',
    shell: A + 'enemy_tubetto_shell.webp',
  },

  // terreno a sezioni con baratri (caduta = morte) attraversabili con lift/piattaforme
  ground: [
    [500, 1000], [1900, 700], [3100, 600], [4700, 1300],
  ],
  underground: [],

  blocks: [
    // sezione 1: scaletta di scaffali (gradini larghi, raggiungibili da terra)
    { x: 300, topY: 400, kinds: ['solid', 'solid'] },
    { x: 480, topY: 340, kinds: ['solid', 'solid'] },
    { x: 680, topY: 300, kinds: ['solid', 'solid'] },
    // BARATRO 1: piattaforme LARGHE (3 blocchi), varchi ≤150 → saltabili da tutti
    { x: 1120, topY: 400, kinds: ['solid', 'solid', 'solid'] },
    { x: 1340, topY: 380, kinds: ['solid', 'solid', 'solid'] },
    // sezione 2 + 1-UP
    { x: 2150, topY: 300, kinds: ['brick'], gift: 'oneup' },   // VITA EXTRA (1-UP), colpibile da terra
    // BARATRO 2
    { x: 2370, topY: 400, kinds: ['solid', 'solid', 'solid'] },
    { x: 2590, topY: 380, kinds: ['solid', 'solid', 'solid'] },
    // BARATRO 3 (più largo): 3 piattaforme
    { x: 3520, topY: 400, kinds: ['solid', 'solid'] },
    { x: 3700, topY: 380, kinds: ['solid', 'solid'] },
    { x: 3880, topY: 400, kinds: ['solid', 'solid'] },
    // ARENA boss: 2 piattaforme (raggiungibili da terra) per saltare PULITO sopra BoxKing
    { x: 4200, topY: 378, kinds: ['solid', 'solid'] },
    { x: 4470, topY: 378, kinds: ['solid', 'solid'] },
  ],

  // piattaforme-muletto (meccanica del mondo): ELEVATORI sulle isole verso le Gocce in alto
  lifts: [
    { x: 1900, y: 390, range: 80, speed: 70, w: 96 },
    { x: 3100, y: 390, range: 80, speed: 78, w: 96 },
  ],

  // casse che piovono: {x, top, interval, startAt}
  droppers: [
    { x: 1750, top: 40, interval: 1900, startAt: 600 },
    { x: 2080, top: 40, interval: 2300, startAt: 1400 },
    { x: 3200, top: 40, interval: 2000, startAt: 500 },
  ],

  // bracci di gru rotanti (hazard): {x, y, len, speed(rad/tick), angle}
  cranes: [
    { x: 1280, y: 205, len: 85, speed: 1.2 },
    { x: 3000, y: 235, len: 95, speed: -1.3 },
  ],

  coins: [
    { x: 300, y: 370, n: 2 }, { x: 480, y: 310, n: 2 }, { x: 680, y: 270, n: 2 },
    { x: 1120, y: 370, n: 3, dx: 32 }, { x: 1340, y: 350, n: 3, dx: 32 },
    { x: 1900, y: 300, n: 2 }, { x: 1900, y: 220, n: 2 },   // bonus sopra il muletto (G2)
    { x: 2370, y: 370, n: 3, dx: 32 }, { x: 2590, y: 350, n: 3, dx: 32 },
    { x: 3100, y: 300, n: 2 }, { x: 3100, y: 220, n: 2 },   // bonus sopra il muletto (G3)
    { x: 3520, y: 370, n: 2 }, { x: 3700, y: 350, n: 2 }, { x: 3880, y: 370, n: 2 },
    { x: 4150, y: 340, n: 3 },
  ],

  enemies: [
    { x: 700,  y: 448, minX: 200,  maxX: 950 },
    { x: 1900, y: 448, minX: 1600, maxX: 2200 },
    { x: 2100, y: 300, minX: 1900, maxX: 2230, kind: 'flyer' },
    { x: 3150, y: 448, minX: 2850, maxX: 3380 },
  ],

  pipes: [],

  checkpoint: { x: 2800 },
  staircase: { x0: 4620, steps: 4 },

  boss: {
    type: 'boxking', label: 'BOXKING',
    sprite: A + 'boss_boxking.webp', shot: A + 'boss_shot.webp',
    hp: 3, scaleH: 104,
    arena: { minX: 4250, maxX: 4490, spawnX: 4370 },
    gate: { x: 4580, h: 330 },
    trigger: { x: 4110 },
  },

  flagpole: { x: 4900 },

  salone: {
    x: 5180, corp: A + 'salon_corp.webp', yac: A + 'salon_yac.webp', label: 'SALONE YAC',
  },

  win: {
    title: 'Magazzino liberato — è uno YAC Salon! 🎉',
    tag: 'Hai scalato la Torre, sbaragliato BoxKing e ripreso tutto il Magazzino. Mondo 2 completato!',
  },
};

// ====================== MONDO 3-1 — Viale dei Cartelloni (superficie, notte) ======================
// Meccaniche nuove: notte/neon, Promoter (Hammer Bro che lancia volantini), Spray-Bill (Bullet Bill
// dai cartelloni-cannone), piattaforme-neon lampeggianti (con preavviso), Etichetta-Spam volante.
// Livello intermedio: niente boss/salone.
const MONDO3_1 = {
  id: 5,
  name: 'MONDO 3-1',
  sub: 'Viale dei Cartelloni',
  width: 6400,
  next: 6,
  night: true,

  bg: { surface: A + 'bg_m3_surface.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo3_loop', under: 'mondo3_loop', boss: 'mondo3_boss_loop' },

  sprites: {
    ...SPRITES_DEFAULT,
    promoter: A + 'enemy_promoter.webp',     // Promoter / Hammer Bro
    spraybill: A + 'enemy_spraybill.webp',   // Spray-Bill / Bullet Bill
    spam: A + 'enemy_etichetta_spam.webp',   // Etichetta-Spam volante
  },

  ground: [
    [550, 1100], [1735, 930], [3035, 1430], [4400, 1000], [5500, 1000], [6150, 460],
  ],
  underground: [],

  blocks: [
    { x: 700,  topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 520,  topY: 300, kinds: ['q'], gift: 'mush' },
    { x: 1500, topY: 300, kinds: ['brick', 'q', 'brick'] },
    { x: 2450, topY: 300, kinds: ['q'], gift: 'mush' },
    { x: 2700, topY: 300, kinds: ['brick'], gift: 'oneup' },   // VITA EXTRA (1-UP) nascosta
    { x: 3300, topY: 360, kinds: ['solid', 'solid'] },
    { x: 4150, topY: 320, kinds: ['solid', 'q', 'solid'] },
    { x: 5150, topY: 330, kinds: ['solid', 'q'] },
  ],

  // piattaforme-neon lampeggianti (bonus elevati: se spariscono cadi sul terreno, non muori)
  neonPlats: [
    { x: 1180, y: 320, w: 80, onTime: 1800, offTime: 1100, phase: 0 },
    { x: 1700, y: 230, w: 72, onTime: 1700, offTime: 1200, phase: 500 },
    { x: 2260, y: 320, w: 80, onTime: 1800, offTime: 1100, phase: 900 },
    { x: 3820, y: 320, w: 80, onTime: 1700, offTime: 1300, phase: 400 },
    { x: 4950, y: 300, w: 80, onTime: 1800, offTime: 1100, phase: 1200 },
  ],

  // cartelloni-cannone che sparano Spray-Bill orizzontali (a quota player → da schivare/saltare)
  cannons: [
    { x: 3700, y: 432, dir: -1, interval: 2800, speed: 165, startAt: 600 },
    { x: 5750, y: 432, dir: -1, interval: 3000, speed: 165, startAt: 1500 },
  ],

  coins: [
    { x: 560, y: 330, n: 3 }, { x: 700, y: 320, n: 2 },
    { x: 1180, y: 285, n: 2 }, { x: 1690, y: 195, n: 2, dx: 30 },
    { x: 2260, y: 285, n: 2 }, { x: 2900, y: 330, n: 3 },
    { x: 3820, y: 285, n: 2 }, { x: 4150, y: 285, n: 2 },
    { x: 4950, y: 265, n: 2 }, { x: 5300, y: 330, n: 3 },
  ],

  enemies: [
    { x: 900,  y: 430, minX: 600,  maxX: 1080, kind: 'promoter' },
    { x: 1700, y: 300, minX: 1320, maxX: 2150, kind: 'spam' },
    { x: 2000, y: 430, minX: 1330, maxX: 2180, kind: 'promoter' },
    { x: 3200, y: 430, minX: 2400, maxX: 3700, kind: 'promoter' },
    { x: 3450, y: 270, minX: 3000, maxX: 3720, kind: 'spam' },
    { x: 4600, y: 430, minX: 3950, maxX: 4870, kind: 'promoter' },
    { x: 5400, y: 290, minX: 5050, maxX: 5880, kind: 'spam' },
  ],

  pipes: [],

  checkpoint: { x: 3035 },
  staircase: { x0: 5440, steps: 3 },
  boss: null,
  flagpole: { x: 5700 },
  salone: null,

  win: {
    cta: 'Prossimo settore →',
    title: 'Viale dei Cartelloni completato! 🌃',
    tag: 'Hai schivato volantini e Spray-Bill al neon. Ora si scende nella Rete, quasi al buio…',
  },
};

// ====================== MONDO 3-2 — La Rete (sotterraneo, buio) ======================
// Meccanica nuova: VISIBILITÀ RIDOTTA. Buio con un alone di luce attorno al player + lampi
// periodici delle insegne rotte che rivelano il percorso. Tante Gocce. Livello intermedio.
const MONDO3_2 = {
  id: 6,
  name: 'MONDO 3-2',
  letter: { id: 2, char: 'E', x: 1910, y: 165 },   // lettera nascosta FREEDOM — sopra le monete a y210
  sub: 'La Rete',
  width: 5400,
  next: 7,
  dark: true,

  bg: { surface: A + 'bg_m3_net.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo3_net_loop', under: 'mondo3_net_loop', boss: 'mondo3_boss_loop' },

  sprites: {
    ...SPRITES_DEFAULT,
    promoter: A + 'enemy_promoter.webp',
    spraybill: A + 'enemy_spraybill.webp',
    spam: A + 'enemy_etichetta_spam.webp',
  },

  // pavimento continuo (al buio niente baratri mortali ciechi: sarebbe ingiusto)
  ground: [[700, 1500], [2100, 1500], [3500, 1500], [4750, 1300]],
  underground: [],

  blocks: [
    { x: 600,  topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 520,  topY: 280, kinds: ['q'], gift: 'mush' },
    { x: 1400, topY: 320, kinds: ['brick', 'brick', 'brick'] },
    { x: 1900, topY: 255, kinds: ['q', 'q'] },
    { x: 2500, topY: 340, kinds: ['solid', 'solid'] },
    { x: 2900, topY: 280, kinds: ['brick'], gift: 'oneup' },   // VITA EXTRA (1-UP) nascosta
    { x: 3400, topY: 330, kinds: ['solid', 'q', 'solid'] },
    { x: 4200, topY: 300, kinds: ['solid', 'solid'] },
  ],

  // tante Gocce d'Oro (feeling sotterraneo-bonus)
  coins: [
    { x: 560, y: 250, n: 3 }, { x: 620, y: 330, n: 2 },
    { x: 1180, y: 360, n: 4 }, { x: 1420, y: 290, n: 3, dx: 30 },
    { x: 1910, y: 210, n: 2 }, { x: 2250, y: 360, n: 4 },
    { x: 2900, y: 250, n: 2 }, { x: 3150, y: 360, n: 3 },
    { x: 3420, y: 300, n: 3 }, { x: 3900, y: 360, n: 4 },
    { x: 4220, y: 270, n: 2 }, { x: 4500, y: 360, n: 3 },
  ],

  enemies: [
    { x: 1000, y: 330, minX: 700,  maxX: 1380, kind: 'spam' },
    { x: 1550, y: 250, minX: 1300, maxX: 1950, kind: 'spam' },
    { x: 2200, y: 330, minX: 1900, maxX: 2700, kind: 'spam' },
    { x: 2600, y: 430, minX: 2300, maxX: 2980, kind: 'promoter' },
    { x: 3000, y: 300, minX: 2750, maxX: 3480, kind: 'spam' },
    { x: 3700, y: 270, minX: 3400, maxX: 4150, kind: 'spam' },
    { x: 4350, y: 330, minX: 4050, maxX: 4720, kind: 'spam' },
  ],

  pipes: [],

  checkpoint: { x: 2750 },
  staircase: { x0: 4650, steps: 3 },
  boss: null,
  flagpole: { x: 4950 },
  salone: null,

  win: {
    cta: 'Prossimo settore →',
    title: 'La Rete superata! 🔦',
    tag: 'Hai attraversato il buio coi lampi delle insegne. Ultima salita: In Quota, fino a ViralCorp.',
  },
};

// ====================== MONDO 3-3 — In Quota → boss ViralCorp (castello) ======================
// Platforming di precisione sul vuoto, tra piattaforme-neon lampeggianti e cartelloni sospesi,
// fino all'arena del boss. Livello FINALE del Mondo 3: boss ViralCorp (5 colpi) + liberazione.
const MONDO3_3 = {
  id: 7,
  name: 'MONDO 3-3',
  sub: 'In Quota',
  width: 5200,
  next: 8,   // → Mondo 4 dopo la liberazione
  night: true,

  bg: { surface: A + 'bg_m3_heights.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo3_heights_loop', under: 'mondo3_heights_loop', boss: 'mondo3_boss_loop' },

  sprites: {
    ...SPRITES_DEFAULT,
    promoter: A + 'enemy_promoter.webp',
    spraybill: A + 'enemy_spraybill.webp',
    spam: A + 'enemy_etichetta_spam.webp',
  },

  // solo terra a inizio e all'arena: in mezzo è il VUOTO (caduta = morte), si attraversa sulle piattaforme
  ground: [[500, 1000], [4350, 1500]],
  underground: [],

  blocks: [
    { x: 520,  topY: 300, kinds: ['q'], gift: 'mush' },
    { x: 1366, topY: 360, kinds: ['solid', 'solid'] },
    { x: 1750, topY: 415, kinds: ['solid', 'solid', 'solid', 'solid'] },   // piazzola di sosta (checkpoint)
    { x: 2199, topY: 360, kinds: ['solid', 'solid'] },
    { x: 2300, topY: 250, kinds: ['brick'], gift: 'oneup' },                // VITA EXTRA (1-UP) nascosta
    { x: 2583, topY: 380, kinds: ['solid', 'solid', 'solid'] },
    { x: 2987, topY: 360, kinds: ['solid', 'solid'] },
    { x: 3371, topY: 380, kinds: ['solid', 'solid', 'solid'] },
  ],

  // piattaforme-neon lampeggianti SUL VUOTO (timing di precisione) + 2 nell'arena per saltare sul boss
  neonPlats: [
    { x: 1175, y: 380, w: 90, onTime: 1800, offTime: 1100, phase: 0 },
    { x: 1559, y: 370, w: 90, onTime: 1700, offTime: 1200, phase: 600 },
    { x: 2008, y: 370, w: 90, onTime: 1800, offTime: 1100, phase: 300 },
    { x: 2392, y: 370, w: 90, onTime: 1700, offTime: 1200, phase: 900 },
    { x: 2796, y: 370, w: 90, onTime: 1800, offTime: 1100, phase: 200 },
    { x: 3180, y: 370, w: 90, onTime: 1700, offTime: 1200, phase: 700 },
    { x: 3950, y: 320, w: 90, onTime: 2200, offTime: 900, phase: 0 },       // arena: per saltare sul boss
    { x: 4500, y: 320, w: 90, onTime: 2200, offTime: 900, phase: 1100 },
  ],

  coins: [
    { x: 560, y: 250, n: 2 }, { x: 1175, y: 330, n: 2 }, { x: 1366, y: 310, n: 2 },
    { x: 1559, y: 320, n: 2 }, { x: 2008, y: 320, n: 2 }, { x: 2300, y: 200, n: 2 },
    { x: 2583, y: 330, n: 3 }, { x: 2796, y: 320, n: 2 }, { x: 3180, y: 320, n: 2 },
    { x: 3371, y: 330, n: 3 },
  ],

  enemies: [
    { x: 2000, y: 300, minX: 1700, maxX: 2400, kind: 'spam' },
    { x: 3000, y: 300, minX: 2700, maxX: 3400, kind: 'spam' },
  ],

  pipes: [],

  checkpoint: { x: 1750 },
  staircase: null,

  boss: {
    type: 'viralcorp', label: 'VIRALCORP',
    sprite: A + 'boss_viralcorp.webp', shot: A + 'boss_shot.webp',
    hp: 5, scaleH: 120,
    arena: { minX: 4080, maxX: 4380, spawnX: 4230 },
    gate: { x: 4560, h: 360 },
    trigger: { x: 3850 },
  },

  flagpole: { x: 4800 },

  salone: {
    x: 5050, corp: A + 'salon_corp.webp', yac: A + 'salon_yac.webp', label: 'SALONE YAC',
  },

  win: {
    title: 'Distretto liberato — diventa YAC! 🎉🌃',
    tag: 'Hai spento ViralCorp… ma era solo un altro marchio di The Conglomerate. Mondo 3 completato!',
  },
};

// ====================== MONDO 4-1 — Le Vasche (superficie, luminoso) ======================
// Ritorno alla LUCE (laboratorio bianco-clinico + verde tossico). Meccaniche nuove:
// Spruzzabot (Lakitu che insegue dall'alto e dropga Gocce Corrosive), Goccia Corrosiva (Spiny,
// non schiacciabile), vasche di liquido tossico (contatto = morte), piattaforme-becher (crumble).
const MONDO4_1 = {
  id: 8,
  name: 'MONDO 4-1',
  sub: 'Le Vasche',
  width: 5800,
  next: 9,

  bg: { surface: A + 'bg_m4_surface.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo4_loop', under: 'mondo4_loop', boss: 'mondo4_boss_loop' },

  sprites: {
    ...SPRITES_DEFAULT,
    lakitu: A + 'enemy_spruzzabot.webp',       // Spruzzabot (Lakitu)
    spiny: A + 'enemy_goccia_corrosiva.webp',  // Goccia Corrosiva (Spiny)
  },

  // terra a sezioni; in mezzo le VASCHE tossiche (si attraversano sulle piattaforme)
  ground: [[500, 1000], [2050, 1100], [3550, 1100], [5100, 1200]],
  underground: [],

  // liquido tossico nelle vasche (contatto = morte)
  hazards: [
    { x1: 1000, x2: 1500, y1: 455 },
    { x1: 2600, x2: 3000, y1: 455 },
    { x1: 4100, x2: 4500, y1: 455 },
  ],

  blocks: [
    { x: 600,  topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 520,  topY: 280, kinds: ['q'], gift: 'mush' },
    // attraversamento vasca 1: appoggi SOLIDI larghi, bassi e vicini (saltabili da tutti)
    { x: 1120, topY: 420, kinds: ['solid', 'solid'] },
    { x: 1310, topY: 400, kinds: ['solid', 'solid'] },
    { x: 1900, topY: 300, kinds: ['brick', 'q', 'brick'] },
    // attraversamento vasca 2
    { x: 2720, topY: 420, kinds: ['solid', 'solid'] },
    { x: 2900, topY: 400, kinds: ['solid', 'solid'] },
    { x: 3300, topY: 280, kinds: ['brick'], gift: 'oneup' },   // VITA EXTRA (1-UP) nascosta
    // becher fragile come BONUS sopra terreno solido (se crolla atterri sul pavimento, non nella vasca)
    { x: 3700, topY: 340, kinds: ['crumble', 'crumble'] },
    // attraversamento vasca 3
    { x: 4220, topY: 420, kinds: ['solid', 'solid'] },
    { x: 4400, topY: 400, kinds: ['solid', 'solid'] },
    { x: 5000, topY: 320, kinds: ['q', 'q'] },
  ],

  coins: [
    { x: 560, y: 330, n: 3 }, { x: 1130, y: 350, n: 2 }, { x: 1330, y: 330, n: 2 },
    { x: 1900, y: 270, n: 3 }, { x: 2720, y: 340, n: 2 }, { x: 2880, y: 350, n: 2 },
    { x: 3300, y: 250, n: 2 }, { x: 3700, y: 310, n: 2 }, { x: 4300, y: 340, n: 3 },
    { x: 5000, y: 290, n: 2 }, { x: 5300, y: 360, n: 3 },
  ],

  enemies: [
    { x: 760,  y: 150, minX: 0,    maxX: 5800, kind: 'lakitu' },   // Spruzzabot: ti segue tutto il livello
    { x: 1850, y: 430, minX: 1520, maxX: 2580, kind: 'spiny' },
    { x: 3350, y: 430, minX: 3020, maxX: 4080, kind: 'spiny' },
    { x: 4750, y: 430, minX: 4520, maxX: 5560, kind: 'spiny' },
    { x: 5300, y: 430, minX: 5120, maxX: 5560, kind: 'spiny' },
  ],

  pipes: [],

  checkpoint: { x: 3550 },
  staircase: { x0: 5180, steps: 3 },
  boss: null,
  flagpole: { x: 5400 },
  salone: null,

  win: {
    cta: 'Prossimo settore →',
    title: 'Le Vasche superate! ☀️🧪',
    tag: 'Hai schivato Spruzzabot e le Gocce Corrosive sopra il veleno. Ora si scende nel Seminterrato…',
  },
};

// ====================== MONDO 4-2 — Il Seminterrato (sotterraneo, buio) ======================
// Una vasca si rompe → OOZE TOSSICO CHE SALE (meccanica nuova): due pozze di veleno che montano
// dal basso quando ti avvicini. Non ci si nuota (il contatto uccide): si scala e si avanza senza
// fermarsi, sopra piattaforme che salgono ad arco. Buio rotto solo dal bagliore del liquido.
// Isola sicura a metà (checkpoint) tra le due pozze. Tante Gocce d'Oro. Livello intermedio.
const MONDO4_2 = {
  id: 9,
  name: 'MONDO 4-2',
  letter: { id: 3, char: 'E', x: 1095, y: 165 },   // lettera nascosta FREEDOM — cima dell'arco pozza (y210)
  sub: 'Il Seminterrato',
  width: 3900,
  next: 10,            // → 4-3 (Il Reattore) ancora da costruire: "prossimo" nascosto finché manca
  dark: true,          // buio col solo alone di luce attorno al player + bagliore dell'ooze

  bg: { surface: A + 'bg_m4_basement.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo4_basement_loop', under: 'mondo4_basement_loop', boss: 'mondo4_boss_loop' },

  sprites: {
    ...SPRITES_DEFAULT,
    lakitu: A + 'enemy_spruzzabot.webp',       // Spruzzabot (Lakitu): pressione aerea sopra le pozze
    spiny: A + 'enemy_goccia_corrosiva.webp',  // Goccia Corrosiva (Spiny): striscia sulle isole sicure
  },

  // terra solida SOLO sulle isole: inizio, isola centrale (checkpoint), fine (pennone).
  // In mezzo, il vuoto delle pozze: si attraversa sulle piattaforme mentre l'ooze sale.
  ground: [
    [260, 520],    // G1 inizio  (x   0..520)
    [1850, 520],   // G2 isola centrale / checkpoint  (x 1590..2110)
    [3380, 800],   // G3 fine + pennone  (x 2980..3780)
  ],
  underground: [],

  // MECCANICA NUOVA: ooze tossico che SALE. Ogni pozza si arma quando il player le si avvicina
  // e il liquido monta da startY verso minY a "speed" px/s; il contatto coi piedi uccide.
  // {x1, x2, startY, minY, speed}
  oozePits: [
    { x1: 540,  x2: 1580, startY: 520, minY: 300, speed: 24 },
    { x1: 2120, x2: 3000, startY: 520, minY: 290, speed: 26 },
  ],

  blocks: [
    // --- G1: power-up + Gocce ---
    { x: 120, topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 200, topY: 270, kinds: ['q'], gift: 'mush' },     // Boccetta YAC
    // --- Pozza 1: arco di piattaforme che sale e ridiscende sull'isola ---
    { x: 600,  topY: 400, kinds: ['solid', 'solid'] },
    { x: 770,  topY: 350, kinds: ['solid', 'solid'] },
    { x: 940,  topY: 300, kinds: ['solid', 'solid'] },
    { x: 1090, topY: 250, kinds: ['solid', 'solid'] },     // apice
    { x: 1260, topY: 300, kinds: ['solid', 'solid'] },
    { x: 1420, topY: 360, kinds: ['solid', 'solid'] },
    { x: 1000, topY: 410, kinds: ['crumble'] },            // gradino-becher basso: Gocce ghiotte, sommerso in fretta
    // --- Pozza 2: arco più alto e teso ---
    { x: 2180, topY: 400, kinds: ['solid', 'solid'] },
    { x: 2350, topY: 340, kinds: ['solid', 'solid'] },
    { x: 2520, topY: 280, kinds: ['solid', 'solid'] },
    { x: 2680, topY: 235, kinds: ['solid', 'solid', 'solid'] },   // apice (largo: tappo di vasca)
    { x: 2700, topY: 130, kinds: ['brick'], gift: 'oneup' },      // VITA EXTRA (1-UP) sopra l'apice
    { x: 2880, topY: 300, kinds: ['solid', 'solid'] },
  ],

  coins: [
    { x: 120, y: 320, n: 3 }, { x: 200, y: 230, n: 2 },
    // arco pozza 1
    { x: 615, y: 365, n: 2 }, { x: 785, y: 315, n: 2 }, { x: 955, y: 265, n: 2 },
    { x: 1095, y: 210, n: 2 }, { x: 1275, y: 265, n: 2 },
    { x: 1000, y: 378, n: 1 },                                  // sul becher basso (rischio)
    // isola centrale
    { x: 1760, y: 360, n: 5 },
    // arco pozza 2
    { x: 2195, y: 365, n: 2 }, { x: 2365, y: 305, n: 2 }, { x: 2535, y: 245, n: 2 },
    { x: 2695, y: 200, n: 3 }, { x: 2895, y: 265, n: 2 },
    // pista finale
    { x: 3120, y: 360, n: 4 }, { x: 3300, y: 360, n: 3 },
  ],

  enemies: [
    { x: 700,  y: 150, minX: 0, maxX: 3900, kind: 'lakitu' },   // Spruzzabot: ti segue sopra le pozze
    { x: 360,  y: 448, minX: 60,   maxX: 500,  kind: 'spiny' },  // su G1
    { x: 1850, y: 448, minX: 1620, maxX: 2080, kind: 'spiny' },  // sull'isola centrale
    { x: 3300, y: 448, minX: 3020, maxX: 3740, kind: 'spiny' },  // su G3
  ],

  pipes: [],

  checkpoint: { x: 1850 },     // isola centrale (a metà)
  staircase: { x0: 3300, steps: 3 },
  boss: null,
  flagpole: { x: 3520 },
  salone: null,

  win: {
    cta: 'Prossimo settore →',
    title: 'Seminterrato superato! ☣️',
    tag: "Hai battuto l'ooze che saliva, sempre in salita senza fermarti. Prossima tappa: Il Reattore.",
  },
};

// ====================== MONDO 4-3 — Il Reattore → boss ToxiLab (castello) ======================
// Livello FINALE del Mondo 4. Labirinto di TUBI A BIVI (il tubo sbagliato rimanda indietro),
// platforming su tappi/bolle di schiuma (crumble) sopra vasche d'acido, bracci-spruzzatori
// rotanti (cranes) come hazard. In fondo l'arena del boss ToxiLab + liberazione salone.
const MONDO4_3 = {
  id: 10,
  name: 'MONDO 4-3',
  sub: 'Il Reattore',
  width: 5500,
  next: 11,   // → Mondo 5 (non esiste): "prossimo" nascosto, è il finale del Mondo 4

  bg: { surface: A + 'bg_m4_reactor.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo4_reactor_loop', under: 'mondo4_reactor_loop', boss: 'mondo4_boss_loop' },

  sprites: {
    ...SPRITES_DEFAULT,
    lakitu: A + 'enemy_spruzzabot.webp',
    spiny: A + 'enemy_goccia_corrosiva.webp',
  },

  // isole di terra separate da VASCHE D'ACIDO (contatto = morte)
  ground: [
    [360, 720],     // G1 inizio          (x    0.. 720)
    [1350, 560],    // G2 bivio dei tubi   (x 1070..1630)
    [2350, 640],    // G3                  (x 2030..2670)
    [3450, 760],    // G4 checkpoint       (x 3070..3830)
    [4800, 1200],   // G5 arena + pennone + salone (x 4200..5400)
  ],
  underground: [],

  // vasche d'acido nei varchi (toccarle = morte, come i buchi)
  hazards: [
    { x1: 720,  x2: 1070, y1: 455 },
    { x1: 1630, x2: 2030, y1: 455 },   // varco del bivio: si attraversa SOLO col tubo giusto
    { x1: 2670, x2: 3070, y1: 455 },
    { x1: 3830, x2: 4200, y1: 455 },
  ],

  blocks: [
    // G1: power-up + Gocce
    { x: 180, topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 300, topY: 320, kinds: ['q'], gift: 'mush' },
    // varco 1: tappi/becher (crumble) per guadare
    { x: 800, topY: 420, kinds: ['solid'] },
    { x: 940, topY: 400, kinds: ['crumble'] },
    // G3: q-monete
    { x: 2280, topY: 300, kinds: ['q', 'q'] },
    // varco 3: passaggio sotto un braccio-spruzzatore rotante
    { x: 2760, topY: 415, kinds: ['solid'] },
    { x: 2900, topY: 385, kinds: ['crumble'] },
    { x: 3020, topY: 415, kinds: ['solid'] },
    // G4: 1-UP nascosto (brick) + checkpoint q
    { x: 3380, topY: 300, kinds: ['brick'], gift: 'oneup' },
    { x: 3560, topY: 330, kinds: ['solid', 'q', 'solid'] },
    // varco 4: sotto il secondo braccio rotante
    { x: 3920, topY: 415, kinds: ['solid'] },
    { x: 4060, topY: 380, kinds: ['crumble'] },
    // arena: 2 piattaforme (raggiungibili da terra) per saltare sopra ToxiLab
    { x: 4540, topY: 378, kinds: ['solid', 'solid'] },
    { x: 4860, topY: 378, kinds: ['solid', 'solid'] },
  ],

  // bracci-spruzzatori rotanti (le nostre barre di fuoco) sopra i varchi 3 e 4
  cranes: [
    { x: 2900, y: 300, len: 88, speed: 1.3 },
    { x: 4060, y: 295, len: 92, speed: -1.4 },
  ],

  // BIVIO DEI TUBI: due tubi sull'isola G2. Quello giusto (a destra) ti porta oltre la vasca;
  // quello sbagliato (a sinistra) ti rimanda all'inizio. Il varco è troppo largo per saltarlo.
  pipes: [
    { x: 1180, target: { x: 300,  y: 380 } },   // SBAGLIATO → torna a G1
    { x: 1520, target: { x: 2350, y: 380 } },   // GIUSTO → oltre la vasca, su G3
  ],

  coins: [
    { x: 180, y: 320, n: 3 }, { x: 540, y: 360, n: 3 },
    { x: 800, y: 388, n: 1 }, { x: 940, y: 368, n: 1 },
    { x: 1300, y: 360, n: 4 },
    { x: 2200, y: 360, n: 3 }, { x: 2400, y: 360, n: 3 },
    { x: 2900, y: 352, n: 1 }, { x: 3200, y: 360, n: 3 },
    { x: 3380, y: 210, n: 2 }, { x: 3640, y: 360, n: 3 },
    { x: 4060, y: 348, n: 1 }, { x: 4300, y: 360, n: 3 },
  ],

  enemies: [
    { x: 2200, y: 150, minX: 0, maxX: 5500, kind: 'lakitu' },   // Spruzzabot: pressione su tutto il livello
    { x: 420,  y: 448, minX: 80,   maxX: 700,  kind: 'spiny' },
    { x: 2350, y: 448, minX: 2050, maxX: 2650, kind: 'spiny' },
    { x: 3450, y: 448, minX: 3090, maxX: 3810, kind: 'spiny' },
  ],

  checkpoint: { x: 3450 },
  staircase: null,

  boss: {
    type: 'toxilab', label: 'TOXILAB',
    sprite: A + 'boss_toxilab.webp', shot: A + 'boss_shot.webp',
    hp: 6, scaleH: 130,
    arena: { minX: 4600, maxX: 4880, spawnX: 4740 },
    gate: { x: 4960, h: 360 },
    trigger: { x: 4400 },
  },

  flagpole: { x: 5100 },

  salone: {
    x: 5340, corp: A + 'salon_corp.webp', yac: A + 'salon_yac.webp', label: 'SALONE YAC',
  },

  win: {
    title: 'Laboratorio bonificato — diventa YAC! 🎉☣️',
    tag: 'Hai spento ToxiLab e bonificato il laboratorio… ma era un altro marchio di The Conglomerate. Mondo 4 completato!',
  },
};

// ====================== MONDO 5 — La Borsa / Direzione ======================
// Set di sprite condiviso del Mondo 5: tornano i nemici dei mondi 1-4 (ricombinazione più dura)
// + Bolletta Bill (la nostra Pallottola Bill) sparata dai cannoni-ticker (override di 'spraybill').
const SPRITES_M5 = {
  ...SPRITES_DEFAULT,
  spam: A + 'enemy_etichetta_spam.webp',      // Etichetta-Spam (ritorno Mondo 3)
  spraybill: A + 'enemy_bolletta_bill.webp',  // Bolletta Bill (proiettile dei cannoni-ticker)
};

// ====================== MONDO 5-1 — La Sala Trading (superficie, luminoso/freddo) ======================
// Debuttano: cannoni-ticker con Bolletta Bill + piattaforme-grafico azionario (salgono verdi/crollano rosse).
// Tornano insieme i nemici dei mondi precedenti, più duri. Timer più stretto. Livello intermedio.
const MONDO5_1 = {
  id: 11,
  name: 'MONDO 5-1',
  sub: 'La Sala Trading',
  width: 6000,
  next: 12,
  timeLimit: 240,   // Mondo 5: la pressione sale

  bg: { surface: A + 'bg_m5_surface.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo5_loop', under: 'mondo5_loop', boss: 'mondo5_boss_loop' },

  sprites: SPRITES_M5,

  // isole RAVVICINATE tra i grattacieli: varchi piccoli e SALTABILI (≤150px). Le piattaforme-grafico
  // NON servono per attraversare (si salta direttamente): sono ELEVATORI sulle isole per le Gocce in alto.
  ground: [
    [400, 800],    // G1  (x    0.. 800)
    [1300, 700],   // G2  (x  950..1650)
    [2150, 700],   // G3  (x 1800..2500)
    [3000, 700],   // G4 checkpoint (x 2650..3350)
    [3850, 700],   // G5  (x 3500..4200)
    [5050, 1400],  // G6  fine + pennone (x 4350..5750)
  ],
  underground: [],

  // piattaforme-grafico azionario = ELEVATORI su terreno solido: cavalca il rialzo (verde) per le Gocce
  // in alto; se crolla (rossa) ti riporta giù sull'isola (nessun precipizio sotto → equo).
  charts: [
    { x: 1300, baseY: 442, rise: 130, phase: 0 },
    { x: 3000, baseY: 442, rise: 140, phase: 700 },
    { x: 4900, baseY: 442, rise: 130, phase: 1200 },
  ],

  // cannoni-ticker che sparano Bolletta Bill orizzontali (a quota player → schivare/saltare)
  cannons: [
    { x: 2150, y: 432, dir: -1, interval: 2700, speed: 160, startAt: 500, sfx: 'bolletta_fire' },
    { x: 3850, y: 432, dir: -1, interval: 2900, speed: 165, startAt: 1300, sfx: 'bolletta_fire' },
  ],

  blocks: [
    { x: 200, topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 520, topY: 320, kinds: ['q'], gift: 'mush' },          // Boccetta (colpibile da terra)
    { x: 2850, topY: 320, kinds: ['brick'], gift: 'oneup' },    // 1-UP su G4 (colpibile da terra)
    { x: 5050, topY: 330, kinds: ['q', 'q'] },
  ],

  coins: [
    { x: 200, y: 330, n: 3 }, { x: 560, y: 360, n: 3 },
    { x: 1300, y: 330, n: 2 }, { x: 1300, y: 250, n: 2 },       // salendo sulla 1ª grafico
    { x: 2150, y: 360, n: 3 },
    { x: 3000, y: 330, n: 2 }, { x: 3000, y: 240, n: 2 },       // salendo sulla 2ª grafico
    { x: 3850, y: 360, n: 3 },
    { x: 4900, y: 330, n: 2 }, { x: 4900, y: 250, n: 2 },       // salendo sulla 3ª grafico
    { x: 5300, y: 360, n: 3 },
  ],

  enemies: [
    { x: 500,  y: 448, minX: 120,  maxX: 760,  kind: 'goomba' },   // G1
    { x: 1300, y: 448, minX: 980,  maxX: 1620, kind: 'koopa' },    // G2
    { x: 1900, y: 300, minX: 1650, maxX: 2480, kind: 'spam' },     // vola sul varco
    { x: 3000, y: 448, minX: 2680, maxX: 3320, kind: 'goomba' },   // G4
    { x: 3850, y: 448, minX: 3530, maxX: 4170, kind: 'koopa' },    // G5
    { x: 5100, y: 448, minX: 4400, maxX: 5700, kind: 'goomba' },   // G6
  ],

  pipes: [],

  checkpoint: { x: 3000 },
  staircase: { x0: 5300, steps: 3 },
  boss: null,
  flagpole: { x: 5500 },
  salone: null,

  win: {
    cta: 'Prossimo settore →',
    title: 'Sala Trading superata! 📈',
    tag: 'Hai cavalcato i grafici e schivato le Bolletta Bill. Ora si scende nel Caveau…',
  },
};

// ====================== MONDO 5-2 — Il Caveau (sotterraneo, buio) ======================
// Meccaniche nuove: GRIGLIE LASER di sicurezza (hazard a tempo da cronometrare) + PORTE BLINDATE
// (piattaforme mobili). Pieno d'oro (tante Gocce). Buio (regola sotterraneo). Livello intermedio.
const MONDO5_2 = {
  id: 12,
  name: 'MONDO 5-2',
  letter: { id: 4, char: 'D', x: 2750, y: 195 },   // lettera nascosta FREEDOM — sopra le monete a y240
  sub: 'Il Caveau',
  width: 5200,
  next: 13,
  dark: true,
  timeLimit: 230,

  bg: { surface: A + 'bg_m5_vault.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo5_vault_loop', under: 'mondo5_vault_loop', boss: 'mondo5_boss_loop' },

  sprites: SPRITES_M5,

  // pavimento continuo (al buio niente baratri ciechi: come 3-2)
  ground: [[700, 1500], [2100, 1500], [3500, 1500], [4750, 1300]],
  underground: [],

  // griglie laser di sicurezza: ON ferisce (preavviso di lampeggio); verticali (a terra) e orizzontali (in quota)
  lasers: [
    { x1: 1000, y1: 300, y2: 470, onT: 1400, offT: 1300, phase: 0 },
    { x1: 1500, x2: 1820, y1: 330, y2: 330, onT: 1300, offT: 1400, phase: 600 },
    { x1: 2400, y1: 280, y2: 470, onT: 1500, offT: 1200, phase: 300 },
    { x1: 3000, x2: 3320, y1: 360, y2: 360, onT: 1300, offT: 1300, phase: 900 },
    { x1: 3800, y1: 300, y2: 470, onT: 1400, offT: 1300, phase: 200 },
    { x1: 4300, y1: 280, y2: 470, onT: 1500, offT: 1200, phase: 700 },
  ],

  // porte blindate = piattaforme mobili (lift) su cui salire
  lifts: [
    { x: 1650, y: 380, range: 90, speed: 60, w: 100 },
    { x: 2750, y: 360, range: 100, speed: 72, w: 100 },
    { x: 4050, y: 370, range: 95, speed: 66, w: 100 },
  ],

  blocks: [
    { x: 600,  topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 520,  topY: 320, kinds: ['q'], gift: 'mush' },
    { x: 2200, topY: 315, kinds: ['brick'], gift: 'oneup' },   // 1-UP nascosto
    { x: 2500, topY: 340, kinds: ['q', 'q'] },
    { x: 3600, topY: 330, kinds: ['solid', 'q', 'solid'] },
  ],

  // tante Gocce d'Oro (caveau pieno d'oro)
  coins: [
    { x: 560, y: 250, n: 3 }, { x: 800, y: 360, n: 4 },
    { x: 1180, y: 300, n: 3 }, { x: 1650, y: 250, n: 3 },
    { x: 2050, y: 360, n: 4 }, { x: 2500, y: 280, n: 3 },
    { x: 2750, y: 240, n: 3 }, { x: 3150, y: 360, n: 4 },
    { x: 3600, y: 270, n: 3 }, { x: 4050, y: 250, n: 3 },
    { x: 4400, y: 360, n: 4 }, { x: 4700, y: 320, n: 3 },
  ],

  enemies: [
    { x: 1000, y: 448, minX: 700,  maxX: 1380, kind: 'goomba' },
    { x: 1700, y: 300, minX: 1450, maxX: 2050, kind: 'spam' },
    { x: 2600, y: 448, minX: 2300, maxX: 2980, kind: 'goomba' },
    { x: 3400, y: 300, minX: 3100, maxX: 3700, kind: 'spam' },
    { x: 4200, y: 448, minX: 3900, maxX: 4600, kind: 'goomba' },
  ],

  pipes: [],

  checkpoint: { x: 2750 },
  staircase: { x0: 4650, steps: 3 },
  boss: null,
  flagpole: { x: 4950 },
  salone: null,

  win: {
    cta: 'Prossimo settore →',
    title: 'Caveau svaligiato! 💰',
    tag: 'Hai cronometrato i laser e fatto man bassa di Gocce. Ultima salita: la Direzione, in cima.',
  },
};

// ====================== MONDO 5-3 — La Direzione / L'Attico → boss Unibeauty (castello) ======================
// Livello FINALE del Mondo 5. Scalata su ASCENSORI ESPRESSO (lift) e PIATTAFORME-GRAFICO, con bracci
// ticker-tape rotanti (cranes) e cannoni Bolletta Bill, fino all'arena del boss Unibeauty + liberazione.
const MONDO5_3 = {
  id: 13,
  name: 'MONDO 5-3',
  sub: "La Direzione / L'Attico",
  width: 5800,
  next: 14,   // → Mondo 6 (non esiste): "prossimo" nascosto, finale del Mondo 5
  timeLimit: 280,

  bg: { surface: A + 'bg_m5_penthouse.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo5_penthouse_loop', under: 'mondo5_penthouse_loop', boss: 'mondo5_boss_loop' },

  sprites: SPRITES_M5,

  // isole RAVVICINATE: varchi piccoli e SALTABILI (≤150px). Ascensori/grafici sono ELEVATORI sulle isole.
  ground: [
    [360, 720],     // G1 inizio        (x    0.. 720)
    [1150, 560],    // G2               (x  870..1430)
    [1860, 560],    // G3               (x 1580..2140)
    [2570, 560],    // G4 checkpoint    (x 2290..2850)
    [3280, 560],    // G5               (x 3000..3560)
    [4700, 2000],   // G6 arena + pennone + salone (x 3700..5700)
  ],
  underground: [],

  // piattaforme-grafico = elevatori (G3, G5) su terreno solido: cavalca il rialzo per le Gocce in alto
  charts: [
    { x: 1860, baseY: 442, rise: 140, phase: 0 },
    { x: 3280, baseY: 442, rise: 150, phase: 600 },
  ],

  // ascensori espresso (lift) = elevatori (G2, G4) su terreno solido
  lifts: [
    { x: 1150, y: 400, range: 70, speed: 70, w: 100 },
    { x: 2570, y: 400, range: 75, speed: 76, w: 100 },
  ],

  // bracci ticker-tape rotanti (barre di fuoco): sopra le isole G3/G5, si passa quando il braccio è su
  cranes: [
    { x: 2000, y: 300, len: 100, speed: 1.3 },
    { x: 3400, y: 300, len: 100, speed: -1.4 },
  ],

  // cannoni-ticker Bolletta Bill (sparano verso il player che attraversa i varchi)
  cannons: [
    { x: 2570, y: 432, dir: -1, interval: 2700, speed: 165, startAt: 600, sfx: 'bolletta_fire' },
    { x: 3280, y: 432, dir: -1, interval: 2900, speed: 170, startAt: 1400, sfx: 'bolletta_fire' },
  ],

  blocks: [
    { x: 180, topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 540, topY: 320, kinds: ['q'], gift: 'mush' },          // Boccetta (G1, colpibile da terra)
    { x: 1700, topY: 330, kinds: ['q', 'q'] },                  // Gocce (G3)
    { x: 2500, topY: 320, kinds: ['brick'], gift: 'oneup' },    // 1-UP su G4 (colpibile da terra)
    // arena: 2 piattaforme (raggiungibili da terra) per saltare sopra Unibeauty
    { x: 4560, topY: 378, kinds: ['solid', 'solid'] },
    { x: 4880, topY: 378, kinds: ['solid', 'solid'] },
  ],

  coins: [
    { x: 180, y: 330, n: 3 }, { x: 540, y: 360, n: 3 },
    { x: 1150, y: 330, n: 2 }, { x: 1150, y: 250, n: 2 },       // salendo sull'ascensore G2
    { x: 1860, y: 330, n: 2 }, { x: 1860, y: 250, n: 2 },       // salendo sulla grafico G3
    { x: 2570, y: 330, n: 2 }, { x: 2570, y: 250, n: 2 },       // ascensore G4
    { x: 3280, y: 330, n: 2 }, { x: 3280, y: 240, n: 2 },       // grafico G5
    { x: 4300, y: 360, n: 3 },
  ],

  enemies: [
    { x: 400,  y: 448, minX: 120,  maxX: 680,  kind: 'goomba' },   // G1
    { x: 1150, y: 448, minX: 900,  maxX: 1400, kind: 'koopa' },    // G2
    { x: 1900, y: 300, minX: 1600, maxX: 2120, kind: 'spam' },     // G3 vola
    { x: 2570, y: 448, minX: 2320, maxX: 2820, kind: 'goomba' },   // G4
    { x: 3280, y: 448, minX: 3030, maxX: 3540, kind: 'goomba' },   // G5
  ],

  pipes: [],

  checkpoint: { x: 2570 },
  staircase: null,

  boss: {
    type: 'unibeauty', label: 'UNIBEAUTY',
    sprite: A + 'boss_unibeauty.webp', shot: A + 'boss_shot.webp',
    hp: 7, scaleH: 135,
    arena: { minX: 4620, maxX: 4900, spawnX: 4760 },
    gate: { x: 4980, h: 360 },
    trigger: { x: 4380 },
  },

  flagpole: { x: 5160 },

  salone: {
    x: 5400, corp: A + 'salon_corp.webp', yac: A + 'salon_yac.webp', label: 'SALONE YAC',
  },

  win: {
    title: 'Direzione ribaltata — diventa YAC! 🎉🏙️',
    tag: 'Hai spento Unibeauty e ribaltato la torre… ma chi possiede tutti i marchi? Mondo 5 completato!',
  },
};

// ====================== MONDO 6 — Big Beauty Tower (FINALE) ======================
// Set sprite condiviso: RICOMBINAZIONE totale — tornano tutti i nemici dei mondi 1-5.
const SPRITES_M6 = {
  ...SPRITES_DEFAULT,
  spam: A + 'enemy_etichetta_spam.webp',       // Etichetta-Spam (M3)
  spraybill: A + 'enemy_bolletta_bill.webp',   // Bolletta Bill (M5) — proiettile dei cannoni
  lakitu: A + 'enemy_spruzzabot.webp',         // Spruzzabot (M4)
  spiny: A + 'enemy_goccia_corrosiva.webp',    // Goccia Corrosiva (M4)
  promoter: A + 'enemy_promoter.webp',         // Promoter / Hammer Bro (M3)
};

// ====================== MONDO 6-1 — Il Piazzale (esterno, notte) ======================
// Il gauntlet più duro: ricombina nemici e meccaniche di tutti i mondi. Mondo più scuro. Intermedio.
const MONDO6_1 = {
  id: 14,
  name: 'MONDO 6-1',
  letter: { id: 5, char: 'O', x: 1900, y: 150 },   // lettera nascosta FREEDOM — sopra il premio della molla
  sub: 'Il Piazzale',
  width: 6400,
  next: 15,
  night: true,
  timeLimit: 230,

  bg: { surface: A + 'bg_m6_plaza.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo6_plaza_loop', under: 'mondo6_plaza_loop', boss: 'mondo6_boss_loop' },

  sprites: SPRITES_M6,

  // terreno quasi continuo (gauntlet): varchi piccoli, la sfida sono i nemici e gli hazard
  ground: [[500, 1000], [1750, 1300], [3100, 1300], [4450, 1300], [5750, 1100]],
  underground: [],

  conveyors: [
    { x1: 600, x2: 1000, topY: 470, dir: 1, speed: 90 },
    { x1: 2600, x2: 3000, topY: 470, dir: -1, speed: 100 },
  ],
  springs: [{ x: 1900, topY: 470, power: 820 }],
  neonPlats: [
    { x: 2200, y: 330, w: 80, onTime: 1700, offTime: 1100, phase: 0 },
    { x: 2400, y: 300, w: 72, onTime: 1700, offTime: 1200, phase: 500 },
  ],
  charts: [{ x: 4000, baseY: 442, rise: 130, phase: 0 }],
  cannons: [
    { x: 3700, y: 432, dir: -1, interval: 2600, speed: 170, startAt: 500, sfx: 'bolletta_fire' },
    { x: 5600, y: 432, dir: -1, interval: 2800, speed: 175, startAt: 1200, sfx: 'bolletta_fire' },
  ],

  blocks: [
    { x: 200, topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 520, topY: 320, kinds: ['q'], gift: 'mush' },
    { x: 1750, topY: 330, kinds: ['q', 'q'] },
    { x: 2950, topY: 300, kinds: ['brick'], gift: 'oneup' },   // 1-UP (colpibile da terra)
    { x: 4250, topY: 330, kinds: ['q', 'q'] },
  ],

  coins: [
    { x: 200, y: 330, n: 3 }, { x: 700, y: 360, n: 3 },
    { x: 1900, y: 280, n: 2 }, { x: 1900, y: 200, n: 2 },   // ricompensa molla
    { x: 2200, y: 290, n: 2 }, { x: 2400, y: 260, n: 2 },   // sui neon
    { x: 3300, y: 360, n: 3 }, { x: 4000, y: 320, n: 2 }, { x: 4000, y: 250, n: 2 },  // sulla grafico
    { x: 4800, y: 360, n: 3 }, { x: 5400, y: 360, n: 3 }, { x: 5900, y: 360, n: 3 },
  ],

  enemies: [
    { x: 760,  y: 430, minX: 520,  maxX: 980,  kind: 'promoter' },
    { x: 900,  y: 150, minX: 0,    maxX: 6400, kind: 'lakitu' },     // Spruzzabot: tutto il livello
    { x: 1500, y: 448, minX: 1150, maxX: 2380, kind: 'goomba' },
    { x: 1800, y: 300, minX: 1500, maxX: 2350, kind: 'spam' },
    { x: 2800, y: 448, minX: 2480, maxX: 3720, kind: 'koopa' },
    { x: 3300, y: 430, minX: 2900, maxX: 3700, kind: 'spiny' },
    { x: 4200, y: 448, minX: 3830, maxX: 5070, kind: 'goomba' },
    { x: 4800, y: 300, minX: 4500, maxX: 5080, kind: 'spam' },
    { x: 5400, y: 430, minX: 5220, maxX: 5680, kind: 'spiny' },
    { x: 5900, y: 448, minX: 5230, maxX: 6280, kind: 'koopa' },
  ],

  pipes: [],

  checkpoint: { x: 3100 },
  staircase: { x0: 5950, steps: 3 },
  boss: null,
  flagpole: { x: 6150 },
  salone: null,

  win: {
    cta: 'Prossimo settore →',
    title: 'Piazzale superato! 🌃🏢',
    tag: 'Hai retto il gauntlet di tutti i nemici. Ora si scende nelle Fondamenta della torre…',
  },
};

// ====================== MONDO 6-2 — Le Fondamenta (sotterraneo, buio) ======================
// Cuore-motore: buio a lampi + laser di sicurezza + un accenno di OOZE che sale. Il più teso.
const MONDO6_2 = {
  id: 15,
  name: 'MONDO 6-2',
  letter: { id: 6, char: 'M', x: 2200, y: 195 },   // lettera nascosta FREEDOM — sopra le monete a y240
  sub: 'Le Fondamenta',
  width: 5600,
  next: 16,
  dark: true,
  timeLimit: 220,

  bg: { surface: A + 'bg_m6_foundations.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo6_foundations_loop', under: 'mondo6_foundations_loop', boss: 'mondo6_boss_loop' },

  sprites: SPRITES_M6,

  // pavimento per tratti: continuo nei tratti bui, con UNA pozza d'ooze che sale a metà
  ground: [[700, 1400], [2100, 1400], [3700, 1000], [4900, 1200]],
  underground: [],

  // OOZE che sale (accenno): pozza nel varco 2800→3200, si scala su un piccolo arco
  oozePits: [{ x1: 2820, x2: 3180, startY: 520, minY: 320, speed: 30 }],

  // griglie laser di sicurezza (timed): verticali a terra + orizzontali in quota
  lasers: [
    { x1: 1000, y1: 300, y2: 470, onT: 1400, offT: 1300, phase: 0 },
    { x1: 1450, x2: 1780, y1: 330, y2: 330, onT: 1300, offT: 1400, phase: 600 },
    { x1: 2300, y1: 280, y2: 470, onT: 1500, offT: 1200, phase: 300 },
    { x1: 4100, y1: 300, y2: 470, onT: 1400, offT: 1300, phase: 200 },
    { x1: 4550, x2: 4880, y1: 350, y2: 350, onT: 1300, offT: 1300, phase: 900 },
  ],

  lifts: [{ x: 1700, y: 380, range: 90, speed: 66, w: 100 }],

  blocks: [
    { x: 600, topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 520, topY: 320, kinds: ['q'], gift: 'mush' },
    { x: 2200, topY: 315, kinds: ['brick'], gift: 'oneup' },   // 1-UP
    // arco sopra la pozza d'ooze (varco 2800→3200)
    { x: 2880, topY: 410, kinds: ['solid'] },
    { x: 3000, topY: 360, kinds: ['solid'] },
    { x: 3120, topY: 410, kinds: ['solid'] },
    { x: 4000, topY: 330, kinds: ['q', 'q'] },
  ],

  coins: [
    { x: 560, y: 250, n: 3 }, { x: 900, y: 360, n: 4 },
    { x: 1700, y: 280, n: 3 }, { x: 2200, y: 240, n: 2 },
    { x: 2500, y: 360, n: 4 }, { x: 3000, y: 320, n: 2 },
    { x: 3700, y: 300, n: 3 }, { x: 4000, y: 270, n: 2 },
    { x: 4400, y: 360, n: 4 }, { x: 4900, y: 320, n: 3 },
  ],

  enemies: [
    { x: 1000, y: 448, minX: 720,  maxX: 1380, kind: 'goomba' },
    { x: 1600, y: 300, minX: 1450, maxX: 2050, kind: 'spam' },
    { x: 2400, y: 448, minX: 2150, maxX: 2780, kind: 'goomba' },
    { x: 3800, y: 300, minX: 3350, maxX: 4180, kind: 'spam' },
    { x: 4400, y: 448, minX: 4100, maxX: 4800, kind: 'goomba' },
  ],

  pipes: [],

  checkpoint: { x: 2100 },
  staircase: { x0: 5050, steps: 3 },
  boss: null,
  flagpole: { x: 5350 },
  salone: null,

  win: {
    cta: 'Prossimo settore →',
    title: 'Fondamenta superate! ⚙️🔦',
    tag: 'Hai attraversato laser, buio e ooze nel cuore-motore. Ultima salita: L\'Ascesa.',
  },
};

// ====================== MONDO 6-3 — L'Ascesa → THE CONGLOMERATE (torre finale) ======================
// Ascesa (resa orizzontale) su ascensori/grafici con bracci rotanti; checkpoint SUBITO PRIMA del boss.
// Boss finale a 3 FASI + liberazione finale (il caldo YAC più intenso).
const MONDO6_3 = {
  id: 16,
  name: 'MONDO 6-3',
  finale: true,   // ultimo livello: dopo la vittoria parte la sequenza finale (card segreta FREEDOM)
  sub: "L'Ascesa",
  width: 6000,
  next: 17,   // non esiste → fine del gioco
  night: true,
  timeLimit: 320,

  bg: { surface: A + 'bg_m6_ascent.webp', under: null },
  bgUnder: null,

  music: { surface: 'mondo6_ascent_loop', under: 'mondo6_ascent_loop', boss: 'mondo6_boss_loop' },

  sprites: SPRITES_M6,

  ground: [
    [360, 720],     // G1  (0..720)
    [1150, 560],    // G2  (870..1430)
    [1860, 560],    // G3  (1580..2140)
    [2570, 560],    // G4  (2290..2850)
    [3280, 560],    // G5  (3000..3560)
    [3990, 560],    // G6  (3710..4270)
    [5000, 1900],   // G7 arena + pennone + salone (4050..5950)
  ],
  underground: [],

  charts: [
    { x: 1860, baseY: 442, rise: 140, phase: 0 },
    { x: 3280, baseY: 442, rise: 150, phase: 600 },
  ],
  lifts: [
    { x: 1150, y: 400, range: 70, speed: 72, w: 100 },
    { x: 2570, y: 400, range: 75, speed: 78, w: 100 },
  ],
  cranes: [
    { x: 2000, y: 300, len: 100, speed: 1.3 },
    { x: 3990, y: 300, len: 100, speed: -1.4 },
  ],
  cannons: [
    { x: 2570, y: 432, dir: -1, interval: 2700, speed: 170, startAt: 600, sfx: 'bolletta_fire' },
    { x: 3280, y: 432, dir: -1, interval: 2900, speed: 175, startAt: 1400, sfx: 'bolletta_fire' },
  ],

  blocks: [
    { x: 180, topY: 360, kinds: ['solid', 'q', 'solid'] },
    { x: 540, topY: 320, kinds: ['q'], gift: 'mush' },
    { x: 1700, topY: 330, kinds: ['q', 'q'] },
    { x: 3260, topY: 300, kinds: ['brick'], gift: 'oneup' },   // 1-UP su G5
    // arena: 2 piattaforme (raggiungibili da terra) per saltare sopra il nucleo
    { x: 4720, topY: 378, kinds: ['solid', 'solid'] },
    { x: 5040, topY: 378, kinds: ['solid', 'solid'] },
  ],

  coins: [
    { x: 180, y: 330, n: 3 }, { x: 540, y: 360, n: 3 },
    { x: 1150, y: 330, n: 2 }, { x: 1860, y: 330, n: 2 }, { x: 1860, y: 250, n: 2 },
    { x: 2570, y: 330, n: 2 }, { x: 3280, y: 320, n: 2 }, { x: 3280, y: 240, n: 2 },
    { x: 3990, y: 330, n: 2 }, { x: 4300, y: 360, n: 3 },
  ],

  enemies: [
    { x: 400,  y: 448, minX: 120,  maxX: 680,  kind: 'goomba' },
    { x: 1150, y: 448, minX: 900,  maxX: 1400, kind: 'koopa' },
    { x: 1900, y: 300, minX: 1600, maxX: 2120, kind: 'spam' },
    { x: 2570, y: 448, minX: 2320, maxX: 2820, kind: 'spiny' },
    { x: 3280, y: 448, minX: 3030, maxX: 3540, kind: 'goomba' },
  ],

  pipes: [],

  checkpoint: { x: 4380 },   // SUBITO PRIMA del boss (morire al boss non rifà la salita)
  staircase: null,

  boss: {
    type: 'conglomerate', label: 'THE CONGLOMERATE',
    sprite: A + 'boss_conglomerate.webp', shot: A + 'boss_shot.webp',
    hp: 9, scaleH: 150,
    arena: { minX: 4720, maxX: 5040, spawnX: 4880 },
    gate: { x: 5120, h: 380 },
    trigger: { x: 4500 },
  },

  flagpole: { x: 5320 },

  salone: {
    x: 5560, corp: A + 'salon_corp.webp', yac: A + 'salon_yac.webp', label: 'SALONE YAC',
  },

  win: {
    title: 'HAI BATTUTO IL SISTEMA! 🎉👑',
    tag: 'The Conglomerate è caduto: i loghi freddi si staccano e tutta la torre diventa YAC. Hai vinto Super Yac World!',
  },
};

// ====================== MONDO 0 — "L'Officina" (livello extra, sbloccabile) ======================
// Anti-livello caldo e silenzioso: niente nemici, niente timer. Il "dietro le quinte": lo studio di
// Memento, quattro postazioni (i 4 eroi al lavoro), gocce d'oro sparse, e una frase sul muro che si
// rivela una lettera alla volta mentre avanzi. Tema: "dove c'era una macchina, ora c'è una mano".
const OFFICINA = {
  id: 0,
  name: "L'OFFICINA",
  sub: 'Mondo 0 — Il dietro le quinte',
  width: 4200,
  next: null,
  officina: true,   // attiva il rendering/flusso speciale nella GameScene
  noTimer: true,    // niente conto alla rovescia (livello contemplativo)

  bg: { surface: A + 'sfondomondo1.webp', under: null },   // sostituito da un fondo caldo disegnato (vedi buildBackdrop)
  music: { surface: 'finale_theme', under: 'finale_theme', boss: 'finale_theme' },   // ripresa calda

  sprites: SPRITES_DEFAULT,

  ground: [[2100, 4400]],   // un unico pavimento continuo
  underground: [],
  blocks: [],
  enemies: [],
  pipes: [],
  staircase: null,
  boss: null,
  salone: null,
  checkpoint: { x: 4150 },   // oltre la fine: mai raggiunto (il livello termina prima)

  // gocce d'oro sparse, a quote dolci e raggiungibili
  coins: [
    { x: 480, y: 360, n: 3 }, { x: 980, y: 320, n: 2 }, { x: 1300, y: 360, n: 3 },
    { x: 1720, y: 320, n: 2 }, { x: 2060, y: 360, n: 3 }, { x: 2460, y: 320, n: 2 },
    { x: 2780, y: 360, n: 3 }, { x: 3200, y: 340, n: 3 }, { x: 3520, y: 360, n: 2 },
  ],

  flagpole: { x: 3860 },   // la "soglia" finale (immagine sostituita da una porta calda)

  // dati specifici dell'Officina (letti da buildOfficina/updateOfficina)
  off: {
    phrase: "DOVE C'ERA UNA MACCHINA — ORA C'È UNA MANO",
    phraseX0: 380, phraseDX: 58, phraseY: 116,
    stations: [
      { key: 'memento', x: 760,  name: 'MEMENTO', role: 'La voce',       col: 0xE14B3A },
      { key: 'yuri',    x: 1520, name: 'YURI',    role: 'La creatività', col: 0x3BB36A },
      { key: 'carmine', x: 2280, name: 'CARMINE', role: 'La solidità',   col: 0x3B82E6 },
      { key: 'andrea',  x: 3040, name: 'ANDREA',  role: 'Il tempo',      col: 0xEC6AAE },
    ],
  },

  win: {
    title: "L'OFFICINA",
    tag: 'Dove c\'era una macchina, ora c\'è una mano. Grazie. — Un gioco Memento. Una visione YAC.',
  },
};

export const LEVELS = { 1: MONDO1, 2: MONDO2, 3: MONDO2_2, 4: MONDO2_3, 5: MONDO3_1, 6: MONDO3_2, 7: MONDO3_3, 8: MONDO4_1, 9: MONDO4_2, 10: MONDO4_3, 11: MONDO5_1, 12: MONDO5_2, 13: MONDO5_3, 14: MONDO6_1, 15: MONDO6_2, 16: MONDO6_3, 17: OFFICINA };

// id del Mondo 0 (livello extra): usato da finale + menu per sbloccarlo/avviarlo
export const OFFICINA_ID = 17;
