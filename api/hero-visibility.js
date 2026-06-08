// Moderazione: mostra/nascondi un eroe dalla home pubblica (solo admin, protetto da ADMIN_TOKEN).
// Imposta heroes.visible = true/false. Reversibile (non cancella nulla).
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifboncpyzrtindfbnrbk.supabase.co';

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => { s += c; });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const ADMIN = process.env.ADMIN_TOKEN;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!ADMIN || !KEY) { res.status(503).json({ error: 'Server non configurato' }); return; }
  let body; try { body = await readBody(req); } catch (_) { body = {}; }
  if ((body.token || '') !== ADMIN) { res.status(401).json({ error: 'Password errata' }); return; }
  const id = parseInt(body.id, 10);
  if (!id) { res.status(400).json({ error: 'id mancante' }); return; }
  const visible = body.visible === true;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/heroes?id=eq.' + id, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ visible }),
    });
    if (!r.ok) { res.status(502).json({ error: 'Aggiornamento fallito', detail: (await r.text()).slice(0, 200) }); return; }
  } catch (e) { res.status(502).json({ error: 'Supabase non raggiungibile' }); return; }
  res.status(200).json({ ok: true, id, visible });
}
