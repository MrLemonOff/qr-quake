# Third-party notices

QR Quake is built on the open-source projects below. Each keeps its own license. The full license text of every package is included in its folder under `node_modules` after `npm ci`, and in the files QR Quake ships.

## Runtime dependencies (shipped in the built app)

| Project | Version | License | Used for |
|---|---|---|---|
| [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) | 2.0.x | MIT | Encoding text into the QR matrix. Copyright (c) Kazuhiko Arase. |
| [jsQR](https://github.com/cozmo/jsQR) | 1.4.x | Apache-2.0 | Decoding the rendered code for the scan guard. Copyright (c) Cosmo Wolfe. |
| [ZXing (zxing-js)](https://github.com/zxing-js/library) | 0.23.x | Apache-2.0 | A second decoder for the scan guard, and the only one that reads barcodes. A port of the ZXing project (Copyright Google and the ZXing authors). |
| [bwip-js](https://github.com/metafloor/bwip-js) | 4.x | MIT | The symbol tables for all barcode types (loaded on demand). Copyright (c) Mark Warren. It contains code generated from Barcode Writer in Pure PostScript, Copyright (c) Terry Burton. |
| [Lucide](https://lucide.dev) | 1.x | ISC | The interface icons and the 1,800+ icons in the art library. |
| [Simple Icons](https://simpleicons.org) | 16.x | CC0-1.0 | The 175 brand logos in the art library and the GitHub mark. |

### Brand logos and trademarks

The brand logos come from Simple Icons, which is released under CC0. That license covers the SVG data only. **The logos themselves are trademarks of their respective owners** (GitHub, Instagram, YouTube, X, Facebook, TikTok, WhatsApp, Telegram, Discord, Spotify, Twitch, Reddit, PayPal, Snapchat, Pinterest, Signal, Bluesky, Threads and the other brands in the library). QR Quake includes them only so you can put them in a code that points at your own page on that service. Their use is not endorsed by, and does not imply any relationship with, those companies. Read the [Simple Icons disclaimer](https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md) before you use a logo commercially.

### QR Code

"QR Code" is a registered trademark of DENSO WAVE INCORPORATED.

## Development dependencies (not shipped)

| Project | License | Used for |
|---|---|---|
| [Vite](https://vite.dev) | MIT | Dev server and production build. |
| [Vitest](https://vitest.dev) | MIT | Running the tests. |
| [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas) | MIT | A raster canvas in Node, so tests decode real pixels. |
| [puppeteer-core](https://pptr.dev) | Apache-2.0 | Driving Chrome, Edge or Chromium for the screenshots and the smoke test. |

## Design

The color tokens, buttons, cards, inputs and layout rules in `src/styles.css` follow the theme of [AlgoWorld](https://github.com/MrLemonOff/AlgoWorld) by MrLemonOff, as requested by this project's author.

## Example pictures

The example pictures (Sunset, Waves, Bloom) are drawn by code in `src/core/samples.js`. They are part of QR Quake and covered by its MIT license.

## Emoji

The emoji picker only lists Unicode characters. What you see depends on the emoji font of your device (for example Segoe UI Emoji, Apple Color Emoji or Noto Color Emoji), which belongs to its vendor and is not part of QR Quake.
