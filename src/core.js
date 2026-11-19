// WCAG 2.1 relative luminance and contrast ratio helpers.
//
// Design choices worth noting:
//
// 1. WCAG defines luminance on *linearized* sRGB channels. The 0.03928
//    threshold is the standard's own approximation; we keep it exactly so our
//    numbers match the W3C formula rather than a "more correct" sRGB curve.
// 2. The contrast ratio formula adds 0.05 to both luminances. That constant is
//    what keeps the ratio finite for black-on-black (it yields 1, not NaN/0).
// 3. `parseColor` accepts a deliberately small grammar: #rgb, #rrggbb, and
//    `rgb(r, g, b)` with integers 0-255. Anything else throws a TypeError.
//    Guessing at named colors or percentages would make failures silent.

const HEX_SHORT = /^#([0-9a-fA-F]{3})$/;
const HEX_LONG = /^#([0-9a-fA-F]{6})$/;
const RGB_FUNC = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

/**
 * Parse a color string into an {r, g, b} object with channels in 0..255.
 *
 * We restrict the grammar on purpose: a typo like `#12` or `rgb(300,0,0)`
 * should throw rather than silently clamp to something plausible.
 *
 * @param {string} input
 * @returns {{r: number, g: number, b: number}}
 */
export function parseColor(input) {
  if (typeof input !== 'string') {
    throw new TypeError('color must be a string');
  }
  const value = input.trim();

  let match = HEX_SHORT.exec(value);
  if (match) {
    const [r, g, b] = match[1].split('').map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }

  match = HEX_LONG.exec(value);
  if (match) {
    const hex = match[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  match = RGB_FUNC.exec(value);
  if (match) {
    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    if (r > 255 || g > 255 || b > 255) {
      throw new RangeError('rgb() channels must be between 0 and 255');
    }
    return { r, g, b };
  }

  throw new TypeError(`unrecognized color: ${input}`);
}

/**
 * Linearize a single sRGB channel given as an integer 0..255.
 *
 * The 0.03928 breakpoint is WCAG's own; see the module comment.
 *
 * @param {number} channel
 * @returns {number}
 */
function linearize(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * WCAG 2.1 relative luminance of a color.
 *
 * @param {string | {r: number, g: number, b: number}} color
 * @returns {number} luminance in [0, 1]
 */
export function relativeLuminance(color) {
  const { r, g, b } = typeof color === 'string' ? parseColor(color) : color;
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Contrast ratio between two colors, in the range 1..21.
 *
 * Order does not matter: the formula always puts the lighter color on top.
 *
 * @param {string | {r: number, g: number, b: number}} a
 * @param {string | {r: number, g: number, b: number}} b
 * @returns {number}
 */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA threshold check.
 *
 * `large` text is 18pt (24px) regular or 14pt (18.66px) bold; AA requires 3:1
 * for large text and 4.5:1 otherwise. We expose the flag rather than guessing
 * the font size, because we cannot see the rendered page.
 *
 * @param {string | object} a
 * @param {string | object} b
 * @param {{large?: boolean}} [options]
 * @returns {boolean}
 */
export function meetsAA(a, b, options = {}) {
  const threshold = options.large ? 3 : 4.5;
  return contrastRatio(a, b) >= threshold;
}

/**
 * WCAG AAA threshold check.
 *
 * AAA requires 4.5:1 for large text and 7:1 otherwise.
 *
 * @param {string | object} a
 * @param {string | object} b
 * @param {{large?: boolean}} [options]
 * @returns {boolean}
 */
export function meetsAAA(a, b, options = {}) {
  const threshold = options.large ? 4.5 : 7;
  return contrastRatio(a, b) >= threshold;
}
