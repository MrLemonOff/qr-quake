import { describe, it, expect } from 'vitest';
import { fileBase } from '../src/core/filename.js';

describe('file names', () => {
  it('name a link after its address', () => {
    expect(fileBase('https://github.com/MrLemonOff')).toBe('github-com-mrlemonoff');
    expect(fileBase('https://www.example.com/a/b?x=1')).toBe('example-com-a-b-x-1');
  });
  it('name special content by what it is', () => {
    expect(fileBase('WIFI:T:WPA;S:Cafe Quake;P:secret;;')).toBe('wifi-cafe-quake');
    expect(fileBase('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Ada Lovelace\r\nEND:VCARD')).toBe('contact-ada-lovelace');
    expect(fileBase('mailto:ada@example.com?subject=Hi')).toBe('email-ada-example-com');
    expect(fileBase('tel:+15550102030')).toBe('phone-15550102030');
    expect(fileBase('BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nSUMMARY:Launch party\r\nEND:VEVENT')).toBe('event-launch-party');
  });
  it('name plain text and barcodes', () => {
    expect(fileBase('Hello, World!')).toBe('hello-world');
    expect(fileBase('x'.repeat(200)).length).toBeLessThanOrEqual(40);
    expect(fileBase('5901234123457', { barcode: 'ean13' })).toBe('ean13-5901234123457');
  });
  it('never returns an empty or unsafe name', () => {
    expect(fileBase('')).toBe('qr-code');
    expect(fileBase('///***')).toBe('qr-code');
    expect(fileBase('../../etc/passwd')).toMatch(/^[a-z0-9-]+$/);
  });
});
