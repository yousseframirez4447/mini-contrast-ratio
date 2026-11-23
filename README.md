# mini-contrast-ratio

Compute WCAG 2.1 relative luminance and contrast ratios, and test colors against the AA and AAA thresholds.

```js
import {
  contrastRatio,
  meetsAA,
  meetsAAA,
  relativeLuminance,
  parseColor,
} from 'mini-contrast-ratio';

contrastRatio('#000000', '#ffffff'); // 21
relativeLuminance('#808080'); // ~0.2158
meetsAA('#767676', '#ffffff'); // true
meetsAAA('#767676', '#ffffff'); // false
meetsAA('#767676', '#ffffff', { large: true }); // true
parseColor('#abc'); // { r: 170, g: 187, b: 204 }
```

## Why this exists

The WCAG contrast formula is short but easy to get subtly wrong: people
linearize with the plain sRGB curve, forget the 0.05 offset, or compare the
wrong pair of luminances. This library implements the formula as written in the
WCAG 2.1 specification, nothing more, so the numbers agree with the W3C's own
calculator.

The trade-off is scope: there is no color parsing beyond `#rgb`, `#rrggbb`, and
`rgb(r, g, b)`, and no automatic detection of "large text". Both would require
guessing at context the library does not have, and a wrong guess is worse than
an explicit option.

## The awkward edge

Contrast ratios are ratios of *linearized* luminance, so two colors that look
far apart in sRGB space can be surprisingly close in ratio. `#767676` on white
passes AA at 4.54:1 while `#777777` fails at 4.48:1; the difference is one step
in the hex code. If you are testing a palette, test the actual rendered colors
rather than an average or a nearest named color.

## API

- `parseColor(input)` — returns `{r, g, b}` with channels 0..255. Throws
  `TypeError` for unrecognized syntax and `RangeError` for out-of-range `rgb()`
  channels.
- `relativeLuminance(color)` — WCAG 2.1 relative luminance in `[0, 1]`.
- `contrastRatio(a, b)` — ratio in `[1, 21]`; argument order does not matter.
- `meetsAA(a, b, options?)` — `true` when the ratio is at least 4.5, or 3 when
  `options.large` is `true`.
- `meetsAAA(a, b, options?)` — `true` when the ratio is at least 7, or 4.5 when
  `options.large` is `true`.

Every function that takes a color accepts either a string in the supported
syntax or an already-parsed `{r, g, b}` object.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

