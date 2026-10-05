import {
  Zap, Heart, Star, Smile, Music, Coffee, House, ShoppingCart, Camera, Phone, Mail, Wifi, MapPin, Leaf,
  PawPrint, Flame, Crown, Gem, Gift, Cloud, Sun, Moon, Key, Rocket, Ghost, Sparkles, Globe, Lock, Pizza, Plane,
} from 'lucide';
import {
  siGithub, siInstagram, siYoutube, siX, siFacebook, siTiktok, siWhatsapp, siTelegram, siDiscord, siSpotify,
  siTwitch, siReddit, siPaypal, siSnapchat, siPinterest, siSignal, siBluesky, siThreads,
} from 'simple-icons';
import { getEnv } from './env.js';
import { sanitizeColor } from './colors.js';

const icon = (id, name, node, lucide) => ({ id, name, kind: 'icon', node, lucide });
const brand = (id, name, si) => ({ id, name, kind: 'brand', path: si.path });

/** Built-in signs: Lucide icons (ISC) and brand marks from Simple Icons (CC0). */
export const SIGNS = [
  icon('zap', 'Bolt', Zap, 'Zap'),
  icon('heart', 'Heart', Heart, 'Heart'),
  icon('star', 'Star', Star, 'Star'),
  icon('smile', 'Smile', Smile, 'Smile'),
  icon('music', 'Music', Music, 'Music'),
  icon('coffee', 'Coffee', Coffee, 'Coffee'),
  icon('house', 'Home', House, 'House'),
  icon('cart', 'Shop', ShoppingCart, 'ShoppingCart'),
  icon('camera', 'Camera', Camera, 'Camera'),
  icon('phone', 'Phone', Phone, 'Phone'),
  icon('mail', 'Mail', Mail, 'Mail'),
  icon('wifi', 'Wi-Fi', Wifi, 'Wifi'),
  icon('pin', 'Place', MapPin, 'MapPin'),
  icon('leaf', 'Leaf', Leaf, 'Leaf'),
  icon('paw', 'Paw', PawPrint, 'PawPrint'),
  icon('flame', 'Flame', Flame, 'Flame'),
  icon('crown', 'Crown', Crown, 'Crown'),
  icon('gem', 'Gem', Gem, 'Gem'),
  icon('gift', 'Gift', Gift, 'Gift'),
  icon('cloud', 'Cloud', Cloud, 'Cloud'),
  icon('sun', 'Sun', Sun, 'Sun'),
  icon('moon', 'Moon', Moon, 'Moon'),
  icon('key', 'Key', Key, 'Key'),
  icon('rocket', 'Rocket', Rocket, 'Rocket'),
  icon('ghost', 'Ghost', Ghost, 'Ghost'),
  icon('sparkles', 'Sparkles', Sparkles, 'Sparkles'),
  icon('globe', 'Globe', Globe, 'Globe'),
  icon('lock', 'Lock', Lock, 'Lock'),
  icon('pizza', 'Pizza', Pizza, 'Pizza'),
  icon('plane', 'Plane', Plane, 'Plane'),
];

/** Brand logos. The marks belong to their owners; see THIRD-PARTY-NOTICES.md. */
export const BRANDS = [
  brand('github', 'GitHub', siGithub),
  brand('instagram', 'Instagram', siInstagram),
  brand('youtube', 'YouTube', siYoutube),
  brand('x', 'X', siX),
  brand('facebook', 'Facebook', siFacebook),
  brand('tiktok', 'TikTok', siTiktok),
  brand('whatsapp', 'WhatsApp', siWhatsapp),
  brand('telegram', 'Telegram', siTelegram),
  brand('discord', 'Discord', siDiscord),
  brand('spotify', 'Spotify', siSpotify),
  brand('twitch', 'Twitch', siTwitch),
  brand('reddit', 'Reddit', siReddit),
  brand('paypal', 'PayPal', siPaypal),
  brand('snapchat', 'Snapchat', siSnapchat),
  brand('pinterest', 'Pinterest', siPinterest),
  brand('signal', 'Signal', siSignal),
  brand('bluesky', 'Bluesky', siBluesky),
  brand('threads', 'Threads', siThreads),
];

export const ALL_SIGNS = [...SIGNS, ...BRANDS];

/** Lucide icon (by its PascalCase name) among the built-in quick picks, if it is one. */
export const quickIcon = (lucideName) => SIGNS.find((s) => s.lucide === lucideName) || null;

export function findSign(id) {
  return ALL_SIGNS.find((s) => s.id === id) || SIGNS[0];
}

const attrs = (obj) =>
  Object.entries(obj)
    .filter(([k]) => k !== 'key')
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
    .join(' ');

/** Inner markup of a Lucide icon node. */
export function iconMarkup(node) {
  return node.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
}

/**
 * SVG for a sign on a 100 x 100 canvas.
 * badge = true puts the sign (in white) on a filled circle of the chosen color.
 */
export function signSvg(sign, { color = '#2F6BDC', badge = true } = {}) {
  const c = sanitizeColor(color, '#2F6BDC');
  const plate = badge ? `<circle cx="50" cy="50" r="50" fill="${c}"/>` : '';
  const ink = badge ? '#ffffff' : c;
  const scale = badge ? 2.3 : 3.7;
  const offset = (100 - 24 * scale) / 2;
  const place = `transform="translate(${offset} ${offset}) scale(${scale})"`;
  let body;
  if (sign.kind === 'brand') {
    body = `<g ${place}><path d="${sign.path}" fill="${ink}"/></g>`;
  } else {
    body = `<g ${place} fill="none" stroke="${ink}" stroke-width="${badge ? 2.2 : 2.4}" stroke-linecap="round" stroke-linejoin="round">${iconMarkup(sign.node)}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">${plate}${body}</svg>`;
}

/** Draw a sign onto a transparent square canvas. */
export async function drawSign(sign, options = {}, size = 512) {
  const env = getEnv();
  const image = await env.loadSvg(signSvg(sign, options));
  const canvas = env.createCanvas(size, size);
  canvas.getContext('2d').drawImage(image, 0, 0, size, size);
  return canvas;
}

/** Draw 1 to 4 characters (letters, digits or emoji) as a sign. */
export function drawTextSign(text, { color = '#2F6BDC', badge = true } = {}, size = 512) {
  const env = getEnv();
  const canvas = env.createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const c = sanitizeColor(color, '#2F6BDC');
  const chars = Array.from(String(text).trim()).slice(0, 4).join('');
  if (badge) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!chars) return canvas;
  ctx.fillStyle = badge ? '#ffffff' : c;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const family = '"Segoe UI Variable Display", "Segoe UI", system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  let px = size * (badge ? 0.5 : 0.78);
  ctx.font = `800 ${px}px ${family}`;
  const maxWidth = size * (badge ? 0.62 : 0.92);
  const width = ctx.measureText(chars).width;
  if (width > maxWidth) {
    px *= maxWidth / width;
    ctx.font = `800 ${px}px ${family}`;
  }
  ctx.fillText(chars, size / 2, size / 2 + px * 0.04);
  return canvas;
}
