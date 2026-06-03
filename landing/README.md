# Super Yac World — Landing page

Landing page promozionale del gioco **Super Yac World**, in stile gioco e coerente
con il brand YAC (palette oro/pesca/rosa, font Syne + DM Sans, tagline *Break the Mold*).

## Cosa contiene la pagina

1. **Hero** — logo + titolo "blocco 3D" come nel gioco, tagline *Spezza le catene*, CTA **GIOCA ORA → superyacworld.it**.
2. **Il messaggio** — la lotta contro le multinazionali della bellezza di massa, con il contrasto
   *prima/dopo* (salone occupato grigio → YAC Salon liberato e caldo).
3. **Come si gioca** — griglia di feature (6 mondi, 4 eroi, gocce d'oro, gamepad/touch/TV…).
4. **Trailer & demo giocabile** — un breve **video** del gioco + tab "**Gioca live**" che incorpora
   `www.superyacworld.it` in un iframe (caricato solo al click).
5. **Gli eroi** — le 4 card dei personaggi con ruolo, abilità e frase di carattere.
6. **I nemici** — The Conglomerate (boss finale) + i boss-marchio (MegaGloss, BoxKing, ViralCorp,
   ToxiLab, Unibeauty) e i mostri minori. Tutti **parodia**, mai marchi reali.
7. **Vision YAC** — *da parrucchieri, per parrucchieri*, community, *Break the Mold*, con la mascotte.
8. **CTA finale → Yacstore.it** — il rimando al brand store.

Tutto è in un singolo `index.html` (HTML + CSS + JS inline), con le immagini in `img/`.
Nessun build step, nessuna dipendenza.

## Note sul trailer video

Il video è ospitato su CDN e referenziato via URL nel tag `<video>`. Se per qualunque motivo
non si carica, la pagina mostra automaticamente un fallback giocabile (CTA verso il gioco) e
la tab "Gioca live" resta sempre disponibile. Per renderlo del tutto self-hosted, scarica il file
mp4 e salvalo come `img/trailer.mp4`, poi sostituisci l'URL del `<source>` con `img/trailer.mp4`.

## Deploy

La pagina è **statica e indipendente** dal build Vite del gioco (che pubblica `dist/`).

- **Anteprima locale:** apri `index.html` nel browser, oppure `npx serve landing`.
- **Sito separato (consigliato):** crea un sito che pubblichi la cartella `landing/`
  senza build (es. su Netlify: *Publish directory* = `landing`, *Build command* vuoto).
- **Sottocartella:** puoi servirla anche come `/landing` da qualsiasi hosting statico.

I link esterni puntano a `https://www.superyacworld.it` (gioco) e `https://www.yacstore.it` (store).
