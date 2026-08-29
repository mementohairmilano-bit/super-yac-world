# Compliance GDPR + AI Act — REGOLA FISSA, vale per TUTTO

> Vale per qualsiasi cosa si produca o si tocchi: siti nostri o di clienti, app,
> contenuti social, video, foto, audio, testi, email, chatbot. Nessuna eccezione.
> Prima di pubblicare o rilasciare QUALSIASI cosa, passare la checklist in fondo.
> Aggiornato al 29 agosto 2026.

## Le date che contano (già tutte scattate)

| Norma | In vigore da | Cosa impone |
|---|---|---|
| GDPR (Reg. UE 2016/679) | 25 mag 2018 | Tutto il trattamento dati |
| AI Act — pratiche vietate (art. 5) | 2 feb 2025 | Divieti assoluti |
| Legge italiana IA (L. 132/2025) | 10 ott 2025 | Etichette, reato deepfake, minori |
| AI Act — trasparenza (art. 50) | **2 ago 2026** | **Il "bollino" sui contenuti IA** |

---

## 1. Il "bollino IA" (AI Act art. 50 + L. 132/2025)

La regola più facile da sbagliare, quindi sta per prima. **Dal 2 agosto 2026 è legge,
non buona pratica.**

- **Ogni immagine, video o audio generato o manipolato con IA** che ritrae in modo
  realistico persone, luoghi, oggetti o eventi (= "deepfake" in senso ampio, anche
  innocuo) va **dichiarato in modo chiaro e visibile**, al più tardi alla prima
  esposizione al pubblico. Scritta tipo: *"Contenuto generato con intelligenza
  artificiale"* / *"Immagine creata con IA"*. In video: nel video stesso (overlay o
  cartello iniziale), non solo nella caption.
- **Marcatura leggibile dalle macchine**: gli output IA devono portare watermark o
  metadati (es. C2PA). I tool seri (Higgsfield, Remotion + asset IA, DALL·E, ecc.)
  li mettono già: **non rimuoverli mai** (niente re-encode che strippa i metadati
  apposta, niente screenshot per "pulire" il file).
- **Testo generato con IA** pubblicato per informare il pubblico va dichiarato,
  **salvo** revisione umana sostanziale + responsabilità editoriale di una persona
  identificabile (le due condizioni servono ENTRAMBE). Un post social scritto con
  IA e ricontrollato davvero da chi lo pubblica rientra nell'eccezione; un
  articolo sparato online senza revisione no.
- **Chatbot e assistenti vocali**: l'utente deve sapere **dal primo contatto** che
  sta parlando con un'IA. Vale per qualsiasi bot, nostro o messo su siti di clienti.
- **Contenuti pubblicati prima del 2 ago 2026**: nessun obbligo retroattivo, ma
  etichettarli se capita di rimetterci le mani.
- Riferimento operativo: *Code of Practice on Transparency of AI-Generated Content*
  (Commissione UE, giugno 2026).

### Deepfake di persone reali = zona penale (Italia)

L'art. **612-quater c.p.** (introdotto dalla L. 132/2025) punisce la diffusione
illecita di immagini/video/audio generati o alterati con IA che ingannano sulla
loro genuinità e danneggiano qualcuno. Tradotto: **mai** generare o ritoccare con
IA il volto/corpo/voce di una persona reale senza il suo **consenso scritto**, e
anche col consenso il contenuto va etichettato come manipolato. Nessun "è solo un
meme" — è un reato, non una multa.

### Sui social: doppio bollino

Oltre alla scritta nel contenuto, **attivare sempre il flag della piattaforma**:
- Instagram/Facebook: etichetta "Info IA" / contenuto creato con IA
- TikTok: interruttore "Contenuto generato dall'IA" (obbligatorio per contenuti realistici)
- YouTube: dichiarazione "contenuto alterato o sintetico" in fase di upload

---

## 2. GDPR — regole sempre valide

### Prima di raccogliere qualsiasi dato
- **Base giuridica** individuata PRIMA (consenso, contratto, obbligo legale,
  legittimo interesse). "Ci serve" non è una base giuridica.
- **Minimizzazione**: si raccoglie solo ciò che serve allo scopo. Niente campi
  "già che ci siamo".
- **Privacy by design/by default**: le impostazioni di default sono le più
  protettive (es. newsletter NON pre-spuntata).

### Su ogni sito/app
- **Informativa privacy** (art. 13): chi tratta, cosa, perché, base giuridica, per
  quanto, a chi va, diritti, come esercitarli. Linkata dal footer e da ogni form.
- **Cookie banner a norma Garante** (linee guida 10 giu 2021):
  - "Rifiuta" con la **stessa evidenza** di "Accetta" (stesso livello, stesso peso grafico)
  - Niente cookie non tecnici prima del consenso (gli script si **bloccano**, non
    si caricano e basta)
  - Pannello preferenze granulare + possibilità di revoca facile
  - Niente cookie wall, niente consenso a scroll, niente dark pattern
- **Form**: checkbox marketing **separata** e non pre-spuntata; il consenso si
  registra (chi, quando, per cosa, con che testo).
- **Minori**: in Italia il consenso digitale è valido dai **14 anni**; sotto,
  serve il genitore. La L. 132/2025 richiede il consenso dei genitori anche per
  l'**accesso a sistemi IA** degli under 14.

### Diritti degli interessati
Accesso, rettifica, cancellazione, portabilità, opposizione: risposta entro
**30 giorni**. Tradotto in pratica: export e cancellazione dei dati devono essere
**tecnicamente fattibili** in ogni cosa che costruiamo (niente dati sparsi che
nessuno sa più cancellare).

### Fornitori e trasferimenti
- Ogni fornitore che tocca dati personali (Supabase, Vercel, AWS, Anthropic/OpenAI,
  Meta, Resend…) è un **responsabile ex art. 28**: serve il **DPA** firmato/accettato.
- Trasferimenti extra-UE solo con decisione di adeguatezza (USA: Data Privacy
  Framework — verificare che il fornitore sia certificato) o SCC.
- Passare dati personali a un modello IA = trattamento: va in informativa, e si
  usano API con **no-training** sui dati (verificare i termini, non presumerli).

### Organizzazione
- **Registro dei trattamenti** (art. 30) aggiornato.
- **DPIA** (art. 35) prima di trattamenti ad alto rischio (profilazione su larga
  scala, dati sanitari, monitoraggio sistematico, uso di IA su dati personali).
- **Data breach**: notifica al Garante entro **72 ore** dalla scoperta + registro
  interno degli incidenti. Se rischio alto per le persone, avviso anche a loro.
- Sicurezza (art. 32): HTTPS ovunque, cifratura, minimo privilegio, RLS sempre
  attiva sul multi-tenant.

### Foto e video di persone reali
- **Liberatoria firmata PRIMA** di scattare/pubblicare (anche art. 96-97 legge
  diritto d'autore). Vale anche per i "prima/dopo" e le foto di clienti.
- La liberatoria deve coprire l'uso effettivo: social, sito, pubblicità, e —
  se previsto — **elaborazione con IA**. Un consenso per "foto sul sito" NON copre
  il ritocco IA o il riuso in un video generato.

---

## 3. AI Act — oltre il bollino

- **Pratiche vietate** (art. 5, dal feb 2025): manipolazione subliminale,
  sfruttamento di vulnerabilità, social scoring, riconoscimento emozioni su
  lavoro/scuola, scraping indiscriminato di volti. Non se ne costruisce e non se
  ne usa, punto.
- **Alto rischio** (allegato III): se mai una feature toccasse selezione del
  personale, credito, salute → fermarsi e valutare PRIMA di costruire (obblighi
  pesanti: gestione rischi, sorveglianza umana, registrazione). Siti vetrina e
  marketing normalmente NON sono alto rischio.
- **AI literacy** (art. 4): chi usa sistemi IA in azienda deve sapere cosa sta
  usando e quali limiti ha. Se un nostro strumento genera contenuti IA per altri,
  le istruzioni devono spiegarlo e dire cosa fare (bollino, flag social).
- **L. 132/2025**: professionisti e imprese devono dichiarare in modo chiaro
  l'uso di IA nelle proprie prestazioni. Opere generate con IA: il diritto
  d'autore protegge solo dove c'è **apporto creativo umano**.

---

## 4. Applicazione a questo progetto

Ogni sito, app o contenuto che esce da questo repository segue le regole sopra:
se una pagina raccoglie dati → informativa e cookie a norma; se compare un
chatbot → si dichiara IA; se si pubblica un media generato o ritoccato con IA →
bollino visibile, metadati intatti e flag della piattaforma social.

## 5. Checklist operative (da passare SEMPRE)

### A. Prima di pubblicare un sito (nostro o di un cliente)
- [ ] Informativa privacy completa e linkata ovunque si raccolgano dati
- [ ] Cookie banner: Rifiuta = Accetta, script bloccati prima del consenso, revoca facile
- [ ] Cookie policy con elenco reale dei cookie/script presenti
- [ ] Form: base giuridica chiara, consensi separati, niente pre-spunte
- [ ] HTTPS, DPA con tutti i fornitori, trasferimenti extra-UE coperti
- [ ] Se c'è un chatbot: si presenta come IA
- [ ] Se il sito mostra contenuti generati con IA: etichettati

### B. Prima di pubblicare un contenuto (foto/video/audio/testo)
- [ ] Generato o manipolato con IA? → scritta visibile NEL contenuto + metadati intatti
- [ ] Pubblicazione social? → flag IA della piattaforma attivato
- [ ] C'è una persona reale? → liberatoria firmata che copre QUESTO uso
- [ ] Persona reale + IA (ritocco, voce, volto)? → consenso esplicito + etichetta "manipolato" (art. 612-quater: senza consenso è reato)
- [ ] Testo IA "informativo"? → revisione umana vera + responsabile editoriale identificabile, oppure dichiarazione
- [ ] Musica/asset di terzi: licenza a posto

### C. Prima di rilasciare una feature dell'app
- [ ] Tocca dati personali? → base giuridica, informativa aggiornata, minimizzazione
- [ ] Manda dati a un servizio nuovo? → DPA + no-training + extra-UE verificato
- [ ] Genera contenuti IA? → bollino di default, metadati preservati
- [ ] Interagisce con persone come IA? → si dichiara
- [ ] I dati creati si possono esportare e cancellare per tenant?
- [ ] Rischio elevato (profilazione, minori, salute)? → DPIA prima, non dopo

### D. Email e messaggi
- [ ] Marketing solo a chi ha dato opt-in registrato (o soft-spam art. 130: propri
  clienti, prodotti analoghi, opt-out facile)
- [ ] Unsubscribe in un click in ogni invio
- [ ] Testo scritto con IA e inviato "as is" su temi informativi → dichiararlo

---

*Fonti principali: Reg. UE 2024/1689 (AI Act) art. 50; linee guida Commissione UE
lug 2026 e Code of Practice giu 2026; L. 132/2025; GDPR; linee guida cookie del
Garante 10 giu 2021. Da ricontrollare ~ogni 6 mesi: il quadro si muove.*
