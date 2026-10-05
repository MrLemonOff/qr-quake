const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function parseColor(input) {
  let h = String(input || '').trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function toHex(rgb) {
  return '#' + rgb.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}

export function sanitizeColor(input, fallback = '#000000') {
  const h = String(input || '').trim();
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h) ? toHex(parseColor(h)) : fallback;
}

const toLinear = (v) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (l) => 255 * (l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055);

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance([r, g, b]) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two [r,g,b] colors, 1 to 21. */
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Darken a color (keeping its hue) until its luminance is at most maxL. */
export function capLuminance(rgb, maxL) {
  const l = luminance(rgb);
  if (l <= maxL) return rgb;
  const k = maxL / l;
  return rgb.map((v) => fromLinear(toLinear(v) * k));
}

export function mix(a, b, t) {
  return a.map((v, i) => v + (b[i] - v) * t);
}

/** Worst-case contrast between the ink (either end of a gradient) and the background of a spec { fg, fg2, gradient, bg }. */
export function inkContrast(spec) {
  const bg = parseColor(spec.bg);
  const ends = (spec.gradient ? [spec.fg, spec.fg2] : [spec.fg]).map(parseColor);
  if (ends.some((c) => luminance(c) >= luminance(bg))) return 1;
  return Math.min(...ends.map((c) => contrast(c, bg)));
}
