// Gestore audio centrale di SUPER YAC WORLD (musica + effetti).
// Vanilla HTML5 Audio: persiste tra il menu DOM e le partite Phaser (che vengono
// distrutte/ricreate), così il title_theme suona già nel menu e la musica non si
// interrompe ai restart. Volumi: musica ~0.4, effetti ~0.7.

const MUSIC = ['title_theme', 'mondo1_loop', 'underground_loop', 'boss_loop', 'game_over',
  'mondo2_loop', 'mondo2_water_loop', 'mondo2_tower_loop', 'mondo2_boss_loop',
  'mondo3_loop', 'mondo3_net_loop', 'mondo3_heights_loop', 'mondo3_boss_loop',
  'mondo4_loop', 'mondo4_basement_loop', 'mondo4_reactor_loop', 'mondo4_boss_loop',
  'mondo5_loop', 'mondo5_vault_loop', 'mondo5_penthouse_loop', 'mondo5_boss_loop',
  'mondo6_plaza_loop', 'mondo6_foundations_loop', 'mondo6_ascent_loop', 'mondo6_boss_loop',
  'finale_theme'];
// tutte le tracce sono ora .ogg (convertite da WAV: ~10x più leggere → meno memoria/più fluido,
// e cache offline molto più piccola). Mappa estensioni vuota = tutto .ogg.
const MUSIC_EXT = {};
const SFX = ['jump', 'coin', 'stomp', 'powerup_grow', 'shrink', 'hit_damage', 'one_up',
  'brick_break', 'kick_shell', 'pipe_enter', 'level_clear', 'death', 'boss_hit',
  'boss_shot', 'boss_defeat', 'salon_liberation',
  'flyer_throw', 'spraybill', 'flash', 'boss_zap',
  'goccia_drop', 'acid_splash', 'acid_sizzle', 'vapor',
  'bolletta_fire', 'chart_crash', 'laser_zap', 'uni_summon',
  'mask_absorb', 'phase_shift', 'core_hit',
  'firework', 'score_tick', 'shoot', 'star',
  'letter_get', 'chain_break'];
// tutti gli SFX sono ora .ogg (convertiti da WAV). Mappa vuota = tutto .ogg.
const SFX_EXT = {};

class AudioManager {
  constructor() {
    this.musicVol = 0.4;
    this.sfxVol = 0.7;
    this.muted = false;
    this.unlocked = false;     // i browser bloccano l'audio finché non c'è un gesto utente
    this.current = null;       // chiave musica corrente
    this.currentEl = null;     // <audio> corrente
    this.pending = null;       // musica richiesta prima dello sblocco
    this.music = {};
    this.sfxUrl = {};

    MUSIC.forEach(k => {
      const a = new Audio('./assets/audio/music/' + k + '.' + (MUSIC_EXT[k] || 'ogg'));
      a.loop = (k !== 'game_over');     // tutte in loop tranne game_over
      a.volume = this.musicVol;
      // preload 'none': le 24 tracce (~8 MB di WAV/OGG) NON si scaricano tutte all'avvio — ognuna
      // si carica quando serve. Su iPhone (PWA) questo elimina il picco di banda/CPU iniziale e la
      // pressione di memoria che causavano lo "scatto"/ritardo del gioco. La traccia parte appena pronta.
      a.preload = 'none';
      this.music[k] = a;
    });
    this.sfxPool = {};   // pool di elementi audio riusabili per ogni effetto (no alloc per suono)
    SFX.forEach(k => { this.sfxUrl[k] = './assets/audio/sfx/' + k + '.' + (SFX_EXT[k] || 'ogg'); });
  }

  // pool di 4 elementi riusabili per una chiave SFX (creato la prima volta che serve)
  _pool(key) {
    let pool = this.sfxPool[key];
    if (!pool) {
      pool = this.sfxPool[key] = { els: [], i: 0 };
      for (let j = 0; j < 4; j++) { const a = new Audio(this.sfxUrl[key]); a.preload = 'auto'; pool.els.push(a); }
    }
    return pool;
  }

  // chiamato al primo input utente (pointerdown/keydown)
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    // iOS: un breve play silenzioso durante il gesto utente sblocca l'audio HTML5 anche per gli
    // effetti avviati poi dalla LOGICA di gioco (morte, fine livello). NB: NON pre-creo tutti i pool:
    // crearne ~160 elementi audio causava forte pressione di memoria su iPhone (= freeze). I pool
    // restano creati pigramente al primo uso di ciascun effetto.
    try {
      const a = this._pool('coin').els[0];
      const v = a.volume; a.muted = true;
      const reset = () => { try { a.pause(); a.currentTime = 0; } catch (e) {} a.muted = false; a.volume = v; };
      const pr = a.play();
      if (pr && pr.then) pr.then(reset).catch(reset); else reset();
    } catch (e) {}
    if (this.pending) { const k = this.pending; this.pending = null; this._start(k); }
  }

  // ferma la musica corrente e avvia quella nuova in loop; se è già la stessa non riavvia
  playMusic(key) {
    if (!this.music[key]) return;
    if (this.current === key && this.currentEl && !this.currentEl.paused) return;
    if (!this.unlocked) { this.pending = key; this.current = key; return; }
    this._start(key);
  }

  _start(key) {
    this.stopMusic();
    const a = this.music[key];
    this.current = key; this.currentEl = a;
    try { a.currentTime = 0; } catch (e) {}
    a.muted = this.muted; a.volume = this.musicVol;
    a.play().catch(() => {});
  }

  stopMusic() {
    if (this.currentEl) { try { this.currentEl.pause(); this.currentEl.currentTime = 0; } catch (e) {} }
    this.currentEl = null; this.current = null;
  }

  // effetto one-shot: riusa un POOL di 4 elementi per chiave (niente allocazioni a ogni
  // suono → meno garbage collection → meno scatti su mobile). Si sovrappongono comunque.
  sfx(key) {
    if (this.muted || !this.sfxUrl[key]) return;
    const pool = this._pool(key);
    const a = pool.els[pool.i]; pool.i = (pool.i + 1) % pool.els.length;
    try { a.currentTime = 0; } catch (e) {}
    a.volume = this.sfxVol;
    a.play().catch(() => {});
  }

  toggleMute() {
    this.muted = !this.muted;
    Object.values(this.music).forEach(a => { a.muted = this.muted; });
    this._updateBtn();
    return this.muted;
  }

  _updateBtn() {
    const b = document.getElementById('mutebtn');
    if (b) { b.textContent = this.muted ? '🔇' : '🔊'; b.classList.toggle('off', this.muted); }
  }
}

export const AUDIO = new AudioManager();

// --- sblocco autoplay al primo gesto utente ---
function unlockOnce() {
  AUDIO.unlock();
  window.removeEventListener('pointerdown', unlockOnce);
  window.removeEventListener('keydown', unlockOnce);
}
window.addEventListener('pointerdown', unlockOnce);
window.addEventListener('keydown', unlockOnce);

// --- mute con tasto M (ovunque: menu + gioco) ---
window.addEventListener('keydown', e => {
  if ((e.key === 'm' || e.key === 'M') && !e.repeat) AUDIO.toggleMute();
});
