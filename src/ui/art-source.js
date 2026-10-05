import { drawSign, drawTextSign, quickIcon, BRANDS } from '../core/signs.js';

const cache = new Map();

/** The lazily loaded full icon set and brand list (each is its own chunk). */
export const iconLibrary = () => import('../core/icon-library.js');
export const brandLibrary = () => import('../core/brands-data.js');

async function findIconNode(name) {
  const quick = quickIcon(name);
  if (quick) return quick.node;
  const lib = await iconLibrary();
  return lib.iconNode(name);
}

async function findBrandPath(id) {
  const quick = BRANDS.find((b) => b.id === id);
  if (quick) return quick.path;
  const lib = await brandLibrary();
  return lib.BRAND_LIST.find((b) => b.id === id)?.path || null;
}

/** Short, human name of what the art is (for the "Choose art" card). */
export async function artLabel(art) {
  if (art.kind === 'icon') return { name: art.icon.replace(/([a-z0-9])([A-Z])/g, '$1 $2'), kind: 'Icon' };
  if (art.kind === 'brand') {
    const lib = await brandLibrary().catch(() => null);
    const brand = BRANDS.find((b) => b.id === art.brand) || lib?.BRAND_LIST.find((b) => b.id === art.brand);
    return { name: brand?.name || art.brand, kind: 'Brand logo' };
  }
  if (art.kind === 'emoji') return { name: art.emoji, kind: 'Emoji' };
  if (art.kind === 'text') return { name: art.text || '(empty)', kind: 'Text' };
  if (art.kind === 'picture') return { name: 'Your picture', kind: 'Picture' };
  return { name: 'No art', kind: 'Add a logo, sign or picture' };
}

/** The canvas to put in the code for the current art choice, or null. */
export async function resolveSource(art, picture) {
  const look = { color: art.color, badge: art.badge };
  const key = JSON.stringify([art.kind, art.icon, art.brand, art.emoji, art.text, art.color, art.badge]);
  if (art.kind === 'picture') return picture;
  if (art.kind === 'none') return null;
  if (cache.has(key)) return cache.get(key);
  let canvas = null;
  if (art.kind === 'icon') {
    const node = await findIconNode(art.icon);
    if (node) canvas = await drawSign({ kind: 'icon', node }, look);
  } else if (art.kind === 'brand') {
    const path = await findBrandPath(art.brand);
    if (path) canvas = await drawSign({ kind: 'brand', path }, look);
  } else if (art.kind === 'emoji') {
    canvas = drawTextSign(art.emoji, look);
  } else if (art.kind === 'text') {
    canvas = art.text.trim() ? drawTextSign(art.text, look) : null;
  }
  if (cache.size > 30) cache.clear();
  cache.set(key, canvas);
  return canvas;
}

/** Remember a pick in the "Recent" row (newest first, at most 8). */
export function remember(state) {
  const a = state.art;
  const value = { icon: a.icon, brand: a.brand, emoji: a.emoji, text: a.text }[a.kind];
  if (!value) return;
  state.art.recent = [{ kind: a.kind, value }, ...a.recent.filter((r) => !(r.kind === a.kind && r.value === value))].slice(0, 8);
}
