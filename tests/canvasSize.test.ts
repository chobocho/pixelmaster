import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANVAS_SIZES,
  DEFAULT_ZOOM,
  isCanvasSize,
  MAX_UNDO_STEPS,
  MAX_PALETTE_COLORS,
  MAX_ZOOM,
  MIN_ZOOM,
  TARGET_FPS,
} from '../src/editor/CanvasSize.js';

test('CANVAS_SIZES lists the 6 supported sizes in ascending order', () => {
  assert.deepEqual([...CANVAS_SIZES], [10, 16, 20, 25, 32, 64]);
});

test('DEFAULT_ZOOM provides a zoom within [MIN_ZOOM, MAX_ZOOM] for each size', () => {
  for (const size of CANVAS_SIZES) {
    const zoom = DEFAULT_ZOOM[size];
    assert.ok(
      Number.isInteger(zoom) && zoom >= MIN_ZOOM && zoom <= MAX_ZOOM,
      `zoom ${zoom} for size ${size} out of range`,
    );
  }
});

test('isCanvasSize accepts supported sizes and rejects others', () => {
  for (const size of CANVAS_SIZES) {
    assert.equal(isCanvasSize(size), true);
  }
  assert.equal(isCanvasSize(8), false);
  assert.equal(isCanvasSize(128), false);
  assert.equal(isCanvasSize(0), false);
  assert.equal(isCanvasSize(-16), false);
  assert.equal(isCanvasSize(16.5), false);
});

test('editor constants have sensible values', () => {
  assert.equal(MAX_UNDO_STEPS, 50);
  assert.equal(MAX_PALETTE_COLORS, 32);
  assert.equal(TARGET_FPS, 60);
  assert.ok(MIN_ZOOM >= 1);
  assert.ok(MIN_ZOOM < MAX_ZOOM);
});
