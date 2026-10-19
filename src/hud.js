// HUD di Super Yac World — disegnato, non "righe di testo".
// Sinistra: medaglione dell'eroe (ritratto, anello colore-card, arco di ricarica del superpotere),
// nome, chip del superpotere, cuori. Centro: tempo con barra. Destra: punteggio a scorrimento, gocce.
// In basso a sinistra: tracker delle lettere FREEDOM. Tutto in coordinate logiche dentro un layer fisso.
import Phaser from 'phaser';
import { state, hasLetter, SECRET_WORD } from './state.js';

const FONT_H = 'Syne, sans-serif', FONT_B = 'DM Sans, sans-serif';
const INK = '#16121A', PAPER = '#F7F1E8', GOLD = '#F2C53D', DIM = '#8d8398';

export class Hud {
  constructor(scene) {
    this.s = scene;
    this.layer = scene.uiLayer(50);
    this.shownScore = scene.score || 0;
    this.lastLives = scene.lives;
    this.build();
    this.refresh();
  }

  // ritratto circolare dell'eroe: canvas con clip → una Image semplice (niente maschere)
  faceTexture() {
    const s = this.s, key = 'hud_face_' + (state.selectedKey || 'memento') + '_' + (s.heroKey || '');
    if (s.textures.exists(key)) return key;
    const src = s.textures.exists('card_' + state.selectedKey) ? 'card_' + state.selectedKey
      : s.textures.exists('card_' + (s.cfg && s.cfg.baseLook)) ? 'card_' + s.cfg.baseLook : 'card_memento';
    const img = s.textures.get(src).getSourceImage();
    const S = 96, t = s.textures.createCanvas(key, S, S), c = t.getContext();
    c.fillStyle = '#2c2038'; c.beginPath(); c.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2); c.clip();
    if (img && img.width) {
      const k = Math.max(S / img.width, S / img.height) * 1.08;   // "cover" con un filo di zoom sul volto
      const w = img.width * k, h = img.height * k;
      c.drawImage(img, (S - w) / 2, (S - h) / 2 - S * 0.04, w, h);
    }
    c.restore(); t.refresh();
    return key;
  }

  build() {
    const s = this.s, L = this.layer, T = (x, y, str, st) => s.T(x, y, str, st);
    const col = (s.cfg && s.cfg.card) || GOLD;
    this.col = Phaser.Display.Color.HexStringToColor(col).color;

    // ---- medaglione ----
    this.ringBg = s.add.circle(34, 32, 25, 0x16121A, 0.78).setStrokeStyle(2, 0xffffff, 0.14);
    this.face = s.add.image(34, 32, this.faceTexture()).setDisplaySize(40, 40);
    this.ring = s.add.graphics();          // anello colore-card + arco di ricarica
    this.bigGlow = s.add.circle(34, 32, 27, this.col, 0).setStrokeStyle(0);   // alone quando sei GRANDE
    L.add([this.bigGlow, this.ringBg, this.face, this.ring]);

    // ---- nome + chip superpotere ----
    this.name = T(66, 12, (s.cfg && s.cfg.name) || '', { fontFamily: FONT_H, fontStyle: '800', fontSize: '14px', color: PAPER, stroke: INK, strokeThickness: 3 }).setOrigin(0, 0);
    this.chipBg = s.add.graphics();
    this.chip = T(74, 36, '', { fontFamily: FONT_H, fontStyle: '800', fontSize: '9.5px', color: INK }).setOrigin(0, 0.5);
    L.add([this.name, this.chipBg, this.chip]);

    // ---- cuori ----
    this.hearts = [];
    for (let i = 0; i < 5; i++) { const h = s.add.image(16 + i * 15, 70, 'hud_heart').setDisplaySize(13, 13); L.add(h); this.hearts.push(h); }
    this.livesExtra = T(16 + 5 * 15 - 4, 70, '', { fontFamily: FONT_H, fontStyle: '800', fontSize: '11px', color: PAPER, stroke: INK, strokeThickness: 3 }).setOrigin(0, 0.5);
    L.add(this.livesExtra);

    // ---- tempo ----
    this.timeLbl = T(0, 8, 'TEMPO', { fontFamily: FONT_H, fontStyle: '800', fontSize: '8.5px', color: '#e9dfee', stroke: INK, strokeThickness: 2, letterSpacing: 2 }).setOrigin(0.5, 0);
    this.timeTxt = T(0, 18, '', { fontFamily: FONT_H, fontStyle: '800', fontSize: '21px', color: PAPER, stroke: INK, strokeThickness: 4 }).setOrigin(0.5, 0);
    this.timeBarBg = s.add.rectangle(0, 48, 124, 4, 0x16121A, 0.7).setOrigin(0.5, 0.5);
    this.timeBar = s.add.rectangle(0, 48, 120, 2, 0xF2C53D).setOrigin(0, 0.5);
    L.add([this.timeLbl, this.timeTxt, this.timeBarBg, this.timeBar]);

    // ---- punteggio + gocce ----
    this.scoreTxt = T(0, 8, '0', { fontFamily: FONT_H, fontStyle: '800', fontSize: '21px', color: PAPER, stroke: INK, strokeThickness: 4 }).setOrigin(1, 0);
    this.scoreLbl = T(0, 34, 'PUNTI', { fontFamily: FONT_H, fontStyle: '800', fontSize: '8.5px', color: '#e9dfee', stroke: INK, strokeThickness: 2, letterSpacing: 2 }).setOrigin(1, 0);
    this.coinIco = s.add.image(0, 56, 'coin').setDisplaySize(11, 14);
    this.coinTxt = T(0, 56, '0', { fontFamily: FONT_H, fontStyle: '800', fontSize: '13px', color: GOLD, stroke: INK, strokeThickness: 3 }).setOrigin(1, 0.5);
    L.add([this.scoreTxt, this.scoreLbl, this.coinIco, this.coinTxt]);

    // ---- lettere FREEDOM (chip in basso a sinistra) ----
    this.letters = [];
    SECRET_WORD.forEach((chr, i) => {
      const bg = s.add.rectangle(14 + i * 17, 0, 14, 16, 0x16121A, 0.55).setOrigin(0.5);
      const t = T(14 + i * 17, 0, chr, { fontFamily: FONT_H, fontStyle: '800', fontSize: '10px', color: GOLD }).setOrigin(0.5);
      L.add([bg, t]); this.letters.push({ bg, t });
    });

    this.layout();
  }

  layout() {
    const s = this.s, VW = s.VW, VH = s.VH;
    this.layer.setPosition(s.ux(0), s.uy(0));
    const cx = VW / 2;
    this.timeLbl.x = cx; this.timeTxt.x = cx; this.timeBarBg.x = cx; this.timeBar.x = cx - 60;
    // a destra lascio spazio ai tre tasti DOM (schermo intero / audio / pausa)
    const rx = VW - 96;
    this.scoreTxt.x = rx; this.scoreLbl.x = rx; this.coinTxt.x = rx; this.coinIco.x = rx - this.coinTxt.width - 12;
    const ly = VH - 14;
    this.letters.forEach((l) => { l.bg.y = ly; l.t.y = ly; });
    this.drawRing();
  }

  drawRing() {
    const s = this.s, g = this.ring, p = s.player;
    g.clear();
    const big = p && p.big;
    // anello pieno colore-card
    g.lineStyle(3, this.col, big ? 1 : 0.55); g.strokeCircle(34, 32, 23);
    // arco di ricarica del superpotere (quando non è pronto)
    if (big && !s.specialReady && s.specialCdEnd) {
      const frac = Phaser.Math.Clamp((s.specialCdEnd - s.time.now) / (s.specialCdDur || 1), 0, 1);
      g.lineStyle(4, 0xF2C53D, 0.95);
      g.beginPath(); g.arc(34, 32, 23, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac), false); g.strokePath();
    }
  }

  drawChip(text, bgCol, fgCol) {
    const g = this.chipBg; g.clear();
    this.chip.setText(text).setColor(fgCol);
    const w = this.chip.width + 14;
    g.fillStyle(bgCol, 1); g.fillRoundedRect(66, 36 - 8, w, 16, 8);
  }

  // stato → testi/colori (chiamato dalla scena quando cambia qualcosa)
  refresh() {
    const s = this.s, p = s.player;
    const big = p && p.big;
    const power = (s.cfg && s.cfg.power) || '';
    if (!big) this.drawChip('Z · ' + power.toUpperCase() + ' · serve Boccetta', 0x2c2038, DIM);
    else if (s.specialReady) this.drawChip('Z · ' + power.toUpperCase() + ' · PRONTA', 0xF2C53D, INK);
    else this.drawChip('Z · ' + power.toUpperCase() + ' · ricarica', 0x4a3850, '#d7ccda');
    this.bigGlow.setStrokeStyle(big ? 3 : 0, this.col, 0.35);
    // cuori
    const lives = Math.max(0, s.lives);
    this.hearts.forEach((h, i) => { h.setVisible(i < Math.min(5, lives)); });
    this.livesExtra.setText(lives > 5 ? '+' + (lives - 5) : '');
    if (lives < this.lastLives && this.hearts[lives]) { const h = this.hearts[lives]; h.setVisible(true).setAlpha(1); s.tweens.add({ targets: h, scale: 0, alpha: 0, duration: 380, ease: 'Back.easeIn', onComplete: () => { h.setVisible(false).setScale(13 / h.width).setAlpha(1); } }); }
    if (lives > this.lastLives && this.hearts[lives - 1]) { const h = this.hearts[lives - 1]; const sc = h.scaleX; h.setScale(sc * 2.2); s.tweens.add({ targets: h, scale: sc, duration: 420, ease: 'Elastic.easeOut' }); }
    this.lastLives = lives;
    // gocce
    this.coinTxt.setText(String(s.gocce));
    this.coinIco.x = this.coinTxt.x - this.coinTxt.width - 12;
    if (this._lastGocce !== undefined && s.gocce !== this._lastGocce) { this.coinIco.setScale(this.coinIco.scaleX * 1.5, this.coinIco.scaleY * 1.5); s.tweens.add({ targets: this.coinIco, displayWidth: 11, displayHeight: 14, duration: 220, ease: 'Quad.easeOut' }); }
    this._lastGocce = s.gocce;
    // tempo
    if (s.noTimer) { this.timeLbl.setVisible(false); this.timeTxt.setVisible(false); this.timeBarBg.setVisible(false); this.timeBar.setVisible(false); }
    else {
      const low = s.timeLeft <= 50;
      this.timeTxt.setText(String(s.timeLeft)).setColor(low ? '#ff6b8a' : PAPER);
      this.timeBar.width = 120 * Phaser.Math.Clamp(s.timeLeft / (s.timeLimit || 1), 0, 1);
      this.timeBar.fillColor = low ? 0xff6b8a : 0xF2C53D;
    }
    this.drawRing();
    this.updateLetters();
  }

  updateLetters() {
    SECRET_WORD.forEach((chr, i) => {
      const got = hasLetter(i), l = this.letters[i];
      l.t.setColor(got ? GOLD : '#5a5560').setAlpha(got ? 1 : 0.6);
      l.bg.setStrokeStyle(got ? 1 : 0, 0xF2C53D, 0.8);
    });
  }

  // ogni frame: punteggio che scorre verso il valore reale, arco di ricarica, pulsazione del tempo
  update() {
    const s = this.s;
    const target = s.score || 0;
    if (this.shownScore !== target) {
      const d = target - this.shownScore;
      this.shownScore = Math.abs(d) < 3 ? target : this.shownScore + Math.sign(d) * Math.max(1, Math.ceil(Math.abs(d) * 0.18));
      this.scoreTxt.setText(String(Math.round(this.shownScore)));
      if (!this._scoreBump) { this._scoreBump = true; this.scoreTxt.setScale(1.12); s.tweens.add({ targets: this.scoreTxt, scale: 1, duration: 160, onComplete: () => { this._scoreBump = false; } }); }
    }
    if (s.player && s.player.big && !s.specialReady) this.drawRing();
    if (!s.noTimer && s.timeLeft <= 50) this.timeTxt.setScale(1 + 0.06 * Math.sin(s.time.now / 120));
    else if (this.timeTxt.scaleX !== 1) this.timeTxt.setScale(1);
  }

  destroy() { try { this.layer.destroy(); } catch (e) {} }
}

// texture del cuore (una volta per gioco)
export function makeHudTextures(scene) {
  if (scene.textures.exists('hud_heart')) return;
  const t = scene.textures.createCanvas('hud_heart', 32, 32), c = t.getContext();
  const heart = (col, inset) => {
    c.fillStyle = col; c.beginPath();
    c.moveTo(16, 29 - inset * 1.4); c.bezierCurveTo(2 + inset, 18, 1 + inset, 6 + inset, 9, 4 + inset); c.bezierCurveTo(13, 3 + inset, 16, 6 + inset, 16, 8 + inset);
    c.bezierCurveTo(16, 6 + inset, 19, 3 + inset, 23, 4 + inset); c.bezierCurveTo(31 - inset, 6 + inset, 30 - inset, 18, 16, 29 - inset * 1.4); c.fill();
  };
  heart('#16121A', 0); heart('#E14B3A', 2.2);
  c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.ellipse(11, 10, 2.6, 1.8, -0.6, 0, Math.PI * 2); c.fill();
  t.refresh();
}
