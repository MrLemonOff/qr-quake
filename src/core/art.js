import { getEnv } from './env.js';
import { parseColor } from './colors.js';

/** True if the picture has see-through pixels (a logo or sign rather than a photo). */
export function hasAlpha(source) {
  const { createCanvas } = getEnv();
  const probe = createCanvas(48, 48);
  const ctx = probe.getContext('2d');
  ctx.drawImage(source, 0, 0, 48, 48);
  const data = ctx.getImageData(0, 0, 48, 48).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 245) return true;
  return false;
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * Draw the picture into a size x size canvas.
 * mode "cover" fills the square (cropping), "contain" fits it whole. zoom enlarges it; pan moves it (-1 to 1).
 */
function drawFit(ctx, source, size, mode, { zoom = 1, offsetX = 0, offsetY = 0 } = {}) {
  const sw = source.width;
  const sh = source.height;
  const base = mode === 'cover' ? Math.max(size / sw, size / sh) : Math.min(size / sw, size / sh);
  const w = sw * base * zoom;
  const h = sh * base * zoom;
  const panX = Math.max(0, (w - size) / 2);
  const panY = Math.max(0, (h - size) / 2);
  ctx.drawImage(source, (size - w) / 2 - offsetX * panX, (size - h) / 2 - offsetY * panY, w, h);
}

/** Brightness, contrast and saturation (each -1 to 1). Skipped entirely when all are zero. */
export function adjust(canvas, { brightness = 0, contrast = 0, saturation = 0 }) {
  if (!brightness && !contrast && !saturation) return canvas;
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const add = brightness * 128;
  const mul = contrast >= 0 ? 1 + contrast * 1.2 : 1 + contrast * 0.8;
  const sat = 1 + saturation;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];
    if (saturation) {
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      r = y + (r - y) * sat;
      g = y + (g - y) * sat;
      b = y + (b - y) * sat;
    }
    d[i] = clamp255((r - 128) * mul + 128 + add);
    d[i + 1] = clamp255((g - 128) * mul + 128 + add);
    d[i + 2] = clamp255((b - 128) * mul + 128 + add);
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Fade a picture towards white. level 0 keeps it, 1 is almost white. Returns a new opaque canvas. */
export function wash(canvas, level) {
  const { createCanvas } = getEnv();
  const out = createCanvas(canvas.width, canvas.height);
  const ctx = out.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  const keep = 1 - level;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - (255 - d[i]) * keep;
    d[i + 1] = 255 - (255 - d[i + 1]) * keep;
    d[i + 2] = 255 - (255 - d[i + 2]) * keep;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/** How faded the picture is for a given "picture strength" (0 to 1). Never lighter than needed, never too dark. */
export const washLevel = (strength) => 1 - (0.12 + 0.4 * strength);

/**
 * Prepare the user's picture for a placement.
 *   main: a square, adjusted canvas. 512 px for a center sign, 1024 px (opaque) for fill.
 *   grid: for fill, one pixel per QR module (n x n) so each module can read its color.
 */
export function prepareArt(source, spec, n) {
  const { createCanvas } = getEnv();
  const a = spec.art;
  const mode = a.shape === 'free' ? 'contain' : 'cover';
  const view = { zoom: a.zoom, offsetX: a.offsetX, offsetY: a.offsetY };
  const size = a.placement === 'center' ? 512 : 1024;

  const main = createCanvas(size, size);
  const ctx = main.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (a.placement !== 'center') {
    const [r, g, b] = parseColor(spec.bg);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, size, size);
  }
  drawFit(ctx, source, size, mode, view);
  adjust(main, a);

  let grid = null;
  if (a.placement === 'fill') {
    // Average down in halving steps so each module gets the mean color of its area, not one sample.
    const tmp = createCanvas(size, size);
    const tctx = tmp.getContext('2d');
    tctx.imageSmoothingQuality = 'high';
    drawFit(tctx, source, size, mode, view);
    adjust(tmp, a);
    let current = tmp;
    while (current.width / 2 >= n * 2) {
      const next = createCanvas(current.width / 2, current.height / 2);
      const nctx = next.getContext('2d');
      nctx.imageSmoothingQuality = 'high';
      nctx.drawImage(current, 0, 0, next.width, next.height);
      current = next;
    }
    grid = createCanvas(n, n);
    const gctx = grid.getContext('2d');
    gctx.imageSmoothingQuality = 'high';
    gctx.drawImage(current, 0, 0, n, n);
  }
  return { main, grid, washes: new Map() };
}

/** A faded copy of art.main, cached on the art object. */
export function washed(art, level) {
  const key = level.toFixed(3);
  if (!art.washes.has(key)) art.washes.set(key, wash(art.main, level));
  return art.washes.get(key);
}
