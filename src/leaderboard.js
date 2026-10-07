// Classifica globale di Super YAC World — backend Supabase (PostgREST), via fetch diretto
// (niente dipendenze). Anonimo: si invia solo nickname + punteggio (best run).
// La "publishable key" è pensata per stare nel client (vedi dashboard Supabase). Le scritture
// passano dalle funzioni SQL invia_punteggio / invia_lead (supabase/migrations): sono loro a
// controllare i valori e a non lasciar toccare le righe degli altri. Finché le funzioni non ci sono
// (404) si ripiega sulle scritture dirette di prima, così non si rompe nulla.
const SUPABASE_URL = 'https://ifboncpyzrtindfbnrbk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sNdH1VrOcZOTJ0AWe8pW_Q_d3K1chKj';
const HEADERS = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };

// pulizia nickname: niente caratteri rischiosi, max 16, fallback "Anonimo"
export function sanitizeNick(s) {
  return (s || '').replace(/[<>"'`\\\n\r\t]/g, '').trim().slice(0, 16) || 'Anonimo';
}
function clampScore(score) {
  return Math.max(0, Math.min(9999999, Math.floor(score || 0)));
}

// chiama una funzione SQL via PostgREST. Ritorna true se ok, false se la funzione ha rifiutato
// (valori non validi), null se la funzione non esiste ancora o la rete manca → si prova il ripiego.
async function rpc(nome, args) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + nome, {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (r.ok) return true;
    if (r.status === 404) return null;   // migrazione non ancora applicata
    return false;
  } catch (e) { return null; }
}

// invia un punteggio. Prima la funzione invia_punteggio (una riga per nickname, aggiornata solo se il
// punteggio è più alto). Ripiego: UPSERT per nickname (richiede l'indice unico su `nickname`); se
// anche quello fallisce, un insert semplice. Mai lancia (rete assente = silenzioso).
export async function submitScore(nickname, score, world) {
  const nick = sanitizeNick(nickname), punti = clampScore(score), mondo = world || null;
  const esito = await rpc('invia_punteggio', { p_nickname: nick, p_punteggio: punti, p_mondo: mondo });
  if (esito !== null) return esito;
  const body = JSON.stringify({ nickname: nick, score: punti, world: mondo });
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/scores?on_conflict=nickname', {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body,
    });
    if (r.ok) return true;
  } catch (e) { /* niente indice unico → fallback sotto */ }
  try {
    const r2 = await fetch(SUPABASE_URL + '/rest/v1/scores', {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body,
    });
    return r2.ok;
  } catch (e) { return false; }
}

// --- Lead generation (Badge YAC Hero) ---
// L'email NON va in `scores` (leggibile pubblicamente da topScores): finirebbe scaricabile
// da chiunque. Va nella tabella separata `leads`, che il client non può leggere.

// validazione email minimale: trim + lowercase + formato base. Ritorna '' se non valida.
export function validateEmail(s) {
  const e = (s || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}

// salva un lead (email + punteggio) per sbloccare il badge. `consent` è il valore VERO della casella
// spuntata nel form: lo scrive così com'è (la funzione SQL rifiuta se non è true). Ritorna
// true/false, mai lancia (stesso pattern di submitScore).
export async function submitLead({ nickname, email, score, world, tier, consent }) {
  // voci rimaste in coda dalla versione precedente non hanno il campo: lì la casella era obbligatoria
  const consenso = consent === undefined ? true : consent === true;
  const nick = sanitizeNick(nickname), punti = clampScore(score), mondo = world || null, livello = tier || null;
  const esito = await rpc('invia_lead', {
    p_email: validateEmail(email) || email, p_nickname: nick, p_punteggio: punti, p_mondo: mondo, p_livello: livello, p_consenso: consenso,
  });
  if (esito !== null) return esito;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/leads', {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        nickname: nick,
        email: validateEmail(email) || email,
        score: punti,
        world: mondo,
        tier: livello,
        consent: consenso,
        source: 'game',
      }),
    });
    return r.ok;
  } catch (e) { return false; }
}

// EROI DELLA COMMUNITY: gli eroi pubblici (creati con consenso e approvati dalla pagina admin) che
// compaiono nella home di tutti i giocatori. Lettura pubblica (publishable key + RLS select su visible=true).
export async function fetchPublicHeroes(limit = 100) {
  try {
    const r = await fetch(
      SUPABASE_URL + '/rest/v1/heroes?select=id,name,color,power_id,sprite_url,profile_url&visible=eq.true&order=created_at.desc&limit=' + limit,
      { headers: HEADERS },
    );
    if (!r.ok) return [];
    return await r.json();
  } catch (e) { return []; }
}

// top N punteggi, ordinati per punteggio. Tiene SOLO il miglior punteggio per nickname
// (dedup lato client): così, anche se nel DB ci sono righe duplicate dello stesso utente,
// in classifica ogni giocatore compare UNA volta sola. Ritorna [] in caso di errore.
export async function topScores(limit = 100) {
  try {
    const r = await fetch(
      SUPABASE_URL + '/rest/v1/scores?select=nickname,score,world&order=score.desc&limit=1000',
      { headers: HEADERS },
    );
    if (!r.ok) return [];
    const rows = await r.json();
    const best = new Map();   // nickname → riga col punteggio più alto (le righe sono già desc)
    for (const row of rows) {
      const n = (row.nickname || '').trim().toLowerCase();
      if (!best.has(n)) best.set(n, row);
    }
    return Array.from(best.values()).sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (e) { return []; }
}
