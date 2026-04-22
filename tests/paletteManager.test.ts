import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PaletteManager } from '../src/color/PaletteManager.js';
import { MAX_PALETTE_COLORS } from '../src/editor/CanvasSize.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };

test('PaletteManager default capacity equals MAX_PALETTE_COLORS', () => {
  const p = new PaletteManager();
  assert.equal(p.capacity, MAX_PALETTE_COLORS);
  assert.equal(p.count, 0);
});

test('PaletteManager add grows count; get returns a copy', () => {
  const p = new PaletteManager(4);
  p.add(RED);
  p.add(BLUE);
  assert.equal(p.count, 2);
  assert.deepEqual(p.get(0), RED);
  assert.deepEqual(p.get(1), BLUE);

  const c = p.get(0);
  (c as { r: number }).r = 0; // mutate returned copy
  assert.deepEqual(p.get(0), RED);
});

test('PaletteManager add throws when at capacity', () => {
  const p = new PaletteManager(2);
  p.add(RED);
  p.add(BLUE);
  assert.throws(() => p.add(RED), /full/);
});

test('PaletteManager remove shifts subsequent entries', () => {
  const p = new PaletteManager();
  p.add(RED);
  p.add(BLUE);
  p.remove(0);
  assert.equal(p.count, 1);
  assert.deepEqual(p.get(0), BLUE);
});

test('PaletteManager replace overwrites at index', () => {
  const p = new PaletteManager();
  p.add(RED);
  p.replace(0, BLUE);
  assert.deepEqual(p.get(0), BLUE);
});

test('PaletteManager throws on out-of-range index', () => {
  const p = new PaletteManager();
  p.add(RED);
  assert.throws(() => p.get(1), RangeError);
  assert.throws(() => p.remove(-1), RangeError);
  assert.throws(() => p.replace(5, BLUE), RangeError);
});

test('PaletteManager toJSON / loadJSON round-trip', () => {
  const p = new PaletteManager();
  p.add(RED);
  p.add(BLUE);
  const data = p.toJSON();

  const q = new PaletteManager();
  q.loadJSON(data);
  assert.deepEqual(q.toJSON(), data);
});

test('PaletteManager loadJSON rejects oversized input', () => {
  const p = new PaletteManager(2);
  assert.throws(() => p.loadJSON([RED, BLUE, RED]), /capacity/);
});

test('PaletteManager loadJSON makes defensive copies', () => {
  const p = new PaletteManager();
  const src: RGBA[] = [{ r: 1, g: 2, b: 3, a: 4 }];
  p.loadJSON(src);
  (src[0] as { r: number }).r = 99;
  assert.equal(p.get(0).r, 1);
});
