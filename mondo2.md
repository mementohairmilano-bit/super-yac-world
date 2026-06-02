# SUPER YAC WORLD — Mondo 2: "Il Magazzino"

Documento di design del secondo mondo. Da tenere accanto al GDD e al pacchetto di passaggio per Claude Code.

Principio guida (dallo studio del vero Super Mario Bros, Mondo 2): **ogni livello del mondo introduce una meccanica nuova**. Nell'originale il 2-1 ha la pedana a molla, il 2-2 è il primo livello acquatico (nuoto + correnti), il 2-3/2-4 sono "athletic"/castello. Noi replichiamo la stessa varietà dentro al tema Magazzino, mantenendo la nostra struttura a **3 livelli: superficie → sotterraneo → boss**.

---

## Mondo 2-1 — "La Zona di Carico" (superficie)

Pavimento del magazzino: baie di carico, luce dalle finestre alte, atmosfera industriale fredda.

**Meccanica nuova del mondo: NASTRI TRASPORTATORI.** Tratti di pavimento che spingono il player (sinistra/destra) mentre cammina. Cambia il feeling del movimento rispetto al Mondo 1.

- Piattaforme = **casse impilabili**; alcune si **sgretolano** se ci resti sopra troppo a lungo.
- Buchi = baie di carico aperte (caduta = morte).
- **Pedana a molla** ("molla pallet"): rimbalzo alto per raggiungere una scorta di Gocce nascosta tra gli scaffali (eco del 2-1 originale + zona bonus tra le nuvole).
- Tubo/condotto verso un breve bonus.
- Checkpoint a metà. Pennone YAC alla fine.

**Nemici:** Scatolotto (goomba del magazzino, scorre sui nastri), primo **Tubetto Alato** (volante, eco del Koopa Paratroopa).

---

## Mondo 2-2 — "Il Sottomagazzino allagato" (sotterraneo + acqua)

La svolta del mondo, come il 2-2 originale: il seminterrato si è **allagato** → livello a **nuoto**.

**Meccanica nuova: NUOTO.** Premi salto per risalire, movimento rallentato sul fondo.

- Hazard: **correnti di scarico** che trascinano giù (3 punti nel livello, fedele all'originale); scendere troppo = morte.
- Tante **Gocce d'Oro** da raccogliere (feeling sotterraneo-bonus).
- Tubo di risalita a fine percorso. Checkpoint a metà.

**Nemici nuovi:** **Flacone galleggiante** (attraversa lo schermo, nostro Cheep-Cheep) e **Spugnotto** (ti insegue, nostro Blooper).

---

## Mondo 2-3 — "La Torre degli Scaffali" → boss BoxKing (castello)

Salita verticale su scaffalature giganti (varietà "athletic/castello" del 2-3 e 2-4).

**Meccanica nuova: PLATFORMING VERTICALE + piattaforme mobili.**

- **Piattaforme-muletto** che salgono e scendono (eco dei lift di Mario).
- **Casse che piovono** dall'alto (eco dei Cheep-Cheep saltatori / barre di fuoco del castello).
- **Bracci di gru rotanti** come hazard (eco delle fire bar).

**Boss — BoxKing:** colosso fatto di casse impilate, scaglia scatoloni. **3 colpi** per abbatterlo (stomp o speciale SHIFT, come MegaGloss). Alla sconfitta: la sezione è **liberata** → diventa stoccaggio/salone YAC, bandiera YAC issata.

---

## Asset da produrre per il Mondo 2

| File | Cosa | Tipo |
|---|---|---|
| `bg_m2_surface.png` | fondale Zona di Carico (magazzino, nastri, baie) | fondale |
| `bg_m2_water.png` | fondale Sottomagazzino allagato | fondale |
| `bg_m2_tower.png` | fondale Torre degli Scaffali (verticale) | fondale |
| `enemy_scatolotto.png` | nemico-cassa base (goomba) | sprite |
| `enemy_tubetto_alato.png` | Tubetto volante (paratroopa) | sprite |
| `enemy_flacone_float.png` | Flacone galleggiante (cheep-cheep) | sprite |
| `enemy_spugnotto.png` | Spugnotto inseguitore (blooper) | sprite |
| `boss_boxking.png` | boss BoxKing (casse impilate) | sprite |
| `salon_yac_m2.png` (opz.) | salone/stoccaggio YAC liberato del Mondo 2 | scena |

Elementi che restano disegnati nel prototipo (tile-friendly): nastro trasportatore, cassa-piattaforma, pedana a molla, piattaforma-muletto, braccio di gru.

## Regola di luce (vale per TUTTI i mondi)

Il freddo industriale è il mondo della multinazionale (l'oppressione), ma va **dosato** per non rendere il gioco cupo e poco leggibile. Come nel vero Super Mario Bros, serve il ritmo luce → buio → luce.

- **Livelli di superficie:** industriali ma **luminosi e ariosi** (luce di giorno dalle finestre, contrasto alto). Mai cupi.
- **Sotterranei / acqua:** scuri e tesi — qui il buio crea varietà ed è giusto.
- **Boss / torre:** drammatici.
- In ogni schermata i **colori caldi degli eroi** (Gocce d'Oro, power-up, personaggio) fanno da accento luminoso: lo schermo non è mai "grigio-morto".
- Il momento di **liberazione** finale esplode di caldo YAC: è il premio, e funziona solo per contrasto col mondo freddo.

## Branding (invariato)
- Eroi caldi (giallo #F2C53D, pesca #F2994A, rosa #C97B84, magenta #D96BA0, oro #C9A227) su mondo industriale freddo/grigio.
- Logo YAC su pennone e schermata di liberazione. Antagonisti = parodie, nessun marchio reale.
