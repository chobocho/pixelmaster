import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centeredIntegerFit, mapToPixel } from '../src/ui/pointerMapping.js';

test('mapToPixel maps origin to grid (0,0)', () => {
  const r = { x: 0, y: 0, width: 160, height: 160 };
  assert.deepEqual(mapToPixel(0, 0, r, 16, 16), { x: 0, y: 0 });
});

test('mapToPixel maps bottom-right-1 to last grid cell', () => {
  const r = { x: 0, y: 0, width: 160, height: 160 };
  assert.deepEqual(mapToPixel(159, 159, r, 16, 16), { x: 15, y: 15 });
});

test('mapToPixel returns null outside region', () => {
  const r = { x: 10, y: 10, width: 100, height: 100 };
  assert.equal(mapToPixel(9, 50, r, 10, 10), null);
  assert.equal(mapToPixel(50, 9, r, 10, 10), null);
  assert.equal(mapToPixel(110, 50, r, 10, 10), null);
  assert.equal(mapToPixel(50, 110, r, 10, 10), null);
});

test('mapToPixel offsets by region origin', () => {
  const r = { x: 50, y: 50, width: 100, height: 100 };
  assert.deepEqual(mapToPixel(50, 50, r, 10, 10), { x: 0, y: 0 });
  assert.deepEqual(mapToPixel(149, 149, r, 10, 10), { x: 9, y: 9 });
});

test('centeredIntegerFit picks largest integer scale that fits', () => {
  const r = centeredIntegerFit(500, 400, 32, 32);
  // min(500/32=15.625, 400/32=12.5) → floor = 12
  assert.equal(r.width, 32 * 12);
  assert.equal(r.height, 32 * 12);
  assert.equal(r.x, Math.floor((500 - 32 * 12) / 2));
  assert.equal(r.y, Math.floor((400 - 32 * 12) / 2));
});

test('centeredIntegerFit clamps to minimum scale 1', () => {
  const r = centeredIntegerFit(20, 20, 64, 64);
  assert.equal(r.width, 64);
  assert.equal(r.height, 64);
});
