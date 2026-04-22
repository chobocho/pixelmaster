import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MoveTool } from '../src/tools/MoveTool.js';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import { Selection } from '../src/editor/Selection.js';
import type { ToolContext } from '../src/tools/Tool.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

function makeCtx(canvas: PixelCanvas, selection: Selection): ToolContext {
  return {
    canvas,
    foregroundColor: RED,
    backgroundColor: RED,
    selection,
  };
}

test('MoveTool translates selected pixels and clears source', () => {
  const c = new PixelCanvas(16);
  c.setPixel(3, 3, RED);
  c.setPixel(4, 3, RED);
  const sel = new Selection();
  sel.setRect({ x: 3, y: 3, width: 2, height: 1 });

  const tool = new MoveTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: 3, y: 3, button: 'left' });
  tool.onPointerUp(ctx, { x: 8, y: 6, button: 'left' });

  // Source cleared
  assert.deepEqual(c.getPixel(3, 3), TRANSPARENT);
  assert.deepEqual(c.getPixel(4, 3), TRANSPARENT);
  // Destination painted at offset (5, 3)
  assert.deepEqual(c.getPixel(8, 6), RED);
  assert.deepEqual(c.getPixel(9, 6), RED);
  // Selection moved
  assert.deepEqual(sel.rect, { x: 8, y: 6, width: 2, height: 1 });
});

test('MoveTool without active selection is a no-op', () => {
  const c = new PixelCanvas(16);
  c.setPixel(3, 3, RED);
  const sel = new Selection();
  const tool = new MoveTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: 3, y: 3, button: 'left' });
  tool.onPointerUp(ctx, { x: 5, y: 5, button: 'left' });
  assert.deepEqual(c.getPixel(3, 3), RED);
  assert.equal(sel.rect, null);
});

test('MoveTool preview restores pixels across multiple moves', () => {
  const c = new PixelCanvas(16);
  c.setPixel(2, 2, RED);
  const sel = new Selection();
  sel.setRect({ x: 2, y: 2, width: 1, height: 1 });
  const tool = new MoveTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: 2, y: 2, button: 'left' });
  tool.onPointerMove(ctx, { x: 5, y: 2, button: 'left' });
  // During drag, source cleared, dest painted
  assert.deepEqual(c.getPixel(2, 2), TRANSPARENT);
  assert.deepEqual(c.getPixel(5, 2), RED);

  tool.onPointerMove(ctx, { x: 7, y: 4, button: 'left' });
  // Previous preview (at 5,2) should be gone
  assert.deepEqual(c.getPixel(5, 2), TRANSPARENT);
  assert.deepEqual(c.getPixel(7, 4), RED);
});

test('MoveTool ignores non-left button', () => {
  const c = new PixelCanvas(16);
  c.setPixel(3, 3, RED);
  const sel = new Selection();
  sel.setRect({ x: 3, y: 3, width: 1, height: 1 });
  const tool = new MoveTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: 3, y: 3, button: 'right' });
  tool.onPointerUp(ctx, { x: 8, y: 8, button: 'right' });
  assert.deepEqual(c.getPixel(3, 3), RED);
  assert.deepEqual(sel.rect, { x: 3, y: 3, width: 1, height: 1 });
});

test('MoveTool with no net displacement leaves pixels unchanged', () => {
  const c = new PixelCanvas(16);
  c.setPixel(5, 5, RED);
  const sel = new Selection();
  sel.setRect({ x: 5, y: 5, width: 1, height: 1 });
  const tool = new MoveTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: 5, y: 5, button: 'left' });
  tool.onPointerUp(ctx, { x: 5, y: 5, button: 'left' });
  assert.deepEqual(c.getPixel(5, 5), RED);
  assert.deepEqual(sel.rect, { x: 5, y: 5, width: 1, height: 1 });
});

test('MoveTool clips destination pixels that go past canvas edge', () => {
  const c = new PixelCanvas(16);
  c.setPixel(0, 0, RED);
  c.setPixel(1, 0, RED);
  const sel = new Selection();
  sel.setRect({ x: 0, y: 0, width: 2, height: 1 });
  const tool = new MoveTool();
  const ctx = makeCtx(c, sel);
  // move so that x=1 lands at x=16 (out of bounds) and x=0 lands at x=15
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'left' });
  tool.onPointerUp(ctx, { x: 15, y: 0, button: 'left' });
  assert.deepEqual(c.getPixel(15, 0), RED);
  assert.deepEqual(c.getPixel(0, 0), TRANSPARENT);
  // the second pixel had no valid destination; it is simply dropped
});
