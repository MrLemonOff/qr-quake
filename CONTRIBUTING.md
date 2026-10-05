# Contributing to QR Quake

Thank you for helping. QR Quake is a small project with one rule that matters most: **a code that looks good must still scan.** Every change is judged against that.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first.

## Ways to help

- **Report a bug.** Open an issue with the steps, the browser and, if a code does not scan, the text you encoded and a screenshot of your settings.
- **Suggest a feature.** Open an issue first, so we can agree on the idea before you spend time on it.
- **Improve the docs.** Typos, clearer wording and better examples are always welcome.
- **Write code.** Pick an issue, or fix something you noticed.

## Set up

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/MrLemonOff/qr-quake.git
cd qr-quake
npm ci
npm run dev
```

## Before you open a pull request

```bash
npm test          # all tests must pass
npm run build     # the production build must succeed
npm run smoke     # optional: browser test of the production build (needs Chrome, Edge or Chromium)
```

If you changed anything visible, retake the screenshots with `npm run screenshots` and the gallery with `npm run assets`, and check them by eye.

## Project layout

The engine lives in `src/core` and does not touch the page. The interface lives in `src/main.js` and `src/ui`. See the project structure in the [README](README.md#project-structure).

Keep that split: anything that decides what a QR code looks like belongs in `src/core` and must be testable in Node.

## Guidelines

### Scanning comes first

- A new dot shape, corner style or art mode must decode with the test decoder. Add it to the lists in `src/core/defaults.js` and extend the tests in `tests/render.test.js` so it is covered.
- If a style is fragile, tune it until the tests pass, or make Auto-fix able to move away from it (see `src/core/autofix.js`).
- Do not weaken a test to make a change pass. If a test fails, the code may have stopped scanning.

### Privacy

- No network requests, analytics, fonts from a CDN or remote images. The production build forbids them, and `npm run smoke` checks it.
- Never store the user's content, Wi-Fi password or pictures. Only style choices go to local storage.

### Code style

- Plain modern JavaScript (ES modules), two-space indent, single quotes, semicolons.
- Match the style of the surrounding code. Keep functions small and name things for what they do.
- Comments explain *why*, not *what*.
- No new runtime dependency without a good reason. Say why in the pull request, and add it to `THIRD-PARTY-NOTICES.md`.
- Use icons from Lucide, not emoji, in the interface and in the documentation.

### Design

The look follows the AlgoWorld theme: use the CSS variables in `src/styles.css` instead of hard-coded colors, and check both the light and the dark theme, at phone width too.

## Adding things

**A dot shape.** Add its name to `SHAPES` in `src/core/defaults.js`, its path in `modulePath` in `src/core/shapes.js`, and a label in `NAMES` in `src/main.js`.

**A quick-pick sign.** Import the icon in `src/core/signs.js` and add it to `SIGNS` (Lucide) or `BRANDS` (Simple Icons). The tests run every sign. The full icon library already contains every Lucide icon. To add brands to the library, add their slugs to `scripts/make-brands.mjs` and run `npm run brands`.

**A color preset.** Add it to `PALETTES` in `src/core/defaults.js`. Both colors must have a contrast ratio of at least 4.5 against the background. The tests check every preset.

**A content type.** Add a builder to `src/core/payloads.js` and an entry to `TYPES` in `src/core/types.js` (its fields, group, icon and `build` function). The form and the type picker are generated from that entry. Add tests in `tests/payloads.test.js`. If it uses a new Lucide icon, add the icon to the registry in `src/ui/icons.js`.

**A barcode type.** Add it to `BARCODES` in `src/core/barcode.js` with its bwip-js `bcid`, an example, and the ZXing format used to test it (leave `zx` empty if ZXing cannot read it). The tests encode and read every example.

**A card look.** Add it to `CARD_PRESETS` in `src/core/card.js`. The tests wrap a QR code in every preset and require that it reads.

## Commit messages and pull requests

- Write the commit message in the imperative: "Add diamond eye", not "Added diamond eye".
- Keep one idea per pull request. Small pull requests are reviewed faster.
- Describe what changed and why, and include a screenshot for visible changes.
- Link the issue it closes.

## License

By contributing you agree that your work is released under the [MIT License](LICENSE).
