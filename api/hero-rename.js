// Moderazione: rinomina un eroe pubblico (solo admin, password nell'intestazione x-admin-token).
// Aggiorna heroes.name (il nome mostrato nella card e nella home di tutti).
import { readBody, controllaAdmin, cleanName } from './_comune.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifboncpyzrtindfbnrbk.supabase.co';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!KEY) { res.status(503).json({ error: 'Server non configurato' }); return; }
  const ko = controllaAdmin(req);
  if (ko) { res.status(ko.status).json({ error: ko.error }); return; }
  let body; try { body = await readBody(req); } catch (_) { body = {}; }
  const id = parseInt(body.id, 10);
  if (!id) { res.status(400).json({ error: 'id mancante' }); return; }
  const name = cleanName(body.name);
  if (!name) { res.status(400).json({ error: 'Nome vuoto o non valido' }); return; }
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/heroes?id=eq.' + id, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) { res.status(502).json({ error: 'Aggiornamento fallito', detail: (await r.text()).slice(0, 200) }); return; }
  } catch (e) { res.status(502).json({ error: 'Supabase non raggiungibile' }); return; }
  res.status(200).json({ ok: true, id, name });
}
