import { icon } from './icons.js';
import { getPath } from './binder.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Small preview icon built from path data: paths = [{ d, opacity?, evenodd? }]. */
export function pathIcon(paths, viewBox) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  for (const { d, opacity, evenodd } of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    if (opacity) path.setAttribute('opacity', opacity);
    if (evenodd) path.setAttribute('fill-rule', 'evenodd');
    svg.appendChild(path);
  }
  return svg;
}

const pickers = [];

/**
 * A compact dropdown of visual choices. `host` must carry data-bind (the state path) and data-label.
 * items: [{ value, label, preview: () => Element }]
 */
export function buildPicker(host, items, { columns = 3 } = {}) {
  const label = document.createElement('span');
  label.className = 'field-label';
  label.textContent = host.dataset.label || '';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'picker-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const preview = document.createElement('span');
  preview.className = 'pv';
  const name = document.createElement('span');
  name.className = 'pl';
  const chevron = document.createElement('span');
  chevron.className = 'ico';
  chevron.append(icon('ChevronDown'));
  trigger.append(preview, name, chevron);

  const menu = document.createElement('div');
  menu.className = 'picker-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;
  menu.style.setProperty('--cols', String(columns));
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = item.value;
    b.setAttribute('role', 'option');
    b.title = item.label;
    b.append(item.preview());
    const t = document.createElement('span');
    t.textContent = item.label;
    b.append(t);
    menu.append(b);
  }

  host.classList.add('picker');
  host.replaceChildren(label, trigger, menu);

  const close = () => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };
  trigger.addEventListener('click', () => {
    const open = menu.hidden;
    for (const p of pickers) p.close();
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', close);

  const picker = {
    host,
    close,
    refresh(state) {
      const value = String(getPath(state, host.dataset.bind));
      const item = items.find((i) => String(i.value) === value) || items[0];
      preview.replaceChildren(item.preview());
      name.textContent = item.label;
    },
  };
  pickers.push(picker);
  return picker;
}

export const refreshPickers = (state) => pickers.forEach((p) => p.refresh(state));

document.addEventListener('click', (e) => {
  for (const p of pickers) if (!p.host.contains(e.target)) p.close();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') pickers.forEach((p) => p.close());
});
