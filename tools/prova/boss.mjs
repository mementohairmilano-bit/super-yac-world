// Prova del boss: teletrasporta l'eroe davanti all'arena (GRANDE), aspetta l'intro, lo fa saltare sul boss
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const [,, url = 'http://localhost:3000/?r=1', out = './boss', world = '1'] = process.argv;
import { mkdirSync } from 'fs'; mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('syw_intro', '1'); localStorage.setItem('syw_nick', 'Tester'); localStorage.setItem('syw_perf', '0'); } catch (e) {} });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate((w) => { ['install-help','nameask'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.add('hidden'); }); window._startWorld('memento', parseInt(w, 10), { newRun: true }); }, world);
await page.waitForFunction(() => { const g = window._GAME; const s = g && g.scene.getScene('Game'); return s && s.state === 'play'; }, null, { timeout: 15000 });
// teletrasporto davanti al trigger del boss, da GRANDE
await page.evaluate(() => { const s = window._GAME.scene.getScene('Game'); const b = s.level.boss; s.sizePlayer(true); s.player.setPosition(b.trigger.x - 120, s.H - 120); s.player.setVelocity(0, 0); s.cameras.main.centerOn(s.player.x, s.H - 200); });
await page.waitForTimeout(300);
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(900); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(600);
await page.screenshot({ path: out + '/01-boss-intro.png' });
await page.waitForTimeout(1600);
await page.screenshot({ path: out + '/02-boss-fight.png' });
// qualche "stomp" forzato: teletrasporto sopra il boss e lascio cadere
for (let i = 0; i < 4; i++) {
  await page.evaluate(() => { const s = window._GAME.scene.getScene('Game'); if (s.boss && s.boss.active) { s.player.invuln = false; s.player.setPosition(s.boss.x, s.boss.body.top - 60); s.player.setVelocity(0, 200); } });
  await page.waitForTimeout(700);
  if (i === 1) await page.screenshot({ path: out + '/03-boss-hit.png' });
}
await page.waitForTimeout(1200);
await page.screenshot({ path: out + '/04-after.png' });
const info = await page.evaluate(() => { const s = window._GAME.scene.getScene('Game'); return { state: s.state, bossActive: s.bossActive, bossDefeated: s.bossDefeated, hp: s.boss && s.boss.hp, lives: s.lives, score: s.score, fps: Math.round(window._GAME.loop.actualFps) }; });
console.log(JSON.stringify(info));
if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 12).join('\n'));
await browser.close();
