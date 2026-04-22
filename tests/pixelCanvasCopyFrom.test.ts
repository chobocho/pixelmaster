import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };

test('copyFrom replicates source canvas data', () => {
  const a = new PixelCanvas(16);
  a.setPixel(3, 3, RED);
  const b = new PixelCanvas(16);
  b.copyFrom(a);
  assert.deepEqual(b.getPixel(3, 3), RED);
});

test('copyFrom does not share the underlying buffer', () => {
  const a = new PixelCanvas(16);
  const b = new PixelCanvas(16);
  b.copyFrom(a);
  b.setPixel(1, 1, RED);
  assert.deepEqual(a.getPixel(1, 1), { r: 0, g: 0, b: 0, a: 0 });
});

test('copyFrom throws when sizes differ', () => {
  const a = new PixelCanvas(16);
  const b = new PixelCanvas(32);
  assert.throws(() => b.copyFrom(a), /Size mismatch/);
});
