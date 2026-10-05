# Security policy

## What QR Quake is

QR Quake is a static web page. It has no server, no accounts and no database. Everything you type or drop in stays in your browser tab. The production build forbids all network connections with a Content-Security-Policy, so even a bug could not send your data out.

## Built-in protections

- **No network.** The built page sets `connect-src 'none'`, `default-src 'none'` and `form-action 'none'`.
- **No inline scripts.** `script-src 'self'` only. The theme script is a separate file for this reason.
- **Safe pictures.** Pictures are loaded as images, never inserted into the page, so an SVG picture cannot run scripts.
- **Safe SVG export.** Every color written into an exported SVG is parsed and rewritten as `#rrggbb`. All text (card titles, barcode text, the SVG title) is escaped.
- **Limited inputs.** Pictures are limited to 30 MB and scaled down before use. Card text is limited to 60 characters per line. Data is limited by what one code can hold, and barcode text is validated by the encoder.
- **Minimal storage.** Only style choices (colors, shapes, card look, last art) are saved in local storage. Links, Wi-Fi passwords, contact details, payment details, typed text and pictures are never saved.
- **Lazy code, same origin.** The icon set, brand list, barcode tables and ZXing load on demand as separate files of the same site (`script-src 'self'`).
- **Reproducible dependencies.** `package-lock.json` is committed, and CI installs with `npm ci`.

## What QR Quake cannot protect you from

- **A code is only as trustworthy as its content.** Anyone can make a QR code that opens a harmful link. Check where a code leads before you scan one from an unknown source.
- **Printed codes are public.** A Wi-Fi code gives the password to anyone who can scan it. A payment or authenticator (2FA) code hands over what it contains, so keep those private.
- **The scan guard is not a guarantee.** It uses a software decoder. Test the final code with a phone.

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

Please report problems **privately**, not in a public issue.

1. Open the repository on GitHub.
2. Go to **Security > Advisories > Report a vulnerability**.
3. Describe what you found, how to reproduce it, and what you think the impact is.

You will get a first answer within 7 days. If the report is accepted, a fix is prepared in private and released together with a public advisory that credits you, unless you prefer to stay anonymous.

Examples of reports we want:

- A way to run script in the page (for example through a crafted picture, text, or exported SVG).
- A way to make the production page contact another server.
- A dependency with a known vulnerability that affects the built app.

Out of scope: a QR code that decodes to a harmful link (that is what the person who made it chose), and problems that need a modified copy of the page.
