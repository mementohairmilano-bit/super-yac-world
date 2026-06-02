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

// invia un punteggio (best run). Ritorna true/false. Mai lancia (rete assente = silenzioso).
export async function submitScore(nickname, score, world) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/scores', {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        nickname: sanitizeNick(nickname),
        score: Math.max(0, Math.min(9999999, Math.floor(score || 0))),
        world: world || null,
      }),
    });
    return r.ok;
  } catch (e) { return false; }
}

// top N punteggi (default 100), ordinati per punteggio. Ritorna [] in caso di errore.
export async function topScores(limit = 100) {
  try {
    const r = await fetch(
      SUPABASE_URL + '/rest/v1/scores?select=nickname,score,world&order=score.desc&limit=' + limit,
      { headers: HEADERS },
    );
    if (!r.ok) return [];
    return await r.json();
  } catch (e) { return []; }
}
