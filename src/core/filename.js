const slug = (s, max = 40) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '');

/** A readable file name (without extension) for what the code holds, e.g. "github-com-mrlemonoff" or "wifi-cafe". */
export function fileBase(text, { barcode = '' } = {}) {
  const t = String(text ?? '').trim();
  let base;
  const field = (re) => (re.exec(t) || [])[1];
  if (/^WIFI:/i.test(t)) base = `wifi-${slug(field(/S:((?:\\.|[^;])*)/i)?.replace(/\\(.)/g, '$1'))}`;
  else if (/^BEGIN:VCARD/i.test(t)) base = `contact-${slug(field(/^FN:(.*)$/im))}`;
  else if (/^MECARD:/i.test(t)) base = `contact-${slug(field(/N:([^;]*)/i))}`;
  else if (/^BEGIN:VCALENDAR/i.test(t)) base = `event-${slug(field(/^SUMMARY:(.*)$/im))}`;
  else if (/^mailto:/i.test(t)) base = `email-${slug(t.slice(7).split('?')[0])}`;
  else if (/^tel:/i.test(t)) base = `phone-${slug(t.slice(4))}`;
  else if (/^sms:/i.test(t)) base = `sms-${slug(t.slice(4).split('?')[0])}`;
  else if (/^BCD\n/.test(t)) base = 'bank-transfer';
  else if (/^otpauth:/i.test(t)) base = '2fa-setup';
  else base = slug(t.replace(/^[a-z][a-z0-9+.-]*:\/\/(www\.)?/i, '').replace(/^[a-z]+:/i, ''));
  base = base.replace(/-+$/, '');
  if (barcode) return `${barcode}-${slug(t, 30) || 'code'}`;
  return base || 'qr-code';
}
