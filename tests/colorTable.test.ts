import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndexedImage, paletteSizeBits } from '../src/io/gif/colorTable.js';

test('buildIndexedImage assigns index 0 to fully-transparent pixels', () => {
  const rgba = new Uint8ClampedArray([0, 0, 0, 0]);
  const img = buildIndexedImage(1, 1, rgba);
  assert.equal(img.indices[0], 0);
  assert.equal(img.transparentIndex, 0);
});

test('buildIndexedImage rounds up palette to power of two', () => {
  const rgba = new Uint8ClampedArray([
    255, 0, 0, 255,
    0, 255, 0, 255,
    0, 0, 255, 255,
  ]);
  const img = buildIndexedImage(3, 1, rgba);
  // Entries: slot 0 reserved + 3 colors = 4 → already power of 2
  assert.equal(img.paletteSize, 4);
  assert.equal(img.palette.length, 4 * 3);
});

test('buildIndexedImage deduplicates identical colors', () => {
  const rgba = new Uint8ClampedArray([
    100, 100, 100, 255,
    100, 100, 100, 255,
    100, 100, 100, 255,
    100, 100, 100, 255,
  ]);
  const img = buildIndexedImage(2, 2, rgba);
  // 1 unique color + slot 0 = 2 → power of 2
  assert.equal(img.paletteSize, 2);
  for (const idx of img.indices) assert.equal(idx, 1);
});

test('paletteSizeBits returns correct GIF size-bits field', () => {
  assert.equal(paletteSizeBits(2), 1);
  assert.equal(paletteSizeBits(4), 1);
  assert.equal(paletteSizeBits(8), 2);
  assert.equal(paletteSizeBits(256), 7);
});

test('buildIndexedImage throws for >255 opaque colors', () => {
  // 260 unique RGB opaque colors in a 260x1 image
  const rgba = new Uint8ClampedArray(260 * 4);
  for (let i = 0; i < 260; i++) {
    rgba[i * 4] = i % 256;
    rgba[i * 4 + 1] = (i >> 8) & 255;
    rgba[i * 4 + 2] = (i >> 4) & 255;
    rgba[i * 4 + 3] = 255;
  }
  assert.throws(() => buildIndexedImage(260, 1, rgba), /255/);
});
