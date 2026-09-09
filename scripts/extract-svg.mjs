// Pull the rendered chart + sparkline SVGs out of the running app so the
// Figma page can use the exact same curves as the build.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const [,, url = 'http://localhost:5199', outDir = '.'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const data = await page.evaluate(() => {
  const resolve = (el) => {
    // inline CSS variables so the SVG is self-contained
    const cs = getComputedStyle(document.documentElement);
    let html = el.outerHTML;
    html = html.replace(/var\((--[a-z0-9-]+)\)/g, (_, v) => cs.getPropertyValue(v).trim());
    return html;
  };
  const chart = document.querySelector('.chart svg.recharts-surface');
  const r = chart.getBoundingClientRect();
  const sparks = [...document.querySelectorAll('svg.kpi__spark')].map(resolve);
  return { chart: resolve(chart), chartW: r.width, chartH: r.height, sparks };
});
writeFileSync(`${outDir}/chart-30d.svg`, data.chart);
data.sparks.forEach((s, i) => writeFileSync(`${outDir}/spark-${i}.svg`, s));
console.log('chart', data.chartW, data.chartH, 'sparks', data.sparks.length);
await browser.close();
