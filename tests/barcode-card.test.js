import { describe, it, expect, beforeAll } from 'vitest';
import { createQR, createBarcode, barcodeVerifyOptions } from '../src/core/render.js';
import { verifyScene, limitByContrast } from '../src/core/verify.js';
import { inkContrast } from '../src/core/colors.js';
import { BARCODES, BarcodeError, loadBarcodeLibrary, DEFAULT_BAR, normalizeBar } from '../src/core/barcode.js';
import { CARD_PRESETS, cardFromPreset, normalizeCard, DEFAULT_CARD } from '../src/core/card.js';
import { sceneToSvg } from '../src/core/paint-svg.js';
import { autoFixBarcode } from '../src/core/autofix.js';
import { DEFAULT_SPEC } from '../src/core/defaults.js';
import { drawSign, findSign } from '../src/core/signs.js';

const TEXT = 'https://example.com/qr-quake';
let lib;
beforeAll(async () => {
  lib = await loadBarcodeLibrary();
});

async function checkBarcode(bar, card = null) {
  const { scene, enc } = createBarcode({ lib, bar, card });
  const options = barcodeVerifyOptions(enc);
  return { scene, enc, check: options ? await verifyScene(scene, enc.expected, options) : null };
}

describe('barcodes', () => {
  for (const def of BARCODES) {
    it(`encodes the ${def.label} example${def.zx ? ' and reads it back' : ''}`, async () => {
      const { enc, check, scene } = await checkBarcode({ ...DEFAULT_BAR, format: def.id, text: def.example, quiet: def.kind === '2d' ? 3 : 10 });
      expect(enc.kind).toBe(def.kind);
      expect(scene.width).toBeGreaterThan(10);
      if (def.zx) expect(check.status, def.id).not.toBe('fail');
      else expect(check).toBeNull();
    });
  }

  it('reads the common formats reliably', async () => {
    for (const id of ['code128', 'ean13', 'upca', 'code39', 'itf', 'datamatrix', 'aztec']) {
      const def = BARCODES.find((b) => b.id === id);
      const { check } = await checkBarcode({ ...DEFAULT_BAR, format: id, text: def.example, quiet: def.kind === '2d' ? 3 : 10 });
      expect(check.status, id).toBe('good');
    }
  });

  it('adds the check digit to EAN-13 and says what a scanner should read', () => {
    const { enc } = createBarcode({ lib, bar: { ...DEFAULT_BAR, format: 'ean13', text: '590123412345' } });
    expect(enc.expected).toBe('5901234123457');
    expect(enc.modules).toBe(95);
  });

  it('explains invalid input in plain words', () => {
    expect(() => createBarcode({ lib, bar: { ...DEFAULT_BAR, format: 'ean13', text: '123' } })).toThrow(BarcodeError);
    try {
      createBarcode({ lib, bar: { ...DEFAULT_BAR, format: 'ean13', text: '123' } });
    } catch (err) {
      expect(err.message).toMatch(/EAN-13 must be 12 or 13 digits/);
      expect(err.message).not.toMatch(/bwip/i);
    }
    expect(() => createBarcode({ lib, bar: { ...DEFAULT_BAR, format: 'code128', text: '   ' } })).toThrow(/Type something/);
  });

  it('supports colors, gradients, rounded bars and no text', async () => {
    const bar = { ...DEFAULT_BAR, gradient: true, fg: '#581C87', fg2: '#BE185D', round: 0.6, shrink: 0.1, showText: false, bg: '#FFF8F1' };
    const { check, scene } = await checkBarcode(bar);
    expect(check.status).not.toBe('fail');
    expect(sceneToSvg(scene)).toContain('<linearGradient');
  });

  it('draws the human-readable text', () => {
    const { scene } = createBarcode({ lib, bar: { ...DEFAULT_BAR, format: 'ean13', text: '5901234123457' } });
    const texts = scene.items.filter((i) => i.t === 'text').map((i) => i.text);
    expect(texts.join('')).toBe('5901234123457');
    expect(sceneToSvg(scene)).toContain('<text');
  });

  it('normalizes bad settings', () => {
    const b = normalizeBar({ format: 'nope', height: 99, shrink: 5, fg: '<x>' });
    expect(b.format).toBe('code128');
    expect(b.height).toBe(1.2);
    expect(b.shrink).toBe(0.45);
    expect(b.fg).toBe(DEFAULT_BAR.fg);
  });

  it('repairs a barcode with weak colors', async () => {
    const result = await autoFixBarcode({ lib, bar: { ...DEFAULT_BAR, fg: '#DDDDDD', fg2: '#DDDDDD' } });
    expect(result.check.status).toBe('good');
    expect(result.changes.length).toBeGreaterThan(0);
  });
});

describe('cards', () => {
  for (const preset of CARD_PRESETS.filter((p) => p.id !== 'none')) {
    it(`wraps a QR code in the ${preset.name} card and it still reads`, async () => {
      const card = cardFromPreset(preset.id);
      const plain = createQR({ text: TEXT, spec: DEFAULT_SPEC });
      const { scene } = createQR({ text: TEXT, spec: DEFAULT_SPEC, card });
      expect(scene.width).toBeGreaterThan(plain.scene.width);
      expect(scene.height).toBeGreaterThan(plain.scene.height);
      const check = await verifyScene(scene, TEXT);
      expect(check.status, preset.id).toBe('good');
    });
  }

  it('wraps a barcode and a sign-in-the-middle QR code', async () => {
    const sign = await drawSign(findSign('zap'), { color: '#2F6BDC', badge: true });
    const qr = createQR({ text: TEXT, spec: DEFAULT_SPEC, source: sign, card: cardFromPreset('poster') });
    expect((await verifyScene(qr.scene, TEXT)).status).toBe('good');
    const { check } = await checkBarcode(DEFAULT_BAR, cardFromPreset('sticker'));
    expect(check.status).toBe('good');
  });

  it('is unchanged when the preset is "none"', () => {
    const plain = createQR({ text: TEXT, spec: DEFAULT_SPEC });
    const none = createQR({ text: TEXT, spec: DEFAULT_SPEC, card: cardFromPreset('none') });
    expect(none.scene.width).toBe(plain.scene.width);
  });

  it('supports every border style and ornament', async () => {
    for (const borderStyle of ['solid', 'double', 'dashed', 'dotted', 'gradient', 'neon']) {
      for (const ornament of ['none', 'brackets', 'sparkles', 'stars', 'dots', 'corners']) {
        const card = { ...cardFromPreset('clean'), border: 0.02, borderStyle, ornament, shadow: 0.5, glow: borderStyle === 'neon' ? 0.5 : 0 };
        const { scene } = createQR({ text: TEXT, spec: DEFAULT_SPEC, card });
        expect(sceneToSvg(scene).length, `${borderStyle}/${ornament}`).toBeGreaterThan(500);
      }
    }
  });

  it('writes the card text into the SVG, escaped', () => {
    const card = { ...cardFromPreset('poster'), title: '<b>Hi & bye</b>' };
    const svg = sceneToSvg(createQR({ text: TEXT, spec: DEFAULT_SPEC, card }).scene);
    expect(svg).toContain('&lt;b&gt;Hi &amp; bye&lt;/b&gt;');
    expect(svg).not.toContain('<b>Hi');
  });

  it('normalizes bad card settings', () => {
    const c = normalizeCard({ preset: 'nope', bg: 'url(x)', radius: 9, borderStyle: '?', title: 'x'.repeat(200) });
    expect(c.preset).toBe('none');
    expect(c.bg).toBe(DEFAULT_CARD.bg);
    expect(c.radius).toBe(0.5);
    expect(c.borderStyle).toBe('solid');
    expect(c.title.length).toBe(60);
  });
});
