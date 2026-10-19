# SUPER YAC WORLD — Analisi e piano «da azienda leader»

Documento del 19 ottobre 2026. Scritto dopo aver letto tutto il codice (≈8.000 righe: `src/`, `index.html`, `api/`), i documenti di design (`mondo2…6.md`, `chiusura.md`, `bulldupJoystick.md`), gli asset (≈190 immagini, 62 tracce audio) e aver avviato il gioco in locale.

---

## 1. Dove sta il gioco oggi

**Cosa c'è (e funziona).** Un platform 2D completo in Phaser 3.90 + Vite: 6 mondi × 3 livelli + Mondo 0 «L'Officina» (17 livelli di dati in `levels.js`), 6 boss con schemi diversi, 5 eroi + eroe personalizzato dalla foto (Gemini lato server), 15 meccaniche di mondo (nastri, molla, nuoto, correnti, muletti, casse che piovono, gru, neon a tempo, cannoni, Promoter, Spruzzabot, melma che sale, grafico azionario, laser, pozze), lettere FREEDOM, finale a più beat, classifica Supabase, badge, PWA offline, tastiera + touch + gamepad, salvataggio «Continua», analytics Memento Studio, compliance GDPR rivista il 7 ottobre. La **struttura di gioco è solida**: non va buttata.

**Cosa lo tiene lontano da un titolo «da grande azienda».** Non sono i contenuti, è la **presentazione** e il **feeling**. In ordine di impatto:

| # | Problema | Dove | Perché pesa |
|---|---|---|---|
| 1 | **Il mondo non si muove.** Lo sfondo è UNA immagine fissa alla camera (`scrollFactor 0`): correndo, dietro l'eroe non scorre niente. Zero parallasse, zero profondità, zero particelle d'ambiente. | `GameScene.buildBackdrop` | È la prima cosa che l'occhio registra: il gioco sembra un prototipo. |
| 2 | **Resa sfocata.** Il gioco disegna a 420 px di altezza e il browser lo stira (su un iPhone ×3): sprite e testi sfocati. | `main.js gameSize`, config Phaser | Un titolo pro è nitido al pixel. |
| 3 | **Niente animazione.** Gli sprite sono immagini singole (nessun ciclo di corsa): la «camminata» è un dondolio di ±3,5°. Niente squash/stretch, niente polvere, niente anticipazione. | `update()` riga «camminata» | È la differenza tra un personaggio e un'immagine che trasla. |
| 4 | **Controlli senza inerzia.** Velocità impostata secca (0 → 188 px/s in un frame), niente coyote time, gravità uniforme (il salto è «a palloncino»). Il jump buffer e il taglio del salto ci sono. | `update()` | Il feel di Mario/Celeste/Rayman nasce da accelerazione, coyote time, apice morbido. |
| 5 | **Camera piatta.** Segue solo in orizzontale, offset fisso, nessun anticipo in base alla velocità, nessun movimento verticale, nessuna reazione agli eventi. | `buildPlayer` | La camera è metà della sensazione di velocità. |
| 6 | **Feedback poveri.** Nemico schiacciato = si schiaccia e sparisce in 160 ms; moneta = sparisce; boss colpito = tint rosso. Nessun hit-stop, nessuna esplosione, nessun particellare. | `killEnemy`, `grab`, `damageBoss` | Il «succo» (juice) è ciò che rende ogni azione soddisfacente. |
| 7 | **HUD da prototipo.** Righe di testo a 13 px («Vite ×5 Gocce 12 340 pt»), nessuna icona, nessun layout. | `buildHUD/updateHUD` | L'HUD è l'arredo che si vede per tutta la partita. |
| 8 | **Tre pannelli prima di giocare.** Disclaimer → nickname obbligatorio → invito a installare (che si sovrappone al disclaimer: bug visibile al primo avvio). | `index.html`, `startupFlow`, `openInstallHelp` | Ogni pannello perde una fetta di giocatori; i grandi chiedono il nome quando serve. |
| 9 | **Touch con 5 bottoni fissi.** D-pad a tasti separati; niente joystick, niente vibrazione, tasti piccoli (60 px). | `#touch`, `bindInput` | La maggior parte del traffico arriva da Instagram, cioè da telefono. |
| 10 | **Architettura monolitica.** `GameScene.js` = 2.708 righe con fisica, boss, HUD, finale, scenette; stato condiviso via `window._*`. | tutto `src/scenes` | Ogni ritocco rischia di rompere altro; frena l'evoluzione. |
| 11 | Dettagli: piattaforme = rettangoli bianchi tintati; blocchi 32 px da immagini 600 px (costose in memoria); 4 pool audio per effetto creati al volo; `cullView` ogni 2 frame; vignetta rigenerata per dimensione. | vari | Piccoli, ma si sommano. |

**Cosa invece è già da gioco serio:** il design dei mondi (ogni livello introduce una meccanica, come il vero SMB), la regola di luce, la progressione dei boss, la narrativa (i marchi erano maschere, il nemico è il sistema), il salvataggio continuo, la PWA offline, la coda offline per la classifica, il fail-safe di vittoria, la gestione iOS (WebGL context, pool audio).

---

## 2. Il cambiamento radicale: tre direzioni in gara

Antonio ha aperto a visuale, comandi e design. Tre strade, da scegliere (anche a pezzi):

### A · «Remaster» — stesso gioco, presentazione da titolo pubblicato ✅ *in costruzione ora*
Si tiene il platform 2D e tutti i contenuti; si rifà lo strato che il giocatore sente: parallasse a più piani e atmosfera viva in ogni mondo, resa nitida ad alta densità, controlli con inerzia e coyote time, animazione procedurale degli eroi (squash & stretch, polvere, scia), camera dinamica, hit-stop ed esplosioni, HUD disegnato, onboarding a un passo, joystick virtuale, boss con presentazione. Nessun asset nuovo richiesto (tutto procedurale sopra l'arte esistente).
- **Effort:** 1 sessione di lavoro (questa). **Rischio:** basso, verificabile livello per livello.
- **Cosa serve da Antonio:** provarlo e dire cosa stona.

### B · «YAC Rush» — runner verticale per telefono, un pollice
Lo stesso universo (eroi, mondi, nemici, boss) riletto come **auto-runner in verticale**: l'eroe corre da solo, si tocca per saltare, si tiene per planare, si scorre per cambiare corsia; partite da 60–90 secondi, classifica settimanale, «rivincita» immediata. Risolve alla radice il problema del telefono (oggi il gioco va ruotato e richiede 5 tasti) e si presta a Reel/Storie (formato 9:16 nativo).
- **Effort:** 2–3 sessioni (nuovo motore di livello generativo + bilanciamento). **Rischio:** medio: è un gioco nuovo, i 17 livelli disegnati a mano non si riusano come sono (si riusano asset, boss, musica).
- **Cosa serve da Antonio:** decidere se il gioco «da divano/PC» resta in parallelo o viene sostituito.

### C · «Teatro di carta 2.5D» — stessa partita, mondo in profondità
Side-scroller con **scena tridimensionale** (Three.js o PlayCanvas): gli sprite esistenti diventano sagome su piani a profondità diverse (come un teatrino di carta), con luce reale, ombre proiettate, profondità di campo e una camera che gira leggermente nelle curve e nei boss. Lo stile «cut-out illuminato» (Rayman Legends, Little Big Planet) fa il salto visivo più grande mantenendo level design e controlli.
- **Effort:** 4–6 sessioni (motore di rendering nuovo, porting di 15 meccaniche, test prestazioni su iPhone). **Rischio:** alto: la PWA offline e i telefoni vecchi soffrono; servono fondali scomposti in piani (ChatGPT può generare i livelli separati, ma è lavoro grafico in più).
- **Cosa serve da Antonio:** fondali a strati (cielo / mezzo / primo piano) per 17 scene, generati su ChatGPT.

**La mia raccomandazione:** fare **A adesso** (è la base di qualunque strada: anche B e C ne ereditano feel, HUD, onboarding), poi **B come prodotto social** da lanciare con i Reel, lasciando C come versione «evento/TV» se il gioco diventa un pezzo del marchio in fiera.

---

## 3. Cosa è stato costruito in questa sessione (direzione A) — branch `claude/remaster-aaa`

Nessun deploy automatico su superyacworld.it: il lavoro è in una PR con anteprima Vercel; unisco io al suo sì.

| # | Fatto | Dove |
|---|---|---|
| 1 | **Resa nitida**: il canvas ha fino a 3 pixel fisici per pixel logico (1,5 in modalità prestazioni), camera zoomata, testi rasterizzati alla densità giusta. Da sfocato a pulito al pixel. | `main.js gameSize`, `GameScene` (R, VW/VH, ux/uy, T) |
| 2 | **Fondale a piani**: immagine del mondo che scorre senza cuciture (tile specchiato, 0,22×), arredi del soffitto per tema (travi, lampade, catene, insegne al neon, tubi, schermi-ticker, fari), fasci di luce additivi nei livelli luminosi, foschia a terra, **aria** (polvere, bolle, pioggia neon, spore, coriandoli, braci). | `src/parallax.js` |
| 3 | **Controlli con inerzia**: accelerazione/attrito a terra e in aria, frenata con polvere, **coyote time** (110 ms), jump buffer, taglio del salto, **gravità viva** (leggera all'apice, pesante in caduta), tetto alla velocità di caduta. Il nastro trasportatore si somma alla corsa senza accumularsi. | `GameScene.movePlayer` |
| 4 | **Animazione procedurale** degli eroi: respiro da fermi, falcata con rimbalzo e inclinazione, stretch in salto, squash in caduta e all'atterraggio (proporzionale all'impatto), sbuffi di polvere ai passi; origine ai piedi per tutti gli sprite (eroe, nemici, power-up). | `GameScene.animatePlayer`, `fitSprite` |
| 5 | **Camera** con anticipo proporzionale alla velocità, scossa sugli atterraggi pesanti, zoom «pugno» su combo, Boccetta, morte, boss. | `GameScene.update`, `juice.punchZoom` |
| 6 | **Succo**: hit-stop su stomp/colpi/mattoni/morte, esplosioni di scintille nel colore del nemico, gocce che volano con stelline, mattoni in frammenti, blocchi che sobbalzano con polvere, testi di punteggio che crescono con la combo, morte con freeze + particelle; nemici che dondolano nel passo, volanti che si inclinano, gocce che «girano». | `src/juice.js`, `GameScene` |
| 7 | **HUD** disegnato: medaglione con ritratto (card) e anello colore-eroe, arco di ricarica del superpotere, chip stato potere, cuori animati, tempo con barra (pulsa sotto 50), punteggio a scorrimento, gocce con icona, tracker FREEDOM a chip. Barra boss in basso al centro con lampo e scossa ai colpi. | `src/hud.js` |
| 8 | **Boss**: bande cinema, targa del nome che piomba a schermo, HUD attenuato, colpo finale al rallentatore con raffica di esplosioni; cambi di fase con freeze e zoom. | `GameScene.bossIntro`, `damageBoss`, `defeatBoss` |
| 9 | **Card di inizio livello** a sipario (si apre sul gioco) con l'eroe scelto. | `GameScene.showIntro` |
| 10 | **Onboarding a un passo**: tolti disclaimer e invito a installare all'avvio (si sovrapponevano); nickname chiesto solo la prima volta che serve (classifica), con «Più tardi»; su telefono una riga di avviso al primo avvio. | `index.html`, `main.js` |
| 11 | **Joystick virtuale** flottante (appare dove tocchi, giù = tubo) + due tasti grandi SALTA/SUPER; vibrazione su salto e colpi. | `src/touch.js`, `index.html` |
| 12 | **Banco di prova headless** (Chromium del Mac, 60 fps): gioca, boss, telefono; usato per passare tutti i 17 livelli e due boss senza errori. | `tools/prova/` |

**Come provarlo in locale**
```bash
cd "Super Yac World" && npm run dev        # http://localhost:3000
node tools/prova/gioca.mjs "http://localhost:3000/?r=1" ./out memento 1 6
```

**Limiti noti / da decidere con Antonio**
- Gli sprite restano a un fotogramma: la corsa è animata proceduralmente (inclinazione, rimbalzo, polvere), non disegnata. Un ciclo di corsa vero richiede immagini nuove (ChatGPT) e uno spritesheet: è il prossimo salto di qualità.
- Il piano medio del fondale è procedurale (arredi del soffitto): sobrio per non coprire l'arte; se vuole più «scenografia» servono fondali a strati generati.
- `GameScene.js` resta un file unico (ora ~2.900 righe): nuovi moduli per fondale, succo, HUD e touch; il resto non è stato spostato per non rompere nulla.
- Su iPhone la densità è 1,5 in modalità prestazioni (predefinita sui telefoni): nitidezza migliore di prima ma non al massimo. Da provare dal vivo sul suo telefono prima di alzare il tetto.
- Prestazioni misurate solo nel browser senza finestra (GPU software): su hardware vero sono migliori; vanno comunque provate su un iPhone reale.

## 4. Note che vanno dette

- **Etichetta IA.** Il `CLAUDE.md` del repo (regola del 29 agosto) chiede il bollino «Creato con IA» sui contenuti; la regola generale di Antonio del 9 ottobre dice il contrario per i suoi materiali. Non aggiungo etichette nel gioco; se vuole, allineo il file del repo.
- **Avatar dalla foto = API a pagamento (Gemini)** dentro un prodotto per utenti finali: coerente con la regola (lo paga chi usa lo strumento), con limiti 10/ora/IP e 200/giorno. Non lo tocco.
- **Il gioco online è 8 commit avanti al Mac** (PR #94 «audit-gioco» del 7 ottobre): ho allineato il locale prima di partire.
