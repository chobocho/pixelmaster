import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EraserTool } from '../src/tools/EraserTool.js';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import type { ToolContext } from '../src/tools/Tool.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

function makeCtx(canvas: PixelCanvas): ToolContext {
  return { canvas, foregroundColor: RED, backgroundColor: RED };
}

test('EraserTool clears pixel to fully transparent', () => {
  const canvas = new PixelCanvas(16);
  canvas.fill(RED);
  const tool = new EraserTool();
  tool.onPointerDown(makeCtx(canvas), { x: 2, y: 2, button: 'left' });
  assert.deepEqual(canvas.getPixel(2, 2), TRANSPARENT);
});

test('EraserTool drag erases along Bresenham line', () => {
  const canvas = new PixelCanvas(16);
  canvas.fill(RED);
  const tool = new EraserTool();
  const ctx = makeCtx(canvas);
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'left' });
  tool.onPointerMove(ctx, { x: 4, y: 0, button: 'left' });
  for (let i = 0; i <= 4; i++) {
    assert.deepEqual(canvas.getPixel(i, 0), TRANSPARENT);
  }
  assert.deepEqual(canvas.getPixel(5, 0), RED);
});

test('EraserTool ignores non-left buttons', () => {
  const canvas = new PixelCanvas(16);
  canvas.fill(RED);
  const tool = new EraserTool();
  tool.onPointerDown(makeCtx(canvas), { x: 0, y: 0, button: 'right' });
  assert.deepEqual(canvas.getPixel(0, 0), RED);
});
