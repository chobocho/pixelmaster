import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import { LineTool } from '../src/tools/LineTool.js';
import { RectTool } from '../src/tools/RectTool.js';
import { EllipseTool } from '../src/tools/EllipseTool.js';
import type { ToolContext } from '../src/tools/Tool.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };
const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

function makeCtx(canvas: PixelCanvas): ToolContext {
  return { canvas, foregroundColor: RED, backgroundColor: BLUE };
}

test('LineTool preview snapshots and commits on up', () => {
  const c = new PixelCanvas(16);
  const tool = new LineTool();
  const ctx = makeCtx(c);
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'left' });
  tool.onPointerMove(ctx, { x: 5, y: 5, button: 'left' });
  tool.onPointerUp(ctx, { x: 5, y: 5, button: 'left' });
  for (let i = 0; i <= 5; i++) {
    assert.deepEqual(c.getPixel(i, i), RED);
  }
});

test('LineTool move after up does not draw (state reset)', () => {
  const c = new PixelCanvas(16);
  const tool = new LineTool();
  const ctx = makeCtx(c);
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'left' });
  tool.onPointerUp(ctx, { x: 3, y: 3, button: 'left' });
  c.clear();
  tool.onPointerMove(ctx, { x: 5, y: 5, button: 'left' });
  assert.deepEqual(c.getPixel(5, 5), TRANSPARENT);
});

test('LineTool preview restores snapshot between moves', () => {
  const c = new PixelCanvas(16);
  const tool = new LineTool();
  const ctx = makeCtx(c);
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'left' });
  tool.onPointerMove(ctx, { x: 10, y: 0, button: 'left' }); // horizontal line preview
  tool.onPointerMove(ctx, { x: 0, y: 10, button: 'left' }); // changes to vertical
  // After second move: horizontal preview should be gone, vertical in place
  assert.deepEqual(c.getPixel(5, 0), TRANSPARENT);
  assert.deepEqual(c.getPixel(0, 5), RED);
});

test('RectTool draws border only', () => {
  const c = new PixelCanvas(16);
  const tool = new RectTool();
  const ctx = makeCtx(c);
  tool.onPointerDown(ctx, { x: 2, y: 2, button: 'left' });
  tool.onPointerUp(ctx, { x: 6, y: 6, button: 'left' });
  // Corners + edges red
  assert.deepEqual(c.getPixel(2, 2), RED);
  assert.deepEqual(c.getPixel(6, 6), RED);
  assert.deepEqual(c.getPixel(2, 6), RED);
  assert.deepEqual(c.getPixel(6, 2), RED);
  // Interior transparent
  assert.deepEqual(c.getPixel(4, 4), TRANSPARENT);
});

test('RectTool right button uses background color', () => {
  const c = new PixelCanvas(16);
  const tool = new RectTool();
  const ctx = makeCtx(c);
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'right' });
  tool.onPointerUp(ctx, { x: 3, y: 3, button: 'right' });
  assert.deepEqual(c.getPixel(0, 0), BLUE);
  assert.deepEqual(c.getPixel(3, 3), BLUE);
});

test('EllipseTool draws outline within bbox', () => {
  const c = new PixelCanvas(16);
  const tool = new EllipseTool();
  const ctx = makeCtx(c);
  tool.onPointerDown(ctx, { x: 2, y: 2, button: 'left' });
  tool.onPointerUp(ctx, { x: 12, y: 12, button: 'left' });

  // Center is transparent (outline only)
  assert.deepEqual(c.getPixel(7, 7), TRANSPARENT);
  // Extreme points painted
  assert.deepEqual(c.getPixel(2, 7), RED);
  assert.deepEqual(c.getPixel(12, 7), RED);
  assert.deepEqual(c.getPixel(7, 2), RED);
  assert.deepEqual(c.getPixel(7, 12), RED);
});

test('ShapeToolBase does not commit when pointerDown is out of bounds', () => {
  const c = new PixelCanvas(16);
  const tool = new LineTool();
  const ctx = makeCtx(c);
  tool.onPointerDown(ctx, { x: -1, y: 0, button: 'left' });
  tool.onPointerMove(ctx, { x: 5, y: 5, button: 'left' });
  tool.onPointerUp(ctx, { x: 5, y: 5, button: 'left' });
  assert.deepEqual(c.getPixel(5, 5), TRANSPARENT);
});

test('ShapeToolBase ignores middle button', () => {
  const c = new PixelCanvas(16);
  const tool = new LineTool();
  const ctx = makeCtx(c);
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'middle' });
  tool.onPointerUp(ctx, { x: 5, y: 5, button: 'middle' });
  assert.deepEqual(c.getPixel(0, 0), TRANSPARENT);
});
