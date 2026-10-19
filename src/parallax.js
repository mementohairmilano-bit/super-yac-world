// Fondale VIVO a più piani (parallasse) per ogni mondo di Super Yac World.
// Tutto procedurale sopra l'arte esistente: nessun asset nuovo.
//  - piano lontano: l'immagine del mondo, resa SENZA CUCITURE specchiandola (tile = originale + copia
//    riflessa), che scorre lentamente con la camera;
//  - piano medio: sagome disegnate per tema (ciminiere e ingranaggi, scaffali, insegne, serbatoi,
//    grattacieli, torre…) che scorrono a velocità intermedia;
//  - luce di scena: fasci morbidi additivi sui livelli luminosi;
//  - aria: particelle d'ambiente per tema (polvere, bolle, pioggia neon, spore, coriandoli, braci).
// Gli oggetti vivono in coordinate logiche (VW×VH) dentro un layer a schermo fisso (vedi uiLayer).
import Phaser from 'phaser';

// tema visivo del livello, dedotto dal fondale (così non si tocca levels.js)
export function themeFor(level) {
  const f = ((level.bg && level.bg.surface) || '').split('/').pop();
  if (level.officina) return 'officina';
  if (level.water) return 'water';
  if (/sfondomondo1|sotterraneo/.test(f)) return 'factory';
  if (/sfondomondo2|bg_m2/.test(f)) return 'warehouse';
  if (/bg_m3/.test(f)) return 'neon';
  if (/bg_m4/.test(f)) return 'lab';
  if (/bg_m5/.test(f)) return 'finance';
  if (/bg_m6/.test(f)) return 'tower';
  return 'factory';
}

// ---- piano medio: ARREDI DEL SOFFITTO per tema (travi, lampade, catene, tubi, cavi, insegne),
// disegnati su una strip ripetibile e appesi al bordo alto: danno profondità senza coprire il gioco. ----
const SIL_W = 1600, SIL_H = 210;
function drawSilhouette(ctx, theme, W, H) {
  const rnd = mulberry(theme.length * 977 + 13);
  const R = (a, b) => a + rnd() * (b - a);
  ctx.clearRect(0, 0, W, H);
  const wrap = (fn) => { fn(0); fn(-W); fn(W); };   // il disegno si ripete senza cuciture
  const base = { factory: '#3a4652', warehouse: '#4b3b2e', neon: '#120c22', lab: '#2b3b36', finance: '#2b3442', tower: '#0d1018', water: '#0f2a33' }[theme] || '#334';
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c || base; ctx.fillRect(x, y, w, h); };
  const lamp = (x, y, col, glow) => {   // lampada appesa: filo + cono + alone
    rect(x - 1, 0, 2, y - 14); ctx.fillStyle = base; ctx.beginPath(); ctx.moveTo(x - 22, y); ctx.lineTo(x + 22, y); ctx.lineTo(x + 8, y - 14); ctx.lineTo(x - 8, y - 14); ctx.closePath(); ctx.fill();
    const g = ctx.createRadialGradient(x, y + 4, 2, x, y + 4, 60); g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - 60, y - 10, 120, 70);
    ctx.fillStyle = col; ctx.fillRect(x - 14, y - 2, 28, 3);
  };
  const chain = (x, len) => { for (let y = 0; y < len; y += 9) { ctx.strokeStyle = base; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 4, 2.5, 4.5, 0, 0, Math.PI * 2); ctx.stroke(); } };
  if (theme === 'factory') {
    wrap((o) => {
      rect(o, 0, W, 10); rect(o, 10, W, 3, shade(base, 14));                  // trave di colmo
      for (let x = 60; x < W; x += 400) {
        rect(x + o, 13, 14, 48); rect(x + o - 60, 58, 134, 8);              // pendino + traversa
        chain(x + o + 190, 70); rect(x + o + 182, 70, 16, 14, shade(base, 8));   // catena con gancio
        lamp(x + o + 300, 64, '#F2C53D', 'rgba(242,197,61,0.35)');
      }
      for (let i = 0; i < 4; i++) gear(ctx, o + 240 + i * 420, 8 + (i % 2) * 18, 34 + (i % 3) * 8, 10 + i % 3, base);   // ingranaggi che spuntano dall'alto
      for (let x = 20; x < W; x += 800) { rect(x + o, 24, 260, 9); rect(x + o + 251, 24, 9, 60); rect(x + o + 251, 84, 90, 9); }   // tubi con gomito
    });
  } else if (theme === 'warehouse') {
    wrap((o) => {
      rect(o, 0, W, 8); rect(o, 8, W, 4, shade(base, 12));   // rotaia della gru
      for (let x = 120; x < W; x += 560) {
        rect(x + o - 30, 12, 60, 14); chain(x + o, 90); rect(x + o - 22, 100, 44, 40, shade(base, 10)); rect(x + o - 22, 118, 44, 3, shade(base, -10));   // carrello + catena + cassa appesa
        lamp(x + o + 280, 54, '#F2C53D', 'rgba(242,197,61,0.28)');
      }
    });
  } else if (theme === 'neon') {
    const cols = ['#ff4fd8', '#2bd6ff', '#ffd23b', '#9bff57', '#ff7a3b'];
    wrap((o) => {
      ctx.strokeStyle = '#06040f'; ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 400) { ctx.beginPath(); ctx.moveTo(x + o, 6); ctx.quadraticCurveTo(x + o + 200, 70, x + o + 400, 6); ctx.stroke(); }   // cavi
      for (let x = 90; x < W; x += 230) {
        const nc = cols[Math.floor(rnd() * cols.length)], w = 60 + Math.floor(rnd() * 50), y = 38 + Math.floor(rnd() * 40);
        rect(x + o - 1, 0, 2, y);
        rect(x + o - w / 2, y, w, 28, '#1a1430');
        ctx.strokeStyle = nc; ctx.lineWidth = 2.5; ctx.shadowColor = nc; ctx.shadowBlur = 16; ctx.strokeRect(x + o - w / 2 + 4, y + 4, w - 8, 20); ctx.shadowBlur = 0;
        ctx.fillStyle = nc + '99'; ctx.fillRect(x + o - w / 2 + 12, y + 12, w - 24, 4);
      }
    });
  } else if (theme === 'lab') {
    wrap((o) => {
      for (let x = 0; x < W; x += 540) {
        rect(x + o, 14, 300, 12); rect(x + o + 290, 14, 12, 70); rect(x + o + 290, 84, 140, 12);   // tubature
        ctx.fillStyle = shade(base, 14); ctx.beginPath(); ctx.arc(x + o + 150, 20, 12, 0, Math.PI * 2); ctx.fill();   // valvola
        ctx.fillStyle = '#6cf24a88'; ctx.beginPath(); ctx.arc(x + o + 296, 60, 5, 0, Math.PI * 2); ctx.fill();   // spia verde
        chain(x + o + 420, 60); rect(x + o + 406, 60, 28, 36, shade(base, 10)); rect(x + o + 410, 92, 20, 6, '#6cf24a66');   // becher appeso
        lamp(x + o + 500, 52, '#cfffd8', 'rgba(174,255,160,0.22)');
      }
    });
  } else if (theme === 'finance') {
    wrap((o) => {
      rect(o, 0, W, 6);
      for (let x = 80; x < W; x += 380) {
        rect(x + o - 1, 6, 2, 30); rect(x + o + 119, 6, 2, 30);
        rect(x + o - 10, 36, 140, 60, '#1b2129'); rect(x + o - 6, 40, 132, 52, '#232b36');   // schermo-ticker
        for (let k = 0; k < 10; k++) { const h = 6 + Math.floor(rnd() * 34); rect(x + o + k * 13, 90 - h, 8, h, rnd() > 0.45 ? '#3BB36A' : '#E14B3A'); }
        lamp(x + o + 240, 44, '#dfe8ee', 'rgba(223,232,238,0.18)');
      }
    });
  } else if (theme === 'tower') {
    wrap((o) => {
      rect(o, 0, W, 14); rect(o, 14, W, 4, shade(base, 10));
      for (let x = 100; x < W; x += 420) {
        rect(x + o - 6, 18, 12, 60); rect(x + o - 70, 78, 140, 10);   // pendino massiccio
        // faro freddo che punta in basso
        const g = ctx.createLinearGradient(0, 88, 0, 210); g.addColorStop(0, 'rgba(79,167,255,0.28)'); g.addColorStop(1, 'rgba(79,167,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + o + 50, 88); ctx.lineTo(x + o + 70, 88); ctx.lineTo(x + o + 130, 210); ctx.lineTo(x + o - 10, 210); ctx.closePath(); ctx.fill();
        rect(x + o + 46, 82, 28, 8, '#4fa7ff');
      }
      ctx.strokeStyle = shade(base, 14); ctx.lineWidth = 3;
      for (let x = 0; x < W; x += 420) { ctx.beginPath(); ctx.moveTo(x + o, 20); ctx.quadraticCurveTo(x + o + 210, 120, x + o + 420, 20); ctx.stroke(); }
    });
  } else if (theme === 'water') {
    wrap((o) => {
      for (let x = 120; x < W; x += 460) { chain(x + o, 120 + (x % 3) * 20); rect(x + o - 14, 120 + (x % 3) * 20, 28, 20, shade(base, 10)); }   // catene con pesi
      for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(205,243,255,0.10)'; ctx.beginPath(); ctx.ellipse(o + 130 + i * 260, 40 + (i % 2) * 50, 70, 14, 0.3, 0, Math.PI * 2); ctx.fill(); }   // riflessi
    });
  }
}
function gear(ctx, cx, cy, r, teeth, color) {
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 0.8;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v));
  const r = c(((n >> 16) & 255) + amt), g = c(((n >> 8) & 255) + amt), b = c((n & 255) + amt);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// particelle d'ambiente per tema
const AIR = {
  factory:   { tex: 'fx_mote', tint: 0xffe9b0, alpha: [0.0, 0.5], scale: [0.5, 1.1], speedY: [-14, -4], speedX: [-6, 6], life: 6000, freq: 240 },
  warehouse: { tex: 'fx_mote', tint: 0xf5e6c8, alpha: [0.0, 0.45], scale: [0.5, 1.0], speedY: [-8, 4], speedX: [-10, 10], life: 7000, freq: 260 },
  neon:      { tex: 'fx_streak', tint: 0x9ad8ff, alpha: [0.0, 0.5], scale: [0.6, 1.0], speedY: [260, 360], speedX: [-30, -10], life: 1400, freq: 70 },
  lab:       { tex: 'fx_mote', tint: 0xaeffa0, alpha: [0.0, 0.6], scale: [0.4, 0.9], speedY: [-26, -10], speedX: [-8, 8], life: 5000, freq: 200 },
  finance:   { tex: 'fx_confetti', tint: [0xdfe8ee, 0x3BB36A, 0xE14B3A], alpha: [0.0, 0.8], scale: [0.6, 1.0], speedY: [40, 90], speedX: [-20, 20], life: 5500, freq: 220, rotate: true },
  tower:     { tex: 'fx_mote', tint: 0xff9a4a, alpha: [0.0, 0.7], scale: [0.4, 0.8], speedY: [-40, -16], speedX: [-10, 10], life: 4500, freq: 170 },
  water:     { tex: 'fx_bubble', tint: 0xcdf3ff, alpha: [0.0, 0.6], scale: [0.4, 1.2], speedY: [-50, -22], speedX: [-6, 6], life: 5000, freq: 210 },
};

export function makeAirTextures(scene) {
  if (scene.textures.exists('fx_mote')) return;
  const cv = (key, w, h, draw) => { const t = scene.textures.createCanvas(key, w, h); draw(t.getContext(), w, h); t.refresh(); };
  cv('fx_mote', 16, 16, (c, w, h) => { const g = c.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  cv('fx_bubble', 16, 16, (c) => { c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.5; c.beginPath(); c.arc(8, 8, 6, 0, Math.PI * 2); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(5.5, 5.5, 1.6, 0, Math.PI * 2); c.fill(); });
  cv('fx_streak', 4, 28, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.fillRect(1, 0, 2, h); });
  cv('fx_confetti', 8, 5, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); });
  cv('fx_haze', 8, 64, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  cv('fx_shaft', 64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); const v = c.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.7, 'rgba(0,0,0,0.6)'); v.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = v; c.fillRect(0, 0, w, h); });
}

// Costruisce il fondale a piani. Ritorna { update(), resize() }.
export function buildParallax(scene) {
  const L = scene.level, theme = themeFor(L);
  const perf = scene._perf;
  const VW = () => scene.VW, VH = () => scene.VH;
  const layer = scene.add.container(scene.ux(0), scene.uy(0)).setScrollFactor(0).setDepth(-10);
  scene.bgLayer = layer;

  // --- piano lontano: immagine del mondo specchiata (senza cucitura) ---
  const srcImg = scene.textures.get('bg_surface').getSourceImage();
  const sw = srcImg.width || 1100, sh = srcImg.height || 614;
  const mkey = 'bgm_' + L.id;
  if (!scene.textures.exists(mkey)) {
    const t = scene.textures.createCanvas(mkey, sw * 2, sh), c = t.getContext();
    c.drawImage(srcImg, 0, 0);
    c.save(); c.translate(sw * 2, 0); c.scale(-1, 1); c.drawImage(srcImg, 0, 0); c.restore();
    t.refresh();
  }
  const far = scene.add.tileSprite(0, 0, VW(), VH(), mkey).setOrigin(0);
  const farScale = VH() / sh;             // copre tutta l'altezza della vista
  far.setTileScale(farScale, farScale);
  layer.add(far);

  // --- piano medio: sagome del tema ---
  let mid = null;
  if (theme !== 'officina') {
    const skey = 'sil_' + theme;
    if (!scene.textures.exists(skey)) {
      const t = scene.textures.createCanvas(skey, SIL_W, SIL_H);
      drawSilhouette(t.getContext(), theme, SIL_W, SIL_H); t.refresh();
    }
    const dark = L.dark || L.night || theme === 'water' || theme === 'tower' || theme === 'neon';
    mid = scene.add.tileSprite(0, 0, VW(), SIL_H, skey).setOrigin(0, 0).setAlpha(dark ? 0.6 : 0.34);
    layer.add(mid);
  }

  // --- foschia a terra: velo morbido sopra il pavimento (profondità a costo zero) ---
  let haze = null;
  if (theme !== 'officina') {
    makeAirTextures(scene);
    const HAZE = { factory: 0xffd9a0, warehouse: 0xf2dcb8, neon: 0x7a4fd8, lab: 0x9affa0, finance: 0xc8d4e0, tower: 0x4fa7ff, water: 0x9fe8ff }[theme] || 0xffffff;
    haze = scene.add.image(0, VH() - 36, 'fx_haze').setOrigin(0, 1).setDisplaySize(VW(), 90).setTint(HAZE)
      .setAlpha(theme === 'neon' || theme === 'tower' ? 0.22 : 0.16).setBlendMode(theme === 'factory' || theme === 'warehouse' ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD);
    layer.add(haze);
  }

  // --- fasci di luce (solo livelli luminosi, non in modalità prestazioni) ---
  const shafts = [];
  const bright = (theme === 'factory' || theme === 'warehouse' || theme === 'lab' || theme === 'finance') && !L.dark && !L.night;
  if (bright && !perf) {
    makeAirTextures(scene);
    for (let i = 0; i < 3; i++) {
      const s = scene.add.image(VW() * (0.18 + i * 0.3), -20, 'fx_shaft').setOrigin(0.5, 0)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.10 + i * 0.02).setAngle(-14 + i * 3)
        .setDisplaySize(90 + i * 40, VH() * 1.2).setTint(theme === 'lab' ? 0xcfffd8 : 0xffe4b0);
      layer.add(s); shafts.push(s);
      scene.tweens.add({ targets: s, alpha: s.alpha * 0.45, duration: 2600 + i * 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  // --- aria: particelle d'ambiente ---
  let air = null;
  const A = AIR[theme];
  if (A && !perf) {
    makeAirTextures(scene);
    air = scene.add.particles(0, 0, A.tex, {
      x: { min: 0, max: VW() }, y: { min: -20, max: VH() },
      lifespan: A.life, frequency: A.freq, quantity: 1,
      speedX: { min: A.speedX[0], max: A.speedX[1] }, speedY: { min: A.speedY[0], max: A.speedY[1] },
      scale: { min: A.scale[0], max: A.scale[1] },
      alpha: { start: A.alpha[0], end: A.alpha[1], ease: 'Quad.easeOut' },
      tint: A.tint, rotate: A.rotate ? { min: 0, max: 360 } : 0,
      blendMode: theme === 'neon' || theme === 'tower' || theme === 'lab' ? 'ADD' : 'NORMAL',
    });
    // le particelle svaniscono verso la fine della vita (alpha start→end è l'ingresso; qui l'uscita)
    air.setParticleAlpha({ onEmit: () => 0, onUpdate: (p, k, t, v) => { const a = A.alpha[1]; return t < 0.15 ? a * (t / 0.15) : t > 0.75 ? a * (1 - (t - 0.75) / 0.25) : a; } });
    layer.add(air);
    // riempie subito l'aria (niente schermo vuoto al primo frame)
    air.fastForward(Math.min(A.life, 4000));
  }

  function update() {
    const camX = scene.cameras.main.worldView.x;
    far.tilePositionX = camX * 0.22 / farScale;
    if (mid) mid.tilePositionX = camX * 0.55;
  }
  function resize() {
    layer.setPosition(scene.ux(0), scene.uy(0));
    far.setSize(VW(), VH()); const fs = VH() / sh; far.setTileScale(fs, fs);
    if (mid) mid.setSize(VW(), SIL_H);
    if (haze) { haze.setPosition(0, VH() - 36); haze.setDisplaySize(VW(), 90); }
    if (air) air.setConfig && air.setConfig({ x: { min: 0, max: VW() } });
  }
  return { update, resize, theme, layer };
}
