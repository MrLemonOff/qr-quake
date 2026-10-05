// End-to-end smoke test of the production build, with its Content-Security-Policy active.
// Fails on any console error, blocked request or network call, and checks the main flows.
import { startApp } from './lib.mjs';

const { browser, url, stop } = await startApp(4180);
const problems = [];
const requests = [];
let failed = false;

const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ' - ' + detail : ''}`);
  if (!ok) failed = true;
};

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(m.text()));
  page.on('pageerror', (e) => problems.push(String(e)));
  page.on('request', (r) => requests.push(r.url()));
  await page.evaluateOnNewDocument(() => localStorage.setItem('qr-quake:v2', JSON.stringify({ theme: 'light' })));
  await page.goto(url, { waitUntil: 'networkidle0' });

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const status = () => page.$eval('#status', (el) => el.dataset.state);
  const settle = async () => {
    await wait(700);
    await page.waitForFunction(() => ['good', 'fragile', 'fail', 'idle', 'error', 'untested'].includes(document.getElementById('status').dataset.state), { timeout: 20000 });
  };
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
  const type = (sel, value) =>
    page.evaluate((s, v) => {
      const el = document.querySelector(s);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, sel, value);
  const tab = (name) => click(`.tabs [data-value="${name}"]`);

  await settle();
  check('default code scans', (await status()) === 'good');

  // Content types
  await click('#typeBtn');
  await type('#typeSearch', 'wifi');
  await page.evaluate(() => document.querySelector('.type-tile:not([hidden])').click());
  await type('[data-bind="content.values.wifi.ssid"]', 'Cafe');
  await settle();
  check('wifi code scans', (await status()) === 'good');
  await click('#typeBtn');
  await type('#typeSearch', 'instagram');
  await page.evaluate(() => document.querySelector('.type-tile:not([hidden])').click());
  await type('[data-bind="content.values.instagram.user"]', '@quake');
  await settle();
  check('social profile code scans', (await status()) === 'good');
  await type('[data-bind="content.values.instagram.user"]', '');
  await settle();
  check('empty form disables export', (await status()) === 'idle' && (await page.$eval('#dlBtn', (b) => b.disabled)));
  await click('#typeBtn');
  await type('#typeSearch', 'text');
  await page.evaluate(() => document.querySelector('.type-tile:not([hidden])').click());
  await type('[data-bind="content.values.text.text"]', 'x'.repeat(5000));
  await settle();
  check('oversized data shows an error', (await status()) === 'error');
  await type('[data-bind="content.values.text.text"]', 'https://example.com');

  // Art: icon browser and a picture
  await tab('art');
  await click('#artChoose');
  await type('#artSearch', 'heart');
  await wait(900);
  await page.evaluate(() => [...document.querySelectorAll('#artBody .art-tile')].find((t) => t.title === 'heart').click());
  await settle();
  check('icon from the full library works', (await page.$eval('#artName', (e) => e.textContent)).toLowerCase().includes('heart') && (await status()) === 'good');
  await click('#artChoose');
  await click('#artTabs [data-value="picture"]');
  await click('.sample');
  await wait(2500);
  await settle();
  check('colorized picture scans', (await status()) === 'good');

  // Style: weak contrast is flagged and repaired
  await tab('style');
  await type('[data-bind="spec.fg"]', '#dddddd');
  await settle();
  check('low contrast is flagged', ['fail', 'fragile'].includes(await status()));
  await click('#fixBtn');
  await wait(1500);
  await settle();
  check('auto-fix repairs it', (await status()) === 'good');

  // Card
  await tab('card');
  await click('#cardGrid [data-value="sparkle"]');
  await settle();
  check('card scans', (await status()) === 'good');
  await click('#cardGrid [data-value="none"]');

  // Barcode
  await click('.mode-seg [data-value="barcode"]');
  await wait(1500);
  await settle();
  check('barcode scans', (await status()) === 'good');
  await page.select('#barFormat', 'ean13');
  await type('#barText', '123');
  await settle();
  check('invalid barcode text explains itself', (await status()) === 'error' && (await page.$eval('#statusDetail', (e) => e.textContent)).includes('12 or 13 digits'));
  await page.select('#barFormat', 'datamatrix');
  await settle();
  check('data matrix scans', (await status()) === 'good');
  await click('.mode-seg [data-value="qr"]');
  await settle();

  await click('#surpriseBtn');
  await wait(1500);
  await settle();
  check('surprise me produces a scannable code', (await status()) === 'good');

  const external = requests.filter((u) => !u.startsWith(url) && !u.startsWith('data:') && !u.startsWith('blob:'));
  check('no external network requests', external.length === 0, external.join(', '));
  check('no console errors or CSP violations', problems.length === 0, problems.join(' | '));
} finally {
  await stop();
}
process.exit(failed ? 1 : 0);
