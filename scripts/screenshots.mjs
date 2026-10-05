// Takes the README screenshots from the real app: docs/screenshots/*.png.
// Needs Chrome, Edge or Chromium installed (set CHROME_PATH to point at a specific one).
import fs from 'node:fs';
import path from 'node:path';
import { startApp, root } from './lib.mjs';

const outDir = path.join(root, 'docs', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.endsWith('.png')) fs.rmSync(path.join(outDir, f));

console.log('Building...');
const { browser, url, stop } = await startApp();

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open({ width = 1280, height = 900, theme = 'light', scale = 1.5, mobile = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile });
  await page.evaluateOnNewDocument((t) => localStorage.setItem('qr-quake:v2', JSON.stringify({ theme: t })), theme);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await settle(page);
  return page;
}

const settle = async (page) => {
  await wait(900);
  await page.waitForFunction(() => ['good', 'fragile', 'fail', 'idle', 'error', 'untested'].includes(document.getElementById('status').dataset.state), { timeout: 20000 });
  await wait(300);
};
const click = (page, sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
const type = (page, sel, value) =>
  page.evaluate(
    (s, v) => {
      const el = document.querySelector(s);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    sel,
    value,
  );
const tab = (page, name) => click(page, `.tabs [data-value="${name}"]`);
const shot = async (page, name, target) => {
  await settle(page);
  const file = path.join(outDir, `${name}.png`);
  if (target) await (await page.$(target)).screenshot({ path: file });
  else await page.screenshot({ path: file });
  console.log('docs/screenshots/' + name + '.png');
};
const pickType = async (page, search) => {
  await click(page, '#typeBtn');
  await type(page, '#typeSearch', search);
  await page.evaluate(() => document.querySelector('.type-tile:not([hidden])').click());
};
const URL_TEXT = 'https://example.com/qr-quake';

try {
  // Home: light, default center sign.
  {
    const page = await open();
    await type(page, '[data-bind="content.values.text.text"]', URL_TEXT);
    await shot(page, 'home-light');
    await page.close();
  }
  // Hero: dark, a colorized picture, art tab.
  {
    const page = await open({ theme: 'dark' });
    await type(page, '[data-bind="content.values.text.text"]', URL_TEXT);
    await tab(page, 'art');
    await click(page, '#artChoose');
    await click(page, '#artTabs [data-value="picture"]');
    await click(page, '.sample');
    await wait(3000);
    await shot(page, 'home-dark');
    await page.close();
  }
  // Dialogs and tabs (cards at a higher scale).
  {
    const page = await open({ scale: 2, height: 1100 });
    await click(page, '#typeBtn');
    await wait(500);
    await shot(page, 'content-types', '#typeDialog');
    await page.keyboard.press('Escape');
    await tab(page, 'art');
    await click(page, '#artChoose');
    await wait(1500);
    await shot(page, 'art-icons', '#artDialog');
    await click(page, '#artTabs [data-value="brand"]');
    await wait(1200);
    await shot(page, 'art-brands', '#artDialog');
    await click(page, '#artTabs [data-value="emoji"]');
    await wait(500);
    await shot(page, 'art-emoji', '#artDialog');
    await page.keyboard.press('Escape');
    await wait(300);

    // Picture, colorize.
    await click(page, '#artChoose');
    await click(page, '#artTabs [data-value="picture"]');
    await click(page, '.sample:nth-child(3)');
    await wait(3000);
    await shot(page, 'art-picture', '.editor');
    await shot(page, 'preview-fill', '.preview-card');

    // Style tab with a picker open.
    await click(page, '[data-bind="spec.art.placement"] [data-value="center"]');
    await click(page, '#artChoose');
    await click(page, '#artTabs [data-value="icon"]');
    await wait(600);
    await page.evaluate(() => document.querySelector('#artBody .art-tile').click());
    await tab(page, 'style');
    await click(page, '#shapePicker .picker-trigger');
    await wait(400);
    await shot(page, 'style', '.editor');
    await click(page, '#shapePicker [data-value="dot"]');
    await click(page, '.palette .swatch[data-palette="Grape"]');
    await click(page, '.switch[data-bind="spec.gradient"]');

    // Card tab.
    await tab(page, 'card');
    await click(page, '#cardGrid [data-value="sparkle"]');
    await wait(500);
    await shot(page, 'card-tab', '.editor');
    await shot(page, 'preview-card', '.preview-card');
    await page.close();
  }
  // Wi-Fi form.
  {
    const page = await open({ scale: 2, height: 1100 });
    await pickType(page, 'wifi');
    await type(page, '[data-bind="content.values.wifi.ssid"]', 'Cafe Quake');
    await type(page, '[data-bind="content.values.wifi.password"]', 'espresso-2026');
    await shot(page, 'content-wifi', '.editor');
    await page.close();
  }
  // Barcode.
  {
    const page = await open({ height: 900 });
    await click(page, '.mode-seg [data-value="barcode"]');
    await wait(1500);
    await page.select('#barFormat', 'ean13');
    await type(page, '#barText', '590123412345');
    await tab(page, 'style');
    await click(page, '.switch[data-bind="bar.gradient"]');
    await click(page, '#barPalette .swatch[data-palette="Azure"]');
    await tab(page, 'content');
    await shot(page, 'barcode');
    await tab(page, 'card');
    await click(page, '#cardGrid [data-value="ticket"]');
    await wait(500);
    await shot(page, 'preview-barcode', '.preview-card');
    await page.close();
  }
  // Phone.
  {
    const page = await open({ width: 390, height: 844, scale: 2, mobile: true });
    await type(page, '[data-bind="content.values.text.text"]', URL_TEXT);
    await tab(page, 'card');
    await click(page, '#cardGrid [data-value="poster"]');
    await wait(500);
    await shot(page, 'phone');
    await page.close();
  }
} finally {
  await stop();
}
