import jsQR from 'jsqr';
import { getEnv } from './env.js';
import { paintCanvas } from './paint-canvas.js';

/**
 * Check resolutions, in pixels per unit (one QR module, or one narrow bar). They are small on purpose: a phone
 * camera sees a code at a few pixels per module, and a small render also exposes weak contrast quickly.
 * The odd numbers avoid a decoder lining its internal blocks up with the module grid.
 */
export const VERIFY_PPM = [2.6, 3.3, 4.1, 5.2];
export const VERIFY_PPM_BARCODE = [2.4, 3.2, 4.4, 6];
export const VERIFY_PPM_2D = [4.2, 5.5, 7, 9];

let zxing = null;
/** ZXing (the engine behind many Android scanners) is loaded the first time it is needed. */
const loadZXing = () => (zxing ||= import('@zxing/library'));

function lumaOf(image) {
  const { data, width, height } = image;
  const luma = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < luma.length; i += 1, p += 4) luma[i] = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
  return luma;
}

function zxingDecode(zx, image, reader, hints) {
  const { width, height } = image;
  const bitmap = new zx.BinaryBitmap(new zx.HybridBinarizer(new zx.RGBLuminanceSource(lumaOf(image), width, height)));
  // ZXing's multi-format reader prints a warning for every "nothing found" result; that is normal here.
  const warn = console.warn;
  console.warn = () => {};
  try {
    return reader.decode(bitmap, hints).getText();
  } catch (err) {
    return null;
  } finally {
    console.warn = warn;
  }
}

/** Render a scene small, on white, and return its pixels. */
function renderPixels(scene, px) {
  const { createCanvas } = getEnv();
  const canvas = createCanvas(px, px);
  paintCanvas(scene, canvas, px, { underlay: '#ffffff' });
  const w = canvas.width;
  const h = canvas.height;
  return canvas.getContext('2d').getImageData(0, 0, w, h);
}

/**
 * Render the scene at several small sizes and read it with independent decoders, comparing with the expected text.
 *
 *   QR codes:  jsQR and ZXing
 *   Barcodes:  ZXing (set options.formats to the ZXing format names it should expect)
 *
 * status:
 *   'good'    read at nearly every size
 *   'fragile' read at some sizes only
 *   'fail'    could not be read
 */
export async function verifyScene(scene, expected, options = {}) {
  const { ppms = VERIFY_PPM, formats = null, match = (text) => text === expected } = options;
  const zx = await loadZXing();
  const hints = new Map();
  let reader;
  if (formats) {
    hints.set(zx.DecodeHintType.POSSIBLE_FORMATS, formats.map((f) => zx.BarcodeFormat[f]));
    hints.set(zx.DecodeHintType.TRY_HARDER, true);
    reader = new zx.MultiFormatReader();
  } else {
    hints.set(zx.DecodeHintType.TRY_HARDER, true);
    reader = new zx.QRCodeReader();
  }

  let zxPasses = 0;
  let jsPasses = 0;
  for (const ppm of ppms) {
    const px = Math.max(60, Math.round(scene.width * ppm));
    const image = renderPixels(scene, px);
    if (match(zxingDecode(zx, image, reader, hints))) zxPasses += 1;
    if (!formats) {
      const r = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
      if (r && match(r.data)) jsPasses += 1;
    }
  }

  const sizes = ppms.length;
  const total = formats ? sizes : sizes * 2;
  const passes = zxPasses + jsPasses;
  const need = Math.ceil(sizes * 0.75);
  // ZXing (the engine behind many phones) must read nearly every size. jsQR is stricter than most phones,
  // so it only has to read the code at least once: that catches codes that are really on the edge.
  const good = formats ? zxPasses >= need : zxPasses >= need && jsPasses >= 1;
  const status = good ? 'good' : passes > 0 ? 'fragile' : 'fail';
  return { status, passes, total, zxing: zxPasses, jsqr: jsPasses };
}

/**
 * Decoders are forgiving about pale ink, but a code printed or shown with weak contrast fails in real light.
 * ratio is the contrast between ink and background (see inkContrast).
 */
export function limitByContrast(check, ratio) {
  if (ratio < 2.5 && check.status !== 'fail') return { ...check, status: 'fail', reason: 'contrast' };
  if (ratio < 4 && check.status === 'good') return { ...check, status: 'fragile', reason: 'contrast' };
  return check;
}
