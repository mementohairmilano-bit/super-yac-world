// Elenco degli avatar raccolti (per la pagina protetta /avatars.html). Protetto da password:
// confronta ?token=... con la env ADMIN_TOKEN. Usa la SERVICE ROLE key (lato server) per leggere
// la tabella `avatars` e generare link temporanei (signed URL) agli avatar nel bucket privato.
//
// Env richieste su Vercel: ADMIN_TOKEN (la password che scegli tu) + SUPABASE_SERVICE_ROLE_KEY.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifboncpyzrtindfbnrbk.supabase.co';
const BUCKET = 'syw-avatars';

export default async function handler(req, res) {
  const ADMIN = process.env.ADMIN_TOKEN;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!ADMIN) { res.status(503).json({ error: 'ADMIN_TOKEN non configurato sul server' }); return; }
  if (!KEY) { res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configurato' }); return; }

  let token = '';
  try { token = new URL(req.url, 'http://x').searchParams.get('token') || ''; } catch (_) {}
  if (!token) token = (req.headers['x-admin-token'] || '').toString();
  if (token !== ADMIN) { res.status(401).json({ error: 'Password errata' }); return; }

  // metadati dalla tabella `avatars` (più recenti prima)
  let rows = [];
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/avatars?select=path,hero_name,nickname,email,power,created_at&order=created_at.desc&limit=300', {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
    });
    if (!r.ok) { res.status(502).json({ error: 'Lettura tabella avatars fallita (hai eseguito lo SQL?)', detail: (await r.text()).slice(0, 200) }); return; }
    rows = await r.json();
  } catch (e) { res.status(502).json({ error: 'Supabase non raggiungibile' }); return; }

  // per ogni avatar: link temporaneo firmato (il bucket è privato)
  const items = await Promise.all((rows || []).map(async (row) => {
    let url = null;
    try {
      const s = await fetch(SUPABASE_URL + '/storage/v1/object/sign/' + BUCKET + '/' + row.path, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 3600 }),
      });
      if (s.ok) { const j = await s.json(); if (j && j.signedURL) url = SUPABASE_URL + '/storage/v1' + j.signedURL; }
    } catch (_) {}
    return { path: row.path, hero_name: row.hero_name, nickname: row.nickname, email: row.email, power: row.power, created_at: row.created_at, url };
  }));

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ count: items.length, items });
}
