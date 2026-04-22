import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import { CANVAS_SIZES } from '../src/editor/CanvasSize.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };
const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

test('PixelCanvas initializes with transparent pixels at every supported size', () => {
  for (const size of CANVAS_SIZES) {
    const pc = new PixelCanvas(size);
    assert.equal(pc.width, size);
    assert.equal(pc.height, size);
    assert.equal(pc.size, size);
    assert.equal(pc.data.length, size * size * 4);
    assert.deepEqual(pc.getPixel(0, 0), TRANSPARENT);
    assert.deepEqual(pc.getPixel(size - 1, size - 1), TRANSPARENT);
  }
});

test('setPixel / getPixel round-trip', () => {
  const pc = new PixelCanvas(16);
  pc.setPixel(3, 5, RED);
  assert.deepEqual(pc.getPixel(3, 5), RED);
  assert.deepEqual(pc.getPixel(4, 5), TRANSPARENT);
});

test('setPixel and getPixel reject out-of-bounds coordinates', () => {
  const pc = new PixelCanvas(16);
  assert.throws(() => pc.setPixel(-1, 0, RED), RangeError);
  assert.throws(() => pc.setPixel(0, -1, RED), RangeError);
  assert.throws(() => pc.setPixel(16, 0, RED), RangeError);
  assert.throws(() => pc.setPixel(0, 16, RED), RangeError);
  assert.throws(() => pc.getPixel(16, 16), RangeError);
});

test('fill fills entire canvas with the given color', () => {
  const pc = new PixelCanvas(16);
  pc.fill(RED);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      assert.deepEqual(pc.getPixel(x, y), RED);
    }
  }
});

test('clear sets all pixels to fully transparent', () => {
  const pc = new PixelCanvas(16);
  pc.fill(RED);
  pc.clear();
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      assert.deepEqual(pc.getPixel(x, y), TRANSPARENT);
    }
  }
});

test('clone produces an independent copy', () => {
  const pc = new PixelCanvas(16);
  pc.setPixel(2, 2, RED);
  const copy = pc.clone();
  assert.deepEqual(copy.getPixel(2, 2), RED);

  copy.setPixel(2, 2, BLUE);
  assert.deepEqual(pc.getPixel(2, 2), RED);
  assert.deepEqual(copy.getPixel(2, 2), BLUE);
});

test('isInBounds reflects canvas edges', () => {
  const pc = new PixelCanvas(16);
  assert.equal(pc.isInBounds(0, 0), true);
  assert.equal(pc.isInBounds(15, 15), true);
  assert.equal(pc.isInBounds(-1, 0), false);
  assert.equal(pc.isInBounds(16, 0), false);
  assert.equal(pc.isInBounds(0, 16), false);
});

test('resize preserve mode keeps old pixels in top-left when enlarging', () => {
  const pc = new PixelCanvas(16);
  pc.setPixel(0, 0, RED);
  pc.setPixel(15, 15, BLUE);
  pc.resize(32, 'preserve');

  assert.equal(pc.size, 32);
  assert.equal(pc.width, 32);
  assert.equal(pc.data.length, 32 * 32 * 4);
  assert.deepEqual(pc.getPixel(0, 0), RED);
  assert.deepEqual(pc.getPixel(15, 15), BLUE);
  assert.deepEqual(pc.getPixel(16, 16), TRANSPARENT);
  assert.deepEqual(pc.getPixel(31, 31), TRANSPARENT);
});

test('resize preserve mode crops bottom-right when shrinking', () => {
  const pc = new PixelCanvas(32);
  pc.setPixel(5, 5, RED);
  pc.setPixel(20, 20, BLUE);
  pc.resize(16, 'preserve');

  assert.equal(pc.size, 16);
  assert.equal(pc.data.length, 16 * 16 * 4);
  assert.deepEqual(pc.getPixel(5, 5), RED);
  assert.throws(() => pc.getPixel(20, 20), RangeError);
});

test('resize clear mode drops all pixels', () => {
  const pc = new PixelCanvas(16);
  pc.setPixel(1, 1, RED);
  pc.resize(32, 'clear');

  assert.equal(pc.size, 32);
  assert.deepEqual(pc.getPixel(1, 1), TRANSPARENT);
});

test('resize to same size is a no-op and keeps the buffer reference', () => {
  const pc = new PixelCanvas(16);
  pc.setPixel(1, 1, RED);
  const dataRef = pc.data;
  pc.resize(16, 'preserve');

  assert.strictEqual(pc.data, dataRef);
  assert.deepEqual(pc.getPixel(1, 1), RED);
});

test('Uint8ClampedArray clamps component values outside 0..255', () => {
  const pc = new PixelCanvas(16);
  pc.setPixel(0, 0, { r: 300, g: -10, b: 128, a: 1024 });
  const p = pc.getPixel(0, 0);
  assert.equal(p.r, 255);
  assert.equal(p.g, 0);
  assert.equal(p.b, 128);
  assert.equal(p.a, 255);
});
