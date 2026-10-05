import { TYPES, GROUPS } from '../core/types.js';
import { SIGNS, BRANDS } from '../core/signs.js';
import { SAMPLES, drawSample } from '../core/samples.js';
import { EMOJI_GROUPS } from '../core/emoji-data.js';
import { typeIcon, iconFromNode, brandIcon, icon } from './icons.js';
import { iconLibrary, brandLibrary } from './art-source.js';

const $ = (id) => document.getElementById(id);

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/* ---------------------------------------------------------------- content type dialog */

export function initTypeDialog({ state, onPick }) {
  const dialog = $('typeDialog');
  const list = $('typeList');
  const search = $('typeSearch');
  const tiles = [];

  for (const group of GROUPS) {
    const section = make('section', 'type-group');
    section.dataset.group = group.id;
    section.append(make('h3', '', group.label));
    const grid = make('div', 'type-grid');
    for (const type of TYPES.filter((t) => t.group === group.id)) {
      const tile = make('button', 'type-tile');
      tile.type = 'button';
      tile.dataset.type = type.id;
      tile.dataset.search = `${type.label} ${type.desc} ${group.label} ${type.id}`.toLowerCase();
      const ico = make('span', 'type-tile-ico');
      ico.append(typeIcon(type.icon));
      const text = make('span', 'type-tile-text');
      text.append(make('strong', '', type.label), make('small', '', type.desc));
      tile.append(ico, text);
      grid.append(tile);
      tiles.push(tile);
    }
    section.append(grid);
    list.append(section);
  }
  list.append(make('p', 'empty-note', 'Nothing matches. Try another word.'));
  list.lastChild.hidden = true;

  const filter = () => {
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    let any = false;
    for (const tile of tiles) {
      const show = words.every((w) => tile.dataset.search.includes(w));
      tile.hidden = !show;
      any ||= show;
    }
    for (const section of list.querySelectorAll('.type-group')) section.hidden = ![...section.querySelectorAll('.type-tile')].some((t) => !t.hidden);
    list.lastChild.hidden = any;
  };
  search.addEventListener('input', filter);

  list.addEventListener('click', (e) => {
    const tile = e.target.closest('.type-tile');
    if (!tile) return;
    state.content.type = tile.dataset.type;
    dialog.close();
    onPick();
  });

  return {
    open() {
      for (const tile of tiles) tile.classList.toggle('on', tile.dataset.type === state.content.type);
      search.value = '';
      filter();
      dialog.showModal();
      search.focus();
    },
  };
}

/* ---------------------------------------------------------------- art dialog */

const PAGE = 240;

export function initArtDialog({ state, onPick, onPictureFile, onSample }) {
  const dialog = $('artDialog');
  const body = $('artBody');
  const search = $('artSearch');
  const searchWrap = $('artSearchWrap');
  const tabs = $('artTabs');
  let tab = 'icon';
  let iconShown = PAGE;
  let emojiGroup = EMOJI_GROUPS[0].id;
  let token = 0;

  const setTab = (next) => {
    tab = next;
    for (const b of tabs.querySelectorAll('button')) {
      const on = b.dataset.value === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    searchWrap.hidden = !['icon', 'brand'].includes(tab);
    search.placeholder = tab === 'brand' ? 'Search brands: instagram, spotify, github...' : 'Search icons: heart, coffee, rocket...';
    search.value = '';
    iconShown = PAGE;
    render();
  };
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-value]');
    if (b) setTab(b.dataset.value);
  });
  search.addEventListener('input', () => {
    iconShown = PAGE;
    render();
  });

  const tile = (content, title, pick, selected) => {
    const b = make('button', 'art-tile' + (selected ? ' on' : ''));
    b.type = 'button';
    b.title = title;
    b.setAttribute('aria-label', title);
    b.append(content);
    b.addEventListener('click', pick);
    return b;
  };
  const grid = (className = '') => make('div', `art-grid ${className}`);
  const heading = (text) => make('h3', 'art-heading', text);

  async function renderIcons() {
    const mine = ++token;
    const q = search.value.trim();
    body.replaceChildren();
    const useIcon = (name) => () => onPick({ kind: 'icon', icon: name });
    if (!q) {
      body.append(heading('Popular'));
      const g = grid();
      for (const s of SIGNS) g.append(tile(iconFromNode(s.node), s.name, useIcon(s.lucide), state.art.kind === 'icon' && state.art.icon === s.lucide));
      body.append(g);
    }
    const more = make('div', 'art-more', 'Loading all icons...');
    body.append(more);
    const lib = await iconLibrary();
    if (mine !== token) return;
    const results = lib.searchIcons(q);
    more.remove();
    body.append(heading(q ? `${results.length} found` : `All ${results.length} icons`));
    const g = grid();
    for (const i of results.slice(0, iconShown)) g.append(tile(iconFromNode(i.node), i.label, useIcon(i.name), state.art.kind === 'icon' && state.art.icon === i.name));
    body.append(g);
    if (results.length > iconShown) {
      const btn = make('button', 'btn soft small', `Show more (${results.length - iconShown} left)`);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        iconShown += PAGE;
        renderIcons();
      });
      body.append(btn);
    }
    if (!results.length) body.append(make('p', 'empty-note', 'Nothing matches. Try another word.'));
  }

  async function renderBrands() {
    const mine = ++token;
    body.replaceChildren(make('div', 'art-more', 'Loading brands...'));
    const lib = await brandLibrary();
    if (mine !== token) return;
    const q = search.value.trim().toLowerCase();
    const results = lib.BRAND_LIST.filter((b) => !q || b.name.toLowerCase().includes(q) || b.id.includes(q));
    body.replaceChildren(heading(`${results.length} brand logos`));
    const g = grid();
    for (const b of results) g.append(tile(brandIcon(b.path), b.name, () => onPick({ kind: 'brand', brand: b.id }), state.art.kind === 'brand' && state.art.brand === b.id));
    body.append(g, make('p', 'hint', 'Brand logos belong to their owners. Use them to link to your own page.'));
    if (!results.length) body.append(make('p', 'empty-note', 'Nothing matches. Try another word.'));
  }

  function renderEmoji() {
    body.replaceChildren();
    const chips = make('div', 'chip-row');
    for (const group of EMOJI_GROUPS) {
      const c = make('button', 'chip' + (group.id === emojiGroup ? ' on' : ''), group.label);
      c.type = 'button';
      c.addEventListener('click', () => {
        emojiGroup = group.id;
        renderEmoji();
      });
      chips.append(c);
    }
    const group = EMOJI_GROUPS.find((g) => g.id === emojiGroup);
    const g = grid('emoji');
    for (const e of group.items) g.append(tile(make('span', 'emoji-char', e), e, () => onPick({ kind: 'emoji', emoji: e }), state.art.kind === 'emoji' && state.art.emoji === e));
    body.append(chips, g);
  }

  function renderText() {
    body.replaceChildren();
    const field = make('label', 'field');
    field.append(make('span', '', 'Letters, digits or an emoji (up to 8)'));
    const input = make('input', 'input');
    input.maxLength = 8;
    input.placeholder = 'Q';
    input.value = state.art.kind === 'text' ? state.art.text : '';
    field.append(input);
    const use = make('button', 'btn primary', 'Use this text');
    use.type = 'button';
    use.addEventListener('click', () => input.value.trim() && onPick({ kind: 'text', text: input.value.trim() }));
    input.addEventListener('keydown', (e) => e.key === 'Enter' && use.click());
    body.append(field, use, heading('Or pick a symbol'));
    const g = grid('emoji');
    for (const s of EMOJI_GROUPS.find((x) => x.id === 'symbols').items) g.append(tile(make('span', 'emoji-char', s), s, () => onPick({ kind: 'text', text: s })));
    body.append(g);
  }

  function renderPicture() {
    body.replaceChildren();
    const drop = make('label', 'drop');
    drop.tabIndex = 0;
    drop.append(icon('Upload'), make('strong', '', 'Drop a picture, click to choose, or paste'), make('small', '', 'PNG, JPG, SVG or WebP. It never leaves your device.'));
    drop.firstChild.classList.add('ico', 'big');
    const input = make('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.hidden = true;
    drop.append(input);
    input.addEventListener('change', () => input.files[0] && onPictureFile(input.files[0]));
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('over');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('over');
      onPictureFile(e.dataTransfer.files[0]);
    });
    drop.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });
    body.append(drop, heading('Or try an example'));
    const row = make('div', 'sample-row');
    for (const s of SAMPLES) {
      const b = make('button', 'sample');
      b.type = 'button';
      b.append(drawSample(s.id, 144), make('span', '', s.name));
      b.addEventListener('click', () => onSample(s.id));
      row.append(b);
    }
    body.append(row);
  }

  function render() {
    if (tab === 'icon') renderIcons();
    else if (tab === 'brand') renderBrands();
    else if (tab === 'emoji') renderEmoji();
    else if (tab === 'text') renderText();
    else renderPicture();
  }

  return {
    open(startTab) {
      setTab(startTab || (['icon', 'brand', 'emoji', 'text', 'picture'].includes(state.art.kind) ? state.art.kind : 'icon'));
      dialog.showModal();
    },
    close: () => dialog.close(),
  };
}
