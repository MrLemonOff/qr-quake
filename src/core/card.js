import { roundRectPath, circlePath } from './shapes.js';
import { FONTS, FONT_NAMES, fitSize } from './text.js';
import { sanitizeColor } from './colors.js';

/**
 * Cards put a code inside a styled frame: a background, a border, ornaments and some text.
 * Units are the same as the code inside (one QR module = one unit), so the code is never scaled.
 */

export const BORDER_STYLES = ['solid', 'double', 'dashed', 'dotted', 'gradient', 'neon'];
export const ORNAMENTS = ['none', 'brackets', 'sparkles', 'stars', 'dots', 'corners'];

export const DEFAULT_CARD = {
  preset: 'none',
  bg: '#FFFFFF',
  bg2: '#E0E7FF',
  bgGradient: false,
  bgAngle: 135,
  radius: 0.1,
  padding: 0.1,
  plate: true,
  plateColor: '#FFFFFF',
  border: 0,
  borderStyle: 'solid',
  borderColor: '#1F1E1D',
  borderColor2: '#2F6BDC',
  shadow: 0,
  glow: 0,
  ornament: 'none',
  ornamentColor: '',
  title: '',
  subtitle: '',
  footer: '',
  textColor: '#1F1E1D',
  font: 'sans',
  titleSize: 1,
  ticket: false,
  polaroid: false,
};

/** Ready-made looks. Picking one fills in the card settings, which can then be changed freely. */
export const CARD_PRESETS = [
  { id: 'none', name: 'No card', values: {} },
  { id: 'clean', name: 'Clean', values: { bg: '#FFFFFF', radius: 0.1, padding: 0.1, border: 0.008, borderColor: '#D9D7CF', shadow: 0.55, footer: 'Scan me', textColor: '#4A4944', font: 'sans' } },
  { id: 'poster', name: 'Poster', values: { bg: '#2F6BDC', bg2: '#7C3AED', bgGradient: true, bgAngle: 135, radius: 0.09, padding: 0.14, border: 0, shadow: 0.6, title: 'SCAN ME', footer: 'qr-quake', textColor: '#FFFFFF', font: 'rounded', titleSize: 1.15 } },
  { id: 'neon', name: 'Neon', values: { bg: '#0B0B14', bgGradient: false, radius: 0.1, padding: 0.12, border: 0.016, borderStyle: 'neon', borderColor: '#22D3EE', borderColor2: '#A855F7', glow: 0.8, shadow: 0, ornament: 'brackets', ornamentColor: '#A855F7', title: 'SCAN ME', textColor: '#E0F2FE', font: 'display', titleSize: 1.1 } },
  { id: 'sticker', name: 'Sticker', values: { bg: '#FDE047', bgGradient: false, radius: 0.16, padding: 0.1, border: 0.03, borderStyle: 'solid', borderColor: '#1F1E1D', shadow: 0.45, title: 'SCAN ME', textColor: '#1F1E1D', font: 'display', titleSize: 1.2 } },
  { id: 'ticket', name: 'Ticket', values: { bg: '#FBBF24', bg2: '#F97316', bgGradient: true, bgAngle: 90, radius: 0.05, padding: 0.1, border: 0, shadow: 0.5, title: 'ADMIT ONE', footer: 'Scan at the door', textColor: '#451A03', font: 'display', ticket: true, titleSize: 1.1 } },
  { id: 'scanner', name: 'Scanner', values: { bg: '#0F172A', bgGradient: false, radius: 0.06, padding: 0.16, border: 0, shadow: 0.4, ornament: 'brackets', ornamentColor: '#34D399', title: 'SCAN ME', footer: 'point your camera', textColor: '#E2E8F0', font: 'mono', titleSize: 1 } },
  { id: 'glass', name: 'Pastel', values: { bg: '#A5B4FC', bg2: '#F0ABFC', bgGradient: true, bgAngle: 135, radius: 0.14, padding: 0.12, border: 0.01, borderStyle: 'solid', borderColor: '#FFFFFF', shadow: 0.5, ornament: 'dots', ornamentColor: '#FFFFFF', title: 'Hello!', footer: 'scan to connect', textColor: '#312E81', font: 'rounded', titleSize: 1.2 } },
  { id: 'polaroid', name: 'Polaroid', values: { bg: '#FFFFFF', bgGradient: false, radius: 0.02, padding: 0.08, border: 0.004, borderColor: '#E5E5E0', shadow: 0.6, polaroid: true, footer: 'my little code', textColor: '#3F3F3A', font: 'script', titleSize: 1 } },
  { id: 'sparkle', name: 'Sparkle', values: { bg: '#1E1B4B', bg2: '#4C1D95', bgGradient: true, bgAngle: 135, radius: 0.14, padding: 0.13, border: 0.022, borderStyle: 'gradient', borderColor: '#F472B6', borderColor2: '#60A5FA', shadow: 0.5, ornament: 'sparkles', ornamentColor: '#FDE68A', title: 'SCAN ME', textColor: '#FFFFFF', font: 'rounded', titleSize: 1.1 } },
];
export const CARD_PRESET_BY_ID = Object.fromEntries(CARD_PRESETS.map((p) => [p.id, p]));

/** A card spec for a preset: the defaults plus the preset's look. */
export function cardFromPreset(id) {
  const preset = CARD_PRESET_BY_ID[id] || CARD_PRESET_BY_ID.none;
  return { ...DEFAULT_CARD, ...preset.values, preset: preset.id };
}

const pick = (v, list, d) => (list.includes(v) ? v : d);
const num = (v, lo, hi, d) => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d;
};
const text = (v) => String(v ?? '').slice(0, 60);

export function normalizeCard(input = {}) {
  const d = DEFAULT_CARD;
  return {
    preset: CARD_PRESET_BY_ID[input.preset] ? input.preset : d.preset,
    bg: sanitizeColor(input.bg, d.bg),
    bg2: sanitizeColor(input.bg2, d.bg2),
    bgGradient: Boolean(input.bgGradient),
    bgAngle: num(input.bgAngle, 0, 360, d.bgAngle),
    radius: num(input.radius, 0, 0.5, d.radius),
    padding: num(input.padding, 0.02, 0.5, d.padding),
    plate: input.plate !== false,
    plateColor: sanitizeColor(input.plateColor, d.plateColor),
    border: num(input.border, 0, 0.06, d.border),
    borderStyle: pick(input.borderStyle, BORDER_STYLES, d.borderStyle),
    borderColor: sanitizeColor(input.borderColor, d.borderColor),
    borderColor2: sanitizeColor(input.borderColor2, d.borderColor2),
    shadow: num(input.shadow, 0, 1, d.shadow),
    glow: num(input.glow, 0, 1, d.glow),
    ornament: pick(input.ornament, ORNAMENTS, d.ornament),
    ornamentColor: input.ornamentColor ? sanitizeColor(input.ornamentColor, '') : '',
    title: text(input.title),
    subtitle: text(input.subtitle),
    footer: text(input.footer),
    textColor: sanitizeColor(input.textColor, d.textColor),
    font: pick(input.font, FONT_NAMES, d.font),
    titleSize: num(input.titleSize, 0.5, 2, d.titleSize),
    ticket: Boolean(input.ticket),
    polaroid: Boolean(input.polaroid),
  };
}

const gradient = (c1, c2, angle, w, h) => {
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const half = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
  return { kind: 'linear', x1: w / 2 - dx * half, y1: h / 2 - dy * half, x2: w / 2 + dx * half, y2: h / 2 + dy * half, stops: [[0, c1], [1, c2]] };
};

function starPath(cx, cy, r, points = 4, inner = 0.3) {
  let d = '';
  for (let i = 0; i < points * 2; i += 1) {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(3)} ${(cy + Math.sin(a) * rr).toFixed(3)}`;
  }
  return d + 'Z';
}

/** Card outline: a rounded rectangle, optionally with ticket notches on both sides. */
function cardPath(x, y, w, h, r, notchY = null, nr = 0) {
  if (notchY === null) return roundRectPath(x, y, w, h, [r, r, r, r]);
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${notchY - nr}A${nr} ${nr} 0 0 0 ${x + w} ${notchY + nr}` +
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${notchY + nr}` +
    `A${nr} ${nr} 0 0 0 ${x} ${notchY - nr}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

/** Wrap a scene (a QR code or barcode) in a card. Returns a new scene; `inner` is returned unchanged for "no card". */
export function buildCard(inner, cardIn) {
  const card = normalizeCard(cardIn);
  if (card.preset === 'none' && !cardIn.force) return inner;

  const iw = inner.width;
  const ih = inner.height;
  const gap = card.plate ? 0.035 * Math.max(iw, ih) : 0;
  const cw = iw + 2 * gap;
  const ch = ih + 2 * gap;
  const pad = card.padding * Math.max(cw, ch);
  const textSize = Math.max(cw, 40) * 0.07;
  const titleSize = textSize * card.titleSize * 1.15;
  const subSize = textSize * 0.62;
  const footSize = textSize * 0.7;
  const family = FONTS[card.font];
  const maxText = cw + pad;

  const lines = [];
  let headH = 0;
  let footH = 0;
  if (card.title) {
    const size = fitSize(card.title, card.font, 800, titleSize, maxText);
    lines.push({ at: 'head', text: card.title, size, weight: 800, y: headH + size });
    headH += size * 1.45;
  }
  if (card.subtitle) {
    const size = fitSize(card.subtitle, card.font, 500, subSize, maxText);
    lines.push({ at: 'head', text: card.subtitle, size, weight: 500, y: headH + size * 0.8 });
    headH += size * 1.55;
  }
  if (card.footer) {
    const size = fitSize(card.footer, card.font, 600, footSize, maxText);
    lines.push({ at: 'foot', text: card.footer, size, weight: 600, y: size });
    footH += size * 1.5;
  }
  const extraBottom = card.polaroid ? pad * 0.9 : 0;
  const headGap = headH ? pad * 0.45 : 0;
  const footGap = footH || extraBottom ? pad * 0.4 : 0;

  const W = cw + 2 * pad;
  const H = pad + headH + headGap + ch + footGap + footH + extraBottom + pad;
  const margin = Math.max(card.shadow * 0.09, card.glow * 0.12, 0.01) * W;
  const items = [];
  const radius = Math.min(card.radius * Math.min(W, H), Math.min(W, H) / 2);

  const plateY = pad + headH + headGap;
  const notchY = card.ticket ? plateY + ch + footGap * 0.5 : null;
  const outline = cardPath(0, 0, W, H, radius, notchY, card.ticket ? pad * 0.32 : 0);
  const bgPaint = card.bgGradient ? gradient(card.bg, card.bg2, card.bgAngle, W, H) : card.bg;

  const body = [];
  const shadow =
    card.shadow > 0 || card.glow > 0
      ? { color: card.glow > 0 ? card.borderColor : 'rgba(15,23,42,0.34)', blur: (card.glow > 0 ? card.glow * 0.1 : card.shadow * 0.07) * W, dx: 0, dy: card.glow > 0 ? 0 : card.shadow * 0.025 * W }
      : null;
  body.push({ t: 'path', d: outline, fill: bgPaint, shadow });

  // Border.
  const bw = card.border * W;
  if (bw > 0) {
    const inset = (k) => cardPath(bw * k, bw * k, W - 2 * bw * k, H - 2 * bw * k, Math.max(0, radius - bw * k), notchY, card.ticket ? pad * 0.32 : 0);
    const c1 = card.borderColor;
    if (card.borderStyle === 'double') {
      body.push({ t: 'path', d: inset(0.3), stroke: c1, strokeWidth: bw * 0.4 });
      body.push({ t: 'path', d: inset(1.1), stroke: c1, strokeWidth: bw * 0.4 });
    } else if (card.borderStyle === 'dashed') {
      body.push({ t: 'path', d: inset(0.5), stroke: c1, strokeWidth: bw, dash: [bw * 3, bw * 2.2] });
    } else if (card.borderStyle === 'dotted') {
      body.push({ t: 'path', d: inset(0.5), stroke: c1, strokeWidth: bw, dash: [0.01, bw * 2.2] });
    } else if (card.borderStyle === 'gradient') {
      body.push({ t: 'path', d: inset(0.5), stroke: gradient(c1, card.borderColor2, 135, W, H), strokeWidth: bw });
    } else if (card.borderStyle === 'neon') {
      body.push({ t: 'path', d: inset(0.5), stroke: gradient(c1, card.borderColor2, 135, W, H), strokeWidth: bw * 1.6, opacity: 0.35 });
      body.push({ t: 'path', d: inset(0.5), stroke: gradient(c1, card.borderColor2, 135, W, H), strokeWidth: bw * 0.8 });
    } else {
      body.push({ t: 'path', d: inset(0.5), stroke: c1, strokeWidth: bw });
    }
  }

  // Ticket divider.
  if (card.ticket && notchY !== null) {
    body.push({ t: 'path', d: `M${pad * 0.6} ${notchY}H${W - pad * 0.6}`, stroke: card.textColor, strokeWidth: pad * 0.05, dash: [pad * 0.16, pad * 0.16], opacity: 0.5 });
  }

  // Plate behind the code.
  const px = pad + 0;
  if (card.plate) {
    const pr = Math.min(card.radius * 0.7 * cw, cw * 0.12);
    body.push({ t: 'rect', x: px, y: plateY, w: cw, h: ch, rx: pr, fill: card.plateColor, shadow: card.shadow > 0 ? { color: 'rgba(15,23,42,0.18)', blur: W * 0.012, dx: 0, dy: W * 0.004 } : null });
  }
  body.push({ t: 'group', x: px + gap, y: plateY + gap, s: 1, items: inner.items });

  // Ornaments.
  const orn = card.ornamentColor || (card.borderStyle === 'neon' || card.borderStyle === 'gradient' ? card.borderColor2 : card.borderColor);
  if (card.ornament === 'brackets') {
    const len = cw * 0.16;
    const t = Math.max(W * 0.008, 0.4);
    const o = pad * 0.45;
    const x0 = px - o;
    const y0 = plateY - o;
    const x1 = px + cw + o;
    const y1 = plateY + ch + o;
    const bracket = (x, y, sx, sy) => `M${x} ${y + sy * len}V${y}H${x + sx * len}`;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      body.push({ t: 'path', d: bracket(x, y, sx, sy), stroke: orn, strokeWidth: t * 1.6, shadow: card.glow > 0 ? { color: orn, blur: W * 0.012, dx: 0, dy: 0 } : null });
    }
  } else if (card.ornament === 'sparkles') {
    for (const [fx, fy, fr] of [[0.075, 0.06, 0.045], [0.17, 0.035, 0.022], [0.925, 0.94, 0.05], [0.835, 0.965, 0.022], [0.93, 0.075, 0.028], [0.07, 0.925, 0.03]]) {
      body.push({ t: 'path', d: starPath(fx * W, fy * H, fr * W, 4, 0.28), fill: orn });
    }
  } else if (card.ornament === 'stars') {
    for (const [fx, fy, fr] of [[0.08, 0.07, 0.04], [0.92, 0.07, 0.03], [0.07, 0.93, 0.03], [0.93, 0.92, 0.04], [0.5, 0.025, 0.02]]) {
      body.push({ t: 'path', d: starPath(fx * W, fy * H, fr * W, 5, 0.45), fill: orn });
    }
  } else if (card.ornament === 'dots') {
    for (const [fx, fy, fr] of [[0.07, 0.06, 0.022], [0.14, 0.04, 0.012], [0.93, 0.07, 0.016], [0.07, 0.93, 0.016], [0.9, 0.95, 0.024], [0.83, 0.97, 0.012]]) {
      body.push({ t: 'path', d: circlePath(fx * W, fy * H, fr * W), fill: orn });
    }
  } else if (card.ornament === 'corners') {
    const r = W * 0.09;
    const t = W * 0.012;
    const o = t * 1.2;
    for (const [x, y, sx, sy] of [[o, o, 1, 1], [W - o, o, -1, 1], [o, H - o, 1, -1], [W - o, H - o, -1, -1]]) {
      body.push({ t: 'path', d: `M${x} ${y + sy * r}Q${x} ${y} ${x + sx * r} ${y}`, stroke: orn, strokeWidth: t });
    }
  }

  // Text.
  for (const line of lines) {
    const y = line.at === 'head' ? pad + line.y : plateY + ch + footGap + line.y;
    body.push({ t: 'text', x: W / 2, y, text: line.text, size: line.size, fill: card.textColor, font: family, weight: line.weight, anchor: 'center' });
  }

  items.push({ t: 'group', x: margin, y: margin, s: 1, items: body });
  return { width: W + 2 * margin, height: H + 2 * margin, items, info: { ...inner.info, card: card.preset } };
}
