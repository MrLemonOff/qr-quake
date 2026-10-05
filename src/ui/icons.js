import {
  createElement, QrCode, Barcode, Moon, Sun, Pencil, Image, Palette, IdCard, ChevronsUpDown, ChevronDown, Search, Wand, Download, Copy,
  Shuffle, RotateCcw, ScanLine, X, Shapes, Globe, Smile, Type, Link, Mail, Phone, MessageSquare, Contact, ContactRound, Wifi, MapPin,
  Navigation, Crosshair, CalendarDays, Bitcoin, IndianRupee, Landmark, KeyRound, Video, Send, Smartphone, Briefcase, Check,
  TriangleAlert, CircleAlert, LoaderCircle, Upload, Eraser, Info, Plus, Heart, Coffee, Store, Banknote, Wallet,
} from 'lucide';
import { siGithub } from 'simple-icons';
import { BRANDS } from '../core/signs.js';

// Only the icons the interface itself uses are imported by name, so the full icon set stays out of the main bundle.
const ICONS = {
  QrCode, Barcode, Moon, Sun, Pencil, Image, Palette, IdCard, ChevronsUpDown, ChevronDown, Search, Wand, Download, Copy, Shuffle, RotateCcw,
  ScanLine, X, Shapes, Globe, Smile, Type, Link, Mail, Phone, MessageSquare, Contact, ContactRound, Wifi, MapPin, Navigation, Crosshair,
  CalendarDays, Bitcoin, IndianRupee, Landmark, KeyRound, Video, Send, Smartphone, Briefcase, Check, TriangleAlert, CircleAlert,
  LoaderCircle, Upload, Eraser, Info, Plus, Heart, Coffee, Store, Banknote, Wallet,
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/** An <svg> element for a Simple Icons path. */
export function brandIcon(path) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', path);
  svg.appendChild(p);
  return svg;
}

/** An <svg> element for a raw Lucide icon node. */
export function iconFromNode(node) {
  const svg = createElement(node);
  svg.setAttribute('aria-hidden', 'true');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  return svg;
}

/** An <svg> element for one of the interface icons, by its PascalCase name (or the GitHub mark). */
export function icon(name) {
  if (name === 'Github') return brandIcon(siGithub.path);
  const node = ICONS[name];
  return node ? iconFromNode(node) : document.createComment(`missing icon ${name}`);
}

/** Fill every <span data-icon="Name"> under root with its icon. */
export function mountIcons(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) {
    if (el.firstChild) continue;
    el.appendChild(icon(el.dataset.icon));
  }
}

/** The icon of a content type: { lucide: 'Name' } or { brand: 'id' }. */
export function typeIcon(spec) {
  if (spec.brand) {
    const b = BRANDS.find((x) => x.id === spec.brand);
    return b ? brandIcon(b.path) : document.createComment('missing brand');
  }
  return icon(spec.lucide);
}
