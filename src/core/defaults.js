import { sanitizeColor } from './colors.js';

export const SHAPES = ['square', 'dot', 'liquid', 'diamond', 'bars', 'tiles'];
export const EYE_FRAMES = ['square', 'rounded', 'circle', 'leaf'];
export const EYE_BALLS = ['square', 'rounded', 'circle', 'diamond'];
export const EC_LEVELS = ['L', 'M', 'Q', 'H'];
export const PLACEMENTS = ['center', 'fill'];
export const ART_SHAPES = ['circle', 'rounded', 'square', 'free'];
export const GRADIENTS = ['linear', 'radial'];

/** Every palette keeps both colors dark enough to scan on its background. */
export const PALETTES = [
  { name: 'Ink', fg: '#1F1E1D', fg2: '#4A4944', bg: '#FFFFFF' },
  { name: 'Azure', fg: '#1D4FB8', fg2: '#0B2A6B', bg: '#FFFFFF' },
  { name: 'Ocean', fg: '#0B4F6C', fg2: '#145DA0', bg: '#F2FAFF' },
  { name: 'Sunset', fg: '#C2410C', fg2: '#9D174D', bg: '#FFF8F1' },
  { name: 'Forest', fg: '#14532D', fg2: '#3F6212', bg: '#F7FBEF' },
  { name: 'Grape', fg: '#581C87', fg2: '#BE185D', bg: '#FFFFFF' },
  { name: 'Berry', fg: '#831843', fg2: '#4C1D95', bg: '#FDF2F8' },
  { name: 'Gold', fg: '#92400E', fg2: '#78350F', bg: '#FFFBEB' },
  { name: 'Indigo', fg: '#3730A3', fg2: '#6D28D9', bg: '#FFFFFF' },
  { name: 'Rose', fg: '#9F1239', fg2: '#BE123C', bg: '#FFF1F2' },
  { name: 'Teal', fg: '#115E59', fg2: '#0F766E', bg: '#F0FDFA' },
  { name: 'Slate', fg: '#0F172A', fg2: '#334155', bg: '#F8FAFC' },
  { name: 'Mint', fg: '#047857', fg2: '#065F46', bg: '#ECFDF5' },
  { name: 'Cherry', fg: '#B91C1C', fg2: '#7F1D1D', bg: '#FEF2F2' },
  { name: 'Midnight', fg: '#1E3A8A', fg2: '#312E81', bg: '#EFF6FF' },
  { name: 'Cocoa', fg: '#78350F', fg2: '#451A03', bg: '#FEF3C7' },
];

export const DEFAULT_SPEC = {
  ec: 'H',
  quiet: 3,
  detail: 0,
  shape: 'liquid',
  scale: 1,
  roundness: 1,
  eyeFrame: 'rounded',
  eyeBall: 'rounded',
  eyeColor: '',
  eyeBallColor: '',
  fg: '#1F1E1D',
  fg2: '#2F6BDC',
  gradient: false,
  gradientType: 'linear',
  gradientAngle: 45,
  bg: '#FFFFFF',
  transparent: false,
  art: {
    placement: 'center',
    shape: 'circle',
    size: 0.24,
    padding: 0.5,
    ring: 0,
    ringColor: '#FFFFFF',
    plate: '',
    strength: 0.6,
    backdrop: 0,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
  },
};

const pick = (value, list, fallback) => (list.includes(value) ? value : fallback);
const num = (value, lo, hi, fallback) => {
  const v = Number(value);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
};
const color = (value, fallback) => sanitizeColor(value, fallback);
const optColor = (value) => (value ? sanitizeColor(value, '') : '');

/** Returns a clean, fully valid copy of a QR style. Anything unknown falls back to the default. */
export function normalizeSpec(input = {}) {
  const d = DEFAULT_SPEC;
  const a = input.art || {};
  const da = d.art;
  return {
    ec: pick(input.ec, EC_LEVELS, d.ec),
    quiet: Math.round(num(input.quiet, 0, 8, d.quiet)),
    detail: Math.round(num(input.detail, 0, 10, d.detail)),
    shape: pick(input.shape, SHAPES, d.shape),
    scale: num(input.scale, 0.6, 1.1, d.scale),
    roundness: num(input.roundness, 0, 1, d.roundness),
    eyeFrame: pick(input.eyeFrame, EYE_FRAMES, d.eyeFrame),
    eyeBall: pick(input.eyeBall, EYE_BALLS, d.eyeBall),
    eyeColor: optColor(input.eyeColor),
    eyeBallColor: optColor(input.eyeBallColor),
    fg: color(input.fg, d.fg),
    fg2: color(input.fg2, d.fg2),
    gradient: Boolean(input.gradient),
    gradientType: pick(input.gradientType, GRADIENTS, d.gradientType),
    gradientAngle: num(input.gradientAngle, 0, 360, d.gradientAngle),
    bg: color(input.bg, d.bg),
    transparent: Boolean(input.transparent),
    art: {
      placement: pick(a.placement, PLACEMENTS, da.placement),
      shape: pick(a.shape, ART_SHAPES, da.shape),
      size: num(a.size, 0.08, 0.5, da.size),
      padding: num(a.padding, 0, 3, da.padding),
      ring: num(a.ring, 0, 2, da.ring),
      ringColor: color(a.ringColor, da.ringColor),
      plate: optColor(a.plate),
      strength: num(a.strength, 0, 1, da.strength),
      backdrop: num(a.backdrop, 0, 1, da.backdrop),
      zoom: num(a.zoom, 1, 4, da.zoom),
      offsetX: num(a.offsetX, -1, 1, da.offsetX),
      offsetY: num(a.offsetY, -1, 1, da.offsetY),
      brightness: num(a.brightness, -1, 1, da.brightness),
      contrast: num(a.contrast, -1, 1, da.contrast),
      saturation: num(a.saturation, -1, 1, da.saturation),
    },
  };
}

/** A random but safe style: palette, shapes, eyes and gradient. Art settings are left alone. */
export function randomStyle(current, rand = Math.random) {
  const choose = (list) => list[Math.floor(rand() * list.length)];
  const palette = choose(PALETTES);
  return normalizeSpec({
    ...current,
    shape: choose(SHAPES),
    scale: 1,
    eyeFrame: choose(EYE_FRAMES),
    eyeBall: choose(EYE_BALLS),
    fg: palette.fg,
    fg2: palette.fg2,
    bg: palette.bg,
    transparent: false,
    gradient: rand() < 0.6,
    gradientType: rand() < 0.75 ? 'linear' : 'radial',
    gradientAngle: Math.round(rand() * 8) * 45,
    eyeColor: '',
    eyeBallColor: '',
    art: current.art,
  });
}
