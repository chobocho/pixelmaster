import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import { floodFill } from '../src/tools/floodFill.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };
const GREEN: RGBA = { r: 0, g: 255, b: 0, a: 255 };
const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

test('floodFill fills an entire empty canvas', () => {
  const c = new PixelCanvas(10);
  floodFill(c, 5, 5, RED);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      assert.deepEqual(c.getPixel(x, y), RED);
    }
  }
});

test('floodFill respects 4-connected boundaries', () => {
  const c = new PixelCanvas(10);
  // Draw a vertical barrier at x=5
  for (let y = 0; y < 10; y++) c.setPixel(5, y, BLUE);
  floodFill(c, 0, 0, RED);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 5; x++) {
      assert.deepEqual(c.getPixel(x, y), RED);
    }
    assert.deepEqual(c.getPixel(5, y), BLUE);
    for (let x = 6; x < 10; x++) {
      assert.deepEqual(c.getPixel(x, y), TRANSPARENT);
    }
  }
});

test('floodFill does not cross diagonal-only contact (4-connected)', () => {
  const c = new PixelCanvas(10);
  // Barrier pattern at (1,0)(0,1) — diagonal only contact with (1,1)
  c.setPixel(1, 0, BLUE);
  c.setPixel(0, 1, BLUE);
  floodFill(c, 0, 0, RED);
  // Only (0,0) reachable
  assert.deepEqual(c.getPixel(0, 0), RED);
  assert.deepEqual(c.getPixel(1, 1), TRANSPARENT);
  assert.deepEqual(c.getPixel(2, 0), TRANSPARENT);
});

test('floodFill is a no-op when fill color equals target color', () => {
  const c = new PixelCanvas(10);
  c.fill(RED);
  floodFill(c, 3, 3, RED);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      assert.deepEqual(c.getPixel(x, y), RED);
    }
  }
});

test('floodFill ignores out-of-bounds start', () => {
  const c = new PixelCanvas(10);
  floodFill(c, -1, 0, RED);
  floodFill(c, 0, -1, RED);
  floodFill(c, 10, 0, RED);
  floodFill(c, 0, 10, RED);
  assert.deepEqual(c.getPixel(0, 0), TRANSPARENT);
});

test('floodFill handles 64x64 canvas without stack overflow', () => {
  const c = new PixelCanvas(64);
  floodFill(c, 0, 0, GREEN);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      assert.deepEqual(c.getPixel(x, y), GREEN);
    }
  }
});

test('floodFill only affects the connected region', () => {
  const c = new PixelCanvas(10);
  c.setPixel(0, 0, RED);
  c.setPixel(9, 9, RED); // isolated pixel
  floodFill(c, 0, 0, BLUE);
  assert.deepEqual(c.getPixel(0, 0), BLUE);
  // Isolated RED at (9,9) untouched
  assert.deepEqual(c.getPixel(9, 9), RED);
  // Neighbors of (0,0) were transparent, so also untouched
  assert.deepEqual(c.getPixel(1, 0), TRANSPARENT);
});
