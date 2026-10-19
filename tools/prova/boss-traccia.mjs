import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.addInitScript(() => { try { localStorage.setItem('syw_intro', '1'); localStorage.setItem('syw_nick', 'Tester'); localStorage.setItem('syw_perf', '0'); } catch (e) {} });
await page.goto('http://localhost:3000/?r=1', { waitUntil: 'networkidle' });
await page.evaluate(() => window._startWorld('memento', 1, { newRun: true }));
await page.waitForFunction(() => { const g = window._GAME; const s = g && g.scene.getScene('Game'); return s && s.state === 'play'; }, null, { timeout: 15000 });
await page.evaluate(() => { const s = window._GAME.scene.getScene('Game'); const b = s.level.boss; s.sizePlayer(true); s.player.setPosition(b.trigger.x - 60, s.H - 120); s.player.setVelocity(0, 0); });
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(700); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(2600);
const dump = () => page.evaluate(() => { const s = window._GAME.scene.getScene('Game'); const b = s.boss; return (b && b.body) ? { hp: b.hp, x: Math.round(b.x), y: Math.round(b.y), sx: +b.scaleX.toFixed(3), sy: +b.scaleY.toFixed(3), a: b.alpha, vis: b.visible, act: b.active, bodyB: Math.round(b.body.bottom), bodyH: Math.round(b.body.height), bodyW: Math.round(b.body.width), tint: b.tintTopLeft, blocked: b.body.blocked.down, pause: s.physics.world.isPaused } : null; });
console.log('prima', JSON.stringify(await dump()));
for (let i = 0; i < 2; i++) {
  await page.evaluate(() => { const s = window._GAME.scene.getScene('Game'); if (s.boss && s.boss.active) { s.player.setPosition(s.boss.x, s.boss.body.top - 50); s.player.setVelocity(0, 250); } });
  await page.waitForTimeout(400); console.log('colpo', i + 1, JSON.stringify(await dump()));
  await page.waitForTimeout(1200); console.log('  dopo 1.2s', JSON.stringify(await dump()));
}
await page.waitForTimeout(2000); console.log('fine', JSON.stringify(await dump()));
await browser.close();
