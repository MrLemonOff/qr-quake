import { getEnv } from './env.js';

// Procedural example pictures, so the app has demo art without shipping any image files.

export const SAMPLES = [
  { id: 'sunset', name: 'Sunset' },
  { id: 'waves', name: 'Waves' },
  { id: 'bloom', name: 'Bloom' },
];

function ridge(ctx, s, base, amp, f1, f2, phase, color) {
  ctx.beginPath();
  ctx.moveTo(0, s);
  for (let x = 0; x <= s; x += 4) {
    const y = base - amp * (Math.sin(x * f1 + phase) + 0.5 * Math.sin(x * f2 + phase * 2.3));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(s, s);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function sunset(ctx, s) {
  const sky = ctx.createLinearGradient(0, 0, 0, s);
  sky.addColorStop(0, '#1e1b4b');
  sky.addColorStop(0.35, '#7c3aed');
  sky.addColorStop(0.6, '#f472b6');
  sky.addColorStop(0.78, '#fb923c');
  sky.addColorStop(1, '#fde047');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, s, s);
  const glow = ctx.createRadialGradient(s * 0.5, s * 0.62, 0, s * 0.5, s * 0.62, s * 0.34);
  glow.addColorStop(0, 'rgba(255,247,174,0.95)');
  glow.addColorStop(1, 'rgba(251,146,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#fff3a8';
  ctx.beginPath();
  ctx.arc(s * 0.5, s * 0.62, s * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ridge(ctx, s, s * 0.74, s * 0.05, 0.018, 0.047, 1.2, '#7c2d8f');
  ridge(ctx, s, s * 0.82, s * 0.06, 0.013, 0.039, 4.1, '#4c1d95');
  ridge(ctx, s, s * 0.92, s * 0.04, 0.02, 0.05, 2.6, '#1e1b4b');
}

function waves(ctx, s) {
  const bg = ctx.createLinearGradient(0, 0, s, s);
  bg.addColorStop(0, '#a5f3fc');
  bg.addColorStop(1, '#2dd4bf');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);
  const colors = ['#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'];
  colors.forEach((color, i) => ridge(ctx, s, s * (0.3 + i * 0.1), s * 0.05, 0.016 + i * 0.002, 0.04, i * 1.7, color));
}

function bloom(ctx, s) {
  const bg = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.75);
  bg.addColorStop(0, '#4c1d95');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);
  ctx.save();
  ctx.translate(s / 2, s / 2);
  for (let ring = 0; ring < 3; ring += 1) {
    const count = 12 - ring * 2;
    const len = s * (0.44 - ring * 0.1);
    for (let i = 0; i < count; i += 1) {
      ctx.save();
      ctx.rotate((i / count) * Math.PI * 2 + ring * 0.3);
      const g = ctx.createLinearGradient(0, 0, 0, -len);
      g.addColorStop(0, ['#f97316', '#fb7185', '#fde047'][ring]);
      g.addColorStop(1, ['#f472b6', '#e879f9', '#fff7ae'][ring]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -len / 2, s * 0.06, len / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const DRAW = { sunset, waves, bloom };

/** Draw one of the example pictures to a fresh square canvas. */
export function drawSample(id, size = 640) {
  const canvas = getEnv().createCanvas(size, size);
  (DRAW[id] || sunset)(canvas.getContext('2d'), size);
  return canvas;
}
