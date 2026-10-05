// The full Lucide icon set. It is large, so it lives in its own chunk and is loaded only when someone
// opens the icon browser (see art dialog) or picks an icon that is not a quick pick.
import { icons } from 'lucide';

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();

// Aliases point to the same icon node: keep the first (shortest) name for each.
const seen = new Map();
for (const name of Object.keys(icons).sort((a, b) => a.length - b.length || a.localeCompare(b))) {
  if (!seen.has(icons[name])) seen.set(icons[name], name);
}

/** [{ name: 'HeartHandshake', label: 'heart-handshake', node }] sorted A to Z. */
export const ICON_LIST = [...seen.entries()].map(([node, name]) => ({ name, label: kebab(name), node })).sort((a, b) => a.label.localeCompare(b.label));
const BY_NAME = new Map();
for (const [name, node] of Object.entries(icons)) BY_NAME.set(name, node);

export const iconNode = (name) => BY_NAME.get(name) || null;

/** Icons whose name contains every word of the query. */
export function searchIcons(query) {
  const words = query.toLowerCase().split(/[\s-]+/).filter(Boolean);
  if (!words.length) return ICON_LIST;
  return ICON_LIST.filter((i) => words.every((w) => i.label.includes(w)));
}
