# SUPER YAC WORLD — Mondo 5: "La Borsa / Direzione"

Documento di design del quinto mondo. Le regole globali (luce, difficoltà boss, branding) sono nel documento del Mondo 2 / GDD: qui si applicano, non si ripetono.

Principio guida (dallo studio del vero Super Mario Bros, Mondo 5): è il mondo dell'**escalation** — introduce la Pallottola Bill e il cannone che la spara, ha **timer più stretti**, e da qui i livelli si ripetono ma più difficili. Firma giocabile: **proiettili dai cannoni**, **piattaforme mobili più piccole/infami** (5-3 riprende il 1-3), e **tutto il già visto che torna più aggressivo**.

Struttura invariata: **superficie → sotterraneo → boss**.

---

## Tema del mondo

Il quartier generale finanziario della multinazionale: grattacieli di vetro, completi grigi, numeri e ticker. Narrativamente è la **Direzione che comanda tutti i marchi**, quindi qui tornano insieme i nemici dei mondi precedenti, più aggressivi (la "ricombinazione più difficile" dell'originale). Per il ritmo di luce: mondo **luminoso ma freddo** — vetro, grigio corporate, luce diurna ad alto contrasto.

## Novità del mondo

- **Bolletta Bill** — la nostra Pallottola Bill: **cannoni-ticker** sparano bollette/fatture volanti in orizzontale (gioco di parole Bill → bolletta). Visivamente distinta dallo Spray-Bill del Mondo 3 (lì bomboletta, qui carta/fattura).
- **Piattaforme-grafico azionario** — meccanica nuova: colonne come barre di un grafico di borsa che **salgono (verdi) e crollano (rosse)**; si cavalcano i rialzi per salire e si evitano i crolli che fanno precipitare.
- **Ascensori espresso** — piattaforme mobili (le "lift più piccole" del 5-3).
- **Timer più stretti** — tocco autentico dell'originale: la pressione sale.
- **Ritorno dei nemici** dei mondi 1–4 insieme, più duri.

---

## Mondo 5-1 — "La Sala Trading" (superficie, luminoso/freddo)

Il piano della borsa tra i grattacieli: ticker, numeri, completi grigi. Debuttano i cannoni-ticker con le **Bolletta Bill** e le **piattaforme-grafico azionario**. Tornano insieme i nemici dei mondi precedenti, più duri. Checkpoint a metà, pennone YAC alla fine.

## Mondo 5-2 — "Il Caveau" (sotterraneo)

Il caveau sotto la banca: buio (sotterraneo, da regola), pieno d'oro (tante Gocce d'Oro), con **griglie laser di sicurezza** come hazard da cronometrare e **porte blindate** che fanno da piattaforme mobili. Varietà nuova rispetto agli altri sotterranei (acqua / buio-a-lampi / ooze che sale). Tubo di risalita, checkpoint a metà.

## Mondo 5-3 — "La Direzione / L'Attico" → boss Unibeauty (castello)

Scalata dell'attico dirigenziale su **ascensori espresso** e **piattaforme-grafico**, con bracci di ticker-tape rotanti / sweep laser come barre di fuoco, fino alla sala del consiglio in cima.

**Boss — Unibeauty (7 colpi).** Il mega-marchio "prodotto perfetto", tutto loghi e numeri. Per la regola di difficoltà: 7 colpi + nuovo schema — **più veloce, schemi simultanei, evoca minion** (i marchi-figli). Attacca con raffiche di Bolletta Bill, e durante lo scontro il pavimento diventa un **grafico che crolla**. Il mini-boss più tosto. Alla sconfitta i loghi della torre si ribaltano in caldo YAC → liberazione, bandiera issata. È l'ultimo marchio prima di scoprire, nel Mondo 6, che **The Conglomerate li possiede tutti**.

---

## Asset da produrre (quando si passerà alla generazione)

| File | Cosa | Tipo |
|---|---|---|
| `bg_m5_surface.png` | La Sala Trading (grattacieli, ticker, luce fredda) | fondale |
| `bg_m5_vault.png` | Il Caveau (buio, oro, laser di sicurezza) | fondale |
| `bg_m5_penthouse.png` | La Direzione / L'Attico (sala del consiglio in cima) | fondale |
| `enemy_bolletta_bill.png` | Bolletta Bill, fattura volante (Pallottola Bill) | sprite |
| `cannon_ticker.png` | cannone-ticker che spara le Bolletta Bill | sprite/elemento |
| `boss_unibeauty.png` | boss Unibeauty (mega-marchio, loghi e numeri) | sprite |

Elementi tile-friendly disegnati nel prototipo: piattaforma-grafico azionario (sale/crolla), ascensore espresso, griglia laser di sicurezza, porta blindata mobile, braccio ticker-tape rotante.

Nota: in questo mondo NON si introducono nemici a piedi nuovi — la sfida è la ricombinazione dei nemici dei mondi 1–4 + Bolletta Bill + meccaniche nuove.
