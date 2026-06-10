// Classifica globale di Super Yac World — backend Supabase (PostgREST), via fetch diretto
// (niente dipendenze). Anonimo: si invia solo nickname + punteggio (best run).
// La "publishable key" è pensata per stare nel client (vedi dashboard Supabase) e le regole
// RLS sulla tabella `scores` permettono solo insert/select anonimi — niente modifica/cancellazione.
const SUPABASE_URL = 'https://ifboncpyzrtindfbnrbk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sNdH1VrOcZOTJ0AWe8pW_Q_d3K1chKj';
const HEADERS = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };

// pulizia nickname: niente caratteri rischiosi, max 16, fallback "Anonimo"
export function sanitizeNick(s) {
  return (s || '').replace(/[<>"'`\\\n\r\t]/g, '').trim().slice(0, 16) || 'Anonimo';
}

// invia un punteggio. UPSERT per nickname → UNA sola riga per giocatore (niente classifica
// invasa dai doppioni dello stesso utente). Richiede un indice unico su `nickname` (vedi SQL):
// se non c'è ancora, l'upsert fallisce e si ripiega su un insert semplice (così non si rompe nulla).
// Mai lancia (rete assente = silenzioso).
export async function submitScore(nickname, score, world) {
  const body = JSON.stringify({
    nickname: sanitizeNick(nickname),
    score: Math.max(0, Math.min(9999999, Math.floor(score || 0))),
    world: world || null,
  });
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
// da chiunque. Va nella tabella separata `leads`, SOLO-scrittura per anon (policy RLS:
// insert sì, select/update/delete no), così le email non sono leggibili dal client.
// Vedi lo SQL nel piano per crearla in dashboard Supabase.

// validazione email minimale: trim + lowercase + formato base. Ritorna '' se non valida.
export function validateEmail(s) {
  const e = (s || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}

// salva un lead (email + punteggio) per sbloccare il badge. consent sempre true (lo richiediamo
// nel form). Ritorna true/false, mai lancia (stesso pattern di submitScore).
export async function submitLead({ nickname, email, score, world, tier }) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/leads', {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        nickname: sanitizeNick(nickname),
        email: validateEmail(email) || email,
        score: Math.max(0, Math.min(9999999, Math.floor(score || 0))),
        world: world || null,
        tier: tier || null,
        consent: true,
        source: 'game',
      }),
    });
    return r.ok;
  } catch (e) { return false; }
}

// EROI DELLA COMMUNITY: gli eroi pubblici (creati con consenso social) che compaiono nella home
// di tutti i giocatori. Lettura pubblica (publishable key + RLS select su visible=true).
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
