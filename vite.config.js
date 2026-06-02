import { defineConfig } from 'vite';
import { cpSync, existsSync } from 'fs';

// Gli asset di gioco (sprite, sfondi, audio) sono caricati a RUNTIME come stringhe
// './assets/...' (Phaser, audio.js), quindi Vite NON li bundla/copia da solo: senza
// questo, in produzione esistono solo le immagini IMPORTATE (le card) e tutto il resto
// dà 404 → gioco rotto dopo il menu. Questo plugin copia l'intera cartella assets/ in
// dist/assets/ a fine build, preservando i percorsi '/assets/...'.
function copyRuntimeAssets() {
  return {
    name: 'copy-runtime-assets',
    apply: 'build',
    closeBundle() {
      if (existsSync('assets')) cpSync('assets', 'dist/assets', { recursive: true });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [copyRuntimeAssets()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
  },
});
