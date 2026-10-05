// Path generators. All coordinates are in "module units": one QR module is 1 x 1.

const f = (v) => +v.toFixed(3);

/** Size of each data shape, as a share of one module. Tuned so common decoders read them. */
export const SHAPE_SIZE = { dotRadius: 0.5, diamondHalf: 0.72, tileInset: 0.06, barInset: 0.08 };

export function rectPath(x, y, w, h) {
  return `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`;
}

export function circlePath(cx, cy, r) {
  return `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
}

export function diamondPath(cx, cy, half) {
  return `M${f(cx)} ${f(cy - half)}L${f(cx + half)} ${f(cy)}L${f(cx)} ${f(cy + half)}L${f(cx - half)} ${f(cy)}Z`;
}

/** Rounded rectangle with one radius per corner: [topLeft, topRight, bottomRight, bottomLeft]. */
export function roundRectPath(x, y, w, h, [tl, tr, br, bl]) {
  let d = `M${f(x + tl)} ${f(y)}H${f(x + w - tr)}`;
  if (tr) d += `A${f(tr)} ${f(tr)} 0 0 1 ${f(x + w)} ${f(y + tr)}`;
  d += `V${f(y + h - br)}`;
  if (br) d += `A${f(br)} ${f(br)} 0 0 1 ${f(x + w - br)} ${f(y + h)}`;
  d += `H${f(x + bl)}`;
  if (bl) d += `A${f(bl)} ${f(bl)} 0 0 1 ${f(x)} ${f(y + h - bl)}`;
  d += `V${f(y + tl)}`;
  if (tl) d += `A${f(tl)} ${f(tl)} 0 0 1 ${f(x + tl)} ${f(y)}`;
  return d + 'Z';
}

/**
 * Path for one dark data module at (x, y).
 * nb tells which orthogonal neighbours are dark: { u, d, l, r }.
 * bleed grows square-ish shapes into dark neighbours so differently coloured modules leave no hairline seams.
 * o.scale (about 0.6 to 1.1) sizes the shape inside its cell, o.round (0 to 1) sets how round its corners are.
 */
export function modulePath(shape, x, y, nb, bleed = 0, o = {}) {
  const scale = o.scale ?? 1;
  const round = o.round ?? 1;
  switch (shape) {
    case 'dot':
      return circlePath(x + 0.5, y + 0.5, SHAPE_SIZE.dotRadius * scale);
    case 'diamond':
      return diamondPath(x + 0.5, y + 0.5, SHAPE_SIZE.diamondHalf * scale);
    case 'tiles': {
      const size = (1 - 2 * SHAPE_SIZE.tileInset) * scale;
      const rad = 0.25 * round * size;
      return roundRectPath(x + (1 - size) / 2, y + (1 - size) / 2, size, size, [rad, rad, rad, rad]);
    }
    case 'bars': {
      const top = nb.u ? y - bleed : y + 0.08;
      const bottom = nb.d ? y + 1 + bleed : y + 0.92;
      const w = (1 - 2 * SHAPE_SIZE.barInset) * scale;
      const cap = (w / 2) * round;
      const rt = nb.u ? 0 : cap;
      const rb = nb.d ? 0 : cap;
      return roundRectPath(x + (1 - w) / 2, top, w, bottom - top, [rt, rt, rb, rb]);
    }
    case 'liquid': {
      const R = 0.5 * round;
      const left = nb.l ? bleed : 0;
      const top = nb.u ? bleed : 0;
      return roundRectPath(x - left, y - top, 1 + left + (nb.r ? bleed : 0), 1 + top + (nb.d ? bleed : 0), [
        !nb.u && !nb.l ? R : 0,
        !nb.u && !nb.r ? R : 0,
        !nb.d && !nb.r ? R : 0,
        !nb.d && !nb.l ? R : 0,
      ]);
    }
    default: {
      const l = nb.l ? bleed : 0;
      const u = nb.u ? bleed : 0;
      return rectPath(x - l, y - u, 1 + l + (nb.r ? bleed : 0), 1 + u + (nb.d ? bleed : 0));
    }
  }
}

/** Outer ring of a finder pattern (7 x 7 modules), drawn with the even-odd rule. */
export function eyeFramePath(style, x, y) {
  switch (style) {
    case 'rounded':
      return roundRectPath(x, y, 7, 7, [2, 2, 2, 2]) + roundRectPath(x + 1, y + 1, 5, 5, [1.2, 1.2, 1.2, 1.2]);
    case 'circle':
      return circlePath(x + 3.5, y + 3.5, 3.5) + circlePath(x + 3.5, y + 3.5, 2.5);
    case 'leaf':
      return roundRectPath(x, y, 7, 7, [3.2, 0, 3.2, 0]) + roundRectPath(x + 1, y + 1, 5, 5, [2.2, 0, 2.2, 0]);
    default:
      return rectPath(x, y, 7, 7) + rectPath(x + 1, y + 1, 5, 5);
  }
}

/** Centre of a finder pattern (3 x 3 modules) with its top-left at (x, y). */
export function eyeBallPath(style, x, y) {
  switch (style) {
    case 'rounded':
      return roundRectPath(x, y, 3, 3, [0.8, 0.8, 0.8, 0.8]);
    case 'circle':
      return circlePath(x + 1.5, y + 1.5, 1.5);
    case 'diamond':
      return diamondPath(x + 1.5, y + 1.5, 2.1);
    default:
      return rectPath(x, y, 3, 3);
  }
}
