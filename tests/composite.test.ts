import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import { compositeOver } from '../src/editor/composite.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };

function approxEqual(a: RGBA, b: RGBA, tolerance: number = 2): void {
  assert.ok(Math.abs(a.r - b.r) <= tolerance, `r: ${a.r} vs ${b.r}`);
  assert.ok(Math.abs(a.g - b.g) <= tolerance, `g: ${a.g} vs ${b.g}`);
  assert.ok(Math.abs(a.b - b.b) <= tolerance, `b: ${a.b} vs ${b.b}`);
  assert.ok(Math.abs(a.a - b.a) <= tolerance, `a: ${a.a} vs ${b.a}`);
}

test('compositeOver opaque source over transparent dest yields opaque source', () => {
  const src = new PixelCanvas(10);
  const dst = new PixelCanvas(10);
  src.fill(RED);
  compositeOver(src, dst, 1);
  approxEqual(dst.getPixel(0, 0), RED);
});

test('compositeOver transparent source does nothing', () => {
  const src = new PixelCanvas(10);
  const dst = new PixelCanvas(10);
  dst.fill(RED);
  compositeOver(src, dst, 1);
  approxEqual(dst.getPixel(0, 0), RED);
});

test('compositeOver 50% alpha source over solid dest blends evenly', () => {
  const src = new PixelCanvas(10);
  const dst = new PixelCanvas(10);
  src.fill({ r: 255, g: 0, b: 0, a: 128 });
  dst.fill(BLUE);
  compositeOver(src, dst, 1);
  approxEqual(dst.getPixel(0, 0), { r: 128, g: 0, b: 127, a: 255 }, 2);
});

test('compositeOver opacity 0 is a no-op', () => {
  const src = new PixelCanvas(10);
  const dst = new PixelCanvas(10);
  src.fill(RED);
  dst.fill(BLUE);
  compositeOver(src, dst, 0);
  approxEqual(dst.getPixel(0, 0), BLUE);
});

test('compositeOver opacity 0.5 halves source contribution', () => {
  const src = new PixelCanvas(10);
  const dst = new PixelCanvas(10);
  src.fill(RED);
  compositeOver(src, dst, 0.5);
  approxEqual(dst.getPixel(0, 0), { r: 255, g: 0, b: 0, a: 128 }, 2);
});

test('compositeOver rejects mismatched sizes', () => {
  const src = new PixelCanvas(16);
  const dst = new PixelCanvas(32);
  assert.throws(() => compositeOver(src, dst, 1), /size mismatch/);
});
