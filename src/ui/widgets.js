// Expands the short placeholders in index.html into full controls:
//   <div data-slider="spec.scale" data-label="Dot size" data-min data-max data-step data-fmt>
//   <div data-color="spec.fg" data-label="Dots" data-clear="Follow dots" data-fallback="#ffffff">

let ids = 0;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function slider(host) {
  const id = `sl${ids++}`;
  host.classList.add('slider');
  const label = el('label');
  label.htmlFor = id;
  label.append(host.dataset.label || '');
  const out = el('output');
  out.dataset.out = host.dataset.slider;
  out.dataset.fmt = host.dataset.fmt || 'pct';
  label.append(out);
  const input = el('input', 'range');
  Object.assign(input, { id, type: 'range', min: host.dataset.min, max: host.dataset.max, step: host.dataset.step });
  input.dataset.bind = host.dataset.slider;
  host.replaceChildren(label, input);
}

function color(host) {
  host.classList.add('color-field');
  const label = el('span', '', host.dataset.label || '');
  const row = el('div', 'color-input');
  const input = el('input');
  input.type = 'color';
  input.dataset.bind = host.dataset.color;
  input.setAttribute('aria-label', host.dataset.label || 'Color');
  if (host.dataset.fallback) input.dataset.fallback = host.dataset.fallback;
  else input.dataset.fallback = '#ffffff';
  row.append(input);
  if (host.dataset.clear) {
    const clear = el('button', 'chip', host.dataset.clear);
    clear.type = 'button';
    clear.dataset.clearFor = host.dataset.color;
    row.append(clear);
  }
  host.replaceChildren(label, row);
}

export function expandWidgets(root = document) {
  for (const host of root.querySelectorAll('[data-slider]')) slider(host);
  for (const host of root.querySelectorAll('[data-color]')) color(host);
}
