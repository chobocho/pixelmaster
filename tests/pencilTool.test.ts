import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PencilTool } from '../src/tools/PencilTool.js';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import type { ToolContext } from '../src/tools/Tool.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };
const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

function makeCtx(canvas: PixelCanvas): ToolContext {
  return { canvas, foregroundColor: RED, backgroundColor: BLUE };
}

test('PencilTool left button paints foreground color', () => {
  const canvas = new PixelCanvas(16);
  const tool = new PencilTool();
  tool.onPointerDown(makeCtx(canvas), { x: 3, y: 4, button: 'left' });
  assert.deepEqual(canvas.getPixel(3, 4), RED);
});

test('PencilTool right button paints background color', () => {
  const canvas = new PixelCanvas(16);
  const tool = new PencilTool();
  tool.onPointerDown(makeCtx(canvas), { x: 5, y: 6, button: 'right' });
  assert.deepEqual(canvas.getPixel(5, 6), BLUE);
});

test('PencilTool middle button is ignored', () => {
  const canvas = new PixelCanvas(16);
  const tool = new PencilTool();
  tool.onPointerDown(makeCtx(canvas), { x: 0, y: 0, button: 'middle' });
  assert.deepEqual(canvas.getPixel(0, 0), TRANSPARENT);
});

test('PencilTool drag fills gaps using Bresenham', () => {
  const canvas = new PixelCanvas(16);
  const tool = new PencilTool();
  const ctx = makeCtx(canvas);
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'left' });
  tool.onPointerMove(ctx, { x: 5, y: 5, button: 'left' });
  for (let i = 0; i <= 5; i++) {
    assert.deepEqual(canvas.getPixel(i, i), RED, `pixel (${i},${i}) should be red`);
  }
});

test('PencilTool move without down is a no-op', () => {
  const canvas = new PixelCanvas(16);
  const tool = new PencilTool();
  tool.onPointerMove(makeCtx(canvas), { x: 2, y: 2, button: 'left' });
  assert.deepEqual(canvas.getPixel(2, 2), TRANSPARENT);
});

test('PencilTool ignores out-of-bounds coordinates silently', () => {
  const canvas = new PixelCanvas(16);
  const tool = new PencilTool();
  const ctx = makeCtx(canvas);
  // Start in-bounds, move out-of-bounds
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'left' });
  tool.onPointerMove(ctx, { x: 20, y: 20, button: 'left' });
  // Should not throw, in-bounds pixels along the line should still be painted
  assert.deepEqual(canvas.getPixel(0, 0), RED);
  assert.deepEqual(canvas.getPixel(9, 9), RED);
});

test('PencilTool up stops drawing', () => {
  const canvas = new PixelCanvas(16);
  const tool = new PencilTool();
  const ctx = makeCtx(canvas);
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'left' });
  tool.onPointerUp(ctx, { x: 0, y: 0, button: 'left' });
  tool.onPointerMove(ctx, { x: 5, y: 5, button: 'left' });
  assert.deepEqual(canvas.getPixel(5, 5), TRANSPARENT);
});
