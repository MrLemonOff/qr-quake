import { describe, it, expect, beforeAll } from 'vitest';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { createQR, createVerifiedQR } from '../src/core/render.js';
import { verifyScene } from '../src/core/verify.js';
import { sceneToSvg } from '../src/core/paint-svg.js';
import { autoFix, dotContrast, randomReadable } from '../src/core/autofix.js';
import { normalizeSpec, DEFAULT_SPEC, SHAPES, EYE_FRAMES, EYE_BALLS, PALETTES, randomStyle } from '../src/core/defaults.js';
import { drawSample, SAMPLES } from '../src/core/samples.js';
import { drawSign, drawTextSign, findSign, ALL_SIGNS, signSvg } from '../src/core/signs.js';
import { hasAlpha } from '../src/core/art.js';
import { contrast, parseColor } from '../src/core/colors.js';

const TEXT = 'https://example.com/qr-quake?ref=tests';
const art = (patch = {}, top = {}) => ({ ...DEFAULT_SPEC, ...top, art: { ...DEFAULT_SPEC.art, ...patch } });
const notFail = (check, label = '') => expect(check.status, label).not.toBe('fail');

let sign;
beforeAll(async () => {
  sign = await drawSign(findSign('zap'), { color: '#2F6BDC', badge: true });
});

describe('plain styles', () => {
  for (const shape of SHAPES) {
    it(`reads the "${shape}" dot shape`, async () => {
      const { check } = await createVerifiedQR({ text: TEXT, spec: { ...DEFAULT_SPEC, shape } });
      notFail(check);
      expect(check.zxing).toBeGreaterThanOrEqual(3);
    });
  }

  it('reads every eye frame and ball combination', async () => {
    for (const eyeFrame of EYE_FRAMES) {
      for (const eyeBall of EYE_BALLS) {
        const { check } = await createVerifiedQR({ text: TEXT, spec: { ...DEFAULT_SPEC, shape: 'square', eyeFrame, eyeBall } });
        notFail(check, `${eyeFrame}/${eyeBall}`);
      }
    }
  });

  it('reads every palette, with and without a gradient', async () => {
    for (const p of PALETTES) {
      for (const gradient of [false, true]) {
        const { check } = await createVerifiedQR({ text: TEXT, spec: { ...DEFAULT_SPEC, fg: p.fg, fg2: p.fg2, bg: p.bg, gradient } });
        notFail(check, `${p.name} gradient=${gradient}`);
      }
    }
  });

  it('reads dots with a custom size and roundness', async () => {
    for (const patch of [{ shape: 'dot', scale: 0.9 }, { shape: 'tiles', roundness: 0.2 }, { shape: 'liquid', roundness: 0.3 }, { shape: 'bars', roundness: 0.5 }]) {
      const { check } = await createVerifiedQR({ text: TEXT, spec: { ...DEFAULT_SPEC, ...patch } });
      notFail(check, JSON.stringify(patch));
    }
  });

  it('reads separate corner frame and center colors', async () => {
    const { check } = await createVerifiedQR({ text: TEXT, spec: { ...DEFAULT_SPEC, eyeColor: '#B91C1C', eyeBallColor: '#1D4FB8' } });
    notFail(check);
  });

  it('handles a transparent background (checked on white)', async () => {
    const { check } = await createVerifiedQR({ text: TEXT, spec: { ...DEFAULT_SPEC, transparent: true } });
    expect(check.status).toBe('good');
  });

  it('grows with the detail setting', () => {
    const small = createQR({ text: 'hi', spec: DEFAULT_SPEC });
    const big = createQR({ text: 'hi', spec: { ...DEFAULT_SPEC, detail: 4 } });
    expect(big.matrix.version).toBeGreaterThan(small.matrix.version);
  });

  it('reports a code that cannot scan as a failure', async () => {
    const spec = { ...DEFAULT_SPEC, fg: '#EEEEEE', bg: '#FFFFFF' };
    expect((await verifyScene(createQR({ text: TEXT, spec }).scene, TEXT)).status).toBe('fail');
  });
});

describe('center signs', () => {
  it('reads a center sign with every cutout shape', async () => {
    for (const shape of ['circle', 'rounded', 'square', 'free']) {
      const { check, scene } = await createVerifiedQR({ text: TEXT, spec: art({ shape }), source: sign });
      notFail(check, shape);
      expect(scene.info.clearedRatio).toBeGreaterThan(0);
    }
  });

  it('supports a ring, a plate and a custom size', async () => {
    const { check } = await createVerifiedQR({ text: TEXT, spec: art({ ring: 0.8, ringColor: '#FDE047', plate: '#FFFFFF', size: 0.2 }), source: sign });
    notFail(check);
  });

  it('never covers more of the code than the error correction allows', () => {
    const { scene } = createQR({ text: TEXT, spec: art({ size: 0.5, shape: 'square', ring: 2 }), source: sign });
    expect(scene.info.clearedRatio).toBeLessThanOrEqual(0.2);
    expect(scene.info.logoLimited).toBe(true);
  });

  it('never wipes out finder or format modules, even for a huge sign', () => {
    const { scene, matrix } = createQR({ text: 'x', spec: art({ size: 0.5, shape: 'square' }), source: sign });
    expect(scene.info.logoSize * matrix.n).toBeLessThan(matrix.n - 16);
  });

  it('reads a text sign', async () => {
    const { check } = await createVerifiedQR({ text: TEXT, spec: art(), source: drawTextSign('Q', { color: '#1D4FB8', badge: true }) });
    notFail(check);
  });

  it('reads every built-in sign in the center', async () => {
    for (const s of ALL_SIGNS) {
      const canvas = await drawSign(s, { color: '#1D4FB8', badge: true });
      const { check } = await createVerifiedQR({ text: TEXT, spec: art(), source: canvas });
      notFail(check, s.id);
    }
  });

  it('detects transparency in signs but not in photos', () => {
    expect(hasAlpha(sign)).toBe(true);
    expect(hasAlpha(drawSample('sunset'))).toBe(false);
  });
});

describe('pictures', () => {
  const pictures = {
    ...Object.fromEntries(SAMPLES.map((s) => [s.id, () => drawSample(s.id)])),
    noise: () => {
      const c = createCanvas(256, 256);
      const x = c.getContext('2d');
      const id = x.createImageData(256, 256);
      let seed = 5;
      for (let i = 0; i < id.data.length; i += 4) {
        for (let k = 0; k < 3; k += 1) id.data[i + k] = ((seed = (seed * 16807) % 2147483647) / 2147483647) * 255;
        id.data[i + 3] = 255;
      }
      x.putImageData(id, 0, 0);
      return c;
    },
    black: () => {
      const c = createCanvas(64, 64);
      c.getContext('2d').fillRect(0, 0, 64, 64);
      return c;
    },
    white: () => {
      const c = createCanvas(64, 64);
      const x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, 64, 64);
      return c;
    },
  };

  for (const [name, make] of Object.entries(pictures)) {
    it(`reads "${name}" in the colorize mode`, async () => {
      const { check } = await createVerifiedQR({ text: TEXT, spec: art({ placement: 'fill' }), source: make() });
      notFail(check);
      expect(check.zxing).toBeGreaterThanOrEqual(3);
    });
  }

  it('reads the fill mode, with and without a faded picture behind it', async () => {
    for (const backdrop of [0, 0.5, 1]) {
      for (const id of ['sunset', 'bloom']) {
        const { check } = await createVerifiedQR({ text: TEXT, spec: art({ placement: 'fill', backdrop }), source: drawSample(id) });
        notFail(check, `${id} backdrop ${backdrop}`);
        expect(check.zxing).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('reads pictures with zoom, panning and color adjustments', async () => {
    const patch = { placement: 'fill', zoom: 2, offsetX: 0.7, offsetY: -0.5, brightness: 0.3, contrast: 0.4, saturation: -1 };
    const { check } = await createVerifiedQR({ text: TEXT, spec: art(patch), source: drawSample('sunset') });
    notFail(check);
  });
});

describe('SVG export', () => {
  it('writes a well-formed SVG with gradients and an embedded sign', () => {
    const { scene } = createQR({ text: TEXT, spec: art({}, { gradient: true }), source: sign });
    const svg = sceneToSvg(scene, { px: 512 });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<linearGradient');
    expect(svg).toContain('<image href="data:image/png;base64,');
    expect(svg).toContain('clip-path=');
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('embeds the faded picture behind a colorized code', () => {
    const { scene } = createQR({ text: TEXT, spec: art({ placement: 'fill', backdrop: 0.5 }), source: drawSample('sunset') });
    expect(sceneToSvg(scene)).toContain('<image href="data:image/png;base64,');
  });

  it('renders back to a code that still reads', async () => {
    const { scene } = createQR({ text: TEXT, spec: art({}, { shape: 'square' }), source: sign });
    const img = await loadImage(Buffer.from(sceneToSvg(scene, { px: 800 })));
    const canvas = createCanvas(800, 800);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 800, 800);
    ctx.drawImage(img, 0, 0, 800, 800);
    const data = ctx.getImageData(0, 0, 800, 800);
    expect(jsQR(data.data, 800, 800)?.data).toBe(TEXT);
  });
});

describe('normalizeSpec', () => {
  it('replaces invalid values with defaults and clamps numbers', () => {
    const s = normalizeSpec({ shape: 'nope', fg: 'javascript:alert(1)', quiet: 99, scale: 9, art: { size: 9, placement: 'x', zoom: 99 } });
    expect(s.shape).toBe(DEFAULT_SPEC.shape);
    expect(s.fg).toBe(DEFAULT_SPEC.fg);
    expect(s.quiet).toBe(8);
    expect(s.scale).toBe(1.1);
    expect(s.art.size).toBe(0.5);
    expect(s.art.placement).toBe('center');
    expect(s.art.zoom).toBe(4);
  });

  it('keeps colors safe for SVG output', () => {
    const s = normalizeSpec({ fg: '"><script>', bg: '#abc', art: { ringColor: '"><x', plate: 'red' } });
    expect(s.fg).toBe(DEFAULT_SPEC.fg);
    expect(s.bg).toBe('#aabbcc');
    expect(s.art.ringColor).toBe(DEFAULT_SPEC.art.ringColor);
    expect(s.art.plate).toBe('');
  });
});

describe('palettes', () => {
  it('keep both dot colors readable on their background', () => {
    for (const p of PALETTES) {
      expect(contrast(parseColor(p.fg), parseColor(p.bg)), `${p.name} fg`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(parseColor(p.fg2), parseColor(p.bg)), `${p.name} fg2`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('random styles', () => {
  it('are always dark on light', () => {
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 40; i += 1) expect(dotContrast(randomStyle(DEFAULT_SPEC, rand))).toBeGreaterThan(4.5);
  });

  it('are verified before they are shown', async () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 6; i += 1) {
      const { spec, check } = await randomReadable({ text: TEXT, spec: DEFAULT_SPEC, source: sign, rand });
      expect(check.status).toBe('good');
      expect((await createVerifiedQR({ text: TEXT, spec, source: sign })).check.status).toBe('good');
    }
  });
});

describe('autoFix', () => {
  it('leaves a working code alone', async () => {
    const result = await autoFix({ text: TEXT, spec: DEFAULT_SPEC, source: sign });
    expect(result.changes).toEqual([]);
    expect(result.check.status).toBe('good');
  });

  it('repairs low contrast colors', async () => {
    const result = await autoFix({ text: TEXT, spec: { ...DEFAULT_SPEC, fg: '#DDDDDD', fg2: '#DDDDDD' } });
    expect(result.check.status).toBe('good');
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it('repairs a colorized picture that is too bold', async () => {
    const result = await autoFix({ text: TEXT, spec: art({ placement: 'fill', strength: 1, backdrop: 1 }), source: drawSample('sunset') });
    expect(result.check.status).not.toBe('fail');
  });
});

describe('signs', () => {
  it('produce valid SVG for every sign', () => {
    for (const s of ALL_SIGNS) {
      const svg = signSvg(s, { color: '#123456', badge: false });
      expect(svg).toContain('<svg');
      expect(svg).toContain('#123456');
    }
  });
});
