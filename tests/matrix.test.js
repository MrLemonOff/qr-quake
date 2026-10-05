import { describe, it, expect } from 'vitest';
import jsQR from 'jsqr';
import { createCanvas } from '@napi-rs/canvas';
import { buildMatrix, alignmentCenters, moduleKinds, KIND, QRTooLongError } from '../src/core/matrix.js';
import { createQR } from '../src/core/render.js';
import { paintCanvas } from '../src/core/paint-canvas.js';
import { DEFAULT_SPEC } from '../src/core/defaults.js';

function decode(text, spec = DEFAULT_SPEC) {
  const { scene } = createQR({ text, spec });
  const px = 900;
  const canvas = createCanvas(px, px);
  paintCanvas(scene, canvas, px, { underlay: '#fff' });
  const img = canvas.getContext('2d').getImageData(0, 0, px, px);
  return jsQR(img.data, px, px)?.data;
}

describe('matrix', () => {
  it('has the right size for each version', () => {
    const m = buildMatrix('hello', 'M');
    expect(m.n).toBe(4 * m.version + 17);
    expect(m.dark.length).toBe(m.n * m.n);
  });

  it('honours the minimum version when the data fits', () => {
    expect(buildMatrix('hi', 'L', 6).version).toBe(6);
  });

  it('grows past the minimum version when the data needs it', () => {
    expect(buildMatrix('x'.repeat(300), 'L', 5).version).toBeGreaterThan(5);
  });

  it('falls back to a lower error correction level for long data', () => {
    const long = 'a'.repeat(1500);
    const m = buildMatrix(long, 'H');
    expect(m.ec).not.toBe('H');
    expect(m.requested).toBe('H');
  });

  it('rejects data that cannot fit at all', () => {
    expect(() => buildMatrix('a'.repeat(4000), 'L')).toThrow(QRTooLongError);
  });

  it('places alignment patterns per the standard', () => {
    expect(alignmentCenters(1)).toEqual([]);
    expect(alignmentCenters(2)).toEqual([[18, 18]]);
    expect(alignmentCenters(7).length).toBe(6);
    expect(alignmentCenters(7)).toContainEqual([22, 22]);
  });

  it('classifies function modules', () => {
    const v = 3;
    const n = 4 * v + 17;
    const kind = moduleKinds(v);
    expect(kind[0]).toBe(KIND.FINDER);
    expect(kind[n * n - 1]).toBe(KIND.DATA);
    expect(kind[6 * n + 10]).toBe(KIND.TIMING);
    expect(kind[(n - 7) * n + (n - 7)]).toBe(KIND.ALIGN);
  });

  it('round-trips UTF-8 text through a real decoder', () => {
    for (const text of ['Hello', 'Ünïcode ✓ — 日本語', 'https://example.com/a?b=c&d=é', '1234567890', 'HELLO WORLD']) {
      expect(decode(text)).toBe(text);
    }
  });
});
