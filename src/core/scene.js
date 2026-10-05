import { KIND } from './matrix.js';
import { parseColor, toHex, luminance, capLuminance, mix } from './colors.js';
import { rectPath, circlePath, roundRectPath, modulePath, eyeFramePath, eyeBallPath } from './shapes.js';
import { washed } from './art.js';

/**
 * A scene is a plain list of drawing items in "units" (one QR module = one unit), so the same result can be
 * painted on a canvas (PNG) or written out as SVG.
 *
 *   { t: 'rect',   x, y, w, h, fill, rx?, stroke?, strokeWidth?, opacity?, shadow? }
 *   { t: 'path',   d, fill, rule?, stroke?, strokeWidth?, dash?, opacity?, shadow? }
 *   { t: 'image',  canvas, x, y, w, h, clip? }
 *   { t: 'raster', make(pixelsPerUnit) -> canvas, x, y, w, h }      drawn at the resolution it is shown at
 *   { t: 'text',   x, y, text, size, fill, font, weight, anchor, maxWidth? }
 *   { t: 'group',  x, y, s, items, clip? }                          items drawn at offset (x, y) and scale s
 *
 * `fill` is a color string or a gradient { kind: 'linear' | 'radial', stops, ... }.
 */

/** How much of the symbol a center sign may cover, per error correction level (share of modules). */
export const CLEAR_LIMIT = { L: 0.05, M: 0.1, Q: 0.15, H: 0.2 };

export function foreground(spec, w, h = w) {
  if (!spec.gradient) return spec.fg;
  const stops = [[0, spec.fg], [1, spec.fg2]];
  if (spec.gradientType === 'radial') return { kind: 'radial', cx: w / 2, cy: h / 2, r: Math.max(w, h) * 0.62, stops };
  const a = (spec.gradientAngle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const half = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
  return { kind: 'linear', x1: w / 2 - dx * half, y1: h / 2 - dy * half, x2: w / 2 + dx * half, y2: h / 2 + dy * half, stops };
}

/** The color of a paint at a point, as [r, g, b]. */
export function colorAt(paint, x, y) {
  if (typeof paint === 'string') return parseColor(paint);
  const [c0, c1] = paint.stops.map(([, c]) => parseColor(c));
  let t;
  if (paint.kind === 'radial') t = Math.hypot(x - paint.cx, y - paint.cy) / paint.r;
  else {
    const vx = paint.x2 - paint.x1;
    const vy = paint.y2 - paint.y1;
    t = ((x - paint.x1) * vx + (y - paint.y1) * vy) / (vx * vx + vy * vy || 1);
  }
  return mix(c0, c1, Math.min(1, Math.max(0, t)));
}

/** Which modules a center sign of side L (in modules) wipes out, and whether it would hit a finder or info module. */
function clearRegion(m, q, L, pad, circular) {
  const { n, kind } = m;
  const c = (n + 2 * q) / 2;
  const limit = L / 2 + pad;
  const cleared = new Uint8Array(n * n);
  let count = 0;
  let hitsCritical = false;
  for (let r = 0; r < n; r += 1) {
    for (let col = 0; col < n; col += 1) {
      const dx = q + col + 0.5 - c;
      const dy = q + r + 0.5 - c;
      const hit = circular ? Math.hypot(dx, dy) <= limit + 0.71 : Math.max(Math.abs(dx), Math.abs(dy)) <= limit + 0.5;
      if (!hit) continue;
      const k = kind[r * n + col];
      if (k === KIND.FINDER || k === KIND.INFO) hitsCritical = true;
      cleared[r * n + col] = 1;
      count += 1;
    }
  }
  return { cleared, count, hitsCritical };
}

/** Level the picture is faded to behind "fill" modules. */
const backdropLevel = (a) => 0.9 - 0.18 * a.backdrop;

/** Luminance of the darkest thing a module can sit on, accounting for a faded picture behind it. */
function backgroundLuma(a, spec) {
  if (!(a.backdrop > 0)) return luminance(parseColor(spec.bg));
  const gray = 255 * backdropLevel(a);
  return luminance([gray, gray, gray]);
}

/** Colour for every module in "fill" placement: the picture's colour, darkened until it still scans. */
function sampleColors(grid, n, spec) {
  const data = grid.getContext('2d').getImageData(0, 0, n, n).data;
  const ratio = 3 + 2 * (1 - spec.art.strength);
  const maxL = Math.max(0.01, (backgroundLuma(spec.art, spec) + 0.05) / ratio - 0.05);
  const base = parseColor(spec.fg);
  const out = new Array(n * n);
  for (let i = 0; i < n * n; i += 1) {
    const a = data[i * 4 + 3] / 255;
    if (a < 0.35) {
      out[i] = null;
      continue;
    }
    let rgb = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    if (a < 1) rgb = mix(base, rgb, a);
    out[i] = toHex(capLuminance(rgb, maxL));
  }
  return out;
}

/** Outline of the center sign's cutout shape, centered on (c, c) with the given side. */
function artShape(shape, c, side) {
  if (shape === 'circle') return circlePath(c, c, side / 2);
  const r = shape === 'square' ? 0 : side * 0.22;
  return roundRectPath(c - side / 2, c - side / 2, side, side, [r, r, r, r]);
}

export function buildScene(m, spec, art) {
  const { n, dark, kind } = m;
  const q = spec.quiet;
  const S = n + 2 * q;
  const a = spec.art;
  const placement = art ? a.placement : 'none';
  const items = [];
  const fg = foreground(spec, S);
  const eyeFrame = spec.eyeColor || fg;
  const eyeBall = spec.eyeBallColor || spec.eyeColor || fg;
  const info = { n, version: m.version, ec: m.ec, requestedEc: m.requested, placement, quiet: q, cleared: 0, clearedRatio: 0, logoSize: 0, logoLimited: false };

  const opaque = !spec.transparent;
  if (opaque) items.push({ t: 'rect', x: 0, y: 0, w: S, h: S, fill: spec.bg });

  // Center sign: find the largest sign (up to the requested size) that keeps the code readable.
  let cleared = null;
  let logo = null;
  if (placement === 'center') {
    const circular = a.shape === 'circle';
    const requested = a.size * n;
    const limit = CLEAR_LIMIT[m.ec];
    const total = (side) => side + 2 * a.ring;
    let L = requested;
    let region = clearRegion(m, q, total(L), a.padding, circular);
    while ((region.hitsCritical || region.count / (n * n) > limit) && L > 2) {
      L -= 0.5;
      region = clearRegion(m, q, total(L), a.padding, circular);
    }
    cleared = region.cleared;
    info.cleared = region.count;
    info.clearedRatio = region.count / (n * n);
    info.logoSize = L / n;
    info.logoLimited = L < requested - 0.01;
    const c = S / 2;
    const frame = a.shape === 'free' ? 'rounded' : a.shape;
    logo = [];
    if (a.ring > 0) logo.push({ t: 'path', d: artShape(frame, c, total(L)), fill: a.ringColor });
    if (a.plate) logo.push({ t: 'path', d: artShape(frame, c, L), fill: a.plate });
    logo.push({ t: 'image', canvas: art.main, x: c - L / 2, y: c - L / 2, w: L, h: L, clip: a.shape === 'free' ? null : artShape(a.shape, c, L) });
  }

  const visible = (r, c) => {
    if (r < 0 || c < 0 || r >= n || c >= n) return false;
    const i = r * n + c;
    return dark[i] === 1 && kind[i] !== KIND.FINDER && !(cleared && cleared[i]);
  };
  const shapeOptions = { scale: spec.scale, round: spec.roundness };

  if (placement === 'fill' && a.backdrop > 0) {
    items.push({ t: 'image', canvas: washed(art, backdropLevel(a)), x: q, y: q, w: n, h: n, clip: rectPath(q, q, n, n) });
  }
  const colors = placement === 'fill' ? sampleColors(art.grid, n, spec) : null;
  const merged = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (!visible(r, c)) continue;
      const nb = { u: visible(r - 1, c), d: visible(r + 1, c), l: visible(r, c - 1), r: visible(r, c + 1) };
      const d = modulePath(spec.shape, q + c, q + r, nb, colors ? 0.04 : 0, shapeOptions);
      if (colors) items.push({ t: 'path', d, fill: colors[r * n + c] || fg });
      else merged.push(d);
    }
  }
  if (merged.length) items.push({ t: 'path', d: merged.join(''), fill: fg });

  for (const [r0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    items.push({ t: 'path', d: eyeFramePath(spec.eyeFrame, q + c0, q + r0), rule: 'evenodd', fill: eyeFrame });
    items.push({ t: 'path', d: eyeBallPath(spec.eyeBall, q + c0 + 2, q + r0 + 2), fill: eyeBall });
  }

  if (logo) items.push(...logo);
  return { width: S, height: S, size: S, items, info };
}
