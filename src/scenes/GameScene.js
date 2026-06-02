import Phaser from 'phaser';
import { PAL } from '../config.js';
import { state, collectLetter, hasAllLetters, hasLetter, SECRET_WORD, saveRun, clearRun, setBest } from '../state.js';
import { AUDIO } from '../audio.js';
import { LEVELS, OFFICINA_ID } from '../levels.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init() {
    this.cfg = state.cfg;
    this.level = state.level || LEVELS[state.worldId || 1] || LEVELS[1];
  }

  preload() {
    const L = this.level, S = L.sprites;
    this.load.image('yaclogo', './assets/logo_yac.png');
    // Sfondi del mondo corrente (già attenuati: luminosità/saturazione -20/22% + micro-blur)
    this.load.image('bg_surface', L.bg.surface);
    if (L.bg.under) this.load.image('bg_under', L.bg.under);
    this.load.image('groundtile', './assets/ground_tile.png'); // pavimento ripetibile
    // Sprite del mondo (sfondo già reso trasparente)
    this.load.image('enemy', S.enemy);            // nemico base (goomba)
    this.load.image('koopa', S.koopa);            // nemico a guscio (koopa)
    this.load.image('shell', S.shell);            // guscio
    if (S.flacone) this.load.image('flacone', S.flacone);     // Flacone galleggiante (acqua)
    if (S.spugnotto) this.load.image('spugnotto', S.spugnotto); // Spugnotto inseguitore (acqua)
    if (S.koopawalk) this.load.image('koopawalk', S.koopawalk); // Tubetto senza ali (dopo lo stomp)
    if (S.promoter) this.load.image('promoter', S.promoter);     // Promoter / Hammer Bro (Mondo 3)
    if (S.spraybill) this.load.image('spraybill', S.spraybill);  // Spray-Bill / Bullet Bill (Mondo 3)
    if (S.spam) this.load.image('spam', S.spam);                 // Etichetta-Spam volante (Mondo 3)
    if (S.lakitu) this.load.image('lakitu', S.lakitu);           // Spruzzabot / Lakitu (Mondo 4)
    if (S.spiny) this.load.image('spiny', S.spiny);              // Goccia Corrosiva / Spiny (Mondo 4)
    this.load.image('brick', S.brick);            // mattone/solido
    this.load.image('qblock', S.qblock);          // blocco "?"
    this.load.image('blockempty', S.blockempty);  // blocco "?" esaurito
    this.load.image('mush', S.mush);              // Boccetta YAC (diventi GRANDE)
    this.load.image('coin', S.coin);              // Goccia d'Oro (moneta)
    this.load.image('pipe', S.pipe);              // tubo entrabile
    this.load.image('flagpole', S.flagpole);      // pennone fine livello
    this.load.image('gateimg', './assets/gate.png');   // saracinesca del boss
    if (L.boss) {
      this.load.image('glossshot', L.boss.shot);  // proiettile del boss
      this.load.image('bossmain', L.boss.sprite); // sprite del boss del mondo
    }
    if (L.salone) {
      this.load.image('salon_corp', L.salone.corp); // salone occupato (prima)
      this.load.image('salon_yac', L.salone.yac);   // salone liberato (dopo)
    }
    // Eroi in VISTA LATERALE (sprite del giocatore)
    this.load.image('hero_memento', './assets/char_memento.png');
    this.load.image('hero_yuri', './assets/char_yuri.png');
    this.load.image('hero_carmine', './assets/char_carmine.png');
    this.load.image('hero_andrea', './assets/char_andrea.png');
  }

  create() {
    const c = this.cfg;
    this.heroKey = 'hero_' + (state.selectedKey || 'memento');   // sprite del personaggio scelto
    this.W = this.level.width; this.H = 506;
    this.lives = 3; this.gocce = 0;
    this.score = state.runScore || 0;   // punteggio CUMULATIVO della partita (si porta tra i mondi)
    this.specialReady = true; this.slowActive = false; this.piping = false;
    this.invincible = false; this.shootMode = false;   // Yuri / Memento speciali
    this.won = false; this.onPipe = null; this.paused = false;
    this.state = 'intro'; this.checkpointX = (this.level.spawn && this.level.spawn.x) || 110;
    this.timeLimit = this.level.timeLimit || 300; this.timeLeft = this.timeLimit;   // Mondo 5: timer più stretti
    this.tutShown = false; this.combo = 0;
    this.bossStarted = false; this.bossActive = false; this.bossDefeated = false;
    this.boss = null; this.bossInvuln = false;
    this.water = !!this.level.water;   // livello a nuoto?
    this.night = !!this.level.night;   // livello notturno (Mondo 3)?
    this.dark = !!this.level.dark;     // livello al buio con alone di luce (3-2)?
    this.officina = !!this.level.officina;   // Mondo 0: anti-livello caldo (dietro le quinte)
    this.noTimer = !!this.level.noTimer;     // niente conto alla rovescia

    this.physics.world.setBounds(0, 0, this.W, this.H + 600);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.physics.world.gravity.y = this.water ? 360 : 1150;   // sott'acqua: gravità ridotta (galleggi)
    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.cameras.main.setBackgroundColor(this.water ? '#0e2230' : '#1d2730');

    this.makeTextures();
    this.buildBackdrop();
    this.buildLevel();
    this.buildPlayer();
    this.buildHUD();
    this.bindInput();
    this.startLevel();
  }

  makeTextures() {
    const G = () => this.make.graphics({ add: false });
    let g;

    g = G(); g.fillStyle(0xffffff, 1).fillRect(0, 0, 16, 16);
    g.generateTexture('px', 16, 16); g.destroy();
    // 'groundtile' = immagine reale (assets/ground_tile.png) caricata in preload()

    // --- Nastro trasportatore (tile ripetibile con galloni vivaci) ---
    g = G();
    g.fillStyle(0x222a30, 1).fillRect(0, 0, 32, 24);                          // gomma scura
    g.fillStyle(0x59656f, 1).fillRect(0, 0, 32, 4).fillRect(0, 20, 32, 4);    // bordi metallici
    g.fillStyle(0xF2994A, 1);                                                 // galloni arancioni
    for (let i = -1; i < 3; i++) g.fillTriangle(i * 16, 6, i * 16 + 13, 12, i * 16, 18);
    g.fillStyle(0xF2C53D, 1);                                                 // luce interna gialla
    for (let i = -1; i < 3; i++) g.fillTriangle(i * 16 + 2, 9, i * 16 + 8, 12, i * 16 + 2, 15);
    g.generateTexture('belt', 32, 24); g.destroy();

    // --- Molla pallet (base legno + molla metallica) ---
    g = G();
    g.fillStyle(0x8a5a2b, 1).fillRect(2, 22, 36, 8);                  // pallet legno
    g.fillStyle(0x6e4622, 1).fillRect(2, 28, 36, 2);
    g.fillStyle(0x9aa7b2, 1).fillRect(8, 7, 24, 4).fillRect(8, 13, 24, 4).fillRect(8, 19, 24, 4); // spire
    g.fillStyle(0xc3ccd4, 1).fillRect(5, 2, 30, 6);                   // piastra superiore
    g.generateTexture('spring', 40, 30); g.destroy();

    // --- Piattaforma-muletto (pallet + banda di pericolo) ---
    g = G();
    g.fillStyle(0xF2C53D, 1).fillRect(0, 0, 90, 6);                   // banda gialla
    g.fillStyle(0x16121A, 1); for (let i = 0; i < 8; i++) g.fillRect(i * 12, 0, 6, 6); // tratteggio pericolo
    g.fillStyle(0x8a5a2b, 1).fillRect(0, 6, 90, 12);                  // pallet legno
    g.fillStyle(0x6e4622, 1).fillRect(0, 14, 90, 4);
    g.generateTexture('lift', 90, 18); g.destroy();

    // --- Piattaforma-grafico azionario (Mondo 5): barra chiara, tinta a runtime verde/rossa ---
    g = G();
    g.fillStyle(0x16121A, 1).fillRoundedRect(0, 0, 84, 16, 3);        // cornice scura
    g.fillStyle(0xffffff, 1).fillRoundedRect(2, 2, 80, 12, 2);        // corpo bianco (così la tinta è pulita)
    g.fillStyle(0xdfe8ee, 1).fillRect(4, 4, 76, 3);                   // riflesso
    for (let i = 0; i < 5; i++) g.fillStyle(0xc7d2da, 1).fillRect(8 + i * 16, 9, 9, 3);  // tacche da "candela"
    g.generateTexture('chartbar', 84, 16); g.destroy();

    // --- Vita extra (cuore 1-UP) ---
    g = G();
    g.fillStyle(0x16121A, 1).fillCircle(10, 11, 9).fillCircle(24, 11, 9).fillTriangle(1, 13, 33, 13, 17, 31); // contorno scuro
    g.fillStyle(0xE14B3A, 1).fillCircle(10, 11, 7).fillCircle(24, 11, 7).fillTriangle(4, 13, 30, 13, 17, 28); // cuore rosso
    g.fillStyle(0xF2C53D, 1).fillCircle(7, 8, 2.4);                   // riflesso oro
    g.generateTexture('oneup', 34, 34); g.destroy();

    // --- Piattaforma-neon lampeggiante (Mondo 3) ---
    g = G();
    g.fillStyle(0x16121A, 1).fillRoundedRect(0, 0, 64, 16, 4);        // cornice scura
    g.fillStyle(0x2bd6ff, 1).fillRoundedRect(2, 2, 60, 12, 3);        // neon ciano
    g.fillStyle(0xd9fbff, 1).fillRect(4, 5, 56, 4);                   // luce interna
    g.generateTexture('neon', 64, 16); g.destroy();

    // --- Proiettile dell'eroe (Memento "Spara") ---
    g = G();
    g.fillStyle(0x16121A, 1).fillRoundedRect(0, 0, 22, 12, 5);       // contorno scuro
    g.fillStyle(0xF2994A, 1).fillRoundedRect(2, 2, 18, 8, 4);        // corpo arancione
    g.fillStyle(0xF2C53D, 1).fillRoundedRect(3, 3, 12, 6, 3);        // nucleo giallo
    g.fillStyle(0xffffff, 1).fillRect(4, 4, 5, 3);                   // luce
    g.generateTexture('herobolt', 22, 12); g.destroy();

    // --- Volantino/coupon (proiettile del Promoter) ---
    g = G();
    g.fillStyle(0x16121A, 1).fillRect(0, 0, 16, 12);
    g.fillStyle(0xfff3c4, 1).fillRect(1, 1, 14, 10);                  // carta
    g.fillStyle(0xD96BA0, 1).fillRect(3, 3, 10, 2);                   // riga magenta
    g.fillStyle(0x2bd6ff, 1).fillRect(3, 7, 7, 2);                    // riga ciano
    g.generateTexture('flyerproj', 16, 12); g.destroy();

    // --- Cartellone-cannone (sorgente Spray-Bill) ---
    g = G();
    g.fillStyle(0x16121A, 1).fillRoundedRect(0, 0, 40, 34, 5);
    g.fillStyle(0x3a2440, 1).fillRoundedRect(3, 3, 34, 28, 4);        // corpo viola scuro
    g.fillStyle(0xD96BA0, 1).fillRect(6, 8, 28, 4);                   // banda neon magenta
    g.fillStyle(0x2bd6ff, 1).fillRect(6, 20, 28, 3);                  // banda neon ciano
    g.fillStyle(0x59656f, 1).fillRect(2, 13, 18, 9);                  // bocca (muzzle) verso sinistra
    g.generateTexture('cannon', 40, 34); g.destroy();

    const mkP = (key, w, h) => {
      const g2 = G();
      g2.fillStyle(this.cfg.body, 1).fillRoundedRect(0, 0, w, h, Math.round(w / 3.3));
      g2.fillStyle(this.cfg.accent, 1).fillRect(0, Math.round(h * 0.45), w, Math.max(4, Math.round(h * 0.12)));
      g2.fillStyle(0xffffff, 1)
        .fillCircle(w * 0.37, h * 0.28, Math.max(2, w * 0.08))
        .fillCircle(w * 0.63, h * 0.28, Math.max(2, w * 0.08));
      g2.generateTexture(key, w, h); g2.destroy();
    };
    mkP('psmall', 24, 32); mkP('pbig', 32, 46);  // usati solo dall'icona vite nell'intro

    // mush/enemy/koopa/shell/brick/qblock/coin/pipe/blockempty/glossshot = immagini reali (preload)

    // --- Mini-boss MegaGloss (placeholder disegnato: macchina industriale) ---
    g = G();
    g.fillStyle(0x20262c, 1).fillRect(20, 2, 48, 14);                 // imbuto/coperchio
    g.fillStyle(0x3a424a, 1).fillRoundedRect(6, 16, 76, 86, 12);      // corpo metallico
    g.fillStyle(0x2b3138, 1).fillRoundedRect(6, 16, 76, 86, 12);
    g.fillStyle(0x4b545d, 1).fillRoundedRect(12, 22, 64, 40, 8);      // pannello superiore
    // banda di pericolo giallo/nero
    g.fillStyle(0xF2C53D, 1).fillRect(12, 64, 64, 12);
    g.fillStyle(0x16121A, 1);
    for (let i = 0; i < 6; i++) g.fillRect(14 + i * 11, 64, 5, 12);
    // occhi arrabbiati (rossi) + sopracciglia
    g.fillStyle(0xE14B3A, 1).fillCircle(30, 40, 6).fillCircle(58, 40, 6);
    g.fillStyle(0xffffff, 0.85).fillCircle(31, 39, 2).fillCircle(59, 39, 2);
    g.fillStyle(0x16121A, 1).fillTriangle(22, 30, 38, 36, 22, 36).fillTriangle(66, 30, 50, 36, 66, 36);
    // bocca/griglia
    g.fillStyle(0x16121A, 1).fillRect(28, 82, 32, 12);
    g.fillStyle(0x4b545d, 1);
    for (let i = 0; i < 4; i++) g.fillRect(30 + i * 8, 82, 3, 12);
    // ugello frontale + bulloni
    g.fillStyle(0x6b7682, 1).fillRect(78, 50, 10, 12);
    g.fillStyle(0x9aa7b2, 1).fillCircle(12, 22, 2).fillCircle(76, 22, 2).fillCircle(12, 96, 2).fillCircle(76, 96, 2);
    g.generateTexture('megagloss_ph', 92, 104); g.destroy();
  }

  // scala un'immagine (sprite dinamico) a un'altezza target con corpo fisico
  // di dimensioni world fisse, ancorato in basso-centro (i "piedi")
  fitSprite(s, targetH, bodyW, bodyH) {
    const sc = targetH / s.height; s.setScale(sc);
    const fw = bodyW / sc, fh = bodyH / sc;     // px sorgente → corpo world = bodyW × bodyH
    s.body.setSize(fw, fh);
    s.body.setOffset((s.width - fw) / 2, s.height - fh);
  }

  buildBackdrop() {
    if (this.officina) { this.buildOfficinaBackdrop(); return; }   // Mondo 0: fondo caldo, niente industriale
    // sfondo Mondo 1 (catena di montaggio) a tutto schermo con parallasse
    this.bgSurface = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg_surface')
      .setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.bgSurface.tileScaleX = this.bgSurface.tileScaleY = this.scale.height / 768;
    // dim/desaturazione/blur sono già "bakati" nell'immagine; qui aggiungo la vignette
    this.addVignette();              // bordi schermo scuri (solo sul fondo, non sul gameplay)
    // livello acqua: velo bluverde sopra tutto il gameplay per l'atmosfera sommersa
    if (this.water) this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1a6e8a, 0.18)
      .setOrigin(0).setScrollFactor(0).setDepth(38);
    // livello notturno: velo blu-notte (atmosfera, i neon restano vividi sopra)
    if (this.night) this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0a1030, 0.22)
      .setOrigin(0).setScrollFactor(0).setDepth(38);

    // livello al BUIO (3-2): un alone di luce attorno al player + lampi periodici delle insegne rotte
    if (this.dark) {
      const DW = 1280, DH = 1100;
      if (!this.textures.exists('spotlight')) {
        const tex = this.textures.createCanvas('spotlight', DW, DH); const ctx = tex.getContext();
        const cx = DW / 2, cy = DH / 2;
        const grd = ctx.createRadialGradient(cx, cy, 80, cx, cy, 240);
        grd.addColorStop(0, 'rgba(3,4,12,0)');
        grd.addColorStop(0.55, 'rgba(3,4,12,0.5)');
        grd.addColorStop(1, 'rgba(3,4,12,0.95)');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, DW, DH); tex.refresh();
      }
      this.darkImg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'spotlight')
        .setScrollFactor(0).setDepth(39).setOrigin(0.5);
      // lampi: ogni ~2.6s le insegne rotte illuminano la scena (riduce il buio per ~0.5s)
      this.flashEv = this.time.addEvent({
        delay: 2600, loop: true, callback: () => {
          if (this.state !== 'play' || !this.darkImg) return;
          this.tweens.add({ targets: this.darkImg, alpha: 0.25, yoyo: true, hold: 160, duration: 200 });
          this.cameras.main.flash(120, 60, 30, 90); AUDIO.sfx('flash');
        }, callbackScope: this,
      });
    }
  }

  addVignette() {
    const W = this.scale.width, H = this.scale.height;
    if (!this.textures.exists('vignette')) {
      const tex = this.textures.createCanvas('vignette', W, H);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.62);
      g.addColorStop(0, 'rgba(8,10,14,0)');
      g.addColorStop(1, 'rgba(8,10,14,0.5)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); tex.refresh();
    }
    // depth -4: sopra i layer di sfondo (-10/-6), sotto il gameplay (>=0) → non scurisce il foreground
    this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(-4);
  }

  buildLevel() {
    const L = this.level, gt = this.H - 36;
    this.platforms = this.physics.add.staticGroup();
    const G = (cx, cy, w, h, t = PAL.steel) => {
      const p = this.platforms.create(cx, cy, 'px');
      p.setDisplaySize(w, h).refreshBody().setTint(t); return p;
    };
    // terreno principale: corpo per la collisione + pavimento tilizzato (ground_tile)
    const GF = (cx, w) => {
      const p = this.platforms.create(cx, this.H - 16, 'px').setDisplaySize(w, 40).refreshBody().setVisible(false);
      const band = this.add.tileSprite(cx, this.H - 36, w, 58, 'groundtile').setOrigin(0.5, 0).setDepth(-1);
      band.tileScaleX = band.tileScaleY = 58 / 128;   // un pannello = ~58px
      return p;
    };

    L.ground.forEach(([cx, w]) => GF(cx, w));

    // sotterraneo (solo se il mondo lo prevede) — sfondo immagine (già attenuata)
    // visibile solo quando il player è davvero nel sotterraneo (altrimenti sbordava nella scena del salone)
    this.bgUnder = null;
    if (L.bgUnder && L.bg.under) {
      const u = L.bgUnder;
      this.bgUnder = this.add.image(u.x, this.H, 'bg_under').setOrigin(0.5, 1).setDisplaySize(u.w, u.h).setDepth(-6).setVisible(false);
    }
    L.underground.forEach(r => G(r.cx, r.cy, r.w, r.h, r.tint));

    this.blocks = this.physics.add.staticGroup();
    const B = (cx, topY, kind, gift) => {
      const b = this.blocks.create(cx, topY + 16, kind === 'q' ? 'qblock' : 'brick');
      b.setDisplaySize(32, 32).refreshBody();
      b.kind = kind; b.gift = gift || 'gocce'; return b;
    };
    L.blocks.forEach(g => g.kinds.forEach((k, i) => B(g.x + i * 32, g.topY, k, g.gift)));
    // casse che si sgretolano: raccolte per il controllo "rimani sopra troppo a lungo"
    this.crumbles = [];
    this.blocks.children.iterate(b => { if (b && b.kind === 'crumble') { b.setTint(0xC9A36A); this.crumbles.push(b); } });

    // --- Nastri trasportatori (visivo "macchina" + logica) ---
    this.conveyors = [];
    const BH = 22;  // altezza visiva del nastro
    (L.conveyors || []).forEach(cv => {
      const w = cv.x2 - cv.x1, cx = (cv.x1 + cv.x2) / 2, midY = cv.topY + BH / 2, rr = BH / 2 + 3;
      // telaio metallico + gambe di supporto (look da macchinario)
      this.add.rectangle(cx, cv.topY + BH, w, 7, 0x3a424a).setOrigin(0.5, 0).setDepth(0).setStrokeStyle(1, 0x16121A);
      for (const lx of [cv.x1 + 16, cx, cv.x2 - 16]) this.add.rectangle(lx, cv.topY + BH + 6, 6, 16, 0x4b545d).setOrigin(0.5, 0).setDepth(0);
      // nastro (galloni animati)
      const belt = this.add.tileSprite(cx, cv.topY, w, BH, 'belt').setOrigin(0.5, 0).setDepth(1);
      belt.tileScaleX = belt.tileScaleY = BH / 24;
      // rulli arancioni alle estremità, con razza che gira
      const spokes = [];
      for (const rx of [cv.x1, cv.x2]) {
        this.add.circle(rx, midY, rr, 0xF2994A).setStrokeStyle(2, 0x16121A).setDepth(1);
        const sk = this.add.container(rx, midY, [
          this.add.rectangle(0, 0, rr * 1.6, 3, 0x16121A),
          this.add.rectangle(0, 0, 3, rr * 1.6, 0x16121A),
        ]).setDepth(2);
        spokes.push(sk);
      }
      this.conveyors.push({ x1: cv.x1, x2: cv.x2, topY: cv.topY, dir: cv.dir, speed: cv.speed, belt, spokes });
    });

    // --- Molle pallet (statiche, rimbalzo dall'alto) ---
    this.springs = this.physics.add.staticGroup();
    (L.springs || []).forEach(sp => {
      const s = this.springs.create(sp.x, sp.topY - 14, 'spring').setDisplaySize(40, 28).refreshBody();
      s.power = sp.power || 820; s.baseSY = s.scaleY;
    });

    this.coins = this.physics.add.staticGroup();
    const coin = (x, y) => this.coins.create(x, y, 'coin').setDisplaySize(17, 21).refreshBody();
    L.coins.forEach(c => { const n = c.n || 1, dx = c.dx || 34; for (let i = 0; i < n; i++) coin(c.x + i * dx, c.y); });

    // --- Lettera nascosta FREEDOM (Beat 7): una per mondo, racchiusa in un anello di catena.
    // Non blocca il completamento: solo chi esplora la trova. Già raccolta → non riappare. ---
    this.buildHiddenLetter(L.letter);

    this.enemies = this.physics.add.group();
    const TEX = { flyer: 'koopa', koopa: 'koopa', floater: 'flacone', chaser: 'spugnotto', spam: 'spam', bullet: 'spraybill', promoter: 'promoter', lakitu: 'lakitu', spiny: 'spiny' };
    const FREE = { flyer: 1, floater: 1, chaser: 1, spam: 1, bullet: 1, lakitu: 1 };   // volano liberi (niente gravità/collisione)
    const E = (x, y, a, b, kind) => {
      const e = this.enemies.create(x, y, TEX[kind] || 'enemy');
      if (FREE[kind]) {
        if (kind === 'chaser') this.fitSprite(e, 46, 30, 34);
        else if (kind === 'bullet') this.fitSprite(e, 30, 28, 20);
        else if (kind === 'lakitu') this.fitSprite(e, 52, 34, 40);
        else this.fitSprite(e, 40, 30, 26);
        e.body.allowGravity = false;
        e.body.checkCollision.none = true;   // si muove libero (l'overlap col player resta)
        e.baseY = y; e.phase = (x % 360) / 57;   // sfasa l'oscillazione verticale
        if (kind === 'lakitu') e.nextDrop = this.time.now + 1500 + (x % 600);
      } else if (kind === 'koopa') {
        this.fitSprite(e, 46, 26, 40); e.setCollideWorldBounds(true);
      } else if (kind === 'promoter') {   // Hammer Bro: cammina, saltella, lancia volantini
        this.fitSprite(e, 52, 28, 44); e.setCollideWorldBounds(true);
        e.nextThrow = this.time.now + 1300 + (x % 700); e.nextHop = this.time.now + 600 + (x % 500);
      } else if (kind === 'spiny') {   // Goccia Corrosiva: striscia a terra, NON schiacciabile
        this.fitSprite(e, 34, 28, 26); e.setCollideWorldBounds(true);
      } else {
        this.fitSprite(e, 40, 28, 34); e.setCollideWorldBounds(true);
      }
      e.minX = a; e.maxX = b; e.dir = -1;
      e.kind = kind || 'goomba'; e.shell = false; e.justKicked = false; return e;
    };
    L.enemies.forEach(en => E(en.x, en.y, en.minX, en.maxX, en.kind));
    this._E = E;   // riusato dai cannoni per generare i proiettili Spray-Bill

    // --- Correnti di scarico (livello acqua): trascinano giù mentre le attraversi ---
    this.currents = [];
    (L.currents || []).forEach(cu => {
      const cx = (cu.x1 + cu.x2) / 2, cyc = (cu.y1 + cu.y2) / 2;
      const w = cu.x2 - cu.x1, h = cu.y2 - cu.y1;
      const r = this.add.rectangle(cx, cyc, w, h, 0x6fd3e6, 0.12).setDepth(-2);  // velo azzurro
      this.currents.push({ x1: cu.x1, x2: cu.x2, y1: cu.y1, y2: cu.y2, force: cu.force || 14, rect: r });
    });

    // --- Piattaforme-muletto (lift): salgono e scendono, il player ci sale sopra ---
    this.lifts = this.physics.add.group({ allowGravity: false, immovable: true });
    (L.lifts || []).forEach(lf => {
      const m = this.lifts.create(lf.x, lf.y, 'lift').setDepth(1);
      m.setDisplaySize(lf.w || 90, 18).refreshBody();
      m.minY = lf.y - (lf.range || 100); m.maxY = lf.y + (lf.range || 100);
      m.spd = lf.speed || 70; m.setVelocityY(m.spd);
    });

    // --- Casse che piovono (droppers): sorgenti che fanno cadere casse a intervalli ---
    this.fallers = this.physics.add.group();
    this.physics.add.collider(this.fallers, this.platforms, (f) => this.smashFaller(f));
    this.physics.add.collider(this.fallers, this.blocks, (f) => this.smashFaller(f));
    (L.droppers || []).forEach(d => {
      // marcatore tubo/condotto in alto da cui escono le casse
      this.add.rectangle(d.x, (d.top || 40) - 16, 40, 18, 0x3a424a).setDepth(1).setStrokeStyle(2, 0x59656f);
      this.time.addEvent({
        delay: d.interval || 1900, loop: true, startAt: d.startAt || 0,
        callback: () => this.spawnFaller(d.x, d.top || 40), callbackScope: this,
      });
    });

    // --- Bracci di gru rotanti (hazard tipo barra di fuoco) ---
    this.cranes = [];
    (L.cranes || []).forEach(cr => {
      const len = cr.len || 90;
      const arm = this.add.rectangle(cr.x, cr.y, len, 7, 0x59656f).setOrigin(0, 0.5).setDepth(3).setStrokeStyle(1, 0x16121A);
      const hub = this.add.circle(cr.x, cr.y, 9, 0x3a424a).setStrokeStyle(2, 0xF2C53D).setDepth(3);
      const hook = this.add.rectangle(cr.x, cr.y, 16, 16, 0x8a5a2b).setDepth(3).setStrokeStyle(2, 0x16121A); // cassa in punta
      this.cranes.push({ x: cr.x, y: cr.y, len, speed: cr.speed || 1.6, angle: cr.angle || 0, arm, hook });
    });

    // --- Piattaforme-neon lampeggianti (Mondo 3): si accendono/spengono a tempo, con preavviso ---
    this.neonPlats = this.physics.add.staticGroup();
    this.neonList = [];
    (L.neonPlats || []).forEach(np => {
      const w = np.w || 72;
      const glow = this.add.rectangle(np.x, np.y, w + 12, 24, 0x2bd6ff, 0.25).setDepth(0);
      const pl = this.neonPlats.create(np.x, np.y, 'neon').setDisplaySize(w, 16).refreshBody();
      this.neonList.push({ pl, glow, on: np.onTime || 1900, off: np.offTime || 1300, phase: np.phase || 0 });
    });

    // --- Cartelloni-cannone (Mondo 3): sparano Spray-Bill orizzontali a intervalli ---
    this.cannons = [];
    (L.cannons || []).forEach(cn => {
      const dir = cn.dir || -1;
      this.add.image(cn.x, cn.y, 'cannon').setDepth(2).setFlipX(dir > 0);
      this.time.addEvent({ delay: cn.interval || 2800, loop: true, startAt: cn.startAt || 0, callback: () => this.fireSprayBill(cn), callbackScope: this });
    });

    // --- Piattaforme-grafico azionario (Mondo 5): salgono (verdi) e crollano (rosse) ---
    // Ciclo: rise (sale, verde) → hold (in cima, lampeggia prima del crollo) → crash (precipita, rossa) → idle.
    // Si cavalca il rialzo per salire; quando crolla, scappa o precipiti con lei.
    this.charts = this.physics.add.group({ allowGravity: false, immovable: true });
    this.chartList = [];
    (L.charts || []).forEach(ch => {
      const w = ch.w || 84;
      const pl = this.charts.create(ch.x, ch.baseY, 'chartbar').setDepth(1);
      pl.setDisplaySize(w, 16).refreshBody();
      this.chartList.push({
        pl, x: ch.x, baseY: ch.baseY, rise: ch.rise || 150, w,
        riseT: ch.riseT || 2200, holdT: ch.holdT || 1100, crashT: ch.crashT || 500, gapT: ch.gapT || 700,
        phase: ch.phase || 0,
      });
    });

    // --- Griglie laser di sicurezza (Mondo 5, caveau): hazard a tempo (ON ferisce, con preavviso) ---
    this.lasers = [];
    (L.lasers || []).forEach(lz => {
      const vert = (lz.x2 === undefined);
      const x1 = lz.x1, x2 = vert ? lz.x1 : lz.x2, y1 = lz.y1, y2 = lz.y2;
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, w = vert ? 6 : (x2 - x1), h = vert ? (y2 - y1) : 6;
      // emettitori alle due estremità
      for (const [ex, ey] of [[x1, y1], [x2, y2]]) this.add.rectangle(ex, ey, 12, 12, 0x59656f).setStrokeStyle(2, 0xE14B3A).setDepth(3);
      const beam = this.add.rectangle(cx, cy, w, h, 0xE14B3A, 0.9).setDepth(3);
      const glow = this.add.rectangle(cx, cy, w + 4, h + 4, 0xff8a8a, 0.25).setDepth(3);
      this.lasers.push({ x1: Math.min(x1, x2) - 4, x2: Math.max(x1, x2) + 4, y1: Math.min(y1, y2) - 4, y2: Math.max(y1, y2) + 4,
        on: lz.onT || 1400, off: lz.offT || 1400, phase: lz.phase || 0, beam, glow });
    });

    // proiettili lanciati (volantini del Promoter) — feriscono il player
    this.shots = this.physics.add.group();

    // --- Vasche/liquido tossico (Mondo 4): zone che uccidono al contatto ---
    this.hazards = [];
    (L.hazards || []).forEach(hz => {
      const x1 = hz.x1, x2 = hz.x2, y1 = hz.y1, y2 = hz.y2 || (this.H + 40);
      const r = this.add.rectangle((x1 + x2) / 2, y1, x2 - x1, y2 - y1, 0x6cf24a, 0.5).setOrigin(0.5, 0).setDepth(-1).setStrokeStyle(2, 0x3a8f1f);
      // superficie più chiara/gorgogliante
      const top = this.add.rectangle((x1 + x2) / 2, y1, x2 - x1, 6, 0xaeffa0, 0.8).setOrigin(0.5, 0).setDepth(0);
      this.hazards.push({ x1, x2, y1, y2, rect: r, top, baseY1: y1 });
    });

    // --- Ooze tossico che SALE (Mondo 4-2): pozze che montano dal basso quando ti avvicini ---
    // Si arma all'avvicinarsi del player; il liquido sale da startY verso minY; il contatto uccide.
    this.oozePits = [];
    (this.level.oozePits || []).forEach(o => {
      const cx = (o.x1 + o.x2) / 2, w = o.x2 - o.x1;
      const glow = this.add.rectangle(cx, o.startY, w, 26, 0xaeffa0, 0.0).setOrigin(0.5, 1).setDepth(5);  // alone che illumina la scena
      const body = this.add.rectangle(cx, o.startY, w, 6, 0x6cf24a, 0.82).setOrigin(0.5, 0).setDepth(6);  // massa del liquido
      const top  = this.add.rectangle(cx, o.startY, w, 5, 0xd6ffba, 0.95).setOrigin(0.5, 0).setDepth(6);  // superficie gorgogliante
      this.oozePits.push({ ...o, cx, w, glow, body, top, armed: false, t0: 0, surf: o.startY });
    });
    this.resetOoze();

    this.pipes = this.physics.add.staticGroup();
    this.pipeEntries = [];
    const pipeH = 100, pipeW = 64;
    const PIPE = (x, target) => {
      // base a filo pavimento: centro a gt - pipeH/2 → bordo inferiore esattamente su gt
      const p = this.pipes.create(x, gt - pipeH / 2, 'pipe'); p.setDisplaySize(pipeW, pipeH).refreshBody();
      // zona d'ingresso sulla bocca, dove poggiano i piedi salendo sul tubo (top del tubo = gt - pipeH)
      const z = this.add.zone(x, gt - pipeH, 46, 38);
      this.physics.add.existing(z, true); z.target = target; this.pipeEntries.push(z);
    };
    L.pipes.forEach(pp => PIPE(pp.x, pp.target));

    // --- Checkpoint ---
    const cpX = this.cpX = L.checkpoint.x;
    this.add.rectangle(cpX, this.H - 16, 8, 116, 0xF2994A).setOrigin(0.5, 1).setDepth(4);
    this.cpFlag = this.add.triangle(cpX + 4, this.H - 120, 0, 0, 32, 11, 0, 22, PAL.yellow).setOrigin(0, 0.5).setDepth(4);
    this.checkpoint = this.add.zone(cpX, this.H - 78, 42, 170);
    this.physics.add.existing(this.checkpoint, true);

    // --- Gradinata (staircase) prima della bandiera, stile SMB (opzionale) ---
    const gTop = this.H - 36; // top del terreno
    if (L.staircase) {
      for (let s = 0; s < L.staircase.steps; s++) {
        const sx = L.staircase.x0 + s * 32;
        for (let h = 0; h <= s; h++) B(sx, gTop - 32 - h * 32, 'solid');
      }
    }

    // --- Arena boss (opzionale: solo i livelli "castello" hanno il boss) ---
    this.boss = null; this.gate = null; this.gateParts = []; this.bossTrigger = null; this.arena = null;
    if (L.boss) {
      this.arena = { ...L.boss.arena };
      // saracinesca solida: blocca l'accesso al pennone finché il boss è vivo (non scavalcabile)
      this.gate = this.add.image(L.boss.gate.x, this.H - 16, 'gateimg').setOrigin(0.5, 1).setDisplaySize(56, L.boss.gate.h).setDepth(4);
      this.gateParts = [this.gate];
      this.physics.add.existing(this.gate, true);
      // zona trigger invisibile poco prima dell'arena (scatta una sola volta)
      this.bossTrigger = this.add.zone(L.boss.trigger.x, this.H - 90, 30, 300);
      this.physics.add.existing(this.bossTrigger, true);
    }

    // --- Pennone + bandiera di fine livello (immagine) ---
    this.flagX = L.flagpole.x;
    if (!this.officina) this.add.image(this.flagX, this.H - 30, 'flagpole').setOrigin(0.5, 1).setDisplaySize(78, 200).setDepth(4);
    this.goal = this.add.zone(this.flagX, this.H - 110, 54, 240);
    this.physics.add.existing(this.goal, true);

    // --- Salone (opzionale: solo il livello finale del mondo lo libera) ---
    this.salone = null; this.saloneDoorX = L.salone ? L.salone.x : this.flagX + 320;
    if (L.salone) {
      const salTop = this.H - 16, salX = L.salone.x;
      const S = this.salone = {};
      // stato "PRIMA" (occupato, grigio) e "DOPO" (YAC liberato) sovrapposti; il secondo nascosto
      S.corp = this.add.image(salX, salTop, 'salon_corp').setOrigin(0.5, 1).setDisplaySize(212, 168).setDepth(2);
      S.yac  = this.add.image(salX, salTop, 'salon_yac').setOrigin(0.5, 1).setDisplaySize(212, 200).setDepth(2).setAlpha(0);
      // logo YAC + insegna sovrapposti sul pannello (vuoto negli sprite), visibili solo da liberato
      S.yacLogo = this.add.image(salX, salTop - 120, 'yaclogo').setOrigin(0.5, 1).setDepth(4).setAlpha(0);
      S.yacLogo.setScale(30 / S.yacLogo.height);
      S.yacText = this.add.text(salX, salTop - 206, L.salone.label, { fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '15px', color: '#F2994A' }).setOrigin(0.5, 1).setDepth(4).setAlpha(0);
    }

    // --- Mondo 0: postazioni dello studio + frase sul muro ---
    if (this.officina) this.buildOfficina(L.off);
  }

  // ===== Mondo 0 "L'Officina": lo studio dietro le quinte =====
  buildOfficinaBackdrop() {
    const W = this.scale.width, H = this.scale.height;
    if (!this.textures.exists('officinabg')) {
      const tex = this.textures.createCanvas('officinabg', W, H); const ctx = tex.getContext();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2a1a0e'); g.addColorStop(0.55, '#3d2613'); g.addColorStop(1, '#190f08');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); tex.refresh();
    }
    this.bgSurface = this.add.image(0, 0, 'officinabg').setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.add.rectangle(0, 0, W, H, 0xF2994A, 0.07).setOrigin(0).setScrollFactor(0).setDepth(-3);   // luce calda
    this.addVignette();
  }

  buildOfficina(off) {
    const gt = this.H - 36;   // top del pavimento
    const you = state.selectedKey;   // il personaggio in uso: la SUA sedia resta vuota (sei tu che cammini)
    // quattro postazioni: alone caldo + scrivania + sedia + eroe al lavoro + targhetta
    off.stations.forEach(st => {
      const hex = '#' + st.col.toString(16).padStart(6, '0');
      const isYou = st.key === you;
      this.add.ellipse(st.x, gt - 96, 160, 230, 0xF2C53D, 0.06).setDepth(-2);   // fascio di luce
      // scrivania
      this.add.rectangle(st.x, gt, 124, 16, 0x6b4a2a).setOrigin(0.5, 1).setDepth(1).setStrokeStyle(2, 0x16121A);
      this.add.rectangle(st.x - 48, gt - 16, 10, 40, 0x4a3018).setOrigin(0.5, 1).setDepth(1);
      this.add.rectangle(st.x + 48, gt - 16, 10, 40, 0x4a3018).setOrigin(0.5, 1).setDepth(1);
      // sedia (seduta + schienale) — dietro all'eroe
      this.add.rectangle(st.x, gt - 18, 30, 9, 0x4a3018).setOrigin(0.5, 1).setDepth(1).setStrokeStyle(2, 0x16121A);
      this.add.rectangle(st.x + 13, gt - 18, 8, 30, 0x4a3018).setOrigin(0.5, 1).setDepth(1).setStrokeStyle(2, 0x16121A);
      if (isYou) {
        // la TUA postazione è vuota: la sedia ti aspetta
        this.add.text(st.x, gt - 62, '(la tua sedia)', { fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic 600', fontSize: '11px', color: '#F7E7C8' }).setOrigin(0.5).setDepth(2).setAlpha(0.55);
      } else {
        const hero = this.add.image(st.x - 4, gt - 58, 'hero_' + st.key).setDepth(2);
        hero.setScale(76 / hero.height);
        this.tweens.add({ targets: hero, y: hero.y - 4, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.easeInOut' });   // respiro
      }
      this.add.text(st.x, gt - 124, st.name, { fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '15px', color: hex, stroke: '#16121A', strokeThickness: 4 }).setOrigin(0.5).setDepth(3);
      this.add.text(st.x, gt - 106, st.role, { fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic 600', fontSize: '11px', color: '#F7E7C8' }).setOrigin(0.5).setDepth(3);
    });
    // porta calda di uscita (al posto del pennone)
    this.add.rectangle(this.flagX, gt, 72, 152, 0x3a2412).setOrigin(0.5, 1).setDepth(1).setStrokeStyle(3, 0xF2C53D);
    this.add.rectangle(this.flagX, gt, 52, 132, 0xF2C53D, 0.16).setOrigin(0.5, 1).setDepth(1);
    this.add.text(this.flagX, gt - 162, 'USCITA', { fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '12px', color: '#F2C53D' }).setOrigin(0.5).setDepth(3);
    // la frase sul muro: una lettera alla volta, si rivela avanzando
    this.officinaLetters = [];
    off.phrase.split('').forEach((ch, i) => {
      const lx = off.phraseX0 + i * off.phraseDX;
      const t = this.add.text(lx, off.phraseY, ch, {
        fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '30px',
        color: '#F2C53D', stroke: '#16121A', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(2).setAlpha(0.06);
      this.officinaLetters.push({ t, x: lx, shown: ch === ' ' });
    });
    this._offEnded = false;
  }

  updateOfficina() {
    if (!this.officinaLetters) return;
    const px = this.player.x;
    for (const it of this.officinaLetters) {
      if (!it.shown && px + 110 > it.x) {
        it.shown = true;
        this.tweens.add({ targets: it.t, alpha: 1, duration: 600, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: it.t, scale: 1.18, yoyo: true, duration: 220 });
      }
    }
  }

  officinaEnd() {
    if (this._offEnded) return; this._offEnded = true;
    this.won = true; this.state = 'finale';
    const p = this.player; if (p && p.body) { p.setVelocity(0, 0); p.body.allowGravity = false; }
    this.cameras.main.flash(900, 255, 240, 200);
    // tutte le lettere della frase si accendono piene, poi parte il MESSAGGIO FINALE
    if (this.officinaLetters) this.officinaLetters.forEach(it => { it.shown = true; this.tweens.add({ targets: it.t, alpha: 1, duration: 700 }); });
    this.time.delayedCall(1700, () => this.runFinale());
  }

  buildPlayer() {
    const sp = this.level.spawn || { x: 110, y: this.H - 130 };
    this.player = this.physics.add.sprite(sp.x, sp.y, this.heroKey).setCollideWorldBounds(true);
    this.player.big = false; this.fitSprite(this.player, 48, 20, 40);  // poco più grande di prima
    this.player.jumpsLeft = this.cfg.jumps; this.player.invuln = false;
    this.player.pounding = false; this.player.dashing = false;
    this.player._wasAir = false; this.player.jumpCut = false;

    // proiettili dell'eroe (Memento "Spara"): eliminano i nemici, niente gravità
    this.heroShots = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.heroShots, this.enemies, this.heroShotHit, null, this);

    this.mushrooms = this.physics.add.group();
    this.physics.add.collider(this.mushrooms, this.platforms);
    this.physics.add.collider(this.mushrooms, this.blocks);
    this.physics.add.overlap(this.player, this.mushrooms, this.grow, null, this);
    if (this.springs) this.physics.add.overlap(this.player, this.springs, this.hitSpring, null, this);
    if (this.lifts) { this.physics.add.collider(this.player, this.lifts); this.physics.add.collider(this.enemies, this.lifts); }
    if (this.charts) { this.physics.add.collider(this.player, this.charts); this.physics.add.collider(this.enemies, this.charts); }
    if (this.neonPlats) { this.physics.add.collider(this.player, this.neonPlats); this.physics.add.collider(this.enemies, this.neonPlats); this.physics.add.collider(this.mushrooms, this.neonPlats); }
    if (this.fallers) this.physics.add.overlap(this.player, this.fallers, this.hitFaller, null, this);
    if (this.shots) this.physics.add.overlap(this.player, this.shots, this.hitByShot, null, this);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setFollowOffset(0, 55);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.player, this.blocks, this.hitBlock, null, this);
    this.physics.add.collider(this.player, this.pipes);
    this.physics.add.collider(this.enemies, this.pipes);
    this.physics.add.collider(this.enemies, this.blocks);
    this.physics.add.overlap(this.player, this.coins, this.grab, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.touchEnemy, null, this);
    this.physics.add.overlap(this.player, this.goal, () => this.winLevel(), null, this);
    this.physics.add.overlap(this.player, this.checkpoint, this.hitCheckpoint, null, this);
    this.pipeEntries.forEach(z => this.physics.add.overlap(this.player, z, () => { this.onPipe = z; }, null, this));
    // Boss (solo se il livello lo prevede): saracinesca solida + trigger di inizio scontro
    if (this.gate) {
      this.physics.add.collider(this.player, this.gate);
      this.physics.add.collider(this.enemies, this.gate);
    }
    if (this.bossTrigger) this.physics.add.overlap(this.player, this.bossTrigger, () => this.startBoss(), null, this);
  }

  buildHUD() {
    const W = this.scale.width;
    const st = { fontFamily: 'DM Sans, sans-serif', fontStyle: '700', fontSize: '13px', color: '#F7F1E8' };
    const sm = { ...st, fontSize: '10px', color: '#F2C53D' };

    // Sinistra: nome (riga 1), stato speciale (riga 2)
    this.hudName = this.add.text(10, 7, '', st).setScrollFactor(0).setDepth(50);
    this.sub     = this.add.text(10, 25, '', sm).setScrollFactor(0).setDepth(50);

    // Centro: TEMPO
    this.timeTxt  = this.add.text(W / 2, 7, '', st).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);

    // Destra: logo YAC (riga 1) + statistiche allineate a destra (riga 2)
    const wm = this.add.image(W - 10, 6, 'yaclogo').setOrigin(1, 0).setScrollFactor(0).setDepth(50).setAlpha(0.9);
    wm.setScale(18 / wm.height);
    this.hudStats = this.add.text(W - 10, 25, '', { ...sm, color: '#F7F1E8' }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    this.buildLetterHUD();   // tracker discreto FREEDOM (lettere nascoste)
    this.updateHUD();
  }

  updateHUD() {
    if (!this.hudName) return;
    const big = this.player && this.player.big;

    this.hudName.setText(`${this.cfg.name}  ·  ${big ? 'GRANDE' : 'piccolo'}`);
    this.hudStats.setText(`Vite ×${Math.max(0, this.lives)}   Gocce ${this.gocce}   ${this.score} pt`);

    let txt, col;
    if (!big)                { txt = `Z ${this.cfg.power}: serve Boccetta`; col = '#9b8fa6'; }
    else if (this.specialReady) { txt = `Z ${this.cfg.power}: PRONTA`;       col = '#F2C53D'; }
    else                     { txt = `Z ${this.cfg.power}: ricarica…`;       col = '#9b8fa6'; }
    this.sub.setText(txt).setColor(col);

    if (this.timeTxt) {
      if (this.noTimer) this.timeTxt.setText('').setColor('#F7F1E8');   // Mondo 0: niente timer
      else this.timeTxt.setText('TEMPO ' + this.timeLeft).setColor(this.timeLeft <= 50 ? '#ff6b8a' : '#F7F1E8');
    }
  }

  sizePlayer(big) {
    const p = this.player; p.big = big;
    p.setTexture(this.heroKey);
    if (big) this.fitSprite(p, 68, 24, 56); else this.fitSprite(p, 48, 20, 40);
    this.updateHUD();
  }

  grow(p, m) {
    if (m.kind === 'oneup') {   // vita extra
      m.destroy(); this.lives++; this.score += 100; this.popText(p.x, p.y - 34, '1-UP'); AUDIO.sfx('one_up'); this.updateHUD(); return;
    }
    m.destroy();
    if (!p.big) {
      p.y -= 16; this.sizePlayer(true); this.popText(p.x, p.y - 30, 'GRANDE!'); AUDIO.sfx('powerup_grow');
      if (!this.tutShown) { this.tutShown = true; this.showHint(this.cfg.hint); }
    } else { this.score += 100; this.updateHUD(); }
  }

  shrink() {
    const p = this.player; this.sizePlayer(false); p.invuln = true; AUDIO.sfx('shrink');
    this.tweens.add({ targets: p, alpha: 0.3, yoyo: true, repeat: 6, duration: 90, onComplete: () => { p.alpha = 1; p.invuln = false; } });
  }

  grab(p, c) { c.destroy(); this.gocce++; this.score += 10; AUDIO.sfx('coin'); if (this.gocce % 100 === 0) { this.lives++; AUDIO.sfx('one_up'); } this.updateHUD(); }

  // Molla pallet: rimbalzo alto solo se atterri dall'alto
  hitSpring(p, s) {
    if (p.body.velocity.y < -10) return;                 // sei in salita → niente
    if (p.body.bottom > s.body.top + 24) return;         // colpita di lato → niente
    p.setVelocityY(-s.power); p.jumpsLeft = this.cfg.jumps; p.jumpCut = true;
    AUDIO.sfx('jump');
    this.tweens.add({ targets: s, scaleY: s.baseSY * 0.55, yoyo: true, duration: 90 });
  }

  // Cassa che si sgretola: parte il timer quando ci stai sopra
  startCrumble(b) {
    if (b.crumbling) return; b.crumbling = true;
    this.tweens.add({ targets: b, angle: 3, yoyo: true, repeat: 4, duration: 60 });
    this.time.delayedCall(620, () => {
      if (!b.active) return;
      AUDIO.sfx('brick_break');
      if (b.body) b.body.checkCollision.none = true;      // il player ci cade attraverso
      const i = this.crumbles.indexOf(b); if (i >= 0) this.crumbles.splice(i, 1);
      this.tweens.add({ targets: b, alpha: 0, y: b.y + 10, duration: 200, onComplete: () => b.destroy() });
    });
  }

  // ===== Ooze tossico che sale (Mondo 4-2) =====
  // Riporta tutte le pozze al livello basso e disarmate (a inizio livello e a ogni respawn).
  resetOoze() {
    if (!this.oozePits) return;
    for (const o of this.oozePits) { o.armed = false; o.t0 = 0; o.surf = o.startY; this.drawOoze(o); }
  }

  drawOoze(o) {
    const h = (this.H + 60) - o.surf;
    o.body.setPosition(o.cx, o.surf).setSize(o.w, Math.max(1, h));
    o.top.setPosition(o.cx, o.surf);
    o.glow.setPosition(o.cx, o.surf);
  }

  // Sale quando il player entra nel raggio della pozza; il contatto coi piedi uccide.
  updateOoze() {
    const p = this.player;
    for (const o of this.oozePits) {
      if (!o.armed && p.x > o.x1 - 70) { o.armed = true; o.t0 = this.time.now; }
      if (o.armed) {
        o.surf = Phaser.Math.Clamp(o.startY - (this.time.now - o.t0) * o.speed / 1000, o.minY, o.startY);
        // pulsazione del bagliore (vivo/respirante)
        o.glow.setAlpha(0.22 + Math.sin(this.time.now / 260) * 0.08);
      }
      this.drawOoze(o);
      const pb = p.body;
      if (o.armed && pb.right > o.x1 && pb.left < o.x2 && pb.bottom > o.surf) { this.loseLife(); break; }
    }
  }

  // ===== Mondo 5 =====
  // Piattaforme-grafico azionario: rise(verde) → hold(verde, lampeggia) → crash(rossa, precipita) → idle.
  updateCharts() {
    const slow = this.slowActive ? 2.2 : 1;
    for (const ch of this.chartList) {
      const period = ch.riseT + ch.holdT + ch.crashT + ch.gapT;
      const tt = ((this.time.now + ch.phase) % (period * slow)) / slow;
      let targetY, tint, blink = false;
      const top = ch.baseY - ch.rise;
      if (tt < ch.riseT) { targetY = ch.baseY - ch.rise * (tt / ch.riseT); tint = 0x3BB36A; }       // sale (verde)
      else if (tt < ch.riseT + ch.holdT) {
        targetY = top; tint = 0x3BB36A; blink = (ch.riseT + ch.holdT - tt) < 380;                   // in cima, preavviso crollo
      } else if (tt < ch.riseT + ch.holdT + ch.crashT) {
        targetY = top + ch.rise * ((tt - ch.riseT - ch.holdT) / ch.crashT); tint = 0xE14B3A;        // crolla (rossa)
      } else { targetY = ch.baseY; tint = 0x6b7682; }                                                // idle
      const isCrash = tint === 0xE14B3A && !blink;
      if (isCrash && !ch.wasCrash && Math.abs(ch.x - this.player.x) < 340) AUDIO.sfx('chart_crash');  // entra in crollo, vicino al player
      ch.wasCrash = isCrash;
      const pl = ch.pl;
      pl.setVelocityY(Phaser.Math.Clamp((targetY - pl.y) * 9, -360, 720));
      if (blink) { const fph = Math.floor(this.time.now / 80) % 2; pl.setTint(fph ? 0xE14B3A : 0x3BB36A); }
      else pl.setTint(tint);
    }
  }

  // Griglie laser di sicurezza: ON ferisce (con preavviso di lampeggio); OFF inerte.
  updateLasers() {
    const p = this.player, pb = p.body;
    for (const lz of this.lasers) {
      const cyc = lz.on + lz.off, tt = (this.time.now + lz.phase) % cyc;
      const isOn = tt < lz.on, warn = !isOn && (cyc - tt) < 420;   // si riarma
      if (isOn && !lz.wasOn && Math.abs((lz.x1 + lz.x2) / 2 - p.x) < 340) AUDIO.sfx('laser_zap');   // scatta, vicino al player
      lz.wasOn = isOn;
      lz.beam.setVisible(isOn || warn); lz.glow.setVisible(isOn);
      if (isOn) { const f = Math.floor(this.time.now / 50) % 2; lz.beam.setAlpha(0.75 + f * 0.2); lz.glow.setAlpha(0.25); }
      else if (warn) { const f = Math.floor(this.time.now / 90) % 2; lz.beam.setAlpha(f ? 0.35 : 0.08); }
      if (isOn && !p.invuln && pb.right > lz.x1 && pb.left < lz.x2 && pb.bottom > lz.y1 && pb.top < lz.y2) this.hurtPlayer();
    }
  }

  // Contatto con la melma/vasca tossica: da GRANDE torni piccolo e rimbalzi fuori (con invulnerabilità),
  // da piccolo muori. Più equo del "morte istantanea". (L'ooze che SALE del 4-2 resta letale: vedi updateOoze.)
  hitHazard() {
    const p = this.player;
    if (p.invuln) return;
    if (p.big) { this.shrink(); p.setVelocityY(-430); }   // pop-out: rimbalza fuori dalla melma
    else this.loseLife();
  }

  // danno generico al player (hazard: gru, casse cadenti)
  hurtPlayer() {
    const p = this.player; if (p.invuln) return;
    AUDIO.sfx('hit_damage');
    if (p.big) this.shrink(); else this.loseLife();
  }

  // ===== Mondo 3 =====
  // Spray-Bill: bomboletta orizzontale sparata dal cartellone-cannone (schiacciabile come Bullet Bill)
  fireSprayBill(cn) {
    if (this.state !== 'play' || this.paused) return;
    const dir = cn.dir || -1;
    const e = this._E(cn.x + dir * 24, cn.y, 0, this.W, 'bullet');
    e.setVelocityX((cn.speed || 150) * dir); e.setFlipX(dir > 0);
    this.time.delayedCall(5200, () => { if (e && e.active) e.destroy(); });
    AUDIO.sfx(cn.sfx || 'spraybill');   // Mondo 5: i cannoni-ticker usano 'bolletta_fire'
  }

  // Promoter (Hammer Bro): cammina, saltella, lancia volantini ad arco verso il player
  updatePromoter(e) {
    const spd = this.slowActive ? 16 : 52;
    if (e.x <= e.minX || e.body.blocked.left) e.dir = 1;
    if (e.x >= e.maxX || e.body.blocked.right) e.dir = -1;
    e.setVelocityX(spd * e.dir); e.setFlipX(this.player.x > e.x);   // guarda il player
    if (e.body.blocked.down && this.time.now > e.nextHop) {
      e.setVelocityY(-360); e.nextHop = this.time.now + (this.slowActive ? 2800 : 1400) + (e.x % 600);
    }
    if (this.time.now > e.nextThrow && Math.abs(this.player.x - e.x) < 560) { this.throwFlyer(e); e.nextThrow = this.time.now + (this.slowActive ? 5200 : 2600); }
  }

  // Spruzzabot (Lakitu): insegue il player dall'alto, oscilla in quota (a volte raggiungibile) e dropga Gocce
  updateLakitu(e) {
    const p = this.player;
    const tx = p.x + 30, ty = 150 + Math.sin(this.time.now / 700) * 80;   // quota 70..230 (a volte schiacciabile)
    e.setVelocityX(Phaser.Math.Clamp((tx - e.x) * 3, -240, 240));
    e.setVelocityY(Phaser.Math.Clamp((ty - e.y) * 4, -220, 220) * (this.slowActive ? 0.4 : 1));
    e.setFlipX(p.x > e.x);
    if (this.time.now > e.nextDrop && Math.abs(p.x - e.x) < 340) {
      this.dropGoccia(e); e.nextDrop = this.time.now + (this.slowActive ? 4200 : 2200);
    }
  }

  dropGoccia(e) {
    if (this.state !== 'play') return;
    const g = this._E(e.x, e.y + 16, e.x - 300, e.x + 300, 'spiny');
    g.setVelocityY(60);
    this.time.delayedCall(9000, () => { if (g && g.active && !g.dead) g.destroy(); });
    AUDIO.sfx('goccia_drop');
  }

  throwFlyer(e) {
    if (this.state !== 'play') return;
    const p = this.player, dir = p.x < e.x ? -1 : 1;
    const proj = this.shots.create(e.x, e.y - 22, 'flyerproj');
    proj.body.allowGravity = true; proj.setVelocity(dir * 150, -250); proj.setAngularVelocity(dir * 320);
    proj.body.setSize(proj.width * 0.7, proj.height * 0.7);
    this.time.delayedCall(4000, () => { if (proj && proj.active) proj.destroy(); });
    AUDIO.sfx('flyer_throw');
  }

  // piattaforme-neon: ciclo accese/spente con preavviso di lampeggio
  updateNeon() {
    for (const n of this.neonList) {
      const cyc = n.on + n.off, t = (this.time.now + n.phase) % cyc;
      const isOn = t < n.on, blinking = isOn && (n.on - t) < 420;
      if (n.pl.body.enable !== isOn) n.pl.body.enable = isOn;
      n.pl.setVisible(isOn); n.glow.setVisible(isOn);
      if (blinking) { const f = Math.floor(this.time.now / 90) % 2; n.pl.setAlpha(f ? 1 : 0.3); n.glow.setAlpha(f ? 0.25 : 0.06); }
      else if (isOn) { n.pl.setAlpha(1); n.glow.setAlpha(0.25); }
    }
  }

  // Casse che piovono dall'alto
  spawnFaller(x, top) {
    if (this.state !== 'play' || this.paused) return;
    const f = this.fallers.create(x, top, 'brick').setDisplaySize(30, 30).setTint(0xC9A36A);
    f.setVelocityY(60);
    this.time.delayedCall(7000, () => { if (f && f.active) f.destroy(); });
  }

  smashFaller(f) {
    if (!f || !f.active) return;
    const x = f.x, y = f.body.bottom; AUDIO.sfx('brick_break'); f.destroy();
    const r = this.add.circle(x, y, 6, 0xC9A36A, 0.5).setDepth(3);
    this.tweens.add({ targets: r, radius: 22, alpha: 0, duration: 220, onComplete: () => r.destroy() });
  }

  hitFaller(p, f) {
    if (!f.active) return;
    // se ci salti sopra mentre cade → la rompi e rimbalzi (schivata premiata)
    if (p.body.velocity.y > 40 && p.body.bottom <= f.body.top + 12) {
      p.setVelocityY(-330); this.smashFaller(f); this.score += 50; this.updateHUD(); return;
    }
    f.destroy(); this.hurtPlayer();
  }

  hitBlock(p, b) {
    if (!(p.body.touching.up && b.body.touching.down)) return;
    // SMB: colpendo un blocco da sotto, ciò che sta sopra reagisce
    this.bumpTop(b);
    if (b.kind === 'solid' || b.kind === 'used') { this.nudge(b); return; }
    const gift = b.gift;
    if (b.kind === 'brick') {
      if (gift === 'mush' || gift === 'oneup') {     // brick "nascosto" con dono: rilascia (non si rompe)
        b.kind = 'used'; b.setTexture('blockempty').setDisplaySize(32, 32).refreshBody();
        this.releaseGift(b, gift);
      } else if (p.big) { b.destroy(); this.score += 50; this.popText(b.x, b.y, '+50'); AUDIO.sfx('brick_break'); }
      else this.nudge(b);
    } else if (b.kind === 'q') {
      b.kind = 'used'; b.setTexture('blockempty').setDisplaySize(32, 32).refreshBody();
      if (gift === 'mush' || gift === 'oneup') this.releaseGift(b, gift);
      else { this.score += 20; this.gocce += 3; AUDIO.sfx('coin'); if (this.gocce % 100 === 0) { this.lives++; AUDIO.sfx('one_up'); } this.popCoin(b.x, b.y - 20); }
    }
    this.updateHUD();
  }

  // piccolo sobbalzo del blocco quando lo colpisci da sotto
  nudge(b) { this.tweens.add({ targets: b, y: b.y - 5, yoyo: true, duration: 80 }); }

  releaseGift(b, gift) {
    const topY = b.y - 16;
    if (gift === 'oneup') { this.spawnOneup(b.x, topY); this.popText(b.x, b.y - 20, 'VITA YAC!'); }
    else { this.spawnMush(b.x, topY); this.popText(b.x, b.y - 20, 'Boccetta!'); }
  }

  // SMB: nemici sopra al blocco muoiono, oggetti sopra invertono direzione
  bumpTop(b) {
    const topY = b.y - 16;
    this.enemies.children.iterate(e => {
      if (!e || !e.body || e.dead) return;
      if (Math.abs(e.x - b.x) < 24 && e.body.bottom > topY - 4 && e.body.bottom < topY + 14) {
        e.setVelocityY(-260); this.killEnemy(e); this.score += 100; this.popText(e.x, e.y - 10, '+100');
      }
    });
    if (this.mushrooms) this.mushrooms.children.iterate(m => {
      if (!m || !m.body || m.emerging) return;
      if (Math.abs(m.x - b.x) < 26 && m.body.bottom > topY - 4 && m.body.bottom < topY + 14) {
        const vx = m.body.velocity.x || 70; m.setVelocityX(-Math.sign(vx) * Math.abs(vx || 70)); m.setVelocityY(-150);
      }
    });
  }

  // L'oggetto EMERGE salendo dal blocco (stile funghetto SMB), poi si muove e si raccoglie a contatto
  spawnMush(x, topY) {
    const m = this.mushrooms.create(x, topY - 2, 'mush');
    m.kind = 'mush'; this.fitSprite(m, 34, 18, 28);
    m.body.allowGravity = false; m.setVelocity(0, -60); m.emerging = true;
    this.time.delayedCall(460, () => { if (!m.active) return; m.emerging = false; m.body.allowGravity = true; m.setVelocityX(70).setBounce(0); });
  }

  spawnOneup(x, topY) {
    const m = this.mushrooms.create(x, topY - 2, 'oneup');
    m.kind = 'oneup'; this.fitSprite(m, 30, 20, 24);
    m.body.allowGravity = false; m.setVelocity(0, -60); m.emerging = true;
    this.time.delayedCall(460, () => { if (!m.active) return; m.emerging = false; m.body.allowGravity = true; m.setVelocityX(70).setBounce(0); });
  }

  popCoin(x, y) {
    const c = this.add.image(x, y, 'coin').setDisplaySize(17, 21);
    this.tweens.add({ targets: c, y: y - 26, alpha: 0, duration: 420, onComplete: () => c.destroy() });
  }

  // ===== Lettera nascosta FREEDOM: anello di catena + lettera d'oro, da raccogliere =====
  buildHiddenLetter(lt) {
    this.letterObj = null; this.letterZone = null; this._gotLetter = false;
    if (!lt || hasLetter(lt.id)) return;   // niente lettera in questo mondo, o già presa
    const cont = this.add.container(lt.x, lt.y).setDepth(8);
    const glow = this.add.circle(0, 0, 17, PAL.yellow, 0.18);
    const ring = this.add.circle(0, 0, 17).setStrokeStyle(4, PAL.gold, 1);     // anello di catena
    const ring2 = this.add.circle(0, 0, 11).setStrokeStyle(2, PAL.gold, 0.55);
    const ch = this.add.text(0, 0, lt.char, {
      fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '22px',
      color: '#F2C53D', stroke: '#16121A', strokeThickness: 4,
    }).setOrigin(0.5);
    cont.add([glow, ring, ring2, ch]);
    this.letterObj = cont;
    // galleggia + l'anello ruota lento + bagliore pulsante (si nota se la cerchi)
    this.tweens.add({ targets: cont, y: lt.y - 7, yoyo: true, repeat: -1, duration: 1000, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: ring, angle: 360, repeat: -1, duration: 5200 });
    this.tweens.add({ targets: glow, alpha: 0.4, scale: 1.18, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    // zona di raccolta (overlap col player)
    this.letterZone = this.add.zone(lt.x, lt.y, 42, 42);
    this.physics.add.existing(this.letterZone, true);
    this.physics.add.overlap(this.player, this.letterZone, () => this.grabLetter(lt), null, this);
  }

  grabLetter(lt) {
    if (this._gotLetter) return; this._gotLetter = true;
    collectLetter(lt.id);
    AUDIO.sfx('letter_get');
    if (this.letterZone) { this.letterZone.destroy(); this.letterZone = null; }
    const x = this.letterObj ? this.letterObj.x : lt.x, y = this.letterObj ? this.letterObj.y : lt.y;
    this.cameras.main.flash(160, 242, 197, 61);
    this.popText(x, y - 24, 'LETTERA ' + lt.char + '!');
    // l'anello di catena si SPEZZA: due semianelli volano via (Break the Mold)
    AUDIO.sfx('chain_break');
    for (const dir of [-1, 1]) {
      const half = this.add.circle(x, y, 17, 0, 0).setStrokeStyle(4, PAL.gold, 1).setDepth(9);
      this.tweens.add({ targets: half, x: x + dir * 36, y: y - 18, angle: dir * 120, alpha: 0, scale: 0.6, duration: 480, ease: 'Quad.easeOut', onComplete: () => half.destroy() });
    }
    if (this.letterObj) { this.tweens.killTweensOf(this.letterObj); this.tweens.add({ targets: this.letterObj, y: y - 30, scale: 1.5, alpha: 0, duration: 460, ease: 'Quad.easeOut', onComplete: () => { if (this.letterObj) this.letterObj.destroy(); this.letterObj = null; } }); }
    this.score += 500; this.updateHUD();
    this.updateLetterHUD();
  }

  // Tracker discreto delle 6 lettere (in basso a sinistra): d'oro se trovata, spenta se manca
  buildLetterHUD() {
    this.letterHud = [];
    const y = this.scale.height - 16, x0 = 12, gap = 15;
    SECRET_WORD.forEach((chr, i) => {
      const t = this.add.text(x0 + i * gap, y, chr, {
        fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '12px',
        color: '#F2C53D', stroke: '#16121A', strokeThickness: 3,
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(50);
      this.letterHud.push(t);
    });
    this.updateLetterHUD();
  }

  updateLetterHUD() {
    if (!this.letterHud) return;
    SECRET_WORD.forEach((chr, i) => {
      const got = hasLetter(i);
      this.letterHud[i].setColor(got ? '#F2C53D' : '#5a5560').setAlpha(got ? 1 : 0.5);
    });
  }

  popText(x, y, t) {
    // testo ben leggibile: bianco, grande, con contorno scuro spesso, sopra il gameplay
    const o = this.add.text(x, y, t, {
      fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '18px', color: '#FFFFFF',
      stroke: '#16121A', strokeThickness: 5, align: 'center',
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: o, y: y - 28, alpha: 0, duration: 680, ease: 'Quad.easeOut', onComplete: () => o.destroy() });
  }

  touchEnemy(p, e) {
    if (e.dead) return;
    // INVINCIBILE (Yuri): qualsiasi contatto elimina il nemico
    if (this.invincible) { this.killEnemy(e); this.score += 100; this.popText(e.x, e.y - 10, '+100'); this.updateHUD(); return; }
    const moving = e.shell && e.shellMoving;
    if (p.pounding || p.dashing) {
      this.killEnemy(e); if (!p.dashing) p.setVelocityY(-200);
      this.score += 100; this.popText(e.x, e.y - 10, '+100'); this.updateHUD(); return;
    }
    // Goccia Corrosiva (Spiny): NON si schiaccia → qualsiasi contatto ferisce (eliminabile solo con speciale/dash/pound)
    if (e.kind === 'spiny') { this.hurtPlayer(); return; }
    const stomp = p.body.velocity.y > 40 && p.body.bottom <= e.body.top + 14;
    if (stomp) {
      p.setVelocityY(-330); AUDIO.sfx('stomp');
      if (e.kind === 'flyer') {            // Tubetto Alato: 1° stomp → perde le ali, cade come tubo a terra
        this.deWing(e); this.awardStomp(e.x, e.y);
      } else if (e.kind === 'koopa' && !e.shell) {
        e.shell = true; e.shellMoving = false; e.setVelocity(0, 0); e.setTexture('shell');
        this.fitSprite(e, 28, 28, 20); this.awardStomp(e.x, e.y);
      } else if (e.shell) { e.setVelocity(0, 0); e.shellMoving = false; }
      else { this.killEnemy(e); this.awardStomp(e.x, e.y); }
      this.updateHUD(); return;
    }
    if (moving) { if (!e.justKicked && !p.invuln) { if (p.big) this.shrink(); else this.loseLife(); } return; }
    if (e.shell) {
      const dir = p.x < e.x ? 1 : -1; e.shellDir = dir; e.shellMoving = true; e.setVelocityX(dir * 340); e.justKicked = true; AUDIO.sfx('kick_shell');
      this.time.delayedCall(240, () => { if (e) e.justKicked = false; }); return;
    }
    if (!p.invuln) { if (p.big) this.shrink(); else this.loseLife(); }
  }

  awardStomp(x, y) {
    const CH = [100, 200, 400, 500, 800, 1000, 2000, 4000, 8000];
    if (this.combo >= CH.length) { this.lives++; this.popText(x, y - 10, '1-UP'); AUDIO.sfx('one_up'); }
    else { const pts = CH[this.combo]; this.score += pts; this.popText(x, y - 10, '+' + pts); }
    this.combo++;
  }

  killEnemy(e) {
    e.dead = true; e.body.checkCollision.none = true; e.setVelocity(0, 0).setTint(0x556068);
    this.tweens.add({ targets: e, scaleY: 0.2, alpha: 0, duration: 160, onComplete: () => e.destroy() });
  }

  // Tubetto Alato: perde le ali → diventa un tubo a terra (koopa). Il 2° stomp lo fa diventare guscio.
  deWing(e) {
    e.kind = 'koopa'; e.winged = false;
    e.body.checkCollision.none = false; e.body.allowGravity = true;
    e.setCollideWorldBounds(true);
    e.setTexture(this.textures.exists('koopawalk') ? 'koopawalk' : 'koopa');
    this.fitSprite(e, 44, 26, 38);
    if (!e.dir) e.dir = -1;
    // effetto: ali bianche che volano via
    for (const s of [-1, 1]) {
      const w = this.add.triangle(e.x, e.y - 8, 0, 8, 11, 0, 0, -8, 0xffffff).setDepth(5).setAlpha(0.9);
      this.tweens.add({ targets: w, x: e.x + s * 42, y: e.y - 48, alpha: 0, angle: s * 200, duration: 480, onComplete: () => w.destroy() });
    }
  }

  loseLife() {
    if (this.state !== 'play') return; this.state = 'dying';
    AUDIO.sfx('death');
    if (this.timerEv) this.timerEv.paused = true;
    const p = this.player; p.body.checkCollision.none = true;
    p.setVelocity(0, -440).setTint(0xff6b8a);
    this.enemies.children.iterate(e => { if (e && e.body) e.setVelocity(0, 0); });
    this.cameras.main.shake(140, 0.006);
    this.time.delayedCall(1200, () => {
      this.lives--; this.updateHUD();
      if (this.lives < 0) { this.over(); return; }
      this.respawn();
    });
  }

  respawn() {
    const p = this.player; p.clearTint(); p.body.checkCollision.none = false;
    // azzera eventuali speciali attivi (morte durante Spara/Invincibile)
    this.invincible = false; this.shootMode = false; this.slowActive = false;
    if (this.shootEv) { this.shootEv.remove(); this.shootEv = null; }
    if (this.invEv) { this.invEv.remove(); this.invEv = null; }
    if (this.tint) { this.tint.destroy(); this.tint = null; }
    if (this.heroShots) this.heroShots.clear(true, true);
    this.sizePlayer(false); p.alpha = 1; p.setVelocity(0, 0).setPosition(this.checkpointX, this.H - 130);
    this.timeLeft = this.timeLimit;
    // riattiva i blocchi Boccetta YAC: dopo la morte puoi ripotenziarti (NON i blocchi 1-UP/monete)
    if (this.blocks) this.blocks.children.iterate(b => {
      if (b && b.gift === 'mush' && b.kind === 'used') {
        b.kind = 'q'; b.setTexture('qblock').setDisplaySize(32, 32).refreshBody();
      }
    });
    if (this.timerEv) { this.timerEv.remove(); this.timerEv = null; }
    this.showIntro(() => {
      this.timerEv = this.time.addEvent({ delay: 420, loop: true, callback: this.tickTime, callbackScope: this });
      this.beginPlay(); p.invuln = true;
      this.tweens.add({ targets: p, alpha: 0.4, yoyo: true, repeat: 5, duration: 100, onComplete: () => { p.alpha = 1; p.invuln = false; } });
    });
  }

  hitCheckpoint() {
    if (this.checkpointX < this.cpX) {
      this.checkpointX = this.cpX; this.popText(this.cpX, this.H - 150, 'CHECKPOINT');
      if (this.cpFlag) this.tweens.add({ targets: this.cpFlag, y: '-=12', duration: 200 });
    }
  }

  poundLand() {
    const p = this.player; p.pounding = false;
    const ring = this.add.circle(p.x, p.body.bottom, 10, PAL.rose, 0.3).setStrokeStyle(3, PAL.rose).setDepth(5);
    this.tweens.add({ targets: ring, radius: 120, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
    this.cameras.main.shake(120, 0.005);
    this.enemies.children.iterate(e => {
      if (e && !e.dead && Phaser.Math.Distance.Between(p.x, p.body.bottom, e.x, e.y) < 120) {
        this.killEnemy(e); this.score += 100;
      }
    });
    this.blocks.children.iterate(b => {
      if (b && b.kind === 'brick' && Math.abs(b.x - p.x) < 70 && b.y > p.body.bottom - 12) {
        b.destroy(); this.score += 50;
      }
    });
    this.updateHUD();
  }

  showHint(msg) {
    const W = this.scale.width;
    const cont = this.add.container(0, 0).setScrollFactor(0).setDepth(115);
    const bg = this.add.rectangle(W / 2, 58, Math.min(W - 26, 560), 36, 0x16121A, 0.94).setStrokeStyle(2, 0xF2C53D).setOrigin(0.5);
    const tx = this.add.text(W / 2, 58, msg, { fontFamily: 'DM Sans, sans-serif', fontStyle: '700', fontSize: '13px', color: '#F7F1E8', align: 'center', wordWrap: { width: Math.min(W - 46, 540) } }).setOrigin(0.5);
    cont.add([bg, tx]);
    this.time.delayedCall(3400, () => this.tweens.add({ targets: cont, alpha: 0, duration: 400, onComplete: () => cont.destroy() }));
  }

  startLevel() {
    this.state = 'intro';
    this.timerEv = this.time.addEvent({ delay: 420, loop: true, paused: true, callback: this.tickTime, callbackScope: this });
    this.showIntro(() => this.beginPlay());
  }

  showIntro(cb) {
    this.state = 'intro'; this.physics.pause();
    if (this.timerEv) this.timerEv.paused = true;
    const W = this.scale.width, H = this.scale.height;
    const WORLD = { name: this.level.name, sub: this.level.sub };
    const cy = H / 2;
    const cont = this.add.container(0, 0).setScrollFactor(0).setDepth(120);
    const bg = this.add.rectangle(0, 0, W, H, 0x0c0810, 1).setOrigin(0);
    const wl = this.add.image(W / 2, cy - 78, 'yaclogo').setOrigin(0.5);
    wl.setScale(44 / wl.height);
    const t1 = this.add.text(W / 2, cy - 26, WORLD.name, { fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '36px', color: '#F7F1E8' }).setOrigin(0.5);
    const t1b = this.add.text(W / 2, cy + 10, WORLD.sub, { fontFamily: 'Syne, sans-serif', fontStyle: '700', fontSize: '16px', color: '#F2994A' }).setOrigin(0.5);
    const ic = this.add.image(W / 2 - 28, cy + 52, 'psmall').setOrigin(0.5).setScale(1.1);
    const t2 = this.add.text(W / 2 + 2, cy + 52, '×  ' + Math.max(0, this.lives), { fontFamily: 'Syne, sans-serif', fontStyle: 'bold', fontSize: '24px', color: '#F2C53D' }).setOrigin(0, 0.5);
    cont.add([bg, wl, t1, t1b, ic, t2]);
    this.time.delayedCall(1600, () => { cont.destroy(); cb(); });
  }

  beginPlay() {
    this.state = 'play'; this.physics.resume(); if (this.timerEv) this.timerEv.paused = false; this.updateHUD();
    this.resetOoze();   // l'ooze riparte basso a ogni avvio/respawn (climb sempre equa)
    AUDIO.playMusic(this.bossActive && !this.bossDefeated ? this.level.music.boss : this.level.music.surface);
  }

  togglePause() { if (this.paused) this.resumeGame(); else this.pauseGame(); }

  pauseGame() {
    if (this.state !== 'play' || this.paused) return;
    this.paused = true;
    this.physics.pause();
    if (this.timerEv) this.timerEv.paused = true;
    const tag = document.getElementById('pausetag'); if (tag) tag.textContent = this.level.name + ' · ' + this.level.sub;
    const el = document.getElementById('pause'); if (el) el.classList.remove('hidden');
  }

  resumeGame() {
    if (!this.paused) return;
    this.paused = false;
    this.physics.resume();
    if (this.timerEv) this.timerEv.paused = false;
    const el = document.getElementById('pause'); if (el) el.classList.add('hidden');
  }

  tickTime() {
    if (this.state !== 'play') return;
    if (this.noTimer) return;   // Mondo 0: nessun conto alla rovescia
    this.timeLeft--; this.updateHUD();
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.loseLife(); }
  }

  // ===== Mini-boss MegaGloss =====
  startBoss() {
    if (this.bossStarted || this.state !== 'play') return;
    this.bossStarted = true; this.bossActive = true;
    const a = this.arena, bc = this.level.boss;
    const tex = this.textures.exists('bossmain') ? 'bossmain' : 'megagloss_ph';
    const b = this.boss = this.physics.add.sprite(a.spawnX, this.H - 150, tex);
    if (tex === 'bossmain') b.setScale(bc.scaleH / b.height);    // più basso → più facile salirgli sopra
    b.setCollideWorldBounds(true);
    const bw = b.width * 0.72, bh = b.height * 0.84;
    b.body.setSize(bw, bh); b.body.setOffset((b.width - bw) / 2, b.height - bh);
    b.hp = bc.hp; b.maxHp = bc.hp; b.dir = -1;
    b.nextLunge = this.time.now + 1800; b.lungeUntil = 0; b._shotN = 0;
    this.physics.add.collider(b, this.platforms);   // sta sul terreno (NON sui blocchi sospesi: si incastrava)
    this.physics.add.collider(b, this.gate);
    this.bossShots = this.physics.add.group();
    this.physics.add.overlap(this.player, b, this.handleBossTouch, null, this);
    this.physics.add.overlap(this.player, this.bossShots, this.hitByShot, null, this);
    if (this.heroShots) this.physics.add.overlap(this.heroShots, b, (s) => { this.damageBoss(); if (s && s.active) s.destroy(); }, null, this);   // colpi di Memento sul boss
    b._pat = 0;
    b.phase = (bc.type === 'conglomerate') ? 1 : 0;   // boss finale: sistema a fasi
    this.bossPuddles = [];   // pozze d'acido (ToxiLab/Conglomerate) che restringono lo spazio sicuro
    // pattern d'attacco per tipo di boss
    const PAT = { viralcorp: { fn: this.fireBossViral, delay: 2100 }, toxilab: { fn: this.fireBossToxi, delay: 1900 },
      unibeauty: { fn: this.fireBossUni, delay: 1600 }, conglomerate: { fn: this.fireBossConglomerate, delay: 1500 } };
    const sel = PAT[bc.type] || { fn: this.fireBossShot, delay: 2300 };
    this.bossShotEv = this.time.addEvent({ delay: sel.delay, loop: true, callback: sel.fn, callbackScope: this });
    this.buildBossBar();
    this.cameras.main.flash(220, 120, 30, 30);
    this.popText(a.spawnX, this.H - 170, bc.label + '!');
    AUDIO.playMusic(this.level.music.boss);   // appare il boss → musica del boss
    // The Conglomerate: prima cutscene "assorbe le maschere", poi parte (attacchi in pausa fino a fine intro)
    if (bc.type === 'conglomerate') {
      this.bossShotEv.paused = true;
      this.maskAbsorbIntro(() => { if (this.bossShotEv) this.bossShotEv.paused = false; });
    }
  }

  updateBoss() {
    const b = this.boss, a = this.arena, p = this.player;
    if (!b || !b.body) return;
    // The Conglomerate: monolite senza volto → resta al centro, leggero bob; il nucleo lo segue
    if (this.level.boss.type === 'conglomerate') {
      const cx = (a.minX + a.maxX) / 2;
      b.setVelocityX(Phaser.Math.Clamp((cx - b.x) * 4, -120, 120));
      if (b.core) b.core.setPosition(b.x, b.body.center.y);
      return;
    }
    // pattuglia tranquilla avanti/indietro nell'arena (1° livello: difficoltà contenuta)
    if (b.x <= a.minX) b.dir = 1; else if (b.x >= a.maxX) b.dir = -1;
    if (b.x < a.minX) b.x = a.minX; else if (b.x > a.maxX) b.x = a.maxX;
    b.setVelocityX(90 * b.dir);
    b.setFlipX(p.x > b.x);   // si gira verso il player (lo sprite "guarda a sinistra" di default)
  }

  fireBossShot() {
    if (!this.bossActive || this.bossDefeated || this.paused || this.state !== 'play') return;
    const b = this.boss, p = this.player;
    if (!b || !b.body) return;
    const dir = p.x < b.x ? -1 : 1;
    // un solo colpo, lento, ad ALTEZZA GIOCATORE (1° livello: facile da schivare saltando)
    const shot = this.bossShots.create(b.x + dir * 40, p.body.center.y, 'glossshot');
    shot.body.allowGravity = false;
    shot.setDisplaySize(24, 22).setFlipX(dir > 0);   // l'immagine punta a sinistra
    shot.setVelocityX(170 * dir);
    shot.body.setSize(shot.width * 0.6, shot.height * 0.6);
    this.time.delayedCall(3500, () => { if (shot && shot.active) shot.destroy(); });
    AUDIO.sfx('boss_shot');
  }

  hitByShot(p, shot) {
    shot.destroy();
    if (p.invuln) return;
    AUDIO.sfx('hit_damage');
    if (p.big) this.shrink(); else this.loseLife();          // ferisce come un nemico
  }

  // ViralCorp: attacchi a rotazione — raffica volantini / fascio neon / sciame spam
  fireBossViral() {
    if (!this.bossActive || this.bossDefeated || this.paused || this.state !== 'play') return;
    const b = this.boss, p = this.player;
    if (!b || !b.body) return;
    const dir = p.x < b.x ? -1 : 1;
    const pat = b._pat % 3; b._pat++;
    AUDIO.sfx(pat === 0 ? 'flyer_throw' : pat === 1 ? 'boss_zap' : 'spraybill');
    if (pat === 0) {
      // raffica di 3 volantini a ventaglio verso il player
      for (const vy of [-230, -140, -60]) {
        const s = this.bossShots.create(b.x + dir * 30, b.y - 10, 'flyerproj');
        s.body.allowGravity = true; s.setVelocity(dir * 150, vy); s.setAngularVelocity(dir * 320);
        s.body.setSize(s.width * 0.7, s.height * 0.7);
        this.time.delayedCall(4000, () => { if (s && s.active) s.destroy(); });
      }
    } else if (pat === 1) {
      // fascio neon: colpo veloce ad altezza player
      const s = this.bossShots.create(b.x + dir * 36, p.body.center.y, 'glossshot');
      s.body.allowGravity = false; s.setDisplaySize(30, 14).setFlipX(dir > 0).setTint(0x2bd6ff);
      s.setVelocityX(300 * dir); s.body.setSize(s.width * 0.7, s.height * 0.7);
      this.time.delayedCall(3000, () => { if (s && s.active) s.destroy(); });
    } else {
      // evoca uno sciame di 2 Etichetta-Spam che planano verso il player
      for (const off of [-30, 30]) {
        const e = this._E(b.x + dir * 30, b.y - 30 + off, b.x - 400, b.x + 400, 'spam');
        e.dir = dir; this.time.delayedCall(8000, () => { if (e && e.active && !e.dead) e.destroy(); });
      }
    }
  }

  // ToxiLab (Mondo 4-3, 6 colpi): più tecnico. Cicla 3 schemi —
  // schizzi d'acido che impuddellano il pavimento (restringono lo spazio sicuro),
  // evoca Gocce Corrosive, sbuffo di vapore (colpo veloce ad altezza player).
  fireBossToxi() {
    if (!this.bossActive || this.bossDefeated || this.paused || this.state !== 'play') return;
    const b = this.boss, p = this.player, a = this.arena;
    if (!b || !b.body) return;
    const dir = p.x < b.x ? -1 : 1;
    const pat = b._pat % 3; b._pat++;
    if (pat === 0) {
      // SCHIZZI D'ACIDO → 2 pozze (una sotto il player, una a caso nell'arena): lo spazio sicuro si restringe
      AUDIO.sfx('acid_splash');
      const xs = [Phaser.Math.Clamp(p.x, a.minX - 40, a.maxX + 40),
        Phaser.Math.Clamp(b.x + Phaser.Math.Between(-160, 160), a.minX - 40, a.maxX + 40)];
      for (const tx of xs) {
        // blob lanciato ad arco dal boss verso il punto di caduta (solo estetico)
        const blob = this.bossShots.create(b.x, b.y - 20, 'glossshot');
        blob.body.allowGravity = true; blob.setDisplaySize(18, 18).setTint(0x6cf24a);
        blob.setVelocity((tx - b.x) * 1.1, -240); blob.body.setSize(blob.width * 0.6, blob.height * 0.6);
        this.time.delayedCall(2500, () => { if (blob && blob.active) blob.destroy(); });
        this.spawnAcidPuddle(tx);
      }
    } else if (pat === 1) {
      // evoca 2 Gocce Corrosive che cadono e strisciano (non schiacciabili)
      AUDIO.sfx('goccia_drop');
      for (const off of [-40, 40]) {
        const g = this._E(b.x + off, b.y - 40, a.minX - 80, a.maxX + 80, 'spiny');
        g.setVelocityY(40);
        this.time.delayedCall(9000, () => { if (g && g.active && !g.dead) g.destroy(); });
      }
    } else {
      // SBUFFO DI VAPORE: colpo veloce ad altezza player
      AUDIO.sfx('vapor');
      const s = this.bossShots.create(b.x + dir * 36, p.body.center.y, 'glossshot');
      s.body.allowGravity = false; s.setDisplaySize(28, 16).setFlipX(dir > 0).setTint(0xaeffa0);
      s.setVelocityX(320 * dir); s.body.setSize(s.width * 0.7, s.height * 0.7);
      this.time.delayedCall(3000, () => { if (s && s.active) s.destroy(); });
    }
  }

  // Unibeauty (Mondo 5-3, 7 colpi): il più tosto. Più veloce, schemi SIMULTANEI, evoca minion
  // (i marchi-figli) e fa CROLLARE il pavimento (grafico rosso). Cicla 4 schemi.
  fireBossUni() {
    if (!this.bossActive || this.bossDefeated || this.paused || this.state !== 'play') return;
    const b = this.boss, p = this.player, a = this.arena;
    if (!b || !b.body) return;
    const dir = p.x < b.x ? -1 : 1;
    const pat = b._pat % 4; b._pat++;
    if (pat === 0 || pat === 3) {
      // RAFFICA di Bolletta Bill su 3 quote (la nostra Pallottola Bill)
      AUDIO.sfx('bolletta_fire');
      for (const dy of [-62, -8, 44]) {
        const e = this._E(b.x + dir * 30, b.body.center.y + dy, 0, this.W, 'bullet');
        e.setVelocityX(235 * dir); e.setFlipX(dir > 0);
        this.time.delayedCall(5000, () => { if (e && e.active) e.destroy(); });
      }
    }
    if (pat === 1) {
      // EVOCA minion: i nemici dei mondi precedenti tornano (marchi-figli)
      AUDIO.sfx('uni_summon');
      const kinds = this.textures.exists('spam') ? ['goomba', 'spam'] : ['goomba', 'goomba'];
      kinds.forEach((kd, i) => {
        const mx = a.minX + (a.maxX - a.minX) * (i ? 0.7 : 0.3);
        const e = this._E(mx, this.H - 150, a.minX - 60, a.maxX + 60, kd);
        this.time.delayedCall(12000, () => { if (e && e.active && !e.dead) e.destroy(); });
      });
    }
    if (pat === 2 || pat === 3) {
      // il PAVIMENTO diventa un grafico che CROLLA (zone rosse sul pavimento dell'arena)
      const xs = [Phaser.Math.Clamp(p.x, a.minX - 40, a.maxX + 40),
        Phaser.Math.Clamp(b.x + Phaser.Math.Between(-150, 150), a.minX - 40, a.maxX + 40)];
      for (const tx of xs) this.spawnAcidPuddle(tx, 'crash');
    }
  }

  // ===== Boss finale: THE CONGLOMERATE (Mondo 6-3, 3 FASI) =====
  // Intro: assorbe le 5 "maschere" dei marchi sconfitti (rende visibile "li possiede tutti").
  maskAbsorbIntro(cb) {
    const b = this.boss; if (!b) { cb && cb(); return; }
    this.bossInvuln = true;
    const cx = b.x, cy = b.body.center.y;
    const cols = [0xE14B3A, 0xF2994A, 0xD96BA0, 0x6cf24a, 0xF2C53D];   // MegaGloss/BoxKing/ViralCorp/ToxiLab/Unibeauty
    AUDIO.sfx('mask_absorb');
    this.popText(b.x, this.H - 188, 'Li possiede tutti…');
    cols.forEach((c, i) => {
      const ang = (i / cols.length) * Math.PI * 2;
      const m = this.add.circle(cx + Math.cos(ang) * 190, cy + Math.sin(ang) * 120, 13, c)
        .setStrokeStyle(2, 0x16121A).setDepth(8).setAlpha(0);
      this.tweens.add({ targets: m, alpha: 1, duration: 200, delay: i * 110 });
      this.tweens.add({ targets: m, x: cx, y: cy, scale: 0.3, alpha: 0, delay: 650 + i * 110, duration: 560, ease: 'Back.easeIn', onComplete: () => m.destroy() });
    });
    // fine intro pilotata da un TIMER (affidabile): sblocca il boss anche se i tween non concludono
    this.time.delayedCall(1950, () => { this.cameras.main.flash(280, 120, 150, 210); this.bossInvuln = false; cb && cb(); });
  }

  // Cambio fase: più veloce, l'arena si attiva (fase 2+), il nucleo si espone (fase 3).
  enterBossPhase(n) {
    const b = this.boss; if (!b) return; b.phase = n;
    this.popText(b.x, this.H - 188, n === 2 ? 'FASE 2 — IL SISTEMA' : 'FASE 3 — IL COLLASSO');
    this.cameras.main.flash(300, 140, 60, 200); this.cameras.main.shake(220, 0.008);
    AUDIO.sfx('phase_shift');
    if (this.bossShotEv) this.bossShotEv.remove();
    this.bossShotEv = this.time.addEvent({ delay: n === 2 ? 1150 : 850, loop: true, callback: this.fireBossConglomerate, callbackScope: this });
    // FASE 2+: l'arena si attiva — pavimento-grafico che crolla a intervalli
    if (n >= 2 && !this.bossArenaEv) {
      this.bossArenaEv = this.time.addEvent({
        delay: 1700, loop: true, callback: () => {
          if (!this.bossActive || this.bossDefeated || this.state !== 'play') return;
          const a = this.arena; this.spawnAcidPuddle(Phaser.Math.Between(a.minX - 30, a.maxX + 30), 'crash');
        }, callbackScope: this,
      });
    }
    // FASE 3: il NUCLEO si espone (lampeggia) — il colpo decisivo
    if (n === 3 && !b.core) {
      b.core = this.add.circle(b.x, b.body.center.y, 16, 0x9fe8ff, 0.9).setStrokeStyle(3, 0xffffff).setDepth(7);
      this.tweens.add({ targets: b.core, scale: 1.4, alpha: 0.5, yoyo: true, repeat: -1, duration: 420 });
      this.popText(b.x, this.H - 212, 'NUCLEO ESPOSTO!');
    }
  }

  // Attacchi-primitiva (ricombinazione dei 5 marchi)
  _atkBolletta(dir) {
    AUDIO.sfx('bolletta_fire');
    for (const dy of [-62, -8, 44]) {
      const e = this._E(this.boss.x + dir * 30, this.boss.body.center.y + dy, 0, this.W, 'bullet');
      e.setVelocityX(235 * dir); e.setFlipX(dir > 0);
      this.time.delayedCall(5000, () => { if (e && e.active) e.destroy(); });
    }
  }
  _atkVolantini(dir) {
    AUDIO.sfx('flyer_throw');
    for (const vy of [-240, -150, -70]) {
      const s = this.bossShots.create(this.boss.x + dir * 30, this.boss.y - 10, 'flyerproj');
      s.body.allowGravity = true; s.setVelocity(dir * 150, vy); s.setAngularVelocity(dir * 320);
      s.body.setSize(s.width * 0.7, s.height * 0.7);
      this.time.delayedCall(4000, () => { if (s && s.active) s.destroy(); });
    }
  }
  _atkAcid() {
    const a = this.arena;
    this.spawnAcidPuddle(Phaser.Math.Clamp(this.player.x, a.minX - 30, a.maxX + 30), 'acid');
  }
  _atkScatoloni() {
    const a = this.arena;
    AUDIO.sfx('brick_break');
    [Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-60, 60), a.minX, a.maxX),
     Phaser.Math.Clamp(this.boss.x + Phaser.Math.Between(-120, 120), a.minX, a.maxX)]
      .forEach(x => this.spawnFaller(x, 40));
  }
  _atkMinion() {
    AUDIO.sfx('uni_summon');
    const a = this.arena;
    const kinds = this.textures.exists('spam') ? ['goomba', 'spam'] : ['goomba', 'goomba'];
    kinds.forEach((kd, i) => {
      const e = this._E(a.minX + (a.maxX - a.minX) * (i ? 0.7 : 0.3), this.H - 150, a.minX - 60, a.maxX + 60, kd);
      this.time.delayedCall(12000, () => { if (e && e.active && !e.dead) e.destroy(); });
    });
  }

  // Dispatcher d'attacco per fase: 1 = un marchio per volta; 2 = due insieme; 3 = schermo pieno.
  fireBossConglomerate() {
    if (!this.bossActive || this.bossDefeated || this.paused || this.state !== 'play') return;
    const b = this.boss, p = this.player; if (!b || !b.body) return;
    const dir = p.x < b.x ? -1 : 1, ph = b.phase || 1;
    if (ph === 1) {
      const seq = [() => this._atkBolletta(dir), () => this._atkVolantini(dir), () => this._atkAcid(), () => this._atkScatoloni(), () => this._atkMinion()];
      seq[b._pat % seq.length](); b._pat++;
    } else if (ph === 2) {
      const pairs = [[() => this._atkBolletta(dir), () => this._atkScatoloni()],
                     [() => this._atkVolantini(dir), () => this._atkAcid()],
                     [() => this._atkMinion(), () => this._atkBolletta(dir)]];
      const pr = pairs[b._pat % pairs.length]; pr[0](); pr[1](); b._pat++;
    } else {
      this._atkBolletta(dir); this._atkScatoloni(); this._atkAcid(); b._pat++;   // collasso: tre minacce
    }
  }

  // Pozza pericolosa sul pavimento: avviso lampeggiante (telegrafo) poi zona che ferisce ~4s.
  // kind 'acid' (ToxiLab, verde) | 'crash' (Unibeauty, rossa: il grafico che crolla).
  spawnAcidPuddle(x, kind = 'acid') {
    const floorTop = this.H - 36;
    const crash = kind === 'crash';
    const warnCol = crash ? 0xff8a8a : 0xaeffa0, bodyCol = crash ? 0xE14B3A : 0x6cf24a, topCol = crash ? 0xffb3b3 : 0xd6ffba;
    const warn = this.add.rectangle(x, floorTop, 64, 8, warnCol, 0.5).setOrigin(0.5, 1).setDepth(5);
    this.tweens.add({ targets: warn, alpha: 0.15, yoyo: true, repeat: 2, duration: 130, onComplete: () => warn.destroy() });
    this.time.delayedCall(560, () => {
      if (this.bossDefeated || this.state !== 'play') return;
      const r = this.add.rectangle(x, floorTop, 70, 14, bodyCol, 0.78).setOrigin(0.5, 1).setDepth(6).setStrokeStyle(2, topCol);
      const top = this.add.rectangle(x, floorTop - 12, 70, 5, topCol, 0.9).setOrigin(0.5, 0).setDepth(6);
      const pud = { x1: x - 35, x2: x + 35, rect: r, top, dead: false };
      this.bossPuddles.push(pud);
      AUDIO.sfx(crash ? 'chart_crash' : 'acid_sizzle');
      // evapora dopo ~3.8s
      this.time.delayedCall(3800, () => {
        pud.dead = true;
        this.tweens.add({ targets: [r, top], alpha: 0, duration: 300, onComplete: () => { r.destroy(); top.destroy(); } });
        const i = this.bossPuddles.indexOf(pud); if (i >= 0) this.bossPuddles.splice(i, 1);
      });
    });
  }

  handleBossTouch(p, b) {
    if (!this.bossActive || this.bossDefeated) return;
    // "sopra il boss" = piedi nella parte alta (~65%) del corpo del boss
    const feetAbove = p.body.bottom <= b.body.top + b.body.height * 0.65;
    // stomp: sei sopra e NON in salita → danneggia il boss, rimbalza e ti rende brevemente invulnerabile
    // (così rimbalzando/atterrando di fianco NON muori: fix "lo schiaccio ma muoio anch'io")
    if (feetAbove && p.body.velocity.y > -40) {
      p.setVelocityY(-360); this.damageBoss();
      p.invuln = true; this.time.delayedCall(550, () => { if (this.player) this.player.invuln = false; });
      return;
    }
    if (p.pounding || this.invincible) { this.damageBoss(); return; }   // pound / invincibile a contatto
    // sei sopra ma in salita (es. stai rimbalzando dopo lo stomp): NON farti male
    if (feetAbove) return;
    // contatto laterale: ferisce SOLO se sei a terra di fianco al boss (mentre salti non muori mai)
    if (!p.invuln && !this.invincible && p.body.blocked.down) { if (p.big) this.shrink(); else this.loseLife(); }
  }

  damageBoss() {
    const b = this.boss;
    if (!this.bossActive || this.bossDefeated || this.bossInvuln || !b) return;
    b.hp--; this.score += 200; this.updateHUD(); this.updateBossBar();
    if (b.hp <= 0) { this.defeatBoss(); return; }
    // The Conglomerate: passaggio di fase su soglie di hp (9→ fase1 / 6→ fase2 / 3→ fase3)
    if (this.level.boss.type === 'conglomerate') {
      const np = b.hp > 6 ? 1 : b.hp > 3 ? 2 : 3;
      if (np !== b.phase) this.enterBossPhase(np);
    }
    AUDIO.sfx('boss_hit');                                   // colpo a segno (boss ancora vivo)
    this.bossInvuln = true;                                   // ~0.8s di invulnerabilità → 1 HP per colpo
    this.cameras.main.shake(120, 0.006);
    this.tweens.add({ targets: b, alpha: 0.3, yoyo: true, repeat: 5, duration: 70, onComplete: () => { if (b.active) b.alpha = 1; } });
    this.time.delayedCall(800, () => { this.bossInvuln = false; });
  }

  defeatBoss() {
    const b = this.boss;
    this.bossDefeated = true; this.bossActive = false;
    if (this.bossShotEv) { this.bossShotEv.remove(); this.bossShotEv = null; }
    if (this.bossArenaEv) { this.bossArenaEv.remove(); this.bossArenaEv = null; }   // stop arena-crash (Conglomerate)
    if (this.bossShots) this.bossShots.clear(true, true);
    if (b && b.core) { this.tweens.killTweensOf(b.core); b.core.destroy(); b.core = null; }   // nucleo (fase 3)
    if (this.bossPuddles) { this.bossPuddles.forEach(pd => { pd.dead = true; if (pd.rect) pd.rect.destroy(); if (pd.top) pd.top.destroy(); }); this.bossPuddles = []; }
    if (this.level.boss.type === 'conglomerate') AUDIO.sfx('core_hit');   // colpo decisivo al nucleo
    this.score += 5000; this.updateHUD();
    AUDIO.sfx('boss_defeat'); AUDIO.playMusic(this.level.music.surface);   // sconfitto → torna la musica di superficie
    this.cameras.main.shake(360, 0.012);
    const W = this.scale.width;
    const txt = this.add.text(W / 2, 92, this.level.boss.label + ' sconfitto!', { fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '26px', color: '#F2C53D' }).setOrigin(0.5).setScrollFactor(0).setDepth(70);
    this.tweens.add({ targets: txt, y: 80, alpha: 0, delay: 1500, duration: 600, onComplete: () => txt.destroy() });
    if (b) {
      b.setVelocity(0, 0); if (b.body) b.body.checkCollision.none = true;
      this.tweens.add({ targets: b, x: '+=4', yoyo: true, repeat: 9, duration: 38 });       // trema
      this.tweens.add({ targets: b, scaleY: 0.1, alpha: 0, angle: -8, delay: 400, duration: 440, onComplete: () => b.destroy() }); // si sbriciola
    }
    if (this.bossBar) {
      const parts = this.bossBar.all;
      this.tweens.add({ targets: parts, alpha: 0, duration: 400, onComplete: () => parts.forEach(o => o.destroy()) });
      this.bossBar = null;
    }
    // apre la saracinesca: prima disabilita la collisione, poi la fa salire
    if (this.gate && this.gate.body) this.gate.body.enable = false;
    this.time.delayedCall(500, () => {
      this.gateParts.forEach(o => this.tweens.add({ targets: o, y: o.y - 380, alpha: 0, duration: 700, ease: 'Cubic.easeIn', onComplete: () => o.destroy() }));
    });
  }

  buildBossBar() {
    const W = this.scale.width, cx = W / 2, y = 74, bw = 220;
    const label = this.add.text(cx, 48, this.level.boss.label, { fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '12px', color: '#E14B3A' }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    const bg = this.add.rectangle(cx, y, bw + 6, 16, 0x16121A, 0.9).setOrigin(0.5).setScrollFactor(0).setDepth(60).setStrokeStyle(2, 0x59656f);
    const fill = this.add.rectangle(cx - bw / 2, y, bw, 11, 0xE14B3A).setOrigin(0, 0.5).setScrollFactor(0).setDepth(61);
    this.bossBar = { all: [label, bg, fill], fill, bw };
    this.updateBossBar();
  }

  updateBossBar() {
    if (!this.bossBar || !this.boss) return;
    this.bossBar.fill.width = this.bossBar.bw * Phaser.Math.Clamp(this.boss.hp / this.boss.maxHp, 0, 1);
  }

  winLevel() {
    if (this.won) return;
    if (this.officina) { this.officinaEnd(); return; }   // Mondo 0: chiusura calma, niente pennone/fuochi
    this.won = true; this.state = 'won';
    if (this.timerEv) this.timerEv.paused = true;
    AUDIO.sfx('level_clear');   // pennone agganciato / fine livello
    const endDigit = this.timeLeft % 10;
    const p = this.player; p.setVelocity(0, 0); p.body.allowGravity = false; p.invuln = true;
    const poleX = this.flagX, base = this.H - 30, top = this.H - 196;
    const frac = Phaser.Math.Clamp((base - p.y) / (base - top), 0, 1);
    let bonus = 100;
    for (const [th, v] of [[0.9, 5000], [0.66, 2000], [0.4, 800], [0.2, 400]]) { if (frac >= th) { bonus = v; break; } }
    p.x = poleX - 8; p.setFlipX(false);
    const groundY = (this.H - 36) - p.displayHeight / 2;   // centro col i piedi sul pavimento
    // 1. scivola lungo il pennone
    this.tweens.add({
      targets: p, y: groundY, duration: 650, onComplete: () => {
        this.score += bonus; this.popText(poleX, top + 40, '+' + bonus); this.updateHUD();
        // 2. salta giù dal pennone verso destra
        this.tweens.add({
          targets: p, x: poleX + 44, duration: 260, delay: 200, onComplete: () => {
            // 3a. livello finale del mondo (con salone): corsa → liberazione → tempo → fuochi
            if (this.salone) this.runToSalone(() => this.convertTime(() => this.fireworksSeq(endDigit, () => this.endWin())));
            // 3b. livello intermedio: conversione tempo → fuochi sul pennone → schermata "settore completato"
            else this.convertTime(() => this.fireworksSeq(endDigit, () => this.endWin()));
          }
        });
      }
    });
  }

  runToSalone(done) {
    const p = this.player; p.setFlipX(false);
    const targetX = this.saloneDoorX || 6620;
    const groundY = (this.H - 36) - p.displayHeight / 2;   // piedi sul pavimento (non sotto)
    // corsa con leggero "saltello" per dare vita al movimento
    this.tweens.add({
      targets: p, x: targetX, duration: 1200, ease: 'Linear',
      onUpdate: () => { p.y = groundY - Math.abs(Math.sin(this.time.now / 90)) * 5; },
      onComplete: () => {
        // YAC raggiunge il salone occupato e lo LIBERA (mostra la trasformazione)
        this.liberateSalone();
        // poi entra nel salone (svanisce nella porta)
        this.tweens.add({ targets: p, alpha: 0, scaleX: 0.7, scaleY: 0.7, duration: 280, delay: 380, onComplete: done });
      }
    });
  }

  liberateSalone() {
    if (this.saloneFreed) return; this.saloneFreed = true;
    AUDIO.sfx('salon_liberation');
    const S = this.salone, salX = this.saloneDoorX, salTop = this.H - 16;
    // lampo di liberazione sul salone
    const flash = this.add.rectangle(salX, salTop, 240, 230, 0xffffff, 0).setOrigin(0.5, 1).setDepth(6);
    this.tweens.add({ targets: flash, alpha: 0.85, yoyo: true, hold: 70, duration: 170, onComplete: () => flash.destroy() });
    this.cameras.main.flash(180, 242, 197, 61);
    // a metà lampo: salone OCCUPATO (grigio) → salone YAC (caldo), con insegna YAC che appare
    this.time.delayedCall(170, () => {
      this.tweens.add({ targets: S.corp, alpha: 0, duration: 320, onComplete: () => S.corp.destroy() });
      this.tweens.add({ targets: S.yac, alpha: 1, duration: 320 });
      this.tweens.add({ targets: [S.yacLogo, S.yacText], alpha: 1, duration: 360, delay: 160 });
      this.popText(salX, salTop - 224, 'SALONE LIBERATO!');
    });
  }

  convertTime(done) {
    let n = 0;
    const ev = this.time.addEvent({
      delay: 26, loop: true, callback: () => {
        if (this.timeLeft > 0) {
          this.timeLeft--; this.score += 50; this.updateHUD();
          if (n++ % 4 === 0) AUDIO.sfx('score_tick');   // ticchettio durante il conteggio (tutti i livelli)
        } else { ev.remove(); AUDIO.sfx('level_clear'); done(); }
      }
    });
  }

  // Fine livello. Battuto l'ultimo boss (finale) si prosegue NE L'OFFICINA (Mondo 0): il messaggio
  // finale arriva DOPO l'Officina, non qui. Gli altri livelli: normale schermata di vittoria.
  endWin() {
    if (this.level.finale) this.showWinScreen({ next: OFFICINA_ID, cta: 'Continua →' });
    else this.showWinScreen();
  }

  showWinScreen(opts = {}) {
    if (!opts.keepMusic) AUDIO.stopMusic();
    this.scene.pause();
    const L = this.level;
    const nextId = opts.next !== undefined ? opts.next : L.next;
    // SALVATAGGIO: il punteggio cumulativo è la base della prossima ripresa; aggiorna il record.
    state.runScore = this.score; setBest(this.score);
    // se c'è un mondo successivo → punto di "Continua"; altrimenti la partita è conclusa
    if (nextId && LEVELS[nextId]) saveRun({ world: nextId, char: state.selectedKey, runScore: this.score });
    else clearRun();
    const elTitle = document.getElementById('wintitle'); if (elTitle) elTitle.textContent = opts.title || L.win.title;
    const elTag = document.getElementById('wintag'); if (elTag) elTag.textContent = opts.tag || L.win.tag;
    document.getElementById('winscore').textContent = `Punti ${this.score} · Gocce ${this.gocce}`;
    // flusso multi-mondo: se c'è un livello successivo, mostra il pulsante "prossimo"
    if (window._gameShowWin) window._gameShowWin(nextId, opts.cta || L.win.cta);
    // pulsante "Classifica" solo sulla card del FINALE (non a ogni livello)
    if (opts.leaderboard) window._runResult = { score: this.score, world: state.worldId };
    if (window._gameShowBoardBtn) window._gameShowBoardBtn(!!opts.leaderboard);
    document.getElementById('win').classList.remove('hidden');
  }

  // ===================== SEQUENZA FINALE — la chiusura (Beat 7) =====================
  // Lavaggio caldo → rivelazione catena spezzata + FREEDOM (se tutte le lettere) →
  // messaggio che scorre → firma. Musica: finale_theme (ripresa calda in maggiore).
  runFinale() {
    this.state = 'finale';
    if (this.timerEv) this.timerEv.paused = true;
    AUDIO.stopMusic();
    AUDIO.playMusic('finale_theme');
    const W = this.scale.width, H = this.scale.height;
    // tutto ciò che disegno qui è scrollFactor(0): resta fisso sullo schermo
    const wash = this.add.rectangle(W / 2, H / 2, W, H, 0x1c0f06, 0).setScrollFactor(0).setDepth(200);
    const warm = this.add.rectangle(W / 2, H + 220, W, 440, 0xF2994A, 0).setScrollFactor(0).setDepth(201);  // bagliore caldo dal basso
    this.finaleLayer = [wash, warm];
    this.cameras.main.flash(900, 255, 240, 200);
    this.tweens.add({ targets: wash, fillAlpha: 1, duration: 1500, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: warm, fillAlpha: 0.5, duration: 2200, delay: 600 });
    this.time.delayedCall(1700, () => this.finaleReveal());
  }

  finaleReveal() {
    const W = this.scale.width, H = this.scale.height, cx = W / 2;
    const all = hasAllLetters();
    // --- catena orizzontale al centro che poi si spezza ---
    const links = [];
    const n = 9, gap = 30, y = H * 0.34;
    for (let i = 0; i < n; i++) {
      const lx = cx + (i - (n - 1) / 2) * gap;
      const lk = this.add.circle(lx, y, 11, 0, 0).setStrokeStyle(4, 0x8a8f96, 0.9).setScrollFactor(0).setDepth(203).setAlpha(0);
      links.push(lk); this.finaleLayer.push(lk);
      this.tweens.add({ targets: lk, alpha: 1, duration: 400, delay: 200 + i * 60 });
    }
    // dopo un attimo: la catena si SPEZZA a metà (Break the Mold)
    this.time.delayedCall(1500, () => {
      AUDIO.sfx('chain_break');
      this.cameras.main.shake(220, 0.006);
      this.cameras.main.flash(260, 255, 240, 180);
      links.forEach((lk, i) => {
        const left = i < n / 2, dir = left ? -1 : 1;
        this.tweens.add({ targets: lk, x: lk.x + dir * (40 + Math.abs(i - n / 2) * 22), y: lk.y + 60 + Math.random() * 40, angle: dir * 200, alpha: 0, duration: 900, ease: 'Quad.easeIn', onComplete: () => lk.destroy() });
      });
      this.time.delayedCall(700, () => this.finaleWord(all));
    });
  }

  finaleWord(all) {
    const W = this.scale.width, H = this.scale.height, cx = W / 2, y = H * 0.32;
    const wordObjs = [];
    let hold = 1600;
    if (all) {
      // FREEDOM si compone, lettera per lettera, d'oro
      const gap = 38;
      SECRET_WORD.forEach((chr, i) => {
        const lx = cx + (i - (SECRET_WORD.length - 1) / 2) * gap;
        const t = this.add.text(lx, y - 60, chr, {
          fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '38px',
          color: '#F2C53D', stroke: '#16121A', strokeThickness: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(204).setAlpha(0);
        this.finaleLayer.push(t); wordObjs.push(t);
        this.tweens.add({ targets: t, y, alpha: 1, duration: 420, delay: 150 + i * 130, ease: 'Back.easeOut' });
      });
      hold = 150 + SECRET_WORD.length * 130 + 1700;   // compose + tenuta
      this.time.delayedCall(150 + SECRET_WORD.length * 130 + 480, () => { AUDIO.sfx('letter_get'); this.cameras.main.flash(200, 242, 197, 61); });
    } else {
      const got = state.letters.length;
      const sub = this.add.text(cx, y, 'Lettere trovate: ' + got + '/' + SECRET_WORD.length + '\nTornano a chiamarti…', {
        fontFamily: 'DM Sans, sans-serif', fontStyle: '600', fontSize: '15px', color: '#F7E7C8',
        align: 'center', lineSpacing: 6,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(204).setAlpha(0);
      this.finaleLayer.push(sub); wordObjs.push(sub);
      this.tweens.add({ targets: sub, alpha: 0.9, duration: 700 });
    }
    // la parola si dissolve PRIMA che parta il messaggio (niente sovrapposizioni)
    this.time.delayedCall(hold, () => {
      this.tweens.add({ targets: wordObjs, alpha: 0, duration: 650, onComplete: () => wordObjs.forEach(o => o.destroy()) });
      this.time.delayedCall(750, () => this.finaleScroll());
    });
  }

  finaleScroll() {
    const W = this.scale.width, H = this.scale.height, cx = W / 2;
    const msg = [
      'Sei mondi per arrivare qui.',
      'Sei mondi per capire una cosa sola:',
      'il nemico non era un marchio. Erano le catene.',
      'La macchina che ci teneva tutti in fila,',
      'pettinati allo stesso modo.',
      '',
      'YAC nasce da chi sta dietro la sedia —',
      'non davanti a un foglio di calcolo.',
      'Da parrucchieri, per parrucchieri.',
      'Grinta, energia, e un’idea fresca',
      'di cosa può essere questo mestiere.',
      '',
      'Non seguiamo la moda. Spezziamo le catene.',
      'Non parliamo a una folla.',
      'Costruiamo una community.',
    ].join('\n');
    const body = this.add.text(cx, H + 30, msg, {
      fontFamily: 'DM Sans, sans-serif', fontStyle: '600', fontSize: '16px',
      color: '#FBEFD8', align: 'center', lineSpacing: 9,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(205);
    this.finaleLayer.push(body);
    const dist = H + body.height + 120;
    this.tweens.add({
      targets: body, y: body.y - dist, duration: 19000, ease: 'Linear',
      onComplete: () => { body.destroy(); this.finaleSignature(); },
    });
  }

  finaleSignature() {
    const W = this.scale.width, H = this.scale.height, cx = W / 2;
    const tag = this.add.text(cx, H * 0.42, 'YAC — Break the Mold.', {
      fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: '30px',
      color: '#F2C53D', stroke: '#16121A', strokeThickness: 5, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(205).setAlpha(0);
    const sign = this.add.text(cx, H * 0.42 + 44, 'Un gioco Memento. Una visione YAC.', {
      fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic 600',
      fontSize: '15px', color: '#F7E7C8', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(205).setAlpha(0);
    this.finaleLayer.push(tag, sign);
    this.cameras.main.flash(500, 242, 197, 61);
    this.tweens.add({ targets: tag, alpha: 1, duration: 1100, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: sign, alpha: 0.95, duration: 1100, delay: 900 });
    // vero finale del gioco (dopo boss → Officina → messaggio): schermata DOM, solo Menu.
    // (musica del finale che continua sotto l'overlay)
    this.time.delayedCall(3200, () => this.showWinScreen({
      keepMusic: true, next: null, leaderboard: true,
      title: 'GRAZIE PER AVER GIOCATO',
      tag: hasAllLetters()
        ? 'Hai trovato tutte le lettere: FREEDOM. Hai spezzato le catene. Premi Menu per tornare alla rivoluzione.'
        : 'The Conglomerate è caduto. Restano lettere nascoste nei sei mondi da scoprire… Premi Menu per ricominciare.',
    }));
  }

  fireworksSeq(digit, done) {
    // Salva di fuochi SEMPRE generosa a fine livello (più grande e vistosa). Il bonus tempo aggiunge punti.
    const cx = this.saloneDoorX || this.flagX || 6620;
    const n = 7;
    let i = 0;
    this.cameras.main.flash(220, 255, 240, 180);
    this.time.addEvent({
      delay: 300, repeat: n - 1, callback: () => {
        this.firework(cx + Phaser.Math.Between(-200, 200), 110 + Phaser.Math.Between(-50, 90));
        this.score += 500; this.updateHUD();
        i++;
        if (i >= n) this.time.delayedCall(950, done);
      }
    });
  }

  firework(x, y) {
    AUDIO.sfx('firework');
    const cols = [PAL.yellow, PAL.peach, PAL.rose, PAL.magenta, 0x6cf24a, 0x2bd6ff];
    const col = cols[Phaser.Math.Between(0, cols.length - 1)];
    const col2 = cols[Phaser.Math.Between(0, cols.length - 1)];
    const n = 28, r = Phaser.Math.Between(80, 120);
    // flash centrale grande
    const flash = this.add.circle(x, y, 16, 0xffffff, 0.95).setDepth(9);
    this.tweens.add({ targets: flash, alpha: 0, scale: 3.2, duration: 320, onComplete: () => flash.destroy() });
    // anello d'urto
    const ring = this.add.circle(x, y, 8, col, 0).setStrokeStyle(4, col, 0.9).setDepth(9);
    this.tweens.add({ targets: ring, radius: r * 1.25, alpha: 0, duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    // scintille radiali (a due colori, con scia)
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 + Phaser.Math.FloatBetween(-0.1, 0.1);
      const d = this.add.circle(x, y, k % 2 ? 5 : 3, k % 2 ? col : col2).setDepth(9);
      this.tweens.add({
        targets: d, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, alpha: 0, scale: 0.25,
        duration: 720, ease: 'Cubic.easeOut', onComplete: () => d.destroy()
      });
    }
  }

  over() {
    this.state = 'over';
    if (this.timerEv) this.timerEv.paused = true;
    setBest(this.score); clearRun();   // la partita finisce: salva il record, chiudi la run in corso
    window._runResult = { score: this.score, world: state.worldId };   // per l'invio in classifica
    const os = document.getElementById('overscore'); if (os) os.textContent = 'Punteggio: ' + this.score + ' pt';
    AUDIO.playMusic('game_over');   // one-shot (non in loop)
    this.scene.pause();
    document.getElementById('over').classList.remove('hidden');
  }

  enterPipe() {
    if (!this.onPipe || this.piping) return; this.piping = true;
    const t = this.onPipe.target, p = this.player;
    AUDIO.sfx('pipe_enter');
    this.cameras.main.fade(180, 10, 8, 16);
    this.tweens.add({
      targets: p, y: p.y + 40, alpha: 0, duration: 180, onComplete: () => {
        p.setPosition(t.x, t.y).setVelocity(0, 0); p.alpha = 1;
        AUDIO.playMusic(t.x > 7000 ? this.level.music.under : this.level.music.surface);  // sotterraneo / superficie
        this.cameras.main.fadeIn(180, 10, 8, 16);
        this.time.delayedCall(400, () => { this.piping = false; this.onPipe = null; });
      }
    });
  }

  special() {
    const p = this.player;
    if (!p.big) { this.popText(p.x, p.y - 40, 'Serve la Boccetta YAC!'); return; }
    if (!this.specialReady || this.slowActive || this.invincible || this.shootMode) return;
    const s = this.cfg.special;
    this.specialReady = false;
    let cd = 6000;
    if (s === 'shoot') {
      // MEMENTO: modalità FUOCO ~6s — spara una raffica di colpi che eliminano i nemici
      cd = 9000; this.shootMode = true; AUDIO.sfx('powerup_grow');
      this.popText(p.x, p.y - 42, 'FUOCO! 🔥');
      this.fireHeroShot();
      this.shootEv = this.time.addEvent({ delay: 260, loop: true, callback: this.fireHeroShot, callbackScope: this });
      this.time.delayedCall(6000, () => { this.shootMode = false; if (this.shootEv) { this.shootEv.remove(); this.shootEv = null; } this.updateHUD(); });
    } else if (s === 'invince') {
      // YURI: INVINCIBILE ~6.5s — immune ai danni, i nemici muoiono al contatto
      cd = 10000; this.invincible = true; p.invuln = true; AUDIO.sfx('star');
      this.popText(p.x, p.y - 42, 'INVINCIBILE! ⭐');
      const C = [0xF2C53D, 0x6cf24a, 0x2bd6ff, 0xD96BA0];
      this.invEv = this.time.addEvent({ delay: 80, loop: true, callback: () => { if (p.active) p.setTint(C[Math.floor(this.time.now / 80) % 4]); } });
      this.time.delayedCall(6500, () => { this.invincible = false; p.invuln = false; if (p.active) p.clearTint(); if (this.invEv) { this.invEv.remove(); this.invEv = null; } this.updateHUD(); });
    } else if (s === 'slowmo') {
      // ANDREA: ferma/rallenta il tempo ~5s
      cd = 9000; this.slowActive = true;
      this.tint = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x6b3b8a, 0.16).setOrigin(0).setScrollFactor(0).setDepth(40);
      this.cameras.main.flash(150, 120, 80, 160);
      this.time.delayedCall(5000, () => { this.slowActive = false; if (this.tint) this.tint.destroy(); });
    } else if (s === 'pound') {
      // CARMINE: schianto a terra
      cd = 3000; p.pounding = true;
      if (p.body.blocked.down) p.setVelocityY(-300); else p.setVelocityY(980);
      if (this.bossActive && this.boss && !this.bossInvuln && Phaser.Math.Distance.Between(p.x, p.y, this.boss.x, this.boss.y) < 180) this.damageBoss();
    }
    this.time.delayedCall(cd, () => { this.specialReady = true; this.updateHUD(); });
    this.updateHUD();
  }

  // Memento: proiettile eroe (elimina i nemici al contatto, danneggia il boss)
  fireHeroShot() {
    if (this.state !== 'play' || this.paused) return;
    const p = this.player, dir = p.flipX ? -1 : 1;
    const s = this.heroShots.create(p.x + dir * 18, p.body.center.y, 'herobolt');
    s.body.allowGravity = false; s.setVelocityX(540 * dir); s.setFlipX(dir < 0);
    s.body.setSize(s.width * 0.8, s.height * 0.8);
    AUDIO.sfx('shoot');
    this.time.delayedCall(1400, () => { if (s && s.active) s.destroy(); });
  }

  heroShotHit(s, e) {
    if (!e || e.dead || !s || !s.active) return;
    this.killEnemy(e); this.score += 100; this.popText(e.x, e.y - 10, '+100'); this.updateHUD();
    s.destroy();
  }

  bindInput() {
    this.cur = this.input.keyboard.createCursorKeys();
    this.k = this.input.keyboard.addKeys('W,A,S,D,SPACE,Z,ESC,P,R');
    this.t = { left: false, right: false, jump: false, special: false, down: false };
    this.jumpHeld = false; this.spHeld = false; this.downHeld = false;
    this.pauseHeld = false; this.rHeld = false;

    // Pulsanti DOM pausa/ripresa (onclick = sovrascrive, sicuro ai restart)
    const pb = document.getElementById('pausebtn'); if (pb) pb.onclick = () => this.togglePause();
    const rb = document.getElementById('btn-resume'); if (rb) rb.onclick = () => this.resumeGame();
    document.querySelectorAll('.tb').forEach(b => {
      const k = b.dataset.k;
      const on = e => { e.preventDefault(); this.t[k] = true; };
      const off = () => { this.t[k] = false; };
      // Pointer Events: unificano touch+mouse e sono affidabili su iOS Safari
      b.addEventListener('pointerdown', on, { passive: false });
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('pointerleave', off);
      // fallback per browser senza Pointer Events
      b.addEventListener('touchstart', on, { passive: false });
      b.addEventListener('touchend', off); b.addEventListener('touchcancel', off);
    });
  }

  // Legge il gamepad 0 (PS/Xbox/generico) e mappa ai comandi. null se nessun pad collegato.
  readPad() {
    const gp = this.input.gamepad;
    if (!gp || gp.total === 0) return null;
    const pad = gp.getPad(0);
    if (!pad || !pad.connected) return null;
    const lsx = pad.leftStick ? pad.leftStick.x : 0;
    const lsy = pad.leftStick ? pad.leftStick.y : 0;
    const btn = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
    return {
      left:    pad.left  || lsx < -0.4,
      right:   pad.right || lsx >  0.4,
      down:    pad.down  || lsy >  0.5,
      jump:    pad.A || btn(0),          // X PlayStation / A Xbox (tasto basso)
      special: pad.X || btn(2),          // Quadrato PS / X Xbox
      pause:   btn(9) || btn(8),         // Options/Start (o Share/Select)
    };
  }

  update() {
    const k = this.k;
    const pad = this.readPad();
    // Pausa (ESC/P/Options) e Ricomincia (R): valutati prima degli early-return
    const pKey = k.ESC.isDown || k.P.isDown || (pad && pad.pause);
    if (pKey && !this.pauseHeld) this.togglePause();
    this.pauseHeld = pKey;
    const rKey = k.R.isDown;
    if (rKey && !this.rHeld && this.state === 'play') {
      this.rHeld = true;
      window.setTimeout(() => { if (window._gameRestart) window._gameRestart(); }, 0);
      return;
    }
    this.rHeld = rKey;
    if (this.paused) return;

    if (this.state !== 'play') return;
    if (this.bgSurface) this.bgSurface.tilePositionX = this.cameras.main.scrollX * 0.5;  // parallasse sfondo
    if (this.bgUnder) this.bgUnder.setVisible(this.player.x > 6900);  // sfondo sotterraneo solo se sei laggiù (non sbordare nel salone)
    if (this.darkImg) {   // l'alone di luce segue il player (spazio schermo)
      const cam = this.cameras.main;
      this.darkImg.setPosition(this.player.x - cam.scrollX, this.player.y - cam.scrollY);
    }
    if (this.hazards) {   // vasche/melma tossica: da GRANDE torni piccolo (non muori), da piccolo muori
      const pb = this.player.body;
      for (const h of this.hazards) {
        if (pb.right > h.x1 && pb.left < h.x2 && pb.bottom > h.y1 && pb.top < h.y2) { this.hitHazard(); break; }
      }
    }
    if (this.officina) this.updateOfficina();   // Mondo 0: rivela la frase sul muro avanzando
    if (this.oozePits && this.oozePits.length) this.updateOoze();   // ooze che sale (Mondo 4-2)
    if (this.chartList && this.chartList.length) this.updateCharts();   // piattaforme-grafico (Mondo 5)
    if (this.lasers && this.lasers.length) this.updateLasers();         // griglie laser (Mondo 5)
    if (this.conveyors) for (const cv of this.conveyors) {   // scorrimento nastri + rulli che girano
      cv.belt.tilePositionX += cv.dir * cv.speed * 0.02;
      if (cv.spokes) for (const sk of cv.spokes) sk.rotation += cv.dir * cv.speed * 0.006;
    }
    const p = this.player, c = this.cfg, cu = this.cur, t = this.t;
    const left = cu.left.isDown || k.A.isDown || t.left || (pad && pad.left);
    const right = cu.right.isDown || k.D.isDown || t.right || (pad && pad.right);
    const jump = cu.up.isDown || k.W.isDown || k.SPACE.isDown || t.jump || (pad && pad.jump);
    const down = cu.down.isDown || k.S.isDown || t.down || (pad && pad.down);
    const sp = k.Z.isDown || t.special || (pad && pad.special);

    const hspeed = this.water ? c.speed * 0.72 : c.speed;   // sott'acqua ci si muove più lenti
    if (left) { p.setVelocityX(-hspeed); p.setFlipX(true); }
    else if (right) { p.setVelocityX(hspeed); p.setFlipX(false); }
    else p.setVelocityX(0);

    const ground = p.body.blocked.down;
    if (ground) { if (p.pounding && p._wasAir) this.poundLand(); p.jumpsLeft = c.jumps; p._wasAir = false; this.combo = 0; }
    else p._wasAir = true;

    // nastri trasportatori: se sei a terra sul tratto, aggiungi la spinta del nastro
    if (ground && this.conveyors) {
      for (const cv of this.conveyors) {
        if (p.x >= cv.x1 && p.x <= cv.x2 && Math.abs(p.body.bottom - cv.topY) < 10) {
          p.setVelocityX(p.body.velocity.x + cv.dir * cv.speed); break;
        }
      }
    }

    // casse fragili: parte il crollo se ci stai sopra
    if (ground && this.crumbles) {
      for (const b of this.crumbles) {
        if (b.active && !b.crumbling && Math.abs(p.x - b.x) < 22 && Math.abs(p.body.bottom - (b.y - 16)) < 8) {
          this.startCrumble(b); break;
        }
      }
    }

    // camminata: leggera oscillazione mentre si muove a terra (sembra che cammini)
    if ((left || right) && ground) p.setAngle(Math.sin(this.time.now / 60) * 3.5);
    else if (p.angle !== 0) p.setAngle(0);

    if (this.water) {
      // NUOTO: ogni pressione di salto = bracciata verso l'alto (ripetibile), discesa lenta
      if (jump && !this.jumpHeld) { p.setVelocityY(-210); AUDIO.sfx('jump'); }
      this.jumpHeld = jump;
      if (p.body.velocity.y > 215) p.setVelocityY(215);   // sprofondi piano
      // correnti di scarico: ti trascinano giù mentre le attraversi
      if (this.currents) for (const cur of this.currents) {
        if (p.x > cur.x1 && p.x < cur.x2 && p.y > cur.y1 && p.y < cur.y2) p.setVelocityY(p.body.velocity.y + cur.force);
      }
    } else {
      // JUMP BUFFER: memorizza la pressione (anche un attimo prima di atterrare) → salto reattivo, senza "input persi"
      if (jump && !this.jumpHeld) this._jumpBufT = this.time.now;
      this.jumpHeld = jump;
      const buffered = (this.time.now - (this._jumpBufT || -9999)) < 130;
      if (buffered && p.jumpsLeft > 0) { p.setVelocityY(-c.jump); p.jumpsLeft--; p.jumpCut = false; this._jumpBufT = -9999; AUDIO.sfx('jump'); }
      // taglio salto variabile più morbido (0.6) → altezze meno "a caso", controllo più prevedibile
      if (!jump && !p.jumpCut && p.body.velocity.y < -180) { p.setVelocityY(p.body.velocity.y * 0.6); p.jumpCut = true; }
    }

    if (sp && !this.spHeld) this.special(); this.spHeld = sp;
    if (down && !this.downHeld) this.enterPipe(); this.downHeld = down;

    if (this.bossActive && this.boss && this.boss.active) this.updateBoss();

    // pozze d'acido del ToxiLab: feriscono se sei a terra dentro la pozza (salta per evitarle)
    if (this.bossPuddles && this.bossPuddles.length && !p.invuln) {
      const pb = p.body;
      for (const pud of this.bossPuddles) {
        if (!pud.dead && pb.blocked.down && pb.right > pud.x1 && pb.left < pud.x2) { this.hurtPlayer(); break; }
      }
    }

    // piattaforme-muletto: invertono direzione ai limiti
    if (this.lifts) this.lifts.children.iterate(m => {
      if (!m || !m.body) return;
      if (m.y <= m.minY && m.body.velocity.y < 0) m.setVelocityY(m.spd);
      else if (m.y >= m.maxY && m.body.velocity.y > 0) m.setVelocityY(-m.spd);
    });

    // bracci di gru rotanti: ruotano e feriscono al contatto (tipo barra di fuoco)
    if (this.cranes) for (const cr of this.cranes) {
      cr.angle += cr.speed * (this.slowActive ? 0.012 : 0.04);
      cr.arm.setRotation(cr.angle);
      const ex = cr.x + Math.cos(cr.angle) * cr.len, ey = cr.y + Math.sin(cr.angle) * cr.len;
      cr.hook.setPosition(ex, ey).setRotation(cr.angle);
      if (!p.invuln) {
        for (let tt = 0.45; tt <= 1.001; tt += 0.18) {
          const px = cr.x + Math.cos(cr.angle) * cr.len * tt, py = cr.y + Math.sin(cr.angle) * cr.len * tt;
          if (Phaser.Math.Distance.Between(px, py, p.x, p.y) < 20) { this.hurtPlayer(); break; }
        }
      }
    }

    if (this.neonList) this.updateNeon();   // piattaforme-neon lampeggianti

    this.enemies.children.iterate(e => {
      if (!e || !e.body || e.dead) return;
      if (e.y > this.H + 140) { e.destroy(); return; }   // nemico caduto nel vuoto → rimuovi
      // i nemici volanti hanno checkCollision.none (passano tra le piattaforme): l'overlap di Phaser
      // verso il player viene soppresso → controllo il contatto a mano e chiamo touchEnemy
      if (e.kind === 'flyer' || e.kind === 'floater' || e.kind === 'chaser' || e.kind === 'spam' || e.kind === 'bullet' || e.kind === 'lakitu') {
        const pb = p.body, eb = e.body;
        if (pb.right > eb.left && pb.left < eb.right && pb.bottom > eb.top && pb.top < eb.bottom) this.touchEnemy(p, e);
        if (e.dead) return;
      }
      if (e.kind === 'lakitu') { this.updateLakitu(e); return; }                // Spruzzabot: insegue dall'alto e dropga
      if (e.kind === 'bullet') { e.setFlipX(e.body.velocity.x > 0); return; }   // Spray-Bill: vola dritto
      if (e.kind === 'promoter') { this.updatePromoter(e); return; }            // Hammer Bro
      if (e.kind === 'flyer' || e.kind === 'floater' || e.kind === 'spam') {   // volanti con oscillazione
        if (e.x <= e.minX) e.dir = 1; else if (e.x >= e.maxX) e.dir = -1;
        const fspd = this.slowActive ? 18 : 72;
        e.setVelocityX(fspd * e.dir); e.setFlipX(e.dir < 0);
        const amp = e.kind === 'floater' ? 88 : 44;   // i Flaconi ondeggiano più ampio
        e.setVelocityY(Math.cos(this.time.now / 360 + (e.phase || 0)) * amp * (this.slowActive ? 0.4 : 1));
        return;
      }
      if (e.kind === 'chaser') {   // Spugnotto: insegue lentamente il player
        const csp = this.slowActive ? 14 : 46;
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
        e.setVelocity(csp * dx / d, csp * dy / d); e.setFlipX(dx < 0);
        return;
      }
      if (e.shell) {
        if (e.shellMoving) {
          // torna indietro quando trova un ostacolo (la collisione azzera vx: riapplico la velocità)
          if (e.body.blocked.left) e.shellDir = 1;
          else if (e.body.blocked.right) e.shellDir = -1;
          e.setVelocityX(340 * e.shellDir);
          this.enemies.children.iterate(o => {
            if (o && o !== e && !o.dead && !o.shell && Math.abs(o.x - e.x) < 26 && Math.abs(o.y - e.y) < 28) {
              this.killEnemy(o); this.score += 100; this.updateHUD();
            }
          });
        }
        return;
      }
      const spd = this.slowActive ? 14 : 62;
      // inverte ai limiti del percorso E quando sbatte contro un ostacolo (niente nemici fermi)
      if (e.x <= e.minX || e.body.blocked.left) e.dir = 1;
      if (e.x >= e.maxX || e.body.blocked.right) e.dir = -1;
      e.setVelocityX(spd * e.dir); e.setFlipX(e.dir < 0);
    });

    this.onPipe = null;
    if (p.y > this.H + 90) this.loseLife();
  }
}
