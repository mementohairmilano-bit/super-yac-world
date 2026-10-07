// Pezzi comuni alle funzioni serverless del gioco. Il nome inizia con "_": Vercel non pubblica
// come rotta i file di api/ che iniziano con l'underscore, quindi questo resta solo un modulo.
import { createHash, timingSafeEqual } from 'node:crypto';

export function readBody(req) {
  // Vercel di solito popola req.body per application/json; fallback allo stream grezzo.
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => { s += c; });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

// indirizzo di chi chiama: Vercel mette l'IP vero per primo in x-forwarded-for
export function ipDi(req) {
  const xf = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
  return xf || (req.socket && req.socket.remoteAddress) || 'sconosciuto';
}

// Contatori in memoria per chiave (es. "avatar:1.2.3.4"): vivono nell'istanza della funzione e si
// azzerano a ogni avvio a freddo. Non sono un conteggio esatto, ma bastano a fermare uno script
// che martella una rotta: per un gioco promozionale è la difesa giusta senza un database in più.
const ORA_MS = 60 * 60 * 1000;
const contatori = new Map();
function voce(chiave, finestraMs) {
  const ora = Date.now();
  if (contatori.size > 5000) for (const [k, v] of contatori) if (v.fino < ora) contatori.delete(k);
  let v = contatori.get(chiave);
  if (!v || v.fino < ora) { v = { n: 0, fino: ora + finestraMs }; contatori.set(chiave, v); }
  return v;
}
// conta un evento e dice se si è ancora dentro il limite (true = si può procedere)
export function limita(chiave, max, finestraMs = ORA_MS) {
  const v = voce(chiave, finestraMs);
  v.n += 1;
  return v.n <= max;
}
// true se la chiave ha già raggiunto `max` eventi nella finestra (senza contare)
export function bloccato(chiave, max, finestraMs = ORA_MS) {
  return voce(chiave, finestraMs).n >= max;
}
export function segna(chiave, finestraMs = ORA_MS) {
  voce(chiave, finestraMs).n += 1;
}

// confronto a tempo costante: si confrontano gli hash (stessa lunghezza), così il tempo di risposta
// non dice quante lettere della password erano giuste
export function tokenValido(dato, atteso) {
  if (!atteso || typeof dato !== 'string' || !dato) return false;
  const a = createHash('sha256').update(dato).digest();
  const b = createHash('sha256').update(atteso).digest();
  return timingSafeEqual(a, b);
}

// Controllo per le rotte di moderazione: la password viaggia SOLO nell'intestazione x-admin-token
// (mai nell'indirizzo, che resta in cronologia e registri), massimo 10 tentativi sbagliati l'ora
// per indirizzo. Ritorna null se va bene, altrimenti { status, error } da rispondere così com'è.
export function controllaAdmin(req) {
  const ADMIN = process.env.ADMIN_TOKEN;
  if (!ADMIN) return { status: 503, error: 'Server non configurato' };
  const chiave = 'admin:' + ipDi(req);
  if (bloccato(chiave, 10)) return { status: 429, error: 'Troppi tentativi: riprova tra un\'ora' };
  const dato = (req.headers['x-admin-token'] || '').toString();
  if (!tokenValido(dato, ADMIN)) { segna(chiave); return { status: 401, error: 'Password errata' }; }
  return null;
}

// nome dell'eroe: niente caratteri rischiosi, max 24, non vuoto (stesse regole in salvataggio e rinomina)
export function cleanName(s) {
  return (s == null ? '' : String(s)).replace(/[<>"'`\\\n\r\t]/g, '').trim().slice(0, 24);
}
