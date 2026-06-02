# SUPER YAC WORLD — Mondo 4: "Il Laboratorio Chimico"

Documento di design del quarto mondo. Le regole globali (luce, difficoltà boss, branding) sono nel documento del Mondo 2 / GDD: qui si applicano, non si ripetono.

Principio guida (dallo studio del vero Super Mario Bros, Mondo 4): dopo la notte del Mondo 3, l'atmosfera **torna alla luce** (di giorno); il mondo introduce **Lakitu**, il molestatore aereo che ti insegue e ti piove addosso gli Spiny dall'alto finché non lo abbatti, con **funghi che fanno da piattaforme**; e il castello finale è il primo **labirinto a percorsi sbagliati**. Tre firme: ritorno alla luce, molestatore aereo, labirinto a bivi.

Struttura invariata: **superficie → sotterraneo → boss**.

---

## Tema del mondo

Il laboratorio chimico della multinazionale: vasche, tubi, reagenti. Conferma del ritmo di luce — dopo il Mondo 3 tutto notte/neon, il laboratorio **torna luminoso**: sale pulite, luce fredda ma chiara, bianco clinico, con accenti **verde-tossico**. Esattamente come l'originale che torna al giorno dopo la notte del Mondo 3.

## Novità del mondo

- **Spruzzabot** — il nostro Lakitu: drone che ti insegue dall'alto su una nuvola di vapore e ti sgocciola addosso blob acidi; continua finché non lo abbatti.
- **Gocce Corrosive** — i nostri Spiny: i blob che Spruzzabot fa cadere, strisciano a terra e **non si possono schiacciare** (schivare o usare lo speciale).
- **Ooze tossico che sale** — meccanica nuova di varietà: in un livello il veleno monta dal basso; non ci si nuota (il contatto uccide), si **scala e si avanza senza fermarsi**. Diverso dall'acqua del Mondo 2 e dal buio del Mondo 3.
- **Piattaforme a schiuma/becher** — tappi di vasca, becher e bolle di schiuma instabili su cui saltare (l'equivalente dei funghi-piattaforma del 4-3).

---

## Mondo 4-1 — "Le Vasche" (superficie, luminoso)

Reparto produzione pulito e illuminato: vasche aperte di liquido tossico (toccarle = morte, come i buchi), tubi, becher gorgoglianti. Debutta **Spruzzabot** che insegue e fa cadere **Gocce Corrosive**. Platforming sopra le vasche. Checkpoint a metà, pennone YAC alla fine.

## Mondo 4-2 — "Il Seminterrato" (sotterraneo)

Una vasca si rompe → **ooze che sale**. Scalata tesa verso l'alto, mai fermarsi o il veleno prende il player. Buio (sotterraneo, consentito dalla regola), illuminato solo dal bagliore del liquido. Tante Gocce d'Oro, tubo di risalita, checkpoint a metà.

## Mondo 4-3 — "Il Reattore" → boss ToxiLab (castello)

Labirinto di **tubi a bivi**: il tubo sbagliato rimanda indietro (eco del castello-labirinto 4-4). Platforming su tappi e bolle di schiuma, **bracci-spruzzatori rotanti** come hazard (le nostre barre di fuoco). In fondo l'arena del boss.

**Boss — ToxiLab (6 colpi).** Un reattore-calderone mutato con una faccia. Per la regola di difficoltà: 6 colpi + nuovo schema — **schizzi d'acido** che impuddellano il pavimento e **restringono lo spazio sicuro** (finestre di colpo più strette), evoca Gocce Corrosive e sbuffi di vapore. Nettamente più tecnico di ViralCorp. Alla sconfitta il laboratorio si bonifica → diventa laboratorio/salone YAC pulito e caldo, bandiera issata. È un altro marchio di **The Conglomerate**.

---

## Asset da produrre (quando si passerà alla generazione)

| File | Cosa | Tipo |
|---|---|---|
| `bg_m4_surface.png` | Le Vasche (laboratorio luminoso, accenti verde-tossico) | fondale |
| `bg_m4_basement.png` | Il Seminterrato (buio, bagliore dell'ooze) | fondale |
| `bg_m4_reactor.png` | Il Reattore (labirinto di tubi) | fondale |
| `enemy_spruzzabot.png` | Spruzzabot, drone molestatore aereo (Lakitu) | sprite |
| `enemy_goccia_corrosiva.png` | Goccia Corrosiva strisciante (Spiny) | sprite |
| `boss_toxilab.png` | boss ToxiLab (reattore-calderone mutato) | sprite |

Elementi tile-friendly disegnati nel prototipo: vasca tossica (hazard), tappo-piattaforma, bolla di schiuma instabile, tubo a bivio, braccio-spruzzatore rotante.
