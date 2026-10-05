import { describe, it, expect } from 'vitest';
import * as P from '../src/core/payloads.js';
import { TYPES, TYPE_BY_ID, GROUPS, buildPayload, defaultContent, defaultValues } from '../src/core/types.js';

describe('payload builders', () => {
  it('builds a Wi-Fi payload and escapes special characters', () => {
    expect(P.wifiPayload({ ssid: 'Home', password: 'secret', security: 'WPA' })).toBe('WIFI:T:WPA;S:Home;P:secret;;');
    expect(P.wifiPayload({ ssid: 'a;b:c', password: 'p"w\\d,', security: 'WPA', hidden: true })).toBe('WIFI:T:WPA;S:a\\;b\\:c;P:p\\"w\\\\d\\,;H:true;;');
    expect(P.wifiPayload({ ssid: 'Open', security: 'nopass' })).toBe('WIFI:T:nopass;S:Open;;');
    expect(P.wifiPayload({ ssid: '' })).toBe('');
  });

  it('builds a vCard with address and note', () => {
    const card = P.vcardPayload({ firstName: 'Ada', lastName: 'Lovelace', mobile: '+1 555', email: 'ada@example.com', org: 'A; B', city: 'London', note: 'Hi, there' });
    const lines = card.split('\r\n');
    expect(lines).toContain('BEGIN:VCARD');
    expect(lines).toContain('N:Lovelace;Ada;;;');
    expect(lines).toContain('ORG:A\\; B');
    expect(lines).toContain('TEL;TYPE=CELL:+1 555');
    expect(lines).toContain('ADR;TYPE=WORK:;;;London;;;');
    expect(lines).toContain('NOTE:Hi\\, there');
    expect(lines.at(-1)).toBe('END:VCARD');
    expect(P.vcardPayload({})).toBe('');
  });

  it('builds a MeCard', () => {
    expect(P.mecardPayload({ firstName: 'Ada', lastName: 'Lovelace', phone: '123', email: 'a@b.co' })).toBe('MECARD:N:Lovelace,Ada;TEL:123;EMAIL:a@b.co;;');
  });

  it('builds mailto, tel, sms and WhatsApp links', () => {
    expect(P.emailPayload({ to: 'a@b.co', subject: 'Hi there', body: 'x&y' })).toBe('mailto:a@b.co?subject=Hi%20there&body=x%26y');
    expect(P.phonePayload({ number: '+1 (555) 010-2030' })).toBe('tel:+15550102030');
    expect(P.smsPayload({ number: '+1 555', message: 'hello world' })).toBe('sms:+1555?body=hello%20world');
    expect(P.whatsappPayload({ number: '+1 555 010', message: 'hi' })).toBe('https://wa.me/1555010?text=hi');
    expect(P.emailPayload({ to: '' })).toBe('');
    expect(P.phonePayload({ number: 'abc' })).toBe('');
  });

  it('adds https to web addresses without a scheme', () => {
    expect(P.urlPayload({ url: 'example.com/a' })).toBe('https://example.com/a');
    expect(P.urlPayload({ url: 'http://example.com' })).toBe('http://example.com');
    expect(P.urlPayload({ url: 'mailto:a@b.co' })).toBe('mailto:a@b.co');
    expect(P.urlPayload({ url: '' })).toBe('');
  });

  it('builds locations and rejects impossible coordinates', () => {
    expect(P.geoPayload({ lat: '48.85', lng: '2.29' })).toBe('geo:48.85,2.29');
    expect(P.geoPayload({ lat: '91', lng: '0' })).toBe('');
    expect(P.mapsPayload({ query: 'Eiffel Tower' })).toBe('https://www.google.com/maps/search/?api=1&query=Eiffel%20Tower');
    expect(P.mapsPayload({ lat: '1', lng: '2', query: 'ignored' })).toBe('https://www.google.com/maps/search/?api=1&query=1%2C2');
    expect(P.directionsPayload({ destination: 'Paris' })).toBe('https://www.google.com/maps/dir/?api=1&destination=Paris');
  });

  it('builds calendar events', () => {
    const ev = P.eventPayload({ title: 'Launch', start: '2026-10-05T14:30', end: '2026-10-05T15:30', location: 'HQ', description: 'Cake, tea' });
    expect(ev.split('\r\n')).toEqual([
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'SUMMARY:Launch', 'DTSTART:20261005T143000', 'DTEND:20261005T153000',
      'LOCATION:HQ', 'DESCRIPTION:Cake\\, tea', 'END:VEVENT', 'END:VCALENDAR',
    ]);
    expect(P.eventPayload({ title: 'Day', start: '2026-10-05', allDay: true }).split('\r\n')).toContain('DTSTART;VALUE=DATE:20261005');
    expect(P.eventPayload({ title: '', start: '2026-10-05T10:00' })).toBe('');
  });

  it('builds payment and tool formats', () => {
    expect(P.cryptoPayload({ coin: 'bitcoin', address: 'bc1qxyz', amount: '0.5', label: 'Tip jar' })).toBe('bitcoin:bc1qxyz?amount=0.5&label=Tip%20jar');
    expect(P.cryptoPayload({ coin: 'ethereum', address: '0xabc' })).toBe('ethereum:0xabc');
    expect(P.paypalPayload({ username: '@jane', amount: '10', currency: 'EUR' })).toBe('https://paypal.me/jane/10EUR');
    expect(P.upiPayload({ vpa: 'a@bank', name: 'Jane Doe', amount: '50' })).toBe('upi://pay?pa=a%40bank&pn=Jane%20Doe&am=50&cu=INR');
    expect(P.epcPayload({ name: 'Jane', iban: 'de89 3704 0044 0532 0130 00', amount: '12.5', reference: 'INV-1' })).toBe(
      'BCD\n002\n1\nSCT\n\nJane\nDE89370400440532013000\nEUR12.50\n\nINV-1\n',
    );
    expect(P.otpPayload({ issuer: 'Ex', account: 'a@b.co', secret: 'abcd efgh' })).toBe('otpauth://totp/Ex:a%40b.co?secret=ABCDEFGH&issuer=Ex');
    expect(P.zoomPayload({ meetingId: '123 456 7890', password: 'pw' })).toBe('https://zoom.us/j/1234567890?pwd=pw');
    expect(P.tweetPayload({ text: 'Hi', hashtags: '#qr art' })).toBe('https://twitter.com/intent/tweet?text=Hi&hashtags=qr%2Cart');
    expect(P.facetimePayload({ target: 'a@b.co' })).toBe('facetime:a@b.co');
  });

  it('spots addresses missing a scheme', () => {
    expect(P.looksLikeBareDomain('example.com/page')).toBe(true);
    expect(P.looksLikeBareDomain('https://example.com')).toBe(false);
    expect(P.looksLikeBareDomain('hello world')).toBe(false);
  });
});

describe('content types', () => {
  it('has a unique id and a known group for every type', () => {
    const ids = TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = GROUPS.map((g) => g.id);
    for (const t of TYPES) {
      expect(groups, t.id).toContain(t.group);
      expect(t.fields.length, t.id).toBeGreaterThan(0);
      expect(t.icon.lucide || t.icon.brand, t.id).toBeTruthy();
    }
  });

  it('covers every common kind of content', () => {
    for (const id of ['text', 'url', 'email', 'phone', 'sms', 'whatsapp', 'wifi', 'contact', 'mecard', 'location', 'geo', 'directions', 'event', 'instagram', 'youtube', 'github', 'patreon', 'appstore', 'paypal', 'venmo', 'cashapp', 'crypto', 'upi', 'epc', 'otp', 'zoom', 'tweet', 'facetime']) {
      expect(TYPE_BY_ID[id], id).toBeTruthy();
    }
  });

  it('builds nothing from empty forms, except the sample text', () => {
    for (const t of TYPES) {
      const payload = t.build(defaultValues(t));
      if (t.id === 'text') expect(payload).toBe('https://example.com');
      else expect(payload, t.id).toBe('');
    }
  });

  it('builds social profile links from a name or a pasted link', () => {
    const c = defaultContent('instagram');
    c.values.instagram.user = '@quake';
    expect(buildPayload(c)).toBe('https://instagram.com/quake');
    c.values.instagram.user = 'https://instagram.com/other';
    expect(buildPayload(c)).toBe('https://instagram.com/other');
    const y = defaultContent('youtube');
    y.values.youtube.user = 'quake';
    expect(buildPayload(y)).toBe('https://youtube.com/@quake');
  });

  it('builds payment profile links', () => {
    const v = defaultContent('venmo');
    v.values.venmo.user = '@jane';
    expect(buildPayload(v)).toBe('https://venmo.com/u/jane');
    const c = defaultContent('cashapp');
    c.values.cashapp.user = '$jane';
    expect(buildPayload(c)).toBe('https://cash.app/$jane');
    const l = defaultContent('crypto');
    l.values.crypto.coin = 'lightning';
    l.values.crypto.address = 'lnbc1abc';
    expect(buildPayload(l)).toBe('lightning:lnbc1abc');
  });

  it('keeps what was typed when switching type', () => {
    const c = defaultContent('url');
    c.values.url.url = 'example.com';
    c.type = 'wifi';
    c.values.wifi.ssid = 'Home';
    expect(buildPayload(c)).toBe('WIFI:T:WPA;S:Home;P:;;');
    c.type = 'url';
    expect(buildPayload(c)).toBe('https://example.com');
  });
});
