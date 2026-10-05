// Builders for the text that goes inside the QR code. Scanners understand these formats natively.

export const clean = (s) => String(s ?? '').trim();

/** Escape the characters that are special inside Wi-Fi QR fields. */
const wifiEscape = (value) => String(value).replace(/([\\;,:"])/g, '\\$1');

export function wifiPayload({ ssid, password = '', security = 'WPA', hidden = false }) {
  const name = clean(ssid);
  if (!name) return '';
  const type = ['WPA', 'WEP', 'nopass'].includes(security) ? security : 'WPA';
  let out = `WIFI:T:${type};S:${wifiEscape(name)};`;
  if (type !== 'nopass') out += `P:${wifiEscape(password)};`;
  if (hidden) out += 'H:true;';
  return out + ';';
}

/** Escape text for a vCard or iCalendar value. */
const icsEscape = (value) => String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

export function vcardPayload({ firstName, lastName, org, title, phone, mobile, email, url, street, city, zip, country, note }) {
  const first = clean(firstName);
  const last = clean(lastName);
  if (![first, last, clean(org), clean(phone), clean(mobile), clean(email)].some(Boolean)) return '';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${icsEscape(last)};${icsEscape(first)};;;`];
  lines.push(`FN:${icsEscape([first, last].filter(Boolean).join(' ') || clean(org))}`);
  if (clean(org)) lines.push(`ORG:${icsEscape(clean(org))}`);
  if (clean(title)) lines.push(`TITLE:${icsEscape(clean(title))}`);
  if (clean(mobile)) lines.push(`TEL;TYPE=CELL:${icsEscape(clean(mobile))}`);
  if (clean(phone)) lines.push(`TEL;TYPE=WORK:${icsEscape(clean(phone))}`);
  if (clean(email)) lines.push(`EMAIL:${icsEscape(clean(email))}`);
  if (clean(url)) lines.push(`URL:${clean(url)}`);
  if ([street, city, zip, country].some((v) => clean(v))) {
    lines.push(`ADR;TYPE=WORK:;;${icsEscape(clean(street))};${icsEscape(clean(city))};;${icsEscape(clean(zip))};${icsEscape(clean(country))}`);
  }
  if (clean(note)) lines.push(`NOTE:${icsEscape(clean(note))}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/** MeCard: a smaller contact format than vCard, so the code has fewer modules. */
export function mecardPayload({ firstName, lastName, phone, email, url, street, city, zip, country, note }) {
  const esc = (v) => String(v).replace(/([\\;,:"])/g, '\\$1');
  const name = [clean(lastName), clean(firstName)].filter(Boolean).join(',');
  if (!name && !clean(phone) && !clean(email)) return '';
  let out = 'MECARD:';
  if (name) out += `N:${esc(name).replace(/\\,/g, ',')};`;
  if (clean(phone)) out += `TEL:${esc(clean(phone))};`;
  if (clean(email)) out += `EMAIL:${esc(clean(email))};`;
  if (clean(url)) out += `URL:${esc(clean(url))};`;
  const adr = [street, city, zip, country].map(clean).filter(Boolean).join(', ');
  if (adr) out += `ADR:${esc(adr)};`;
  if (clean(note)) out += `NOTE:${esc(clean(note))};`;
  return out + ';';
}

export function emailPayload({ to, subject, body }) {
  const address = clean(to);
  if (!address) return '';
  const params = [];
  if (clean(subject)) params.push(`subject=${encodeURIComponent(clean(subject))}`);
  if (clean(body)) params.push(`body=${encodeURIComponent(clean(body))}`);
  return `mailto:${address}${params.length ? '?' + params.join('&') : ''}`;
}

const digitsOf = (n) => clean(n).replace(/[^\d+]/g, '');

export function phonePayload({ number }) {
  const d = digitsOf(number);
  return d ? `tel:${d}` : '';
}

export function smsPayload({ number, message }) {
  const d = digitsOf(number);
  if (!d) return '';
  return `sms:${d}${clean(message) ? '?body=' + encodeURIComponent(clean(message)) : ''}`;
}

export function whatsappPayload({ number, message }) {
  const d = digitsOf(number).replace(/^\+/, '');
  if (!d) return '';
  return `https://wa.me/${d}${clean(message) ? '?text=' + encodeURIComponent(clean(message)) : ''}`;
}

/** Adds https:// when a web address has no scheme. */
export function urlPayload({ url }) {
  const u = clean(url);
  if (!u) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return u;
  return /\s/.test(u) ? u : `https://${u}`;
}

const num = (v) => (clean(v) === '' || !Number.isFinite(Number(v)) ? null : Number(v));

export function geoPayload({ lat, lng }) {
  const a = num(lat);
  const b = num(lng);
  return a === null || b === null || Math.abs(a) > 90 || Math.abs(b) > 180 ? '' : `geo:${a},${b}`;
}

export function mapsPayload({ lat, lng, query }) {
  const a = num(lat);
  const b = num(lng);
  const q = a !== null && b !== null && Math.abs(a) <= 90 && Math.abs(b) <= 180 ? `${a},${b}` : clean(query);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}

export function directionsPayload({ destination }) {
  const d = clean(destination);
  return d ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d)}` : '';
}

/** "2026-10-05T14:30" -> "20261005T143000" (a floating local time). */
function icsDate(value, allDay) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(clean(value));
  if (!m) return '';
  return allDay ? `${m[1]}${m[2]}${m[3]}` : `${m[1]}${m[2]}${m[3]}T${m[4] || '00'}${m[5] || '00'}00`;
}

export function eventPayload({ title, start, end, allDay, location, description }) {
  const s = icsDate(start, allDay);
  if (!clean(title) || !s) return '';
  const e = icsDate(end, allDay);
  const key = allDay ? ';VALUE=DATE' : '';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `SUMMARY:${icsEscape(clean(title))}`, `DTSTART${key}:${s}`];
  if (e) lines.push(`DTEND${key}:${e}`);
  if (clean(location)) lines.push(`LOCATION:${icsEscape(clean(location))}`);
  if (clean(description)) lines.push(`DESCRIPTION:${icsEscape(clean(description))}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

const COINS = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  litecoin: 'litecoin',
  bitcoincash: 'bitcoincash',
  dogecoin: 'dogecoin',
  solana: 'solana',
  lightning: 'lightning',
};

export function cryptoPayload({ coin, address, amount, label, message }) {
  const a = clean(address);
  if (!a) return '';
  const scheme = COINS[coin] || 'bitcoin';
  const params = [];
  if (num(amount) !== null && Number(amount) > 0) params.push(`amount=${Number(amount)}`);
  if (clean(label)) params.push(`label=${encodeURIComponent(clean(label))}`);
  if (clean(message)) params.push(`message=${encodeURIComponent(clean(message))}`);
  return `${scheme}:${a}${params.length ? '?' + params.join('&') : ''}`;
}

export function paypalPayload({ username, amount, currency }) {
  const u = clean(username).replace(/^@/, '').replace(/^https?:\/\/(www\.)?paypal\.me\//i, '');
  if (!u) return '';
  const amt = num(amount) !== null && Number(amount) > 0 ? `/${Number(amount)}${clean(currency)}` : '';
  return `https://paypal.me/${encodeURIComponent(u)}${amt}`;
}

export function upiPayload({ vpa, name, amount, note }) {
  const v = clean(vpa);
  if (!v) return '';
  const params = [`pa=${encodeURIComponent(v)}`];
  if (clean(name)) params.push(`pn=${encodeURIComponent(clean(name))}`);
  if (num(amount) !== null && Number(amount) > 0) params.push(`am=${Number(amount)}`);
  params.push('cu=INR');
  if (clean(note)) params.push(`tn=${encodeURIComponent(clean(note))}`);
  return `upi://pay?${params.join('&')}`;
}

/** SEPA credit transfer (EPC QR, used by European banking apps). */
export function epcPayload({ name, iban, bic, amount, reference }) {
  const ib = clean(iban).replace(/\s+/g, '').toUpperCase();
  if (!clean(name) || !ib) return '';
  const amt = num(amount) !== null && Number(amount) > 0 ? `EUR${Number(amount).toFixed(2)}` : '';
  return ['BCD', '002', '1', 'SCT', clean(bic).replace(/\s+/g, '').toUpperCase(), clean(name).slice(0, 70), ib, amt, '', clean(reference).slice(0, 140), ''].join('\n');
}

/** Authenticator-app setup code (time-based one-time passwords). */
export function otpPayload({ issuer, account, secret, digits, period }) {
  const s = clean(secret).replace(/\s+/g, '').toUpperCase();
  if (!s || !clean(account)) return '';
  const label = clean(issuer) ? `${encodeURIComponent(clean(issuer))}:${encodeURIComponent(clean(account))}` : encodeURIComponent(clean(account));
  const params = [`secret=${s}`];
  if (clean(issuer)) params.push(`issuer=${encodeURIComponent(clean(issuer))}`);
  if (String(digits) === '8') params.push('digits=8');
  if (num(period) !== null && Number(period) !== 30) params.push(`period=${Number(period)}`);
  return `otpauth://totp/${label}?${params.join('&')}`;
}

export function zoomPayload({ meetingId, password }) {
  const id = clean(meetingId).replace(/\D/g, '');
  if (!id) return '';
  return `https://zoom.us/j/${id}${clean(password) ? '?pwd=' + encodeURIComponent(clean(password)) : ''}`;
}

export function tweetPayload({ text, url, hashtags }) {
  if (!clean(text) && !clean(url)) return '';
  const params = [];
  if (clean(text)) params.push(`text=${encodeURIComponent(clean(text))}`);
  if (clean(url)) params.push(`url=${encodeURIComponent(clean(url))}`);
  const tags = clean(hashtags).replace(/#/g, '').replace(/\s+/g, ',');
  if (tags) params.push(`hashtags=${encodeURIComponent(tags)}`);
  return `https://twitter.com/intent/tweet?${params.join('&')}`;
}

export function facetimePayload({ target }) {
  const t = clean(target);
  return t ? `facetime:${t}` : '';
}

/** True when plain text looks like a web address that is missing its scheme. */
export function looksLikeBareDomain(text) {
  const t = clean(text);
  return /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t) && !/^[a-z]+:/i.test(t);
}
