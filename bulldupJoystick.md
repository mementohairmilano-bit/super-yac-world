# SUPER YAC WORLD — Documento di build per Claude Code

Documento operativo per chi costruisce il gioco in Claude Code. Si usa **insieme** ai documenti di design per-mondo (`SUPER_YAC_WORLD_mondo2_design.md` … `mondo5_design.md`) e al GDD originale. Qui c'è il perimetro tecnico, le regole trasversali e l'ordine di costruzione; il dettaglio dei livelli sta nei documenti per-mondo.

---

## 1. Stack e perimetro tecnico

- **Engine:** Phaser 3 (gioco web/HTML5 puro, pubblicabile come link o embed).
- **Asset grafici:** generati a parte (sprite, fondali, boss). Il codice non li disegna: li carica. Convenzioni di naming nella sezione 11.
- **Risoluzione di base:** canvas **16:9**, Scale Manager in modalità FIT, deve scalare pulito da mobile fino a una TV 4K.
- **Salvataggio:** progresso per mondo/livello (storage locale lato client).

## 2. Input e output — TASTIERA + TOUCH + GAMEPAD + TV

Requisito di prima classe, da implementare già nel livello di input dell'MVP: il gioco deve essere giocabile con **tastiera**, **touch** (mobile) e **gamepad** (controller PlayStation DualShock 4 / DualSense, Xbox, o generici USB/Bluetooth), e deve girare bene **su TV**.

**Gamepad** (via Gamepad API, supportata nativamente da Phaser — fino a 4 controller):

| Azione | PlayStation | Xbox | Tastiera (fallback) | Touch |
|---|---|---|---|---|
| Movimento | stick sx / croce | stick sx / croce | frecce o WASD | D-pad virtuale |
| Salto | X (basso) | A | Spazio o Z | bottone Salto |
| Speciale / abilità | Quadrato | X | X | bottone Speciale |
| Cambio personaggio | L1 / R1 | LB / RB | Shift | bottone Switch |
| Pausa | Options | Start | Esc o P | bottone Pausa |

- Supportare **fino a 4 gamepad** (apre la porta a multiplayer locale o "a turni" sul divano in futuro; per l'MVP basta riconoscerne uno).
- I **menu devono essere navigabili interamente da gamepad** (niente azioni che richiedono solo mouse/hover).

**Uscita TV:**
- Fullscreen API: entra a schermo intero al primo input; pensato per browser in modalità kiosk su PC/mini-PC collegato via HDMI.
- Layout e HUD leggibili **da distanza divano**: font grandi, alto contrasto.
- Nessuna dipendenza dal puntatore: tutto raggiungibile da controller.

Nota: il gioco gira sul *dispositivo che esegue il browser* (PC/mini-PC/portatile, o smart TV/Android TV con browser), non dentro la console PlayStation. Il controller PlayStation invece è pienamente supportato.

## 3. Loop di gioco e meccaniche base (dal Mondo 1, valide ovunque)

- Movimento platform 2D in stile Super Mario Bros (camminata, corsa, salto con altezza variabile).
- **Stato piccolo/grande** via power-up Boccetta; un colpo da grande → torna piccolo, da piccolo → morte.
- **YES** = invincibilità temporanea (la "stella", estetica premium aubergine+oro).
- **Cambio personaggio** al volo (SHIFT): i 4 personaggi hanno abilità diverse (sezione 4).
- **HUD:** personaggio attivo, vite, Gocce d'Oro, punteggio, timer.
- **Timer** per livello (più stretto dal Mondo 5, vedi suo documento).
- **Morte:** caduta nei buchi/hazard o colpo da piccolo → ripartenza da inizio livello o checkpoint.
- **Checkpoint** a metà livello.
- **Fine livello:** pennone con **bandiera YAC**.
- I **sotterranei (tubi/condotti)** danno accesso a bonus/scorciatoie.

## 4. Personaggi giocabili (ambasciatori del brand)

- **Memento** (front-man / social): attacco "viral", colpo ad area che stordisce più nemici.
- **Yuri** (creativo): doppio salto + dash artistico, il più agile, scia di colore.
- **Carmine** (business): scudo/blocco, regge i colpi e sfonda gli ostacoli "burocratici".
- **Andrea**: tratto distintivo da confermare (decisione aperta — vedi sezione 13).

I quattro sono **ambasciatori**, non protagonisti del brand personale: UI e branding restano YAC.

## 5. Power-up e oggetti

- **Boccetta** = il "fungo" (piccolo→grande).
- **YES** = la "stella" (invincibilità, premium).
- **Goccia d'Oro** = la "moneta" (+10; 100 → vita extra).
- **Blocchi** che danno Gocce d'Oro / power-up.

## 6. Struttura dei mondi — 6 mondi × 3 livelli = 18

Schema fisso per ogni mondo: **L1 superficie → L2 sotterraneo → L3 castello/boss.**

| # | Mondo | Boss (colpi) | Documento di dettaglio |
|---|---|---|---|
| 1 | La Catena di Montaggio | MegaGloss (3) | (Mondo 1 già prototipato) |
| 2 | Il Magazzino | BoxKing (4) | `mondo2_design.md` |
| 3 | Il Reparto Marketing | ViralCorp (5) | `mondo3_design.md` |
| 4 | Il Laboratorio Chimico | ToxiLab (6) | `mondo4_design.md` |
| 5 | La Borsa / Direzione | Unibeauty (7) | `mondo5_design.md` |
| 6 | Big Beauty Tower | THE CONGLOMERATE (3 fasi) | da progettare |

**Narrativa:** ogni mini-boss è un "marchio". Alla fine si scopre che The Conglomerate li possiede tutti → batti il *sistema*, non il concorrente.

## 7. Regole globali (valgono per TUTTI i mondi)

**Regola di luce.** Il freddo industriale è il mondo della multinazionale, ma va dosato per leggibilità e ritmo (luce → buio → luce, come nell'originale):
- Superfici: industriali ma **luminose e ariose**, mai cupe.
- Sotterranei / notte / acqua: scuri e tesi (lì il buio è giusto e crea varietà).
- Boss / torri: drammatici.
- I colori caldi degli eroi (Gocce d'Oro, power-up, personaggio) sono sempre accenti luminosi: niente schermate grigio-morte.
- La **liberazione** finale di ogni mondo esplode di caldo YAC: è il premio, funziona per contrasto.

**Regola di difficoltà boss.** A ogni mondo **un colpo in più + un nuovo schema d'attacco** (non solo più vita):
- M1 MegaGloss 3 — lento e telegrafato (insegna).
- M2 BoxKing 4 — lancia scatoloni.
- M3 ViralCorp 5 — arena con piattaforme-neon lampeggianti + raffiche di volantini.
- M4 ToxiLab 6 — pavimento tossico che restringe lo spazio sicuro.
- M5 Unibeauty 7 — più veloce, schemi simultanei, evoca minion.
- M6 The Conglomerate — 3 fasi sempre più aggressive (il climax).

## 8. Punteggio

- Goccia d'Oro: +10
- Nemico schiacciato: +100 (combo crescente: 200, 400…)
- Fine livello rapida: bonus tempo
- Boss: +5.000
- 100 Gocce d'Oro → vita extra

## 9. Branding YAC (obbligatorio)

- Logo YAC su: titolo, schermata vittoria di ogni mondo, sconfitta del boss finale.
- Palette: giallo oro / pesca / rosa antico; aubergine + oro solo per il premium (YES) e gli elementi "speciali".
- Antagonisti **sempre parodia**, mai marchi reali.
- Bandiera di fine livello = bandiera YAC.
- Schermata finale con call-to-action verso il brand.

## 10. Pipeline asset

- Gli asset si generano a parte e si caricano nelle cartelle del progetto (es. `assets/`).
- **Naming:** fondali `bg_m<N>_<scena>.png`; nemici `enemy_<nome>.png`; boss `boss_<nome>.png`. (Elenchi puntuali nei documenti per-mondo.)
- **Disegnati nel codice** (tile-friendly, non generati): terreno, tubi, blocchi, e gli elementi-meccanica di ogni mondo (nastri, casse-piattaforma, pedane a molla, piattaforme-neon lampeggianti, vasche, bolle di schiuma, piattaforme-grafico azionario, ascensori, ecc.).
- Asset Mondo 1 e Mondo 2 già generati; Mondi 3–5 da generare quando si arriva alla produzione grafica.

## 11. Percorso di build consigliato

1. **MVP — Mondo 1 completo** (3 livelli) con 1 personaggio + 1 boss, **e il livello di input completo fin da subito** (tastiera + touch + gamepad) e lo scaling 16:9/fullscreen per TV. Provare il ciclo di gioco end-to-end.
2. **Espansione personaggi:** gli altri 3 personaggi + cambio al volo.
3. **Espansione mondi:** Mondi 2 → 6 secondo i documenti per-mondo.
4. **Polish:** audio, controlli touch rifiniti, salvataggio, schermate brand, CTA finale, test su TV con controller.

## 12. Decisioni ancora aperte

1. Abilità definitiva di **Andrea**.
2. Personaggi **selezionabili** a inizio livello o **switchabili** al volo (o entrambi)?
3. Mondo 6 (Big Beauty Tower + The Conglomerate) ancora da progettare in dettaglio.
4. Eventuale **multiplayer locale** (Phaser regge fino a 4 gamepad): se sì, va deciso prima dell'espansione mondi perché tocca il level design.
