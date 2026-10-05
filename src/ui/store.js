import { DEFAULT_SPEC, normalizeSpec } from '../core/defaults.js';
import { DEFAULT_BAR, normalizeBar } from '../core/barcode.js';
import { cardFromPreset, normalizeCard } from '../core/card.js';
import { defaultContent, TYPE_BY_ID } from '../core/types.js';

export const STORE_KEY = 'qr-quake:v2';

export function createState() {
  return {
    mode: 'qr',
    tab: 'content',
    content: defaultContent('text'),
    spec: structuredClone(DEFAULT_SPEC),
    bar: { ...DEFAULT_BAR },
    card: cardFromPreset('none'),
    art: { kind: 'icon', icon: 'Zap', brand: 'github', emoji: '\u{1f525}', text: 'Q', color: '#2F6BDC', badge: true, recent: [] },
  };
}

/** Restore saved style choices. Content (links, passwords) and pictures are never saved. */
export function loadSaved(state) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (saved.spec) state.spec = normalizeSpec(saved.spec);
    // Pictures are never saved, so a fill placement would have nothing to show on the next visit.
    state.spec.art.placement = 'center';
    if (saved.bar) state.bar = { ...normalizeBar(saved.bar), text: DEFAULT_BAR.text };
    if (saved.card) state.card = normalizeCard(saved.card);
    if (saved.mode === 'barcode') state.mode = 'barcode';
    if (saved.contentType && TYPE_BY_ID[saved.contentType]) state.content.type = saved.contentType;
    const a = saved.art;
    if (a) {
      if (['icon', 'brand', 'emoji', 'text', 'none'].includes(a.kind)) state.art.kind = a.kind;
      if (typeof a.icon === 'string' && /^[A-Za-z0-9]+$/.test(a.icon)) state.art.icon = a.icon;
      if (typeof a.brand === 'string' && /^[a-z0-9._-]+$/.test(a.brand)) state.art.brand = a.brand;
      if (typeof a.emoji === 'string') state.art.emoji = Array.from(a.emoji).slice(0, 4).join('');
      if (typeof a.text === 'string') state.art.text = a.text.slice(0, 8);
      if (/^#[0-9a-f]{6}$/i.test(a.color || '')) state.art.color = a.color;
      if (typeof a.badge === 'boolean') state.art.badge = a.badge;
      if (Array.isArray(a.recent)) state.art.recent = a.recent.filter((r) => r && typeof r.kind === 'string' && typeof r.value === 'string').slice(0, 8);
    }
  } catch (err) {
    /* storage unavailable or damaged: start from the defaults */
  }
}

export function persist(state) {
  try {
    const theme = document.documentElement.getAttribute('data-theme');
    const { text, ...bar } = state.bar;
    const art = { ...state.art, kind: state.art.kind === 'picture' ? 'icon' : state.art.kind };
    localStorage.setItem(STORE_KEY, JSON.stringify({ theme, mode: state.mode, contentType: state.content.type, spec: state.spec, bar, card: state.card, art }));
  } catch (err) {
    /* private mode or blocked storage: nothing to do */
  }
}
