import { chromium } from 'playwright';
const [,, url = 'http://localhost:5199', out = 'shot.png', w = '1440', actions = ''] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: +w, height: 900 }, deviceScaleFactor: 2 });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text().slice(0, 300)); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
for (const a of actions.split(';').filter(Boolean)) {
  const i = a.indexOf('='); const kind = a.slice(0, i), sel = a.slice(i + 1);
  if (kind === 'click') await page.click(sel);
  if (kind === 'hover') await page.hover(sel);
  await page.waitForTimeout(250);
}
await page.waitForTimeout(300);
await page.screenshot({ path: out, fullPage: true });
console.log('saved', out);
await browser.close();
