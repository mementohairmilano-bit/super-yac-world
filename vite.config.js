import { defineConfig } from 'vite';
import { cpSync, existsSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Gli asset di gioco (sprite, sfondi, audio) sono caricati a RUNTIME come stringhe './assets/...'
// (Phaser, audio.js), quindi Vite NON li bundla da solo: questo plugin copia assets/ in dist/.
// Inoltre prepara la PWA OFFLINE: genera precache.json (lista di TUTTI i file da mettere in cache)
// e inietta una versione di build nel service worker (così si aggiorna a ogni deploy).
function listFiles(dir, base) {
  let out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out = out.concat(listFiles(p, base));
    else out.push('/' + p.slice(base.length + 1).split('\\').join('/'));
  }
  return out;
}

function pwaOffline() {
  return {
    name: 'pwa-offline',
    apply: 'build',
    closeBundle() {
      if (existsSync('assets')) cpSync('assets', 'dist/assets', { recursive: true });
      if (!existsSync('dist')) return;
      // lista per il precache (esclude il SW stesso e il manifest)
      const all = listFiles('dist', 'dist').filter((u) => u !== '/sw.js' && u !== '/precache.json');
      writeFileSync('dist/precache.json', JSON.stringify(all));
      // versione di build nel service worker → si re-installa e ri-precacha a ogni deploy
      const sw = 'dist/sw.js';
      if (existsSync(sw)) {
        const ver = Date.now().toString(36);
        writeFileSync(sw, readFileSync(sw, 'utf8').split('__BUILD__').join(ver));
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [pwaOffline()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
  },
});
