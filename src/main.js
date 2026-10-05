import './styles.css';
import { mountIcons, icon, typeIcon } from './ui/icons.js';
import { createBinder } from './ui/binder.js';
import { expandWidgets } from './ui/widgets.js';
import { buildPicker, refreshPickers, pathIcon } from './ui/pickers.js';
import { createState, loadSaved, persist } from './ui/store.js';
import { resolveSource, artLabel, remember } from './ui/art-source.js';
import { initTypeDialog, initArtDialog } from './ui/dialogs.js';
import { createQR, createBarcode, barcodeVerifyOptions } from './core/render.js';
import { verifyScene, limitByContrast } from './core/verify.js';
import { paintCanvas } from './core/paint-canvas.js';
import { sceneToSvg } from './core/paint-svg.js';
import { autoFix, autoFixBarcode, randomReadable } from './core/autofix.js';
import { inkContrast } from './core/colors.js';
import { looksLikeBareDomain } from './core/payloads.js';
import { typeOf, buildPayload } from './core/types.js';
import { BARCODES, BARCODE_BY_ID, DEFAULT_BAR, BarcodeError, loadBarcodeLibrary, normalizeBar } from './core/barcode.js';
import { QRTooLongError } from './core/matrix.js';
import { hasAlpha } from './core/art.js';
import { drawSample } from './core/samples.js';
import { DEFAULT_SPEC, PALETTES, SHAPES, EYE_FRAMES, EYE_BALLS } from './core/defaults.js';
import { CARD_PRESETS, cardFromPreset } from './core/card.js';
import { modulePath, eyeFramePath, eyeBallPath } from './core/shapes.js';

const $ = (id) => document.getElementById(id);
const PREVIEW_PX = 840;

/* ------------------------------------------------------------------ state */

const state = createState();
loadSaved(state);

let picture = null; // the user's uploaded picture (a canvas); never saved
let source = null; // the canvas currently used as art
let current = null; // what is on screen: { scene, expected, mode, ... }
let barLib = null;
let frame = 0;
let renderToken = 0;
let verifyTimer = 0;
let lastPreset = state.card.preset;
let binder;

/* ------------------------------------------------------------------ toast */

function toast(message, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/* ------------------------------------------------------------------ art source */

/** Signs and text get a round or free outline from the badge setting; pictures keep the user's crop. */
function applyArtShape() {
  if (['icon', 'brand', 'emoji', 'text'].includes(state.art.kind)) state.spec.art.shape = state.art.badge ? 'circle' : 'free';
}

let sourceToken = 0;
async function updateSource() {
  const mine = ++sourceToken;
  let next = null;
  try {
    next = await resolveSource(state.art, picture);
  } catch (err) {
    toast('Could not draw that art.', 'error');
  }
  if (mine !== sourceToken) return;
  source = next;
  updateArtCard();
  schedule();
}

async function updateArtCard() {
  const thumb = $('artThumb');
  const ctx = thumb.getContext('2d');
  ctx.clearRect(0, 0, thumb.width, thumb.height);
  if (source) {
    const s = Math.min(thumb.width / source.width, thumb.height / source.height);
    ctx.drawImage(source, (thumb.width - source.width * s) / 2, (thumb.height - source.height * s) / 2, source.width * s, source.height * s);
  }
  const label = await artLabel(state.art);
  $('artName').textContent = label.name;
  $('artKind').textContent = label.kind;
}

function renderRecent() {
  const row = $('artRecent');
  row.replaceChildren();
  $('artRecentWrap').hidden = !state.art.recent.length;
  for (const r of state.art.recent) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'recent-chip';
    b.title = r.value;
    if (r.kind === 'emoji' || r.kind === 'text') b.textContent = r.value;
    else {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      b.append(c);
      resolveSource({ ...state.art, kind: r.kind, icon: r.value, brand: r.value }, null).then((cv) => cv && c.getContext('2d').drawImage(cv, 0, 0, 64, 64));
    }
    b.addEventListener('click', () => pickArt({ kind: r.kind, [r.kind]: r.value }));
    row.append(b);
  }
}

function pickArt(pick) {
  Object.assign(state.art, pick);
  applyArtShape();
  if (state.spec.art.placement !== 'center' && !['picture', 'none'].includes(state.art.kind)) state.spec.art.placement = 'center';
  remember(state);
  renderRecent();
  binder.sync();
  refreshPickers(state);
  persist(state);
  updateSource();
}

async function loadPictureFile(file) {
  if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file.', 'error');
  if (file.size > 30 * 1024 * 1024) return toast('That picture is too large (30 MB maximum).', 'error');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w = img.naturalWidth || 512;
    const h = img.naturalHeight || 512;
    const scale = Math.min(1, 1600 / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    setPicture(canvas);
  } catch (err) {
    toast('That picture could not be opened.', 'error');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function setPicture(canvas) {
  picture = canvas;
  state.art.kind = 'picture';
  const alpha = hasAlpha(canvas);
  state.spec.art.shape = alpha ? 'free' : 'circle';
  Object.assign(state.spec.art, { zoom: 1, offsetX: 0, offsetY: 0, brightness: 0, contrast: 0, saturation: 0 });
  // A photo is meant to color the code; a logo with transparency is meant for the middle.
  if (!alpha && state.spec.art.placement === 'center') state.spec.art.placement = 'fill';
  artDialog.close();
  state.mode = 'qr';
  state.tab = 'art';
  binder.sync();
  persist(state);
  updateSource().then(() => autoTune());
}

/* ------------------------------------------------------------------ content forms */

function fieldNode(type, f) {
  const path = `content.values.${type.id}.${f.key}`;
  if (f.type === 'switch') {
    const row = document.createElement('div');
    row.className = 'row-switch span2';
    const label = document.createElement('span');
    label.textContent = f.label;
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'switch';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-label', f.label);
    sw.dataset.bind = path;
    row.append(label, sw);
    return row;
  }
  const wide = f.type === 'textarea' || f.type === 'datetime' || type.fields.length === 1 || f.key === 'title';
  const wrap = document.createElement('label');
  wrap.className = 'field' + (wide ? ' span2' : '');
  const caption = document.createElement('span');
  caption.textContent = f.label;
  let input;
  if (f.type === 'select') {
    input = document.createElement('select');
    input.className = 'select';
    for (const [value, label] of f.options) input.add(new Option(label, value));
  } else if (f.type === 'textarea') {
    input = document.createElement('textarea');
    input.className = 'textarea';
    input.rows = f.rows || 3;
  } else {
    input = document.createElement('input');
    input.className = 'input';
    input.type = f.type === 'datetime' ? 'datetime-local' : f.inputType === 'number' ? 'text' : f.inputType || 'text';
    if (f.inputType === 'number') input.inputMode = 'decimal';
    input.autocomplete = 'off';
  }
  if (f.placeholder) input.placeholder = f.placeholder;
  if (f.type !== 'select') input.spellcheck = false;
  input.dataset.bind = path;
  wrap.append(caption, input);
  return wrap;
}

function renderTypeUI() {
  const type = typeOf(state.content.type);
  $('typeIcon').replaceChildren(typeIcon(type.icon));
  $('typeName').textContent = type.label;
  $('typeDesc').textContent = type.desc;
  $('typeForm').replaceChildren(...type.fields.map((f) => fieldNode(type, f)));
  binder.sync();
}

/* ------------------------------------------------------------------ barcode UI */

function renderBarFormats() {
  const select = $('barFormat');
  for (const [label, kind] of [['Linear barcodes', '1d'], ['Square and stacked codes', '2d']]) {
    const group = document.createElement('optgroup');
    group.label = label;
    for (const b of BARCODES.filter((x) => x.kind === kind)) group.append(new Option(b.label, b.id));
    select.append(group);
  }
}

function updateBarUI() {
  const def = BARCODE_BY_ID[state.bar.format];
  $('barDesc').textContent = def.desc;
  $('barText').placeholder = def.example;
  $('barNote').textContent = current?.mode === 'barcode' && current.expected !== state.bar.text.trim() ? `Scanners will read: ${current.expected}` : '';
}

/* ------------------------------------------------------------------ rendering */

const STATUS = {
  idle: ['ScanLine', 'Waiting for content', 'Fill in the details to see your code.'],
  checking: ['LoaderCircle', 'Checking', 'Running the scan test.'],
  good: ['Check', 'Scans reliably', 'Read correctly by every test decoder.'],
  fragile: ['TriangleAlert', 'Scans, but fragile', 'Make the art softer, the dots bigger, or press Auto-fix.'],
  fail: ['CircleAlert', 'May not scan', 'The test decoders could not read it. Press Auto-fix.'],
  untested: ['Info', 'Cannot be tested here', 'This type cannot be read by the test decoders. Try it with a scanner.'],
  error: ['CircleAlert', 'Cannot build this code', ''],
};

function setStatus(kind, detail) {
  const [ico, title, text] = STATUS[kind];
  $('status').dataset.state = kind;
  $('statusIcon').replaceChildren(icon(ico));
  $('statusTitle').textContent = title;
  $('statusDetail').textContent = detail ?? text;
  $('fixBtn').hidden = !(kind === 'fragile' || kind === 'fail');
  $('stage').classList.toggle('busy', kind === 'checking');
}

function setExportEnabled(on) {
  for (const id of ['dlBtn', 'copyBtn']) $(id).disabled = !on;
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    render();
  });
}

const activeCard = () => (state.card.preset !== 'none' ? state.card : null);

function showEmpty(message) {
  current = null;
  $('empty').hidden = false;
  $('emptyText').textContent = message;
  $('canvas').style.visibility = 'hidden';
  $('meta').textContent = '';
  setExportEnabled(false);
}

function updateHint() {
  const hint = $('typeHint');
  const text = state.content.type === 'text' ? state.content.values.text.text : '';
  const show = state.mode === 'qr' && looksLikeBareDomain(text);
  hint.hidden = !show;
  if (show) {
    hint.className = 'hint warn';
    hint.textContent = 'Tip: choose "Website link" or start with https:// so phones open it as a link instead of plain text.';
  }
}

async function render() {
  const mine = ++renderToken;
  clearTimeout(verifyTimer);
  updateHint();
  let next;
  try {
    if (state.mode === 'qr') {
      const text = buildPayload(state.content);
      if (!text) {
        showEmpty('Fill in the details to start.');
        setStatus('idle');
        return;
      }
      const qr = createQR({ text, spec: state.spec, source, card: activeCard() });
      next = { mode: 'qr', scene: qr.scene, expected: text, spec: qr.spec, ratio: inkContrast(qr.spec), options: undefined };
    } else {
      if (!state.bar.text.trim()) {
        showEmpty('Type some text to start.');
        setStatus('idle');
        return;
      }
      if (!barLib) {
        setStatus('checking', 'Loading the barcode engine.');
        barLib = await loadBarcodeLibrary();
        if (mine !== renderToken) return;
      }
      const code = createBarcode({ lib: barLib, bar: state.bar, card: activeCard() });
      next = { mode: 'barcode', scene: code.scene, expected: code.enc.expected, spec: code.spec, enc: code.enc, ratio: inkContrast(code.spec), options: barcodeVerifyOptions(code.enc) };
    }
  } catch (err) {
    if (mine !== renderToken) return;
    showEmpty('Nothing to show yet.');
    if (err instanceof QRTooLongError) setStatus('error', 'That is too much data for one QR code. Shorten it a little.');
    else if (err instanceof BarcodeError) setStatus('error', err.message);
    else {
      console.error(err);
      setStatus('error', 'Something went wrong while drawing. Try a different picture.');
    }
    return;
  }
  if (mine !== renderToken) return;
  current = next;
  $('empty').hidden = true;
  const canvas = $('canvas');
  canvas.style.visibility = 'visible';
  paintCanvas(next.scene, canvas, PREVIEW_PX);
  describe(next);
  updateBarUI();
  setExportEnabled(true);
  setStatus('checking');
  verifyTimer = setTimeout(() => runCheck(next), 180);
}

function describe(c) {
  const parts = [];
  if (c.mode === 'qr') {
    const i = c.scene.info;
    parts.push(`Version ${i.version}`, `${i.n} x ${i.n} modules`, `Error correction ${i.ec}`);
    if (i.ec !== i.requestedEc) parts[2] += ` (lowered from ${i.requestedEc}: long data)`;
    if (i.placement === 'center') parts.push(`sign covers ${Math.round(i.clearedRatio * 100)}%`);
  } else {
    parts.push(BARCODE_BY_ID[c.spec.format].label, c.enc.kind === '1d' ? `${c.enc.modules} modules wide` : `${c.enc.cols} x ${c.enc.rows} modules`);
  }
  const card = activeCard();
  if (card) parts.push(`${CARD_PRESETS.find((p) => p.id === card.preset)?.name || 'Card'} card`);
  const limited = c.mode === 'qr' && c.scene.info.logoLimited;
  $('meta').textContent = parts.join(' · ') + (limited ? '. Sign size was limited so the code stays readable.' : '.');
}

async function runCheck(snapshot) {
  if (snapshot !== current) return;
  if (snapshot.mode === 'barcode' && !snapshot.options) return setStatus('untested');
  let result;
  try {
    result = limitByContrast(await verifyScene(snapshot.scene, snapshot.expected, snapshot.options), snapshot.ratio);
  } catch (err) {
    console.error(err);
    return setStatus('untested', 'The scan test could not run in this browser.');
  }
  if (snapshot !== current) return;
  const what = snapshot.mode === 'barcode' ? 'bars' : 'dots';
  setStatus(result.status, result.reason === 'contrast' ? `The ${what} need more contrast with the background.` : undefined);
}

/* ------------------------------------------------------------------ export */

const FORMATS = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

async function exportBlob(format, px) {
  if (format === 'svg') return new Blob([sceneToSvg(current.scene, { px, title: 'Code made with QR Quake' })], { type: 'image/svg+xml' });
  const c = document.createElement('canvas');
  paintCanvas(current.scene, c, px, { underlay: format === 'png' ? undefined : '#ffffff' });
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), FORMATS[format], 0.95));
}

function save(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

$('dlBtn').addEventListener('click', async () => {
  if (!current) return;
  const format = $('formatSelect').value;
  try {
    save(await exportBlob(format, Number($('sizeSelect').value)), `${current.mode === 'barcode' ? 'barcode' : 'qr-quake'}.${format}`);
    const s = $('status').dataset.state;
    toast(s === 'fail' || s === 'fragile' ? `${format.toUpperCase()} saved. This one may not scan, so test it first.` : `${format.toUpperCase()} saved.`);
  } catch (err) {
    toast('That size is too large for this device. Pick a smaller one.', 'error');
  }
});
$('formatSelect').addEventListener('change', () => {
  $('dlLabel').textContent = `Download ${$('formatSelect').value.toUpperCase()}`;
});
$('copyBtn').addEventListener('click', async () => {
  if (!current) return;
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': exportBlob('png', 1024) })]);
    toast('Copied. Paste it into a document or chat.');
  } catch (err) {
    toast('Your browser blocked copying. Use Download instead.', 'error');
  }
});

/* ------------------------------------------------------------------ actions */

function applyFixed(result) {
  if (state.mode === 'qr') state.spec = result.spec;
  else state.bar = { ...result.bar, text: state.bar.text };
  if (result.card) state.card = result.card;
  binder.sync();
  refreshPickers(state);
  persist(state);
  render();
}

async function runFix() {
  if (state.mode === 'qr') return autoFix({ text: buildPayload(state.content), spec: state.spec, source, card: activeCard() });
  return autoFixBarcode({ lib: barLib, bar: state.bar, card: activeCard() });
}

$('fixBtn').addEventListener('click', () => {
  if (!current) return;
  setStatus('checking', 'Trying fixes.');
  setTimeout(async () => {
    const result = await runFix();
    applyFixed(result);
    if (result.changes.length) toast(result.fixed ? `Fixed: ${result.changes.join(', ').toLowerCase()}.` : `Improved it: ${result.changes.join(', ').toLowerCase()}. It may still be hard to scan.`);
  }, 20);
});

/** After a picture or art mode change, quietly repair the code if it would not scan. */
let tuneToken = 0;
async function autoTune() {
  if (state.mode !== 'qr' || !source || state.spec.art.placement === 'center') return;
  const mine = ++tuneToken;
  await new Promise((r) => setTimeout(r, 250));
  if (mine !== tuneToken || !buildPayload(state.content)) return;
  const result = await runFix();
  if (mine !== tuneToken || !result.changes.length) return;
  applyFixed(result);
  toast(`Tuned for scanning: ${result.changes.join(', ').toLowerCase()}.`);
}

$('surpriseBtn').addEventListener('click', async () => {
  if (state.mode === 'qr') {
    const text = buildPayload(state.content);
    if (!text) return;
    state.spec = (await randomReadable({ text, spec: state.spec, source, card: activeCard() })).spec;
  } else {
    const p = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    Object.assign(state.bar, { fg: p.fg, fg2: p.fg2, bg: p.bg, gradient: Math.random() < 0.5, gradientAngle: Math.round(Math.random() * 4) * 45, round: Math.random() < 0.4 ? 0.5 : 0, transparent: false });
  }
  binder.sync();
  refreshPickers(state);
  persist(state);
  render();
});

$('resetBtn').addEventListener('click', () => {
  if (state.mode === 'qr') {
    const placement = state.spec.art.placement;
    state.spec = structuredClone(DEFAULT_SPEC);
    state.spec.art.placement = placement;
    applyArtShape();
    if (state.art.kind === 'picture' && picture) state.spec.art.shape = hasAlpha(picture) ? 'free' : 'circle';
  } else {
    state.bar = { ...DEFAULT_BAR, format: state.bar.format, text: state.bar.text, quiet: normalizeBar({ format: state.bar.format }).quiet };
  }
  state.card = cardFromPreset('none');
  lastPreset = 'none';
  binder.sync();
  refreshPickers(state);
  persist(state);
  render();
});

$('barExample').addEventListener('click', () => {
  state.bar.text = BARCODE_BY_ID[state.bar.format].example;
  binder.sync();
  schedule();
});

/* ------------------------------------------------------------------ theme */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#000000' : '#FAF9F5');
  $('themeToggle').replaceChildren(icon(theme === 'dark' ? 'Sun' : 'Moon'));
}
$('themeToggle').addEventListener('click', () => {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  persist(state);
});

/* ------------------------------------------------------------------ built UI parts */

const NAMES = { square: 'Square', dot: 'Dots', liquid: 'Liquid', diamond: 'Diamond', bars: 'Bars', tiles: 'Tiles', rounded: 'Rounded', circle: 'Circle', leaf: 'Leaf', diamondBall: 'Diamond' };
const PATTERN = ['1101', '1011', '0110', '1101'];

function shapePreview(shape) {
  const dark = (r, c) => PATTERN[r]?.[c] === '1';
  let d = '';
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (dark(r, c)) d += modulePath(shape, c, r, { u: dark(r - 1, c), d: dark(r + 1, c), l: dark(r, c - 1), r: dark(r, c + 1) });
    }
  }
  return pathIcon([{ d }], '-0.1 -0.1 4.2 4.2');
}

function buildPickers() {
  buildPicker($('shapePicker'), SHAPES.map((s) => ({ value: s, label: NAMES[s], preview: () => shapePreview(s) })), { columns: 3 });
  buildPicker($('framePicker'), EYE_FRAMES.map((s) => ({ value: s, label: NAMES[s], preview: () => pathIcon([{ d: eyeFramePath(s, 0, 0), evenodd: true }, { d: eyeBallPath('square', 2, 2), opacity: '.45' }], '-0.3 -0.3 7.6 7.6') })), { columns: 2 });
  buildPicker($('ballPicker'), EYE_BALLS.map((s) => ({ value: s, label: NAMES[s] || 'Diamond', preview: () => pathIcon([{ d: eyeFramePath('square', 0, 0), evenodd: true, opacity: '.3' }, { d: eyeBallPath(s, 2, 2) }], '-0.3 -0.3 7.6 7.6') })), { columns: 2 });
}

function buildPalettes() {
  for (const [id, target] of [['palette', 'spec'], ['barPalette', 'bar']]) {
    for (const p of PALETTES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.title = p.name;
      b.setAttribute('aria-label', `${p.name} colors`);
      b.dataset.palette = p.name;
      b.style.background = `linear-gradient(135deg, ${p.fg}, ${p.fg2})`;
      b.style.setProperty('--swatch-bg', p.bg);
      b.addEventListener('click', () => {
        Object.assign(state[target], { fg: p.fg, fg2: p.fg2, bg: p.bg, transparent: false });
        binder.sync();
        markPalette();
        persist(state);
        schedule();
      });
      $(id).appendChild(b);
    }
  }
}

function markPalette() {
  for (const [id, s] of [['palette', state.spec], ['barPalette', state.bar]]) {
    for (const b of $(id).children) {
      const p = PALETTES.find((x) => x.name === b.dataset.palette);
      b.classList.toggle('on', p.fg.toLowerCase() === s.fg.toLowerCase() && p.fg2.toLowerCase() === s.fg2.toLowerCase() && p.bg.toLowerCase() === s.bg.toLowerCase());
    }
  }
}

/** Card thumbnails, drawn by the engine itself with a tiny placeholder code. */
function buildCardGrid() {
  const grid = $('cardGrid');
  const plain = { ...DEFAULT_SPEC, shape: 'square', eyeFrame: 'square', eyeBall: 'square' };
  for (const preset of CARD_PRESETS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = preset.id;
    b.setAttribute('role', 'option');
    const canvas = document.createElement('canvas');
    try {
      const { scene } = createQR({ text: 'QR', spec: plain, card: preset.id === 'none' ? null : cardFromPreset(preset.id) });
      paintCanvas(scene, canvas, 180);
    } catch (err) {
      /* a thumbnail is optional */
    }
    const label = document.createElement('span');
    label.textContent = preset.name;
    b.append(canvas, label);
    grid.append(b);
  }
}

/* ------------------------------------------------------------------ dialogs and inputs */

const typeDialog = initTypeDialog({
  state,
  onPick: () => {
    renderTypeUI();
    persist(state);
    schedule();
  },
});

const artDialog = initArtDialog({
  state,
  onPick: (pick) => {
    artDialog.close();
    pickArt(pick);
  },
  onPictureFile: loadPictureFile,
  onSample: (id) => setPicture(drawSample(id, 960)),
});

$('typeBtn').addEventListener('click', () => typeDialog.open());
$('artChoose').addEventListener('click', () => artDialog.open());
window.addEventListener('paste', (e) => {
  const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
  if (!item) return;
  e.preventDefault();
  loadPictureFile(item.getAsFile());
});

/* ------------------------------------------------------------------ binder and boot */

function onChange(path) {
  if (path === 'mode') {
    if (state.mode === 'barcode' && state.tab === 'art') state.tab = 'content';
    updateBarUI();
  } else if (path === 'content.type') {
    renderTypeUI();
  } else if (path === 'card.preset') {
    const next = cardFromPreset(state.card.preset);
    const prev = cardFromPreset(lastPreset);
    for (const k of ['title', 'subtitle', 'footer']) if (state.card[k] !== prev[k] && state.card[k]) next[k] = state.card[k];
    state.card = next;
    lastPreset = next.preset;
  } else if (path === 'bar.format') {
    const def = BARCODE_BY_ID[state.bar.format];
    state.bar = normalizeBar({ ...state.bar, text: def.example, quiet: def.kind === '2d' ? 3 : 10 });
    updateBarUI();
  } else if (path === 'art.badge' || path === 'art.color' || path === 'art.text') {
    if (path === 'art.badge') applyArtShape();
    updateSource();
  } else if (path === 'spec.art.placement' || path === 'spec.art.style') {
    autoTune();
  }
  refreshPickers(state);
  markPalette();
  persist(state);
  schedule();
}

binder = createBinder(document, state, {
  onChange,
  display: {
    'spec.eyeColor': (s) => s.spec.eyeColor || s.spec.fg,
    'spec.eyeBallColor': (s) => s.spec.eyeBallColor || s.spec.eyeColor || s.spec.fg,
    'spec.art.plate': (s) => s.spec.art.plate || '#FFFFFF',
    'bar.textColor': (s) => s.bar.textColor || s.bar.fg,
    'card.ornamentColor': (s) => s.card.ornamentColor || s.card.borderColor,
  },
});

expandWidgets();
renderBarFormats();
buildPickers();
buildPalettes();
buildCardGrid();
mountIcons();
renderTypeUI();
renderRecent();
applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
applyArtShape();
binder.sync();
refreshPickers(state);
markPalette();
updateBarUI();
setExportEnabled(false);
updateSource();
schedule();

// Handy for demos and tests.
window.qrQuake = { state, setPicture, render: schedule, sync: () => binder.sync() };
