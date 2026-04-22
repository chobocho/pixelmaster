import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import { upscaleNearest } from '../src/io/upscaleNearest.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };

test('upscaleNearest with scale 1 returns same dimensions and data', () => {
  const src = new PixelCanvas(16);
  src.setPixel(0, 0, RED);
  const up = upscaleNearest(src, 1);
  assert.equal(up.width, 16);
  assert.equal(up.height, 16);
  assert.equal(up.data[0], 255);
});

test('upscaleNearest with scale 2 doubles each pixel into a 2x2 block', () => {
  const src = new PixelCanvas(10);
  src.setPixel(0, 0, RED);
  src.setPixel(1, 0, BLUE);
  const up = upscaleNearest(src, 2);
  assert.equal(up.width, 20);
  assert.equal(up.height, 20);
  // (0,0) red occupies (0,0)-(1,1) in upscaled
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      const i = (y * 20 + x) * 4;
      assert.equal(up.data[i], 255);
      assert.equal(up.data[i + 1], 0);
      assert.equal(up.data[i + 2], 0);
      assert.equal(up.data[i + 3], 255);
    }
  }
  // (1,0) blue occupies (2,0)-(3,1)
  const j = (0 * 20 + 2) * 4;
  assert.equal(up.data[j + 2], 255);
});

test('upscaleNearest with scale 8 produces canvas 8x larger', () => {
  const src = new PixelCanvas(10);
  const up = upscaleNearest(src, 8);
  assert.equal(up.width, 80);
  assert.equal(up.height, 80);
  assert.equal(up.data.length, 80 * 80 * 4);
});

test('upscaleNearest rejects invalid scale', () => {
  const src = new PixelCanvas(10);
  assert.throws(() => upscaleNearest(src, 0), /positive integer/);
  assert.throws(() => upscaleNearest(src, -1), /positive integer/);
  assert.throws(() => upscaleNearest(src, 1.5), /positive integer/);
});
