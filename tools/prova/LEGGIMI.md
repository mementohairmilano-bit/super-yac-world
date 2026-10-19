# Banco di prova headless (Chromium, 60 fps veri)

Apre il gioco su `localhost:3000` (dev server Vite acceso), avvia un eroe in un livello, gioca
con la tastiera e salva schermate + fps + errori di pagina. Usa il Chrome installato sul Mac.

```bash
# gioca 6 secondi nel Mondo 1 con Memento, schermate in ./out
node tools/prova/gioca.mjs "http://localhost:3000/?r=1" ./out memento 1 6
# modalità "dio" (niente morte) per schermate di valutazione
GOD=1 node tools/prova/gioca.mjs "http://localhost:3000/?r=1" ./out yuri 5 5
# scontro col boss del livello 1 (teletrasporto davanti all'arena, 4 stomp)
node tools/prova/boss.mjs "http://localhost:3000/?r=1" ./boss 1
# telefono (iPhone in orizzontale, touch): menu + joystick
node tools/prova/telefono.mjs ./telefono
```

`?r=N` forza la densità di resa (1 = veloce per i test; senza parametro il gioco sceglie da solo).
Livelli: 1 … 17 (17 = L'Officina). Nel browser senza finestra la GPU è software: gli fps sono
indicativi, gli errori e le schermate sono veri.
