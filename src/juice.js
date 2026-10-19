// "Succo" di gioco (game feel): particelle, polvere, squash & stretch, hit-stop, scosse, testi.
// Tutto riusabile e leggero: emettitori creati una volta e riusati con explode().
import Phaser from 'phaser';

export function makeFxTextures(scene) {
  if (scene.textures.exists('fx_spark')) return;
  const cv = (key, w, h, draw) => { const t = scene.textures.createCanvas(key, w, h); draw(t.getContext(), w, h); t.refresh(); };
  cv('fx_spark', 16, 16, (c) => { const g = c.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 16, 16); });
  cv('fx_puff', 32, 32, (c) => { const g = c.createRadialGradient(16, 16, 2, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); });
  cv('fx_shard', 10, 7, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 10, 7); });
  cv('fx_ring', 48, 48, (c) => { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(24, 24, 20, 0, Math.PI * 2); c.stroke(); });
  cv('fx_star', 20, 20, (c) => { c.fillStyle = '#fff'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 4 : 10; c.lineTo(10 + Math.cos(a) * r, 10 + Math.sin(a) * r); } c.closePath(); c.fill(); });
}

export class Juice {
  constructor(scene) {
    this.s = scene; this.perf = !!scene._perf;
    makeFxTextures(scene);
    const mk = (tex, cfg) => scene.add.particles(0, 0, tex, { emitting: false, ...cfg }).setDepth(9);
    // scintille colorate (nemici, monete, blocchi)
    this.sparks = mk('fx_spark', { speed: { min: 80, max: 260 }, angle: { min: 0, max: 360 }, lifespan: { min: 300, max: 620 }, scale: { start: 1.1, end: 0 }, gravityY: 500, blendMode: 'ADD' });
    // sbuffi di polvere (atterraggio, corsa, frenata)
    this.puffs = mk('fx_puff', { speed: { min: 20, max: 70 }, angle: { min: 200, max: 340 }, lifespan: { min: 280, max: 480 }, scale: { start: 0.5, end: 1.3 }, alpha: { start: 0.55, end: 0 }, gravityY: -40 });
    this.puffs.setDepth(3);
    // frammenti solidi (mattoni, casse)
    this.shards = mk('fx_shard', { speed: { min: 120, max: 300 }, angle: { min: 220, max: 320 }, lifespan: 900, scale: { start: 1, end: 0.6 }, rotate: { min: 0, max: 360 }, gravityY: 900, alpha: { start: 1, end: 0 } });
    // stelline (bonus, 1-UP, lettere)
    this.stars = mk('fx_star', { speed: { min: 60, max: 180 }, angle: { min: 0, max: 360 }, lifespan: 700, scale: { start: 0.9, end: 0 }, rotate: { min: 0, max: 180 }, gravityY: 200, blendMode: 'ADD' });
    this._stop = null;
  }

  // numero di particelle adattato alla modalità prestazioni
  n(k) { return this.perf ? Math.max(2, Math.round(k * 0.4)) : k; }

  // esplosione di scintille colorate
  burst(x, y, tint = 0xF2C53D, count = 14, speed = 1) {
    this.sparks.setParticleTint(tint);
    this.sparks.setParticleSpeed(80 * speed, 260 * speed);
    this.sparks.explode(this.n(count), x, y);
  }
  // stelline (premi)
  twinkle(x, y, tint = 0xF2C53D, count = 8) { this.stars.setParticleTint(tint); this.stars.explode(this.n(count), x, y); }
  // frammenti (mattone che si rompe)
  shatter(x, y, tint = 0x9aa7b2, count = 8) { this.shards.setParticleTint(tint); this.shards.explode(this.n(count), x, y); }
  // polvere ai piedi: dir = -1/1 spinge la polvere dietro al personaggio, 0 = simmetrica (atterraggio)
  dust(x, y, dir = 0, count = 4, tint = 0xeadfcf) {
    this.puffs.setParticleTint(tint);
    if (dir === 0) this.puffs.setEmitterAngle({ min: 200, max: 340 });
    else this.puffs.setEmitterAngle(dir > 0 ? { min: 150, max: 210 } : { min: -30, max: 30 });
    this.puffs.explode(this.n(count), x, y);
  }

  // HIT-STOP: congela la fisica per pochi millisecondi (il colpo "pesa"). Mai in pausa utente.
  hitStop(ms = 70) {
    const s = this.s;
    if (this.perf) ms = Math.min(ms, 50);
    if (s.paused || s.state !== 'play') return;
    if (this._stop) { this._stop.remove(false); this._stop = null; }
    s.physics.world.pause();
    this._stop = s.time.delayedCall(ms, () => {
      this._stop = null;
      if (!s.paused && (s.state === 'play' || s.state === 'dying')) s.physics.world.resume();
    });
  }

  // RALLENTATORE: fisica a velocità ridotta per un po' (colpo finale al boss, morte)
  slowMo(factor = 2.4, ms = 700) {
    const s = this.s, w = s.physics.world;
    w.timeScale = factor;
    s.time.delayedCall(ms, () => { w.timeScale = 1; });
  }

  shake(ms = 100, intensity = 0.005) { this.s.cameras.main.shake(ms, this.perf ? intensity * 0.6 : intensity); }

  // lampo bianco sullo sprite (colpo subito/inflitto)
  flash(obj, ms = 90, tint = 0xffffff) {
    if (!obj || !obj.active) return;
    obj.setTintFill(tint);
    this.s.time.delayedCall(ms, () => { if (obj.active) obj.clearTint(); });
  }

  // squash & stretch RELATIVO alla scala base dell'oggetto (obj._bs) con ritorno elastico
  squash(obj, sx, sy, ms = 140, ease = 'Quad.easeOut') {
    if (!obj || !obj.active) return;
    if (obj._sqTween) { obj._sqTween.stop(); obj._sqTween = null; }
    if (obj._sq) {
      // oggetto animato per-frame (il player): il tween agisce sul moltiplicatore, non sulla scala
      obj._sq.x = sx; obj._sq.y = sy;
      obj._sqTween = this.s.tweens.add({ targets: obj._sq, x: 1, y: 1, duration: ms, ease, onComplete: () => { obj._sqTween = null; } });
      return;
    }
    const bs = obj._bs || obj.scaleX;
    obj.setScale(bs * sx, bs * sy);
    obj._sqTween = this.s.tweens.add({ targets: obj, scaleX: bs, scaleY: bs, duration: ms, ease, onComplete: () => { obj._sqTween = null; } });
  }

  // zoom "pugno" della camera (torna alla densità base R)
  punchZoom(amount = 1.06, ms = 160) {
    const cam = this.s.cameras.main, base = this.s.R || 1;
    if (this._zoomTween) { this._zoomTween.stop(); this._zoomTween = null; }
    cam.setZoom(base);
    this._zoomTween = this.s.tweens.add({ targets: cam, zoom: base * amount, duration: ms * 0.4, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { cam.setZoom(base); this._zoomTween = null; } });
  }

  // testo che sale e svanisce, dimensione in base all'importanza (combo)
  pop(x, y, text, { size = 18, color = '#FFFFFF', stroke = '#16121A' } = {}) {
    if (this.perf) return;
    const o = this.s.T(x, y, text, { fontFamily: 'Syne, sans-serif', fontStyle: '800', fontSize: size + 'px', color, stroke, strokeThickness: Math.max(4, Math.round(size / 3.6)), align: 'center' })
      .setOrigin(0.5).setDepth(60).setScale(0.6);
    this.s.tweens.add({ targets: o, scale: 1, duration: 120, ease: 'Back.easeOut' });
    this.s.tweens.add({ targets: o, y: y - 34, alpha: 0, duration: 720, delay: 120, ease: 'Quad.easeOut', onComplete: () => o.destroy() });
    return o;
  }
}
