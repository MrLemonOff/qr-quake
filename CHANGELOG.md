# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com), and the project uses [Semantic Versioning](https://semver.org).

## [1.1.0] - 2026-10-05

### Added

- **Cards.** Nine looks (Clean, Poster, Neon, Sticker, Ticket, Scanner, Pastel, Polaroid, Sparkle) with title, subtitle, footer, fonts, gradients, borders, glow, shadow and ornaments. The scan test reads the whole card.
- **Barcodes.** 14 linear types and 3 square or stacked types (Data Matrix, PDF417, Aztec) with live validation, check digits, colors, gradients, rounded bars and text.
- **44 content types**, up from 5: SMS, WhatsApp, simple contact (MeCard), map location, directions, GPS, calendar event, 21 social profiles, PayPal, Venmo, Cash App, crypto (including Lightning), UPI, SEPA bank transfer, authenticator setup, Zoom, post to X and FaceTime. A searchable type picker.
- **Huge art library.** 1,866 icons, 175 brand logos, 820 emoji and symbols, text signs, a recent row, and a searchable art browser.
- **More control.** Dot size and roundness, separate corner frame and center colors, detail level, ring and plate around a center sign, picture zoom, pan, brightness, contrast and color, JPG and WebP export.
- A second scan decoder (ZXing) and a contrast check in the scan guard.
- Automatic tuning when a picture is loaded.
- Windows launcher `start.bat`.

### Changed

- Pictures work through **Colorize** (dots take the picture's colors, with an optional faded copy behind them) or as a **Center** sign.
- A simpler interface: four tabs (Content, Art, Style, Card), compact pickers and accordions, and a live preview. Pictures, icons and types open in searchable dialogs instead of long lists.
- The scan guard is stricter and more honest: ZXing must read nearly every test size, and weak contrast can no longer pass.

## [1.0.0] - 2026-10-05

First release.

### Added

- Art QR codes with three placements: a sign or picture in the **center**, or dots **filled** with the picture's colors.
- 30 built-in signs, 18 brand logos, text signs (letters, digits, emoji) and your own pictures (drop, choose or paste).
- Six dot shapes, four corner frames, four corner centers, eight color presets, linear and radial gradients, transparent background.
- The **scan guard**: a live decoder test at several sizes, with **Auto-fix** and **Surprise me** that only returns codes that pass.
- Content types: link or text, Wi-Fi, contact card, email and phone number.
- Export to PNG (512 to 4096 pixels), SVG and the clipboard.
- Light and dark themes, in the AlgoWorld design.
- A strict Content-Security-Policy that blocks all network access in the production build.
- Tests that decode real pixels, a browser smoke test, a GitHub Actions workflow for CI.
