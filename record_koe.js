const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const W = 1440, H = 900, OUT = path.resolve(__dirname, 'rec');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const errors = [];
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: { width: W, height: H } }
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.goto('http://localhost:8777/koe.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  // ゆっくり見出し→数字カード→流れる帯 と見せる
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  await page.waitForTimeout(2600);                 // 見出し＋数字
  await page.evaluate(() => window.scrollTo({ top: 340, behavior: 'smooth' }));
  await page.waitForTimeout(3200);                 // 数字カード
  await page.evaluate(() => window.scrollTo({ top: 760, behavior: 'smooth' }));
  await page.waitForTimeout(6500);                 // 流れる帯（メイン）
  await page.evaluate(() => window.scrollTo({ top: 1050, behavior: 'smooth' }));
  await page.waitForTimeout(6000);                 // 帯の続き
  await page.evaluate(() => window.scrollTo({ top: 640, behavior: 'smooth' }));
  await page.waitForTimeout(4000);

  console.log('ERRORS ' + JSON.stringify(errors));
  await ctx.close();
  const f = fs.readdirSync(OUT).filter((x) => x.endsWith('.webm')).sort().pop();
  console.log('VIDEO ' + (f ? path.join(OUT, f) : 'none'));
  await browser.close();
})();
