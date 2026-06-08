// Funzione serverless (Vercel) — genera l'avatar dell'"eroe personalizzato" dalla foto dell'utente
// con Gemini 2.5 Flash Image ("Nano Banana"). La CHIAVE non può stare nel browser: vive qui, in
// GEMINI_API_KEY (Environment Variables di Vercel). Il client manda la foto (base64, ridotta), noi
// chiediamo a Gemini un personaggio chibi 2D su SFONDO VERDE chroma-key, e restituiamo il PNG
// generato. La rimozione dello sfondo (→ sprite trasparente) avviene lato client su canvas, così
// qui non servono dipendenze native (sharp) e la funzione resta leggera.
//
// Privacy: la foto transita da Google solo per generare l'immagine; noi non la salviamo.

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';

// Verde chroma-key (#00E000): tinta satura assente nei volti/capelli → facile da togliere lato client.
const PROMPT = [
  'Transform the person in this photo into a cute full-body 2D platformer game character (chibi mascot style),',
  'cel-shaded with clean bold outlines and flat vibrant colors, like a Super Mario / indie platformer hero.',
  'Keep the person clearly recognizable: same hairstyle and hair color, same skin tone, glasses/beard if present,',
  'and an outfit inspired by their clothes. Friendly heroic pose.',
  'Show the character in a 3/4 view turned toward the RIGHT (body and feet oriented to the right, as if walking to the right),',
  'with the face clearly visible. Full body head to feet, centered.',
  'IMPORTANT: place the character on a COMPLETELY SOLID flat chroma-key background of pure bright green (#00E000),',
  'no shadows on the background, no gradients, no scenery, no text, no border. Single character only.',
].join(' ');

function readBody(req) {
  // Vercel di solito popola req.body per application/json; fallback allo stream grezzo.
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) { res.status(500).json({ error: 'GEMINI_API_KEY non configurata sul server' }); return; }

  let body;
  try { body = await readBody(req); } catch (_) { body = {}; }
  const image = body && body.image;            // base64 puro (senza prefisso data:)
  const mime = (body && body.mime) || 'image/jpeg';
  if (!image || typeof image !== 'string') { res.status(400).json({ error: 'Foto mancante' }); return; }
  // limite difensivo: ~6MB di base64 (il client invia comunque una foto ridotta)
  if (image.length > 6 * 1024 * 1024) { res.status(413).json({ error: 'Foto troppo grande' }); return; }

  const payload = {
    contents: [{
      role: 'user',
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mime, data: image } },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE'], temperature: 0.7 },
  };

  let gres;
  try {
    gres = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    res.status(502).json({ error: 'Impossibile contattare il servizio di generazione' });
    return;
  }

  if (!gres.ok) {
    let detail = '';
    try { detail = (await gres.json()).error?.message || ''; } catch (_) {}
    // 400 spesso = foto rifiutata dai filtri di sicurezza; lo segnaliamo in modo comprensibile
    res.status(gres.status === 400 ? 422 : 502).json({
      error: gres.status === 400
        ? 'Non sono riuscito a generare un avatar da questa foto. Prova con una foto diversa (volto ben visibile, niente contenuti sensibili).'
        : 'Generazione non riuscita, riprova tra poco.',
      detail,
    });
    return;
  }

  let data;
  try { data = await gres.json(); } catch (_) { data = null; }
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  const out = imgPart && (imgPart.inlineData?.data || imgPart.inline_data?.data);
  if (!out) {
    res.status(422).json({ error: 'Nessuna immagine generata. Prova con un’altra foto.' });
    return;
  }
  const outMime = (imgPart.inlineData?.mimeType || imgPart.inline_data?.mime_type) || 'image/png';
  res.status(200).json({ image: out, mime: outMime });
}
