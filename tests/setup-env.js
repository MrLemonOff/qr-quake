import { createCanvas, Path2D, loadImage } from '@napi-rs/canvas';
import { setEnv } from '../src/core/env.js';

// Run the engine in Node with a real raster canvas, so tests decode actual pixels.
setEnv({
  createCanvas: (w, h) => createCanvas(w, h),
  Path2D,
  loadSvg: (svg) => loadImage(Buffer.from(svg)),
});
