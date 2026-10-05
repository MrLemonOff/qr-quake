import { foreground } from './scene.js';
import { rectPath, roundRectPath } from './shapes.js';
import { FONTS, fitSize } from './text.js';
import { sanitizeColor } from './colors.js';

/**
 * Barcodes. The symbol tables come from bwip-js, which is loaded the first time one is needed.
 *
 * zx: the ZXing format used to check the result ('' = ZXing cannot read this one, so it is not tested).
 */
export const BARCODES = [
  { id: 'code128', bcid: 'code128', label: 'Code 128', kind: '1d', zx: 'CODE_128', example: 'QR-QUAKE-2026', desc: 'Any text. The best all-round choice.' },
  { id: 'ean13', bcid: 'ean13', label: 'EAN-13', kind: '1d', zx: 'EAN_13', example: '590123412345', desc: 'Products worldwide. 12 digits (the check digit is added) or 13.' },
  { id: 'ean8', bcid: 'ean8', label: 'EAN-8', kind: '1d', zx: 'EAN_8', example: '1234567', desc: 'Small products. 7 or 8 digits.' },
  { id: 'upca', bcid: 'upca', label: 'UPC-A', kind: '1d', zx: 'UPC_A', example: '12345678901', desc: 'Products in North America. 11 or 12 digits.' },
  { id: 'upce', bcid: 'upce', label: 'UPC-E', kind: '1d', zx: '', example: '0123456', desc: 'Compact UPC. 7 or 8 digits.' },
  { id: 'code39', bcid: 'code39', label: 'Code 39', kind: '1d', zx: 'CODE_39', example: 'QR-QUAKE', desc: 'Capital letters, digits and - . $ / + % space.' },
  { id: 'code93', bcid: 'code93', label: 'Code 93', kind: '1d', zx: '', example: 'QR QUAKE', desc: 'A denser Code 39.' },
  { id: 'itf', bcid: 'interleaved2of5', label: 'ITF (2 of 5)', kind: '1d', zx: 'ITF', example: '1234567890', desc: 'Digits only, in pairs (even count).' },
  { id: 'itf14', bcid: 'itf14', label: 'ITF-14', kind: '1d', zx: 'ITF', example: '1234567890123', desc: 'Cartons and cases. 13 or 14 digits.' },
  { id: 'codabar', bcid: 'rationalizedCodabar', label: 'Codabar', kind: '1d', zx: 'CODABAR', example: 'A123456B', desc: 'Libraries and blood banks. Start and end with A to D.' },
  { id: 'gs1128', bcid: 'gs1-128', label: 'GS1-128', kind: '1d', zx: '', example: '(01)09501101530003', desc: 'Logistics with application identifiers.' },
  { id: 'msi', bcid: 'msi', label: 'MSI Plessey', kind: '1d', zx: '', example: '1234567', desc: 'Warehouse shelves. Digits only.' },
  { id: 'pharmacode', bcid: 'pharmacode', label: 'Pharmacode', kind: '1d', zx: '', example: '1234', desc: 'Pharmaceutical packaging. A number from 3 to 131070.' },
  { id: 'code11', bcid: 'code11', label: 'Code 11', kind: '1d', zx: '', example: '123-45', desc: 'Telecom equipment. Digits and dash.' },
  { id: 'datamatrix', bcid: 'datamatrix', label: 'Data Matrix', kind: '2d', zx: 'DATA_MATRIX', example: 'QR Quake', desc: 'Tiny square code for parts and labels.' },
  { id: 'pdf417', bcid: 'pdf417', label: 'PDF417', kind: '2d', zx: 'PDF_417', example: 'QR Quake PDF417', desc: 'Stacked code on tickets and IDs.' },
  { id: 'aztec', bcid: 'azteccode', label: 'Aztec', kind: '2d', zx: 'AZTEC', example: 'QR Quake', desc: 'Boarding passes and transport tickets.' },
];
export const BARCODE_BY_ID = Object.fromEntries(BARCODES.map((b) => [b.id, b]));

export const DEFAULT_BAR = {
  format: 'code128',
  text: 'QR-QUAKE-2026',
  height: 0.42,
  quiet: 10,
  showText: true,
  textScale: 1,
  font: 'mono',
  textColor: '',
  fg: '#1F1E1D',
  fg2: '#2F6BDC',
  gradient: false,
  gradientType: 'linear',
  gradientAngle: 0,
  bg: '#FFFFFF',
  transparent: false,
  round: 0,
  shrink: 0,
};

const num = (v, lo, hi, d) => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d;
};

export function normalizeBar(input = {}) {
  const d = DEFAULT_BAR;
  const def = BARCODE_BY_ID[input.format] || BARCODE_BY_ID[d.format];
  return {
    format: def.id,
    text: String(input.text ?? d.text),
    height: num(input.height, 0.12, 1.2, d.height),
    quiet: Math.round(num(input.quiet, 0, 24, def.kind === '2d' ? 3 : d.quiet)),
    showText: input.showText !== false,
    textScale: num(input.textScale, 0.6, 1.8, d.textScale),
    font: FONTS[input.font] ? input.font : d.font,
    textColor: input.textColor ? sanitizeColor(input.textColor, '') : '',
    fg: sanitizeColor(input.fg, d.fg),
    fg2: sanitizeColor(input.fg2, d.fg2),
    gradient: Boolean(input.gradient),
    gradientType: input.gradientType === 'radial' ? 'radial' : 'linear',
    gradientAngle: num(input.gradientAngle, 0, 360, d.gradientAngle),
    bg: sanitizeColor(input.bg, d.bg),
    transparent: Boolean(input.transparent),
    round: num(input.round, 0, 1, d.round),
    shrink: num(input.shrink, 0, 0.45, d.shrink),
  };
}

export class BarcodeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BarcodeError';
  }
}

let library = null;
/** Loads the barcode tables (once). Call and await this before encodeBarcode. */
export function loadBarcodeLibrary() {
  library ||= import('bwip-js/generic').then((m) => m.default);
  return library;
}

const friendly = (e) =>
  String(e?.message || e)
    .replace(/^bwip-js:\s*/, '')
    .replace(/^bwipp\.[A-Za-z0-9]+#\d+:\s*/, '')
    .replace(/^bwipp\.[A-Za-z0-9]+(?:#\d+)?\s*/, '') || 'This text does not fit that barcode type.';

/**
 * Encode text with a barcode type. Returns bars (1D) or a module grid (2D), plus the text a scanner should read.
 * Throws BarcodeError with a readable message when the text is not valid for the type.
 */
export function encodeBarcode(lib, formatId, text) {
  const def = BARCODE_BY_ID[formatId];
  if (!String(text).trim()) throw new BarcodeError('Type something to encode.');
  let r;
  try {
    r = lib.raw({ bcid: def.bcid, text: String(text), includetext: true })[0];
  } catch (err) {
    throw new BarcodeError(friendly(err));
  }
  if (def.kind === '2d') {
    return { format: formatId, kind: '2d', cols: r.pixx, rows: r.pixy, pixs: r.pixs, expected: String(text) };
  }
  const widths = Array.from(r.sbs, Number);
  const bars = [];
  let x = 0;
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push({ x, w });
    x += w;
  });
  const chars = (r.txt || []).map((t) => t[0]);
  const spaced = ['ean13', 'ean8', 'upca', 'upce'].includes(formatId);
  const label = spaced ? chars.join('') : String(chars.length === 1 && chars[0] ? chars[0] : text).replace(/^\*|\*$/g, '');
  return { format: formatId, kind: '1d', bars, modules: x, chars, label, expected: spaced ? label : String(text) };
}

/** Where the digits of EAN/UPC codes sit (centres, in modules) and which ranges have taller guard bars. */
const EAN_LAYOUT = {
  ean13: { out: [-6], groups: [[3, 6], [50, 6]], guards: [[0, 3], [45, 50], [92, 95]] },
  ean8: { out: [], groups: [[3, 4], [36, 4]], guards: [[0, 3], [31, 36], [64, 67]] },
  upca: { out: [-6, 101], groups: [[10, 5], [50, 5]], guards: [[0, 10], [45, 50], [85, 95]] },
  upce: { out: [-6, 57], groups: [[3, 6]], guards: [[0, 3], [45, 51]] },
};

/** Draw a 1D or 2D barcode into a scene. Units are module widths. */
export function buildBarcodeScene(enc, spec) {
  const items = [];
  const q = spec.quiet;
  if (enc.kind === '2d') {
    const W = enc.cols + 2 * q;
    const H = enc.rows + 2 * q;
    const fg = foreground(spec, W, H);
    if (!spec.transparent) items.push({ t: 'rect', x: 0, y: 0, w: W, h: H, fill: spec.bg });
    const d = [];
    const rad = Math.min(0.5, 0.5 * spec.round);
    for (let r = 0; r < enc.rows; r += 1) {
      for (let c = 0; c < enc.cols; c += 1) {
        if (enc.pixs[r * enc.cols + c]) {
          d.push(rad > 0 ? roundRectPath(q + c + spec.shrink / 2, q + r + spec.shrink / 2, 1 - spec.shrink, 1 - spec.shrink, [rad, rad, rad, rad]) : rectPath(q + c + spec.shrink / 2, q + r + spec.shrink / 2, 1 - spec.shrink, 1 - spec.shrink));
        }
      }
    }
    items.push({ t: 'path', d: d.join(''), fill: fg });
    return { width: W, height: H, items, info: { kind: '2d', cols: enc.cols, rows: enc.rows } };
  }

  const M = enc.modules;
  const W = M + 2 * q;
  const barH = Math.max(8, M * spec.height);
  const layout = EAN_LAYOUT[enc.format];
  const textSize = spec.showText ? Math.max(5, Math.min(16, barH * 0.24)) * spec.textScale : 0;
  const textRoom = spec.showText ? textSize * 1.6 : 0;
  const top = Math.max(2, q * 0.3);
  const H = top + barH + textRoom + top;
  const fg = foreground(spec, W, H);
  if (!spec.transparent) items.push({ t: 'rect', x: 0, y: 0, w: W, h: H, fill: spec.bg });

  const ext = layout && spec.showText ? textSize * 0.55 : 0;
  const d = [];
  for (const b of enc.bars) {
    const guard = layout && layout.guards.some(([a, z]) => b.x >= a && b.x + b.w <= z + 0.001);
    const h = barH + (guard ? ext : 0);
    const x = q + b.x + spec.shrink / 2;
    const w = Math.max(0.2, b.w - spec.shrink);
    const r = Math.min(w / 2, 0.5 * spec.round * Math.min(w, 2));
    d.push(r > 0 ? roundRectPath(x, top, w, h, [r, r, r, r]) : rectPath(x, top, w, h));
  }
  items.push({ t: 'path', d: d.join(''), fill: fg });

  if (spec.showText && enc.label) {
    const color = spec.textColor || (typeof fg === 'string' ? fg : spec.fg);
    const y = top + barH + textSize * (layout ? 0.85 : 1.12);
    const draw = (txt, cx, size = textSize) => items.push({ t: 'text', x: q + cx, y, text: txt, size, fill: color, font: FONTS[spec.font], weight: 600, anchor: 'center' });
    if (layout) {
      const chars = enc.label.split('');
      let i = 0;
      const outs = layout.out.slice();
      if (outs[0] !== undefined && outs[0] < 0) draw(chars[i++], outs[0], textSize * 0.9);
      for (const [start, count] of layout.groups) {
        for (let k = 0; k < count; k += 1) draw(chars[i++], start + 3.5 + 7 * k);
      }
      if (outs.length && outs[outs.length - 1] > 0) draw(chars[i++], outs[outs.length - 1], textSize * 0.9);
    } else {
      const size = fitSize(enc.label, spec.font, 600, textSize, Math.max(M, 20));
      draw(enc.label, M / 2, size);
    }
  }
  return { width: W, height: H, items, info: { kind: '1d', modules: M } };
}
