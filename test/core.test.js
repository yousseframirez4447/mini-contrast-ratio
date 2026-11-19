import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseColor,
  relativeLuminance,
  contrastRatio,
  meetsAA,
  meetsAAA,
} from '../src/index.js';

const EPS = 1e-9;

function assertClose(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < EPS,
    `${message ?? 'values differ'}: got ${actual}, want ${expected}`,
  );
}

test('parseColor expands #rgb shorthand', () => {
  assert.deepEqual(parseColor('#abc'), { r: 0xaa, g: 0xbb, b: 0xcc });
});

test('parseColor reads #rrggbb', () => {
  assert.deepEqual(parseColor('#123456'), { r: 0x12, g: 0x34, b: 0x56 });
});

test('parseColor reads rgb() with surrounding whitespace', () => {
  assert.deepEqual(parseColor('rgb( 1, 2, 3 )'), { r: 1, g: 2, b: 3 });
});

test('parseColor rejects out-of-range rgb channels', () => {
  assert.throws(() => parseColor('rgb(256, 0, 0)'), RangeError);
});

test('parseColor rejects unknown syntax', () => {
  assert.throws(() => parseColor('rebeccapurple'), TypeError);
  assert.throws(() => parseColor('#12'), TypeError);
});

test('relativeLuminance of black is 0 and white is 1', () => {
  assertClose(relativeLuminance('#000000'), 0, 'black');
  assertClose(relativeLuminance('#ffffff'), 1, 'white');
});

test('relativeLuminance accepts a parsed object', () => {
  assertClose(relativeLuminance({ r: 255, g: 255, b: 255 }), 1, 'white object');
});

test('contrastRatio of black on white is 21', () => {
  assertClose(contrastRatio('#000000', '#ffffff'), 21, 'black/white');
});

test('contrastRatio is symmetric in its arguments', () => {
  assertClose(
    contrastRatio('#ffffff', '#000000'),
    contrastRatio('#000000', '#ffffff'),
    'symmetry',
  );
});

test('contrastRatio of a color with itself is 1', () => {
  assertClose(contrastRatio('#808080', '#808080'), 1, 'identity');
});

test('meetsAA uses 4.5 for normal text and 3 for large text', () => {
  // #767676 on white is the canonical "just passes AA" grey (~4.54:1).
  assert.equal(meetsAA('#767676', '#ffffff'), true);
  assert.equal(meetsAA('#777777', '#ffffff'), false);
  assert.equal(meetsAA('#949494', '#ffffff', { large: true }), true);
  assert.equal(meetsAA('#959595', '#ffffff', { large: true }), false);
});

test('meetsAAA uses 7 for normal text and 4.5 for large text', () => {
  // #595959 on white is the canonical "just passes AAA" grey (~7.00:1).
  assert.equal(meetsAAA('#595959', '#ffffff'), true);
  assert.equal(meetsAAA('#5a5a5a', '#ffffff'), false);
  assert.equal(meetsAAA('#767676', '#ffffff', { large: true }), true);
  assert.equal(meetsAAA('#777777', '#ffffff', { large: true }), false);
});
