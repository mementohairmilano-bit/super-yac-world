// Elenco degli EROI pubblici (per la pagina admin /avatars.html): immagini + nick/email (privati,
// uniti dalla tabella `avatars`) + stato visibile. Protetto da password (ADMIN_TOKEN).
// Usa la service role key (lato server) per leggere anche i dati privati.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifboncpyzrtindfbnrbk.supabase.co';

export default async function handler(req, res) {
  const ADMIN = process.env.ADMIN_TOKEN;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!ADMIN) { res.status(503).json({ error: 'ADMIN_TOKEN non configurato sul server' }); return; }
  if (!KEY) { res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configurato' }); return; }
  let token = '';
  try { token = new URL(req.url, 'http://x').searchParams.get('token') || ''; } catch (_) {}
  if (!token) token = (req.headers['x-admin-token'] || '').toString();
  if (token !== ADMIN) { res.status(401).json({ error: 'Password errata' }); return; }

  const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
  let heroes = [], avatars = [];
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/heroes?select=id,name,color,power_id,sprite_url,profile_url,visible,created_at&order=created_at.desc&limit=500', { headers: H });
    if (!r.ok) { res.status(502).json({ error: 'Lettura `heroes` fallita (hai eseguito lo SQL?)', detail: (await r.text()).slice(0, 200) }); return; }
    heroes = await r.json();
  } catch (e) { res.status(502).json({ error: 'Supabase non raggiungibile' }); return; }
  // email/nick privati (best-effort) per arricchire la lista
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/avatars?select=path,nickname,email&order=created_at.desc&limit=500', { headers: H });
    if (r.ok) avatars = await r.json();
  } catch (_) {}
  const byPath = {};
  avatars.forEach((a) => { if (a.path && !byPath[a.path]) byPath[a.path] = a; });

  const items = heroes.map((h) => {
    const a = byPath[h.profile_url] || byPath[h.sprite_url] || {};
    return { id: h.id, name: h.name, color: h.color, power_id: h.power_id, url: h.profile_url || h.sprite_url, visible: h.visible, created_at: h.created_at, nickname: a.nickname || null, email: a.email || null };
  });
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ count: items.length, items });
}
