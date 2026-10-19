// Banco di prova headless per Super Yac World: apre il gioco, salta i pannelli, avvia un eroe,
// gioca con la tastiera per qualche secondo e salva schermate + misura fps.
// uso: node play.mjs <url> <outdir> [hero] [world] [secondi]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const [,, url = 'http://localhost:3000', out = './out', hero = 'memento', world = '1', secs = '6', vw = '1280', vh = '720'] = process.argv;
const exe = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
import { mkdirSync } from 'fs';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const ctx = await browser.newContext({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 8).join('\n')));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('syw_intro', '1'); localStorage.setItem('syw_nick', 'Tester'); localStorage.setItem('syw_perf', '0'); } catch (e) {} });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
// chiudi eventuale avviso installazione
await page.evaluate(() => { const b = document.getElementById('btn-install-close'); if (b) b.click(); const n = document.getElementById('nameask'); if (n) n.classList.add('hidden'); });
await page.screenshot({ path: out + '/01-menu.png' });
await page.evaluate(([h, w]) => window._startWorld(h, parseInt(w, 10), { newRun: true }), [hero, world]);
await page.waitForTimeout(1200);
await page.evaluate(() => { ['install-help','intro','nameask'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.add('hidden'); }); });
await page.screenshot({ path: out + '/02-intro.png' });
await page.waitForTimeout(1000);
await page.waitForFunction(() => { const g = window._GAME; const s = g && g.scene.getScene('Game'); return s && s.state === 'play'; }, null, { timeout: 8000 }).catch(() => {});
await page.screenshot({ path: out + '/03-start.png' });
// gioca: corri a destra e salta a intervalli
const t0 = Date.now(); let shot = 4;
await page.keyboard.down('ArrowRight');
while (Date.now() - t0 < +secs * 1000) {
  if (process.env.GOD) await page.evaluate(() => { const s = window._GAME.scene.getScene('Game'); if (s && s.player) { s.player.invuln = true; if (s.player.y > 500) { s.player.y = 300; s.player.setVelocityY(0); } } });
  await page.keyboard.down('Space'); await page.waitForTimeout(140); await page.keyboard.up('Space');
  await page.waitForTimeout(700);
  if ((Date.now() - t0) % 2000 < 850) { await page.screenshot({ path: out + `/${String(shot++).padStart(2, '0')}-play.png` }); }
}
await page.keyboard.up('ArrowRight');
const info = await page.evaluate(() => { try { const g = window._GAME; const s = g.scene.getScene('Game'); return { fps: Math.round(g.loop.actualFps), state: s.state, x: s.player && Math.round(s.player.x), y: s.player && Math.round(s.player.y), lives: s.lives, score: s.score, canvas: [g.canvas.width, g.canvas.height], css: [g.canvas.style.width, g.canvas.style.height], R: window._R }; } catch (e) { return { err: String(e) }; } });
console.log(JSON.stringify(info));
if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 20).join('\n'));
await browser.close();
