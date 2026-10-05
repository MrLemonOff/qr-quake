import { getEnv } from './env.js';

/** Font stacks offered for card text and barcode labels. */
export const FONTS = {
  sans: '"Segoe UI Variable Display","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif',
  serif: '"Iowan Old Style","Palatino Linotype",Georgia,"Times New Roman",serif',
  mono: '"Cascadia Mono",Consolas,"SF Mono",Menlo,"Courier New",monospace',
  rounded: '"Arial Rounded MT Bold","Nunito","Varela Round","Segoe UI",system-ui,sans-serif',
  display: 'Impact,"Arial Black","Segoe UI Black","Helvetica Neue",sans-serif',
  script: '"Segoe Script","Bradley Hand","Snell Roundhand","Comic Sans MS",cursive',
};
export const FONT_NAMES = Object.keys(FONTS);

let probe = null;

/** Width of a line of text at a given size, measured with the real font. */
export function measure(text, fontKey, weight, size) {
  probe ||= getEnv().createCanvas(16, 16).getContext('2d');
  probe.font = `${weight} ${size}px ${FONTS[fontKey] || FONTS.sans}`;
  return probe.measureText(text).width;
}

/** The largest size, up to `size`, at which the text fits in maxWidth. */
export function fitSize(text, fontKey, weight, size, maxWidth) {
  const w = measure(text, fontKey, weight, size);
  return w > maxWidth && w > 0 ? size * (maxWidth / w) : size;
}
