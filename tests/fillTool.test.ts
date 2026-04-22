import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FillTool } from '../src/tools/FillTool.js';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import type { RGBA } from '../src/color/Color.js';
import type { ToolContext } from '../src/tools/Tool.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };
const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

function makeCtx(canvas: PixelCanvas): ToolContext {
  return { canvas, foregroundColor: RED, backgroundColor: BLUE };
}

test('FillTool left click fills with foreground color', () => {
  const c = new PixelCanvas(16);
  new FillTool().onPointerDown(makeCtx(c), { x: 3, y: 3, button: 'left' });
  assert.deepEqual(c.getPixel(0, 0), RED);
  assert.deepEqual(c.getPixel(9, 9), RED);
});

test('FillTool right click fills with background color', () => {
  const c = new PixelCanvas(16);
  new FillTool().onPointerDown(makeCtx(c), { x: 3, y: 3, button: 'right' });
  assert.deepEqual(c.getPixel(0, 0), BLUE);
});

test('FillTool ignores middle button', () => {
  const c = new PixelCanvas(16);
  new FillTool().onPointerDown(makeCtx(c), { x: 3, y: 3, button: 'middle' });
  assert.deepEqual(c.getPixel(0, 0), TRANSPARENT);
});

test('FillTool pointer move/up are no-ops', () => {
  const c = new PixelCanvas(16);
  const tool = new FillTool();
  tool.onPointerMove(makeCtx(c), { x: 3, y: 3, button: 'left' });
  tool.onPointerUp(makeCtx(c), { x: 3, y: 3, button: 'left' });
  assert.deepEqual(c.getPixel(3, 3), TRANSPARENT);
});
