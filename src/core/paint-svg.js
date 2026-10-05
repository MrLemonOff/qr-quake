import { roundRectPath } from './shapes.js';

const f = (v) => +Number(v).toFixed(3);
const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]);

/** Resolution used when a per-density picture is embedded in an SVG. */
const SVG_RASTER_PPM = 24;

/** Serialise a scene as a standalone SVG string. */
export function sceneToSvg(scene, { px = 1024, title = 'QR code' } = {}) {
  let defs = '';
  let ids = 0;
  const cache = new Map();

  const paint = (p) => {
    if (typeof p === 'string') return p;
    if (cache.has(p)) return cache.get(p);
    const id = `g${ids++}`;
    const stops = p.stops.map(([o, c]) => `<stop offset="${f(o)}" stop-color="${c}"/>`).join('');
    defs +=
      p.kind === 'radial'
        ? `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(p.cx)}" cy="${f(p.cy)}" r="${f(p.r)}">${stops}</radialGradient>`
        : `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(p.x1)}" y1="${f(p.y1)}" x2="${f(p.x2)}" y2="${f(p.y2)}">${stops}</linearGradient>`;
    const ref = `url(#${id})`;
    cache.set(p, ref);
    return ref;
  };

  const common = (item) => {
    let out = '';
    if (item.opacity != null && item.opacity !== 1) out += ` opacity="${f(item.opacity)}"`;
    if (item.shadow) {
      const id = `s${ids++}`;
      defs += `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${f(item.shadow.dx || 0)}" dy="${f(item.shadow.dy || 0)}" stdDeviation="${f(item.shadow.blur / 2)}" flood-color="${item.shadow.color}"/></filter>`;
      out += ` filter="url(#${id})"`;
    }
    return out;
  };

  const style = (item) => {
    let out = ` fill="${item.fill ? paint(item.fill) : 'none'}"`;
    if (item.rule === 'evenodd') out += ' fill-rule="evenodd"';
    if (item.stroke) {
      out += ` stroke="${paint(item.stroke)}" stroke-width="${f(item.strokeWidth || 1)}" stroke-linecap="round"`;
      if (item.dash) out += ` stroke-dasharray="${item.dash.map(f).join(' ')}"`;
    }
    return out;
  };

  const clipAttr = (d) => {
    const id = `c${ids++}`;
    defs += `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
    return ` clip-path="url(#${id})"`;
  };

  const emit = (items) => {
    let out = '';
    for (const item of items) {
      if (item.t === 'rect') {
        const rx = item.rx || 0;
        out += rx > 0
          ? `<path d="${roundRectPath(item.x, item.y, item.w, item.h, [rx, rx, rx, rx])}"${style(item)}${common(item)}/>`
          : `<rect x="${f(item.x)}" y="${f(item.y)}" width="${f(item.w)}" height="${f(item.h)}"${style(item)}${common(item)}/>`;
      } else if (item.t === 'path') {
        if (item.d) out += `<path d="${item.d}"${style(item)}${common(item)}/>`;
      } else if (item.t === 'image' || item.t === 'raster') {
        const canvas = item.t === 'raster' ? item.make(SVG_RASTER_PPM) : item.canvas;
        const clip = item.clip ? clipAttr(item.clip) : '';
        out += `<image href="${canvas.toDataURL('image/png')}" x="${f(item.x)}" y="${f(item.y)}" width="${f(item.w)}" height="${f(item.h)}" preserveAspectRatio="none"${clip}${common(item)}/>`;
      } else if (item.t === 'text') {
        out += `<text x="${f(item.x)}" y="${f(item.y)}" font-size="${f(item.size)}" font-family="${esc(item.font)}" font-weight="${item.weight || 600}" text-anchor="${{ left: 'start', right: 'end' }[item.anchor] || 'middle'}" fill="${paint(item.fill)}"${common(item)}>${esc(item.text)}</text>`;
      } else if (item.t === 'group') {
        const clip = item.clip ? clipAttr(item.clip) : '';
        out += `<g transform="translate(${f(item.x)} ${f(item.y)}) scale(${f(item.s)})"${clip}${common(item)}>${emit(item.items)}</g>`;
      }
    }
    return out;
  };

  const body = emit(scene.items);
  const w = f(scene.width);
  const h = f(scene.height);
  const heightPx = Math.round((px * scene.height) / scene.width);
  const safeTitle = esc(title);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${px}" height="${heightPx}" role="img" aria-label="${safeTitle}">` +
    `<title>${safeTitle}</title>${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`
  );
}
