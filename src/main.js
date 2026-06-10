import Phaser from 'phaser';
import { CHARACTERS } from './config.js';
import { state, loadRun, clearRun, getBest, getNick, setNick, getEmail, setEmail, resetLetters, isGameCompleted, setGameCompleted, getCustomHero, setCustomHero, clearCustomHero, hasCreatedHero, setCreatedHero, clearCreatedHero, isPerf, setPerf, seenIntro, setSeenIntro } from './state.js';
import { POWERS, powerById } from './powers.js';
import { LEVELS } from './levels.js';
import { submitScore, topScores, sanitizeNick, submitLead, validateEmail, fetchPublicHeroes } from './leaderboard.js';
import { generateBadge, tierFor, downloadBadge, shareBadge } from './badge.js';
import { GameScene } from './scenes/GameScene.js';
import { AUDIO } from './audio.js';
// portrait con margine (NON ritagliati) così il volto si può centrare nel riquadro della card
import mementoImg from '../assets/Memento_card.webp';
import yuriImg from '../assets/Yuri_card.webp';
import carmineImg from '../assets/carmine_card.webp';
import andreaImg from '../assets/andrea_card.webp';
// sprite chibi (gli stessi del gioco): stile coerente con il gameplay, usati per la crew sul badge
import mementoArt from '../assets/char_memento.webp';
import yuriArt from '../assets/char_yuri.webp';
import carmineArt from '../assets/char_carmine.webp';
import andreaArt from '../assets/char_andrea.webp';

const CARD_IMG = { memento: mementoImg, yuri: yuriImg, carmine: carmineImg, andrea: andreaImg };
const HERO_ART = { memento: mementoArt, yuri: yuriArt, carmine: carmineArt, andrea: andreaArt };
// Inquadratura del volto nella card: zoom (background-size) + posizione verticale (Y%).
// Y% più basso = mostra parte più alta dell'immagine (volto più in basso nella cornice).
// Ritratti chibi (testa intera, quadrato centrato) → 'contain' center: volto SEMPRE intero, mai tagliato
const CARD_FRAME = {
  memento: { zoom: 'contain', x: 'center', y: 'center' },
  yuri:    { zoom: 'contain', x: 'center', y: 'center' },
  carmine: { zoom: 'contain', x: 'center', y: 'center' },
  andrea:  { zoom: 'contain', x: 'center', y: 'center' },
};

let SELECTED = 'memento';
let WORLD_ID = 1;
let GAME = null;

function isTouch() {
  return matchMedia('(hover:none),(pointer:coarse)').matches;
}

// Dimensione di gioco: altezza FISSA (506) e larghezza che RIEMPIE lo schermo all'aspect del
// dispositivo → in orizzontale niente bande nere ai lati (si vede più scena), e i personaggi
// restano della stessa dimensione. Limiti per non zoomare troppo dentro/fuori.
function gameSize() {
  const w = window.innerWidth || 1, h = window.innerHeight || 1;
  const H = 420;   // altezza di inquadratura più bassa del mondo (506) = ZOOM: elementi più grandi
  const W = Math.max(540, Math.min(1180, Math.round(H * (w / h))));
  return { width: W, height: H };
}

function startGame(key, worldId = 1, opts = {}) {
  // Gestione punteggio CUMULATIVO della run:
  //  - newRun (clic su una card) → azzera e cancella il salvataggio
  //  - resumeScore (Continua)    → riprende il totale salvato
  //  - altrimenti (prossimo mondo / ricomincia) → mantiene il totale corrente
  // newRun = partita da capo: azzera anche le lettere FREEDOM (altrimenti la lettera del Mondo 1
  // risulta già presa e il suo collezionabile non compare). Il "Continua" invece le conserva.
  if (opts.newRun) { state.runScore = 0; clearRun(); resetLetters(); try { if (window.msTrack) window.msTrack('event', { meta: { name: 'partita_iniziata', eroe: key } }); } catch (e) {} }
  else if (opts.resumeScore != null) state.runScore = opts.resumeScore;

  SELECTED = key;
  WORLD_ID = LEVELS[worldId] ? worldId : 1;
  state.selectedKey = key;
  state.cfg = CHARACTERS[key];
  state.worldId = WORLD_ID;
  state.level = LEVELS[WORLD_ID];

  ['menu', 'win', 'over', 'pause', 'creator'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('pausebtn').classList.remove('hidden');
  if (isTouch()) document.getElementById('touch').classList.remove('hidden');
  document.body.classList.add('in-game');   // attiva l'invito "ruota il telefono" in portrait

  // RIUSO DEL MOTORE: ricreare l'intero Phaser.Game a ogni morte/restart su iPhone esauriva i
  // contesti WebGL (limite ~16) → il gioco si CONGELAVA e serviva ricaricare. Se il gioco è già
  // attivo sullo STESSO mondo (es. "Continua"/"Ricomincia" dopo la morte), riavvio solo la scena:
  // stessi asset già in cache, nessun nuovo contesto WebGL. Cambio mondo → ricreo (raro).
  if (GAME && GAME._worldId === WORLD_ID) {
    const sc = GAME.scene.getScene('Game');
    if (sc) { sc.scene.restart(); return; }
  }
  if (GAME) { GAME.destroy(true); GAME = null; }

  GAME = window._GAME = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    // mobile: arrotonda le posizioni (niente subpixel → più nitido e un filo più leggero) e chiede
    // la GPU ad alte prestazioni dove disponibile
    render: { roundPixels: true, powerPreference: 'high-performance' },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      ...gameSize(),   // larghezza adattata allo schermo (altezza fissa 506) → niente bande ai lati
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 1150 } },
    },
    input: { gamepad: true },   // controller PS/Xbox/generici (Gamepad API)
    scene: [GameScene],
  });
  GAME._worldId = WORLD_ID;
}

function restart() { startGame(SELECTED, WORLD_ID); }

function toMenu() {
  if (GAME) { GAME.destroy(true); GAME = null; }
  document.body.classList.remove('in-game');
  document.getElementById('touch').classList.add('hidden');
  document.getElementById('pausebtn').classList.add('hidden');
  ['win', 'over', 'pause'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('menu').classList.remove('hidden');
  if (typeof refreshMenu === 'function') refreshMenu();   // aggiorna "Continua" / record
  if (typeof refreshInstallBtn === 'function') refreshInstallBtn();   // aggiorna pulsante Installa
  AUDIO.playMusic('title_theme');   // musica del menu/selezione
}

// Build menu cards
const cardsEl = document.getElementById('cards');
Object.entries(CHARACTERS).forEach(([key, c]) => {
  const col = c.card || '#F2C53D';                 // colore tema della card per personaggio
  const imgUrl = CARD_IMG[key];
  const fr = CARD_FRAME[key] || { zoom: '155%', x: 'center', y: '12%' };
  const el = document.createElement('div');
  el.className = 'card'; el.tabIndex = 0;
  el.style.setProperty('--c', col);
  el.style.setProperty('--c-border', col + '55');  // bordo a riposo (alpha)
  el.style.setProperty('--c-glow', col + '40');    // alone in hover (alpha)
  el.innerHTML = `
    <div class="av" style="background-image:url('${imgUrl}');background-size:${fr.zoom};background-position:${fr.x || 'center'} ${fr.y};background-repeat:no-repeat" role="img" aria-label="${c.name}"></div>
    <div class="nm">${c.name}</div>
    <div class="rl">${c.role}</div>
    <div class="pw">${c.power}</div>
    <div class="abx">${c.pdesc}${c.passive ? ' · ' + c.passive : ''}</div>
  `;
  el.onclick = () => startGame(key, 1, { newRun: true });   // scegliere un eroe = NUOVA partita
  el.onkeydown = e => { if (e.key === 'Enter') startGame(key, 1, { newRun: true }); };
  cardsEl.appendChild(el);
});

// --- "Continua" + record nel menu ---
const continuaBtn = document.getElementById('btn-continua');
const recordEl = document.getElementById('record');
function refreshMenu() {
  const run = loadRun();
  if (continuaBtn) {
    const ok = !!(run && LEVELS[run.world]);
    continuaBtn.classList.toggle('hidden', !ok);
    if (ok) continuaBtn.textContent = '▸ Continua — ' + LEVELS[run.world].name;
  }
  const best = getBest();
  if (recordEl) {
    recordEl.classList.toggle('hidden', !best);
    if (best) recordEl.textContent = '🏆 Record: ' + best + ' pt';
  }
  buildExtraCards();   // card "Crea il tuo eroe" + eroe custom salvato (se il gioco è finito)
}
if (continuaBtn) continuaBtn.onclick = () => {
  const run = loadRun(); if (!run) return;
  let char = run.char || SELECTED;
  // eroe personalizzato: su un avvio "pulito" CHARACTERS.custom non esiste ancora → lo ricostruisco
  // dal salvataggio locale; se non c'è (eroe della community) riparto con un eroe base.
  if (char === 'custom' && !CHARACTERS.custom) {
    const h = getCustomHero();
    if (h) CHARACTERS.custom = buildCustomCfg(h); else char = 'memento';
  }
  startGame(char, run.world, { resumeScore: run.runScore || 0 });
};

// ===== EROE PERSONALIZZATO (sbloccato dopo aver finito il gioco) =====
const CREATOR_COLORS = ['#E14B3A', '#3BB36A', '#3B82E6', '#EC6AAE', '#F2C53D', '#9B6BD9'];
let creatorSel = { look: 'memento', color: '#F2C53D', power: 'shoot', avatarUrl: null };
const creatorEl = document.getElementById('creator');
const creatorName = document.getElementById('creator-name');
const creatorColors = document.getElementById('creator-colors');
const creatorPowers = document.getElementById('creator-powers');
const creatorAvatar = document.getElementById('creator-avatar');
const creatorAiStatus = document.getElementById('creator-ai-status');
const creatorConsent = document.getElementById('creator-consent');
const creatorSocial = document.getElementById('creator-social');
const creatorFile = document.getElementById('creator-file');
const creatorPhotoBtn = document.getElementById('creator-photo-btn');
const creatorPlay = document.getElementById('creator-play');

// costruisce una config "alla CHARACTERS" dall'eroe personalizzato salvato (riusa look/stats base + potere)
function buildCustomCfg(h) {
  const base = CHARACTERS[h.baseLook] || CHARACTERS.memento;
  const pw = powerById(h.powerId);
  return {
    name: h.name || 'Eroe', role: 'Il tuo eroe', power: pw.name, pdesc: pw.emoji + ' ' + pw.desc,
    hint: (h.name || 'Eroe') + ' · Z (da GRANDE): ' + pw.name + ' — ' + pw.desc,
    card: h.color || base.card, body: base.body, accent: base.accent,
    jumps: base.jumps, speed: base.speed, jump: base.jump, special: pw.special,
    baseLook: h.baseLook, avatarUrl: h.avatarUrl || null, profileUrl: h.profileUrl || null,
  };
}

function renderCreator() {
  // anteprima dell'avatar: mostra il RITRATTO (profile) se c'è, altrimenti lo sprite, altrimenti 📷
  if (creatorAvatar) {
    const preview = creatorSel.profileUrl || creatorSel.avatarUrl;
    if (preview) {
      creatorAvatar.textContent = '';
      creatorAvatar.style.backgroundImage = "url('" + preview + "')";
      creatorAvatar.style.backgroundSize = creatorSel.profileUrl ? 'cover' : 'contain';
      creatorAvatar.style.borderStyle = 'solid';
      creatorAvatar.style.borderColor = creatorSel.color;
    } else {
      creatorAvatar.textContent = '📷';
      creatorAvatar.style.backgroundImage = 'none';
      creatorAvatar.style.borderStyle = 'dashed';
      creatorAvatar.style.borderColor = '#ffffff44';
    }
  }
  creatorColors.innerHTML = '';
  CREATOR_COLORS.forEach((col) => {
    const b = document.createElement('div');
    b.style.cssText = 'width:30px;height:30px;border-radius:50%;cursor:pointer;background:' + col + ';border:3px solid ' + (creatorSel.color === col ? '#fff' : '#ffffff22');
    b.onclick = () => { creatorSel.color = col; renderCreator(); };
    creatorColors.appendChild(b);
  });
  creatorPowers.innerHTML = '';
  POWERS.forEach((pw) => {
    const sel = creatorSel.power === pw.id;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn';
    // selezionato = riempito col colore tema (testo scuro + glow): impossibile non capire quale è attivo
    b.style.cssText = 'padding:9px 8px;font-size:12px;line-height:1.2;border-radius:12px;cursor:pointer;border:2px solid '
      + (sel ? '#fff' : '#ffffff2e') + ';background:' + (sel ? creatorSel.color : 'transparent')
      + ';color:' + (sel ? '#1a121f' : '#f7f1e8') + ';box-shadow:' + (sel ? '0 0 16px ' + creatorSel.color + '88' : 'none');
    b.innerHTML = pw.emoji + ' <b>' + pw.name + '</b><br><span style="font-size:10px;opacity:.8">' + pw.desc + '</span>';
    b.onclick = () => { creatorSel.power = pw.id; renderCreator(); };
    creatorPowers.appendChild(b);
  });
}

function openCreator() {
  const h = getCustomHero();
  creatorSel = h
    ? { look: h.baseLook || 'memento', color: h.color || '#F2C53D', power: h.powerId || 'shoot', avatarUrl: h.avatarUrl || null, profileUrl: h.profileUrl || null }
    : { look: 'memento', color: '#F2C53D', power: 'shoot', avatarUrl: null, profileUrl: null };
  if (creatorName) creatorName.value = h ? (h.name || '') : '';
  if (creatorAiStatus) creatorAiStatus.textContent = '';
  refreshPhotoBtn();
  renderCreator();
  ['menu', 'win', 'over', 'pause', 'board'].forEach((id) => document.getElementById(id).classList.add('hidden'));
  creatorEl.classList.remove('hidden');
}

// ----- Avatar dalla foto (Gemini / "Nano Banana") -----
// offline o senza consenso → pulsante disabilitato con messaggio; il resto del creatore funziona.
function refreshPhotoBtn() {
  if (!creatorPhotoBtn) return;
  const off = !navigator.onLine;
  creatorPhotoBtn.disabled = off;
  creatorPhotoBtn.style.opacity = off ? '.5' : '1';
  creatorPhotoBtn.textContent = creatorSel.avatarUrl ? '📷 Cambia foto' : '📷 Genera avatar dalla foto';
  if (off && creatorAiStatus) creatorAiStatus.textContent = 'Offline: l’avatar dalla foto richiede una connessione.';
}
window.addEventListener('online', refreshPhotoBtn);
window.addEventListener('offline', refreshPhotoBtn);

// ridimensiona la foto (lato client) a max ~768px e ritorna base64 JPEG (senza prefisso) → payload piccolo
function fileToScaledB64(file, max = 768) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * r), hh = Math.round(img.height * r);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = hh;
      cv.getContext('2d').drawImage(img, 0, 0, w, hh);
      resolve(cv.toDataURL('image/jpeg', 0.86).split(',')[1]);
    };
    img.onerror = () => reject(new Error('immagine non valida'));
    const fr = new FileReader();
    fr.onload = () => { img.src = fr.result; };
    fr.onerror = () => reject(new Error('lettura file fallita'));
    fr.readAsDataURL(file);
  });
}

// schiarisce/scurisce un colore hex (amt da -255 a 255) — usato per lo sfondo del ritratto
function shade(hex, amt) {
  const h = (hex || '#888888').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 255) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Elabora il PNG generato (sfondo verde chroma-key) e produce DUE immagini:
//  - sprite: personaggio a corpo intero, sfondo trasparente → usato in GIOCO
//  - profile: ritratto quadrato (testa/spalle) su sfondo col colore tema → mostrato e usato su card/badge
function processAvatar(b64png) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const W = img.width, H = img.height;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, W, H); const d = data.data;
      // Rimuove SOLO i pixel in cui il VERDE è chiaramente il canale dominante (lo sfondo green-screen,
      // anche se spento/olivastro): g più alto sia di rosso che di blu, con un margine. La pelle è
      // rosso-dominante e i capelli/abiti scuri non sono verde-dominanti → NON vengono toccati (niente
      // effetto "tutto giallo"). Poi conto i pixel opachi per riga/colonna per centrare ignorando i puntini.
      const colCount = new Uint32Array(W), rowCount = new Uint32Array(H);
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (g > 70 && g > r + 8 && g > b + 8) { d[i + 3] = 0; }   // verde dominante = sfondo
        else if (d[i + 3] > 40) { const idx = i >> 2; colCount[idx % W]++; rowCount[(idx / W) | 0]++; }
      }
      ctx.putImageData(data, 0, 0);
      const full = cv.toDataURL('image/png');
      // un riga/colonna conta solo se ha abbastanza pixel opachi → i puntini isolati vengono ignorati
      const colThr = Math.max(3, Math.round(H * 0.02));
      const rowThr = Math.max(3, Math.round(W * 0.02));
      let minX = W, minY = H, maxX = 0, maxY = 0;
      for (let x = 0; x < W; x++) if (colCount[x] >= colThr) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
      for (let y = 0; y < H; y++) if (rowCount[y] >= rowThr) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
      if (maxX <= minX || maxY <= minY) { resolve({ sprite: full, profile: full }); return; }
      const pad = 6;
      const bx = Math.max(0, minX - pad), by = Math.max(0, minY - pad);
      const bX = Math.min(W - 1, maxX + pad), bY = Math.min(H - 1, maxY + pad);
      const cw = bX - bx + 1, ch = bY - by + 1;

      // --- SPRITE (gioco): corpo intero trasparente, dentro 256px ---
      const sc = Math.min(1, 256 / Math.max(cw, ch));
      const spr = document.createElement('canvas'); spr.width = Math.round(cw * sc); spr.height = Math.round(ch * sc);
      spr.getContext('2d').drawImage(cv, bx, by, cw, ch, 0, 0, spr.width, spr.height);
      const sprite = spr.toDataURL('image/png');

      // --- PROFILE (ritratto quadrato come le card base 480x480): testa + petto, centrato ---
      // riquadro quadrato centrato orizzontalmente sul personaggio, dalla testa al petto, con un
      // filo di headroom. Le aree fuori dal personaggio restano trasparenti → si vede lo sfondo.
      const cxC = bx + cw / 2;
      const S = Math.round(cw * 1.5);                  // riquadro più ampio → personaggio più piccolo, con margine
      const sx = Math.round(cxC - S / 2);
      const sy = Math.round(by - cw * 0.2);            // più spazio sopra la testa
      const P = 256;
      const prof = document.createElement('canvas'); prof.width = P; prof.height = P;
      const pc = prof.getContext('2d');
      const grd = pc.createRadialGradient(P / 2, P * 0.4, 20, P / 2, P / 2, P * 0.72);
      grd.addColorStop(0, shade(creatorSel.color, 25)); grd.addColorStop(1, shade(creatorSel.color, -55));
      pc.fillStyle = grd; pc.fillRect(0, 0, P, P);
      // il canvas ritaglia in proporzione le parti di sorgente fuori bordo → margini = sfondo
      pc.drawImage(cv, sx, sy, S, S, 0, 0, P, P);
      const profile = prof.toDataURL('image/png');

      resolve({ sprite, profile });
    };
    img.onerror = () => reject(new Error('PNG generato non valido'));
    img.src = 'data:image/png;base64,' + b64png;
  });
}

// mostra/nasconde lo stato "sto generando" nel riquadro avatar (animazione + countdown rassicurante)
let genAnim = null, genTimer = null;
function setGenerating(on) {
  if (creatorPlay) creatorPlay.disabled = on;
  creatorPhotoBtn.disabled = on || !navigator.onLine;
  if (on) {
    creatorAvatar.textContent = '⏳';
    creatorAvatar.style.backgroundImage = 'none';
    creatorAvatar.style.borderStyle = 'solid';
    creatorAvatar.style.borderColor = creatorSel.color;
    if (creatorAvatar.animate) { try { genAnim = creatorAvatar.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], { duration: 1200, iterations: Infinity }); } catch (e) {} }
    let s = 0;
    creatorAiStatus.style.color = '#F2C53D';
    creatorAiStatus.textContent = '🦸 Sto creando il tuo supereroe… non chiudere (di solito 15-30s)';
    genTimer = setInterval(() => { s += 1; creatorAiStatus.textContent = '🦸 Sto creando il tuo supereroe… ' + s + 's (di solito 15-30s, non chiudere)'; }, 1000);
  } else {
    if (genAnim) { try { genAnim.cancel(); } catch (e) {} genAnim = null; }
    if (genTimer) { clearInterval(genTimer); genTimer = null; }
  }
}

async function generateAvatar(file) {
  if (!navigator.onLine) { creatorAiStatus.style.color = '#ff9b9b'; creatorAiStatus.textContent = 'Sei offline: connettiti per generare l’avatar.'; return; }
  if (!creatorConsent || !creatorConsent.checked) { creatorAiStatus.style.color = '#ff9b9b'; creatorAiStatus.textContent = 'Spunta il consenso per inviare la foto.'; return; }
  setGenerating(true);
  try {
    const b64 = await fileToScaledB64(file);
    const res = await fetch('/api/avatar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: b64, mime: 'image/jpeg' }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || 'Generazione non riuscita');
    const { sprite, profile } = await processAvatar(j.image);
    creatorSel.avatarUrl = sprite;        // sprite a corpo intero → in gioco
    creatorSel.profileUrl = profile;      // ritratto → anteprima, card, badge
    setGenerating(false);
    creatorAiStatus.style.color = '#7CD992'; creatorAiStatus.textContent = '✓ Supereroe pronto! Scegli il superpotere e gioca.';
    renderCreator(); refreshPhotoBtn();
    // NB: la pubblicazione in community avviene al clic su "Gioca" (vedi creator-play), così cattura
    // il superpotere/nome/colore FINALI scelti dall'utente (qui sarebbero ancora quelli di default).
  } catch (e) {
    setGenerating(false);
    creatorAiStatus.style.color = '#ff9b9b'; creatorAiStatus.textContent = (e && e.message) ? e.message : 'Generazione non riuscita, riprova.';
  } finally {
    creatorPhotoBtn.disabled = !navigator.onLine;
  }
}
// pubblica l'eroe (sprite + ritratto + config) così è giocabile da tutti, e allega nick/email per il
// team (privati). Solo col consenso social. Best-effort: non blocca il gioco. Aggiorna poi la community.
function saveAvatarSocial() {
  try {
    const power = powerById(creatorSel.power);
    fetch('/api/save-avatar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consent: true,
        sprite: creatorSel.avatarUrl || null, profile: creatorSel.profileUrl || null,
        name: sanitizeNick(creatorName.value) || 'Eroe', color: creatorSel.color, powerId: creatorSel.power,
        power: power.name, nick: getNick() || '', email: getEmail() || '',
      }),
    }).then((r) => r && r.ok && setTimeout(refreshCommunity, 600)).catch(() => {});
  } catch (_) {}
}
if (creatorPhotoBtn) creatorPhotoBtn.onclick = () => {
  if (!creatorConsent || !creatorConsent.checked) { creatorAiStatus.style.color = '#ff9b9b'; creatorAiStatus.textContent = 'Prima spunta il consenso privacy qui sopra.'; return; }
  creatorFile.click();
};
if (creatorFile) creatorFile.onchange = () => { const f = creatorFile.files && creatorFile.files[0]; if (f) generateAvatar(f); creatorFile.value = ''; };
function closeCreator() { creatorEl.classList.add('hidden'); document.getElementById('menu').classList.remove('hidden'); refreshMenu(); }

if (document.getElementById('creator-close')) document.getElementById('creator-close').onclick = closeCreator;
if (document.getElementById('creator-play')) document.getElementById('creator-play').onclick = () => {
  const hero = { name: sanitizeNick(creatorName.value) || 'Eroe', baseLook: creatorSel.look, color: creatorSel.color, powerId: creatorSel.power, avatarUrl: creatorSel.avatarUrl || null, profileUrl: creatorSel.profileUrl || null };
  CHARACTERS.custom = buildCustomCfg(hero);
  // se l'eroe è pubblicato in community (consenso social) NON tengo anche la copia locale → niente
  // card doppia nel menu. Salvo localmente solo se l'utente NON ha condiviso in community.
  if (creatorSocial && creatorSocial.checked) { clearCustomHero(); saveAvatarSocial(); }   // pubblica coi valori FINALI
  else setCustomHero(hero);
  setCreatedHero();   // l'utente ha creato il suo eroe → la card "Crea eroe" sparisce
  startGame('custom', 1, { newRun: true });
};

// card extra nel menu: "Crea il tuo eroe" + l'eroe custom salvato (ricostruite a ogni refreshMenu)
function buildExtraCards() {
  if (!cardsEl) return;
  cardsEl.querySelectorAll('.card-extra').forEach((e) => e.remove());
  if (!isGameCompleted()) return;   // la card appare SOLO dopo aver finito il gioco
  // la card "Crea eroe" sparisce una volta che l'utente ha già creato il suo eroe
  if (!hasCreatedHero()) {
    const create = document.createElement('div');
    create.className = 'card card-extra'; create.tabIndex = 0;
    create.style.setProperty('--c', '#F2C53D'); create.style.setProperty('--c-border', '#F2C53D55'); create.style.setProperty('--c-glow', '#F2C53D40');
    create.innerHTML = '<div class="av" style="display:flex;align-items:center;justify-content:center;font-size:40px">✨</div><div class="nm">Crea eroe</div><div class="rl">Sbloccato!</div><div class="pw">Tu</div><div class="abx">Avatar + superpotere a scelta</div>';
    create.onclick = openCreator; create.onkeydown = (e) => { if (e.key === 'Enter') openCreator(); };
    cardsEl.appendChild(create);
  }
  const h = getCustomHero();
  if (h) {
    const cfg = buildCustomCfg(h); const pw = powerById(h.powerId);
    const img = h.profileUrl || h.avatarUrl || CARD_IMG[h.baseLook] || CARD_IMG.memento;
    const card = document.createElement('div');
    card.className = 'card card-extra'; card.tabIndex = 0; card.style.position = 'relative';
    card.style.setProperty('--c', cfg.card); card.style.setProperty('--c-border', cfg.card + '55'); card.style.setProperty('--c-glow', cfg.card + '40');
    card.innerHTML = "<div class=\"av\" style=\"background-image:url('" + img + "');background-size:contain;background-position:center;background-repeat:no-repeat\"></div><div class=\"nm\">" + cfg.name + '</div><div class="rl">Il tuo eroe</div><div class="pw">' + pw.name + '</div><div class="abx">' + pw.emoji + ' ' + pw.desc + '</div>'
      + '<button class="card-del" title="Elimina questo eroe" aria-label="Elimina" style="position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;border:none;background:#0009;color:#fff;font-size:14px;line-height:1;cursor:pointer;z-index:2">✕</button>';
    const go = () => { CHARACTERS.custom = cfg; startGame('custom', 1, { newRun: true }); };
    card.onclick = go; card.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    card.querySelector('.card-del').onclick = (e) => {
      e.stopPropagation();
      if (confirm('Eliminare l\'eroe "' + cfg.name + '"? Potrai crearne uno nuovo.')) {
        clearCustomHero(); clearCreatedHero(); delete CHARACTERS.custom; refreshMenu();
      }
    };
    cardsEl.appendChild(card);
  }
  buildCommunityCards();
}

// ----- EROI DELLA COMMUNITY: gli eroi pubblici di tutti, giocabili da chiunque -----
let communityHeroes = [];
function heroCfgFromPublic(h) {
  const pw = powerById(h.power_id);
  const base = CHARACTERS.memento;
  return {
    name: h.name || 'Eroe', role: 'Eroe della community', power: pw.name, pdesc: pw.emoji + ' ' + pw.desc,
    hint: (h.name || 'Eroe') + ' · Z (da GRANDE): ' + pw.name + ' — ' + pw.desc,
    card: h.color || base.card, body: base.body, accent: base.accent,
    jumps: base.jumps, speed: base.speed, jump: base.jump, special: pw.special,
    baseLook: 'memento', avatarUrl: h.sprite_url || null, profileUrl: h.profile_url || null,
  };
}
function buildCommunityCards() {
  if (!cardsEl) return;
  cardsEl.querySelectorAll('.card-community').forEach((e) => e.remove());
  communityHeroes.forEach((h) => {
    const cfg = heroCfgFromPublic(h); const pw = powerById(h.power_id);
    const img = h.profile_url || h.sprite_url || CARD_IMG.memento;
    const card = document.createElement('div');
    card.className = 'card card-community'; card.tabIndex = 0;
    card.style.setProperty('--c', cfg.card); card.style.setProperty('--c-border', cfg.card + '55'); card.style.setProperty('--c-glow', cfg.card + '40');
    card.innerHTML = "<div class=\"av\" style=\"background-image:url('" + img + "');background-size:contain;background-position:center;background-repeat:no-repeat\"></div><div class=\"nm\">" + cfg.name + '</div><div class="rl">Community</div><div class="pw">' + pw.name + '</div><div class="abx">' + pw.emoji + ' ' + pw.desc + '</div>';
    const go = () => { CHARACTERS.custom = cfg; startGame('custom', 1, { newRun: true }); };
    card.onclick = go; card.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    cardsEl.appendChild(card);
  });
}
async function refreshCommunity() {
  try { communityHeroes = await fetchPublicHeroes(120); } catch (e) { communityHeroes = []; }
  buildCommunityCards();
}

refreshMenu();
refreshCommunity();   // carica gli eroi della community nella home (per tutti i giocatori)

// ===== Nickname obbligatorio (una volta sola, all'inizio) =====
const nameaskEl = document.getElementById('nameask');
const nameaskInput = document.getElementById('nameask-input');
const nameaskHint = document.getElementById('nameask-hint');
function maybeAskName() {
  if (!nameaskEl) return;
  if (getNick()) return;                 // già impostato → non chiedere più
  nameaskInput.value = '';
  nameaskEl.classList.remove('hidden');
  setTimeout(() => { try { nameaskInput.focus(); } catch (e) {} }, 80);
}
function submitName() {
  const raw = (nameaskInput.value || '').trim();
  if (raw.length < 2) { nameaskHint.textContent = 'Scrivi un nickname (almeno 2 caratteri).'; return; }
  setNick(sanitizeNick(raw));
  nameaskHint.textContent = '';
  nameaskEl.classList.add('hidden');
}
if (document.getElementById('nameask-go')) document.getElementById('nameask-go').onclick = submitName;
if (nameaskInput) nameaskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitName(); });

// Disclaimer iniziale (una volta sola), POI il nickname obbligatorio
const introEl = document.getElementById('intro');
function startupFlow() {
  if (introEl && !seenIntro()) {
    introEl.classList.remove('hidden');
  } else {
    maybeAskName();
  }
}
if (document.getElementById('intro-go')) document.getElementById('intro-go').onclick = () => {
  setSeenIntro();
  if (introEl) introEl.classList.add('hidden');
  maybeAskName();
};
startupFlow();

// ===== Modalità prestazioni (toggle nel menu) =====
const perfBtn = document.getElementById('btn-perf');
function refreshPerfBtn() { if (perfBtn) perfBtn.textContent = '⚡ Modalità prestazioni: ' + (isPerf() ? 'ON' : 'OFF'); }
if (perfBtn) perfBtn.onclick = () => { setPerf(!isPerf()); refreshPerfBtn(); };
refreshPerfBtn();

// ===== TEST LIVELLI: ?livelli (o ?levels) → scegli eroe e salta a qualsiasi livello =====
const levelselEl = document.getElementById('levelsel');
let levelselHero = 'memento';
function buildLevelSel() {
  const heroesBox = document.getElementById('levelsel-heroes');
  const grid = document.getElementById('levelsel-grid');
  if (!heroesBox || !grid) return;
  heroesBox.innerHTML = '';
  ['memento', 'yuri', 'carmine', 'andrea'].forEach((k) => {
    const c = CHARACTERS[k]; if (!c) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn';
    const sel = levelselHero === k;
    b.textContent = c.name;
    b.style.cssText = 'padding:6px 12px;font-size:12px;border-radius:999px;border:2px solid ' + (sel ? '#fff' : '#ffffff2e') + ';background:' + (sel ? (c.card || '#F2C53D') : 'transparent') + ';color:' + (sel ? '#16121A' : '#f7f1e8') + ';cursor:pointer';
    b.onclick = () => { levelselHero = k; buildLevelSel(); };
    heroesBox.appendChild(b);
  });
  grid.innerHTML = '';
  Object.keys(LEVELS).forEach((id) => {
    const lv = LEVELS[id];
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost';
    b.style.cssText = 'padding:8px 6px;font-size:11px;line-height:1.25;border-radius:10px;cursor:pointer';
    b.innerHTML = '<b>' + id + '</b><br>' + (lv && lv.name ? lv.name : 'Livello ' + id);
    b.onclick = () => { levelselEl.classList.add('hidden'); startGame(levelselHero, parseInt(id, 10), { newRun: true }); };
    grid.appendChild(b);
  });
}
function openLevelSel() {
  buildLevelSel();
  ['menu', 'win', 'over', 'pause', 'creator', 'board', 'nameask'].forEach((id) => { const e = document.getElementById(id); if (e) e.classList.add('hidden'); });
  levelselEl.classList.remove('hidden');
}
if (document.getElementById('levelsel-close')) document.getElementById('levelsel-close').onclick = () => { levelselEl.classList.add('hidden'); document.getElementById('menu').classList.remove('hidden'); };
if (/(?:[?&#])(livelli|levels)(?:[=&]|$)/.test(location.search + location.hash)) openLevelSel();


// Scorciatoia di test/condivisione: aprendo il sito con ?crea (o #crea) si sblocca e si apre
// subito il creatore dell'eroe, senza dover finire il gioco. Utile per provare l'avatar AI.
if (/(?:[?&#])crea(?:[=&]|$)/.test(location.search + location.hash)) {
  setGameCompleted();
  try { openCreator(); } catch (e) {}
}

// Set logo images
const logoUrl = new URL('../assets/logo_yac.webp', import.meta.url).href;
document.getElementById('logoimg').src = logoUrl;
document.getElementById('winlogo').src = logoUrl;

// Wire buttons
const menuWinBtn = document.getElementById('btn-menu-win');
const nextWinBtn = document.getElementById('btn-next-win');
menuWinBtn.addEventListener('click', toMenu);
if (nextWinBtn) nextWinBtn.addEventListener('click', () => startGame(SELECTED, window._nextWorldId));
// Flusso multi-mondo: mostra "Prossimo mondo" solo se esiste un mondo successivo
window._gameShowWin = (nextId, cta) => {
  window._nextWorldId = nextId;
  const hasNext = !!(nextId && LEVELS[nextId]);
  if (nextWinBtn) {
    nextWinBtn.classList.toggle('hidden', !hasNext);
    if (hasNext && cta) nextWinBtn.textContent = cta;
  }
  menuWinBtn.classList.toggle('ghost', hasNext);   // se c'è il prossimo, "Menu" diventa secondario
};
document.getElementById('btn-restart').addEventListener('click', restart);
document.getElementById('btn-menu-over').addEventListener('click', toMenu);
document.getElementById('btn-restart-pause').addEventListener('click', restart);
document.getElementById('btn-menu-pause').addEventListener('click', toMenu);

// ===== Classifica globale (Supabase) =====
const boardEl = document.getElementById('board');
const boardList = document.getElementById('board-list');
const boardSubmit = document.getElementById('board-submit');
const boardNick = document.getElementById('board-nick');
const boardSend = document.getElementById('board-send');
const boardMyScore = document.getElementById('board-myscore');
const boardEmpty = document.getElementById('board-empty');
// Badge YAC Hero (lead gen)
const boardEmail = document.getElementById('board-email');
const boardConsent = document.getElementById('board-consent');
const boardBadgeBtn = document.getElementById('board-badge-btn');
const boardBadgeMsg = document.getElementById('board-badge-msg');
const badgeResult = document.getElementById('badge-result');
const badgeImg = document.getElementById('badge-img');
let lastBadgeUrl = null;

async function loadBoard() {
  boardList.innerHTML = '<li style="opacity:.6;padding:8px">Carico…</li>';
  boardEmpty.classList.add('hidden');
  const rows = await topScores(100);
  if (!rows.length) {
    boardList.innerHTML = '';
    boardEmpty.textContent = 'Ancora nessun punteggio. Sii il primo! 🚀';
    boardEmpty.classList.remove('hidden');
    return;
  }
  const myNick = getNick();
  boardList.innerHTML = rows.map((r, i) => {
    const mine = r.nickname === myNick;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
    return `<li style="display:flex;justify-content:space-between;gap:10px;padding:7px 12px;border-radius:8px;${mine ? 'background:#F2C53D22;' : ''}">
      <span style="color:#F7F1E8"><span style="display:inline-block;width:28px;color:#9b8fa6">${medal}</span>${escapeHtml(r.nickname)}</span>
      <b style="color:var(--yellow)">${r.score}</b></li>`;
  }).join('');
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ===== Coda offline: se l'invio del punteggio/lead fallisce (offline), resta in coda e parte
// da solo quando torna la rete. I punti in locale (record) sono comunque sempre salvati. =====
const PKEY = 'syw_pending';
function loadPending() { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; } }
function savePending(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
function queueScore(s) { const p = loadPending(); if (!p.score || (s.score || 0) > (p.score.score || 0)) p.score = s; savePending(p); }
function queueLead(l) { const p = loadPending(); p.lead = l; savePending(p); }
async function flushPending() {
  let p = loadPending();
  if (p.score) { try { if (await submitScore(p.score.nick, p.score.score, p.score.world)) { p = loadPending(); delete p.score; savePending(p); } } catch (e) {} }
  if (p.lead)  { try { if (await submitLead(p.lead)) { p = loadPending(); delete p.lead; savePending(p); } } catch (e) {} }
  const q = loadPending();
  return !q.score && !q.lead;   // true = coda vuota (tutto inviato)
}
window.addEventListener('online', () => { flushPending().then((ok) => { if (ok && !boardEl.classList.contains('hidden')) loadBoard(); }); });
flushPending();   // all'avvio: prova a svuotare la coda (eventuali invii rimasti da offline)

function openBoard(submit) {
  // Cosa si può inviare in classifica: il risultato di fine partita (_runResult) OPPURE, in ogni
  // altro momento (es. dal menu), il PROPRIO RECORD personale. Così il nome si può sempre mettere,
  // anche solo vincendo i livelli senza mai morire.
  const best = getBest();
  const target = window._runResult || (best > 0 ? { score: best, world: state.worldId || null } : null);
  window._boardTarget = target;
  if (target) {
    boardSubmit.classList.remove('hidden');
    boardMyScore.textContent = target.score + ' pt';
    boardNick.value = getNick();
    // il punteggio è già stato salvato in automatico col tuo nickname → niente da premere.
    // Il pulsante serve solo se vuoi CAMBIARE nome e re-inviare.
    window._autoSubmitScore();
    boardSend.disabled = true; boardSend.textContent = '✓ Salvato in classifica';
    // reset area badge. Se l'email è GIÀ stata lasciata, niente più form: solo un pulsante
    // compatto "genera il tuo badge" (l'email/consenso li abbiamo già → non li richiediamo più).
    if (boardEmail) boardEmail.value = getEmail();
    if (boardBadgeMsg) boardBadgeMsg.textContent = '';
    if (badgeResult) badgeResult.classList.add('hidden');
    const hasEmail = !!getEmail();
    const emailAsk = document.getElementById('board-email-ask');
    if (emailAsk) emailAsk.classList.toggle('hidden', hasEmail);
    if (boardBadgeBtn) { boardBadgeBtn.disabled = false; boardBadgeBtn.textContent = hasEmail ? '🏅 Genera il tuo badge' : '🏅 Sblocca il Badge'; }
    lastBadgeUrl = null;
    // a fine partita (submit=true) porto subito il dito sul campo nome
    if (submit) setTimeout(() => { try { boardNick.focus(); if (!boardNick.value) boardNick.select(); } catch (e) {} }, 60);
  } else {
    boardSubmit.classList.add('hidden');
  }
  boardEl.classList.remove('hidden');
  loadBoard();
}
function closeBoard() { boardEl.classList.add('hidden'); }

// AUTO-SALVATAGGIO punteggio: a fine partita (morte/vittoria) il punteggio va in classifica DA SOLO
// usando il nickname (obbligatorio, già impostato). Niente pulsante da premere. Esposto alla scena.
window._autoSubmitScore = () => {
  const nick = getNick(); if (!nick) return;
  const t = window._runResult || (getBest() > 0 ? { score: getBest(), world: state.worldId || null } : null);
  if (!t) return;
  queueScore({ nick, score: t.score, world: t.world });
  flushPending();
};

if (boardSend) boardSend.onclick = async () => {
  const target = window._boardTarget;
  if (!target) return;
  const nick = sanitizeNick(boardNick.value);
  setNick(nick);
  boardSend.disabled = true; boardSend.textContent = 'Invio…';
  queueScore({ nick, score: target.score, world: target.world });   // sempre in coda
  const done = await flushPending();
  if (done) { boardSend.textContent = 'Inviato ✓'; boardSend.disabled = true; loadBoard(); }
  else { boardSend.textContent = 'In coda — parte appena torni online ✓'; boardSend.disabled = false; }
};
// se cambi il nickname, riabilito l'invio (per aggiornare il nome in classifica)
if (boardNick) boardNick.addEventListener('input', () => { if (boardSend && boardSend.textContent.startsWith('✓')) { boardSend.disabled = false; boardSend.textContent = 'Aggiorna nome in classifica'; } });

// Badge YAC Hero: email opzionale → salva il lead (Supabase `leads`, privato) e genera il
// badge personalizzato da scaricare/condividere. Lo riceve chiunque lascia l'email → niente
// premio in palio, niente concorso a premi.
if (boardBadgeBtn) boardBadgeBtn.onclick = async () => {
  const target = window._boardTarget;
  if (!target) return;
  // se l'email è già stata lasciata, la riusiamo (niente form/consenso da rifare)
  const saved = getEmail();
  const email = saved || validateEmail(boardEmail.value);
  if (!email) { boardBadgeMsg.style.color = '#ff9a9a'; boardBadgeMsg.textContent = 'Inserisci un\'email valida.'; return; }
  if (!saved && !boardConsent.checked) { boardBadgeMsg.style.color = '#ff9a9a'; boardBadgeMsg.textContent = 'Spunta il consenso per continuare.'; return; }

  const nick = sanitizeNick(boardNick.value);
  setNick(nick); setEmail(email);
  // Memento Studio: segnala il lead (l'email del badge) → finisce in "LEAD RACCOLTI".
  // No-op se lo snippet analytics non è presente. Inviato una volta sola per email.
  try { if (window.msTrack && email && window._msLeadSent !== email) { window.msTrack('lead', { email }); window._msLeadSent = email; } } catch (e) {}
  const char = CHARACTERS[state.selectedKey] || {};
  const tier = tierFor(target.score);

  boardBadgeBtn.disabled = true; boardBadgeBtn.textContent = 'Genero il badge…';
  boardBadgeMsg.style.color = '#c4b8c2'; boardBadgeMsg.textContent = '';
  // il salvataggio del lead va in coda (riprova da solo se offline) e non blocca il badge
  queueLead({ nickname: nick, email, score: target.score, world: target.world, tier: tier.title }); flushPending();
  try {
    // la crew completa (in ordine), così il badge disegna tutti gli eroi evidenziando il tuo.
    // L'eroe personalizzato usa l'avatar generato (o, in fallback, l'art del volto base scelto).
    const art = { ...HERO_ART };
    if (CHARACTERS.custom) art.custom = CHARACTERS.custom.profileUrl || CHARACTERS.custom.avatarUrl || HERO_ART[CHARACTERS.custom.baseLook] || HERO_ART.memento;
    const crew = Object.keys(CHARACTERS).map((k) => ({ key: k, name: CHARACTERS[k].name, accent: CHARACTERS[k].card }));
    const { dataUrl } = await generateBadge({
      nickname: nick, score: target.score, charName: char.name, accent: char.card,
      heroArt: art, selectedKey: state.selectedKey, crew,
    });
    lastBadgeUrl = dataUrl;
    badgeImg.src = dataUrl;
    badgeResult.classList.remove('hidden');
    boardBadgeBtn.textContent = 'Badge sbloccato 🏅';
    boardBadgeMsg.style.color = 'var(--yellow)';
    boardBadgeMsg.textContent = 'Ecco il tuo badge! Scaricalo o condividilo.';
  } catch (e) {
    boardBadgeBtn.disabled = false; boardBadgeBtn.textContent = '🏅 Sblocca il Badge';
    boardBadgeMsg.style.color = '#ff9a9a'; boardBadgeMsg.textContent = 'Errore nella generazione — riprova.';
  }
};
const badgeDownloadBtn = document.getElementById('badge-download');
const badgeShareBtn = document.getElementById('badge-share');
if (badgeDownloadBtn) badgeDownloadBtn.onclick = () => { if (lastBadgeUrl) downloadBadge(lastBadgeUrl); };
if (badgeShareBtn) badgeShareBtn.onclick = () => { if (lastBadgeUrl) shareBadge(lastBadgeUrl); };

document.getElementById('btn-board-menu').addEventListener('click', () => openBoard(false));
document.getElementById('btn-board-over').addEventListener('click', () => openBoard(true));
document.getElementById('btn-board-win').addEventListener('click', () => openBoard(true));
document.getElementById('btn-board-close').addEventListener('click', closeBoard);
// "✨ Crea il tuo eroe" sulla card del finale → apre il creatore (sblocco già fatto dalla scena)
const creatorWinBtn = document.getElementById('btn-creator-win');
if (creatorWinBtn) creatorWinBtn.addEventListener('click', () => { if (GAME) { GAME.destroy(true); GAME = null; } document.body.classList.remove('in-game'); document.getElementById('touch').classList.add('hidden'); document.getElementById('pausebtn').classList.add('hidden'); openCreator(); });
// esposto alla GameScene per mostrare i pulsanti "Classifica" e "Crea il tuo eroe" sulla card del finale
window._gameShowBoardBtn = (show) => {
  document.getElementById('btn-board-win').classList.toggle('hidden', !show);
  if (creatorWinBtn) creatorWinBtn.classList.toggle('hidden', !show);
};
// esposto alla GameScene: a fine partita apre da solo il form di salvataggio (col nome già a fuoco),
// così il giocatore non deve cercare il pulsante. Non fa nulla se non c'è un punteggio da inviare.
window._promptSaveScore = () => { if (window._runResult && boardEl.classList.contains('hidden')) openBoard(true); };

// ===== Blocco zoom/pan accidentale con due dita (iOS Safari ignora user-scalable=no) =====
// Niente più "lo schermo si ingrandisce/sposta" toccando con due dita. La PWA installata
// non ne ha bisogno, ma così è a posto anche nel browser. Lo scroll a un dito resta ok.
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev =>
  document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

// ===== PWA: service worker + installazione =====
// SW solo fuori da localhost (in dev darebbe fastidio con la cache).
// Auto-aggiornamento: quando una nuova versione prende il controllo, ricarico una volta
// → gli utenti non restano mai bloccati su una versione vecchia in cache.
if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  // reload UNA sola volta per sessione quando arriva una nuova versione (sessionStorage evita
  // loop di ricariche tra un reload e l'altro → niente consumo banda anomalo)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    try { if (sessionStorage.getItem('sw-reloaded')) return; sessionStorage.setItem('sw-reloaded', '1'); } catch (e) {}
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => reg.update()).catch(() => {});
  });
}

let deferredPrompt = null;
const installBtn = document.getElementById('btn-install');
const installHelp = document.getElementById('install-help');
const installSteps = document.getElementById('install-steps');
const installGo = document.getElementById('btn-install-go');
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

function refreshInstallBtn() {
  if (!installBtn) return;
  // pulsante sempre disponibile per riaprire le istruzioni, finché l'app non è già installata
  installBtn.classList.toggle('hidden', isStandalone());
}
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; refreshInstallBtn(); });
window.addEventListener('appinstalled', () => { deferredPrompt = null; if (installBtn) installBtn.classList.add('hidden'); });

function openInstallHelp() {
  let html, showGo = false;
  if (deferredPrompt) {
    showGo = true;
    html = '<p>Premi <b>Installa ora</b> qui sotto e conferma. In alternativa, dal menu del browser (⋮) scegli <b>"Installa app"</b>.</p>';
  } else if (isIOS()) {
    html = '<ol style="padding-left:20px;margin:0"><li>Tocca il pulsante <b>Condividi</b> (l\'icona ⬆️ in basso su iPhone).</li><li>Scorri e tocca <b>"Aggiungi alla schermata Home"</b>.</li><li>Conferma con <b>Aggiungi</b>.</li></ol><p style="opacity:.7;margin-top:8px">Su iPhone funziona con <b>Safari</b>.</p>';
  } else {
    html = '<p>Nel browser (Chrome/Edge) cerca l\'icona <b>Installa</b> (⊕) nella barra degli indirizzi, oppure menu (⋮) → <b>"Installa app"</b>.</p>';
  }
  installSteps.innerHTML = html;
  installGo.classList.toggle('hidden', !showGo);
  installHelp.classList.remove('hidden');
}
if (installBtn) installBtn.onclick = openInstallHelp;
if (installGo) installGo.onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  try { await deferredPrompt.userChoice; } catch (e) {}
  deferredPrompt = null; installHelp.classList.add('hidden'); refreshInstallBtn();
};
document.getElementById('btn-install-close').onclick = () => installHelp.classList.add('hidden');
refreshInstallBtn();

// All'AVVIO: mostra subito l'avviso di installazione (se l'app non è già installata).
// L'utente lo chiude con "Chiudi" e gioca; può riaprirlo dal pulsante "📲 Installa l'app".
if (!isStandalone()) setTimeout(() => { try { openInstallHelp(); } catch (e) {} }, 700);

// Mobile: ricalcola la scala del canvas quando cambia la viewport (rotazione, barre di Safari).
// Debounce: su iOS visualViewport.resize spamma → evitiamo di chiamare refresh in continuazione.
let _scaleT = 0;
function refreshScale() {
  clearTimeout(_scaleT);
  _scaleT = setTimeout(() => {
    try {
      if (window._GAME && window._GAME.scale) {
        const s = gameSize();
        window._GAME.scale.setGameSize(s.width, s.height);   // riadatta la larghezza alla rotazione/barre
        window._GAME.scale.refresh();
      }
    } catch (e) {}
  }, 120);
}
window.addEventListener('resize', refreshScale);
window.addEventListener('orientationchange', refreshScale);
if (window.visualViewport) window.visualViewport.addEventListener('resize', refreshScale);

// Pulsante mute (sopra agli overlay, raggiungibile anche nel menu)
const muteBtn = document.getElementById('mutebtn');
if (muteBtn) muteBtn.onclick = () => AUDIO.toggleMute();

// Musica del titolo nel menu iniziale (parte al primo gesto utente per lo sblocco autoplay)
AUDIO.playMusic('title_theme');

// ===== Schermo intero (TV): tasto F, bottone ⛶, o primo input gamepad (best-effort) =====
function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function toggleFullscreen() {
  try {
    if (isFs()) {
      const f = document.exitFullscreen || document.webkitExitFullscreen;
      if (f) { const p = f.call(document); if (p && p.catch) p.catch(() => {}); }
    } else {
      const el = document.documentElement;
      const f = el.requestFullscreen || el.webkitRequestFullscreen;
      if (f) { const p = f.call(el); if (p && p.catch) p.catch(() => {}); }
    }
  } catch (e) {}
}
const fsBtn = document.getElementById('fsbtn');
if (fsBtn) fsBtn.onclick = toggleFullscreen;
window.addEventListener('keydown', e => { if ((e.key === 'f' || e.key === 'F') && !e.repeat) toggleFullscreen(); });

// ===== Navigazione menu/overlay da GAMEPAD =====
// API Gamepad grezza in un loop rAF: funziona anche quando non c'è scena Phaser (menu) o è in pausa.
const gp = { btn: {}, axR: false, axL: false, axU: false, axD: false, idx: 0, sig: '', fsTried: false };
function visId(id) { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); }
function uiFocusables() {
  if (visId('menu')) return [...document.querySelectorAll('#cards .card')];
  if (visId('win')) return [...document.querySelectorAll('#win .btn')].filter(b => !b.classList.contains('hidden'));
  if (visId('over')) return [...document.querySelectorAll('#over .btn')];
  if (visId('pause')) return [...document.querySelectorAll('#pause .btn')];
  return [];
}
function applyGpFocus(list) {
  document.querySelectorAll('.gpfocus').forEach(e => e.classList.remove('gpfocus'));
  const el = list[gp.idx];
  if (el) { el.classList.add('gpfocus'); try { el.focus({ preventScroll: true }); } catch (e) {} }
}
function pollGamepadUI() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let pad = null;
  for (const p of pads) { if (p) { pad = p; break; } }
  if (pad) {
    const pressed = i => !!(pad.buttons[i] && pad.buttons[i].pressed);
    const edge = i => { const n = pressed(i), w = gp.btn[i]; gp.btn[i] = n; return n && !w; };
    const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    // primo input gamepad → tenta fullscreen (best-effort) + sblocca audio
    if (!gp.fsTried && (pad.buttons.some(b => b.pressed) || Math.abs(ax) > 0.5 || Math.abs(ay) > 0.5)) {
      gp.fsTried = true; AUDIO.unlock(); if (!isFs()) toggleFullscreen();
    }
    const list = uiFocusables();
    const sig = list.length + (visId('menu') ? 'm' : visId('win') ? 'w' : visId('over') ? 'o' : visId('pause') ? 'p' : '-');
    if (sig !== gp.sig) { gp.sig = sig; gp.idx = 0; if (list.length) applyGpFocus(list); }
    if (list.length) {
      const r = edge(15) || (ax > 0.5 && !gp.axR), l = edge(14) || (ax < -0.5 && !gp.axL);
      const d = edge(13) || (ay > 0.5 && !gp.axD), u = edge(12) || (ay < -0.5 && !gp.axU);
      gp.axR = ax > 0.5; gp.axL = ax < -0.5; gp.axD = ay > 0.5; gp.axU = ay < -0.5;
      const step = (r || d) ? 1 : (l || u) ? -1 : 0;
      if (step) { gp.idx = (gp.idx + step + list.length) % list.length; applyGpFocus(list); }
      if (edge(0) && list[gp.idx]) list[gp.idx].click();   // X(PS)/A(Xbox) = conferma
    }
  }
  requestAnimationFrame(pollGamepadUI);
}
requestAnimationFrame(pollGamepadUI);

// Expose globally for inline handlers (none remain, kept for safety)
window._gameRestart = restart;
window._gameToMenu = toMenu;
window._startWorld = startGame;   // debug: _startWorld('memento', 2)
