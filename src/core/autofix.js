import { createQR, createBarcode, barcodeVerifyOptions } from './render.js';
import { verifyScene, limitByContrast } from './verify.js';
import { normalizeSpec, randomStyle } from './defaults.js';
import { normalizeBar, DEFAULT_BAR } from './barcode.js';
import { normalizeCard } from './card.js';
import { inkContrast } from './colors.js';

export const dotContrast = inkContrast;

const range = (from, to, step) => {
  const out = [];
  for (let v = from; step < 0 ? v >= to - 1e-9 : v <= to + 1e-9; v += step) out.push(+v.toFixed(3));
  return out;
};

/** Ordered repair stages for a QR code. Each returns candidates { spec?, card? } to try, gentlest first. */
function qrStages(spec, card) {
  const placement = spec.art.placement;
  const art = (patch) => ({ spec: { ...spec, art: { ...spec.art, ...patch } } });
  const top = (patch, note) => [{ spec: { ...spec, ...patch } }, note];
  const withNote = (candidates, note) => candidates.map((c) => [c, note]);
  const hasCard = card && card.preset !== 'none';
  return [
    spec.ec !== 'H' ? [top({ ec: 'H' }, 'Raised error correction to H')] : [],
    dotContrast(spec) < 4.5 || spec.eyeColor || spec.eyeBallColor
      ? [top({ fg: '#1F1E1D', fg2: '#1F1E1D', bg: '#FFFFFF', gradient: false, eyeColor: '', eyeBallColor: '', transparent: false }, 'Restored dark dots on a light background')]
      : [],
    spec.quiet < 3 ? [top({ quiet: 3 }, 'Widened the quiet border')] : [],
    spec.scale < 1 ? [top({ scale: 1 }, 'Restored full-size dots')] : [],
    placement === 'center' ? withNote(range(spec.art.size - 0.03, 0.12, -0.03).map((size) => art({ size })), 'Made the sign smaller') : [],
    placement === 'center' ? withNote([art({ padding: Math.max(spec.art.padding, 1) })], 'Added space around the sign') : [],
    placement === 'fill' && spec.art.backdrop > 0 ? withNote([art({ backdrop: 0 })], 'Removed the faded picture behind the dots') : [],
    placement === 'fill' ? withNote(range(spec.art.strength - 0.15, 0, -0.15).map((strength) => art({ strength })), 'Darkened the picture colors') : [],
    ['bars', 'diamond', 'dot'].includes(spec.shape) ? [top({ shape: 'tiles' }, 'Switched to sturdier dots')] : [],
    spec.shape !== 'square' ? [top({ shape: 'square', roundness: 1 }, 'Switched to square dots')] : [],
    spec.eyeFrame !== 'square' || spec.eyeBall !== 'square' ? [top({ eyeFrame: 'square', eyeBall: 'square' }, 'Switched to square corner eyes')] : [],
    hasCard && (card.ornament !== 'none' || !card.plate)
      ? [[{ card: { ...card, ornament: 'none', plate: true, plateColor: '#FFFFFF' } }, 'Put the code on a plain white plate in the card']]
      : [],
  ];
}

/**
 * Try progressively stronger repairs until the code reads at every size.
 * Returns the best style found, what changed, and its check result.
 */
export async function autoFix({ text, spec: specInput, source = null, card: cardInput = null }) {
  let spec = normalizeSpec(specInput);
  let card = cardInput ? normalizeCard(cardInput) : null;
  const evaluate = async (s, c) => limitByContrast(await verifyScene(createQR({ text, spec: s, source, card: c }).scene, text), inkContrast(s));

  const first = await evaluate(spec, card);
  if (first.status === 'good') return { spec, card, check: first, changes: [], fixed: false };

  let changes = [];
  let best = { spec, card, check: first, changes: [] };
  const stageCount = qrStages(spec, card).length;

  for (let i = 0; i < stageCount; i += 1) {
    for (const [candidate, note] of qrStages(spec, card)[i]) {
      const nextSpec = candidate.spec ? normalizeSpec(candidate.spec) : spec;
      const nextCard = candidate.card ? normalizeCard(candidate.card) : card;
      const result = await evaluate(nextSpec, nextCard);
      const notes = changes.includes(note) ? changes : [...changes, note];
      if (result.status === 'good') return { spec: nextSpec, card: nextCard, check: result, changes: notes, fixed: true };
      if (result.passes >= best.check.passes) best = { spec: nextSpec, card: nextCard, check: result, changes: notes };
      spec = nextSpec;
      card = nextCard;
      changes = notes;
    }
  }
  return { ...best, fixed: best.check.status === 'good' };
}

/** A random style that passes the scan check. Falls back to auto-fixing the last attempt. */
export async function randomReadable({ text, spec: current, source = null, card = null, rand = Math.random, tries = 8 }) {
  let last = null;
  for (let i = 0; i < tries; i += 1) {
    last = randomStyle(current, rand);
    const check = limitByContrast(await verifyScene(createQR({ text, spec: last, source, card }).scene, text), inkContrast(last));
    if (check.status === 'good') return { spec: last, check };
  }
  const fixed = await autoFix({ text, spec: last, source, card });
  return { spec: fixed.spec, check: fixed.check };
}

/** Repairs for a barcode: colors, bar height, rounding, margins. */
export async function autoFixBarcode({ lib, bar: barInput, card: cardInput = null }) {
  let bar = normalizeBar(barInput);
  let card = cardInput ? normalizeCard(cardInput) : null;
  const evaluate = async (b, c) => {
    const { scene, enc } = createBarcode({ lib, bar: b, card: c });
    const options = barcodeVerifyOptions(enc);
    return options ? limitByContrast(await verifyScene(scene, enc.expected, options), inkContrast(b)) : { status: 'untested', passes: 0, total: 0 };
  };
  const first = await evaluate(bar, card);
  if (first.status === 'good' || first.status === 'untested') return { bar, card, check: first, changes: [], fixed: false };

  const steps = [
    [{ fg: '#1F1E1D', fg2: '#1F1E1D', bg: '#FFFFFF', gradient: false, transparent: false }, 'Restored dark bars on a light background'],
    [{ shrink: 0, round: 0 }, 'Made the bars plain and full width'],
    [{ quiet: Math.max(bar.quiet, DEFAULT_BAR.quiet) }, 'Widened the quiet margins'],
    [{ height: Math.max(bar.height, 0.45) }, 'Made the bars taller'],
    [{ height: Math.max(bar.height, 0.7) }, 'Made the bars taller still'],
  ];
  let changes = [];
  let best = { bar, card, check: first, changes: [] };
  const tryNext = async (note) => {
    const result = await evaluate(bar, card);
    changes = [...changes, note];
    if (result.status === 'good') return { bar, card, check: result, changes, fixed: true };
    if (result.passes >= best.check.passes) best = { bar, card, check: result, changes: [...changes] };
    return null;
  };
  for (const [patch, note] of steps) {
    bar = normalizeBar({ ...bar, ...patch });
    const done = await tryNext(note);
    if (done) return done;
  }
  if (card && (card.ornament !== 'none' || !card.plate)) {
    card = normalizeCard({ ...card, ornament: 'none', plate: true, plateColor: '#FFFFFF' });
    const done = await tryNext('Put the barcode on a plain white plate');
    if (done) return done;
  }
  return { ...best, fixed: false };
}
