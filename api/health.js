// Diagnostica — verifica che le chiavi (Gemini + Supabase service role) siano configurate e VALIDE
// in Production. NON espone mai il valore delle chiavi: fa solo controlli minimi e gratuiti
// (Gemini: lista modelli; Supabase: lista bucket). Usata dalla pagina /diagnostica.html.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifboncpyzrtindfbnrbk.supabase.co';
const BUCKET = 'syw-avatars';

export default async function handler(req, res) {
  const out = {
    gemini: { configured: false, valid: false },
    supabase: { configured: false, valid: false, bucket: false },
  };

  const gk = process.env.GEMINI_API_KEY;
  out.gemini.configured = !!gk;
  if (gk) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + encodeURIComponent(gk));
      out.gemini.valid = r.ok;
      if (!r.ok) { try { out.gemini.error = (await r.json())?.error?.message?.slice(0, 140); } catch (_) {} }
    } catch (e) { out.gemini.error = 'rete'; }
  }

  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  out.supabase.configured = !!sk;
  if (sk) {
    try {
      const r = await fetch(SUPABASE_URL + '/storage/v1/bucket', { headers: { apikey: sk, Authorization: 'Bearer ' + sk } });
      out.supabase.valid = r.ok;
      if (r.ok) {
        try { const list = await r.json(); out.supabase.bucket = Array.isArray(list) && list.some((b) => b.name === BUCKET || b.id === BUCKET); } catch (_) {}
      } else { try { out.supabase.error = (await r.json())?.message?.slice(0, 140); } catch (_) {} }
    } catch (e) { out.supabase.error = 'rete'; }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(out);
}
