// Funzione serverless (Vercel) — salva l'AVATAR GENERATO su Supabase Storage, così il team YAC
// puo' riusarlo per i contenuti social. Si attiva SOLO se l'utente ha dato il consenso dedicato
// (checkbox nel creatore). Non salva mai la foto originale: solo il personaggio stilizzato.
//
// Sicurezza: usa la SERVICE ROLE key di Supabase, che NON puo' stare nel browser → vive qui, in
// SUPABASE_SERVICE_ROLE_KEY (Environment Variables di Vercel). Il bucket resta PRIVATO: gli avatar
// sono accessibili solo dalla dashboard Supabase (o con la service key).
//
// Env richieste su Vercel: SUPABASE_SERVICE_ROLE_KEY  (SUPABASE_URL opzionale, default sotto).

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifboncpyzrtindfbnrbk.supabase.co';
const BUCKET = 'syw-avatars';

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

// nome file "sicuro" dal nickname/eroe (niente caratteri rischiosi nei path)
function slug(s) {
  return (s || '').toString().normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'eroe';
}

async function ensureBucket(KEY) {
  // crea il bucket privato se non esiste (idempotente: se c'è già, l'errore viene ignorato)
  try {
    await fetch(SUPABASE_URL + '/storage/v1/bucket', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
    });
  } catch (_) {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // senza service key non possiamo salvare: NON è un errore bloccante per l'utente (l'avatar gli funziona lo stesso)
  if (!KEY) { res.status(200).json({ ok: false, skipped: 'storage non configurato' }); return; }

  let body;
  try { body = await readBody(req); } catch (_) { body = {}; }
  if (!body || body.consent !== true) { res.status(400).json({ error: 'Consenso mancante' }); return; }

  // immagine: data-URL PNG o base64 puro
  let b64 = (body.image || '').toString();
  const comma = b64.indexOf(',');
  if (b64.startsWith('data:') && comma >= 0) b64 = b64.slice(comma + 1);
  if (!b64) { res.status(400).json({ error: 'Immagine mancante' }); return; }
  if (b64.length > 4 * 1024 * 1024) { res.status(413).json({ error: 'Immagine troppo grande' }); return; }

  let bytes;
  try { bytes = Buffer.from(b64, 'base64'); } catch (_) { res.status(400).json({ error: 'Immagine non valida' }); return; }

  const now = new Date();
  const day = now.toISOString().slice(0, 10);                 // YYYY-MM-DD
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const name = slug(body.heroName || body.nick);
  const path = day + '/' + stamp + '_' + name + '.png';

  await ensureBucket(KEY);

  // upload su Storage (privato). x-upsert: non sovrascrive nulla (path univoco per timestamp).
  let up;
  try {
    up = await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + path, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'image/png', 'x-upsert': 'true' },
      body: bytes,
    });
  } catch (e) { res.status(502).json({ error: 'Upload non riuscito' }); return; }
  if (!up.ok) {
    let d = ''; try { d = await up.text(); } catch (_) {}
    res.status(502).json({ error: 'Upload non riuscito', detail: d.slice(0, 200) });
    return;
  }

  // metadati (best-effort): collega l'avatar a nickname/email/eroe in una tabella per ritrovarli.
  // Se la tabella `avatars` non esiste, l'insert fallisce in silenzio: l'immagine è comunque salvata.
  try {
    await fetch(SUPABASE_URL + '/rest/v1/avatars', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        path,
        hero_name: (body.heroName || '').toString().slice(0, 32) || null,
        nickname: (body.nick || '').toString().slice(0, 32) || null,
        email: (body.email || '').toString().slice(0, 120) || null,
        power: (body.power || '').toString().slice(0, 24) || null,
        consent_social: true,
      }),
    });
  } catch (_) {}

  res.status(200).json({ ok: true, path });
}
