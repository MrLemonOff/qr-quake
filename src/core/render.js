import { buildMatrix } from './matrix.js';
import { prepareArt } from './art.js';
import { buildScene } from './scene.js';
import { normalizeSpec } from './defaults.js';
import { buildCard, normalizeCard } from './card.js';
import { BARCODE_BY_ID, buildBarcodeScene, encodeBarcode, normalizeBar } from './barcode.js';
import { verifyScene, limitByContrast, VERIFY_PPM_BARCODE, VERIFY_PPM_2D } from './verify.js';
import { inkContrast } from './colors.js';

/** Denser symbols give pictures more pixels to work with, and center signs more room. */
const MIN_VERSION = { none: 1, center: 5, fill: 8 };

let artCache = { source: null, key: '', art: null };

function artFor(source, spec, n) {
  const a = spec.art;
  const key = JSON.stringify([a.placement, a.shape, a.zoom, a.offsetX, a.offsetY, a.brightness, a.contrast, a.saturation, a.placement === 'center' ? '' : spec.bg, a.placement === 'fill' ? n : 0]);
  if (artCache.source === source && artCache.key === key) return artCache.art;
  const art = prepareArt(source, spec, n);
  artCache = { source, key, art };
  return art;
}

/**
 * Build a QR code scene (optionally inside a card).
 * `source` is an optional picture (canvas or image) for the art placement in spec.art.
 */
export function createQR({ text, spec, source = null, card = null }) {
  const clean = normalizeSpec(spec);
  const placement = source ? clean.art.placement : 'none';
  const minVersion = Math.min(40, MIN_VERSION[placement] + clean.detail * 2);
  const matrix = buildMatrix(text, clean.ec, minVersion);
  const art = source ? artFor(source, clean, matrix.n) : null;
  const qr = buildScene(matrix, clean, art);
  const scene = card ? buildCard(qr, card) : qr;
  return { scene, qr, spec: clean, matrix, card: card ? normalizeCard(card) : null };
}

/** Build a barcode scene (optionally inside a card). `lib` comes from loadBarcodeLibrary(). */
export function createBarcode({ lib, bar, card = null }) {
  const spec = normalizeBar(bar);
  const enc = encodeBarcode(lib, spec.format, spec.text);
  const inner = buildBarcodeScene(enc, spec);
  const scene = card ? buildCard(inner, card) : inner;
  return { scene, enc, spec };
}

const norm = (s) => String(s ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');

/** Options for verifyScene that fit a barcode. Returns null when no decoder can test this format. */
export function barcodeVerifyOptions(enc) {
  const zx = BARCODE_BY_ID[enc.format].zx;
  if (!zx) return null;
  const want = norm(enc.expected);
  return { formats: [zx], ppms: enc.kind === '2d' ? VERIFY_PPM_2D : VERIFY_PPM_BARCODE, match: (got) => Boolean(got) && (norm(got) === want || (norm(got).length >= 4 && (want.includes(norm(got)) || norm(got).includes(want)))) };
}

/** createQR plus the scan check. */
export async function createVerifiedQR(input) {
  const qr = createQR(input);
  return { ...qr, check: limitByContrast(await verifyScene(qr.scene, input.text), inkContrast(qr.spec)) };
}
