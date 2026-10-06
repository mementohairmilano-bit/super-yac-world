// Pubblica un EROE creato dall'utente (col consenso alla pubblicazione) perché possa comparire nella
// home di tutti i giocatori.
// - carica sprite (corpo intero, per il gioco) + profilo (ritratto, per la card) in un bucket PUBBLICO
// - inserisce una riga in `heroes` NASCOSTA (visible=false): si pubblica dalla pagina admin dopo un'occhiata
// - prova a registrare in `avatars` (tabella privata) nick/email e il testo del consenso accettato
// La CHIAVE service role vive solo qui (env Vercel). Niente dati personali nella tabella pubblica.
//
// Difese: consenso obbligatorio, solo PNG veri (firma dei byte) fino a 300 kB e 512 px per lato,
// nome ripulito come nella rinomina, al massimo 10 pubblicazioni l'ora per indirizzo (contatore in
// memoria, per istanza: ferma uno script senza bloccare un salone col Wi-Fi condiviso).
//
// Env: SUPABASE_SERVICE_ROLE_KEY  (+ SUPABASE_URL opzionale).
import { readBody, ipDi, limita, cleanName } from './_comune.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifboncpyzrtindfbnrbk.supabase.co';
const BUCKET = 'syw-heroes';   // PUBBLICO: le immagini degli eroi sono servite a tutti i giocatori
const MAX_BYTES = 300 * 1024;
const MAX_PX = 512;            // il client produce sprite entro 256 px e ritratti 256x256
const MAX_B64 = Math.ceil(MAX_BYTES * 4 / 3) + 64;   // lunghezza massima del base64 (col prefisso data:)
// testo della casella che l'utente ha spuntato: resta scritto accanto al consenso registrato
const TESTO_CONSENSO = 'Il mio avatar viene pubblicato nel gioco, visibile a tutti, e può essere usato nei social di YAC.';
const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// decodifica base64 (con o senza prefisso data:) e accetta SOLO un PNG vero: firma, peso, lati.
// Ritorna { bytes } (bytes null se il campo è vuoto) oppure { errore, status }.
function pngDaBase64(dataUrlOrB64) {
  let b = (dataUrlOrB64 == null ? '' : dataUrlOrB64).toString();
  if (!b) return { bytes: null };
  if (b.length > MAX_B64) return { errore: 'Immagine troppo grande', status: 413 };
  const c = b.indexOf(',');
  if (b.startsWith('data:') && c >= 0) b = b.slice(c + 1);
  const bytes = Buffer.from(b, 'base64');
  if (bytes.length > MAX_BYTES) return { errore: 'Immagine troppo grande', status: 413 };
  // firma (8 byte) + chunk IHDR: larghezza e altezza stanno ai byte 16-23
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(FIRMA_PNG) || bytes.toString('latin1', 12, 16) !== 'IHDR') {
    return { errore: 'Il file non è un PNG', status: 415 };
  }
  const w = bytes.readUInt32BE(16), h = bytes.readUInt32BE(20);
  if (!w || !h || w > MAX_PX || h > MAX_PX) return { errore: 'Immagine fuori misura', status: 415 };
  return { bytes };
}
async function ensurePublicBucket(KEY) {
  // se il bucket esiste già risponde 409 e non cambia nulla (i limiti vanno messi dalla dashboard o
  // con la migrazione): qui servono solo alla prima creazione
  try {
    await fetch(SUPABASE_URL + '/storage/v1/bucket', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_BYTES, allowed_mime_types: ['image/png'] }),
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
  if (!limita('eroe:' + ipDi(req), 10)) { res.status(429).json({ error: 'troppe pubblicazioni da questa rete nell\'ultima ora, riprova più tardi' }); return; }

  const sp = pngDaBase64(body.sprite);
  const pr = pngDaBase64(body.profile || body.image);   // image = compat vecchio client
  const ko = sp.errore ? sp : pr.errore ? pr : null;
  if (ko) { res.status(ko.status).json({ error: ko.errore }); return; }
  if (!sp.bytes && !pr.bytes) { res.status(400).json({ error: 'Immagini mancanti' }); return; }

  await ensurePublicBucket(KEY);
  const base = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

  let sprite_url = null, profile_url = null;
  try {
    if (sp.bytes) sprite_url = await upload(KEY, base + '_sprite.png', sp.bytes);
    if (pr.bytes) profile_url = await upload(KEY, base + '_profile.png', pr.bytes);
  } catch (e) { res.status(502).json({ error: 'Upload non riuscito' }); return; }

  const name = cleanName(body.name || body.heroName) || 'Eroe';
  const color = (body.color || '').toString().slice(0, 9) || null;
  const power_id = (body.powerId || '').toString().slice(0, 24) || null;

  // tabella PUBBLICA `heroes` (niente dati personali): nasce nascosta, la home la mostra solo dopo
  // l'ok dalla pagina admin (visible=true)
  try {
    await fetch(SUPABASE_URL + '/rest/v1/heroes', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name, color, power_id, sprite_url, profile_url, visible: false }),
    });
  } catch (_) {}

  // tabella PRIVATA `avatars` (nick/email + consenso registrato, per ritrovare l'eroe di chi chiede la
  // cancellazione) — best-effort, join su profile_url. Esiste solo dopo la migrazione 202610071202.
  try {
    await fetch(SUPABASE_URL + '/rest/v1/avatars', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        path: profile_url || sprite_url, hero_name: name,
        nickname: (body.nick || '').toString().slice(0, 32) || null,
        email: (body.email || '').toString().slice(0, 120) || null,
        power: (body.power || '').toString().slice(0, 24) || null,
        consent_social: true, consent_text: TESTO_CONSENSO,
      }),
    });
  } catch (_) {}

  res.status(200).json({ ok: true, sprite_url, profile_url, pending: true });
}
