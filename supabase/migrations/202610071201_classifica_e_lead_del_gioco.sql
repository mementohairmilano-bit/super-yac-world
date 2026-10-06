-- Classifica e lista email di Super YAC World: scrittura solo tramite funzioni controllate.
--
-- Cosa fa:
--   1) crea public.invia_punteggio(p_nickname, p_punteggio, p_mondo): aggiorna la riga del nickname
--      SOLO se il punteggio nuovo è più alto (mai al ribasso, mai righe altrui riscritte a piacere),
--      ripulisce il nickname con le stesse regole del gioco (niente < > " ' ` \ e simili, max 16,
--      "Anonimo" se vuoto) e controlla i limiti del punteggio;
--   2) toglie la regola «scores upsert» (UPDATE aperto a chiunque con la chiave pubblica) e revoca
--      UPDATE/DELETE/TRUNCATE su scores ai ruoli anon e authenticated;
--   3) crea public.invia_lead(p_email, p_nickname, p_punteggio, p_mondo, p_livello, p_consenso): accetta
--      l'email solo se il consenso è vero e il formato è valido, non duplica la stessa email nelle
--      24 ore, frena gli invii di massa (60 nuove righe ogni 10 minuti in tutto), scrive consent=true
--      solo perché l'ha verificato;
--   4) toglie la regola «leads_insert_anon» (INSERT aperto) e revoca le scritture dirette su leads.
--
-- Perché: con la chiave pubblica scritta nel gioco chiunque poteva riscrivere nickname e punteggi di
-- tutti (rilievi INIEZIONI-11, DB-16, EXTRA1-10) e inserire email altrui con consent=true (EXTRA1-11).
--
-- Compatibilità: il gioco prova prima la funzione e, se risponde 404 (non ancora creata), ripiega
-- sull'upsert/insert diretto di oggi. La regola «insert pubblico» su scores resta: serve ai giocatori
-- che hanno ancora in cache la versione vecchia del gioco (PWA) finché non si aggiorna; si può togliere
-- più avanti. Non si cancella nessuna riga.
--
-- I parametri hanno il prefisso p_ per non confondersi con le colonne omonime dentro plpgsql.

create or replace function public.invia_punteggio(p_nickname text, p_punteggio integer, p_mondo integer default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n text;
begin
  -- stesse regole di sanitizeNick nel gioco: via i caratteri rischiosi, spazi ai bordi, max 16
  n := left(btrim(translate(coalesce(p_nickname, ''), E'<>"\'`\\\n\r\t', '')), 16);
  if n = '' then n := 'Anonimo'; end if;
  if p_punteggio is null or p_punteggio < 0 or p_punteggio > 9999999 then
    raise exception 'punteggio non valido';
  end if;
  insert into public.scores (nickname, score, world)
  values (n, p_punteggio, p_mondo)
  on conflict (nickname) do update
    set score = excluded.score, world = excluded.world, created_at = now()
    where public.scores.score < excluded.score;   -- solo se è un record: mai al ribasso
end;
$$;

revoke all on function public.invia_punteggio(text, integer, integer) from public;
grant execute on function public.invia_punteggio(text, integer, integer) to anon, authenticated;

drop policy if exists "scores upsert" on public.scores;
revoke update, delete, truncate on table public.scores from anon, authenticated;

create or replace function public.invia_lead(
  p_email text,
  p_nickname text default null,
  p_punteggio integer default null,
  p_mondo integer default null,
  p_livello text default null,
  p_consenso boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e text;
  n text;
  punti integer;
begin
  if p_consenso is distinct from true then
    raise exception 'consenso mancante';
  end if;
  e := lower(btrim(coalesce(p_email, '')));
  if length(e) > 120 or e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'email non valida';
  end if;
  n := nullif(left(btrim(translate(coalesce(p_nickname, ''), E'<>"\'`\\\n\r\t', '')), 16), '');
  punti := least(greatest(coalesce(p_punteggio, 0), 0), 9999999);

  -- freno agli invii di massa: più di 60 iscrizioni nuove in 10 minuti non sono giocatori veri
  if (select count(*) from public.leads where created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'troppi invii, riprova tra qualche minuto';
  end if;

  -- stessa email nelle ultime 24 ore: niente doppioni, aggiorno solo il punteggio se è salito
  update public.leads
     set score = greatest(coalesce(score, 0), punti),
         world = coalesce(p_mondo, world),
         tier = coalesce(p_livello, tier)
   where email = e and created_at > now() - interval '1 day';
  if found then return; end if;

  insert into public.leads (nickname, email, score, world, tier, consent, source)
  values (n, e, punti, p_mondo, left(p_livello, 40), true, 'game');
end;
$$;

revoke all on function public.invia_lead(text, text, integer, integer, text, boolean) from public;
grant execute on function public.invia_lead(text, text, integer, integer, text, boolean) to anon, authenticated;

drop policy if exists "leads_insert_anon" on public.leads;
revoke insert, update, delete, truncate on table public.leads from anon, authenticated;

-- PostgREST deve rileggere lo schema per vedere subito le funzioni nuove
notify pgrst, 'reload schema';
