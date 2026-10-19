import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright-core');
const out = process.argv[2] || './rush'; import { mkdirSync } from 'fs'; mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n'))); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://localhost:3000/prototipi/yac-rush.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: out + '/01-start.png' });
await page.evaluate(() => document.getElementById('go').click());
await page.waitForTimeout(600);
const t0 = Date.now(); let n = 2;
while (Date.now() - t0 < 9000) {
  await page.touchscreen.tap(190, 500); await page.waitForTimeout(650 + Math.random() * 500);
  if ((Date.now() - t0) % 2500 < 700) await page.screenshot({ path: out + `/0${n++}-run.png` });
}
const info = await page.evaluate(() => { const s = window._RUSH.scene.getScene('Rush'); return { state: s.state, dist: Math.floor(s.dist), gocce: s.gocce, hearts: s.hearts, speed: Math.round(s.speed), fps: Math.round(window._RUSH.loop.actualFps), world: s.worldIdx }; });
console.log(JSON.stringify(info));
await page.screenshot({ path: out + '/09-end.png' });
if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 8).join('\n'));
await browser.close();
