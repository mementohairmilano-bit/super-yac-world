// Shared game state accessible by any module

// --- Lettere nascoste (FREEDOM): meta-progresso che persiste tra mondi e partite ---
// 7 lettere (id 0..6 → F R E E D O M): Mondi 1-5 una ciascuno, il Mondo 6 (climax) ne
// ha due (6-1 e 6-2). Salvate in localStorage così la raccolta sopravvive ai cambi di
// mondo e ai reload: trovarle tutte sblocca la card segreta del finale (chiusura.md,
// Beat 7). Tema: spezzi le catene → FREEDOM (coerente con lo slogan "Break the Mold").
export const SECRET_WORD = ['F', 'R', 'E', 'E', 'D', 'O', 'M'];
const LKEY = 'syw_letters';

function loadLetters() {
  try { const v = JSON.parse(localStorage.getItem(LKEY)); return Array.isArray(v) ? v : []; }
  catch (e) { return []; }
}
function saveLetters() {
  try { localStorage.setItem(LKEY, JSON.stringify(state.letters)); } catch (e) {}
}

export const state = {
  selectedKey: 'memento',
  cfg: null,
  worldId: 1,   // mondo corrente
  level: null,  // definizione del mondo corrente (da levels.js)
  letters: loadLetters(),   // id delle lettere FREEDOM già raccolte
  runScore: 0,   // punteggio CUMULATIVO della partita in corso (si porta tra i mondi)
};

export function collectLetter(id) {
  if (!state.letters.includes(id)) { state.letters.push(id); saveLetters(); }
}
export function hasLetter(id) { return state.letters.includes(id); }
export function hasAllLetters() { return SECRET_WORD.every((_, i) => state.letters.includes(i)); }
export function resetLetters() { state.letters = []; saveLetters(); }

// --- Salvataggio "Continua" (locale) + record personale (miglior partita) ---
// Una partita in corso = { world, char, runScore }. Scritta a fine di ogni mondo con un
// "prossimo"; cancellata a game over / fine gioco / nuova partita. Il record è il punteggio
// più alto mai raggiunto (per la classifica useremo lo stesso valore di run, vedi Fase 2).
const SKEY = 'syw_save', BKEY = 'syw_best', NKEY = 'syw_nick';

export function loadRun() {
  try { const v = JSON.parse(localStorage.getItem(SKEY)); return (v && v.world) ? v : null; }
  catch (e) { return null; }
}
export function saveRun(run) { try { localStorage.setItem(SKEY, JSON.stringify(run)); } catch (e) {} }
export function clearRun() { try { localStorage.removeItem(SKEY); } catch (e) {} }

export function getBest() { try { return parseInt(localStorage.getItem(BKEY), 10) || 0; } catch (e) { return 0; } }
export function setBest(n) { try { if (n > getBest()) localStorage.setItem(BKEY, String(n)); } catch (e) {} }

// nickname per la classifica (Fase 2): ricordato così lo si chiede una volta sola
export function getNick() { try { return localStorage.getItem(NKEY) || ''; } catch (e) { return ''; } }
export function setNick(s) { try { localStorage.setItem(NKEY, s); } catch (e) {} }
