# SUPER YAC WORLD — Mondo 3: "Il Reparto Marketing"

Documento di design del terzo mondo. Le regole globali (luce, difficoltà boss, branding) sono nel documento del Mondo 2 / GDD: qui non si ripetono, si applicano.

Principio guida (dallo studio del vero Super Mario Bros, Mondo 3): è uno dei due soli mondi **interamente notturni**, introduce gli **Hammer Bros** (nemico che salta e lancia dall'alto) e ha un livello di **platforming di precisione "in quota"**. Traduciamo le tre firme — notte, nemico che lancia, salita di precisione — nel distretto pubblicitario.

Struttura invariata: **superficie → sotterraneo → boss**.

---

## Tema del mondo

Il distretto della pubblicità della multinazionale, **di notte**: cartelloni al neon giganti, insegne luminose, spam volante. Estetica notturna scura (consentita e voluta dalla regola di luce) ma accesa da **neon ad altissimo contrasto** — vibrante, leggibile, mai grigio-morto. La notte qui è una scelta di varietà rispetto ai mondi luminosi 1 e 2.

## Novità del mondo

- **Promoter (alias "Mascotte")** — il nostro Hammer Bro: mascotte aziendale che saltella in cima ai cartelloni e bombarda di **volantini/coupon** dall'alto. Eco diretta dell'Hammer Bro che debutta nel 3-1.
- **Piattaforme-neon lampeggianti** — meccanica nuova: insegne che si accendono e spengono a tempo; bisogna cronometrare i salti. Tematica (neon pubblicitari) + platforming di precisione del 3-3 "in quota".
- **Spray-Bill** (Pallottola Bill già a GDD): bomboletta che vola in orizzontale, sparata dai cartelloni-cannone.
- **Etichetta-Spam** (già a GDD): sciami di etichette volanti.

---

## Mondo 3-1 — "Viale dei Cartelloni" (superficie, notte)

Distretto pubblicitario di notte: neon ovunque. Introduce in modo morbido il **Promoter** che lancia volantini dalle insegne, più sciami di Etichetta-Spam e Spray-Bill orizzontali. Casse/insegne come piattaforme. Checkpoint a metà, pennone YAC alla fine.

## Mondo 3-2 — "La Rete" (sotterraneo)

Per non ripetere l'acqua del Mondo 2, qui la varietà è la **visibilità ridotta**: i condotti/fogne degli annunci scartati, quasi al buio, dove la strada si illumina **a intermittenza** grazie alle insegne rotte che lampeggiano. Il buio diventa *meccanica*: ci si muove a tempo coi lampi di luce. Il livello più teso del mondo. Tante Gocce d'Oro, tubo di risalita, checkpoint a metà.

## Mondo 3-3 — "In Quota" → boss ViralCorp (castello)

Platforming alto tra cartelloni sospesi e insegne, sul vuoto, tutto sulle **piattaforme-neon lampeggianti** — eco diretta del 3-3 "set at the heights" — fino all'arena del boss.

**Boss — ViralCorp (5 colpi).** Un marchio che si fa pubblicità da solo: **mascotte/insegna gigante animata**, tutta luci e slogan, che attacca con raffiche di volantini, fasci di neon e sciami di spam evocati. Per la regola di difficoltà: 5 colpi + l'arena usa le piattaforme-neon lampeggianti e le raffiche di volantini (più duro e più tecnico di BoxKing). Alla sconfitta i cartelloni si ribaltano e diventano caldi YAC → distretto liberato, bandiera issata. Narrativa: è solo un altro marchio che, si scopre alla fine, appartiene a **The Conglomerate**.

---

## Asset da produrre (quando si passerà alla generazione)

| File | Cosa | Tipo |
|---|---|---|
| `bg_m3_surface.png` | Viale dei Cartelloni (notte, neon) | fondale |
| `bg_m3_net.png` | La Rete (sotterraneo buio a intermittenza) | fondale |
| `bg_m3_heights.png` | In Quota (cartelloni sospesi, notte) | fondale |
| `enemy_promoter.png` | Promoter/Mascotte che lancia volantini (Hammer Bro) | sprite |
| `enemy_spraybill.png` | Spray-Bill (Bullet Bill) | sprite |
| `enemy_etichetta_spam.png` | Etichetta-Spam volante (a sciami) | sprite |
| `boss_viralcorp.png` | boss ViralCorp (mascotte/insegna gigante) | sprite |

Elementi tile-friendly disegnati nel prototipo: piattaforma-neon lampeggiante, cartellone-piattaforma, cartellone-cannone (sorgente Spray-Bill).
