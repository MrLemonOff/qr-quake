import { getEnv } from './env.js';
import { roundRectPath } from './shapes.js';

function toStyle(ctx, paint) {
  if (typeof paint === 'string') return paint;
  const g =
    paint.kind === 'radial'
      ? ctx.createRadialGradient(paint.cx, paint.cy, 0, paint.cx, paint.cy, paint.r)
      : ctx.createLinearGradient(paint.x1, paint.y1, paint.x2, paint.y2);
  for (const [offset, color] of paint.stops) g.addColorStop(offset, color);
  return g;
}

/** Highest resolution used for pictures that are re-drawn per pixel density. */
export const MAX_RASTER_PPM = 48;

function drawItems(ctx, items, ppu) {
  const { Path2D } = getEnv();
  for (const item of items) {
    ctx.save();
    ctx.globalAlpha = item.opacity ?? 1;
    if (item.shadow) {
      ctx.shadowColor = item.shadow.color;
      ctx.shadowBlur = item.shadow.blur * ppu;
      ctx.shadowOffsetX = (item.shadow.dx || 0) * ppu;
      ctx.shadowOffsetY = (item.shadow.dy || 0) * ppu;
    }
    if (item.t === 'rect') {
      const rx = item.rx || 0;
      if (rx > 0) {
        const path = new Path2D(roundRectPath(item.x, item.y, item.w, item.h, [rx, rx, rx, rx]));
        paintShape(ctx, path, item);
      } else {
        if (item.fill) {
          ctx.fillStyle = toStyle(ctx, item.fill);
          ctx.fillRect(item.x, item.y, item.w, item.h);
        }
        if (item.stroke) {
          ctx.strokeStyle = toStyle(ctx, item.stroke);
          ctx.lineWidth = item.strokeWidth || 1;
          ctx.strokeRect(item.x, item.y, item.w, item.h);
        }
      }
    } else if (item.t === 'path') {
      if (item.d) paintShape(ctx, new Path2D(item.d), item);
    } else if (item.t === 'image') {
      if (item.clip) ctx.clip(new Path2D(item.clip));
      ctx.drawImage(item.canvas, item.x, item.y, item.w, item.h);
    } else if (item.t === 'raster') {
      const canvas = item.make(Math.min(MAX_RASTER_PPM, Math.max(6, Math.ceil(ppu))));
      ctx.drawImage(canvas, item.x, item.y, item.w, item.h);
    } else if (item.t === 'text') {
      ctx.fillStyle = toStyle(ctx, item.fill);
      ctx.font = `${item.weight || 600} ${item.size}px ${item.font}`;
      ctx.textAlign = item.anchor || 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(item.text, item.x, item.y);
    } else if (item.t === 'group') {
      ctx.translate(item.x, item.y);
      ctx.scale(item.s, item.s);
      if (item.clip) ctx.clip(new Path2D(item.clip));
      drawItems(ctx, item.items, ppu * item.s);
    }
    ctx.restore();
  }
}

function paintShape(ctx, path, item) {
  if (item.fill) {
    ctx.fillStyle = toStyle(ctx, item.fill);
    ctx.fill(path, item.rule === 'evenodd' ? 'evenodd' : 'nonzero');
  }
  if (item.stroke) {
    ctx.strokeStyle = toStyle(ctx, item.stroke);
    ctx.lineWidth = item.strokeWidth || 1;
    ctx.setLineDash(item.dash || []);
    ctx.lineCap = 'round';
    ctx.stroke(path);
  }
}

/** Paint a scene onto a canvas, px wide (the height follows the scene's shape). `underlay` fills behind transparent scenes. */
export function paintCanvas(scene, canvas, px, { underlay } = {}) {
  const w = Math.round(px);
  const h = Math.max(1, Math.round((px * scene.height) / scene.width));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  if (underlay) {
    ctx.fillStyle = underlay;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.save();
  ctx.scale(w / scene.width, h / scene.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  drawItems(ctx, scene.items, w / scene.width);
  ctx.restore();
  return canvas;
}
