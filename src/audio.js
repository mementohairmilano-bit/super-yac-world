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
// le tracce dei Mondi 2, 3, 4, 5 e 6 sono WAV sintetizzate (le altre sono .ogg)
const MUSIC_EXT = {
  mondo2_loop: 'wav', mondo2_water_loop: 'wav', mondo2_tower_loop: 'wav', mondo2_boss_loop: 'wav',
  mondo3_loop: 'wav', mondo3_net_loop: 'wav', mondo3_heights_loop: 'wav', mondo3_boss_loop: 'wav',
  mondo4_loop: 'wav', mondo4_basement_loop: 'wav', mondo4_reactor_loop: 'wav', mondo4_boss_loop: 'wav',
  mondo5_loop: 'wav', mondo5_vault_loop: 'wav', mondo5_penthouse_loop: 'wav', mondo5_boss_loop: 'wav',
  mondo6_plaza_loop: 'wav', mondo6_foundations_loop: 'wav', mondo6_ascent_loop: 'wav', mondo6_boss_loop: 'wav',
  finale_theme: 'wav',
};
const SFX = ['jump', 'coin', 'stomp', 'powerup_grow', 'shrink', 'hit_damage', 'one_up',
  'brick_break', 'kick_shell', 'pipe_enter', 'level_clear', 'death', 'boss_hit',
  'boss_shot', 'boss_defeat', 'salon_liberation',
  'flyer_throw', 'spraybill', 'flash', 'boss_zap',
  'goccia_drop', 'acid_splash', 'acid_sizzle', 'vapor',
  'bolletta_fire', 'chart_crash', 'laser_zap', 'uni_summon',
  'mask_absorb', 'phase_shift', 'core_hit',
  'firework', 'score_tick', 'shoot', 'star',
  'letter_get', 'chain_break'];
// gli SFX dei Mondi 3-6 + FX di gioco sono WAV sintetizzati (gli altri sono .ogg)
const SFX_EXT = { flyer_throw: 'wav', spraybill: 'wav', flash: 'wav', boss_zap: 'wav',
  goccia_drop: 'wav', acid_splash: 'wav', acid_sizzle: 'wav', vapor: 'wav',
  bolletta_fire: 'wav', chart_crash: 'wav', laser_zap: 'wav', uni_summon: 'wav',
  mask_absorb: 'wav', phase_shift: 'wav', core_hit: 'wav',
  firework: 'wav', score_tick: 'wav', shoot: 'wav', star: 'wav',
  letter_get: 'wav', chain_break: 'wav' };

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
      a.preload = 'auto';
      this.music[k] = a;
    });
    SFX.forEach(k => {
      this.sfxUrl[k] = './assets/audio/sfx/' + k + '.' + (SFX_EXT[k] || 'ogg');
      const warm = new Audio(this.sfxUrl[k]); warm.preload = 'auto';  // pre-carica in cache
    });
  }

  // chiamato al primo input utente (pointerdown/keydown)
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
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

  // effetto one-shot (nuovo elemento ogni volta così possono sovrapporsi)
  sfx(key) {
    if (this.muted || !this.sfxUrl[key]) return;
    const a = new Audio(this.sfxUrl[key]);
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
