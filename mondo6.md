# SUPER YAC WORLD — Mondo 6: "Big Beauty Tower" (FINALE)

Documento di design del sesto e ultimo mondo. Le regole globali (luce, difficoltà boss, branding) sono nel documento del Mondo 2 / GDD: qui si applicano, non si ripetono.

Principio guida (dallo studio del finale di Super Mario Bros, castello 8-4): il finale è (1) un **labirinto** dove devi imboccare il percorso giusto sotto pressione di tempo, (2) una **ricombinazione** di tutte le minacce viste prima + una sezione sotterranea, (3) il colpo di scena del **boss vero** (i boss precedenti erano "falsi"/maschere), e (4) un **finale-ricompensa**. Tradotto da noi: i cinque mini-boss erano solo marchi; **The Conglomerate è il sistema reale che li possiede tutti** → batti il sistema, non il concorrente.

Struttura invariata: **superficie → sotterraneo → boss**, declinata come **ascesa della torre**.

---

## Tema del mondo

La sede di The Conglomerate: l'ascesa finale della torre corporate. Per il ritmo di luce e per l'eco del finale notturno di Mario, è il **mondo più scuro del gioco** — la torre illuminata solo dai suoi loghi freddi e dai ticker — così che la **liberazione finale esploda nel caldo YAC più intenso di tutto il gioco**. Il premio massimo, costruito per contrasto.

## Carattere del mondo

- **Ricombinazione totale:** tornano nemici e meccaniche di tutti i mondi (nastri, neon lampeggianti, Bolletta Bill, Spruzzabot, Etichetta-Spam, ooze, laser…), più aggressivi. Spirito "tutto insieme, più cattivo" del mondo finale.
- **Labirinto + tempo:** salire scegliendo il percorso giusto, sotto pressione.
- Nessun nemico nuovo "a piedi": il finale vive sulla ricombinazione, non su una creatura inedita.

---

## Mondo 6-1 — "Il Piazzale" (base/esterno, notte)

L'esterno e l'atrio della torre: il gauntlet più duro, che ricombina nemici e meccaniche di tutti i mondi. Checkpoint a metà, pennone YAC alla fine.

## Mondo 6-2 — "Le Fondamenta" (sotterraneo)

Il cuore-motore della torre: ricombinazione degli hazard sotterranei — buio a lampi + laser di sicurezza + un accenno di ooze che sale. Il sotterraneo più teso del gioco. Tubo di risalita, checkpoint a metà.

## Mondo 6-3 — "L'Ascesa" → The Conglomerate (torre finale)

Labirinto **verticale**: scegliere l'ascensore/tubo giusto per salire, sotto pressione di tempo, con bracci rotanti come barre di fuoco (eco del labirinto 8-4). **Checkpoint a metà, prima del boss** (per non rifare tutta la salita a ogni morte). Poi lo scontro finale.

## Boss finale — The Conglomerate (3 fasi)

Una **macchina industriale gigante senza volto**, tutta loghi e numeri: il sistema, non una persona. Per la regola di difficoltà è il climax a fasi, non una semplice scala di colpi (indicativamente ~3 colpi per fase, ma il punto sono gli schemi che crescono):

- **Fase 1 — "I Marchi":** schiera gli attacchi dei cinque mini-boss (scatoloni di BoxKing, volantini di ViralCorp, acido di ToxiLab, raffiche di Bolletta Bill, minion evocati). Rivelazione visiva: li comanda tutti.
- **Fase 2 — "Il Sistema":** più veloce, due minacce in contemporanea, l'arena si attiva (pavimento-grafico che crolla + nastro).
- **Fase 3 — "Il Collasso":** la più aggressiva, attacchi che riempiono lo schermo, finestre strettissime; espone il **nucleo** colpibile solo ora — il colpo decisivo (eco dell'ascia che fa crollare il ponte di Bowser).

**Sconfitta / finale:** la macchina si sgretola, i loghi freddi si staccano e sotto appare il **logo YAC**; tutta la torre si inonda di caldo YAC → schermata finale di vittoria + **call-to-action** verso il brand. Hai battuto il sistema.

---

## Asset da produrre (quando si passerà alla generazione)

| File | Cosa | Tipo |
|---|---|---|
| `bg_m6_plaza.png` | Il Piazzale (base torre, notte, loghi freddi) | fondale |
| `bg_m6_foundations.png` | Le Fondamenta (cuore-motore, buio) | fondale |
| `bg_m6_ascent.png` | L'Ascesa (labirinto verticale della torre) | fondale |
| `boss_conglomerate.png` | The Conglomerate (macchina gigante senza volto) | sprite (grande) |
| `screen_finale_yac.png` (opz.) | schermata finale / torre liberata in caldo YAC | scena |

Elementi tile-friendly disegnati nel prototipo: tutti gli elementi-meccanica dei mondi 1–5 riusati (nastri, neon lampeggianti, vasche, piattaforme-grafico, ascensori, laser, bracci rotanti) + il nucleo colpibile del boss in fase 3.

Nota narrativa: prima della Fase 1 si può mostrare The Conglomerate che **assorbe le maschere** dei cinque marchi sconfitti — rende visibile il "li possiede tutti".
