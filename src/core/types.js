import * as P from './payloads.js';

/**
 * Every kind of content a QR code can carry. The interface builds each form from `fields`, and `build`
 * turns the form values into the text that goes in the code ('' means "not complete yet").
 *
 * icon: { lucide: 'Name' } or { brand: 'id' } (see signs.js).
 */

const f = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const text = (key, label, placeholder = '', extra = {}) => f(key, label, { placeholder, ...extra });
const area = (key, label, placeholder = '', extra = {}) => f(key, label, { type: 'textarea', placeholder, ...extra });
const select = (key, label, options, extra = {}) => f(key, label, { type: 'select', options, default: options[0][0], ...extra });
const toggle = (key, label, extra = {}) => f(key, label, { type: 'switch', default: false, ...extra });

const GROUPS = [
  { id: 'basic', label: 'Basics' },
  { id: 'share', label: 'Share and contact' },
  { id: 'place', label: 'Places and events' },
  { id: 'social', label: 'Social profiles' },
  { id: 'pay', label: 'Payments' },
  { id: 'tools', label: 'Tools' },
];
export { GROUPS };

const handle = (v) => String(v ?? '').trim().replace(/^@/, '');
const isUrl = (v) => /^https?:\/\//i.test(String(v ?? '').trim());

/** A social profile type: the user types a name (or pastes a full link) and gets the profile link. */
function social(id, label, brand, build, placeholder = 'username', extra = {}) {
  return {
    id,
    label,
    group: 'social',
    icon: typeof brand === 'string' ? { brand } : brand,
    desc: `Link to a ${label} profile`,
    fields: [text('user', extra.fieldLabel || 'Username or link', placeholder, { default: '' })],
    build: (v) => {
      const u = String(v.user ?? '').trim();
      if (!u) return '';
      return isUrl(u) ? u : build(handle(u));
    },
  };
}

export const TYPES = [
  {
    id: 'text',
    label: 'Text',
    group: 'basic',
    icon: { lucide: 'Type' },
    desc: 'Any text, shown as it is',
    fields: [area('text', 'Text', 'Anything you want people to read', { default: 'https://example.com', rows: 4 })],
    build: (v) => (String(v.text ?? '').trim() ? String(v.text) : ''),
  },
  {
    id: 'url',
    label: 'Website link',
    group: 'basic',
    icon: { lucide: 'Link' },
    desc: 'Opens a web address',
    fields: [text('url', 'Web address', 'example.com', { default: '', inputType: 'url' })],
    build: P.urlPayload,
  },
  {
    id: 'email',
    label: 'Email',
    group: 'share',
    icon: { lucide: 'Mail' },
    desc: 'A new message, already filled in',
    fields: [
      text('to', 'To', 'name@example.com', { inputType: 'email', default: '' }),
      text('subject', 'Subject', '', { default: '' }),
      area('body', 'Message', '', { default: '', rows: 3 }),
    ],
    build: P.emailPayload,
  },
  {
    id: 'phone',
    label: 'Phone call',
    group: 'share',
    icon: { lucide: 'Phone' },
    desc: 'Offers to call a number',
    fields: [text('number', 'Phone number', '+1 555 010 2030', { inputType: 'tel', default: '' })],
    build: P.phonePayload,
  },
  {
    id: 'sms',
    label: 'SMS message',
    group: 'share',
    icon: { lucide: 'MessageSquare' },
    desc: 'A text message, ready to send',
    fields: [text('number', 'Phone number', '+1 555 010 2030', { inputType: 'tel', default: '' }), area('message', 'Message', '', { default: '', rows: 3 })],
    build: P.smsPayload,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp chat',
    group: 'share',
    icon: { brand: 'whatsapp' },
    desc: 'Starts a WhatsApp chat',
    fields: [
      text('number', 'Phone number with country code', '+1 555 010 2030', { inputType: 'tel', default: '' }),
      area('message', 'First message (optional)', '', { default: '', rows: 2 }),
    ],
    build: P.whatsappPayload,
  },
  {
    id: 'contact',
    label: 'Contact card',
    group: 'share',
    icon: { lucide: 'Contact' },
    desc: 'Saves a full contact (vCard)',
    fields: [
      text('firstName', 'First name', '', { default: '' }),
      text('lastName', 'Last name', '', { default: '' }),
      text('org', 'Company', '', { default: '' }),
      text('title', 'Job title', '', { default: '' }),
      text('mobile', 'Mobile', '', { inputType: 'tel', default: '' }),
      text('phone', 'Work phone', '', { inputType: 'tel', default: '' }),
      text('email', 'Email', '', { inputType: 'email', default: '' }),
      text('url', 'Website', 'https://', { inputType: 'url', default: '' }),
      text('street', 'Street', '', { default: '' }),
      text('city', 'City', '', { default: '' }),
      text('zip', 'Postal code', '', { default: '' }),
      text('country', 'Country', '', { default: '' }),
      area('note', 'Note', '', { default: '', rows: 2 }),
    ],
    build: P.vcardPayload,
  },
  {
    id: 'mecard',
    label: 'Simple contact',
    group: 'share',
    icon: { lucide: 'ContactRound' },
    desc: 'A smaller contact code (MeCard)',
    fields: [
      text('firstName', 'First name', '', { default: '' }),
      text('lastName', 'Last name', '', { default: '' }),
      text('phone', 'Phone', '', { inputType: 'tel', default: '' }),
      text('email', 'Email', '', { inputType: 'email', default: '' }),
      text('url', 'Website', 'https://', { inputType: 'url', default: '' }),
      text('city', 'City', '', { default: '' }),
    ],
    build: P.mecardPayload,
  },
  {
    id: 'wifi',
    label: 'Wi-Fi network',
    group: 'share',
    icon: { lucide: 'Wifi' },
    desc: 'Joins a Wi-Fi network',
    fields: [
      text('ssid', 'Network name', 'My Wi-Fi', { default: '' }),
      text('password', 'Password', '', { default: '' }),
      select('security', 'Security', [['WPA', 'WPA / WPA2 / WPA3'], ['WEP', 'WEP'], ['nopass', 'None (open)']]),
      toggle('hidden', 'Hidden network'),
    ],
    build: P.wifiPayload,
  },
  {
    id: 'location',
    label: 'Map location',
    group: 'place',
    icon: { lucide: 'MapPin' },
    desc: 'Opens a place on the map',
    fields: [
      text('query', 'Address or place name', 'Eiffel Tower, Paris', { default: '' }),
      text('lat', 'Or latitude', '48.8584', { inputType: 'number', default: '' }),
      text('lng', 'and longitude', '2.2945', { inputType: 'number', default: '' }),
    ],
    build: P.mapsPayload,
  },
  {
    id: 'directions',
    label: 'Directions',
    group: 'place',
    icon: { lucide: 'Navigation' },
    desc: 'Route to a destination',
    fields: [text('destination', 'Destination', 'Address or coordinates', { default: '' })],
    build: P.directionsPayload,
  },
  {
    id: 'geo',
    label: 'GPS point',
    group: 'place',
    icon: { lucide: 'Crosshair' },
    desc: 'Raw coordinates (geo: link)',
    fields: [text('lat', 'Latitude', '48.8584', { inputType: 'number', default: '' }), text('lng', 'Longitude', '2.2945', { inputType: 'number', default: '' })],
    build: P.geoPayload,
  },
  {
    id: 'event',
    label: 'Calendar event',
    group: 'place',
    icon: { lucide: 'CalendarDays' },
    desc: 'Adds an event to a calendar',
    fields: [
      text('title', 'Title', '', { default: '' }),
      toggle('allDay', 'All day'),
      f('start', 'Starts', { type: 'datetime', default: '' }),
      f('end', 'Ends', { type: 'datetime', default: '' }),
      text('location', 'Place', '', { default: '' }),
      area('description', 'Notes', '', { default: '', rows: 2 }),
    ],
    build: P.eventPayload,
  },
  social('instagram', 'Instagram', 'instagram', (u) => `https://instagram.com/${u}`),
  social('facebook', 'Facebook', 'facebook', (u) => `https://facebook.com/${u}`),
  social('x', 'X (Twitter)', 'x', (u) => `https://x.com/${u}`),
  social('tiktok', 'TikTok', 'tiktok', (u) => `https://tiktok.com/@${u}`),
  social('youtube', 'YouTube', 'youtube', (u) => `https://youtube.com/@${u}`, 'channel handle'),
  social('linkedin', 'LinkedIn', { lucide: 'Briefcase' }, (u) => `https://linkedin.com/in/${u}`),
  social('telegram', 'Telegram', 'telegram', (u) => `https://t.me/${u}`),
  social('snapchat', 'Snapchat', 'snapchat', (u) => `https://snapchat.com/add/${u}`),
  social('github', 'GitHub', 'github', (u) => `https://github.com/${u}`),
  social('twitch', 'Twitch', 'twitch', (u) => `https://twitch.tv/${u}`),
  social('reddit', 'Reddit', 'reddit', (u) => `https://reddit.com/user/${u}`),
  social('pinterest', 'Pinterest', 'pinterest', (u) => `https://pinterest.com/${u}`),
  social('threads', 'Threads', 'threads', (u) => `https://threads.net/@${u}`),
  social('bluesky', 'Bluesky', 'bluesky', (u) => `https://bsky.app/profile/${u}`, 'name.bsky.social'),
  social('discord', 'Discord invite', 'discord', (u) => `https://discord.gg/${u}`, 'invite code', { fieldLabel: 'Invite code or link' }),
  social('spotify', 'Spotify', 'spotify', (u) => u, 'Paste a Spotify link', { fieldLabel: 'Spotify link' }),
  social('signal', 'Signal', 'signal', (u) => u, 'Paste your Signal link', { fieldLabel: 'Signal link' }),
  social('patreon', 'Patreon', { lucide: 'Heart' }, (u) => `https://patreon.com/${u}`),
  social('kofi', 'Ko-fi', { lucide: 'Coffee' }, (u) => `https://ko-fi.com/${u}`),
  social('buymeacoffee', 'Buy Me a Coffee', { lucide: 'Coffee' }, (u) => `https://buymeacoffee.com/${u}`),
  social('appstore', 'App store link', { lucide: 'Store' }, (u) => u, 'Paste an App Store or Google Play link', { fieldLabel: 'App link' }),
  {
    id: 'paypal',
    label: 'PayPal',
    group: 'pay',
    icon: { brand: 'paypal' },
    desc: 'Asks for a PayPal.Me payment',
    fields: [
      text('username', 'PayPal.Me name', 'yourname', { default: '' }),
      text('amount', 'Amount (optional)', '10', { inputType: 'number', default: '' }),
      select('currency', 'Currency', [['USD', 'USD'], ['EUR', 'EUR'], ['GBP', 'GBP'], ['CAD', 'CAD'], ['AUD', 'AUD'], ['JPY', 'JPY'], ['CHF', 'CHF']]),
    ],
    build: P.paypalPayload,
  },
  {
    id: 'venmo',
    label: 'Venmo',
    group: 'pay',
    icon: { lucide: 'Banknote' },
    desc: 'Opens a Venmo profile',
    fields: [text('user', 'Venmo username', 'yourname', { default: '' })],
    build: (v) => (String(v.user ?? '').trim() ? `https://venmo.com/u/${encodeURIComponent(handle(v.user))}` : ''),
  },
  {
    id: 'cashapp',
    label: 'Cash App',
    group: 'pay',
    icon: { lucide: 'Wallet' },
    desc: 'Opens a Cash App $cashtag',
    fields: [text('user', '$cashtag', '$yourname', { default: '' })],
    build: (v) => (String(v.user ?? '').trim() ? `https://cash.app/$${encodeURIComponent(String(v.user).trim().replace(/^\$/, ''))}` : ''),
  },
  {
    id: 'crypto',
    label: 'Crypto payment',
    group: 'pay',
    icon: { lucide: 'Bitcoin' },
    desc: 'Bitcoin, Ethereum and more',
    fields: [
      select('coin', 'Coin', [['bitcoin', 'Bitcoin'], ['lightning', 'Bitcoin Lightning invoice'], ['ethereum', 'Ethereum'], ['litecoin', 'Litecoin'], ['bitcoincash', 'Bitcoin Cash'], ['dogecoin', 'Dogecoin'], ['solana', 'Solana']]),
      text('address', 'Wallet address', '', { default: '' }),
      text('amount', 'Amount (optional)', '', { inputType: 'number', default: '' }),
      text('label', 'Label (optional)', '', { default: '' }),
    ],
    build: P.cryptoPayload,
  },
  {
    id: 'upi',
    label: 'UPI payment',
    group: 'pay',
    icon: { lucide: 'IndianRupee' },
    desc: 'India UPI payment request',
    fields: [
      text('vpa', 'UPI ID', 'name@bank', { default: '' }),
      text('name', 'Payee name', '', { default: '' }),
      text('amount', 'Amount in INR (optional)', '', { inputType: 'number', default: '' }),
      text('note', 'Note', '', { default: '' }),
    ],
    build: P.upiPayload,
  },
  {
    id: 'epc',
    label: 'Bank transfer (SEPA)',
    group: 'pay',
    icon: { lucide: 'Landmark' },
    desc: 'European bank transfer (EPC)',
    fields: [
      text('name', 'Recipient name', '', { default: '' }),
      text('iban', 'IBAN', 'DE89 3704 0044 0532 0130 00', { default: '' }),
      text('bic', 'BIC (optional)', '', { default: '' }),
      text('amount', 'Amount in EUR (optional)', '', { inputType: 'number', default: '' }),
      text('reference', 'Reference', '', { default: '' }),
    ],
    build: P.epcPayload,
  },
  {
    id: 'otp',
    label: 'Authenticator (2FA)',
    group: 'tools',
    icon: { lucide: 'KeyRound' },
    desc: 'One-time password app setup',
    fields: [
      text('issuer', 'Service', 'Example', { default: '' }),
      text('account', 'Account', 'name@example.com', { default: '' }),
      text('secret', 'Secret key (base32)', '', { default: '' }),
      select('digits', 'Digits', [['6', '6'], ['8', '8']]),
      text('period', 'Seconds per code', '30', { inputType: 'number', default: '30' }),
    ],
    build: P.otpPayload,
  },
  {
    id: 'zoom',
    label: 'Zoom meeting',
    group: 'tools',
    icon: { lucide: 'Video' },
    desc: 'Joins a Zoom meeting',
    fields: [text('meetingId', 'Meeting ID', '123 456 7890', { default: '' }), text('password', 'Passcode (optional)', '', { default: '' })],
    build: P.zoomPayload,
  },
  {
    id: 'tweet',
    label: 'Post to X',
    group: 'tools',
    icon: { lucide: 'Send' },
    desc: 'A post, ready to publish',
    fields: [area('text', 'Text', '', { default: '', rows: 3 }), text('url', 'Link (optional)', 'https://', { default: '' }), text('hashtags', 'Hashtags (optional)', 'qr art', { default: '' })],
    build: P.tweetPayload,
  },
  {
    id: 'facetime',
    label: 'FaceTime',
    group: 'tools',
    icon: { lucide: 'Smartphone' },
    desc: 'Starts a FaceTime call',
    fields: [text('target', 'Phone number or Apple ID email', '', { default: '' })],
    build: P.facetimePayload,
  },
];

export const TYPE_BY_ID = Object.fromEntries(TYPES.map((t) => [t.id, t]));
export const typeOf = (id) => TYPE_BY_ID[id] || TYPE_BY_ID.text;

/** Default form values for a type. */
export function defaultValues(type) {
  return Object.fromEntries(type.fields.map((fld) => [fld.key, fld.default ?? '']));
}

/** All form values, one set per type, so switching types keeps what was typed. */
export function defaultContent(typeId = 'text') {
  return { type: typeId, values: Object.fromEntries(TYPES.map((t) => [t.id, defaultValues(t)])) };
}

/** Turn the content state into the string to encode. Empty string means nothing to encode yet. */
export function buildPayload(content) {
  const type = typeOf(content.type);
  return type.build(content.values?.[type.id] || defaultValues(type)) || '';
}
