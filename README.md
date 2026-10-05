<p align="center">
  <img src="docs/logo.png" alt="QR Quake logo" width="96" height="96">
</p>

<h1 align="center">QR Quake</h1>

<p align="center">
  <b>Art QR codes, cards and barcodes that still scan.</b><br>
  Put any picture, logo, icon or emoji inside a QR code. Frame it in a card. Make a barcode.<br>
  44 kinds of content. Free, unlimited, no login. Everything happens in your browser.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2F6BDC"></a>
  <a href="https://github.com/MrLemonOff/qr-quake/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/MrLemonOff/qr-quake/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="Node.js 20 or newer" src="https://img.shields.io/badge/node-%3E%3D20-2A7043">
  <img alt="No server" src="https://img.shields.io/badge/server-none-555">
  <img alt="100 percent local" src="https://img.shields.io/badge/data-100%25%20local-8B5CF6">
  <img alt="Checked by two decoders" src="https://img.shields.io/badge/scan%20check-ZXing%20%2B%20jsQR-D9480F">
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#gallery">Gallery</a> &middot;
  <a href="#screenshots">Screenshots</a> &middot;
  <a href="#make-your-first-code">Guide</a> &middot;
  <a href="#every-control">Controls</a> &middot;
  <a href="#the-scan-guard">Scan guard</a> &middot;
  <a href="#faq">FAQ</a> &middot;
  <a href="#for-developers">Developers</a>
</p>

<p align="center">
  <img src="docs/hero.png" alt="A QR code with a profile picture in a circle in the middle. It opens github.com/MrLemonOff" width="340"><br>
  <sub>Made with QR Quake. Scan it: it opens the author's GitHub page.</sub>
</p>

<p align="center">
  <img src="docs/screenshots/home-dark.png" alt="QR Quake in the dark theme: a sunset picture coloring a QR code that scans" width="900">
</p>

---

## At a glance

| | | | |
|:---:|:---:|:---:|:---:|
| **44**<br>content types | **1,866**<br>icons | **175**<br>brand logos | **820**<br>emoji and symbols |
| **9**<br>card looks | **17**<br>barcode types | **16**<br>color presets | **2**<br>scan decoders |
| **0**<br>servers | **0**<br>accounts | **0**<br>watermarks | **Never**<br>expires |

## What is QR Quake?

QR Quake turns a link, a Wi-Fi password, a contact card, a payment request or anything else into a code that looks like a small piece of art. You pick a sign, a logo, an emoji or your own picture and it goes into the code. You can frame the result in a card (a poster, a neon sign, a ticket) or switch to a barcode. A built-in test then reads the result with two real decoders, so you know it still works before you print it.

- **Put anything in the code.** A sign in the middle, or dots that take their colors from your picture.
- **Make it a card.** Nine ready-made card looks, with your own title, colors, borders, glow and decorations.
- **Barcodes too.** 14 linear barcodes (Code 128, EAN-13, UPC-A and more) and 3 square or stacked codes (Data Matrix, PDF417, Aztec).
- **Every kind of content.** Links, Wi-Fi, contact cards, events, maps, 21 social profiles, payments, authenticator setup and more.
- **Stay readable.** Every change is checked by decoders. If a code is fragile, one click on Auto-fix repairs it.
- **Unlimited and private.** No account, no watermark, no expiry, no server. The codes are static, so they never stop working. Your pictures and links never leave your browser tab.
- **Fast and simple.** Four tabs (Content, Art, Style, Card), compact pickers, and a live preview next to them.

### Why QR Quake?

| | Typical online generators | QR Quake |
|---|---|---|
| Login or account | Often | Never |
| Limits, watermarks, trials | Common | None |
| Codes that stop working | Dynamic codes expire or need a subscription | Static codes work forever |
| Your links and pictures | Sent to a server | Never leave your browser |
| Does the art still scan? | Not checked | Checked by two decoders, with one-click repair |
| Cards and barcodes | Extra product or paid | Built in |
| Open source | Rarely | MIT |

## Quick start

You need [Node.js](https://nodejs.org) 20 or newer.

**Windows:** double-click `start.bat`. It installs what it needs the first time and opens the app.

**Any system:**

```bash
git clone https://github.com/MrLemonOff/qr-quake.git
cd qr-quake
npm ci
npm run dev
```

Then open the address Vite prints, usually `http://localhost:5173`.

### Build a static copy

```bash
npm run build
```

The `dist` folder is a plain static website. Put it on any web host or open it from any static file server (`npm run preview` serves it locally). It needs no server code and makes no network requests.

## Features

| | Feature | What you can do |
|---|---|---|
| <img src="docs/icons/pencil.svg" width="22"> | **44 content types** | Text, links, email, phone, SMS, WhatsApp, Wi-Fi, contact cards, events, maps, directions, 21 social profiles, PayPal, Venmo, Cash App, crypto, UPI, SEPA bank transfers, authenticator (2FA) setup, Zoom and more. |
| <img src="docs/icons/image.svg" width="22"> | **Your picture** | Drop, choose or paste any PNG, JPG, SVG or WebP. Put it in the center, or let it color the dots. Zoom, move, brighten and recolor it. |
| <img src="docs/icons/shapes.svg" width="22"> | **Huge icon library** | 1,866 icons, 175 brand logos, 820 emoji and symbols, and text signs. Search them by name, pick the color and a round badge. |
| <img src="docs/icons/palette.svg" width="22"> | **Style** | Six dot shapes with size and roundness sliders, four corner frames, four corner centers, separate corner colors, 16 color presets, linear and radial gradients, transparent background. |
| <img src="docs/icons/card.svg" width="22"> | **Cards** | Nine looks (Clean, Poster, Neon, Sticker, Ticket, Scanner, Pastel, Polaroid, Sparkle) with title, subtitle, footer, fonts, gradients, borders, glow, shadow and ornaments. |
| <img src="docs/icons/barcode.svg" width="22"> | **Barcodes** | 17 types with live validation and plain-language errors. Style the bars with colors, gradients, rounded ends and text. |
| <img src="docs/icons/scan.svg" width="22"> | **Scan guard** | A live test with two decoders (ZXing and jsQR) after every change. It tells you if the code scans reliably, is fragile, or may not scan. |
| <img src="docs/icons/wand.svg" width="22"> | **Auto-fix and tuning** | Repairs a weak code step by step. It also tunes a new picture for you automatically. |
| <img src="docs/icons/shuffle.svg" width="22"> | **Surprise me** | A random style that has already passed the scan test. |
| <img src="docs/icons/download.svg" width="22"> | **Export** | PNG, JPG, WebP or vector SVG at 512, 1024, 2048 or 4096 pixels, or copy to the clipboard. |
| <img src="docs/icons/shield.svg" width="22"> | **Private by design** | No upload, no tracking, no login. The production page blocks all network requests with a strict Content-Security-Policy. |
| <img src="docs/icons/smartphone.svg" width="22"> | **Any device** | Works on phones, tablets and computers, in a light or dark theme. |

## Gallery

Every code below was made with QR Quake and passed the scan test. The QR codes open `https://example.com/qr-quake`.

### Art codes

<table>
  <tr>
    <td width="33%"><img src="docs/gallery/center-bolt.png" alt="Liquid dots with a blue bolt in the center"><p align="center">Center sign</p></td>
    <td width="33%"><img src="docs/gallery/center-heart.png" alt="Round dots in a purple to pink gradient with a heart"><p align="center">Gradient and round dots</p></td>
    <td width="33%"><img src="docs/gallery/center-ring.png" alt="Bars in an indigo gradient with a rocket and a yellow ring"><p align="center">Ring around the sign</p></td>
  </tr>
  <tr>
    <td><img src="docs/gallery/center-github.png" alt="Square dots with a GitHub logo"><p align="center">Brand logo</p></td>
    <td><img src="docs/gallery/center-coffee.png" alt="Tile dots in warm browns with a coffee cup"><p align="center">Tiles and leaf corners</p></td>
    <td><img src="docs/gallery/center-letter.png" alt="Diamond dots with a radial gradient and the letter Q"><p align="center">Text sign, radial gradient</p></td>
  </tr>
  <tr>
    <td><img src="docs/gallery/fill-bloom.png" alt="Dots colored by a flower picture"><p align="center">Colorize</p></td>
    <td><img src="docs/gallery/fill-sunset-backdrop.png" alt="Square dots colored by a sunset over a faded copy of the picture"><p align="center">Colorize with a faded picture</p></td>
    <td></td>
  </tr>
</table>

### Cards

<table>
  <tr>
    <td width="33%"><img src="docs/gallery/card-poster.png" alt="Poster card with a blue to purple gradient"><p align="center">Poster</p></td>
    <td width="33%"><img src="docs/gallery/card-neon.png" alt="Neon card with a glowing border around a colorized picture code"><p align="center">Neon</p></td>
    <td width="33%"><img src="docs/gallery/card-ticket.png" alt="Orange ticket card with notches and a dashed divider"><p align="center">Ticket</p></td>
  </tr>
  <tr>
    <td><img src="docs/gallery/card-sparkle.png" alt="Dark purple card with a gradient border and sparkles"><p align="center">Sparkle</p></td>
    <td><img src="docs/gallery/card-sticker.png" alt="Yellow sticker card with a thick outline"><p align="center">Sticker</p></td>
    <td><img src="docs/gallery/card-scanner.png" alt="Dark card with green scanner corners"><p align="center">Scanner</p></td>
  </tr>
  <tr>
    <td><img src="docs/gallery/card-pastel.png" alt="Pastel card with a colorized flower code"><p align="center">Pastel</p></td>
    <td><img src="docs/gallery/card-polaroid.png" alt="Polaroid card with a colorized waves picture code"><p align="center">Polaroid</p></td>
    <td><img src="docs/gallery/card-clean.png" alt="Clean white card with a soft shadow"><p align="center">Clean</p></td>
  </tr>
</table>

### Barcodes

<table>
  <tr>
    <td width="33%"><img src="docs/gallery/barcode-code128.png" alt="A Code 128 barcode"><p align="center">Code 128</p></td>
    <td width="33%"><img src="docs/gallery/barcode-ean13.png" alt="An EAN-13 barcode with a blue gradient"><p align="center">EAN-13, gradient</p></td>
    <td width="33%"><img src="docs/gallery/barcode-code39.png" alt="A Code 39 barcode with rounded pink bars"><p align="center">Code 39, rounded bars</p></td>
  </tr>
  <tr>
    <td><img src="docs/gallery/barcode-itf.png" alt="A green ITF barcode"><p align="center">ITF (2 of 5)</p></td>
    <td><img src="docs/gallery/barcode-pdf417.png" alt="A PDF417 stacked barcode"><p align="center">PDF417</p></td>
    <td><img src="docs/gallery/barcode-card.png" alt="A Code 128 barcode on a ticket card"><p align="center">Barcode on a card</p></td>
  </tr>
</table>

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/home-light.png" alt="The generator in the light theme"><p align="center">Home (light theme)</p></td>
    <td width="50%"><img src="docs/screenshots/content-types.png" alt="The content type picker with all types in groups"><p align="center">Every content type, searchable</p></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/art-icons.png" alt="The art browser showing popular and all icons"><p align="center">1,866 icons, searchable</p></td>
    <td><img src="docs/screenshots/art-brands.png" alt="The art browser showing brand logos"><p align="center">175 brand logos</p></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/art-emoji.png" alt="The art browser showing emoji"><p align="center">Emoji and symbols</p></td>
    <td><img src="docs/screenshots/art-picture.png" alt="The Art tab with picture settings"><p align="center">Picture settings</p></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/preview-fill.png" alt="The preview with the colorize mode and the scan result"><p align="center">Colorize, with the scan result</p></td>
    <td><img src="docs/screenshots/preview-card.png" alt="A sparkle card in the preview"><p align="center">A card, live</p></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/style.png" alt="The Style tab with the dot shape picker open"><p align="center">Style, with a compact picker</p></td>
    <td><img src="docs/screenshots/card-tab.png" alt="The Card tab with nine card looks and text settings"><p align="center">Card styles and settings</p></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/barcode.png" alt="Barcode mode with an EAN-13 barcode"><p align="center">Barcode mode</p></td>
    <td><img src="docs/screenshots/preview-barcode.png" alt="A barcode inside a ticket card"><p align="center">Barcode on a ticket card</p></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/content-wifi.png" alt="The content form for a Wi-Fi code"><p align="center">Wi-Fi code form</p></td>
    <td align="center"><img src="docs/screenshots/phone.png" alt="QR Quake on a phone" width="220"><p align="center">On a phone</p></td>
  </tr>
</table>

## Make your first code

It takes about 30 seconds.

1. **Content.** Open the **Content** tab. Press **Change** to pick what the code holds (it starts as plain text), then fill in the short form.
2. **Art.** Open the **Art** tab and press **Choose art**. Pick an icon, a brand logo, an emoji, some text, or drop in your own picture. Choose **Center** or **Colorize**.
3. **Style.** Open the **Style** tab to change the dots, the corners and the colors. Press **Surprise me** if you want ideas.
4. **Card.** Open the **Card** tab to frame the code. Pick a look and type a title.
5. **Check and download.** The preview says whether the code scans. If it does not, press **Auto-fix**. Then press **Download**, or **Copy** to paste it somewhere.

**Want a code like the one at the top?** Choose **Website link**, type `github.com/your-name`, open **Art > Choose art > Picture**, drop in your profile picture, keep **Center** and set the crop to **Circle**. Add a ring in a color you like.

## Content types

| Group | Types |
|---|---|
| <img src="docs/icons/type.svg" width="18"> **Basics** | Text, website link |
| <img src="docs/icons/contact.svg" width="18"> **Share and contact** | Email, phone call, SMS, WhatsApp chat, contact card (vCard), simple contact (MeCard), Wi-Fi network |
| <img src="docs/icons/map.svg" width="18"> **Places and events** | Map location, directions, GPS point, calendar event |
| <img src="docs/icons/globe.svg" width="18"> **Social profiles** | Instagram, Facebook, X, TikTok, YouTube, LinkedIn, Telegram, Snapchat, GitHub, Twitch, Reddit, Pinterest, Threads, Bluesky, Discord invite, Spotify, Signal, Patreon, Ko-fi, Buy Me a Coffee, app store link. Type a name, or paste the full link. |
| <img src="docs/icons/coins.svg" width="18"> **Payments** | PayPal, Venmo, Cash App, crypto (Bitcoin, Lightning, Ethereum, Litecoin, Bitcoin Cash, Dogecoin, Solana), UPI (India), bank transfer (SEPA, Europe) |
| <img src="docs/icons/key.svg" width="18"> **Tools** | Authenticator (2FA) setup, Zoom meeting, post to X, FaceTime |

Everything you type in one type is kept when you switch to another, so you never lose work.

## Two ways to add art

| | Mode | What it does | Best for |
|---|---|---|---|
| <img src="docs/icons/image.svg" width="18"> | **Center** | Clears a small area in the middle and puts your sign or picture there, with an optional ring and plate. The code around it keeps the data. The size is capped so the code stays within what error correction can repair. | Logos, brand marks, icons, emoji, profile pictures |
| <img src="docs/icons/palette.svg" width="18"> | **Colorize** | Dark modules take the color of the picture underneath, darkened until they have enough contrast. Optionally show a faded copy of the picture behind them. | Colorful, clean codes |

When you load a photo, QR Quake switches to **Colorize** and tunes it for scanning automatically. A logo with a transparent background stays in the **Center**.

## Cards

A card puts your code (or barcode) in a frame, like a profile card, a ticket or a poster. Pick a look and then change anything:

| Section | Controls |
|---|---|
| **Look** | None, Clean, Poster, Neon, Sticker, Ticket, Scanner, Pastel, Polaroid, Sparkle |
| **Text** | Title, subtitle and footer, six fonts, text color, title size |
| **Background** | Color or gradient with an angle |
| **Border** | Solid, double, dashed, dotted, gradient or neon, with width and colors |
| **Shape and depth** | Corner roundness, space inside, shadow, glow |
| **Decoration** | Scanner corners, sparkles, stars, dots or curved corners, a plate behind the code, ticket notches, a polaroid bottom |

The code always sits on a clear plate, and the scan test reads the whole card, not just the code.

## Barcodes

Switch to **Barcode** at the top. Type your text or number, choose a type, and style it. The type list tells you what each one is for.

| Kind | Types |
|---|---|
| **Linear** | Code 128, EAN-13, EAN-8, UPC-A, UPC-E, Code 39, Code 93, ITF (2 of 5), ITF-14, Codabar, GS1-128, MSI Plessey, Pharmacode, Code 11 |
| **Square and stacked** | Data Matrix, PDF417, Aztec |

- EAN and UPC codes add the **check digit** for you, and the page tells you what a scanner will read.
- If the text is not valid for a type, you get a plain explanation, for example "EAN-13 must be 12 or 13 digits".
- Barcodes can be colored, given a gradient, have rounded or thinner bars, a custom font, and live in a card.
- The scan test can read most of these types. For the few it cannot read (such as MSI and Pharmacode), the page says so.

## Every control

| Tab | What you can change |
|---|---|
| **Content** | The type of content and its form. For barcodes: the type, the text, an example. |
| **Art** | Art source (icons, brands, emoji, text, picture, none), placement, sign size, space around it, ring width and color, plate color, shape of the cutout, color boldness, faded picture behind the dots, sign color and round badge. For pictures: zoom, move left or right, move up or down, brightness, contrast, color, crop shape. |
| **Style (QR)** | Dot shape, dot size, roundness; corner frame and center shapes and colors; 16 color presets; dot, second and background colors; gradient type and angle; transparent background; quiet border; detail level; error correction. |
| **Style (barcode)** | Bar height, side margin, rounded ends, thinner bars, text on or off, text size, font and color, 16 color presets, bar colors, gradient, transparent background. |
| **Card** | Look, title, subtitle, footer, font, text color and size, background and gradient, border style, width and colors, corner roundness, padding, shadow, glow, ornament, plate, ticket notches, polaroid bottom. |
| **Preview** | Download as PNG, JPG, WebP or SVG at four sizes, copy, Auto-fix, Surprise me, Reset. |

## The scan guard

A pretty code is useless if it does not scan. After every change QR Quake renders the code at several small sizes (a few pixels per module, like a phone camera far from the screen) and reads it with independent decoders: [ZXing](https://github.com/zxing-js/library) (the engine behind many Android scanners) and [jsQR](https://github.com/cozmo/jsQR). Barcodes are read with ZXing. It also checks the contrast between the ink and the background.

| Result | Meaning |
|---|---|
| **Scans reliably** | Read correctly at every test size. |
| **Scans, but fragile** | Read at some sizes only. Use bigger dots, softer art, or press **Auto-fix**. |
| **May not scan** | The decoders could not read it, or the contrast is too low. Press **Auto-fix**. |
| **Cannot be tested here** | A barcode type the decoders cannot read. Try it with a scanner. |

**Auto-fix** tries safer settings one at a time (error correction, contrast, sign size, picture colors, a simpler dot shape, a plain plate in a card) and stops as soon as the code scans.

The guard is a strong signal, not a promise. Software decoders differ from phones. **Always scan the final result with a real phone before you print it.**

### Tips for a code that scans

- Keep the dots dark and the background light. Inverted codes (light dots on dark) fail on many scanners.
- Leave the quiet border at 3 modules or more.
- Keep **error correction** on High when you use art.
- For pictures, use **Colorize**, and add a faded picture behind the dots if you want more of the picture to show.
- Keep a center sign under a quarter of the width. QR Quake caps it for you.
- Print at least 2.5 cm (1 inch) wide for a short link, larger for long data.
- Short links make simpler codes, and simpler codes survive more art.

## FAQ

**Is it really free? Is there a catch?**
It is free and open source under the MIT license. There is no server, so there is nothing to pay for and nothing to limit.

**Do the codes expire?**
No. The codes are static: the link or text is written into the pattern itself. There is no redirect service in between. The flip side is that you cannot change where a code points after you print it, so make a new one if the link changes.

**Can I use the codes commercially?**
Yes. You own what you make. Check the license of any picture you put in, and remember that brand logos belong to their owners.

**Does it work offline?**
Once the page is loaded and run from your own copy, creating codes needs no connection. Everything runs in the browser.

**Where does my data go?**
Nowhere. Pictures and text stay in your tab. The production page blocks all network requests. Only your style choices (not your content) are saved in your browser.

**Why does it say "Scans, but fragile"?**
One of the test decoders read the code at some sizes but not all. Press **Auto-fix**, or use bigger dots, a smaller center sign, or softer picture colors.

**Why was the error correction lowered?**
Your text is very long. The code lowers it only when the data would not fit otherwise, and tells you.

**Why does my picture look dark in Colorize?**
Dots need contrast to scan, so QR Quake darkens the picture colors until they read. Raise **Color boldness** a little, add a **faded picture behind the dots**, or use a brighter picture.

**Which should I download for printing, PNG or SVG?**
SVG stays sharp at any size. Use PNG at 2048 or 4096 pixels if your printer cannot use SVG.

**Why can't it test my barcode type?**
The test decoders cannot read a few rare types (such as MSI, Pharmacode, Code 93 and UPC-E). The code is still correct. Try it with a scanner.

## Requirements

- **To use it**: any recent browser (Chrome, Edge, Firefox, Safari) on a phone, tablet or computer.
- **To run or build it**: [Node.js](https://nodejs.org) 20 or newer.
- **Internet**: only to install the dependencies. Creating codes needs no connection. The icon, brand and barcode libraries load on demand, from the same place as the page.
- **To take screenshots**: Chrome, Edge or Chromium installed on your computer.

## For developers

```bash
git clone https://github.com/MrLemonOff/qr-quake.git
cd qr-quake
npm ci
npm run dev           # start with hot reload (on Windows you can also double-click start.bat)
npm test              # unit and round-trip tests (real decoders, real pixels)
npm run build         # production build in dist/
npm run preview       # serve the production build
npm run smoke         # browser smoke test of the production build (needs Chrome, Edge or Chromium)
npm run assets        # rebuild docs/logo.png, docs/icons, docs/gallery and docs/hero.png
npm run screenshots   # retake docs/screenshots from the real app
npm run brands        # rebuild the curated brand list in src/core/brands-data.js
```

### Configuration

There is nothing to configure. The app has no environment variables and no server. These optional variables only affect the helper scripts:

| Variable | Default | Meaning |
|---|---|---|
| `CHROME_PATH` | auto-detected | Path to Chrome, Edge or Chromium for `npm run smoke` and `npm run screenshots` |

### Project structure

```text
qr-quake/
  index.html                          the single page
  start.bat                           Windows launcher
  src/main.js                         wires the interface to the engine
  src/styles.css                      design tokens and components (same theme as AlgoWorld)
  src/ui/                             binder, widgets, pickers, dialogs, store, icons
  src/core/                           the engine, with no dependency on the page
    matrix.js                           QR encoding (UTF-8) and module classification
    types.js, payloads.js               the 44 content types and their formats
    shapes.js                           dot, corner frame and corner center geometry
    scene.js                            turns a matrix + style + art into drawing items
    art.js                              prepare the picture (crop, adjust, fade, sample colors)
    barcode.js                          17 barcode types (bwip-js) and their scenes
    card.js                             card looks and the card builder
    text.js                             fonts and text fitting
    paint-canvas.js, paint-svg.js       draw a scene as PNG pixels or as SVG
    verify.js, autofix.js               the scan guard and the repair loop
    signs.js, samples.js                quick-pick signs and example pictures
    icon-library.js, brands-data.js     full icon set and brand list (loaded on demand)
    emoji-data.js                       emoji and symbols
    defaults.js, colors.js, env.js      validation, palettes, color math, canvas abstraction
  tests/                              Vitest tests, run in Node with a real raster canvas
  scripts/                            asset, brand, screenshot and smoke-test tools
  public/                             logo and the theme script
  docs/                               logo, hero, icons, gallery and screenshots for this README
  .github/                            CI, issue and pull request templates
```

### How it works

1. `types.js` turns the content form into the text to encode. `matrix.js` encodes it as UTF-8 and returns the module grid. It picks the smallest version that fits (or a larger one when art needs more room) and lowers the error correction level only if the data is too long.
2. `scene.js` builds a list of drawing items in module units: background, dots, corners, picture and sign. A center sign is sized so that the modules it hides stay under what the error correction level can repair.
3. `card.js` wraps the scene in a card (more drawing items). Barcodes go through the same pipeline from `barcode.js`.
4. `paint-canvas.js` draws the list on a canvas, and `paint-svg.js` writes the same list as SVG, so the PNG and the SVG always match.
5. `verify.js` paints the scene small and reads it with ZXing and jsQR.

The engine only talks to the page through `src/core/env.js`, so the same code runs in Node for the tests and the gallery script. The big libraries (ZXing, the full icon set, the brand list and the barcode tables) are separate chunks that load on demand.

### Tech stack

Vite and plain JavaScript (no framework), [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) to encode, [bwip-js](https://github.com/metafloor/bwip-js) for barcodes, [ZXing](https://github.com/zxing-js/library) and [jsQR](https://github.com/cozmo/jsQR) to verify, [Lucide](https://lucide.dev) and [Simple Icons](https://simpleicons.org) for icons and brand logos, Vitest and [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas) for tests, and puppeteer-core for screenshots. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for every project QR Quake builds on.

## Your data

- Nothing is uploaded. Pictures are read in your browser and never sent anywhere.
- The only thing saved is your style choices (colors, shapes, card look, last art), in your browser's local storage, so the page remembers them. Your links, passwords, pictures and typed text are never stored.
- The codes are static. They do not go through a redirect service, so they never expire and nobody can track the scans.

## Security

QR Quake is a static page. The production build ships a strict Content-Security-Policy that forbids all network connections and inline scripts, validates every color it writes into an SVG, escapes every text it writes into an SVG, and loads pictures as plain images (SVG pictures cannot run scripts). See [SECURITY.md](SECURITY.md) for the details and how to report a problem privately.

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) first.

## License

QR Quake is released under the [MIT License](LICENSE). Copyright (c) 2026 QR Quake contributors.

The third-party libraries and icons it uses keep their own licenses, listed in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED. Brand logos in the art library belong to their owners and are included only so you can link to your own pages.
