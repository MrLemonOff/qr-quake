// Generates the images used by README.md: docs/logo.png, docs/icons/*.svg and docs/gallery/*.png.
// Every gallery code is checked with the decoders, so the README never shows a code that does not scan.
import '../tests/setup-env.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import * as lucide from 'lucide';
import { createQR, createBarcode, barcodeVerifyOptions } from '../src/core/render.js';
import { verifyScene, limitByContrast } from '../src/core/verify.js';
import { paintCanvas } from '../src/core/paint-canvas.js';
import { drawSample } from '../src/core/samples.js';
import { drawSign, drawTextSign, findSign, iconMarkup } from '../src/core/signs.js';
import { DEFAULT_SPEC } from '../src/core/defaults.js';
import { DEFAULT_BAR, loadBarcodeLibrary } from '../src/core/barcode.js';
import { cardFromPreset } from '../src/core/card.js';
import { inkContrast } from '../src/core/colors.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...p) => path.join(root, ...p);
fs.mkdirSync(out('docs/icons'), { recursive: true });
fs.mkdirSync(out('docs/gallery'), { recursive: true });

// Logo: the SVG in /public rendered to a crisp PNG.
{
  const img = await loadImage(fs.readFileSync(out('public/logo.svg')));
  const canvas = createCanvas(384, 384);
  canvas.getContext('2d').drawImage(img, 0, 0, 384, 384);
  fs.writeFileSync(out('docs/logo.png'), canvas.toBuffer('image/png'));
  console.log('docs/logo.png');
}

// Icons: Lucide (ISC) outlines in the accent color, saved as standalone SVG files.
const ICONS = {
  image: 'Image', shapes: 'Shapes', palette: 'Palette', scan: 'ScanLine', link: 'Link', download: 'Download',
  shield: 'ShieldCheck', smartphone: 'Smartphone', shuffle: 'Shuffle', wand: 'Wand', layers: 'Layers',
  wifi: 'Wifi', contact: 'Contact', mail: 'Mail', phone: 'Phone', barcode: 'Barcode', card: 'IdCard', search: 'Search',
  smile: 'Smile', calendar: 'CalendarDays', map: 'MapPin', coins: 'Coins', key: 'KeyRound', sliders: 'SlidersHorizontal',
  qr: 'QrCode', type: 'Type', globe: 'Globe', pencil: 'Pencil', eye: 'Eye',
};
for (const [file, name] of Object.entries(ICONS)) {
  const node = lucide[name];
  if (!node) throw new Error(`Missing Lucide icon: ${name}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F6BDC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconMarkup(node)}</svg>\n`;
  fs.writeFileSync(out('docs/icons', `${file}.svg`), svg);
}
console.log(`docs/icons: ${Object.keys(ICONS).length} icons`);

// Gallery.
const lib = await loadBarcodeLibrary();
const TEXT = 'https://example.com/qr-quake';
const art = (patch = {}, top = {}) => ({ ...DEFAULT_SPEC, ...top, art: { ...DEFAULT_SPEC.art, ...patch } });
const sign = (id, color) => drawSign(findSign(id), { color, badge: true });
const bolt = await sign('zap', '#2F6BDC');
const heart = await sign('heart', '#BE185D');
const github = await sign('github', '#1F1E1D');
const coffee = await sign('coffee', '#92400E');
const star = await sign('star', '#B45309');
const rocket = await sign('rocket', '#7C3AED');
const letter = drawTextSign('Q', { color: '#0B4F6C', badge: true });
const sunset = drawSample('sunset');
const waves = drawSample('waves');
const bloom = drawSample('bloom');

const QR = [
  ['center-bolt', art(), bolt],
  ['center-heart', art({}, { shape: 'dot', gradient: true, fg: '#581C87', fg2: '#BE185D', eyeFrame: 'circle', eyeBall: 'circle' }), heart],
  ['center-github', art({}, { shape: 'square', eyeFrame: 'square', eyeBall: 'square' }), github],
  ['center-coffee', art({}, { shape: 'tiles', fg: '#92400E', fg2: '#78350F', bg: '#FFFBEB', eyeFrame: 'leaf', eyeBall: 'rounded' }), coffee],
  ['center-letter', art({}, { shape: 'diamond', fg: '#0B4F6C', fg2: '#145DA0', bg: '#F2FAFF', gradient: true, gradientType: 'radial' }), letter],
  ['center-ring', art({ ring: 0.8, ringColor: '#FDE047', size: 0.22 }, { shape: 'bars', fg: '#3730A3', fg2: '#6D28D9', gradient: true, eyeColor: '#6D28D9' }), rocket],
  ['fill-bloom', art({ placement: 'fill' }), bloom],
  ['fill-sunset-backdrop', art({ placement: 'fill', backdrop: 0.6 }, { shape: 'square' }), sunset],
];

const CARDS = [
  ['card-clean', 'clean', art(), star],
  ['card-poster', 'poster', art({}, { fg: '#1D4FB8', fg2: '#0B2A6B' }), bolt],
  ['card-neon', 'neon', art({ placement: 'fill' }, { shape: 'square' }), sunset],
  ['card-sticker', 'sticker', art({}, { shape: 'dot' }), heart],
  ['card-ticket', 'ticket', art({}, { shape: 'tiles' }), star],
  ['card-scanner', 'scanner', art({}, { shape: 'square' }), github],
  ['card-pastel', 'glass', art({ placement: 'fill' }), bloom],
  ['card-polaroid', 'polaroid', art({ placement: 'fill', backdrop: 0.5 }), waves],
  ['card-sparkle', 'sparkle', art({}, { eyeFrame: 'circle', eyeBall: 'circle' }), rocket],
];

const BARCODES = [
  ['barcode-code128', { ...DEFAULT_BAR }, null],
  ['barcode-ean13', { ...DEFAULT_BAR, format: 'ean13', text: '5901234123457', gradient: true, fg: '#1D4FB8', fg2: '#0B2A6B', gradientAngle: 90 }, null],
  ['barcode-code39', { ...DEFAULT_BAR, format: 'code39', text: 'QR-QUAKE', round: 0.6, shrink: 0.12, fg: '#9D174D', bg: '#FFF1F2' }, null],
  ['barcode-itf', { ...DEFAULT_BAR, format: 'itf', text: '1234567890', fg: '#14532D', bg: '#F7FBEF', height: 0.55 }, null],
  ['barcode-pdf417', { ...DEFAULT_BAR, format: 'pdf417', text: 'QR Quake PDF417 barcode', quiet: 3 }, null],
  ['barcode-card', { ...DEFAULT_BAR, format: 'code128', text: 'TICKET-0042', fg: '#451A03' }, 'ticket'],
];

const save = (name, scene) => {
  const w = 720;
  const canvas = createCanvas(w, Math.round((w * scene.height) / scene.width));
  paintCanvas(scene, canvas, w);
  fs.writeFileSync(out('docs/gallery', `${name}.png`), canvas.toBuffer('image/png'));
};
const must = (name, check) => {
  if (check.status !== 'good') throw new Error(`Gallery code "${name}" does not scan reliably (${check.status}).`);
  console.log(`docs/gallery/${name}.png (${check.passes}/${check.total} reads)`);
};

for (const [name, spec, source] of QR) {
  const { scene, spec: clean } = createQR({ text: TEXT, spec, source });
  must(name, limitByContrast(await verifyScene(scene, TEXT), inkContrast(clean)));
  save(name, scene);
}
for (const [name, preset, spec, source] of CARDS) {
  const card = { ...cardFromPreset(preset), footer: preset === 'polaroid' ? 'my little code' : cardFromPreset(preset).footer };
  const { scene } = createQR({ text: TEXT, spec, source, card });
  must(name, await verifyScene(scene, TEXT));
  save(name, scene);
}
for (const [name, bar, preset] of BARCODES) {
  const { scene, enc } = createBarcode({ lib, bar, card: preset ? cardFromPreset(preset) : null });
  const options = barcodeVerifyOptions(enc);
  must(name, options ? await verifyScene(scene, enc.expected, options) : { status: 'good', passes: 0, total: 0 });
  save(name, scene);
}

// Hero: the author's GitHub page as a QR code with the profile picture in a circle (docs/avatar.jpg).
if (fs.existsSync(out('docs/avatar.jpg'))) {
  const img = await loadImage(fs.readFileSync(out('docs/avatar.jpg')));
  const avatar = createCanvas(512, 512);
  avatar.getContext('2d').drawImage(img, 0, 0, 512, 512);
  const HERO = 'https://github.com/MrLemonOff';
  const spec = art({ shape: 'circle', size: 0.3, padding: 0.5, ring: 0.8, ringColor: '#2F6BDC' }, { eyeFrame: 'rounded', eyeBall: 'rounded', shape: 'liquid', gradient: true, fg: '#1D4FB8', fg2: '#0B2A6B', gradientAngle: 135 });
  const { scene, spec: clean } = createQR({ text: HERO, spec, source: avatar });
  must('hero', limitByContrast(await verifyScene(scene, HERO), inkContrast(clean)));
  const canvas = createCanvas(900, 900);
  paintCanvas(scene, canvas, 900);
  fs.writeFileSync(out('docs/hero.png'), canvas.toBuffer('image/png'));
}
