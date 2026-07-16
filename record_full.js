const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const W = 1440, H = 900, OUT = path.resolve(__dirname, 'rec_full');
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
  await page.goto('http://localhost:8777/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1800);

  const toY = (y, wait) => page.evaluate((y)=>window.scrollTo({top:y,behavior:'smooth'}), y).then(()=>page.waitForTimeout(wait));
  const toSel = (sel, wait, off=70) => page.evaluate(({sel,off})=>{const el=document.querySelector(sel);if(el)window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-off,behavior:'smooth'});},{sel,off}).then(()=>page.waitForTimeout(wait));

  await page.waitForTimeout(1600);                 // ヒーロー
  await toSel('#prob', 2600);                      // 問題提起
  await toSel('#story', 2800);                     // ストーリー
  await toSel('#reason', 2600);                    // 選ばれる理由
  await toSel('#curriculum', 2800);                // カリキュラム
  await toSel('#voice', 1600);                     // 声：見出し
  await toY(0, 0); // noop keep
  await page.evaluate(()=>document.querySelector('#voice .feat').scrollIntoView({behavior:'smooth',block:'center'}));
  await page.waitForTimeout(2400);                 // 数字カード
  await page.evaluate(()=>document.querySelector('#lane2').scrollIntoView({behavior:'smooth',block:'center'}));
  await page.waitForTimeout(5200);                 // 流れる帯

  // 助成金：診断＋シミュレーター
  await toSel('#subsidy', 2200, 40);
  // 診断を順に「はい」
  for (const q of [0,1,2]) {
    await page.evaluate((qi)=>{const b=document.querySelector(`.q[data-q="${qi}"] .opt button[data-v="1"]`); if(b) b.click();}, q);
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(1400);                 // 診断結果
  // シミュレーターのスライダーを動かす（10→30→5→18）
  const setP = async (v) => { await page.evaluate((v)=>{const p=document.getElementById('ppl');p.value=v;p.dispatchEvent(new Event('input'));},v); await page.waitForTimeout(900); };
  await page.evaluate(()=>document.querySelector('.sim').scrollIntoView({behavior:'smooth',block:'center'}));
  await page.waitForTimeout(900);
  for (const v of [12,18,26,34,42,30,10]) await setP(v);
  await page.waitForTimeout(600);
  await toSel('.ptable', 1800, 120);               // 料金表

  await toSel('#flow', 2600);                      // 導入の流れ
  await toSel('#faq', 1600);                       // FAQ
  await page.evaluate(()=>document.querySelectorAll('.fq-q')[0]?.click());
  await page.waitForTimeout(700);
  await page.evaluate(()=>document.querySelectorAll('.fq-q')[1]?.click());
  await page.waitForTimeout(1200);
  await toSel('#contact', 2200);                   // CTA
  await page.waitForTimeout(1200);

  console.log('ERRORS ' + JSON.stringify(errors));
  await ctx.close();
  const f = fs.readdirSync(OUT).filter((x) => x.endsWith('.webm')).sort().pop();
  console.log('VIDEO ' + (f ? path.join(OUT, f) : 'none'));
  await browser.close();
})();
