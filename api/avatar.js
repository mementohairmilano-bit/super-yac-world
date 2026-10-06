// Funzione serverless (Vercel) — genera l'avatar dell'"eroe personalizzato" dalla foto dell'utente
// con Gemini 2.5 Flash Image ("Nano Banana"). La CHIAVE non può stare nel browser: vive qui, in
// GEMINI_API_KEY (Environment Variables di Vercel). Il client manda la foto (base64, ridotta), noi
// chiediamo a Gemini un personaggio chibi 2D su SFONDO VERDE chroma-key, e restituiamo il PNG
// generato. La rimozione dello sfondo (→ sprite trasparente) avviene lato client su canvas, così
// qui non servono dipendenze native (sharp) e la funzione resta leggera.
//
// Privacy: la foto transita da Google solo per generare l'immagine; noi non la salviamo.
// Ogni chiamata costa (API Google a pagamento): consenso ed età li controlla anche il server,
// 10 generazioni l'ora per indirizzo (un salone o un evento con Wi-Fi condiviso ha UN solo IP:
// con 3 si bloccavano tutti i presenti) e un tetto giornaliero per istanza della funzione.
// I contatori vivono in memoria (vedi _comune.js): fermano uno script, non sono un tetto sui
// costi. Quello vero è la quota giornaliera con l'avviso di spesa impostati su Google Cloud.
import { readBody, ipDi, limita } from './_comune.js';

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';
const MAX_ORA_PER_IP = 10;
const MAX_GIORNO = 200;
const GIORNO_MS = 24 * 60 * 60 * 1000;
const MIME_OK = ['image/jpeg', 'image/png', 'image/webp'];

// Verde chroma-key (#00E000): tinta satura assente nei volti/capelli → facile da togliere lato client.
const PROMPT = [
  'Transform the person in this photo into a cute full-body 2D platformer game character (chibi mascot style),',
  'cel-shaded with clean bold outlines and flat vibrant colors, like a Super Mario / indie platformer hero.',
  'Keep the person clearly recognizable: same hairstyle and hair color, same skin tone, glasses/beard if present,',
  'and an outfit inspired by their clothes. Friendly heroic pose.',
  'Show the character in a dynamic 3/4 view, body and feet turned toward the RIGHT (facing the walking direction, like a',
  'side-scrolling platformer hero moving right), with the face still clearly visible. Full body head to feet, centered.',
  'IMPORTANT: place the character on a COMPLETELY SOLID flat CHROMA-KEY GREEN SCREEN background of pure, fully saturated,',
  'bright green (#00FF00) — like a video green screen, NOT olive, NOT dark, NOT pastel. Fill the entire background with that',
  'single uniform green. No shadows on the background, no gradients, no scenery, no text, no border. Single character only.',
  'Do not use green for the clothes or hair.',
].join(' ');

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) { res.status(503).json({ error: 'Il generatore di avatar non è disponibile al momento' }); return; }

  let body;
  try { body = await readBody(req); } catch (_) { body = {}; }
  // il consenso (foto a Google) e l'età (14 anni o permesso di un genitore) si controllano anche qui:
  // la casella nella pagina da sola non basta, la rotta è raggiungibile da chiunque
  if (!body || body.consent !== true || body.eta !== true) {
    res.status(400).json({ error: 'Per creare l’avatar devi spuntare il consenso e la casella sull’età' });
    return;
  }
  const image = body.image;            // base64 puro (senza prefisso data:)
  const mime = MIME_OK.includes(body.mime) ? body.mime : 'image/jpeg';
  if (!image || typeof image !== 'string') { res.status(400).json({ error: 'Foto mancante' }); return; }
  // limite difensivo: ~6MB di base64 (il client invia comunque una foto ridotta)
  if (image.length > 6 * 1024 * 1024) { res.status(413).json({ error: 'Foto troppo grande' }); return; }

  // i limiti si contano prima di chiamare Google: anche un tentativo rifiutato dai filtri costa
  if (!limita('avatar:' + ipDi(req), MAX_ORA_PER_IP)) {
    res.status(429).json({ error: 'Da questa rete sono già stati generati 10 avatar nell’ultima ora: riprova più tardi' });
    return;
  }
  if (!limita('avatar:giorno', MAX_GIORNO, GIORNO_MS)) {
    res.status(503).json({ error: 'Il generatore ha raggiunto il limite di oggi: riprova domani' });
    return;
  }

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
    // 400 spesso = foto rifiutata dai filtri di sicurezza; lo segnaliamo in modo comprensibile.
    // Il testo dell'errore di Google resta qui: a chi chiama non serve e direbbe troppo sul servizio.
    res.status(gres.status === 400 ? 422 : 502).json({
      error: gres.status === 400
        ? 'Non sono riuscito a generare un avatar da questa foto. Prova con una foto diversa (volto ben visibile, niente contenuti sensibili).'
        : 'Generazione non riuscita, riprova tra poco.',
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
