import qrcode from 'qrcode-generator';

// The library defaults to Latin-1; we want real UTF-8 so any language or emoji works.
qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s));

const LEVELS = ['L', 'M', 'Q', 'H'];

export class QRTooLongError extends Error {
  constructor() {
    super('That is too much data for one QR code.');
    this.name = 'QRTooLongError';
  }
}

const NUMERIC = /^[0-9]+$/;
const ALPHANUMERIC = /^[0-9A-Z $%*+\-./:]+$/;

/**
 * Encode text into a QR matrix. If the data does not fit at the requested
 * error correction level, lower levels are tried and `ec` reports what was used.
 */
export function buildMatrix(text, requested = 'H', minVersion = 1) {
  const start = Math.max(0, LEVELS.indexOf(requested));
  const mode = NUMERIC.test(text) ? 'Numeric' : ALPHANUMERIC.test(text) ? 'Alphanumeric' : 'Byte';
  for (let i = start; i >= 0; i -= 1) {
    try {
      const qr = makeQr(text, mode, minVersion, LEVELS[i]);
      const n = qr.getModuleCount();
      const dark = new Uint8Array(n * n);
      for (let r = 0; r < n; r += 1) {
        for (let c = 0; c < n; c += 1) dark[r * n + c] = qr.isDark(r, c) ? 1 : 0;
      }
      const version = (n - 17) / 4;
      return { n, version, ec: LEVELS[i], requested, dark, kind: moduleKinds(version) };
    } catch (err) {
      if (i === 0) throw new QRTooLongError();
    }
  }
  throw new QRTooLongError();
}

/** Build at the minimum version if the data fits, otherwise at the smallest version that does. */
function makeQr(text, mode, minVersion, level) {
  const attempt = (type) => {
    const qr = qrcode(type, level);
    qr.addData(text, mode);
    qr.make();
    return qr;
  };
  if (minVersion > 1) {
    try {
      return attempt(minVersion);
    } catch (err) {
      // fall through to automatic sizing
    }
  }
  return attempt(0);
}

/** Centres of the alignment patterns for a QR version, per ISO/IEC 18004. */
export function alignmentCenters(version) {
  if (version === 1) return [];
  const size = 4 * version + 17;
  const count = Math.floor(version / 7) + 2;
  const step = size === 145 ? 26 : Math.ceil((size - 13) / (2 * count - 2)) * 2;
  const pos = [size - 7];
  for (let i = 1; i < count - 1; i += 1) pos[i] = pos[i - 1] - step;
  pos.push(6);
  pos.reverse();
  const last = pos.length - 1;
  const centers = [];
  for (const r of pos) {
    for (const c of pos) {
      const overlapsFinder = (r === 6 && c === 6) || (r === 6 && c === pos[last]) || (r === pos[last] && c === 6);
      if (!overlapsFinder) centers.push([r, c]);
    }
  }
  return centers;
}

export const KIND = { DATA: 0, FINDER: 1, INFO: 2, TIMING: 3, ALIGN: 4 };

/** Classify every module: data, finder zone (8x8 incl. separator), format/version info, timing, alignment. */
export function moduleKinds(version) {
  const n = 4 * version + 17;
  const kind = new Uint8Array(n * n);
  const set = (r, c, k) => {
    if (r >= 0 && r < n && c >= 0 && c < n) kind[r * n + c] = k;
  };
  for (let i = 0; i < n; i += 1) {
    set(6, i, KIND.TIMING);
    set(i, 6, KIND.TIMING);
  }
  for (const [r, c] of alignmentCenters(version)) {
    for (let dr = -2; dr <= 2; dr += 1) for (let dc = -2; dc <= 2; dc += 1) set(r + dr, c + dc, KIND.ALIGN);
  }
  for (let i = 0; i <= 8; i += 1) {
    set(8, i, KIND.INFO);
    set(i, 8, KIND.INFO);
  }
  for (let i = 0; i < 8; i += 1) {
    set(8, n - 1 - i, KIND.INFO);
    set(n - 1 - i, 8, KIND.INFO);
  }
  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        set(i, n - 11 + j, KIND.INFO);
        set(n - 11 + j, i, KIND.INFO);
      }
    }
  }
  for (const [r0, c0] of [[0, 0], [0, n - 8], [n - 8, 0]]) {
    for (let dr = 0; dr < 8; dr += 1) for (let dc = 0; dc < 8; dc += 1) set(r0 + dr, c0 + dc, KIND.FINDER);
  }
  return kind;
}
