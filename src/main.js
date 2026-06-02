import Phaser from 'phaser';
import { CHARACTERS } from './config.js';
import { state, loadRun, clearRun, getBest, getNick, setNick } from './state.js';
import { LEVELS } from './levels.js';
import { submitScore, topScores, sanitizeNick } from './leaderboard.js';
import { GameScene } from './scenes/GameScene.js';
import { AUDIO } from './audio.js';
// portrait con margine (NON ritagliati) così il volto si può centrare nel riquadro della card
import mementoImg from '../assets/Memento_card.png';
import yuriImg from '../assets/Yuri_card.png';
import carmineImg from '../assets/carmine_card.png';
import andreaImg from '../assets/andrea_card.png';

const CARD_IMG = { memento: mementoImg, yuri: yuriImg, carmine: carmineImg, andrea: andreaImg };
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

function startGame(key, worldId = 1, opts = {}) {
  // Gestione punteggio CUMULATIVO della run:
  //  - newRun (clic su una card) → azzera e cancella il salvataggio
  //  - resumeScore (Continua)    → riprende il totale salvato
  //  - altrimenti (prossimo mondo / ricomincia) → mantiene il totale corrente
  if (opts.newRun) { state.runScore = 0; clearRun(); }
  else if (opts.resumeScore != null) state.runScore = opts.resumeScore;

  SELECTED = key;
  WORLD_ID = LEVELS[worldId] ? worldId : 1;
  state.selectedKey = key;
  state.cfg = CHARACTERS[key];
  state.worldId = WORLD_ID;
  state.level = LEVELS[WORLD_ID];

  ['menu', 'win', 'over', 'pause'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('pausebtn').classList.remove('hidden');
  if (isTouch()) document.getElementById('touch').classList.remove('hidden');
  document.body.classList.add('in-game');   // attiva l'invito "ruota il telefono" in portrait

  if (GAME) { GAME.destroy(true); GAME = null; }

  GAME = window._GAME = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 560,    // ~17 blocchi visibili (zoom stile Super Mario Bros); altezza piena 506
      height: 506,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 1150 } },
    },
    input: { gamepad: true },   // controller PS/Xbox/generici (Gamepad API)
    scene: [GameScene],
  });
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
}
if (continuaBtn) continuaBtn.onclick = () => {
  const run = loadRun(); if (!run) return;
  startGame(run.char || SELECTED, run.world, { resumeScore: run.runScore || 0 });
};
refreshMenu();

// Set logo images
const logoUrl = new URL('../assets/logo_yac.png', import.meta.url).href;
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

function openBoard(submit) {
  if (submit && window._runResult) {
    boardSubmit.classList.remove('hidden');
    boardMyScore.textContent = window._runResult.score + ' pt';
    boardNick.value = getNick();
    boardSend.disabled = false; boardSend.textContent = 'Invia in classifica';
  } else {
    boardSubmit.classList.add('hidden');
  }
  boardEl.classList.remove('hidden');
  loadBoard();
}
function closeBoard() { boardEl.classList.add('hidden'); }

if (boardSend) boardSend.onclick = async () => {
  const nick = sanitizeNick(boardNick.value);
  if (!window._runResult) return;
  setNick(nick);
  boardSend.disabled = true; boardSend.textContent = 'Invio…';
  const ok = await submitScore(nick, window._runResult.score, window._runResult.world);
  boardSend.textContent = ok ? 'Inviato ✓' : 'Errore — riprova';
  boardSend.disabled = !ok;
  if (ok) loadBoard();
};
document.getElementById('btn-board-menu').addEventListener('click', () => openBoard(false));
document.getElementById('btn-board-over').addEventListener('click', () => openBoard(true));
document.getElementById('btn-board-win').addEventListener('click', () => openBoard(true));
document.getElementById('btn-board-close').addEventListener('click', closeBoard);
// esposto alla GameScene per mostrare il pulsante "Classifica" sulla card del finale
window._gameShowBoardBtn = (show) => document.getElementById('btn-board-win').classList.toggle('hidden', !show);

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
  let _swReloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (_swReloaded) return; _swReloaded = true; location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.update();
      setInterval(() => reg.update(), 60000);   // controlla aggiornamenti ogni minuto
    }).catch(() => {});
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
  _scaleT = setTimeout(() => { try { if (window._GAME && window._GAME.scale) window._GAME.scale.refresh(); } catch (e) {} }, 120);
}
window.addEventListener('resize', refreshScale);
window.addEventListener('orientationchange', refreshScale);
if (window.visualViewport) window.visualViewport.addEventListener('resize', refreshScale);

// Debug opzionale (apri il sito con ?debug): mostra se il loop gira.
// P = frame del rAF di pagina · U = frame dell'update di Phaser · S = stato scena.
// cattura errori da QUALSIASI punto (update, callback, tween) per il debug
window.addEventListener('error', (e) => {
  if (!window.__dbgErr) window.__dbgErr = (e.message || 'err') + (e.lineno ? ' @' + e.lineno + ':' + e.colno : '');
});
if (/[?&]debug/.test(location.search)) {
  const dbg = document.getElementById('dbg');
  if (dbg) {
    dbg.style.display = 'block';
    window.__dbgP = 0;
    const tick = () => {
      window.__dbgP++;
      // aggiorno il testo solo ~4 volte al secondo (non a ogni frame) per non causare scatti
      if (window.__dbgP % 15 === 0) {
        dbg.textContent = 'P:' + window.__dbgP + ' U:' + (window.__dbgU || 0) + ' S:' + (window.__dbgState || '-')
          + '\nTap:' + (window.__dbgPress || 0) + ' (' + (window.__dbgLast || '-') + ') T:' + (window.__dbgT || '-')
          + (window.__dbgErr ? '\nERR: ' + window.__dbgErr : '');
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

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
