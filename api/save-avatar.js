// Pubblica un EROE creato dall'utente (con consenso social) così è visibile e giocabile da TUTTI.
// - carica sprite (corpo intero, per il gioco) + profilo (ritratto, per la card) in un bucket PUBLICO
// - inserisce una riga nella tabella pubblica `heroes` (nome, colore, potere, URL immagini)
// - inserisce anche una riga PRIVATA in `avatars` (nick/email) per il contatto/marketing del team
// La CHIAVE service role vive solo qui (env Vercel). Niente dati personali nella tabella pubblica.
//
// Env: SUPABASE_SERVICE_ROLE_KEY  (+ SUPABASE_URL opzionale).
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifboncpyzrtindfbnrbk.supabase.co';
const BUCKET = 'syw-heroes';   // PUBBLICO: le immagini degli eroi sono servite a tutti i giocatori

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => { s += c; });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
function toBytes(dataUrlOrB64) {
  let b = (dataUrlOrB64 || '').toString();
  const c = b.indexOf(',');
  if (b.startsWith('data:') && c >= 0) b = b.slice(c + 1);
  return b ? Buffer.from(b, 'base64') : null;
}
async function ensurePublicBucket(KEY) {
  try {
    await fetch(SUPABASE_URL + '/storage/v1/bucket', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });
  } catch (_) {}
}
async function upload(KEY, path, bytes) {
  const r = await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + path, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'image/png', 'x-upsert': 'true' },
    body: bytes,
  });
  if (!r.ok) throw new Error('upload ' + path + ' ' + r.status);
  return SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!KEY) { res.status(200).json({ ok: false, skipped: 'storage non configurato' }); return; }

  let body; try { body = await readBody(req); } catch (_) { body = {}; }
  if (!body || body.consent !== true) { res.status(400).json({ error: 'Consenso mancante' }); return; }
  const spriteBytes = toBytes(body.sprite);
  const profileBytes = toBytes(body.profile || body.image);   // image = compat vecchio client
  if (!spriteBytes && !profileBytes) { res.status(400).json({ error: 'Immagini mancanti' }); return; }
  if ((body.sprite || '').length > 4e6 || (body.profile || '').length > 4e6) { res.status(413).json({ error: 'Immagine troppo grande' }); return; }

  await ensurePublicBucket(KEY);
  const base = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

  let sprite_url = null, profile_url = null;
  try {
    if (spriteBytes) sprite_url = await upload(KEY, base + '_sprite.png', spriteBytes);
    if (profileBytes) profile_url = await upload(KEY, base + '_profile.png', profileBytes);
  } catch (e) { res.status(502).json({ error: 'Upload non riuscito' }); return; }

  const name = (body.name || body.heroName || 'Eroe').toString().slice(0, 24);
  const color = (body.color || '').toString().slice(0, 9) || null;
  const power_id = (body.powerId || '').toString().slice(0, 24) || null;

  // tabella PUBBLICA `heroes` (niente dati personali) → la home di tutti la legge
  try {
    await fetch(SUPABASE_URL + '/rest/v1/heroes', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name, color, power_id, sprite_url, profile_url, visible: true }),
    });
  } catch (_) {}

  // tabella PRIVATA `avatars` (nick/email per il team) — best-effort, join su profile_url
  try {
    await fetch(SUPABASE_URL + '/rest/v1/avatars', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        path: profile_url || sprite_url, hero_name: name,
        nickname: (body.nick || '').toString().slice(0, 32) || null,
        email: (body.email || '').toString().slice(0, 120) || null,
        power: (body.power || '').toString().slice(0, 24) || null, consent_social: true,
      }),
    });
  } catch (_) {}

  res.status(200).json({ ok: true, sprite_url, profile_url });
}
